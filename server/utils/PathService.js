// PathService - Server-side path utilities for Node.js
const path = require('path');
const fs = require('fs');
const { realpathSync, lstatSync } = require('fs');

class PathService {
    constructor(projectRoot) {
        this.projectRoot = path.resolve(projectRoot);
    }
    
    /**
     * Normalize path (replace all path normalization logic)
     * @param {string} inputPath - Path to normalize
     * @returns {string} Normalized path
     */
    normalize(inputPath) {
        if (!inputPath || !inputPath.trim()) return '';
        return inputPath.trim().replace(/\\/g, '/').replace(/\/+/g, '/');
    }
    
    /**
     * Resolve path relative to project root
     * @param {string} inputPath - Path to resolve
     * @returns {string} Resolved absolute path
     */
    resolve(inputPath) {
        const normalized = this.normalize(inputPath);
        
        // Check if absolute
        if (this.isAbsolute(normalized)) {
            return path.resolve(normalized);
        }
        
        // Resolve relative to project root
        return path.resolve(this.projectRoot, normalized);
    }
    
    /**
     * Check if path is absolute
     * @param {string} inputPath - Path to check
     * @returns {boolean} True if absolute
     */
    isAbsolute(inputPath) {
        const normalized = this.normalize(inputPath);
        return normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized);
    }
    
    /**
     * Validate path is within project root (security)
     * @param {string} inputPath - Path to validate
     * @returns {{valid: boolean, error?: string, path?: string}} Validation result
     */
    validate(inputPath) {
        if (!inputPath || typeof inputPath !== 'string') {
            return {
                valid: false,
                error: 'Invalid path input'
            };
        }
        
        const trimmed = inputPath.trim();
        if (trimmed.length === 0) {
            return {
                valid: false,
                error: 'Path cannot be empty'
            };
        }
        
        // Reject paths with excessive parent directory references
        const parentRefCount = (trimmed.match(/\.\./g) || []).length;
        if (parentRefCount > 5) {
            return {
                valid: false,
                error: 'Path contains too many parent directory references'
            };
        }
        
        // Reject control characters
        if (/[\x00-\x1f]/.test(trimmed)) {
            return {
                valid: false,
                error: 'Path contains invalid characters'
            };
        }
        
        const resolved = this.resolve(trimmed);
        
        // Use realpathSync for canonical path resolution (handles symlinks)
        let canonicalPath;
        try {
            canonicalPath = realpathSync(resolved);
        } catch (error) {
            // File doesn't exist yet - use resolved path
            canonicalPath = resolved;
        }
        
        const normalizedResolved = this.normalize(canonicalPath);
        const normalizedRoot = this.normalize(this.projectRoot);
        
        // Case-insensitive comparison for Windows
        const normalizedResolvedLower = normalizedResolved.toLowerCase();
        const normalizedRootLower = normalizedRoot.toLowerCase();
        
        if (!normalizedResolvedLower.startsWith(normalizedRootLower)) {
            return {
                valid: false,
                error: 'Path is outside of project root'
            };
        }
        
        // Additional check: ensure resolved path doesn't escape via symlinks
        // (realpathSync already resolved symlinks, so canonicalPath should be safe)
        
        return { valid: true, path: canonicalPath };
    }
    
    /**
     * Check if path is a symbolic link
     * @param {string} inputPath - Path to check
     * @returns {boolean} True if path is a symbolic link
     */
    isSymbolicLink(inputPath) {
        try {
            const resolved = this.resolve(inputPath);
            const stats = lstatSync(resolved);
            return stats.isSymbolicLink();
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Normalize path by removing . and .. sequences safely
     * @param {string} inputPath - Path to normalize
     * @returns {string} Normalized path
     */
    normalizePath(inputPath) {
        if (!inputPath || typeof inputPath !== 'string') return '';
        
        const trimmed = inputPath.trim();
        const parts = trimmed.split(/[/\\]+/).filter(p => p !== '');
        const normalized = [];
        
        for (const part of parts) {
            if (part === '.') {
                // Skip current directory
                continue;
            } else if (part === '..') {
                // Go up one level, but don't allow going above root
                if (normalized.length > 0) {
                    normalized.pop();
                }
            } else {
                normalized.push(part);
            }
        }
        
        return normalized.join('/');
    }
    
    /**
     * Get relative path from project root
     * @param {string} inputPath - Full path
     * @returns {string} Relative path
     */
    getRelative(inputPath) {
        const resolved = this.resolve(inputPath);
        return path.relative(this.projectRoot, resolved);
    }
    
    /**
     * Ensure directory exists (create if needed)
     * @param {string} inputPath - Directory path
     * @returns {{success: boolean, error?: string, path?: string}} Result
     */
    ensureDirectory(inputPath) {
        const validation = this.validate(inputPath);
        if (!validation.valid) {
            return validation;
        }
        
        try {
            if (!fs.existsSync(validation.path)) {
                fs.mkdirSync(validation.path, { recursive: true });
            }
            return { 
                success: true, 
                path: this.normalize(this.getRelative(validation.path)) 
            };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    }
}

module.exports = PathService;
