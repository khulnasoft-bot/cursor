---
description: Electron main-renderer IPC communication patterns
alwaysApply: true
globs: ["src/main/**/*", "src/renderer/**/*"]
---

## Electron IPC Guidelines

### Security First
- Be cautious with `@electron/remote` - it has security implications
- Validate all data received from main process
- Never expose sensitive APIs to renderer
- Use contextBridge for secure renderer communication

### IPC Patterns
- Keep IPC calls minimal and efficient
- Batch operations when possible
- Use typed IPC channels
- Handle IPC errors gracefully

### Main Process
- Main process handles OS interactions and window management
- Keep main process code in `src/main/`
- Use proper error handling in main process
- Avoid blocking the main process

### Renderer Process
- Renderer is React-based UI
- Keep renderer code in `src/renderer/`
- Don't access Node.js APIs directly in renderer
- Use IPC for all main process communication

### File Operations
- All file operations should go through main process
- Validate file paths before operations
- Handle file system errors properly
- Respect user permissions
