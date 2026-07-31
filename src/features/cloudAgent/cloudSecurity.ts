/**
 * Cloud Agent Security
 * Authentication and security service for cloud agent platform
 */

import log from 'electron-log'
import * as crypto from 'crypto'

export interface SecurityConfig {
    encryptionEnabled: boolean
    authenticationRequired: boolean
    apiKeyRotationDays: number
    sessionTimeoutMinutes: number
    allowedIPs: string[]
    rateLimitingEnabled: boolean
    maxRequestsPerMinute: number
}

export interface ApiKey {
    id: string
    name: string
    key: string
    hashedKey: string
    permissions: string[]
    createdAt: Date
    expiresAt?: Date
    lastUsed?: Date
    revoked: boolean
}

export interface Session {
    id: string
    userId: string
    token: string
    createdAt: Date
    expiresAt: Date
    ipAddress?: string
    userAgent?: string
    active: boolean
}

export interface SecurityEvent {
    id: string
    type: 'authentication' | 'authorization' | 'rate_limit' | 'suspicious' | 'other'
    severity: 'info' | 'warning' | 'error' | 'critical'
    timestamp: Date
    message: string
    details?: Record<string, any>
    ipAddress?: string
}

export class CloudSecurity {
    private config: SecurityConfig = {
        encryptionEnabled: true,
        authenticationRequired: true,
        apiKeyRotationDays: 90,
        sessionTimeoutMinutes: 60,
        allowedIPs: [],
        rateLimitingEnabled: true,
        maxRequestsPerMinute: 100
    }
    private apiKeys: Map<string, ApiKey> = new Map()
    private sessions: Map<string, Session> = new Map()
    private securityEvents: SecurityEvent[] = []
    private rateLimitMap: Map<string, { count: number; resetTime: Date }> = new Map()
    private apiKeyCounter = 0
    private sessionCounter = 0
    private eventCounter = 0
    private active: boolean = false

    activate(): void {
        this.active = true
        log.info('Cloud security activated')
    }

    deactivate(): void {
        this.active = false
        log.info('Cloud security deactivated')
    }

    isActive(): boolean {
        return this.active
    }

    setConfig(config: Partial<SecurityConfig>): void {
        this.config = { ...this.config, ...config }
        log.info('Updated security config')
    }

    getConfig(): SecurityConfig {
        return { ...this.config }
    }

    // API Key Management
    createApiKey(name: string, permissions: string[], expiresInDays?: number): ApiKey {
        const apiKeyId = `apikey-${++this.apiKeyCounter}`
        const key = this.generateApiKey()
        const hashedKey = this.hashKey(key)

        const apiKey: ApiKey = {
            id: apiKeyId,
            name,
            key,
            hashedKey,
            permissions,
            createdAt: new Date(),
            expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : undefined,
            revoked: false
        }

        this.apiKeys.set(apiKeyId, apiKey)
        this.logSecurityEvent('authentication', 'info', `API key created: ${name}`)
        
        log.info(`Created API key: ${name}`)
        return apiKey
    }

    private generateApiKey(): string {
        return `sk-${crypto.randomBytes(32).toString('hex')}`
    }

    private hashKey(key: string): string {
        return crypto.createHash('sha256').update(key).digest('hex')
    }

    validateApiKey(key: string): { valid: boolean; apiKey?: ApiKey; error?: string } {
        const hashedKey = this.hashKey(key)

        for (const apiKey of this.apiKeys.values()) {
            if (apiKey.hashedKey === hashedKey) {
                if (apiKey.revoked) {
                    return { valid: false, error: 'API key has been revoked' }
                }

                if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
                    return { valid: false, error: 'API key has expired' }
                }

                apiKey.lastUsed = new Date()
                return { valid: true, apiKey }
            }
        }

