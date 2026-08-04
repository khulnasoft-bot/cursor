/**
 * Platform utilities
 * Functions for platform detection and path handling
 */

/**
 * Platform information interface
 */
export interface PlatformInfo {
    PLATFORM_DELIMITER: string
    PLATFORM_META_KEY: string
    PLATFORM_CM_KEY: string
    IS_WINDOWS: boolean
    IS_MAC: boolean
    IS_LINUX: boolean
}

/**
 * Cached platform info
 */
let cachedPlatformInfo: PlatformInfo | null = null

/**
 * Get platform information
 * @returns Platform information object
 */
export function getPlatformInfo(): PlatformInfo {
    if (cachedPlatformInfo) {
        return cachedPlatformInfo
    }

    let PLATFORM_DELIMITER: string
    let PLATFORM_META_KEY: string
    let PLATFORM_CM_KEY: string
    let IS_WINDOWS: boolean
    let IS_MAC: boolean
    let IS_LINUX: boolean

    // Handle cases where process might not be available (e.g., browser)
    const platform = typeof process !== 'undefined' ? process.platform : 'unknown'

    if (platform === 'win32') {
        PLATFORM_DELIMITER = '\\'
        PLATFORM_META_KEY = 'Ctrl+'
        PLATFORM_CM_KEY = 'Ctrl'
        IS_WINDOWS = true
        IS_MAC = false
        IS_LINUX = false
    } else if (platform === 'darwin') {
        PLATFORM_DELIMITER = '/'
        PLATFORM_META_KEY = '⌘'
        PLATFORM_CM_KEY = 'Cmd'
        IS_WINDOWS = false
        IS_MAC = true
        IS_LINUX = false
    } else {
        PLATFORM_DELIMITER = '/'
        PLATFORM_META_KEY = 'Ctrl+'
        PLATFORM_CM_KEY = 'Ctrl'
        IS_WINDOWS = false
        IS_MAC = false
        IS_LINUX = true
    }

    cachedPlatformInfo = {
        PLATFORM_DELIMITER,
        PLATFORM_META_KEY,
        PLATFORM_CM_KEY,
        IS_WINDOWS,
        IS_MAC,
        IS_LINUX,
    }

    return cachedPlatformInfo
}

/**
 * Join two path parts with the platform delimiter
 * @param a - First path part
 * @param b - Second path part
 * @returns Joined path
 */
export function joinPaths(a: string, b: string): string {
    const delimiter = getPlatformInfo().PLATFORM_DELIMITER
    if (a.length === 0) return b
    if (b.length === 0) return a
    if (a[a.length - 1] === delimiter) {
        return a + b
    }
    return a + delimiter + b
}

/**
 * Advanced path joining that handles ./ and ../
 * @param a - Base path
 * @param b - Relative path
 * @returns Resolved path
 */
export function joinPathsAdvanced(a: string, b: string): string {
    const delimiter = getPlatformInfo().PLATFORM_DELIMITER

    if (b.startsWith('./')) {
        return joinPathsAdvanced(a, b.slice(2))
    }
    if (b.startsWith('../')) {
        // if a ends with delimiter
        if (a[a.length - 1] === delimiter) {
            a = a.slice(0, -1)
        }
        const aOneHigher = a.slice(0, a.lastIndexOf(delimiter))
        return joinPathsAdvanced(aOneHigher, b.slice(3))
    }
    return joinPaths(a, b)
}

/**
 * Normalize path for the current platform
 * @param path - Path to normalize
 * @returns Normalized path
 */
export function normalizePath(path: string): string {
    const delimiter = getPlatformInfo().PLATFORM_DELIMITER
    const wrongDelimiter = delimiter === '/' ? '\\' : '/'
    
    return path.split(wrongDelimiter).join(delimiter)
}

/**
 * Get file extension from path
 * @param path - File path
 * @returns File extension without dot
 */
export function getExtension(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() || ''
    return ext
}

/**
 * Get file name from path
 * @param path - File path
 * @returns File name with extension
 */
export function getFileName(path: string): string {
    const delimiter = getPlatformInfo().PLATFORM_DELIMITER
    return path.split(delimiter).pop() || path
}

/**
 * Get directory name from path
 * @param path - File path
 * @returns Directory path
 */
export function getDirectoryName(path: string): string {
    const delimiter = getPlatformInfo().PLATFORM_DELIMITER
    const parts = path.split(delimiter)
    parts.pop()
    return parts.join(delimiter)
}