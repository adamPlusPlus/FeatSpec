// Error Handler - Centralized error handling service
class ErrorHandler {
    constructor(eventSystem, options = {}) {
        this.eventSystem = eventSystem;
        this.logToConsole = options.logToConsole !== false;
        this.emitEvents = options.emitEvents !== false;
        this.modalSystem = options.modalSystem || null;
        this.defaultRetryCount = options.defaultRetryCount || 3;
        this.defaultRetryBaseDelay = options.defaultRetryBaseDelay || 1000; // 1 second
    }
    
    // Error code constants
    static ErrorCode = {
        NETWORK_ERROR: 'NETWORK_ERROR',
        STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        FILE_NOT_FOUND: 'FILE_NOT_FOUND',
        PERMISSION_DENIED: 'PERMISSION_DENIED',
        FILE_READ_ERROR: 'FILE_READ_ERROR',
        FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
        TIMEOUT_ERROR: 'TIMEOUT_ERROR',
        RETRY_EXHAUSTED: 'RETRY_EXHAUSTED',
        FALLBACK_USED: 'FALLBACK_USED',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };
    
    // Notification severity levels
    static Severity = {
        INFO: 'info',
        WARNING: 'warning',
        ERROR: 'error',
        CRITICAL: 'critical'
    };
    
