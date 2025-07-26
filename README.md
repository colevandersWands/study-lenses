# Study Lenses Server

A Node.js server that integrates GitHub repositories with Study Lenses, providing an interactive learning platform for exploring and studying code.

## Features

- **GitHub Integration**: Browse any user's public repositories
- **Interactive Code Study**: Transform repositories into interactive learning experiences
- **Multiple Languages**: Support for JavaScript, Python, HTML, CSS, and more
- **Smart Caching**: Efficient processing with intelligent caching system
- **Security**: Rate limiting, input validation, and security headers
- **Performance**: Compression, caching, and optimized GitHub API usage

## Quick Start

### Prerequisites

- Node.js 16+ 
- Git
- GitHub account (optional, for higher API rate limits)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd study-lenses-server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment (optional):
```bash
cp .env.example .env
# Edit .env file with your preferences
```

4. Start the server:
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Routes

### Public Routes

- `GET /` - Landing page describing Study Lenses
- `GET /:username` - List user's GitHub repositories
- `GET /:username/:repository` - Study Lenses interface for repository
- `GET /health` - Health check endpoint

### API Endpoints

- `GET /api/:username/:repository/content.json` - Repository JSON data

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `GITHUB_TOKEN` | GitHub personal access token (optional) | - |
| `CACHE_TTL` | Cache time-to-live in milliseconds | `3600000` (1 hour) |
| `MAX_REPO_FILES` | Maximum files to process per repository | `1000` |
| `MAX_REPO_SIZE` | Maximum repository size in bytes | `52428800` (50MB) |

### GitHub Token Setup (Optional)

For higher API rate limits, create a GitHub personal access token:

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Generate a new token with `public_repo` scope
3. Add it to your `.env` file as `GITHUB_TOKEN=your_token_here`

**Rate Limits:**
- Without token: 60 requests/hour
- With token: 5000 requests/hour

## Architecture

### Project Structure

```
study-lenses-server/
├── server.js              # Main Express server
├── lib/
│   ├── github-client.js   # GitHub API wrapper
│   ├── repo-processor.js  # Repository processing logic
│   └── cache-manager.js   # File-based caching system
├── views/
│   └── landing.html       # Landing page template
├── public/                # Static assets
├── cache/                 # Cached repository data (auto-generated)
└── README.md
```

### Core Components

1. **GitHub Client** - Handles GitHub API interactions with rate limiting and error handling
2. **Repository Processor** - Clones repositories, processes them with `crawlDirectory`, and manages cleanup
3. **Cache Manager** - File-based caching with TTL expiration for performance
4. **Express Server** - Web server with security middleware, rate limiting, and route handling

### Data Flow

1. User requests `/:username/:repository`
2. Server validates repository exists via GitHub API
3. Repository processor checks cache, clones if needed
4. `crawlDirectory` creates JSON representation of repository
5. Result cached and served to Study Lenses frontend
6. Temporary files cleaned up automatically

## Development

### Development Mode

```bash
npm run dev
```

This starts the server with `nodemon` for automatic restarts on file changes.

### Testing Routes

```bash
# Test landing page
curl http://localhost:3000/

# Test user repositories
curl http://localhost:3000/octocat

# Test repository API
curl http://localhost:3000/api/octocat/Hello-World/content.json
```

### Debugging

Enable detailed logging by setting:
```bash
NODE_ENV=development
```

### Cache Management

```bash
# View cache statistics
curl http://localhost:3000/health

# Clear cache (restart server or implement admin endpoint)
rm -rf cache/*
```

## Security

### Built-in Security Features

- **Helmet.js**: Security headers (CSP, HSTS, etc.)
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: GitHub username/repository format validation
- **CORS**: Cross-origin resource sharing configuration
- **Error Handling**: No internal error details leaked to users

### Security Best Practices

- Keep dependencies updated: `npm audit fix`
- Use HTTPS in production
- Monitor rate limits and adjust as needed
- Regularly clean up cache and temporary files
- Consider implementing authentication for private repositories

## Performance

### Optimization Features

- **Smart Caching**: 1-hour TTL for processed repositories
- **Compression**: Gzip compression for all responses
- **GitHub API Optimization**: Minimal API calls, efficient data fetching
- **Repository Size Limits**: Prevents processing of oversized repositories
- **Temporary File Cleanup**: Automatic cleanup of cloned repositories

