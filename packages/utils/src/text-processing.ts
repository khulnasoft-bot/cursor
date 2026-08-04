/**
 * Text processing utilities
 * Functions for string manipulation and text processing
 */

/**
 * Remove beginning and ending line breaks from a string
 * @param str - Input string
 * @returns String with leading/trailing line breaks removed
 */
export function removeBeginningAndEndingLineBreaks(str: string): string {
    if (!str || str.length === 0) return str
    str = str.trimEnd()
    while (str.length > 0 && str[0] === '\n') {
        str = str.slice(1)
    }
    while (str.length > 0 && str[str.length - 1] === '\n') {
        str = str.slice(0, -1)
    }
    return str
}

/**
 * Remove all whitespace from a string
 * @param str - Input string
 * @returns String with all whitespace removed
 */
export function removeWhitespace(str: string): string {
    return str.replace(/\s/g, '')
}

/**
 * Truncate string to a maximum length
 * @param str - Input string
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add if truncated (default: '...')
 * @returns Truncated string
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
    if (str.length <= maxLength) {
        return str
    }
    return str.slice(0, maxLength - suffix.length) + suffix
}

/**
 * Capitalize the first letter of a string
 * @param str - Input string
 * @returns Capitalized string
 */
export function capitalize(str: string): string {
    if (!str || str.length === 0) return str
    return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert string to camelCase
 * @param str - Input string
 * @returns camelCase string
 */
export function toCamelCase(str: string): string {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase()
        })
        .replace(/\s+/g, '')
        .replace(/[-_]/g, '')
}

/**
 * Convert string to snake_case
 * @param str - Input string
 * @returns snake_case string
 */
export function toSnakeCase(str: string): string {
    return str
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '')
        .replace(/\s+/g, '_')
        .replace(/-/g, '_')
}

/**
 * Convert string to kebab-case
 * @param str - Input string
 * @returns kebab-case string
 */
export function toKebabCase(str: string): string {
    return str
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .replace(/^-/, '')
        .replace(/\s+/g, '-')
        .replace(/_/g, '-')
}

/**
 * Convert string to PascalCase
 * @param str - Input string
 * @returns PascalCase string
 */
export function toPascalCase(str: string): string {
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => {
            return word.toUpperCase()
        })
        .replace(/\s+/g, '')
        .replace(/[-_]/g, '')
}

/**
 * Count words in a string
 * @param str - Input string
 * @returns Word count
 */
export function countWords(str: string): number {
    return str.trim().split(/\s+/).filter((word) => word.length > 0).length
}

/**
 * Count lines in a string
 * @param str - Input string
 * @returns Line count
 */
export function countLines(str: string): number {
    return str.split('\n').length
}

/**
 * Check if string is empty or only whitespace
 * @param str - Input string
 * @returns True if empty or whitespace
 */
export function isEmpty(str: string): boolean {
    return str.trim().length === 0
}

/**
 * Reverse a string
 * @param str - Input string
 * @returns Reversed string
 */
export function reverse(str: string): string {
    return str.split('').reverse().join('')
}

/**
 * Remove duplicate lines from a string
 * @param str - Input string
 * @returns String with duplicate lines removed
 */
export function removeDuplicateLines(str: string): string {
    const lines = str.split('\n')
    const uniqueLines = [...new Set(lines)]
    return uniqueLines.join('\n')
}

/**
 * Sort lines in a string alphabetically
 * @param str - Input string
 * @param descending - Sort in descending order (default: false)
 * @returns String with sorted lines
 */
export function sortLines(str: string, descending: boolean = false): string {
    const lines = str.split('\n')
    lines.sort((a, b) => {
        if (descending) {
            return b.localeCompare(a)
        }
        return a.localeCompare(b)
    })
    return lines.join('\n')
}

/**
 * Escape special regex characters in a string
 * @param str - Input string
 * @returns Escaped string
 */
export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Unescape special regex characters in a string
 * @param str - Input string
 * @returns Unescaped string
 */
export function unescapeRegex(str: string): string {
    return str.replace(/\\([.*+?^${}()|[\]\\])/g, '$1')
}