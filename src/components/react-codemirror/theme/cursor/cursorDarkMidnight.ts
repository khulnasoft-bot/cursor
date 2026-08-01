import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'
import { createTheme } from '../../../../vscodeTheme'

export function cursorDarkMidnightInit(options?: any) {
    const { theme = 'dark', settings = {}, styles = [] } = options || {}
    const { themeOptions, extension } = createTheme({
        theme: theme,
        settings: {
            background: '#1e2127',
            foreground: '#d8dee9',
            caret: '#d8dee9',
            selection: '#434c5e99',
            selectionMatch: '#88c0d066',
            lineHighlight: '#434c5e33',
            gutterBackground: '#1e2127',
            gutterForeground: '#7b88a199',
            gutterActiveForeground: '#d8dee9',
            gutterBorder: '#272930',
            fontFamily:
                'Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono", "Courier New", monospace',
            ...settings,
        },
        styles: [
            {
                tag: [
                    t.keyword,
                    t.operatorKeyword,
                    t.modifier,
                    t.color,
                    t.constant(t.name),
                    t.standard(t.name),
                    t.standard(t.tagName),
                    t.special(t.brace),
                    t.atom,
                    t.bool,
                    t.special(t.variableName),
                ],
                color: '#88c0d0',
            },
            {
                tag: [
                    t.controlKeyword,
                    t.moduleKeyword,
                    t.processingInstruction,
                ],
                color: '#81a1c1',
            },
            {
                tag: [
                    t.name,
                    t.deleted,
                    t.character,
                    t.macroName,
                    t.propertyName,
                    t.variableName,
                    t.labelName,
                    t.definition(t.name),
                ],
                color: '#d8dee9',
            },
            { tag: t.heading, fontWeight: 'bold', color: '#d8dee9' },
            {
                tag: [
                    t.typeName,
                    t.className,
                    t.tagName,
                    t.number,
                    t.changed,
                    t.annotation,
                    t.self,
                    t.namespace,
                ],
                color: '#8fbcbb',
            },
            {
                tag: [t.function(t.variableName), t.function(t.propertyName)],
                color: '#88c0d0',
            },
            { tag: [t.number], color: '#b48ead' },
            {
                tag: [
                    t.operator,
                    t.punctuation,
                    t.separator,
                    t.url,
                    t.escape,
                    t.regexp,
                ],
                color: '#eceff4',
            },
            {
                tag: [t.regexp],
                color: '#bf616a',
            },
            {
                tag: [
                    t.special(t.string),
                    t.string,
                    t.inserted,
                ],
                color: '#a3be8c',
            },
            { tag: [t.angleBracket], color: '#88c0d0' },
            { tag: t.strong, fontWeight: 'bold' },
            { tag: t.emphasis, fontStyle: 'italic' },
            { tag: t.strikethrough, textDecoration: 'line-through' },
            { tag: [t.meta, t.comment], color: '#616e88' },
            { tag: t.link, color: '#88c0d0', textDecoration: 'underline' },
            { tag: t.invalid, color: '#bf616a' },
            ...styles,
        ],
    })

    const themeExtension = EditorView.theme(themeOptions, {
        dark: theme === 'dark',
    })
    extension.push(themeExtension)

    return extension
}

export const cursorDarkMidnight = cursorDarkMidnightInit()
