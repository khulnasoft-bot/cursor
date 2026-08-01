/**
 * Cursor TextMate Service
 * TextMate grammar integration for enhanced syntax highlighting
 */

import * as fs from 'fs'
import * as path from 'path'
import log from 'electron-log'

export interface TextMateGrammar {
    scopeName: string
    path: string
    language: string
}

class TextMateService {
    private grammars: Map<string, TextMateGrammar> = new Map()
    private grammarsPath: string

    constructor() {
        this.grammarsPath = path.join(process.cwd(), 'grammars')
        if (!fs.existsSync(this.grammarsPath)) {
            fs.mkdirSync(this.grammarsPath, { recursive: true })
        }
        this.loadGrammars()
    }

    private loadGrammars(): void {
        try {
            if (!fs.existsSync(this.grammarsPath)) {
                return
            }

            const files = fs.readdirSync(this.grammarsPath)
            for (const file of files) {
                if (file.endsWith('.json') || file.endsWith('.tmLanguage')) {
                    const grammarPath = path.join(this.grammarsPath, file)
                    try {
                        const data = fs.readFileSync(grammarPath, 'utf8')
                        const grammar = JSON.parse(data)
                        
                        if (grammar.scopeName) {
                            const textMateGrammar: TextMateGrammar = {
                                scopeName: grammar.scopeName,
                                path: grammarPath,
                                language: grammar.scopeName.split('.')[0] || 'unknown'
                            }
                            this.grammars.set(grammar.scopeName, textMateGrammar)
                            log.info(`Loaded TextMate grammar: ${grammar.scopeName}`)
                        }
                    } catch (error) {
                        log.error(`Failed to load grammar ${file}:`, error)
                    }
                }
            }
        } catch (error) {
            log.error('Failed to load TextMate grammars:', error)
        }
    }

    registerGrammar(grammar: TextMateGrammar): void {
        this.grammars.set(grammar.scopeName, grammar)
        log.info(`Registered TextMate grammar: ${grammar.scopeName}`)
    }

    unregisterGrammar(scopeName: string): void {
        this.grammars.delete(scopeName)
        log.info(`Unregistered TextMate grammar: ${scopeName}`)
    }

    getGrammar(scopeName: string): TextMateGrammar | undefined {
        return this.grammars.get(scopeName)
    }

    getGrammars(): TextMateGrammar[] {
        return Array.from(this.grammars.values())
    }

    getGrammarByLanguage(language: string): TextMateGrammar[] {
        return this.getGrammars().filter(g => g.language === language)
    }

    async loadGrammarFromFile(filePath: string): Promise<void> {
        try {
            const data = fs.readFileSync(filePath, 'utf8')
            const grammar = JSON.parse(data)
            
            if (grammar.scopeName) {
                const textMateGrammar: TextMateGrammar = {
                    scopeName: grammar.scopeName,
                    path: filePath,
                    language: grammar.scopeName.split('.')[0] || 'unknown'
                }
                this.registerGrammar(textMateGrammar)
            }
        } catch (error) {
            log.error('Failed to load grammar from file:', error)
            throw error
        }
    }

    getGrammarsPath(): string {
        return this.grammarsPath
    }
}

// Singleton instance
let textmateService: TextMateService | null = null

export function getTextmateService(): TextMateService {
    if (!textmateService) {
        textmateService = new TextMateService()
    }
    return textmateService
}

export function destroyTextmateService() {
    textmateService = null
}
