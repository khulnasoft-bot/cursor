# @cursor/react-codemirror

React wrapper for CodeMirror 6 with Cursor-specific theming.

## Installation

```bash
npm install @cursor/react-codemirror
npm install react @codemirror/state @codemirror/view
```

## Usage

```typescript
import ReactCodeMirror from '@cursor/react-codemirror'
import { cursorDark } from '@cursor/react-codemirror/theme'

function MyEditor() {
    const [code, setCode] = React.useState('Hello World')

    return (
        <ReactCodeMirror
            value={code}
            onChange={setCode}
            theme={cursorDark()}
            height="500px"
            width="100%"
        />
    )
}
```

## Features

- **React Integration**: Full React component with hooks and refs
- **Cursor Themes**: Includes Cursor's dark, light, and midnight themes
- **Image Support**: Automatic image file detection and display
- **Custom Extensions**: Support for custom CodeMirror extensions
- **Controlled Component**: Full control over editor state
- **TypeScript**: Complete TypeScript support

## API

### ReactCodeMirror

#### Props

- `value?: string` - Editor content
- `onChange?: (value: string, viewUpdate: ViewUpdate) => void` - Change handler
- `theme?: 'light' | 'dark' | 'none' | Extension` - Editor theme
- `height?: string` - Editor height
- `width?: string` - Editor width
- `minHeight?: string` - Minimum height
- `maxHeight?: string` - Maximum height
- `minWidth?: string` - Minimum width
- `maxWidth?: string` - Maximum width
- `autoFocus?: boolean` - Auto focus on mount
- `placeholder?: string | HTMLElement` - Placeholder text
- `editable?: boolean` - Enable editing (default: true)
- `readOnly?: boolean` - Read-only mode (default: false)
- `indentWithTab?: boolean` - Use tab for indentation (default: true)
- `extensions?: Extension[]` - Custom CodeMirror extensions
- `root?: ShadowRoot | Document` - Custom root element
- `fileName?: string` - File name (for image detection)
- `filePath?: string` - File path (for image display)
- `onCreateEditor?: (view: EditorView, state: EditorState) => void` - Editor creation callback
- `onUpdate?: (viewUpdate: ViewUpdate) => void` - Update callback
- `onPostCreate?: (view: EditorView, state: EditorState) => void` - Post-creation callback
- `customDispatch?: (view: EditorView, tr: Transaction) => void` - Custom dispatch handler

#### Ref

The component exposes a ref with the following interface:

```typescript
interface ReactCodeMirrorRef {
    editor?: HTMLDivElement | null
    state?: EditorState
    view?: EditorView
}
```

## Themes

### Cursor Dark
```typescript
import { cursorDark } from '@cursor/react-codemirror/theme'

<ReactCodeMirror theme={cursorDark()} />
```

### Cursor Light
```typescript
import { cursorLight } from '@cursor/react-codemirror/theme'

<ReactCodeMirror theme={cursorLight()} />
```

### Cursor Midnight
```typescript
import { cursorMidnight } from '@cursor/react-codemirror/theme'

<ReactCodeMirror theme={cursorMidnight()} />
```

### Custom Theme
```typescript
import { EditorView } from '@codemirror/view'

const customTheme = EditorView.theme({
    '&': { backgroundColor: '#1e1e1e' },
    '.cm-content': { color: '#d4d4d4' }
})

<ReactCodeMirror theme={customTheme} />
```

## Examples

### Basic Editor
```typescript
import ReactCodeMirror from '@cursor/react-codemirror'

function App() {
    return (
        <ReactCodeMirror
            value="const hello = 'world';"
            height="400px"
        />
    )
}
```

### Controlled Component
```typescript
import React, { useState } from 'react'
import ReactCodeMirror from '@cursor/react-codemirror'

function App() {
    const [code, setCode] = useState('const hello = "world";')

    return (
        <ReactCodeMirror
            value={code}
            onChange={setCode}
            height="400px"
        />
    )
}
```

### With Custom Theme
```typescript
import ReactCodeMirror from '@cursor/react-codemirror'
import { cursorDark } from '@cursor/react-codemirror/theme'

function App() {
    return (
        <ReactCodeMirror
            value="const hello = 'world';"
            theme={cursorDark()}
            height="400px"
        />
    )
}
```

### With Ref Access
```typescript
import React, { useRef } from 'react'
import ReactCodeMirror, { ReactCodeMirrorRef } from '@cursor/react-codemirror'

function App() {
    const editorRef = useRef<ReactCodeMirrorRef>(null)

    const handleFocus = () => {
        editorRef.current?.view?.focus()
    }

    return (
        <div>
            <button onClick={handleFocus}>Focus Editor</button>
            <ReactCodeMirror
                ref={editorRef}
                value="const hello = 'world';"
                height="400px"
            />
        </div>
    )
}
```

### With Image Support
```typescript
import ReactCodeMirror from '@cursor/react-codemirror'

function App() {
    return (
        <ReactCodeMirror
            fileName="screenshot.png"
            filePath="/path/to/screenshot.png"
            height="400px"
        />
    )
}
```

### With Custom Extensions
```typescript
import ReactCodeMirror from '@cursor/react-codemirror'
import { lineNumbers } from '@codemirror/view'

function App() {
    return (
        <ReactCodeMirror
            value="const hello = 'world';"
            extensions={[lineNumbers()]}
            height="400px"
        />
    )
}
```

## Image File Support

The component automatically detects image files by extension and displays them instead of the editor. Supported image extensions:

- `.png`
- `.jpg`, `.jpeg`
- `.gif`
- `.svg`
- `.webp`
- `.bmp`

```typescript
<ReactCodeMirror
    fileName="screenshot.png"
    filePath="/path/to/screenshot.png"
/>
```

## TypeScript Support

The package includes full TypeScript definitions:

```typescript
import ReactCodeMirror, { ReactCodeMirrorRef, ReactCodeMirrorProps } from '@cursor/react-codemirror'

const MyEditor = React.forwardRef<ReactCodeMirrorRef, ReactCodeMirrorProps>(
    (props, ref) => {
        return <ReactCodeMirror ref={ref} {...props} />
    }
)
```

## Browser Support

The component supports all modern browsers that support:
- React 18+
- ES2020+
- CodeMirror 6

## Performance Considerations

- **Large Files**: For very large files, consider using virtualization or chunking
- **Frequent Updates**: Debounce onChange handlers for frequent updates
- **Memory**: Clean up editor instances when unmounting
- **Extensions**: Be selective with extensions to avoid performance overhead

## Migration from Cursor

This component is extracted from Cursor's editor and maintains API compatibility:

```typescript
// Before (in Cursor)
<ReactCodeMirror
    viewKey={tabId}
    tabId={tabId}
    value={content}
    onChange={handleChange}
/>

// After (standalone)
<ReactCodeMirror
    value={content}
    onChange={handleChange}
/>
```

The main differences:
- `viewKey` and `tabId` are no longer required
- Themes are imported separately
- Some Cursor-specific features are simplified

## License

MIT