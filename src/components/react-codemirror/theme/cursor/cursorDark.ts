import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { StyleSpec } from 'style-mod'
import { createTheme } from '../../../../vscodeTheme'

export function cursorDarkInit(options?: any) {
    const { theme = 'dark', settings = {}, styles = [] } = options || {}
    const { themeOptions, extension } = createTheme({
        theme: theme,
        settings: {
            background: '#141414',
            foreground: '#F0F0F0',
            caret: '#F0F0F0',
            selection: '#F0F0F030',
            selectionMatch: '#88C0D033',
            lineHighlight: '#434c5e33',
            gutterBackground: '#181818',
            gutterForeground: '#F0F0F0BD',
            gutterActiveForeground: '#F0F0F0',
            gutterBorder: '#F0F0F013',
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
                color: '#88C0D0',
            },
            {
                tag: [
                    t.controlKeyword,
                    t.moduleKeyword,
                    t.processingInstruction,
                ],
                color: '#81A1C1',
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
                color: '#D8DEE9',
            },
            { tag: t.heading, fontWeight: 'bold', color: '#D8DEE9' },
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
                color: '#8FBCBB',
            },
            {
                tag: [t.function(t.variableName), t.function(t.propertyName)],
                color: '#88C0D0',
            },
            { tag: [t.number], color: '#B48EAD' },
            {
                tag: [
                    t.operator,
                    t.punctuation,
                    t.separator,
                    t.url,
                    t.escape,
                    t.regexp,
                ],
                color: '#ECEFF4',
            },
            {
                tag: [t.regexp],
                color: '#BF616A',
            },
            {
                tag: [
                    t.special(t.string),
                    t.string,
                    t.inserted,
                ],
                color: '#A3BE8C',
            },
            { tag: [t.angleBracket], color: '#88C0D0' },
            { tag: t.strong, fontWeight: 'bold' },
            { tag: t.emphasis, fontStyle: 'italic' },
            { tag: t.strikethrough, textDecoration: 'line-through' },
            { tag: [t.meta, t.comment], color: '#616E88' },
            { tag: t.link, color: '#88C0D0', textDecoration: 'underline' },
            { tag: t.invalid, color: '#BF616A' },
            ...styles,
        ],
    })

    const themeExtension = EditorView.theme(themeOptions, {
        dark: theme === 'dark',
    })
    extension.push(themeExtension)

    return extension
}

export const cursorDark = cursorDarkInit()
