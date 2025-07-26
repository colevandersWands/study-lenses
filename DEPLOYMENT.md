# Deployment Guide - Study Lenses Server

## Quick Start Deployment to Fly.io

### 1. Prerequisites Setup (5 minutes)

```bash
# Install Fly.io CLI
brew install flyctl  # macOS
# or curl -L https://fly.io/install.sh | sh  # Linux

# Login to Fly.io
flyctl auth login
```

### 2. Initialize App (2 minutes)

```bash
# In your project directory
flyctl launch --no-deploy

# Create persistent volume for cache
flyctl volumes create study_lenses_cache --region ord --size 1
```

### 3. Configure Environment (3 minutes)

```bash
# Set GitHub token for higher API rate limits (optional but recommended)
flyctl secrets set GITHUB_TOKEN=your_github_token_here

# Configure limits (optional)
flyctl secrets set CACHE_TTL=3600000
flyctl secrets set MAX_REPO_FILES=1000
flyctl secrets set MAX_REPO_SIZE=52428800
```

### 4. Deploy (2 minutes)

```bash
# Deploy to Fly.io
flyctl deploy

# Check status
flyctl status

# View logs
flyctl logs
```

### 5. GitHub Actions Setup (3 minutes)

1. Get your Fly.io API token:
```bash
flyctl auth token
```

2. Add to GitHub repository secrets:
   - Go to: Repository Settings > Secrets and variables > Actions
   - Add secret: `FLY_API_TOKEN` = `your_token_from_step_1`

3. Update `fly.toml` with your app name and push to main/master

**That's it!** Your app will auto-deploy on every push to main.

## Quick Verification

```bash
# Test your deployed app
curl https://your-app-name.fly.dev/health

# Test with a repository
curl https://your-app-name.fly.dev/octocat
```

## Common Issues & Solutions

### Issue: "App name already taken"
**Solution**: Edit `app` name in `fly.toml` to something unique

### Issue: "Volume not found"
**Solution**: Create the volume in the same region as your app:
```bash
flyctl volumes create study_lenses_cache --region your-region --size 1
```

### Issue: GitHub API rate limits
**Solution**: Add a GitHub personal access token:
```bash
flyctl secrets set GITHUB_TOKEN=ghp_your_token_here
```

### Issue: Out of memory
**Solution**: Increase VM size in `fly.toml`:
```toml
[[vm]]
  size = "shared-cpu-2x"  # or "performance-1x"
  memory = "1gb"
```

## Cost Optimization

- **Free tier**: Use `shared-cpu-1x` with 512MB RAM
- **Production**: Consider `performance-1x` for better performance
- **Cache volume**: Start with 1GB, monitor usage

## Monitoring

```bash
# Real-time logs
flyctl logs -f

# App metrics
flyctl dashboard

# SSH for debugging
flyctl ssh console
```

## Scaling

```bash
# Scale to multiple regions
flyctl regions add iad lax

# Auto-scale based on load
flyctl autoscale standard min=1 max=3
```

That's it! Your Study Lenses Server is now deployed and ready to use. 🚀