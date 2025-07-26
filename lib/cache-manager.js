/**
 * Cache Manager for Study Lenses Server
 * Handles file-based caching with TTL expiration
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CacheManager {
  constructor(cacheDir = path.join(__dirname, '..', 'cache'), ttl = 3600000) { // 1 hour TTL
    this.cacheDir = cacheDir;
    this.ttl = ttl; // Time to live in milliseconds
    
    // Ensure cache directory exists
    this.initializeCacheDir();
  }

  /**
   * Initialize the cache directory
   */
  async initializeCacheDir() {
    try {
      await fs.ensureDir(this.cacheDir);
      console.log(`Cache directory initialized: ${this.cacheDir}`);
    } catch (error) {
      console.error('Failed to initialize cache directory:', error);
    }
  }

  /**
   * Generate cache key path
   * @param {string} key - Cache key
   * @returns {string} Full file path for cache entry
   */
  getCachePath(key) {
    // Sanitize key to be filesystem-safe
    const safeKey = key.replace(/[/\\:*?"<>|]/g, '_');
    return path.join(this.cacheDir, `${safeKey}.json`);
  }

  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached data or null if not found/expired
   */
  async get(key) {
    try {
      const cachePath = this.getCachePath(key);
      
      // Check if cache file exists
      const exists = await fs.pathExists(cachePath);
      if (!exists) {
        return null;
      }

      // Check if cache entry is expired
      const stats = await fs.stat(cachePath);
      const age = Date.now() - stats.mtime.getTime();
      
      if (age > this.ttl) {
        console.log(`Cache expired for key: ${key} (age: ${Math.round(age / 1000)}s)`);
        // Clean up expired cache file
        await this.delete(key);
        return null;
      }

      // Read and parse cache data
      const cacheData = await fs.readJson(cachePath);
      console.log(`Cache hit for key: ${key}`);
      
      return cacheData.data;

    } catch (error) {
      console.error(`Error reading cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Store data in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @returns {Promise<boolean>} Success status
   */
  async set(key, data) {
    try {
      const cachePath = this.getCachePath(key);
      
      // Ensure cache directory exists
      await fs.ensureDir(path.dirname(cachePath));

      // Create cache entry with metadata
      const cacheEntry = {
        key,
        data,
        timestamp: new Date().toISOString(),
        ttl: this.ttl
      };

      await fs.writeJson(cachePath, cacheEntry, { spaces: 2 });
      console.log(`Cached data for key: ${key}`);
      
      return true;

    } catch (error) {
      console.error(`Error caching data for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    try {
      const cachePath = this.getCachePath(key);
      await fs.remove(cachePath);
      console.log(`Deleted cache for key: ${key}`);
      return true;
    } catch (error) {
      console.error(`Error deleting cache for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if cache entry exists and is valid
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if valid cache entry exists
   */
  async has(key) {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Clear all cache entries
   * @returns {Promise<boolean>} Success status
   */
  async clear() {
    try {
      await fs.emptyDir(this.cacheDir);
      console.log('Cache cleared');
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getStats() {
    try {
      const files = await fs.readdir(this.cacheDir);
      const stats = {
        totalEntries: files.length,
        cacheDir: this.cacheDir,
        ttl: this.ttl,
        entries: []
      };

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.cacheDir, file);
          const fileStats = await fs.stat(filePath);
          const age = Date.now() - fileStats.mtime.getTime();
          
          stats.entries.push({
            key: file.replace('.json', ''),
            size: fileStats.size,
            age: Math.round(age / 1000), // Age in seconds
            expired: age > this.ttl
          });
        }
      }

      return stats;

    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        cacheDir: this.cacheDir,
        ttl: this.ttl,
        entries: [],
        error: error.message
      };
    }
  }

  /**
   * Clean expired cache entries
   * @returns {Promise<number>} Number of entries cleaned
   */
  async cleanup() {
    try {
      const files = await fs.readdir(this.cacheDir);
      let cleaned = 0;

      for (const file of files) {
        if (file.endsWith('.json')) {
          const key = file.replace('.json', '');
          const data = await this.get(key); // This will auto-delete if expired
          
          if (data === null) {
            cleaned++;
          }
        }
      }

      console.log(`Cache cleanup completed. Removed ${cleaned} expired entries.`);
      return cleaned;

    } catch (error) {
      console.error('Error during cache cleanup:', error);
      return 0;
    }
  }
}