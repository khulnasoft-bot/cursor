import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'
import { createTheme } from '../../../../vscodeTheme'

export function cursorLightInit(options?: any) {
    const { theme = 'light', settings = {}, styles = [] } = options || {}
    const { themeOptions, extension } = createTheme({
        theme: theme,
        settings: {
            background: '#F3F3F3',
            foreground: '#141414',
            caret: '#141414',
            selection: '#14141411',
            selectionMatch: '#20659533',
            lineHighlight: '#1414140F',
            gutterBackground: '#F3F3F3',
            gutterForeground: '#141414BD',
            gutterActiveForeground: '#141414',
            gutterBorder: '#1414141C',
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
                color: '#206595',
            },
            {
                tag: [
                    t.controlKeyword,
                    t.moduleKeyword,
                    t.processingInstruction,
                ],
                color: '#3C7CAB',
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
                color: '#141414',
            },
            { tag: t.heading, fontWeight: 'bold', color: '#141414' },
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
                color: '#55A583',
            },
            {
                tag: [t.function(t.variableName), t.function(t.propertyName)],
                color: '#3C7CAB',
            },
            { tag: [t.number], color: '#C08532' },
            {
                tag: [
                    t.operator,
                    t.punctuation,
                    t.separator,
                    t.url,
                    t.escape,
                    t.regexp,
                ],
                color: '#141414',
            },
            {
                tag: [t.regexp],
                color: '#CF2D56',
            },
            {
                tag: [
                    t.special(t.string),
                    t.string,
                    t.inserted,
                ],
                color: '#1F8A65',
            },
            { tag: [t.angleBracket], color: '#206595' },
            { tag: t.strong, fontWeight: 'bold' },
            { tag: t.emphasis, fontStyle: 'italic' },
            { tag: t.strikethrough, textDecoration: 'line-through' },
            { tag: [t.meta, t.comment], color: '#616E88' },
            { tag: t.link, color: '#206595', textDecoration: 'underline' },
            { tag: t.invalid, color: '#CF2D56' },
            ...styles,
        ],
    })

    const themeExtension = EditorView.theme(themeOptions, {
        dark: theme === 'dark',
    })
    extension.push(themeExtension)

    return extension
}

export const cursorLight = cursorLightInit()