        return { valid: false, error: 'Invalid API key' }
    }

    revokeApiKey(apiKeyId: string): boolean {
        const apiKey = this.apiKeys.get(apiKeyId)
        if (!apiKey) return false

        apiKey.revoked = true
        this.logSecurityEvent('authentication', 'warning', `API key revoked: ${apiKey.name}`)
        
        log.info(`Revoked API key: ${apiKey.name}`)
        return true
    }

    deleteApiKey(apiKeyId: string): boolean {
        const apiKey = this.apiKeys.get(apiKeyId)
        if (!apiKey) return false

        this.apiKeys.delete(apiKeyId)
        this.logSecurityEvent('authentication', 'info', `API key deleted: ${apiKey.name}`)
        
        log.info(`Deleted API key: ${apiKey.name}`)
        return true
    }

    getApiKeys(): ApiKey[] {
        return Array.from(this.apiKeys.values())
    }

    getApiKey(apiKeyId: string): ApiKey | undefined {
        return this.apiKeys.get(apiKeyId)
    }

    rotateApiKey(apiKeyId: string): ApiKey | null {
        const oldApiKey = this.apiKeys.get(apiKeyId)
        if (!oldApiKey) return null

        // Create new key with same permissions
        const newApiKey = this.createApiKey(
            `${oldApiKey.name} (rotated)`,
            oldApiKey.permissions,
            this.config.apiKeyRotationDays
        )

        // Revoke old key
        this.revokeApiKey(apiKeyId)

        this.logSecurityEvent('authentication', 'info', `API key rotated: ${oldApiKey.name}`)
        
        log.info(`Rotated API key: ${oldApiKey.name}`)
        return newApiKey
    }

    // Session Management
    createSession(userId: string, ipAddress?: string, userAgent?: string): Session {
        const sessionId = `session-${++this.sessionCounter}`
        const token = this.generateSessionToken()

        const session: Session = {
            id: sessionId,
            userId,
            token,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.config.sessionTimeoutMinutes * 60 * 1000),
            ipAddress,
            userAgent,
            active: true
        }

        this.sessions.set(sessionId, session)
        this.logSecurityEvent('authentication', 'info', `Session created for user: ${userId}`)
        
        log.info(`Created session for user: ${userId}`)
        return session
    }

    private generateSessionToken(): string {
        return crypto.randomBytes(32).toString('hex')
    }

    validateSession(token: string): { valid: boolean; session?: Session; error?: string } {
        for (const session of this.sessions.values()) {
            if (session.token === token) {
                if (!session.active) {
                    return { valid: false, error: 'Session is inactive' }
                }

                if (session.expiresAt < new Date()) {
                    session.active = false
                    return { valid: false, error: 'Session has expired' }
                }

                return { valid: true, session }
            }
        }

        return { valid: false, error: 'Invalid session token' }
    }

    invalidateSession(sessionId: string): boolean {
        const session = this.sessions.get(sessionId)
        if (!session) return false

        session.active = false
        this.logSecurityEvent('authentication', 'info', `Session invalidated: ${sessionId}`)
        
        log.info(`Invalidated session: ${sessionId}`)
        return true
    }

    getSessions(): Session[] {
        return Array.from(this.sessions.values())
    }

    getActiveSessions(): Session[] {
        return this.getSessions().filter(s => s.active && s.expiresAt > new Date())
    }

    getSessionsByUser(userId: string): Session[] {
        return this.getSessions().filter(s => s.userId === userId)
    }

    // Rate Limiting
    checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: Date } {
        if (!this.config.rateLimitingEnabled) {
            return { allowed: true, remaining: Infinity, resetTime: new Date() }
        }

        const now = new Date()
        const windowStart = new Date(now.getTime() - 60 * 1000) // 1 minute window

        let rateLimit = this.rateLimitMap.get(identifier)

        if (!rateLimit || rateLimit.resetTime < now) {
            rateLimit = {
                count: 0,
                resetTime: new Date(now.getTime() + 60 * 1000)
            }
            this.rateLimitMap.set(identifier, rateLimit)
        }

        if (rateLimit.count >= this.config.maxRequestsPerMinute) {
            this.logSecurityEvent('rate_limit', 'warning', `Rate limit exceeded for: ${identifier}`)
            return {
                allowed: false,
                remaining: 0,
                resetTime: rateLimit.resetTime
            }
        }

        rateLimit.count++
        const remaining = this.config.maxRequestsPerMinute - rateLimit.count

        return {
            allowed: true,
            remaining,
            resetTime: rateLimit.resetTime
        }
    }

    // IP Whitelist
    isIPAllowed(ipAddress: string): boolean {
        if (this.config.allowedIPs.length === 0) {
            return true
        }

        return this.config.allowedIPs.includes(ipAddress)
    }

    addAllowedIP(ipAddress: string): void {
        if (!this.config.allowedIPs.includes(ipAddress)) {
            this.config.allowedIPs.push(ipAddress)
            log.info(`Added allowed IP: ${ipAddress}`)
        }
    }

    removeAllowedIP(ipAddress: string): void {
        const index = this.config.allowedIPs.indexOf(ipAddress)
        if (index > -1) {
            this.config.allowedIPs.splice(index, 1)
            log.info(`Removed allowed IP: ${ipAddress}`)
        }
    }

    // Security Events
    private logSecurityEvent(
        type: SecurityEvent['type'],
        severity: SecurityEvent['severity'],
        message: string,
        details?: Record<string, any>,
        ipAddress?: string
    ): void {
        const event: SecurityEvent = {
            id: `event-${++this.eventCounter}`,
            type,
            severity,
            timestamp: new Date(),
            message,
            details,
            ipAddress
        }

        this.securityEvents.push(event)

        // Trim events if exceeding limit
        if (this.securityEvents.length > 10000) {
            this.securityEvents = this.securityEvents.slice(-10000)
        }

        log[severity](`[Security] ${message}`, details || '')
    }

    getSecurityEvents(): SecurityEvent[] {
        return [...this.securityEvents]
    }

    getSecurityEventsByType(type: SecurityEvent['type']): SecurityEvent[] {
        return this.securityEvents.filter(e => e.type === type)
    }

    getSecurityEventsBySeverity(severity: SecurityEvent['severity']): SecurityEvent[] {
        return this.securityEvents.filter(e => e.severity === severity)
    }

    getRecentSecurityEvents(minutes: number = 60): SecurityEvent[] {
        const cutoff = new Date(Date.now() - minutes * 60 * 1000)
        return this.securityEvents.filter(e => e.timestamp >= cutoff)
    }

    clearSecurityEvents(): void {
        this.securityEvents = []
        this.eventCounter = 0
        log.info('Cleared security events')
    }

    // Encryption
    encrypt(data: string): string {
        if (!this.config.encryptionEnabled) {
            return data
        }

        const algorithm = 'aes-256-gcm'
        const key = crypto.randomBytes(32)
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv(algorithm, key, iv)

        let encrypted = cipher.update(data, 'utf8', 'hex')
        encrypted += cipher.final('hex')
        const authTag = cipher.getAuthTag()

        // Combine key, iv, authTag, and encrypted data
        const combined = Buffer.concat([
            key,
            iv,
            authTag,
            Buffer.from(encrypted, 'hex')
        ])

        return combined.toString('base64')
    }

    decrypt(encryptedData: string): string {
        if (!this.config.encryptionEnabled) {
            return encryptedData
        }

        const combined = Buffer.from(encryptedData, 'base64')
        const key = combined.slice(0, 32)
        const iv = combined.slice(32, 48)
        const authTag = combined.slice(48, 64)
        const encrypted = combined.slice(64)

        const algorithm = 'aes-256-gcm'
        const decipher = crypto.createDecipheriv(algorithm, key, iv)
        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(encrypted)
        decrypted = Buffer.concat([decrypted, decipher.final()])

        return decrypted.toString('utf8')
    }

    getStatistics(): {
        totalApiKeys: number
        activeApiKeys: number
        revokedApiKeys: number
        totalSessions: number
        activeSessions: number
        totalSecurityEvents: number
        criticalEvents: number
        rateLimitHits: number
    } {
        const apiKeys = this.getApiKeys()
        const sessions = this.getSessions()
        const events = this.getSecurityEvents()

        return {
            totalApiKeys: apiKeys.length,
            activeApiKeys: apiKeys.filter(k => !k.revoked && (!k.expiresAt || k.expiresAt > new Date())).length,
            revokedApiKeys: apiKeys.filter(k => k.revoked).length,
            totalSessions: sessions.length,
            activeSessions: this.getActiveSessions().length,
            totalSecurityEvents: events.length,
            criticalEvents: events.filter(e => e.severity === 'critical').length,
            rateLimitHits: events.filter(e => e.type === 'rate_limit').length
        }
    }

    reset(): void {
        this.apiKeys.clear()
        this.sessions.clear()
        this.securityEvents = []
        this.rateLimitMap.clear()
        this.apiKeyCounter = 0
        this.sessionCounter = 0
        this.eventCounter = 0
        log.info('Cloud security reset')
    }
}

// Singleton instance
let cloudSecurity: CloudSecurity | null = null

export function getCloudSecurity(): CloudSecurity {
    if (!cloudSecurity) {
        cloudSecurity = new CloudSecurity()
    }
    return cloudSecurity
}

export function destroyCloudSecurity() {
    if (cloudSecurity) {
        cloudSecurity.reset()
        cloudSecurity = null
    }
}
