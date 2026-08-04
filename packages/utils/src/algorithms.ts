/**
 * Algorithm utilities
 * Common algorithms for data processing
 */

/**
 * Graph node interface
 */
export interface GraphNode<T = any> {
    id: string
    data: T
    dependencies: string[]
}

/**
 * Perform topological sort on a graph
 * @param nodes - Graph nodes with dependencies
 * @returns Sorted node IDs in topological order
 * @throws Error if graph has a cycle
 */
export function topologicalSort(nodes: GraphNode[]): string[] {
    const nodeMap = new Map<string, GraphNode>()
    const inDegree = new Map<string, number>()
    const adjacencyList = new Map<string, string[]>()

    // Initialize data structures
    for (const node of nodes) {
        nodeMap.set(node.id, node)
        inDegree.set(node.id, 0)
        adjacencyList.set(node.id, [])
    }

    // Build adjacency list and calculate in-degrees
    for (const node of nodes) {
        for (const dep of node.dependencies) {
            if (nodeMap.has(dep)) {
                adjacencyList.get(dep)!.push(node.id)
                inDegree.set(node.id, (inDegree.get(node.id) || 0) + 1)
            }
        }
    }

    // Find all nodes with in-degree 0
    const queue: string[] = []
    for (const [nodeId, degree] of inDegree) {
        if (degree === 0) {
            queue.push(nodeId)
        }
    }

    // Process nodes
    const result: string[] = []
    while (queue.length > 0) {
        const nodeId = queue.shift()!
        result.push(nodeId)

        const neighbors = adjacencyList.get(nodeId) || []
        for (const neighbor of neighbors) {
            const newDegree = (inDegree.get(neighbor) || 0) - 1
            inDegree.set(neighbor, newDegree)
            if (newDegree === 0) {
                queue.push(neighbor)
            }
        }
    }

    // Check for cycle
    if (result.length !== nodes.length) {
        throw new Error('Graph contains a cycle')
    }

    return result
}

/**
 * Build a dependency graph from items with dependencies
 * @param items - Items with their dependencies
 * @param getDependencies - Function to extract dependencies from an item
 * @returns Dependency graph as a Map (item -> dependent items)
 */
export function buildDependencyGraph<T>(
    items: T[],
    getDependencies: (item: T) => string[]
): Map<string, string[]> {
    const graph = new Map<string, string[]>()
    const itemMap = new Map<string, T>()

    // Create item map
    for (const item of items) {
        const id = String((item as any).id || items.indexOf(item))
        itemMap.set(id, item)
        graph.set(id, [])
    }

    // Build dependency graph
    for (const item of items) {
        const id = String((item as any).id || items.indexOf(item))
        const dependencies = getDependencies(item)

        for (const dep of dependencies) {
            if (itemMap.has(dep)) {
                graph.get(dep)!.push(id)
            }
        }
    }

    return graph
}

/**
 * Detect cycles in a graph
 * @param nodes - Graph nodes with dependencies
 * @returns Array of cycle paths (empty if no cycles)
 */
export function detectCycles(nodes: GraphNode[]): string[][] {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const cycles: string[][] = []

    function dfs(nodeId: string, path: string[]): void {
        visited.add(nodeId)
        recursionStack.add(nodeId)
        path.push(nodeId)

        const node = nodes.find((n) => n.id === nodeId)
        if (node) {
            for (const dep of node.dependencies) {
                if (!visited.has(dep)) {
                    dfs(dep, [...path])
                } else if (recursionStack.has(dep)) {
                    // Found a cycle
                    const cycleStart = path.indexOf(dep)
                    const cycle = path.slice(cycleStart).concat(dep)
                    cycles.push(cycle)
                }
            }
        }

        recursionStack.delete(nodeId)
    }

    for (const node of nodes) {
        if (!visited.has(node.id)) {
            dfs(node.id, [])
        }
    }

    return cycles
}

/**
 * Levenshtein distance algorithm for string similarity
 * @param a - First string
 * @param b - Second string
 * @returns Levenshtein distance
 */
export function levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1)
        .fill(null)
        .map(() => Array(a.length + 1).fill(null))

    for (let i = 0; i <= a.length; i++) {
        matrix[0][i] = i
    }

    for (let j = 0; j <= b.length; j++) {
        matrix[j][0] = j
    }

    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const indicator = a[i - 1] === b[j - 1] ? 0 : 1
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1, // deletion
                matrix[j - 1][i] + 1, // insertion
                matrix[j - 1][i - 1] + indicator // substitution
            )
        }
    }

    return matrix[b.length][a.length]
}

/**
 * Calculate similarity between two strings (0-1)
 * @param a - First string
 * @param b - Second string
 * @returns Similarity score (1 = identical, 0 = completely different)
 */
export function stringSimilarity(a: string, b: string): number {
    const maxLength = Math.max(a.length, b.length)
    if (maxLength === 0) return 1
    const distance = levenshteinDistance(a, b)
    return 1 - distance / maxLength
}

/**
 * Debounce function execution
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null
            func(...args)
        }

        if (timeout) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(later, wait)
    }
}

/**
 * Throttle function execution
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false

    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        return obj
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime()) as any
    }

    if (obj instanceof Array) {
        return obj.map((item) => deepClone(item)) as any
    }

    if (obj instanceof Object) {
        const clonedObj = {} as any
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                clonedObj[key] = deepClone((obj as any)[key])
            }
        }
        return clonedObj
    }

    return obj
}

/**
 * Generate a unique ID
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID
 */
export function generateId(prefix: string = ''): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 9)
    return `${prefix}${timestamp}${random}`
}

/**
 * Sleep for a specified duration
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the duration
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 * @param func - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 * @returns Promise that resolves when the function succeeds
 */
export async function retryWithBackoff<T>(
    func: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error | undefined

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await func()
        } catch (error) {
            lastError = error as Error
            const delay = baseDelay * Math.pow(2, i)
            await sleep(delay)
        }
    }

    throw lastError || new Error('Max retries exceeded')
}