### Performance Monitoring

Monitor these metrics:
- GitHub API rate limit usage
- Cache hit/miss ratios
- Repository processing times
- Memory usage during large repository processing

## Troubleshooting

### Common Issues

**"Repository not found" errors**
- Verify repository is public
- Check username/repository spelling
- Ensure repository hasn't been deleted/renamed

**Rate limit exceeded**
- Add GitHub personal access token
- Implement request queuing
- Cache more aggressively

**Repository too large**
- Increase `MAX_REPO_SIZE` and `MAX_REPO_FILES`
- Implement selective file processing
- Add repository size pre-check

**Cache issues**
- Clear cache directory: `rm -rf cache/*`
- Check disk space availability
- Verify cache directory permissions

### Debug Information

Check the health endpoint for system status:
```bash
curl http://localhost:3000/health
```

View server logs for detailed error information.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Commit with clear messages: `git commit -m "Add feature"`
5. Push and create a pull request

## Deployment

### Fly.io Deployment

This project includes automated deployment to Fly.io via GitHub Actions.

#### Prerequisites

1. **Fly.io Account**: Sign up at [fly.io](https://fly.io)
2. **Fly.io CLI**: Install flyctl locally for initial setup

#### Initial Setup

1. **Install Fly.io CLI**:
```bash
# macOS
brew install flyctl

# Linux/WSL
curl -L https://fly.io/install.sh | sh

# Windows
iwr https://fly.io/install.ps1 -useb | iex
```

2. **Login and Create App**:
```bash
# Login to Fly.io
flyctl auth login

# Launch app (customize app name in fly.toml)
flyctl launch --no-deploy

# Create volume for persistent cache
flyctl volumes create study_lenses_cache --region ord --size 1
```

3. **Set Environment Variables** (optional but recommended):
```bash
# Set GitHub token for higher API rate limits
flyctl secrets set GITHUB_TOKEN=your_github_token_here

# Configure cache settings
flyctl secrets set CACHE_TTL=3600000
flyctl secrets set MAX_REPO_FILES=1000
flyctl secrets set MAX_REPO_SIZE=52428800
```

4. **Configure GitHub Secrets**:
   - Go to your GitHub repository Settings > Secrets and variables > Actions
   - Add `FLY_API_TOKEN` secret with your Fly.io API token
   - Get token from: `flyctl auth token`

#### Manual Deployment

```bash
# Deploy manually
flyctl deploy

# Check deployment status
flyctl status

# View logs
flyctl logs

# SSH into machine (for debugging)
flyctl ssh console
```

#### Automatic Deployment

The GitHub Action automatically:
1. **Tests** the application on Node.js 18 and 20
2. **Deploys** to Fly.io on push to main/master
3. **Health checks** the deployed application

#### Monitoring

```bash
# View app metrics
flyctl dashboard

# Monitor logs in real-time
flyctl logs -f

# Check app health
curl https://your-app-name.fly.dev/health
```

#### Configuration

- **App configuration**: Edit `fly.toml`
- **Environment variables**: Use `flyctl secrets set KEY=value`
- **Scaling**: Modify `[[vm]]` section in `fly.toml`
- **Regions**: Update `primary_region` in `fly.toml`

#### Costs

Fly.io offers:
- **Free tier**: 3 shared-cpu-1x VMs with 160GB monthly transfer
- **Paid plans**: Starting at $1.94/month for additional resources
- **Volume storage**: $0.15/GB/month for persistent cache

### Alternative Deployment Options

#### Docker

```bash
# Build image
docker build -t study-lenses-server .

# Run container
docker run -p 3000:8080 \
  -e NODE_ENV=production \
  -e GITHUB_TOKEN=your_token \
  study-lenses-server
```

#### Traditional VPS

```bash
# Install Node.js and Git on your server
# Clone repository
git clone <your-repo-url>
cd study-lenses-server

# Install dependencies
npm ci --only=production

# Set environment variables
export NODE_ENV=production
export GITHUB_TOKEN=your_token

# Start with PM2 (recommended)
npm install -g pm2
pm2 start server.js --name "study-lenses-server"
pm2 startup
pm2 save
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review server logs for error details
- For deployment issues, check Fly.io dashboard and logs