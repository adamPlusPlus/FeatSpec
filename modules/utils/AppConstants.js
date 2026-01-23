// App Constants - Centralized configuration for all magic numbers
// Single source of truth for timeouts, file patterns, UI constants, buffers, and text limits

class AppConstants {
    /**
     * Timeouts and Delays (in milliseconds)
     */
    static TIMEOUTS = {
        // Short delays
        CHAT_INIT_RETRY: 50,              // Chat initialization retry delay
        MODULE_LOAD_DELAY: 100,           // Module loading retry delay
        FILE_DOWNLOAD_CLEANUP: 200,       // File download cleanup delay
        OVERLAY_HIDE: 300,                // Overlay hide animation delay
        TEXTAREA_RESTORE: 10,             // Textarea restore delay
        RENDER_DELAY: 0,                  // Render delay (immediate)
        
        // File watching
        FILE_WATCH_WAIT: 2000,            // Default file watching wait time (2s)
        FILE_STABILITY: 5000,             // Default file stability time (5s)
        FILE_STABILITY_LONG: 10000,       // Long file stability time (10s)
        FILE_DETECTION_THRESHOLD: 2000,   // File detection threshold (2s)
        FILE_EXISTING_CHECK: 1000,        // Existing file check threshold (1s)
        
        // Automation
        CONTINUOUS_CHECK_INTERVAL: 120000, // Continuous check interval (2min)
        MODAL_AUTO_CLOSE: 2000,           // Modal auto-close delay (2s)
        
        // Server operations
        CURSOR_CLI_TIMEOUT: 300000,       // Cursor CLI timeout (5min)
        SERVER_OPERATION_DELAY: 100       // Server operation delay
    };
    
    /**
     * File Patterns
     */
    static FILE_PATTERNS = {
        // File extensions to watch
        EXTENSIONS: ['*.md', '*.txt', '*.json'],
        
        // File suffixes
        COMPLETE_SUFFIX: '-complete.md',
        COMPLETE_SUFFIX_TXT: '-complete.txt',
        DRAFT_SUFFIX: '-draft.md',
        
        // Complete file patterns
        COMPLETE_PATTERNS: ['*-complete.md', '*-complete.txt'],
        
        // Draft file patterns
        DRAFT_PATTERNS: ['*-draft.md'],
        
        // Pattern templates
        TEMPLATE_COMPLETE: '{stepName}-{automationId}-complete.md',
        TEMPLATE_DRAFT: '{stepName}-{automationId}-draft.md'
    };
    
    /**
     * UI Constants
     */
    static UI = {
        // Z-Index values for UI layering
        Z_INDEX: {
            BASE: 10,
            OVERLAY: 100,
            MODAL: 1000,
            DROPDOWN: 2000,
            DROPDOWN_COUNT: 2001,
            MAX_MODAL: 3000,
            TOOLTIP: 10000,
            CHAT_WINDOW: 10000,
            MAX: 10001
        },
        
        // Chat window constants
        CHAT: {
            MIN_HEIGHT: 300,
            MAX_HEIGHT: 2000,
            DEFAULT_HEIGHT: 700,
            HEIGHT_STEP: 50
        }
    };
    
    /**
     * Buffer and Size Constants
     */
    static BUFFERS = {
        // Cursor CLI max buffer (10MB)
        CURSOR_CLI_MAX: 10 * 1024 * 1024
    };
    
    /**
     * Text Processing Constants
     */
    static TEXT = {
        // Truncation limits
        TRUNCATE_LENGTH: 80,               // Standard truncation length
        TRUNCATE_LONG: 100,                // Long truncation length
        TRUNCATE_PREVIEW: 200,             // Preview truncation length
        TRUNCATE_PREVIEW_LONG: 500,        // Long preview truncation
        TRUNCATE_VERY_LONG: 8000           // Very long truncation (for prompts)
    };
    
    /**
     * Generate complete file name pattern
     * @param {string} stepName - Step name
     * @param {string} automationId - Automation ID
     * @returns {string} Complete file name pattern
     */
    static generateCompleteFileName(stepName, automationId) {
        if (automationId) {
            return `${stepName}-${automationId}${this.FILE_PATTERNS.COMPLETE_SUFFIX}`;
        }
        return `${stepName}${this.FILE_PATTERNS.COMPLETE_SUFFIX}`;
    }
    
    /**
     * Generate draft file name pattern
     * @param {string} stepName - Step name
     * @param {string} automationId - Automation ID
     * @returns {string} Draft file name pattern
     */
    static generateDraftFileName(stepName, automationId) {
        if (automationId) {
            return `${stepName}-${automationId}${this.FILE_PATTERNS.DRAFT_SUFFIX}`;
        }
        return `${stepName}${this.FILE_PATTERNS.DRAFT_SUFFIX}`;
    }
    
    /**
     * Check if file name matches a pattern
     * @param {string} fileName - File name to check
     * @param {string} pattern - Pattern to match (supports wildcards)
     * @returns {boolean} True if file matches pattern
     */
    static matchesFilePattern(fileName, pattern) {
        if (!fileName || !pattern) return false;
        
        // Convert pattern to regex
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        return regex.test(fileName);
    }
    
    /**
     * Check if file is a complete file based on patterns
     * @param {string} fileName - File name to check
     * @returns {boolean} True if file matches complete pattern
     */
    static isCompleteFile(fileName) {
        if (!fileName) return false;
        return this.FILE_PATTERNS.COMPLETE_PATTERNS.some(pattern => 
            this.matchesFilePattern(fileName, pattern)
        );
    }
    
    /**
     * Check if file is a draft file based on patterns
     * @param {string} fileName - File name to check
     * @returns {boolean} True if file matches draft pattern
     */
    static isDraftFile(fileName) {
        if (!fileName) return false;
        return this.FILE_PATTERNS.DRAFT_PATTERNS.some(pattern => 
            this.matchesFilePattern(fileName, pattern)
        );
    }
    
    /**
     * Convert draft file name to complete file name
     * @param {string} draftFileName - Draft file name
     * @returns {string} Complete file name
     */
    static draftToComplete(draftFileName) {
        if (!draftFileName) return '';
        return draftFileName.replace(
            this.FILE_PATTERNS.DRAFT_SUFFIX, 
            this.FILE_PATTERNS.COMPLETE_SUFFIX
        );
    }
    
    /**
     * Convert complete file name to draft file name
     * @param {string} completeFileName - Complete file name
     * @returns {string} Draft file name
     */
    static completeToDraft(completeFileName) {
        if (!completeFileName) return '';
        return completeFileName.replace(
            this.FILE_PATTERNS.COMPLETE_SUFFIX, 
            this.FILE_PATTERNS.DRAFT_SUFFIX
        );
    }
}