    /**
     * Handle async operation errors
     * @param {Function} operation - Async function to execute
     * @param {object} context - Context information (source, operation, etc.)
     * @returns {Promise<{success: boolean, data?: any, error?: string, code?: string, context?: object}>}
     */
    async handleAsync(operation, context = {}) {
        try {
            const data = await operation();
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, context);
        }
    }
    
    /**
     * Handle sync operation errors
     * @param {Function} operation - Sync function to execute
     * @param {object} context - Context information (source, operation, etc.)
     * @returns {{success: boolean, data?: any, error?: string, code?: string, context?: object}}
     */
    handleSync(operation, context = {}) {
        try {
            const data = operation();
            return { success: true, data };
        } catch (error) {
            return this.handleError(error, context);
        }
    }
    
    /**
     * Central error handling
     * @param {Error|string|object} error - Error to handle
     * @param {object} context - Context information
     * @returns {{success: boolean, error: string, code: string, context: object, recoverable: boolean}}
     */
    handleError(error, context = {}) {
        const errorInfo = this.normalizeError(error);
        const errorResponse = {
            success: false,
            error: errorInfo.message,
            code: errorInfo.code,
            context: { ...context, ...errorInfo.context },
            recoverable: errorInfo.recoverable
        };
        
        // Log error
        if (this.logToConsole) {
            this.logError(errorInfo, context);
        }
        
        // Emit event
        if (this.emitEvents && this.eventSystem) {
            this.eventSystem.emit(window.EventType.ERROR_OCCURRED, {
                source: context.source || 'ErrorHandler',
                data: errorResponse
            });
        }
        
        return errorResponse;
    }
    
    /**
     * Normalize different error types to standard format
     * @param {Error|string|object} error - Error to normalize
     * @returns {{message: string, code: string, context: object, recoverable: boolean}}
     */
    normalizeError(error) {
        if (error instanceof Error) {
            // Determine error code from error message or type
            let code = ErrorHandler.ErrorCode.UNKNOWN_ERROR;
            if (error.message.includes('quota') || error.message.includes('storage')) {
                code = ErrorHandler.ErrorCode.STORAGE_QUOTA_EXCEEDED;
            } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT') || error.name === 'TimeoutError') {
                code = ErrorHandler.ErrorCode.TIMEOUT_ERROR;
            } else if (error.message.includes('network') || error.message.includes('fetch') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
                code = ErrorHandler.ErrorCode.NETWORK_ERROR;
            } else if (error.message.includes('permission') || error.message.includes('denied') || error.message.includes('EACCES')) {
                code = ErrorHandler.ErrorCode.PERMISSION_DENIED;
            } else if (error.message.includes('not found') || error.message.includes('ENOENT')) {
                code = ErrorHandler.ErrorCode.FILE_NOT_FOUND;
            } else if (error.message.includes('read') || error.message.includes('EISDIR')) {
                code = ErrorHandler.ErrorCode.FILE_READ_ERROR;
            } else if (error.message.includes('write') || error.message.includes('EIO')) {
                code = ErrorHandler.ErrorCode.FILE_WRITE_ERROR;
            }
            
            return {
                message: error.message,
                code: error.code || code,
                context: { stack: error.stack },
                recoverable: this.isRecoverable(error, code)
            };
        } else if (typeof error === 'string') {
            return {
                message: error,
                code: ErrorHandler.ErrorCode.UNKNOWN_ERROR,
                context: {},
                recoverable: true
            };
        } else if (error && typeof error === 'object') {
            // Handle error objects like { success: false, error: '...' }
            return {
                message: error.error || error.message || 'Unknown error occurred',
                code: error.code || ErrorHandler.ErrorCode.UNKNOWN_ERROR,
                context: error.context || {},
                recoverable: error.recoverable !== false
            };
        }
        
        return {
            message: 'Unknown error occurred',
            code: ErrorHandler.ErrorCode.UNKNOWN_ERROR,
            context: {},
            recoverable: false
        };
    }
    
    /**
     * Log error with context
     * @param {object} errorInfo - Normalized error information
     * @param {object} context - Additional context
     */
    logError(errorInfo, context) {
        const logMessage = `[${context.source || 'Error'}] ${errorInfo.message}`;
        if (errorInfo.recoverable) {
            console.warn(logMessage, context);
        } else {
            console.error(logMessage, context, errorInfo.context);
        }
    }
    
    /**
     * Determine if error is recoverable
     * @param {Error} error - Error object
     * @param {string} code - Error code
     * @returns {boolean}
     */
    isRecoverable(error, code) {
        // Network errors, validation errors, storage quota are usually recoverable
        // Syntax errors, type errors are usually not
        const recoverableCodes = [
            ErrorHandler.ErrorCode.NETWORK_ERROR,
            ErrorHandler.ErrorCode.VALIDATION_ERROR,
            ErrorHandler.ErrorCode.STORAGE_QUOTA_EXCEEDED,
            ErrorHandler.ErrorCode.TIMEOUT_ERROR,
            ErrorHandler.ErrorCode.FILE_NOT_FOUND
        ];
        return recoverableCodes.includes(code);
    }
    
    /**
     * Create user-friendly error message
     * @param {Error|string|object} error - Error to convert
     * @param {object} context - Additional context
     * @returns {string}
     */
    getUserMessage(error, context = {}) {
        const errorInfo = this.normalizeError(error);
        const userMessages = {
            [ErrorHandler.ErrorCode.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
            [ErrorHandler.ErrorCode.STORAGE_QUOTA_EXCEEDED]: 'Storage quota exceeded. Please free up space.',
            [ErrorHandler.ErrorCode.VALIDATION_ERROR]: 'Invalid input. Please check your data.',
            [ErrorHandler.ErrorCode.FILE_NOT_FOUND]: 'File not found. Please check the file path.',
            [ErrorHandler.ErrorCode.PERMISSION_DENIED]: 'Permission denied. Please check file permissions.',
            [ErrorHandler.ErrorCode.FILE_READ_ERROR]: 'Failed to read file. Please check file permissions.',
            [ErrorHandler.ErrorCode.FILE_WRITE_ERROR]: 'Failed to write file. Please check file permissions.',
            [ErrorHandler.ErrorCode.TIMEOUT_ERROR]: 'Operation timed out. Please try again.',
            [ErrorHandler.ErrorCode.RETRY_EXHAUSTED]: 'Operation failed after multiple attempts. Please check your connection and try again.',
            [ErrorHandler.ErrorCode.FALLBACK_USED]: 'Primary operation failed, but fallback succeeded.',
            [ErrorHandler.ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
        };
        
        return userMessages[errorInfo.code] || errorInfo.message || 'An error occurred';
    }
    
    /**
     * Check if error is a network error
     * @param {Error|object} error - Error to check
     * @returns {boolean}
     */
    isNetworkError(error) {
        const errorInfo = this.normalizeError(error);
        return errorInfo.code === ErrorHandler.ErrorCode.NETWORK_ERROR ||
               errorInfo.code === ErrorHandler.ErrorCode.TIMEOUT_ERROR ||
               (error instanceof TypeError && error.message.includes('fetch')) ||
               (error && error.message && (
                   error.message.includes('network') ||
                   error.message.includes('fetch') ||
                   error.message.includes('timeout') ||
                   error.message.includes('ECONNREFUSED') ||
                   error.message.includes('ENOTFOUND')
               ));
    }
    
    /**
     * Determine if error should be retried
     * @param {Error|object} error - Error to check
     * @param {number} attempt - Current attempt number (1-based)
     * @param {number} maxRetries - Maximum retry count
     * @returns {boolean}
     */
    shouldRetry(error, attempt, maxRetries) {
        if (attempt >= maxRetries) {
            return false;
        }
        
        const errorInfo = this.normalizeError(error);
        
        // Only retry recoverable errors
        if (!errorInfo.recoverable) {
            return false;
        }
        
        // Retry network errors, timeouts, and 5xx server errors
        if (this.isNetworkError(error)) {
            return true;
        }
        
        // Retry validation errors (might be transient)
        if (errorInfo.code === ErrorHandler.ErrorCode.VALIDATION_ERROR) {
            return true;
        }
        
        // Check for HTTP 5xx errors
        if (error && typeof error === 'object' && error.status >= 500) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Calculate retry delay with exponential backoff
     * @param {number} attempt - Current attempt number (1-based)
     * @param {number} baseDelay - Base delay in milliseconds
     * @returns {number} Delay in milliseconds
     */
    getRetryDelay(attempt, baseDelay = null) {
        const delay = baseDelay || this.defaultRetryBaseDelay;
        // Exponential backoff: delay * 2^(attempt-1)
        return delay * Math.pow(2, attempt - 1);
    }
    
    /**
     * Handle async operation with retry logic
     * @param {Function} operation - Async function to execute
     * @param {object} context - Context information
     * @param {object} options - Retry options { maxRetries, baseDelay, onRetry }
     * @returns {Promise<{success: boolean, data?: any, error?: string, code?: string, attempts?: number}>}
     */
    async handleAsyncWithRetry(operation, context = {}, options = {}) {
        const maxRetries = options.maxRetries || this.defaultRetryCount;
        const baseDelay = options.baseDelay || this.defaultRetryBaseDelay;
        const onRetry = options.onRetry || null;
        
        let lastError = null;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const data = await operation();
                return { 
                    success: true, 
                    data,
                    attempts: attempt
                };
            } catch (error) {
                lastError = error;
                
                // Check if we should retry
                if (this.shouldRetry(error, attempt, maxRetries)) {
                    const delay = this.getRetryDelay(attempt, baseDelay);
                    
                    if (onRetry) {
                        onRetry(error, attempt, delay);
                    }
                    
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                } else {
                    // Not retryable or max retries reached
                    break;
                }
            }
        }
        
        // All retries exhausted
        const errorResponse = this.handleError(lastError, {
            ...context,
            attempts: maxRetries,
            retryExhausted: true
        });
        
        errorResponse.code = ErrorHandler.ErrorCode.RETRY_EXHAUSTED;
        errorResponse.attempts = maxRetries;
        
        return errorResponse;
    }
    
    /**
     * Handle operation with fallback strategy
     * @param {Function} primaryOperation - Primary async function to execute
     * @param {Function} fallbackOperation - Fallback async function to execute if primary fails
     * @param {object} context - Context information
     * @returns {Promise<{success: boolean, data?: any, error?: string, code?: string, usedFallback?: boolean}>}
     */
    async handleWithFallback(primaryOperation, fallbackOperation, context = {}) {
        try {
            const data = await primaryOperation();
            return { success: true, data, usedFallback: false };
        } catch (primaryError) {
            // Primary failed, try fallback
            try {
                const fallbackData = await fallbackOperation();
                
                // Log that fallback was used
                const errorInfo = this.normalizeError(primaryError);
                if (this.logToConsole) {
                    console.warn(`[${context.source || 'ErrorHandler'}] Primary operation failed, using fallback:`, errorInfo.message);
                }
                
                return { 
                    success: true, 
                    data: fallbackData, 
                    usedFallback: true,
                    code: ErrorHandler.ErrorCode.FALLBACK_USED,
                    primaryError: errorInfo.message
                };
            } catch (fallbackError) {
                // Both primary and fallback failed
                const errorResponse = this.handleError(fallbackError, {
                    ...context,
                    primaryError: primaryError,
                    fallbackFailed: true
                });
                
                errorResponse.primaryError = this.normalizeError(primaryError).message;
                return errorResponse;
            }
        }
    }
    
    /**
     * Show user notification for error
     * @param {Error|string|object} error - Error to display
     * @param {object} context - Context information
     * @param {object} options - Notification options { severity, title, showModal, autoDismiss }
     * @returns {void}
     */
    showUserNotification(error, context = {}, options = {}) {
        const errorInfo = this.normalizeError(error);
        const severity = options.severity || this._determineSeverity(errorInfo);
        const title = options.title || this._getNotificationTitle(severity);
        const message = options.message || this.getUserMessage(error, context);
        const showModal = options.showModal !== undefined ? options.showModal : (severity === ErrorHandler.Severity.ERROR || severity === ErrorHandler.Severity.CRITICAL);
        const autoDismiss = options.autoDismiss !== undefined ? options.autoDismiss : (severity === ErrorHandler.Severity.INFO || severity === ErrorHandler.Severity.WARNING);
        const dismissDelay = options.dismissDelay || this._getDismissDelay(severity);
        
        // Use modal system if available and showModal is true
        if (showModal && this.modalSystem) {
            this._showModalNotification(title, message, severity, context);
        } else if (showModal) {
            // Fallback to alert if no modal system
            alert(`${title}\n\n${message}`);
        } else {
            // Show toast notification
            this._showToastNotification(message, severity, dismissDelay);
        }
        
        // Emit notification event
        if (this.emitEvents && this.eventSystem) {
            this.eventSystem.emit(window.EventType.ERROR_OCCURRED, {
                source: context.source || 'ErrorHandler',
                data: {
                    error: errorInfo.message,
                    code: errorInfo.code,
                    severity: severity,
                    notificationShown: true
                }
            });
        }
    }
    
    /**
     * Determine notification severity from error
     * @private
     * @param {object} errorInfo - Normalized error information
     * @returns {string}
     */
    _determineSeverity(errorInfo) {
        // Critical errors: storage quota, permission denied
        if (errorInfo.code === ErrorHandler.ErrorCode.STORAGE_QUOTA_EXCEEDED ||
            errorInfo.code === ErrorHandler.ErrorCode.PERMISSION_DENIED) {
            return ErrorHandler.Severity.CRITICAL;
        }
        
        // Errors: file operations, network failures
        if (errorInfo.code === ErrorHandler.ErrorCode.FILE_READ_ERROR ||
            errorInfo.code === ErrorHandler.ErrorCode.FILE_WRITE_ERROR ||
            errorInfo.code === ErrorHandler.ErrorCode.NETWORK_ERROR ||
            errorInfo.code === ErrorHandler.ErrorCode.RETRY_EXHAUSTED) {
            return ErrorHandler.Severity.ERROR;
        }
        
        // Warnings: validation errors, file not found (might be recoverable)
        if (errorInfo.code === ErrorHandler.ErrorCode.VALIDATION_ERROR ||
            errorInfo.code === ErrorHandler.ErrorCode.FILE_NOT_FOUND) {
            return ErrorHandler.Severity.WARNING;
        }
        
        // Default to error
        return ErrorHandler.Severity.ERROR;
    }
    
    /**
     * Get notification title based on severity
     * @private
     * @param {string} severity - Severity level
     * @returns {string}
     */
    _getNotificationTitle(severity) {
        const titles = {
            [ErrorHandler.Severity.INFO]: 'Information',
            [ErrorHandler.Severity.WARNING]: 'Warning',
            [ErrorHandler.Severity.ERROR]: 'Error',
            [ErrorHandler.Severity.CRITICAL]: 'Critical Error'
        };
        return titles[severity] || 'Error';
    }
    
    /**
     * Get auto-dismiss delay based on severity
     * @private
     * @param {string} severity - Severity level
     * @returns {number} Delay in milliseconds
     */
    _getDismissDelay(severity) {
        const delays = {
            [ErrorHandler.Severity.INFO]: 3000,      // 3 seconds
            [ErrorHandler.Severity.WARNING]: 5000,   // 5 seconds
            [ErrorHandler.Severity.ERROR]: 0,        // No auto-dismiss
            [ErrorHandler.Severity.CRITICAL]: 0      // No auto-dismiss
        };
        return delays[severity] || 0;
    }
    
    /**
     * Show modal notification
     * @private
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} severity - Severity level
     * @param {object} context - Context information
     */
    _showModalNotification(title, message, severity, context) {
        if (this.modalSystem) {
            const modalBody = document.getElementById('modal-body');
            if (modalBody) {
                // title and message are user-controlled error messages - escape and use safeSetInnerHTML
                const escapeHtml = (text) => {
                    if (typeof text !== 'string') return '';
                    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
                };
                const modalHtml = `
                    <h3>${escapeHtml(title)}</h3>
                    <p>${escapeHtml(message)}</p>
                    <div style="margin-top: 20px;">
                        <button class="btn-primary" data-action="close-modal">OK</button>
                    </div>
                `;
                if (window.safeSetInnerHTML) {
                    window.safeSetInnerHTML(modalBody, modalHtml, { trusted: false });
                } else {
                    modalBody.innerHTML = modalHtml;
                }
                const modal = document.getElementById('modal');
                if (modal) {
                    modal.classList.add('active');
                }
            }
        }
    }
    
    /**
     * Show toast notification
     * @private
     * @param {string} message - Notification message
     * @param {string} severity - Severity level
     * @param {number} dismissDelay - Auto-dismiss delay in milliseconds
     */
    _showToastNotification(message, severity, dismissDelay) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `error-toast error-toast-${severity}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this._getToastColor(severity)};
            color: #fff;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            word-wrap: break-word;
            animation: slideIn 0.3s ease-out;
        `;
        toast.textContent = message;
        
        // Add animation styles if not already present
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        // Auto-dismiss if delay is set
        if (dismissDelay > 0) {
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, dismissDelay);
        } else {
            // Add close button for non-auto-dismiss toasts
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.style.cssText = `
                position: absolute;
                top: 4px;
                right: 8px;
                background: transparent;
                border: none;
                color: #fff;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                line-height: 24px;
            `;
            closeBtn.onclick = () => {
                toast.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            };
            toast.appendChild(closeBtn);
        }
    }
    
    /**
     * Get toast background color based on severity
     * @private
     * @param {string} severity - Severity level
     * @returns {string} CSS color value
     */
    _getToastColor(severity) {
        const colors = {
            [ErrorHandler.Severity.INFO]: '#4a9eff',
            [ErrorHandler.Severity.WARNING]: '#ffa500',
            [ErrorHandler.Severity.ERROR]: '#ff4444',
            [ErrorHandler.Severity.CRITICAL]: '#cc0000'
        };
        return colors[severity] || '#666';
    }
}
