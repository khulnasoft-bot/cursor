/**
 * Cursor Product Configuration
 * Loads and manages product.json configuration
 */

import * as fs from 'fs'
import * as path from 'path'
import log from 'electron-log'

export interface ProductConfig {
    name: string
    version: string
    ai: AIConfig
    analytics: AnalyticsConfig
    extensions: ExtensionsConfig
    server: ServerConfig
    updates: UpdatesConfig
    licensing: LicensingConfig
    features: FeaturesConfig
}

export interface AIConfig {
    defaultModel: string
    endpoint: string
    streamingEnabled: boolean
    temperature: number
    maxTokens: number
    rateLimits: {
        requestsPerMinute: number
        tokensPerMinute: number
    }
}

export interface AnalyticsConfig {
    statsig: {
        enabled: boolean
        apiKey: string
    }
    posthog: {
        enabled: boolean
        apiKey: string
    }
}

export interface ExtensionsConfig {
    replacementMap: Record<string, string>
    versionConstraints: {
        minimumVersion: string
        maximumVersion: string
    }
    marketplace: {
        enabled: boolean
        endpoint: string
    }
}

export interface ServerConfig {
    tunnel: {
        enabled: boolean
        endpoint: string
    }
    remote: {
        enabled: boolean
        sshConfigPath: string
    }
}

export interface UpdatesConfig {
    autoUpdate: boolean
    updateUrl: string
    channel: string
}

export interface LicensingConfig {
    enabled: boolean
    endpoint: string
    trialDays: number
}

export interface FeaturesConfig {
    debugger: {
        enabled: boolean
        supportedLanguages: string[]
    }
    notebook: {
        enabled: boolean
        supportedKernels: string[]
    }
    webview: {
        enabled: boolean
        securityPolicy: string
    }
}

class ProductConfigManager {
    private config: ProductConfig | null = null
    private configPath: string

    constructor() {
        // Try to find product.json in various locations
        const possiblePaths = [
            path.join(process.cwd(), 'config', 'product.json'),
            path.join(__dirname, '..', '..', '..', 'config', 'product.json'),
            path.join(process.resourcesPath || '', 'app', 'config', 'product.json')
        ]

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                this.configPath = p
                break
            }
        }

        if (!this.configPath) {
            this.configPath = possiblePaths[0]
            log.warn('product.json not found, using default path:', this.configPath)
        }

        this.loadConfig()
    }

    loadConfig(): void {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf8')
                this.config = JSON.parse(data) as ProductConfig
                log.info('Product configuration loaded from:', this.configPath)
            } else {
                log.warn('product.json not found at:', this.configPath)
                this.config = this.getDefaultConfig()
            }
        } catch (error) {
            log.error('Failed to load product configuration:', error)
            this.config = this.getDefaultConfig()
        }
    }

    private getDefaultConfig(): ProductConfig {
        return {
            name: 'Cursor',
            version: '3.9.16',
            ai: {
                defaultModel: 'gpt-4',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                streamingEnabled: true,
                temperature: 0.7,
                maxTokens: 4096,
                rateLimits: {
                    requestsPerMinute: 60,
                    tokensPerMinute: 90000
                }
            },
            analytics: {
                statsig: {
                    enabled: false,
                    apiKey: ''
                },
                posthog: {
                    enabled: false,
                    apiKey: ''
                }
            },
            extensions: {
                replacementMap: {},
                versionConstraints: {
                    minimumVersion: '1.0.0',
                    maximumVersion: '2.0.0'
                },
                marketplace: {
                    enabled: false,
                    endpoint: ''
                }
            },
            server: {
                tunnel: {
                    enabled: false,
                    endpoint: ''
                },
                remote: {
                    enabled: false,
                    sshConfigPath: '~/.ssh/config'
                }
            },
            updates: {
                autoUpdate: true,
                updateUrl: 'https://cursor.so/updates',
                channel: 'stable'
            },
            licensing: {
                enabled: false,
                endpoint: '',
                trialDays: 30
            },
            features: {
                debugger: {
                    enabled: true,
                    supportedLanguages: ['node', 'node2', 'python']
                },
                notebook: {
                    enabled: false,
                    supportedKernels: ['python3']
                },
                webview: {
                    enabled: false,
                    securityPolicy: 'strict'
                }
            }
        }
    }

    getConfig(): ProductConfig {
        if (!this.config) {
            this.loadConfig()
        }
        return this.config!
    }

    getAIConfig(): AIConfig {
        return this.getConfig().ai
    }

    getAnalyticsConfig(): AnalyticsConfig {
        return this.getConfig().analytics
    }

    getExtensionsConfig(): ExtensionsConfig {
        return this.getConfig().extensions
    }

    getServerConfig(): ServerConfig {
        return this.getConfig().server
    }

    getUpdatesConfig(): UpdatesConfig {
        return this.getConfig().updates
    }

    getLicensingConfig(): LicensingConfig {
        return this.getConfig().licensing
    }

    getFeaturesConfig(): FeaturesConfig {
        return this.getConfig().features
    }

    isFeatureEnabled(feature: keyof FeaturesConfig): boolean {
        return this.getFeaturesConfig()[feature].enabled
    }

    updateConfig(partialConfig: Partial<ProductConfig>): void {
        if (!this.config) {
            this.loadConfig()
        }
        this.config = { ...this.config!, ...partialConfig }
        log.info('Product configuration updated')
    }

    reloadConfig(): void {
        this.loadConfig()
    }
}

// Singleton instance
let productConfigManager: ProductConfigManager | null = null

export function getProductConfig(): ProductConfigManager {
    if (!productConfigManager) {
        productConfigManager = new ProductConfigManager()
    }
    return productConfigManager
}

export function destroyProductConfig() {
    productConfigManager = null
}
