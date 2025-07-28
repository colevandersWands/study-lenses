# CLAUDE.md - Study Lenses Comprehensive Documentation

This file provides comprehensive guidance for Claude AI and developers working with the Study Lenses codebase.
Last updated: July 2025 | Version: 2.0.0

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture & Design Patterns](#architecture--design-patterns)
3. [Code Organization & Conventions](#code-organization--conventions)
4. [Development Workflow](#development-workflow)
5. [Core Systems Documentation](#core-systems-documentation)
6. [Current Issues & Technical Debt](#current-issues--technical-debt)
7. [API Documentation](#api-documentation)
8. [Configuration Reference](#configuration-reference)
9. [Migration & Refactoring Guide](#migration--refactoring-guide)
10. [Future Development Roadmap](#future-development-roadmap)
11. [Troubleshooting Guide](#troubleshooting-guide)
12. [Contributing Guidelines](#contributing-guidelines)
13. [Dependencies & Tools](#dependencies--tools)
14. [Security & Performance](#security--performance)
15. [Appendices](#appendices)

---

## Executive Summary

**Study Lenses v2.0** is an interactive code learning platform that transforms code files and GitHub repositories into educational experiences through various "lenses" (different views/exercises).

### Key Features
- **Multi-lens system**: 15+ different ways to study code (editing, tracing, blanks, etc.)
- **GitHub integration**: Load any public repository directly
- **Language support**: JavaScript, Python, HTML, CSS, Markdown
- **Virtual file system**: In-memory file management with caching
- **URL-based state**: Deep linking and shareable sessions

### Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
├─────────────────────────────────────────────────────────────┤
│  Preact Frontend (SL2)          │    Legacy Static (SL1)    │
│  - Modern components            │    - jQuery components     │
│  - Context-based state          │    - Vanilla JS utils      │
│  - CodeMirror 6 editors         │    - Trace tables          │
├─────────────────────────────────────────────────────────────┤
│                    Express.js Server                        │
│  - GitHub API integration                                   │
│  - Repository processing                                    │
│  - Static file serving                                      │
└─────────────────────────────────────────────────────────────┘
```

### Current State
- **Maturity**: Production-ready with known limitations
- **Version**: 2.0.0 (hybrid SL1/SL2 implementation)
- **Deployment**: Fly.io with Docker containerization
- **Active Development**: Migrating from SL1 to SL2

---

## Architecture & Design Patterns

### 1. Hybrid Architecture (SL1/SL2)

The codebase currently maintains two systems:

**SL2 (Modern)**
- Location: `/src/`
- Stack: Preact + Vite + ES Modules
- Pattern: Component-based with Context API
- Style: CSS Modules

**SL1 (Legacy)**
- Location: `/public/static/`
- Stack: jQuery + Vanilla JS
- Pattern: Global scripts and web components
- Style: Global CSS

### 2. Plugin-Based Lens System

```javascript
// Unified Lens API Pattern
export const lensTemplate = {
  id: 'unique-id',           // Required: unique identifier
  label: 'Display Name',     // Required: UI label
  icon: '🔍',               // Optional: emoji/icon
  
  // Required: Determines if lens applies to file
  applicable: (file) => boolean,
  
  // One of these required:
  render: (props) => JSX,    // For visual lenses
  execute: (file) => void,   // For action lenses
  
  // Optional configuration
  config: { /* lens-specific config */ },
  renderConfig: (props) => JSX
};
```

### 3. Virtual File System

```javascript
// File object structure
{
  name: 'example.js',
  path: '/src/example.js',
  type: 'file',
  content: '// code content',
  lang: 'javascript',
  ext: '.js',
  children: []  // for directories
}
```

### 4. Context-Based State Management

Three main contexts manage application state:

- **AppContext**: Global app state, file management, exercise state
- **ToastContext**: User notifications and alerts
- **ColorizeContext**: Syntax highlighting preferences

### 5. Event-Driven Patterns

- URL changes trigger state updates
- File changes propagate through contexts
- Lens switching uses pub/sub pattern

---

## Code Organization & Conventions

### Directory Structure

```
study-lenses/
├── src/                    # SL2 modern frontend
│   ├── components/        # Reusable UI components
│   ├── lenses/           # All lens implementations
│   ├── context/          # React contexts
│   ├── utils/            # Helper functions
│   ├── containers/       # Layout containers
│   └── main.jsx          # Entry point
├── public/               # Static assets
│   └── static/           # SL1 legacy code
├── lib/                  # Server-side libraries
├── views/               # Server HTML templates
├── content/             # Educational content
├── cache/              # Repository cache (gitignored)
└── dist/               # Build output
```

### Naming Conventions

- **Files**: `kebab-case.js` or `PascalCase.jsx` for components
- **Components**: `PascalCase` (e.g., `FileBrowser`)
- **Functions**: `camelCase` (e.g., `loadVirtualFS`)
- **CSS Modules**: `ComponentName.module.css`
- **Constants**: `UPPER_SNAKE_CASE`

### Code Style

```javascript
// Component template
import { useState, useEffect } from 'preact/hooks';
import styles from './ComponentName.module.css';

export const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // Effect logic
  }, [dependency]);
  
  return (
    <div className={styles.container}>
      {/* JSX content */}
    </div>
  );
};

// Utility function template
/**
 * Brief description
 * @param {Type} param - Description
 * @returns {Type} Description
 */
export function utilityFunction(param) {
  try {
    // Implementation
    return result;
  } catch (error) {
    console.error('Context:', error);
    // Handle error appropriately
  }
}
```

### Module System

- **New code**: ES modules (`import`/`export`)
- **Legacy code**: CommonJS (`require`/`module.exports`)
- **Mixed imports**: Handle carefully during migration

---

## Development Workflow

### Essential Commands

```bash
# Development
npm run dev              # Start dev server (port 3000)
npm run server:dev       # Start server with nodemon (port 4567)

# Building
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # ESLint with auto-fix
npm run lint:check      # ESLint without fixing
npm run type-check      # TypeScript/JSDoc checking
npm run format          # Prettier formatting

# Testing
npm test                # Run tests in watch mode
npm run test:run        # Run tests once
npm run test:coverage   # Generate coverage report

# Deployment
npm start               # Build and start server
npm run publish         # Generate content.json
```

### Development Setup

1. **Prerequisites**
   - Node.js 16+
   - Git
   - npm or yarn

2. **Initial Setup**
   ```bash
   git clone <repository>
   cd study-lenses
   npm install
   ```

3. **Environment Variables** (optional)
   ```bash
   # .env file
   PORT=4567
   NODE_ENV=development
   GITHUB_TOKEN=your_token_here
   CACHE_TTL=3600000
   MAX_REPO_FILES=1000
   MAX_REPO_SIZE=52428800
   ```

4. **Running Locally**
   ```bash
   # Terminal 1: Frontend
   npm run dev
   
   # Terminal 2: Backend (if testing GitHub integration)
   npm run server:dev
   ```

### Git Workflow

1. Branch naming: `feature/description` or `fix/issue-description`
2. Commit format: `type: brief description` (e.g., `fix: acorn import issue`)
3. PR process: Include tests, update docs, pass linting

---

## Core Systems Documentation

### 1. Lens System

The lens system is the heart of Study Lenses. Each lens provides a different way to interact with code.

#### Creating a New Lens

1. Create file: `src/lenses/NewLens.jsx`
2. Implement unified API:

```javascript
import { useState } from 'preact/hooks';
import styles from './NewLens.module.css';

// Lens configuration
export const id = 'new-lens';
export const label = 'New Lens';
export const icon = '🆕';

// Applicability check
export const applicable = (file) => {
  return file && file.type === 'file' && file.lang === 'javascript';
};

// Render method for visual lenses
export const render = ({ resource, config }) => {
  const [state, setState] = useState(null);
  
  return (
    <div className={styles.container}>
      <h2>New Lens for {resource.name}</h2>
      {/* Lens implementation */}
    </div>
  );
};

// Optional configuration UI
export const renderConfig = ({ config, onConfigChange }) => {
  return (
    <div className={styles.config}>
      {/* Configuration controls */}
    </div>
  );
};

// Make it default export for consistency
export default { id, label, icon, applicable, render, renderConfig };
```

3. Add to registry in `src/lenses/index.js`:

```javascript
import * as newLens from './NewLens.jsx';

export const STUDY_LENSES = [
  // ... existing lenses
  newLens,
];
```

#### Current Lenses

| Lens | ID | Purpose | Status |
|------|-----|---------|---------|
| Editor | `editor` | Main code editing | ✅ Complete |
| Highlight | `highlight` | Code annotation | ✅ Complete |
| Blanks | `blanks` | Fill-in exercises | ✅ Complete |
| Variables | `variables` | Variable tracking | ✅ Complete |
| Trace | `trace` | Execution tracing | ✅ Complete |
| Parsons | `parsons` | Drag-drop ordering | ⚠️ Basic |
| Flowchart | `flowchart` | Visual flow | ❌ TODO |
| Debug | `debug` | Debugging practice | ✅ Complete |
| Run | `run` | Code execution | ✅ Complete |
| Ask | `ask` | Q&A generation | ✅ Complete |
| Print | `print` | Print-friendly view | ✅ Complete |
| Markdown | `markdown` | MD rendering | ✅ Complete |
| StepThrough | `stepthrough` | Step execution | ✅ Complete |
| WriteMe | `writeme` | Code writing | ✅ Complete |

### 2. Virtual File System

The virtual FS provides an abstraction over different file sources.

#### File Sources
1. **Local content**: `/content/` directory
2. **GitHub repos**: Via API and cloning
3. **URL imports**: Direct file loading
4. **Cache**: Persistent storage

#### Key Functions

```javascript
// Load file system
import { loadVirtualFS } from './load-virtual-fs.js';

const fs = await loadVirtualFS(source);

// File operations
fs.findFile(path)
fs.readFile(path)
fs.writeFile(path, content)  // In-memory only
fs.listDirectory(path)
```

### 3. URL Management

Deep linking enables shareable study sessions.

#### URL Structure
```
/username/repository?file=path/to/file.js&lens=highlight&selection=10-20
```

#### Parameters
- `file`: File path within repository
- `lens`: Active lens type
- `selection`: Line range or selection
- Lens-specific params (e.g., `blanks=difficulty:50`)

### 4. Editor Management

CodeMirror 6 instances are managed per-file for performance.

#### Lifecycle
1. Editor created on first file access
2. Cached in Map by file path
3. Reused when switching back
4. Disposed when file closed

#### Performance Hack
```javascript
// HACK: Force hardware acceleration to prevent flickering
editorContainer.style.transform = 'translateZ(0)';
```

### 5. Language Support

The PluginRegistry manages language-specific features.

#### Adding Language Support

```javascript
// In src/utils/LanguageConfiguration.js
javascript: {
  id: 'javascript',
  name: 'JavaScript',
  extensions: ['.js', '.jsx', '.mjs'],
  mimeTypes: ['application/javascript', 'text/javascript'],
  codeMirrorLanguage: javascript,
  executionEngine: 'run-javascript',
  supportedLenses: ['editor', 'trace', 'debug', 'blanks', ...]
}
```

---

## Current Issues & Technical Debt

### High Priority Issues

1. **Missing Toast Notifications**
   - Files: `App.jsx:210`, `App.jsx:341`, `HighlightLens.jsx:434`
   - Impact: Poor user feedback
   - Fix: Implement toast calls in catch blocks

2. **Acorn Version Conflicts**
   - Multiple acorn versions loaded
   - Global vs module imports
   - Fix: Standardize on single acorn version

3. **Editor Flickering**
   - Hardware acceleration hack needed
   - Root cause: React re-rendering
   - Fix: Optimize editor lifecycle

### Medium Priority Issues

4. **Test Coverage**
   - Only 1 test file exists
   - No integration tests
   - No E2E tests

5. **Error Handling**
   - 130+ try-catch blocks
   - Inconsistent error recovery
   - Silent failures in places

6. **Performance Issues**
   - Large bundle size (4.6MB main chunk)
   - No code splitting for lenses
   - Editor memory leaks possible

### Low Priority Issues

7. **Incomplete Lenses**
   - Flowchart shows "coming soon"
   - Parsons needs enhancement
   - Some features stubbed out

8. **Legacy Code**
   - SL1 jQuery dependencies
   - Global variables in static/
   - Duplicate functionality

### Technical Debt Log

| Area | Debt | Impact | Effort |
|------|------|--------|--------|
| Testing | Minimal test coverage | High risk | High |
| Types | No TypeScript | Maintenance | High |
| Bundle | Large size | Performance | Medium |
| Legacy | SL1 code | Complexity | High |
| Errors | Poor handling | UX | Medium |
| Docs | Incomplete | Onboarding | Low |

---

## API Documentation

### Server Endpoints

#### GET /
Landing page with Study Lenses description.

**Response**: HTML page

#### GET /:username
List user's GitHub repositories.

**Parameters**:
- `username`: GitHub username

**Response**: HTML page with repository list

#### GET /:username/:repository
Study Lenses interface for repository.

**Parameters**:
- `username`: GitHub username
- `repository`: Repository name

**Response**: Study Lenses SPA

#### GET /api/:username/:repository/content.json
Repository content as JSON.

**Parameters**:
- `username`: GitHub username
- `repository`: Repository name

**Response**:
```json
{
  "name": "repository-name",
  "type": "directory",
  "path": "/",
  "children": [
    {
      "name": "file.js",
      "type": "file",
      "content": "// file content",
      "lang": "javascript",
      "ext": ".js"
    }
  ]
}
```

**Error Responses**:
- `400`: Invalid username/repository format
- `404`: Repository not found
- `429`: Rate limit exceeded
- `500`: Server error

#### GET /health
Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "uptime": 12345,
  "cache": {
    "size": 10,
    "hits": 100,
    "misses": 20
  }
}
```

### Rate Limiting

- Default: 1000 requests per 15 minutes per IP
- With GitHub token: Higher limits based on GitHub API

### Security Headers

Implemented via Helmet.js:
- Content Security Policy
- HSTS
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff

---

## Configuration Reference

### vite.config.js

```javascript
{
  base: '/',                    // Base URL path
  server: {
    port: 3000,                // Dev server port
    open: true,                // Open browser on start
    host: true                 // Expose to network
  },
  build: {
    target: 'es2016',         // Browser compatibility
    sourcemap: true,          // Generate sourcemaps
    chunkSizeWarningLimit: 1000
  }
}
```

### eslint.config.js

Minimal configuration:
- ECMAScript 2020
- Source type: module
- Basic rules (no-unused-vars: warn, no-undef: error)

**Recommendation**: Enhance with more rules and plugins

### fly.toml

```toml
app = 'study-lenses'
primary_region = 'ewr'

[http_service]
  internal_port = 4567
  force_https = true
  auto_stop_machines = 'stop'
  min_machines_running = 0
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4567 | Server port |
| `NODE_ENV` | development | Environment mode |
| `GITHUB_TOKEN` | - | GitHub API token |
| `CACHE_TTL` | 3600000 | Cache lifetime (ms) |
| `MAX_REPO_FILES` | 1000 | Max files per repo |
| `MAX_REPO_SIZE` | 52428800 | Max repo size (bytes) |

### Feature Flags

Currently no formal feature flag system. Lens availability acts as implicit feature flags.

---

## Migration & Refactoring Guide

### SL1 to SL2 Migration

#### Identifying Legacy Code
- Location: `/public/static/`
- Indicators: jQuery usage, global variables, require() statements
- Web components in `wc-*` directories

#### Migration Pattern

1. **Identify SL1 Component**
   ```javascript
   // SL1 pattern
   window.ComponentName = function() {
     // jQuery-based implementation
   };
   ```

2. **Create SL2 Equivalent**
   ```javascript
   // SL2 pattern
   export const ComponentName = () => {
     // Preact implementation
   };
   ```

3. **Update Imports**
   - Remove script tags from index.html
   - Add ES module imports

4. **Test Both Versions**
   - Run side-by-side initially
   - Switch traffic gradually
   - Remove SL1 when stable

### Recommended Refactoring Priorities

1. **High Priority**
   - Consolidate acorn imports
   - Standardize error handling
   - Add comprehensive tests

2. **Medium Priority**
   - Extract common lens patterns
   - Optimize bundle size
   - Improve type safety

3. **Low Priority**
   - Remove jQuery dependencies
   - Modernize build config
   - Update dependencies

### Breaking Changes to Avoid

- URL structure (breaks existing links)
- Lens IDs (breaks saved states)
- File object structure (breaks integrations)

---

## Future Development Roadmap

### Short-term (1-2 weeks)

1. **Fix Critical Bugs**
   - [ ] Toast notifications
   - [ ] Acorn import issues
   - [ ] Editor flickering

2. **Improve Testing**
   - [ ] Add lens unit tests
   - [ ] Integration test suite
   - [ ] CI/CD test automation

### Medium-term (1-3 months)

3. **Complete Features**
   - [ ] Flowchart lens
   - [ ] Enhanced Parsons
   - [ ] Collaborative features

4. **Performance**
   - [ ] Code splitting
   - [ ] Bundle optimization
   - [ ] Memory leak fixes

5. **Developer Experience**
   - [ ] TypeScript migration
   - [ ] Better documentation
   - [ ] Developer tools

### Long-term (6+ months)

6. **Architecture**
   - [ ] Complete SL1 removal
   - [ ] Microservices split
   - [ ] Plugin marketplace

7. **Features**
   - [ ] AI-powered hints
   - [ ] Multi-language support
   - [ ] Mobile app

8. **Scale**
   - [ ] Multi-tenant support
   - [ ] Enterprise features
   - [ ] Analytics dashboard

---

## Troubleshooting Guide

### Common Issues

#### "Repository not found"
1. Check repository is public
2. Verify username/repo spelling
3. Check GitHub API status
4. Review rate limits

#### "Lens not working"
1. Check browser console
2. Verify file type compatibility
3. Clear cache and reload
4. Check lens-specific logs

#### "Editor not loading"
1. Check CodeMirror errors
2. Verify file content loaded
3. Look for flickering hack
4. Try different browser

#### "Build failures"
1. Clear node_modules
2. Check Node version (>=16)
3. Review error logs
4. Try clean install

### Debug Mode

Enable debug logging:
```javascript
localStorage.setItem('debug', 'study-lenses:*');
```

### Performance Profiling

1. Use Chrome DevTools Performance tab
2. Look for:
   - Long tasks
   - Memory leaks
   - Unnecessary re-renders
   - Large network payloads

---

## Contributing Guidelines

### Code Standards

1. **Style**: Follow existing patterns
2. **Linting**: Must pass `npm run lint`
3. **Tests**: Add tests for new features
4. **Docs**: Update relevant documentation

### PR Process

1. Fork repository
2. Create feature branch
3. Make changes with tests
4. Submit PR with description
5. Address review feedback
6. Merge after approval

### Commit Messages

Format: `type: description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Test changes
- `chore`: Maintenance

---

## Dependencies & Tools

### Critical Dependencies

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| preact | 10.19.3 | UI framework | React alternative |
| codemirror | 6.0.2 | Code editor | v6 is major rewrite |
| express | 4.18.2 | Web server | Stable |
| vite | 5.0.10 | Build tool | Fast bundler |
| simple-git | 3.19.1 | Git operations | For repo cloning |

### Development Tools

- **Vitest**: Testing framework (Jest-compatible)
- **ESLint**: Linting (minimal config)
- **Prettier**: Code formatting
- **TypeScript**: Type checking (JSDoc mode)

### Build Pipeline

```
Source Files → Vite → Bundle → Static Assets
     ↓           ↓        ↓          ↓
   JSX/JS    Transform  Optimize   dist/
```

---

## Security & Performance

### Security Measures

1. **Input Validation**
   - GitHub username/repo format
   - File path sanitization
   - URL parameter validation

2. **Headers**
   - CSP policy implemented
   - HSTS enabled
   - XSS protection

3. **Rate Limiting**
   - IP-based limits
   - Configurable thresholds

### Known Vulnerabilities

- No authentication system
- Public repository access only
- Client-side code execution

### Performance Metrics

Current benchmarks:
- Initial load: ~3s
- Time to interactive: ~4s
- Bundle size: 5.8MB total
- Memory usage: ~50-200MB

### Optimization Opportunities

1. **Bundle Size**
   - Tree shake unused code
   - Dynamic imports for lenses
   - Compress assets

2. **Runtime Performance**
   - Memoize expensive operations
   - Virtual scrolling for large files
   - Web workers for parsing

3. **Caching**
   - Service worker for offline
   - Better cache headers
   - CDN for static assets

---

## Appendices

### A. Glossary

- **Lens**: A view or exercise type for studying code
- **SL1**: Study Lenses version 1 (legacy jQuery-based)
- **SL2**: Study Lenses version 2 (modern Preact-based)
- **Virtual FS**: In-memory file system abstraction
- **Enliven**: Process of enriching file objects with methods

### B. Quick Reference

```bash
# Development
npm run dev                 # Start frontend
npm run server:dev         # Start backend
npm run lint               # Fix linting
npm test                   # Run tests

# Debugging
localStorage.debug = '*'   # Enable all logs
?debug=true               # URL debug mode

# Common Fixes
rm -rf node_modules       # Clean install
npm run build            # Rebuild assets
```

### C. Useful Code Snippets

```javascript
// Access current file
import { useApp } from './context/AppContext';
const { currentFile } = useApp();

// Switch lens
URLManager.updateParams({ lens: 'highlight' });

// Show toast
import { useToast } from './hooks/useToast';
const toast = useToast();
toast.show('Success!', 'success');

// Get applicable lenses
import { getApplicableLenses } from './lenses';
const lenses = getApplicableLenses(file);
```

### D. External Resources

- [CodeMirror 6 Docs](https://codemirror.net/6/)
- [Preact Documentation](https://preactjs.com/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Express.js API](https://expressjs.com/en/4x/api.html)

### E. Emergency Procedures

#### Production Down
1. Check Fly.io status: `flyctl status`
2. Review logs: `flyctl logs`
3. Restart if needed: `flyctl restart`
4. Rollback if broken: `flyctl releases`

#### High Memory Usage
1. Check for memory leaks in Chrome DevTools
2. Review editor instance count
3. Clear repository cache
4. Restart server

#### Performance Degradation
1. Check GitHub API rate limits
2. Review cache hit rates
3. Monitor bundle size
4. Profile with DevTools

---

## Important Notes & Warnings

### ⚠️ Critical Warnings

1. **Never expose GitHub tokens** in client-side code
2. **Don't modify** URL structure without migration plan
3. **Test lens changes** across all file types
4. **Maintain backwards compatibility** for shared links

### 📝 Development Tips

1. **Use the development setup** - Don't test on production
2. **Check existing patterns** - Consistency is key
3. **Add tests** - Even one test is better than none
4. **Document weird code** - Future you will thank you

### 🐛 Known Gotchas

1. **Editor flickers** without hardware acceleration hack
2. **Acorn versions** must match between import types
3. **URL parameters** are encoded/decoded multiple times
4. **Cache invalidation** requires server restart

### 🚀 Pro Tips

1. **Lens development**: Start with copying existing lens
2. **Debugging**: Use `debugger` statements liberally
3. **Performance**: Profile before optimizing
4. **Testing**: Use Vitest UI for better experience

---

*This documentation is a living document. Update it as the codebase evolves.*