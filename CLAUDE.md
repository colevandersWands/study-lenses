# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

```bash
# Development (run both for full experience)
npm run dev              # Frontend dev server (port 3000)
npm run server:dev       # Backend with GitHub integration (port 4567)

# Code Quality (run before committing)
npm run lint            # ESLint auto-fix
npm run type-check      # TypeScript/JSDoc checking
npm run format          # Prettier formatting

# Testing
npm test                # Vitest watch mode
npm run test:run        # Run tests once
npm run test:ui         # Visual test UI

# Building & Deployment
npm run build           # Production build
npm start               # Build + start server
flyctl deploy           # Deploy to Fly.io
```

## Architecture Overview

Study Lenses is a **hybrid codebase** with modern (SL2) and legacy (SL1) systems:

```
┌─────────────────────────────────────────────────────────────┐
│  Preact Frontend (SL2)          │    Legacy Static (SL1)    │
│  /src/                         │    /public/static/        │
│  - Modern components           │    - jQuery components    │
│  - Context-based state         │    - Vanilla JS utils     │
│  - CodeMirror 6 editors        │    - Trace tables         │
├─────────────────────────────────────────────────────────────┤
│                    Express.js Server                        │
│  - GitHub API integration via /lib/github-client.js        │
│  - Repository processing via /lib/repo-processor.js        │
│  - File caching system via /lib/cache-manager.js          │
└─────────────────────────────────────────────────────────────┘
```

## Key Development Patterns

### 1. Creating a New Lens

Lenses are the core feature - different ways to study code. To add a new lens:

```javascript
// 1. Create src/lenses/NewLens.jsx
export const id = 'new-lens';
export const label = 'New Lens';
export const icon = '🆕';

export const applicable = (file) => {
  return file && file.type === 'file' && file.lang === 'javascript';
};

export const render = ({ resource, config }) => {
  return <div>Lens content for {resource.name}</div>;
};

// Optional: configuration UI
export const renderConfig = ({ config, onConfigChange }) => {
  return <div>Config UI</div>;
};

// 2. Add to src/lenses/index.js
import * as newLens from './NewLens.jsx';
export const STUDY_LENSES = [...existingLenses, newLens];
```

### 2. State Management

Three main contexts manage app state:
- **AppContext**: Files, current file, exercise state
- **ToastContext**: User notifications
- **ColorizeContext**: Syntax highlighting

```javascript
// Access current file
import { useApp } from './context/AppContext';
const { currentFile, virtualFS } = useApp();

// Show notifications
import { useToast } from './hooks/useToast';
const toast = useToast();
toast.show('Success!', 'success');
```

### 3. Working with Virtual File System

```javascript
// File structure
{
  name: 'example.js',
  path: '/src/example.js',
  type: 'file',
  content: '// code',
  lang: 'javascript',
  ext: '.js',
  children: []  // for directories
}

// Loading files
import { loadVirtualFS } from './load-virtual-fs.js';
const fs = await loadVirtualFS(source);
```

### 4. URL Management

Deep linking for shareable sessions:
```javascript
// URL format: /username/repo?file=path.js&lens=highlight
import URLManager from './utils/URLManager.js';
URLManager.updateParams({ lens: 'highlight', file: 'path.js' });
```

## Critical Issues to Know

### 1. Editor Flickering Fix
```javascript
// REQUIRED: Add this to any CodeMirror container
editorContainer.style.transform = 'translateZ(0)';
```

### 2. Acorn Import Pattern
```javascript
// Always use this pattern for acorn imports
import acorn from '/lib/acorn.es.js';
// NOT: import acorn from 'acorn';
```

### 3. Missing Toast Notifications
Many error handlers are missing toast notifications. When fixing errors, add:
```javascript
catch (error) {
  console.error('Context:', error);
  toast.show('Error message', 'error'); // Add this
}
```

### 4. Current Development Branch
The `qasm` branch adds QASM (Quantum Assembly) language support with new transpilers and lens.

## Language Support

To add a new language, update `src/utils/LanguageConfiguration.js`:

```javascript
newLanguage: {
  id: 'newlang',
  name: 'New Language',
  extensions: ['.nl'],
  mimeTypes: ['text/x-newlang'],
  codeMirrorLanguage: null, // or import from @codemirror/lang-*
  executionEngine: null,
  supportedLenses: ['editor', 'highlight', ...]
}
```

## Testing Strategy

```bash
# Run specific test file
npm test -- src/lenses/lenses.test.js

# Debug tests with UI
npm run test:ui

# Coverage report
npm run test:coverage
```

Current test coverage is minimal - prioritize testing:
1. New lens unified API compliance
2. Virtual file system operations
3. URL parameter handling
4. Language detection

## Performance Considerations

1. **Bundle Size**: Main chunk is 4.6MB - use dynamic imports for new heavy dependencies
2. **Editor Instances**: Cached per file in Map to prevent recreation
3. **Repository Limits**: MAX_REPO_FILES=1000, MAX_REPO_SIZE=50MB
4. **Cache TTL**: 1 hour for GitHub repositories

## Deployment Notes

- **Platform**: Fly.io with Docker
- **Region**: `ewr` (US East)
- **Auto-scaling**: Machines stop when idle, start on request
- **Persistent Volume**: For repository cache
- **Health Check**: `/health` endpoint

## Quick Debugging

```bash
# Enable debug logging
localStorage.setItem('debug', 'study-lenses:*');

# Common fixes
rm -rf node_modules && npm install  # Dependency issues
rm -rf cache/*                      # Cache corruption
npm run build                       # Build issues
```

## Key Files Reference

- **Entry**: `src/main.jsx` → `src/App.jsx`
- **Lenses**: `src/lenses/*.jsx`
- **Server**: `server.js` with `/lib/*` modules
- **Config**: `vite.config.js`, `fly.toml`
- **Legacy**: `/public/static/` (avoid modifying)

## Active Technical Debt

1. **Test Coverage**: Only 1 test file exists - expand testing
2. **Error Handling**: 130+ try-catch blocks need toast notifications
3. **Bundle Size**: Implement code splitting for lenses
4. **Legacy Migration**: SL1 jQuery code needs gradual replacement
5. **TypeScript**: Currently using JSDoc - consider full TS migration

When working on features, prioritize:
- Maintaining URL compatibility (don't break existing links)
- Following the unified lens API
- Adding tests for new functionality
- Using existing patterns and utilities