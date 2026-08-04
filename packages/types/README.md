# @cursor/types

TypeScript type definitions for Cursor components and services.

## Installation

```bash
npm install @cursor/types
```

## Usage

```typescript
import { File, Folder, ChatState, IFileService, IAIService } from '@cursor/types'

// Use types in your application
const file: File = {
    parentFolderId: 0,
    name: 'example.ts',
    renameName: null,
    isSelected: false,
    saved: true
}

// Implement service interfaces
class MyFileService implements IFileService {
    async indexDirectory(directoryPath: string, options?: any): Promise<void> {
        // Implementation
    }
    // ... other methods
}
```

## Available Types

### Window State Types
- `File` - File representation
- `Folder` - Folder representation
- `Tab` - Tab representation
- `Pane` - Pane representation
- `ChatState` - Chat state management
- `Settings` - Application settings
- `FullState` - Complete application state

### Service Interfaces
- `IFileService` - File indexing and search service
- `IAIService` - AI service with multi-provider support
- `IRuleService` - Rules engine for code analysis
- `IAutomationService` - Workflow automation service
- `IAgentExecService` - Agent execution service
- `IComposerService` - Multi-file editing orchestration

### Common Types
- `Logger` - Logger interface
- `AIContext` - AI context for prompts
- `Tool` - Tool definition for AI
- `AutomationWorkflow` - Workflow definition
- `FileChange` - File change representation

## License

MIT