// Server Error Handler - Node.js compatible error handling utility
// Similar interface to client-side ErrorHandler but for server-side use

class ServerErrorHandler {
    constructor(options = {}) {
        this.logToConsole = options.logToConsole !== false;
    }
    
    // Error code constants (matching client-side ErrorHandler)
    static ErrorCode = {
        NETWORK_ERROR: 'NETWORK_ERROR',
        STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
        VALIDATION_ERROR: 'VALIDATION_ERROR',
        FILE_NOT_FOUND: 'FILE_NOT_FOUND',
        PERMISSION_DENIED: 'PERMISSION_DENIED',
        FILE_READ_ERROR: 'FILE_READ_ERROR',
        FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
        TIMEOUT_ERROR: 'TIMEOUT_ERROR',
        UNKNOWN_ERROR: 'UNKNOWN_ERROR'
    };
    
    /**
     * Handle async operation errors
     * @param {Function} operation - Async function to execute
     * @param {object} context - Context information (source, operation, etc.)
     * @returns {Promise<{success: boolean, data?: any, error?: string, code?: string}>}
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
     * @param {object} context - Context information
     * @returns {{success: boolean, data?: any, error?: string, code?: string}}
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
     * @returns {{success: boolean, error: string, code: string, context: object}}
     */
    handleError(error, context = {}) {
        const errorInfo = this.normalizeError(error);
        const errorResponse = {
            success: false,
            error: errorInfo.message,
            code: errorInfo.code,
            context: { ...context, ...errorInfo.context }
        };
        
        // Log error
        if (this.logToConsole) {
            this.logError(errorInfo, context);
        }
        
        return errorResponse;
    }
    
    /**
     * Normalize different error types to standard format
     * @param {Error|string|object} error - Error to normalize
     * @returns {{message: string, code: string, context: object}}
     */
    normalizeError(error) {
        if (error instanceof Error) {
            // Determine error code from error message or type
            let code = ServerErrorHandler.ErrorCode.UNKNOWN_ERROR;
            if (error.message.includes('quota') || error.message.includes('storage')) {
                code = ServerErrorHandler.ErrorCode.STORAGE_QUOTA_EXCEEDED;
            } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
                code = ServerErrorHandler.ErrorCode.TIMEOUT_ERROR;
            } else if (error.message.includes('network') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
                code = ServerErrorHandler.ErrorCode.NETWORK_ERROR;
            } else if (error.message.includes('permission') || error.message.includes('denied') || error.message.includes('EACCES')) {
                code = ServerErrorHandler.ErrorCode.PERMISSION_DENIED;
            } else if (error.message.includes('not found') || error.message.includes('ENOENT')) {
                code = ServerErrorHandler.ErrorCode.FILE_NOT_FOUND;
            } else if (error.message.includes('read') || error.message.includes('EISDIR')) {
                code = ServerErrorHandler.ErrorCode.FILE_READ_ERROR;
            } else if (error.message.includes('write') || error.message.includes('EIO')) {
                code = ServerErrorHandler.ErrorCode.FILE_WRITE_ERROR;
            }
            
            return {
                message: error.message,
                code: error.code || code,
                context: { stack: error.stack }
            };
        } else if (typeof error === 'string') {
            return {
                message: error,
                code: ServerErrorHandler.ErrorCode.UNKNOWN_ERROR,
                context: {}
            };
        } else if (error && typeof error === 'object') {
            return {
                message: error.error || error.message || 'Unknown error occurred',
                code: error.code || ServerErrorHandler.ErrorCode.UNKNOWN_ERROR,
                context: error.context || {}
            };
        }
        
        return {
            message: 'Unknown error occurred',
            code: ServerErrorHandler.ErrorCode.UNKNOWN_ERROR,
            context: {}
        };
    }
    
    /**
     * Log error with context
     * @param {object} errorInfo - Normalized error information
     * @param {object} context - Additional context
     */
    logError(errorInfo, context) {
        const logMessage = `[${context.source || 'Error'}] ${errorInfo.message}`;
        console.error(logMessage, context);
    }
    
    /**
     * Send error response to HTTP client
     * @param {object} res - HTTP response object
     * @param {Error|string|object} error - Error to send
     * @param {object} context - Context information
     * @param {number} statusCode - HTTP status code (default: 500)
     */
    sendErrorResponse(res, error, context = {}, statusCode = 500) {
        const errorResponse = this.handleError(error, context);
        
        // Determine appropriate HTTP status code
        let httpStatus = statusCode;
        if (errorResponse.code === ServerErrorHandler.ErrorCode.FILE_NOT_FOUND) {
            httpStatus = 404;
        } else if (errorResponse.code === ServerErrorHandler.ErrorCode.PERMISSION_DENIED) {
            httpStatus = 403;
        } else if (errorResponse.code === ServerErrorHandler.ErrorCode.VALIDATION_ERROR) {
            httpStatus = 400;
        }
        
        res.writeHead(httpStatus, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errorResponse));
    }
    
    /**
     * Send success response to HTTP client
     * @param {object} res - HTTP response object
     * @param {any} data - Data to send
     * @param {number} statusCode - HTTP status code (default: 200)
     */
    sendSuccessResponse(res, data, statusCode = 200) {
        const response = {
            success: true,
            data: data
        };
        
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
    }
}

module.exports = ServerErrorHandler;
