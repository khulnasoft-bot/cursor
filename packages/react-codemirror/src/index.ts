/**
 * @cursor/react-codemirror
 * React wrapper for CodeMirror 6 with Cursor-specific theming
 */

// Main component
export { ReactCodeMirror, type ReactCodeMirrorProps, type ReactCodeMirrorRef } from './ReactCodeMirror'
export { default } from './ReactCodeMirror'

// Themes
export {
    cursorDark,
    cursorDarkTheme,
    cursorLight,
    cursorLightTheme,
    cursorMidnight,
    cursorMidnightTheme,
    type Theme
} from './theme'