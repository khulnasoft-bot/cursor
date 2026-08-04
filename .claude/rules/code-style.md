---
description: Code style and formatting guidelines for the Cursor project
---

## Code Style Guidelines

### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow the existing ESLint configuration in `.eslintrc.json`
- Use Prettier for formatting (configured in `.prettierrc`)
- Run `npm run format` before committing changes
- Run `npm run lint` to check for linting issues

### React Components
- Use functional components with hooks
- Follow the existing component structure in `src/`
- Use TypeScript interfaces for props
- Keep components focused and single-purpose

### File Organization
- Main process code goes in `src/main/`
- Renderer process code goes in `src/renderer/`
- Shared utilities go in `src/util/`
- Follow the existing directory structure

### Imports
- Use absolute imports where possible (configured in webpack)
- Group imports: React/third-party, internal types, internal components
- Order: external libraries, internal modules, relative imports

### Git Workflow
- Use conventional commit messages
- Run `npm run precommit` (via husky) before committing
- The project uses pretty-quick for staged file formatting
