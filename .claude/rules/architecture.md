---
description: Architecture and structural guidelines for the Cursor Electron application
---

## Architecture Guidelines

### Electron Architecture
Cursor is an Electron application with two main processes:
- **Main Process**: Node.js environment, handles OS interactions and window management
- **Renderer Process**: React-based UI, runs in browser-like context

### IPC Communication
- Use `@electron/remote` for main-renderer communication where needed
- Be mindful of security implications when using remote
- Keep IPC calls minimal and efficient

### CodeMirror Integration
- The editor uses CodeMirror 6 for text editing
- Language support is provided via @codemirror/lang-* packages
- Custom extensions are in the editor-related modules

### State Management
- Redux is used for global state management
- Use Redux Toolkit (@reduxjs/toolkit) for slices
- Keep state normalized where possible

### Build System
- Uses Electron Forge with webpack
- Main process config: `webpack.main.config.js`
- Renderer process config: `webpack.renderer.config.js`
- Shared rules: `webpack.rules.js`

### Development Commands
- `npm start` - Start development server
- `npm run make` - Build distributable
- `npm run package` - Package without making distributable
- `npm test` - Run tests

### Dependencies
- All dependencies are managed in `package.json`
- Use npm for package management
- Lock file is `package-lock.json`
