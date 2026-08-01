import { app } from 'electron'
import log from 'electron-log'

import { API_ROOT } from '../utils'
import { authPackage } from './auth'
import { setupCommentIndexer } from './commentIndexer'
import { setupIndex } from './indexer'
import { setupLSPs } from './lsp'
import setupMainMenu from './menu'
import mainWindow from './window'
import { setupSearch } from './search'
import setupApplicationsFolder from './setup/appFolder'
import setupAuth from './setup/auth'
import setupAutoUpdater from './setup/autoUpdater'
import { setupEnv } from './setup/env'
import setupIpcs from './setup/ipcs'
import setupLogger from './setup/logger'
import setupProtocol from './setup/protocol'
import setupSingleInstance from './setup/singleInstance'
import setupTerminal from './setup/terminal'
import { setupStoreHandlers, store } from './storeHandler'
import { setupTestIndexer } from './testIndexer'
import { setupBrowserAutomationIpcs } from './browserAutomation'
import { setupFileServiceIpcs } from './fileService'
import { setupSocketServiceIpcs } from './socketService'
import { setupExplorerServiceIpcs } from './explorerService'
import { setupCommitsServiceIpcs } from './commitsService'
import { setupMCPServiceIpcs } from './mcpService'
import { setupDebuggerServiceIpcs } from './debuggerService'
import { setupAIServiceIpcs } from './aiService'
import { setupExtensionServiceIpcs } from './extensionService'
import { setupNotebookServiceIpcs } from './notebookService'
import { setupWebviewServiceIpcs } from './webviewService'
import { setupResolverServiceIpcs } from './resolverService'
import { setupShadowWorkspaceServiceIpcs } from './shadowWorkspaceService'
import { setupTextmateServiceIpcs } from './textmateService'
import { setupNDJSONServiceIpcs } from './ndjsonService'
import { setupPolyfillsServiceIpcs } from './polyfillsService'
import { setupCheckoutServiceIpcs } from './checkoutService'
import { setupAgentExecServiceIpcs } from './agentExecService'
import { setupLocalModeServiceIpcs } from './localModeService'
import { getProductConfig } from './config/productConfig'

setupEnv()
setupProtocol()
setupSingleInstance()
setupAutoUpdater()
setupLogger()
setupAuth()

app.on('ready', () => {
    mainWindow.create()
    mainWindow.setup()
    mainWindow.load()
    setupMainMenu()

    // Load product configuration
    getProductConfig()

    // Sets up auth stuff here
    authPackage()
    setupApplicationsFolder()
    setupIpcs()
    setupBrowserAutomationIpcs()
    setupFileServiceIpcs()
    setupSocketServiceIpcs()
    setupExplorerServiceIpcs()
    setupCommitsServiceIpcs()
    setupMCPServiceIpcs()
    setupDebuggerServiceIpcs()
    setupAIServiceIpcs()
    setupExtensionServiceIpcs()
    setupNotebookServiceIpcs()
    setupWebviewServiceIpcs()
    setupResolverServiceIpcs()
    setupShadowWorkspaceServiceIpcs()
    setupTextmateServiceIpcs()
    setupNDJSONServiceIpcs()
    setupPolyfillsServiceIpcs()
    setupCheckoutServiceIpcs()
    setupAgentExecServiceIpcs()
    setupLocalModeServiceIpcs()
    setupLSPs(store)
    setupTerminal()
    setupSearch()
    log.info('setting up index')
    setupCommentIndexer()
    setupTestIndexer()
    setupStoreHandlers()
    setupIndex(API_ROOT, mainWindow.win!)
    log.info('setup index')
})
app.on('window-all-closed', () => {
    app.quit()
})
