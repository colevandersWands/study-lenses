/**
 * Repository Processor for Study Lenses Server
 * Handles cloning GitHub repositories and processing them with crawlDirectory
 */

import { simpleGit } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import crawlDirectory from the current project
const CRAWL_DIRECTORY_PATH = path.join(__dirname, '..', 'create-vir-dir.mjs');

export class RepoProcessor {
  constructor(cacheManager) {
    this.cacheManager = cacheManager;
    this.tempDir = path.join(os.tmpdir(), 'study-lenses-repos');
    
    // Ensure temp directory exists
    this.initializeTempDir();
  }

  /**
   * Initialize temporary directory for cloning repositories
   */
  async initializeTempDir() {
    try {
      await fs.ensureDir(this.tempDir);
      console.log(`Temp directory initialized: ${this.tempDir}`);
    } catch (error) {
      console.error('Failed to initialize temp directory:', error);
    }
  }

  /**
   * Process a GitHub repository - clone, crawl, and return JSON structure
   * @param {string} username - Repository owner
   * @param {string} repoName - Repository name
   * @returns {Promise<Object>} Virtual directory JSON structure
   */
  async processRepo(username, repoName) {
    const cacheKey = `${username}/${repoName}`;
    
    // Wrap the entire processing with a timeout
    return Promise.race([
      this._processRepoInternal(username, repoName, cacheKey),
      this._createTimeoutPromise(30000) // 30 second timeout
    ]);
  }

  /**
   * Internal method for processing repository with timeout protection
   */
  async _processRepoInternal(username, repoName, cacheKey) {
    // Check cache first
    console.log(`Checking cache for: ${cacheKey}`);
    const cachedData = await this.cacheManager.get(cacheKey);
    
    if (cachedData) {
      console.log(`Returning cached data for: ${cacheKey}`);
      return cachedData;
    }

    console.log(`Processing repository: ${cacheKey}`);
    
    const repoPath = path.join(this.tempDir, `${username}_${repoName}_${Date.now()}`);
    
    try {
      // Clone the repository
      await this.cloneRepository(username, repoName, repoPath);
      
      // Process with crawlDirectory
      const virtualDirectory = await this.crawlRepository(repoPath);
      
      // Add metadata
      const processedData = {
        ...virtualDirectory,
        metadata: {
          source: `https://github.com/${username}/${repoName}`,
          processed_at: new Date().toISOString(),
          processor_version: '1.0.0'
        }
      };
      
      // Cache the result
      await this.cacheManager.set(cacheKey, processedData);
      
      console.log(`Successfully processed repository: ${cacheKey}`);
      return processedData;
      
    } catch (error) {
      console.error(`Error processing repository ${cacheKey}:`, error);
      throw error;
      
    } finally {
      // Always clean up the temporary clone
      await this.cleanupRepo(repoPath);
    }
  }

  /**
   * Clone a GitHub repository to a temporary location
   * @param {string} username - Repository owner
   * @param {string} repoName - Repository name
   * @param {string} targetPath - Local path to clone to
   */
  async cloneRepository(username, repoName, targetPath) {
    try {
      console.log(`Cloning ${username}/${repoName} to ${targetPath}`);
      
      const git = simpleGit();
      const cloneUrl = `https://github.com/${username}/${repoName}.git`;
      
      // Clone with depth 1 for faster cloning (we only need latest state)
      await git.clone(cloneUrl, targetPath, ['--depth', '1']);
      
      console.log(`Successfully cloned ${username}/${repoName}`);
      
    } catch (error) {
      console.error(`Failed to clone ${username}/${repoName}:`, error);
      
      // Provide more helpful error messages
      if (error.message.includes('not found')) {
        throw new Error(`Repository ${username}/${repoName} not found or is private`);
      } else if (error.message.includes('Permission denied')) {
        throw new Error(`Access denied to repository ${username}/${repoName}`);
      } else {
        throw new Error(`Failed to clone repository: ${error.message}`);
      }
    }
  }

  /**
   * Process cloned repository with crawlDirectory function
   * @param {string} repoPath - Path to cloned repository
   * @returns {Promise<Object>} Virtual directory structure
   */
  async crawlRepository(repoPath) {
    try {
      console.log(`Crawling directory: ${repoPath}`);
      
      // Import the crawlDirectory function dynamically
      const { crawlDirectory } = await import(CRAWL_DIRECTORY_PATH);
      
      // Check if the repository is too large (simple size check)
      const stats = await this.getDirectoryStats(repoPath);
      
      if (stats.totalFiles > 1000) {
        throw new Error('Repository too large (>1000 files). Please choose a smaller repository.');
      }
      
      if (stats.totalSize > 50 * 1024 * 1024) { // 50MB
        throw new Error('Repository too large (>50MB). Please choose a smaller repository.');
      }
      
      // Process the repository
      const virtualDirectory = await crawlDirectory(repoPath);
      
      console.log(`Successfully crawled repository with ${stats.totalFiles} files`);
      return virtualDirectory;
      
    } catch (error) {
      console.error(`Failed to crawl repository at ${repoPath}:`, error);
      
      if (error.message.includes('too large')) {
        throw error; // Re-throw size limit errors as-is
      } else {
        throw new Error(`Failed to process repository files: ${error.message}`);
      }
    }
  }

