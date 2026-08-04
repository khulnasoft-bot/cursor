# @cursor/utils

Utility functions for Cursor components and services.

## Installation

```bash
npm install @cursor/utils
```

## Usage

```typescript
import {
    // Error handling
    ExpectedBackendError,
    NoAuthRateLimitError,
    isExpectedError,

    // Streaming
    streamSource,
    anotherStreamSource,

    // Platform utilities
    getPlatformInfo,
    joinPaths,
    joinPathsAdvanced,

    // Text processing
    removeBeginningAndEndingLineBreaks,
    truncate,
    toCamelCase,

    // Algorithms
    topologicalSort,
    buildDependencyGraph,
    debounce,
    throttle
} from '@cursor/utils'

// Example: Platform detection
const platform = getPlatformInfo()
console.log(`Running on ${platform.IS_MAC ? 'macOS' : platform.IS_WINDOWS ? 'Windows' : 'Linux'}`)

// Example: Path joining
const path = joinPaths('/home/user', 'documents')
const advancedPath = joinPathsAdvanced('/home/user/project', '../other/file.txt')

// Example: Text processing
const cleanText = removeBeginningAndEndingLineBreaks('\n\nHello World\n\n')
const shortText = truncate('This is a very long string', 10)

// Example: Topological sort
const nodes = [
    { id: 'a', data: {}, dependencies: ['b', 'c'] },
    { id: 'b', data: {}, dependencies: [] },
    { id: 'c', data: {}, dependencies: ['b'] }
]
const sorted = topologicalSort(nodes) // ['b', 'c', 'a']

// Example: Debouncing
const debouncedSearch = debounce((query: string) => {
    console.log('Searching for:', query)
}, 300)
```

## Available Utilities

### Error Handling
- `ExpectedBackendError` - Base class for expected errors
- `NoAuthRateLimitError` - Rate limit error for unauthenticated requests
- `AuthRateLimitError` - Rate limit error for authenticated requests
- `NoAuthLocalRateLimitError` - Local rate limit error
- `NoAuthGlobalOldRateLimitError` - Global old rate limit error
- `NoAuthGlobalNewRateLimitError` - Global new rate limit error
- `OpenAIError` - Base OpenAI error
- `BadOpenAIAPIKeyError` - Invalid API key error
- `BadModelError` - Invalid model error
- `NotLoggedInError` - Not logged in error
- `isExpectedError()` - Type guard for expected errors

### Streaming
- `streamSource()` - Stream data from server-sent events
- `anotherStreamSource()` - Alternative streaming function
- `streamWithParser()` - Stream with custom parser

### Platform Utilities
- `getPlatformInfo()` - Get platform information
- `joinPaths()` - Join path parts
- `joinPathsAdvanced()` - Advanced path joining with ./ and ../ support
- `normalizePath()` - Normalize path for current platform
- `getExtension()` - Get file extension
- `getFileName()` - Get file name
- `getDirectoryName()` - Get directory name

### Text Processing
- `removeBeginningAndEndingLineBreaks()` - Remove leading/trailing line breaks
- `removeWhitespace()` - Remove all whitespace
- `truncate()` - Truncate string to max length
- `capitalize()` - Capitalize first letter
- `toCamelCase()` - Convert to camelCase
- `toSnakeCase()` - Convert to snake_case
- `toKebabCase()` - Convert to kebab-case
- `toPascalCase()` - Convert to PascalCase
- `countWords()` - Count words in string
- `countLines()` - Count lines in string
- `isEmpty()` - Check if string is empty
- `reverse()` - Reverse string
- `removeDuplicateLines()` - Remove duplicate lines
- `sortLines()` - Sort lines alphabetically
- `escapeRegex()` - Escape regex characters
- `unescapeRegex()` - Unescape regex characters

### Algorithms
- `topologicalSort()` - Topological sort for dependency graphs
- `buildDependencyGraph()` - Build dependency graph
- `detectCycles()` - Detect cycles in graphs
- `levenshteinDistance()` - Calculate string distance
- `stringSimilarity()` - Calculate string similarity
- `debounce()` - Debounce function execution
- `throttle()` - Throttle function execution
- `deepClone()` - Deep clone objects
- `generateId()` - Generate unique IDs
- `sleep()` - Sleep for duration
- `retryWithBackoff()` - Retry with exponential backoff

## License

MIT