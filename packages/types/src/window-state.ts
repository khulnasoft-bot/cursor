/**
 * Window and Application State Type Definitions
 * Extracted from Cursor's state management system
 */

/**
 * Represents a file in the file system
 */
export interface File {
    parentFolderId: number
    name: string
    renameName: string | null
    isSelected: boolean
    saved: boolean
    indentUnit?: string
    latestAccessTime?: number
    lastSavedTime?: number
    savedTime?: number
    deleted?: boolean
}

/**
 * Represents a folder in the file system
 */
export interface Folder {
    parentFolderId: number | null
    name: string
    renameName: string | null
    fileIds: number[]
    folderIds: number[]
    loaded: boolean
    isOpen: boolean
}

/**
 * Hover state for UI elements
 */
export enum HoverState {
    None = 0,
    Full = 1,
    Right = 2,
    Left = 3,
    Top = 4,
    Bottom = 5,
}

/**
 * Represents a pane in the split-pane layout
 */
export interface Pane {
    contents: string
    isActive: boolean
    tabIds: number[]
}

/**
 * Folder data structure with files and folders
 */
export type FolderData = {
    folders: { [key: number]: Folder }
    files: { [key: number]: File }
}

/**
 * Pane state management
 */
export interface PaneState {
    bySplits: any
    byIds: { [key: number]: Pane }
}

/**
 * Represents a tab in the editor
 */
export interface Tab {
    isActive: boolean
    isReady: number
    fileId: number
    paneId: number
    isChat: boolean
    isReadOnly: boolean
    generating: boolean
    interrupted: boolean
    isMulti: boolean
    isMultiDiff: boolean
}

/**
 * Cached file content with access counter
 */
export interface CachedFile {
    contents: string
    counter: number
}

/**
 * Custom transaction for editor state
 */
export interface ReduxTransaction {
    transactionId: number
    transactionFunction: any // CustomTransaction | CustomTransaction[]
}

/**
 * Editor state representation
 */
export interface ReduxEditorState {
    history: {
        done?: any[]
        undone?: any[]
    }
    doc: string
    selection: {
        main: number
        ranges: {
            anchor: number
            number: number
        }[]
    }
}

/**
 * Cached tab with editor state and transactions
 */
export interface CachedTab {
    initialEditorState: ReduxEditorState | null
    pendingTransactions: ReduxTransaction[]
    scrollPos: number | null
    vimState: any
}

/**
 * Repository progress state
 */
export interface RepoProgress {
    progress: number
    state: 'notStarted' | 'uploading' | 'indexing' | 'done' | 'error'
}

/**
 * Main application state
 */
export interface State {
    repoId: string | null
    repoProgress: RepoProgress
    paneState: PaneState
    rightClickId: number | null
    isRightClickAFile: boolean | null
    rootPath: string | null
    folders: { [key: number]: Folder }
    files: { [key: number]: File }
    tabs: { [key: number]: Tab }
    fileCache: { [key: string]: CachedFile }
    tabCache: { [key: string]: CachedTab }
    keyboardBindings: { [key: string]: any }
    draggingTabId: number | null
    zoomFactor: number
    showError: boolean
    showRateLimit: boolean
    showNoAuthRateLimit: boolean
    errorValue: any
    errorType: string
    errorInfo: string
    version: string
    showRemotePopup: boolean
    remoteCommand: string
    remotePath: string
    remoteBad: boolean
    isNotFirstTime: boolean
    terminalOpen: boolean
}

/**
 * Diff span for code changes
 */
export interface DiffSpan {
    type: 'diff'
    fileId: number
    origSpanId: number
    startLine: number
    endLine: number
    text: string
    mode: 'accepted' | 'rejected' | 'showed' | 'showing' | 'generating' | 'creating'
}

/**
 * Diff representation
 */
export interface Diff {
    content: DiffSpan
    id: number
}

/**
 * Code span for referencing code
 */
export interface CodeSpan {
    type: 'code'
    fileId: number
    startLine: number
    endLine: number
    text: string
}

/**
 * Text span for chat messages
 */
export interface TextSpan {
    type: 'text'
    text: string
}

/**
 * Bot text span
 */
export interface BotTextSpan {
    type: 'botText'
    text: string
}

/**
 * New code span for AI-generated code
 */
export interface NewCodeSpan {
    type: 'newCode'
    text: string
    language: string
    shouldEdit?: boolean
}

/**
 * User chat span types
 */
export type UserChatSpan = CodeSpan | TextSpan

/**
 * Bot chat span types
 */
export type BotChatSpan = TextSpan | NewCodeSpan | DiffSpan | BotTextSpan

/**
 * Chat message representation
 */
export interface ChatMessage {
    fromMe: boolean
    spanIds: number[]
}

/**
 * Conversation representation
 */
export interface Conversation {
    messageIds: number[]
    isBotWriting: boolean
}

/**
 * Bot message types
 */
export type BotMessageType =
    | 'edit'
    | 'continue'
    | 'markdown'
    | 'multifile'
    | 'location'
    | 'interrupt'
    | 'chat_edit'
    | 'lsp_edit'

/**
 * Bot message structure
 */
