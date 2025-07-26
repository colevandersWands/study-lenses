/**
 * Study Lenses Server
 * A Node.js server that integrates GitHub repositories with Study Lenses
 * 
 * Routes:
 * - GET / : Landing page describing Study Lenses
 * - GET /:username : List user's GitHub repositories
 * - GET /:username/:repository : Serve Study Lenses with repository content
 * - GET /api/:username/:repository/content.json : API endpoint for repository JSON data
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Import our custom modules
import { GitHubClient } from './lib/github-client.js';
import { RepoProcessor } from './lib/repo-processor.js';
import { CacheManager } from './lib/cache-manager.js';

// Load environment variables
dotenv.config();

// ES modules __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const port = process.env.PORT || 4567;

// Initialize services
const githubClient = new GitHubClient();
const cacheManager = new CacheManager();
const repoProcessor = new RepoProcessor(cacheManager);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.github.com"]
    },
  },
}));

// Performance middleware
app.use(compression());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased limit for testing
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  }
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve Study Lenses static files directly from the dist directory
const studyLensesPath = path.join(__dirname, 'dist');
// app.use('/', express.static(studyLensesPath));

// Input validation middleware
const validateGitHubName = (req, res, next) => {
  const { username, repository } = req.params;
  
  // GitHub username/repository name validation
  const validName = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
  
  if (username && !validName.test(username)) {
    return res.status(400).json({ 
      error: 'Invalid username format',
      message: 'GitHub usernames can contain alphanumeric characters and hyphens'
    });
  }
  
  if (repository && !validName.test(repository)) {
    return res.status(400).json({ 
      error: 'Invalid repository name format',
      message: 'Repository names can contain alphanumeric characters and hyphens'
    });
  }
  
  next();
};

// Routes

// Landing page - both root and under BASE_PATH
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'landing.html'));
});

app.get('//', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'landing.html'));
});

// User repository listing
app.get('//:username', validateGitHubName, async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`Fetching repositories for user: ${username}`);
    
    const repos = await githubClient.getUserRepos(username);
    
    // Filter for educational repositories
    const educationalRepos = repos.filter(repo => 
      !repo.fork && 
      !repo.archived && 
      repo.size > 0 && // Has content
      ['JavaScript', 'Python', 'HTML', 'CSS', 'TypeScript', 'Java', 'C++', 'C'].includes(repo.language)
    );
    
    // Render repository listing page
    res.send(generateRepoListingHTML(username, educationalRepos));
    
  } catch (error) {
    console.error(`Error fetching repos for ${req.params.username}:`, error);
    
    if (error.status === 404) {
      res.status(404).send(generateErrorHTML(`User '${req.params.username}' not found`));
    } else {
      res.status(500).send(generateErrorHTML('Failed to fetch repositories. Please try again later.'));
    }
  }
});

// Repository viewer - serves Study Lenses frontend
app.get('//:username/:repository', validateGitHubName, async (req, res) => {
  const { username, repository } = req.params;
  
  try {
    // Validate that the repository exists before serving the frontend
    await githubClient.validateRepo(username, repository);
    
    // Serve the Study Lenses frontend (built React/Preact app)
    res.sendFile(path.join(studyLensesPath, 'index.html'));
    
  } catch (error) {
    console.error(`Error validating repo ${username}/${repository}:`, error);
    
    if (error.status === 404) {
      res.status(404).send(generateErrorHTML(`Repository '${username}/${repository}' not found`));
    } else {
      res.status(500).send(generateErrorHTML('Failed to load repository. Please try again later.'));
    }
  }
});

// API endpoint for repository content
app.get('//api/:username/:repository/content.json', validateGitHubName, async (req, res) => {
  try {
    const { username, repository } = req.params;
    console.log(`Processing repository: ${username}/${repository}`);
    
    const repoData = await repoProcessor.processRepo(username, repository);
    
    // Set appropriate cache headers
    res.set({
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'Content-Type': 'application/json'
    });
    
    res.json(repoData);
    
  } catch (error) {
    console.error(`Error processing repo ${req.params.username}/${req.params.repository}:`, error);
    
    res.status(500).json({ 
      error: 'Failed to process repository',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send(generateErrorHTML('Page not found'));
});

// Helper functions for generating HTML responses
function generateRepoListingHTML(username, repos) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${username}'s Repositories - Study Lenses</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .repo { border: 1px solid #e1e4e8; border-radius: 6px; padding: 16px; margin-bottom: 16px; transition: border-color 0.2s; }
        .repo:hover { border-color: #0366d6; }
        .repo-name { font-size: 20px; font-weight: 600; color: #0366d6; margin-bottom: 8px; }
        .repo-description { color: #586069; margin-bottom: 8px; }
        .repo-meta { font-size: 12px; color: #586069; }
        .language { display: inline-block; background: #f1f8ff; color: #0366d6; padding: 2px 8px; border-radius: 12px; margin-right: 8px; }
        a { text-decoration: none; color: inherit; }
        .back-link { display: inline-block; margin-bottom: 20px; color: #0366d6; }
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="back-link">← Back to Study Lenses</a>
        <div class="header">
            <h1>${username}'s Repositories</h1>
            <p>Select a repository to study with Study Lenses</p>
        </div>
        ${repos.length === 0 ? 
          '<p>No educational repositories found for this user.</p>' :
          repos.map(repo => `
            <a href="/${username}/${repo.name}">
                <div class="repo">
                    <div class="repo-name">${repo.name}</div>
                    <div class="repo-description">${repo.description || 'No description available'}</div>
                    <div class="repo-meta">
                        ${repo.language ? `<span class="language">${repo.language}</span>` : ''}
                        Updated ${new Date(repo.updated_at).toLocaleDateString()}
                    </div>
                </div>
            </a>
          `).join('')
        }
    </div>
</body>
</html>`;
}

function generateStudyLensesHTML(username, repository) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${username}/${repository} - Study Lenses</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; text-align: center; }
        .container { max-width: 600px; margin: 50px auto; }
        .loading { font-size: 18px; color: #666; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #0366d6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <h1>Loading ${username}/${repository}</h1>
        <div class="spinner"></div>
        <div class="loading">Preparing repository for study...</div>
        <p>This will be replaced with the Study Lenses interface in Phase 4.</p>
    </div>
</body>
</html>`;
}

function generateErrorHTML(message) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - Study Lenses</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; text-align: center; }
        .container { max-width: 500px; margin: 50px auto; }
        .error { color: #d73a49; font-size: 18px; margin-bottom: 20px; }
        a { color: #0366d6; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Oops! Something went wrong</h1>
        <div class="error">${message}</div>
        <a href="/">← Back to Study Lenses</a>
    </div>
</body>
</html>`;
}

// Start server
app.listen(port, () => {
  console.log(`Study Lenses Server running on http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;