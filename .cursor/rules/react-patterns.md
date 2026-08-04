---
description: React component structure and patterns
alwaysApply: true
---

## React Component Guidelines

### Component Structure
- Use functional components with hooks
- Keep components small and focused
- Extract complex logic into custom hooks
- Use TypeScript interfaces for props

### Hooks
- Follow Rules of Hooks
- Custom hooks should start with `use`
- Keep hooks pure and side-effect free when possible
- Use `useCallback` and `useMemo` for performance optimization

### State Management
- Use local state for component-specific data
- Use Redux for global application state
- Keep state as close to where it's used as possible
- Avoid prop drilling - use context or Redux instead

### CodeMirror Integration
- Cursor uses CodeMirror 6 for the editor
- Follow existing CodeMirror extension patterns
- Use CodeMirror's state system properly
- Test editor changes carefully

### Performance
- Use `React.memo` for expensive components
- Virtualize long lists
- Avoid unnecessary re-renders
- Profile performance before optimizing
