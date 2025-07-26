/**
 * GitHub API client for Study Lenses Server
 * Handles all interactions with GitHub's REST API
 */

import fetch from 'node-fetch';

export class GitHubClient {
  constructor() {
    this.baseURL = 'https://api.github.com';
    this.headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Study-Lenses-Server/1.0.0'
    };
    
    // Add GitHub token if available (for higher rate limits)
    if (process.env.GITHUB_TOKEN) {
      this.headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }
  }

  /**
   * Fetch a user's public repositories
   * @param {string} username - GitHub username
   * @returns {Promise<Array>} Array of repository objects
   * @throws {Error} When user not found or API error
   */
  async getUserRepos(username) {
    try {
      console.log(`Fetching repositories for user: ${username}`);
      
      const response = await fetch(`${this.baseURL}/users/${username}/repos?per_page=100&sort=updated`, {
        headers: this.headers
      });

      if (response.status === 404) {
        throw new Error(`User '${username}' not found`);
      }
      
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const repos = await response.json();
      
      console.log(`Found ${repos.length} repositories for ${username}`);
      
      // Return simplified repository objects with only needed fields
      return repos.map(repo => ({
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        size: repo.size,
        fork: repo.fork,
        archived: repo.archived,
        updated_at: repo.updated_at,
        clone_url: repo.clone_url,
        html_url: repo.html_url,
        default_branch: repo.default_branch
      }));

    } catch (error) {
      console.error(`Error fetching repos for ${username}:`, error);
      
      // Re-throw with status for better error handling
      const wrappedError = new Error(error.message);
      if (error.message.includes('not found')) {
        wrappedError.status = 404;
      } else if (error.message.includes('rate limit')) {
        wrappedError.status = 429;
      } else {
        wrappedError.status = 500;
      }
      
      throw wrappedError;
    }
  }

  /**
   * Validate that a repository exists and is accessible
   * @param {string} username - Repository owner
   * @param {string} repoName - Repository name
   * @returns {Promise<Object>} Repository metadata
   * @throws {Error} When repository not found or inaccessible
   */
  async validateRepo(username, repoName) {
    try {
      console.log(`Validating repository: ${username}/${repoName}`);
      
      const response = await fetch(`${this.baseURL}/repos/${username}/${repoName}`, {
        headers: this.headers
      });

      if (response.status === 404) {
        throw new Error(`Repository '${username}/${repoName}' not found or is private`);
      }
      
      if (response.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const repo = await response.json();
      
      console.log(`Repository ${username}/${repoName} validated successfully`);
      
      return {
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        language: repo.language,
        size: repo.size,
        clone_url: repo.clone_url,
        default_branch: repo.default_branch,
        updated_at: repo.updated_at
      };

    } catch (error) {
      console.error(`Error validating repo ${username}/${repoName}:`, error);
      
      // Re-throw with status for better error handling
      const wrappedError = new Error(error.message);
      if (error.message.includes('not found')) {
        wrappedError.status = 404;
      } else if (error.message.includes('rate limit')) {
        wrappedError.status = 429;
      } else {
        wrappedError.status = 500;
      }
      
      throw wrappedError;
    }
  }

  /**
   * Get rate limit information
   * @returns {Promise<Object>} Rate limit status
   */
  async getRateLimit() {
    try {
      const response = await fetch(`${this.baseURL}/rate_limit`, {
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error fetching rate limit:', error);
      throw error;
    }
  }
}