/**
 * Cursor Extension Service
 * Handles extension installation, management, and lifecycle
 */

import * as fs from 'fs'
import * as path from 'path'
import log from 'electron-log'

export interface ExtensionManifest {
    name: string
    version: string
    displayName: string
    description: string
    main: string
    author: string
    license: string
    activationEvents: string[]
    contributes: any
}

export interface Extension {
    id: string
    manifest: ExtensionManifest
    path: string
    enabled: boolean
    installed: boolean
}

export interface ExtensionRegistry {
    extensions: Map<string, ExtensionManifest>
}

class ExtensionService {
    private extensions: Map<string, Extension> = new Map()
    private extensionsPath: string
    private registry: ExtensionRegistry = { extensions: new Map() }

    constructor() {
        // Set extensions path
        this.extensionsPath = path.join(process.cwd(), 'extensions')
        if (!fs.existsSync(this.extensionsPath)) {
            fs.mkdirSync(this.extensionsPath, { recursive: true })
        }

        this.loadInstalledExtensions()
    }

    private loadInstalledExtensions(): void {
        try {
            if (!fs.existsSync(this.extensionsPath)) {
                return
            }

            const extensionDirs = fs.readdirSync(this.extensionsPath, { withFileTypes: true })
            
            for (const dir of extensionDirs) {
                if (dir.isDirectory()) {
                    const extensionPath = path.join(this.extensionsPath, dir.name)
                    const manifestPath = path.join(extensionPath, 'package.json')
                    
                    if (fs.existsSync(manifestPath)) {
                        try {
                            const manifestData = fs.readFileSync(manifestPath, 'utf8')
                            const manifest = JSON.parse(manifestData) as ExtensionManifest
                            
                            const extension: Extension = {
                                id: manifest.name,
                                manifest,
                                path: extensionPath,
                                enabled: true,
                                installed: true
                            }
                            
                            this.extensions.set(extension.id, extension)
                            log.info(`Loaded extension: ${manifest.name}`)
                        } catch (error) {
                            log.error(`Failed to load extension ${dir.name}:`, error)
                        }
                    }
                }
            }
        } catch (error) {
            log.error('Failed to load installed extensions:', error)
        }
    }

    async installExtension(extensionPath: string): Promise<string> {
        try {
            // Validate extension
            const manifestPath = path.join(extensionPath, 'package.json')
            if (!fs.existsSync(manifestPath)) {
                throw new Error('Invalid extension: package.json not found')
            }

            const manifestData = fs.readFileSync(manifestPath, 'utf8')
            const manifest = JSON.parse(manifestData) as ExtensionManifest

            // Check if already installed
            if (this.extensions.has(manifest.name)) {
                throw new Error(`Extension ${manifest.name} is already installed`)
            }

            // Copy extension to extensions directory
            const targetPath = path.join(this.extensionsPath, manifest.name)
            if (fs.existsSync(targetPath)) {
                fs.rmSync(targetPath, { recursive: true })
            }
            fs.cpSync(extensionPath, targetPath, { recursive: true })

            // Register extension
            const extension: Extension = {
                id: manifest.name,
                manifest,
                path: targetPath,
                enabled: true,
                installed: true
            }

            this.extensions.set(extension.id, extension)
            log.info(`Installed extension: ${manifest.name}`)

            return extension.id
        } catch (error) {
            log.error('Failed to install extension:', error)
            throw error
        }
    }

    async uninstallExtension(extensionId: string): Promise<void> {
        const extension = this.extensions.get(extensionId)
        if (!extension) {
            throw new Error(`Extension not found: ${extensionId}`)
        }

        try {
            // Remove extension directory
            if (fs.existsSync(extension.path)) {
                fs.rmSync(extension.path, { recursive: true })
            }

            this.extensions.delete(extensionId)
            log.info(`Uninstalled extension: ${extensionId}`)
        } catch (error) {
            log.error('Failed to uninstall extension:', error)
            throw error
        }
    }

    async enableExtension(extensionId: string): Promise<void> {
        const extension = this.extensions.get(extensionId)
        if (!extension) {
            throw new Error(`Extension not found: ${extensionId}`)
        }

        extension.enabled = true
        log.info(`Enabled extension: ${extensionId}`)
    }

    async disableExtension(extensionId: string): Promise<void> {
        const extension = this.extensions.get(extensionId)
        if (!extension) {
            throw new Error(`Extension not found: ${extensionId}`)
        }

        extension.enabled = false
        log.info(`Disabled extension: ${extensionId}`)
    }

    getExtension(extensionId: string): Extension | undefined {
        return this.extensions.get(extensionId)
    }

    getExtensions(): Extension[] {
        return Array.from(this.extensions.values())
    }

    getEnabledExtensions(): Extension[] {
        return this.getExtensions().filter(ext => ext.enabled)
    }

    async loadExtension(extensionId: string): Promise<void> {
        const extension = this.extensions.get(extensionId)
        if (!extension || !extension.enabled) {
            throw new Error(`Extension not found or not enabled: ${extensionId}`)
        }

        try {
            const mainPath = path.join(extension.path, extension.manifest.main)
            if (fs.existsSync(mainPath)) {
                // Load extension module
                // This will be implemented based on extension loading strategy
                log.info(`Loaded extension module: ${extensionId}`)
            }
        } catch (error) {
            log.error(`Failed to load extension ${extensionId}:`, error)
            throw error
        }
    }

    async unloadExtension(extensionId: string): Promise<void> {
        const extension = this.extensions.get(extensionId)
        if (!extension) {
            throw new Error(`Extension not found: ${extensionId}`)
        }

        // Unload extension module
        log.info(`Unloaded extension: ${extensionId}`)
    }

    registerExtensionManifest(manifest: ExtensionManifest): void {
        this.registry.extensions.set(manifest.name, manifest)
        log.info(`Registered extension manifest: ${manifest.name}`)
    }

    getExtensionManifest(extensionId: string): ExtensionManifest | undefined {
        return this.registry.extensions.get(extensionId)
    }

    getRegistryExtensions(): ExtensionManifest[] {
        return Array.from(this.registry.extensions.values())
    }

    async validateExtension(extensionPath: string): Promise<boolean> {
        try {
            const manifestPath = path.join(extensionPath, 'package.json')
            if (!fs.existsSync(manifestPath)) {
                return false
            }

            const manifestData = fs.readFileSync(manifestPath, 'utf8')
            const manifest = JSON.parse(manifestData)

            // Basic validation
            if (!manifest.name || !manifest.version || !manifest.main) {
                return false
            }

            return true
        } catch (error) {
            log.error('Extension validation failed:', error)
            return false
        }
    }

    getExtensionsPath(): string {
        return this.extensionsPath
    }
}

// Singleton instance
let extensionService: ExtensionService | null = null

export function getExtensionService(): ExtensionService {
    if (!extensionService) {
        extensionService = new ExtensionService()
    }
    return extensionService
}

export function destroyExtensionService() {
    if (extensionService) {
        extensionService = null
    }
}