export interface BotMessage {
    sender: 'bot'
    sentAt: number
    type: BotMessageType
    conversationId: string
    message: string
    currentFile: string | null
    lastToken: string
    finished: boolean
    interrupted: boolean
    rejected?: boolean
    hitTokenLimit?: boolean
    maxOrigLine?: number
    useDiagnostics?: boolean | number
}

/**
 * Code block for referencing in chat
 */
export interface CodeBlock {
    fileId: number
    text: string
    startLine: number
    endLine: number
}

/**
 * Code symbol types
 */
export type CodeSymbolType = 'import' | 'function' | 'class' | 'variable'

/**
 * Code symbol representation
 */
export interface CodeSymbol {
    fileName: string
    name: string
    type: CodeSymbolType
}

/**
 * User message structure
 */
export interface UserMessage {
    sender: 'user'
    conversationId: string
    message: string
    msgType: ResponseType
    sentAt: number
    currentFile: string | null
    precedingCode: string | null
    procedingCode: string | null
    currentSelection: string | null
    otherCodeBlocks: CodeBlock[]
    codeSymbols: CodeSymbol[]
    selection: { from: number; to: number } | null
    maxOrigLine?: number
}

/**
 * Message union type
 */
export type Message = UserMessage | BotMessage

/**
 * Response types for AI interactions
 */
export type ResponseType =
    | 'idk'
    | 'freeform'
    | 'generate'
    | 'edit'
    | 'chat_edit'
    | 'lsp_edit'

/**
 * Chat state management
 */
export interface ChatState {
    generating: boolean
    pos?: number
    msgType?: ResponseType
    isCommandBarOpen: boolean
    commandBarText: string
    conversations: string[]
    currentConversationId: string
    draftMessages: { [key: string]: UserMessage }
    userMessages: UserMessage[]
    botMessages: BotMessage[]
    fireCommandK: boolean
    chatIsOpen: boolean
    chatHistoryIsOpen: boolean
    commandBarHistoryIndex: number
}

/**
 * Application settings
 */
export interface Settings {
    keyBindings: 'none' | 'vim' | 'emacs'
    useFour: string
    contextType: string
    textWrapping: string
    openAIKey?: string
    useOpenAIKey?: boolean
    openAIModel?: string
    tabSize?: string
}

/**
 * Settings state
 */
export interface SettingsState {
    settings: Settings
    isOpen: boolean
}

/**
 * Line change for fixes
 */
export interface LineChange {
    startLine: number
    endLine: number
    newText: string
}

/**
 * LSP fix file representation
 */
export interface FixLSPFile {
    changes: LineChange[]
    doDiagnosticsExist: boolean
}

/**
 * LSP fix state
 */
export interface FixLSPState {
    fixes: { [key: number]: FixLSPFile }
}

/**
 * Comment function representation
 */
export interface CommentFunction {
    comment: string
    description: string
    originalFunctionBody: string
    marked?: boolean
}

/**
 * Comment state
 */
export interface CommentState {
    fileThenNames: { [key: string]: { [key: string]: CommentFunction } }
}

/**
 * Tool state for UI management
 */
export interface ToolState {
    openLeftTab: 'search' | 'filetree'
    leftTabActive: boolean
    fileSearchTriggered: boolean
    commandPaletteTriggered: boolean
    aiCommandPaletteTriggered: boolean
    leftSideExpanded: boolean
    cursorLogin: {
        accessToken?: string
        profile?: string
        stripeId?: string
    }
    composerPanelOpen: boolean
}

/**
 * Logging state
 */
export interface LoggingState {
    feedbackMessage: string
    isOpen: boolean
}

/**
 * Language server representation
 */
export interface LanguageServer {
    languageServer: string
    installed: boolean
    running: boolean
}

/**
 * Language server state
 */
export interface LanguageServerState {
    languageServers: { [key: string]: LanguageServer }
    copilotSignedIn: boolean
    copilotEnabled: boolean
}

/**
 * Full application state
 */
export interface FullState {
    global: State
    chatState: ChatState
    settingsState: SettingsState
    toolState: ToolState
    loggingState: LoggingState
    languageServerState: LanguageServerState
    commentState: CommentState
    fixLSPState: FixLSPState
}

/**
 * Initial logging state
 */
export const initialLoggingState: LoggingState = {
    feedbackMessage: '',
    isOpen: false,
}

/**
 * Initial chat state
 */
export const initialChatState: ChatState = {
    generating: false,
    isCommandBarOpen: false,
    currentConversationId: '',
    commandBarText: '',
    conversations: [],
    userMessages: [],
    botMessages: [],
    draftMessages: {},
    fireCommandK: false,
    chatIsOpen: false,
    chatHistoryIsOpen: false,
    commandBarHistoryIndex: -1,
}

/**
 * Initial settings state
 */
export const initialSettingsState: SettingsState = {
    isOpen: false,
    settings: {
        keyBindings: 'none',
        useFour: 'disabled',
        contextType: 'none',
        textWrapping: 'disabled',
        tabSize: undefined,
    },
}

/**
 * Helper function to get next ID value
 */
export function nextValue(keys: string[]): number {
    if (keys.length === 0) {
        return 1
    } else {
        return Math.max(...keys.map((x) => parseInt(x))) + 1
    }
}

/**
 * Helper function to get next ID from object
 */
export function nextId(byIds: object): number {
    return nextValue(Object.keys(byIds))
}