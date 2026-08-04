---
description: TypeScript patterns and conventions for Cursor development
alwaysApply: true
---

## TypeScript Guidelines

### Type Safety
- Always use strict TypeScript mode
- Avoid `any` types - use `unknown` if truly needed
- Use proper type guards for runtime type checking
- Leverage TypeScript's type inference where possible

### Interfaces vs Types
- Use `interface` for object shapes that can be extended
- Use `type` for unions, intersections, and utility types
- Prefer `interface` for public APIs

### Component Props
- Define props as interfaces with clear documentation
- Use optional properties (`?`) for non-required props
- Consider using `React.FC` only when explicitly needed

### Async Patterns
- Use async/await over Promise chains
- Always handle errors with try/catch
- Return proper typed Promises

### Imports
- Import types with `import type` when possible
- Keep type imports separate from value imports when beneficial for tree-shaking
