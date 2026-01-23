// PathUtils - Path normalization, validation, cross-platform compatibility
// Pure utility functions, no dependencies

/**
 * Normalizes a path by converting backslashes to forward slashes
 * @param {string} path - The path to normalize
 * @returns {string} Normalized path
 */
export function normalize(path) {
    if (!path) return '';
    return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}

/**
 * Joins path segments together
 * @param {...string} paths - Path segments to join
 * @returns {string} Joined path
 */
export function join(...paths) {
    if (paths.length === 0) return '';
    const normalized = paths.map(p => normalize(p)).filter(p => p);
    if (normalized.length === 0) return '';
    
    let result = normalized[0];
    for (let i = 1; i < normalized.length; i++) {
        const segment = normalized[i];
        if (segment.startsWith('/')) {
            result = segment;
        } else {
            result = result.replace(/\/$/, '') + '/' + segment;
        }
    }
    
    return normalize(result);
}

/**
 * Checks if a path is absolute
 * @param {string} path - The path to check
 * @returns {boolean} True if path is absolute
 */
export function isAbsolute(path) {
    if (!path) return false;
    const normalized = normalize(path);
    return normalized.startsWith('/') || /^[A-Za-z]:/.test(path);
}

/**
 * Checks if a path is within a root path
 * @param {string} path - The path to check
 * @param {string} rootPath - The root path
 * @returns {boolean} True if path is within root
 */
export function isWithinRoot(path, rootPath) {
    if (!path || !rootPath) return false;
    const normalizedPath = normalize(path);
    const normalizedRoot = normalize(rootPath);
    
    // Handle absolute paths
    if (isAbsolute(normalizedPath) && isAbsolute(normalizedRoot)) {
        return normalizedPath.startsWith(normalizedRoot + '/') || normalizedPath === normalizedRoot;
    }
    
    // Handle relative paths
    return normalizedPath.startsWith(normalizedRoot + '/') || normalizedPath === normalizedRoot;
}

/**
 * Gets the relative path from a root path
 * @param {string} path - The full path
 * @param {string} rootPath - The root path
 * @returns {string} Relative path
 */
export function getRelativePath(path, rootPath) {
    if (!path || !rootPath) return path || '';
    const normalizedPath = normalize(path);
    const normalizedRoot = normalize(rootPath);
    
    if (normalizedPath.startsWith(normalizedRoot + '/')) {
        return normalizedPath.substring(normalizedRoot.length + 1);
    }
    if (normalizedPath === normalizedRoot) {
        return '';
    }
    return normalizedPath;
}

/**
 * Validates that a path is within a root path (security check)
 * @param {string} path - The path to validate
 * @param {string} rootPath - The root path
 * @returns {object} { valid: boolean, error?: string }
 */
export function validate(path, rootPath) {
    if (!path || !path.trim()) {
        return { valid: false, error: 'Path is required' };
    }
    
    if (!rootPath || !rootPath.trim()) {
        return { valid: false, error: 'Root path is required' };
    }
    
    const normalizedPath = normalize(path.trim());
    const normalizedRoot = normalize(rootPath.trim());
    
    // Check if path is within root
    if (!isWithinRoot(normalizedPath, normalizedRoot)) {
        return { valid: false, error: 'Path is outside of root directory' };
    }
    
    return { valid: true };
}

/**
 * Resolves a path relative to a base path
 * @param {string} basePath - The base path
 * @param {...string} paths - Path segments to resolve
 * @returns {string} Resolved path
 */
export function resolve(basePath, ...paths) {
    if (!basePath) return '';
    
    const normalizedBase = normalize(basePath);
    const allPaths = [normalizedBase, ...paths.map(p => normalize(p))].filter(p => p);
    
    if (allPaths.length === 0) return '';
    if (allPaths.length === 1) return allPaths[0];
    
    let result = allPaths[0];
    for (let i = 1; i < allPaths.length; i++) {
        const segment = allPaths[i];
        if (segment.startsWith('/')) {
            result = segment;
        } else {
            result = result.replace(/\/$/, '') + '/' + segment;
        }
    }
    
    return normalize(result);
}

/**
 * Sanitizes a path by removing dangerous components
 * @param {string} path - The path to sanitize
 * @returns {string} Sanitized path
 */
export function sanitize(path) {
    if (!path) return '';
    
    // Remove null bytes
    let sanitized = path.replace(/\0/g, '');
    
    // Remove dangerous patterns (.., //, etc.)
    sanitized = sanitized.replace(/\.\./g, '');
    sanitized = sanitized.replace(/\/\/+/g, '/');
    
    // Remove leading/trailing whitespace
    sanitized = sanitized.trim();
    
    // Normalize
    return normalize(sanitized);
}

