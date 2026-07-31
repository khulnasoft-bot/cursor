/**
 * @-Mention Context System
 * Allows users to reference specific files, symbols, and codebase context in chat
 */

export interface Mention {
    type: 'file' | 'symbol' | 'codebase' | 'directory'
    value: string
    range?: { start: number; end: number }
    filePath?: string
    symbolName?: string
    symbolType?: 'function' | 'class' | 'variable' | 'type' | 'interface'
}

export interface MentionContext {
    files: string[]
    symbols: Array<{ name: string; type: string; filePath: string }>
    directories: string[]
    codebase: boolean
}

export interface ParsedMessage {
    text: string
    mentions: Mention[]
    cleanedText: string
}

export class MentionParser {
    private mentionRegex = /@([a-zA-Z0-9_./-]+)/g

    parseMessage(message: string): ParsedMessage {
        const mentions: Mention[] = []
        let cleanedText = message
        let match

        // Reset regex
        this.mentionRegex.lastIndex = 0

        while ((match = this.mentionRegex.exec(message)) !== null) {
            const fullMatch = match[0]
            const mentionValue = match[1]
            const startIndex = match.index

            const mention = this.parseMention(mentionValue, startIndex)
            if (mention) {
                mentions.push(mention)
            }

            // Remove mention from cleaned text
            cleanedText = cleanedText.replace(fullMatch, '')
        }

        // Clean up extra whitespace
        cleanedText = cleanedText.replace(/\s+/g, ' ').trim()

        return {
            text: message,
            mentions,
            cleanedText
        }
    }

    public parseMention(value: string, index: number): Mention | null {
        // File mention: @file:path/to/file.ts
        if (value.startsWith('file:')) {
            return {
                type: 'file',
                value: value.substring(5),
                range: { start: index, end: index + value.length + 1 }
            }
        }

        // Directory mention: @dir:path/to/directory
        if (value.startsWith('dir:')) {
            return {
                type: 'directory',
                value: value.substring(4),
                range: { start: index, end: index + value.length + 1 }
            }
        }

        // Symbol mention: @symbol:SymbolName or @symbol:SymbolName@file
        if (value.startsWith('symbol:')) {
            const parts = value.substring(7).split('@')
            const symbolName = parts[0]
            const filePath = parts[1]

            return {
                type: 'symbol',
                value: symbolName,
                symbolName,
                filePath,
                range: { start: index, end: index + value.length + 1 }
            }
        }

        // Codebase mention: @codebase
        if (value === 'codebase') {
            return {
                type: 'codebase',
                value: 'codebase',
                range: { start: index, end: index + value.length + 1 }
            }
        }

        // Default: treat as file path
        return {
            type: 'file',
            value,
            range: { start: index, end: index + value.length + 1 }
        }
    }

    formatMention(mention: Mention): string {
        switch (mention.type) {
            case 'file':
                return `@file:${mention.value}`
            case 'directory':
                return `@dir:${mention.value}`
            case 'symbol':
                const symbolPart = `@symbol:${mention.symbolName}`
                return mention.filePath ? `${symbolPart}@${mention.filePath}` : symbolPart
            case 'codebase':
                return '@codebase'
            default:
                return `@${mention.value}`
        }
    }
}

export class MentionResolver {
    private projectPath: string

    constructor(projectPath: string) {
        this.projectPath = projectPath
    }

    async resolveMentions(mentions: Mention[]): Promise<MentionContext> {
        const context: MentionContext = {
            files: [],
            symbols: [],
            directories: [],
            codebase: false
        }

        for (const mention of mentions) {
            switch (mention.type) {
                case 'file':
                    context.files.push(mention.value)
                    break
                case 'directory':
                    context.directories.push(mention.value)
                    break
                case 'symbol':
                    if (mention.symbolName && mention.filePath) {
                        context.symbols.push({
                            name: mention.symbolName,
                            type: mention.symbolType || 'function',
                            filePath: mention.filePath
                        })
                    }
                    break
                case 'codebase':
                    context.codebase = true
                    break
            }
        }

        return context
    }

    async suggestMentions(partial: string, type?: Mention['type']): Promise<Mention[]> {
        const suggestions: Mention[] = []

        // This would integrate with the file system and symbol index
        // For now, return empty array
        // TODO: Implement file/symbol search for autocomplete

        return suggestions
    }

    async validateMention(mention: Mention): Promise<boolean> {
        switch (mention.type) {
            case 'file':
                // Check if file exists
                // TODO: Implement file existence check
                return true
            case 'directory':
                // Check if directory exists
                // TODO: Implement directory existence check
                return true
            case 'symbol':
                // Check if symbol exists in file
                // TODO: Implement symbol existence check
                return true
            case 'codebase':
                return true
            default:
                return false
        }
    }
}

export class MentionAutocomplete {
    private resolver: MentionResolver
    private currentSuggestions: Mention[] = []

    constructor(projectPath: string) {
        this.resolver = new MentionResolver(projectPath)
    }

    async getSuggestions(query: string, cursorPosition: number): Promise<Mention[]> {
        // Extract the partial mention before cursor
        const beforeCursor = query.substring(0, cursorPosition)
        const lastAtIndex = beforeCursor.lastIndexOf('@')

        if (lastAtIndex === -1) {
            return []
        }

        const partialMention = beforeCursor.substring(lastAtIndex + 1)
        const parser = new MentionParser()

        // Try to parse the partial mention to determine type
        const parsed = parser.parseMention(partialMention, lastAtIndex)
        if (!parsed) {
            return []
        }

        return await this.resolver.suggestMentions(partialMention, parsed.type)
    }

    formatSuggestion(mention: Mention): string {
        const parser = new MentionParser()
        return parser.formatMention(mention)
    }
}

// Singleton instance
let mentionParser: MentionParser | null = null
let mentionResolver: MentionResolver | null = null

export function getMentionParser(): MentionParser {
    if (!mentionParser) {
        mentionParser = new MentionParser()
    }
    return mentionParser
}

export function getMentionResolver(projectPath: string): MentionResolver {
    if (!mentionResolver || mentionResolver['projectPath'] !== projectPath) {
        mentionResolver = new MentionResolver(projectPath)
    }
    return mentionResolver
}

export function getMentionAutocomplete(projectPath: string): MentionAutocomplete {
    return new MentionAutocomplete(projectPath)
}
