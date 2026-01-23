// InputValidator - Input validation utilities for security
// Validates and sanitizes user inputs before processing

/**
 * Validates project name
 * @param {string} name - Project name to validate
 * @returns {{valid: boolean, error?: string, sanitized?: string}}
 */
export function validateProjectName(name) {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: 'Project name is required' };
    }
    
    const trimmed = name.trim();
    
    if (trimmed.length === 0) {
        return { valid: false, error: 'Project name cannot be empty' };
    }
    
    if (trimmed.length > 100) {
        return { valid: false, error: 'Project name must be 100 characters or less' };
    }
    
    // Allow alphanumeric, spaces, hyphens, underscores, and basic punctuation
    // Reject special characters that could be used for injection
    const validPattern = /^[a-zA-Z0-9\s\-_.,!?()]+$/;
    if (!validPattern.test(trimmed)) {
        return { valid: false, error: 'Project name contains invalid characters' };
    }
    
    return { valid: true, sanitized: trimmed };
}

/**
 * Validates section name
 * @param {string} name - Section name to validate
 * @returns {{valid: boolean, error?: string, sanitized?: string}}
 */
export function validateSectionName(name) {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: 'Section name is required' };
    }
    
    const trimmed = name.trim();
    
    if (trimmed.length === 0) {
        return { valid: false, error: 'Section name cannot be empty' };
    }
    
    if (trimmed.length > 100) {
        return { valid: false, error: 'Section name must be 100 characters or less' };
    }
    
    // Similar validation to project name
    const validPattern = /^[a-zA-Z0-9\s\-_.,!?()]+$/;
    if (!validPattern.test(trimmed)) {
        return { valid: false, error: 'Section name contains invalid characters' };
    }
    
    return { valid: true, sanitized: trimmed };
}

/**
 * Validates filename
 * @param {string} filename - Filename to validate
 * @returns {{valid: boolean, error?: string, sanitized?: string}}
 */
export function validateFilename(filename) {
    if (!filename || typeof filename !== 'string') {
        return { valid: false, error: 'Filename is required' };
    }
    
    const trimmed = filename.trim();
    
    if (trimmed.length === 0) {
        return { valid: false, error: 'Filename cannot be empty' };
    }
    
    if (trimmed.length > 255) {
        return { valid: false, error: 'Filename must be 255 characters or less' };
    }
    
    // Reject path separators (security: prevent path traversal)
    if (trimmed.includes('/') || trimmed.includes('\\')) {
        return { valid: false, error: 'Filename cannot contain path separators' };
    }
    
    // Reject parent directory references
    if (trimmed.includes('..')) {
        return { valid: false, error: 'Filename cannot contain parent directory references' };
    }
    
    // Reject control characters and special shell characters
    if (/[<>:"|?*\x00-\x1f]/.test(trimmed)) {
        return { valid: false, error: 'Filename contains invalid characters' };
    }
    
    // Allow alphanumeric, dots, hyphens, underscores
    const validPattern = /^[a-zA-Z0-9._-]+$/;
    if (!validPattern.test(trimmed)) {
        return { valid: false, error: 'Filename contains invalid characters' };
    }
    
    return { valid: true, sanitized: trimmed };
}

/**
 * Validates path (client-side validation before sending to server)
 * @param {string} inputPath - Path to validate
 * @returns {{valid: boolean, error?: string}}
 */
export function validatePath(inputPath) {
    if (!inputPath || typeof inputPath !== 'string') {
        return { valid: false, error: 'Path is required' };
    }
    
    const trimmed = inputPath.trim();
    
    if (trimmed.length === 0) {
        return { valid: false, error: 'Path cannot be empty' };
    }
    
    // Reject paths with too many parent directory references
    const parentRefCount = (trimmed.match(/\.\./g) || []).length;
    if (parentRefCount > 5) {
        return { valid: false, error: 'Path contains too many parent directory references' };
    }
    
    // Reject control characters
    if (/[\x00-\x1f]/.test(trimmed)) {
        return { valid: false, error: 'Path contains invalid characters' };
    }
    
    // Note: Full path validation should be done server-side with PathService
    return { valid: true };
}

/**
 * Validates automation ID
 * @param {string} id - Automation ID to validate
 * @returns {{valid: boolean, error?: string, sanitized?: string}}
 */
export function validateAutomationId(id) {
    if (!id || typeof id !== 'string') {
        return { valid: true, sanitized: '' }; // Automation ID is optional
    }
    
    const trimmed = id.trim();
    
    if (trimmed.length > 20) {
        return { valid: false, error: 'Automation ID must be 20 characters or less' };
    }
    
    // Allow alphanumeric and hyphens only
    const validPattern = /^[a-zA-Z0-9-]+$/;
    if (!validPattern.test(trimmed)) {
        return { valid: false, error: 'Automation ID can only contain letters, numbers, and hyphens' };
    }
    
    return { valid: true, sanitized: trimmed };
}

/**
 * Sanitizes user input based on type
 * @param {string} input - Input to sanitize
 * @param {string} type - Input type ('text', 'filename', 'path', 'id')
 * @returns {string} Sanitized input
 */
export function sanitizeUserInput(input, type = 'text') {
    if (typeof input !== 'string') return '';
    
    switch (type) {
        case 'filename':
            // Remove path separators and control characters
            return input.replace(/[/\\<>:"|?*\x00-\x1f]/g, '').replace(/\.\./g, '').trim();
        case 'path':
            // Remove control characters only (path validation done server-side)
            return input.replace(/[\x00-\x1f]/g, '').trim();
        case 'id':
            // Allow only alphanumeric and hyphens
            return input.replace(/[^a-zA-Z0-9-]/g, '').trim();
        case 'text':
        default:
            // Remove control characters
            return input.replace(/[\x00-\x1f]/g, '').trim();
    }
}

// Make functions available globally for non-ES-module scripts
if (typeof window !== 'undefined') {
    window.InputValidator = {
        validateProjectName,
        validateSectionName,
        validateFilename,
        validatePath,
        validateAutomationId,
        sanitizeUserInput
    };
    
    // Also expose as individual functions for convenience
    window.validateProjectName = validateProjectName;
    window.validateSectionName = validateSectionName;
    window.validateFilename = validateFilename;
    window.validatePath = validatePath;
    window.validateAutomationId = validateAutomationId;
    window.sanitizeUserInput = sanitizeUserInput;
}

// Export for ES modules (if imported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateProjectName,
        validateSectionName,
        validateFilename,
        validatePath,
        validateAutomationId,
        sanitizeUserInput
    };
}