  /**
   * Get basic statistics about a directory
   * @param {string} dirPath - Directory path
   * @returns {Promise<Object>} Directory statistics
   */
  /**
   * Create a timeout promise that rejects after specified milliseconds
   * @param {number} ms - Timeout in milliseconds
   * @returns {Promise} Promise that rejects with timeout error
   */
  _createTimeoutPromise(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Repository processing timed out after ${ms/1000} seconds. Repository may be too large.`));
      }, ms);
    });
  }

  async getDirectoryStats(dirPath) {
    const stats = {
      totalFiles: 0,
      totalDirectories: 0,
      totalSize: 0
    };

    const MAX_FILES = 1000;
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    const EXCLUDED_DIRS = new Set(['.git', 'node_modules', '.next', 'build', 'dist', 'coverage', '.nyc_output']);

    const walk = async (currentPath) => {
      // Early termination if limits exceeded
      if (stats.totalFiles >= MAX_FILES || stats.totalSize >= MAX_SIZE) {
        return;
      }

      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
          // Check limits before processing each entry
          if (stats.totalFiles >= MAX_FILES || stats.totalSize >= MAX_SIZE) {
            break;
          }

          const fullPath = path.join(currentPath, entry.name);
          
          // Skip excluded directories
          if (entry.name.startsWith('.') || EXCLUDED_DIRS.has(entry.name)) {
            continue;
          }
          
          if (entry.isDirectory()) {
            stats.totalDirectories++;
            await walk(fullPath);
          } else {
            stats.totalFiles++;
            try {
              const fileStat = await fs.stat(fullPath);
              stats.totalSize += fileStat.size;
            } catch (error) {
              // Skip files we can't read
              console.warn(`Could not stat file: ${fullPath}`);
            }
          }
        }
      } catch (error) {
        console.warn(`Could not read directory: ${currentPath}`);
      }
    };

    await walk(dirPath);
    console.log(`Directory stats: ${stats.totalFiles} files, ${stats.totalDirectories} directories, ${Math.round(stats.totalSize/1024/1024)}MB`);
    return stats;
  }

  /**
   * Clean up temporary repository clone
   * @param {string} repoPath - Path to repository to clean up
   */
  async cleanupRepo(repoPath) {
    try {
      if (await fs.pathExists(repoPath)) {
        await fs.remove(repoPath);
        console.log(`Cleaned up temporary repository: ${repoPath}`);
      }
    } catch (error) {
      console.error(`Failed to cleanup repository at ${repoPath}:`, error);
      // Don't throw - cleanup errors shouldn't fail the main operation
    }
  }

  /**
   * Clean up all temporary repositories (maintenance function)
   */
  async cleanupAllTemp() {
    try {
      if (await fs.pathExists(this.tempDir)) {
        const entries = await fs.readdir(this.tempDir);
        let cleaned = 0;
        
        for (const entry of entries) {
          const fullPath = path.join(this.tempDir, entry);
          await fs.remove(fullPath);
          cleaned++;
        }
        
        console.log(`Cleaned up ${cleaned} temporary repositories`);
        return cleaned;
      }
      
      return 0;
      
    } catch (error) {
      console.error('Error during temp cleanup:', error);
      return 0;
    }
  }

  /**
   * Get processor statistics
   * @returns {Promise<Object>} Processing statistics
   */
  async getStats() {
    try {
      const cacheStats = await this.cacheManager.getStats();
      const tempExists = await fs.pathExists(this.tempDir);
      let tempFiles = 0;
      
      if (tempExists) {
        const tempEntries = await fs.readdir(this.tempDir);
        tempFiles = tempEntries.length;
      }
      
      return {
        cache: cacheStats,
        temp: {
          directory: this.tempDir,
          activeClones: tempFiles
        },
        limits: {
          maxFiles: 1000,
          maxSize: '50MB'
        }
      };
      
    } catch (error) {
      console.error('Error getting processor stats:', error);
      return {
        error: error.message
      };
    }
  }
}