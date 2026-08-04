---
description: Testing guidelines and practices for the Cursor project
---

## Testing Guidelines

### Test Framework
- Jest is configured for testing
- Test files should be co-located with source files or in a `__tests__` directory
- Use `.test.ts` or `.test.tsx` suffix for test files

### Running Tests
- `npm test` - Run all tests
- Tests are configured via Jest settings in package.json

### Testing Principles
- Write unit tests for utility functions
- Test React components with appropriate testing utilities
- Mock external dependencies (file system, network, etc.)
- Keep tests fast and focused

### When to Add Tests
- Add tests for new utility functions
- Test complex business logic
- Add regression tests for bug fixes
- Test critical user flows

### Test Coverage
- Aim for meaningful coverage rather than 100%
- Focus on critical paths and error handling
- Use tests as documentation for expected behavior
