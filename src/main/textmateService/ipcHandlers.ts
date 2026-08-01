/**
 * TextMate Service IPC Handlers
 * IPC communication layer for TextMate service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getTextmateService } from './textmateService'
import type { TextMateGrammar } from './textmateService'

export function setupTextmateServiceIpcs() {
    const textmateService = getTextmateService()

    // Register grammar
    ipcMain.handle(
        'textmate-service-register',
        async (_event: IpcMainInvokeEvent, grammar: TextMateGrammar) => {
            try {
                textmateService.registerGrammar(grammar)
                return { success: true }
            } catch (error) {
                log.error('Failed to register TextMate grammar:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Unregister grammar
    ipcMain.handle(
        'textmate-service-unregister',
        async (_event: IpcMainInvokeEvent, scopeName: string) => {
            try {
                textmateService.unregisterGrammar(scopeName)
                return { success: true }
            } catch (error) {
                log.error('Failed to unregister TextMate grammar:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get grammar
    ipcMain.handle(
        'textmate-service-get',
        async (_event: IpcMainInvokeEvent, scopeName: string) => {
            try {
                const grammar = textmateService.getGrammar(scopeName)
                return { success: true, grammar }
            } catch (error) {
                log.error('Failed to get TextMate grammar:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get all grammars
    ipcMain.handle(
        'textmate-service-get-all',
        async () => {
            try {
                const grammars = textmateService.getGrammars()
                return { success: true, grammars }
            } catch (error) {
                log.error('Failed to get TextMate grammars:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get grammar by language
    ipcMain.handle(
        'textmate-service-get-by-language',
        async (_event: IpcMainInvokeEvent, language: string) => {
            try {
                const grammars = textmateService.getGrammarByLanguage(language)
                return { success: true, grammars }
            } catch (error) {
                log.error('Failed to get TextMate grammars by language:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Load grammar from file
    ipcMain.handle(
        'textmate-service-load-file',
        async (_event: IpcMainInvokeEvent, filePath: string) => {
            try {
                await textmateService.loadGrammarFromFile(filePath)
                return { success: true }
            } catch (error) {
                log.error('Failed to load TextMate grammar from file:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get grammars path
    ipcMain.handle(
        'textmate-service-get-path',
        async () => {
            try {
                const grammarsPath = textmateService.getGrammarsPath()
                return { success: true, grammarsPath }
            } catch (error) {
                log.error('Failed to get grammars path:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('TextMate service IPC handlers registered')
}
