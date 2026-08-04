---
description: Redux state management patterns using Redux Toolkit
alwaysApply: true
globs: ["src/**/*slice.ts", "src/**/*Slice.ts"]
---

## Redux Guidelines

### Redux Toolkit
- Use `@reduxjs/toolkit` for all Redux code
- Use `createSlice` for reducers and actions
- Use `createAsyncThunk` for async operations
- Leverage Immer for immutable updates

### State Structure
- Keep state normalized where possible
- Use selectors to access state
- Avoid deeply nested state
- Structure state by feature/domain

### Async Operations
- Use `createAsyncThunk` for async actions
- Handle pending, fulfilled, and rejected states
- Use extraReducers for async thunks
- Provide loading states for UI feedback

### Performance
- Use `reselect` for memoized selectors
- Avoid unnecessary re-renders
- Keep state updates minimal
- Use Redux DevTools for debugging

### Best Practices
- One slice per feature
- Keep slices focused and small
- Use TypeScript for type safety
- Document complex state logic
