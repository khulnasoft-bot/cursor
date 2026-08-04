import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react'
import {
    EditorState,
    EditorStateConfig,
    Extension,
    Transaction,
} from '@codemirror/state'
import { EditorView } from '@codemirror/view'

// Define Transaction type for compatibility
type CMTransaction = Transaction

export interface ReactCodeMirrorProps
    extends Omit<EditorStateConfig, 'doc' | 'extensions'>,
        Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'placeholder'> {
    /** value of the auto created model in the editor. */
    value?: string
    fileName?: string
    filePath?: string
    height?: string
    minHeight?: string
    maxHeight?: string
    width?: string
    minWidth?: string
    maxWidth?: string
    /** focus on the editor. */
    autoFocus?: boolean
    /** Enables a placeholder—a piece of example content to show when the editor is empty. */
    placeholder?: string | HTMLElement
    /**
     * Theme for the editor - 'light' | 'dark' | 'none' | Extension
     * @default light
     */
    theme?: 'light' | 'dark' | 'none' | Extension
    /**
     * Whether to include basic setup by default
     * @default true
     */
    basicSetup?: boolean
    /**
     * This disables editing of the editor content by the user.
     * @default true
     */
    editable?: boolean
    /**
     * This disables editing of the editor content by the user.
     * @default false
     */
    readOnly?: boolean
    /**
     * Whether to use tab for indentation
     * @default true
     */
    indentWithTab?: boolean
    /** Fired whenever a change occurs to the document. */
    onChange?(value: string): void
    /** Fired whenever any state change occurs within the editor, including non-document changes like lint results. */
    onUpdate?(): void
    onPostCreate?(view: EditorView): void
    customDispatch?(view: EditorView, tr: CMTransaction): void
    /** The first time the editor executes the event. */
    onCreateEditor?(view: EditorView): void
    /**
     * Extension values can be provided when creating a state to attach various kinds of configuration and behavior information.
     */
    extensions?: Extension[]
    /**
     * If the view is going to be mounted in a shadow root or document other than the one held by the global variable document (the default), you should pass it here.
     */
    root?: ShadowRoot | Document
    /**
     * Create a state from its JSON representation
     */
    initialState?: {
        json: any
        fields?: Record<string, any>
    }
}

export interface ReactCodeMirrorRef {
    editor?: HTMLDivElement | null
    state?: EditorState
    view?: EditorView
}

export const ReactCodeMirror = forwardRef<
    ReactCodeMirrorRef,
    ReactCodeMirrorProps
>((props, ref) => {
    const {
        className,
        value = '',
        extensions = [],
        onChange,
        onCreateEditor,
        onUpdate,
        onPostCreate,
        customDispatch,
        autoFocus,
        theme = 'light',
        height,
        minHeight,
        maxHeight,
        width,
        minWidth,
        maxWidth,
        basicSetup = true,
        placeholder,
        indentWithTab = true,
        editable = true,
        readOnly = false,
        root,
        initialState,
        fileName,
        filePath,
        ...other
    } = props

    const editor = useRef<HTMLDivElement>(null)
    const viewRef = useRef<EditorView | undefined>(undefined)
    const stateRef = useRef<EditorState | undefined>(undefined)

    useImperativeHandle(
        ref,
        () => ({ editor: editor.current, state: stateRef.current, view: viewRef.current }),
        [editor]
    )

    // Initialize editor
    useEffect(() => {
        if (!editor.current) return

        // Create basic extensions
        const basicExtensions: Extension[] = []

        if (basicSetup) {
            // Add basic line numbers, highlighting, etc.
            // This is a simplified version - full implementation would include more features
        }

        if (theme !== 'none') {
            // Add theme extension
            // This would be implemented with actual theme extensions
        }

        // Combine all extensions
        const allExtensions = [...basicExtensions, ...extensions]

        // Create editor state
        const state = EditorState.create({
            doc: value,
            extensions: allExtensions,
        })

        stateRef.current = state

        // Create editor view
        const view = new EditorView({
            state,
            parent: editor.current,
            root,
            dispatch: (tr) => {
                viewRef.current?.update([tr])
                if (onChange && viewRef.current) {
                    onChange(viewRef.current.state.doc.toString())
                }
                if (customDispatch && viewRef.current) {
                    customDispatch(viewRef.current, tr)
                }
            }
        })

        viewRef.current = view

        if (onCreateEditor) {
            onCreateEditor(view)
        }

        // Auto focus if requested
        if (autoFocus) {
            view.focus()
        }

        if (onPostCreate) {
            onPostCreate(view)
        }

        return () => {
            view.destroy()
        }
    }, []) // Only run on mount

    // Update value when prop changes
    useEffect(() => {
        if (viewRef.current && value !== undefined && value !== viewRef.current.state.doc.toString()) {
            const transaction = viewRef.current.state.update({
                changes: { from: 0, to: viewRef.current.state.doc.length, insert: value }
            })
            viewRef.current.dispatch(transaction)
        }
    }, [value])

    // Handle view updates
    useEffect(() => {
        if (viewRef.current && onUpdate) {
            onUpdate()
        }
    }, [onUpdate])

    // check type of value
    if (value !== undefined && typeof value !== 'string') {
        throw new Error(`value must be typeof string but got ${typeof value}`)
    }

    const defaultClassNames =
        typeof theme === 'string' ? `cm-theme-${theme}` : 'cm-theme'

    function isImageFile(fileName: string): boolean {
        const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp']
        const extension = fileName.split('.').pop()?.toLowerCase()
        return extension !== undefined && imageExtensions.includes(extension)
    }

    const isImage = fileName && isImageFile(fileName)

    return (
        <>
            {isImage ? (
                <img
                    src={filePath ? `file://${filePath}` : undefined}
                    alt={fileName}
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                />
            ) : (
                <div
                    ref={editor}
                    className={`${defaultClassNames}${
                        className ? ` ${className}` : ''
                    }`}
                    style={{
                        height,
                        minHeight,
                        maxHeight,
                        width,
                        minWidth,
                        maxWidth,
                    }}
                    {...other}
                />
            )}
        </>
    )
})

ReactCodeMirror.displayName = 'ReactCodeMirror'

export default ReactCodeMirror