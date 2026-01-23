// FileContextReader - Reading files from scope directory, file filtering, content aggregation
// Uses fetch API for server communication

/**
 * Gets list of text file extensions
 * @returns {string[]} Array of text file extensions (with dots)
 */
export function getTextFileExtensions() {
    return [
        '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.json', '.html', '.css', '.scss',
        '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.go', '.rs', '.rb', '.php',
        '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.log', '.sh', '.bat',
        '.ps1', '.sql', '.r', '.m', '.swift', '.kt', '.dart', '.vue', '.svelte',
        '.graphql', '.gql', '.proto', '.thrift', '.avsc', '.avdl'
    ];
}

/**
 * Filters files to only include text files
 * @param {Array} files - Array of file objects with extension property
 * @returns {Array} Filtered array of text files
 */
export function filterTextFiles(files) {
    if (!Array.isArray(files)) return [];
    
    const textExtensions = getTextFileExtensions();
    return files.filter(file => {
        const ext = (file.extension || '').toLowerCase();
        return textExtensions.includes(ext);
    });
}

/**
 * Lists files in a scope directory (recursive)
 * @param {string} scopeDirectory - The scope directory path
 * @param {number} maxDepth - Maximum recursion depth (default: 10)
 * @returns {Promise<object>} { success: boolean, files?: Array, error?: string }
 */
export async function listScopeFiles(scopeDirectory, maxDepth = 10) {
    if (!scopeDirectory || !scopeDirectory.trim()) {
        return { success: false, error: 'Scope directory is required' };
    }
    
    try {
        const response = await fetch('/api/list-scope-files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                scopeDirectory: scopeDirectory.trim(),
                maxDepth
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            return { success: false, error: error || 'Failed to list files' };
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        return { success: false, error: error.message || 'Network error' };
    }
}

/**
 * Reads multiple files from the server
 * @param {Array<string>} filePaths - Array of file paths to read
 * @returns {Promise<object>} { success: boolean, files?: Array<{path, content}>, error?: string }
 */
export async function readScopeFiles(filePaths) {
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
        return { success: false, error: 'File paths array is required' };
    }
    
    const results = [];
    const errors = [];
    
    // Read files in parallel (with reasonable concurrency limit)
    const batchSize = 10;
    for (let i = 0; i < filePaths.length; i += batchSize) {
        const batch = filePaths.slice(i, i + batchSize);
        const promises = batch.map(async (filePath) => {
            const errorHandler = window.ErrorHandler || null;
            
            if (errorHandler) {
                const result = await errorHandler.handleAsyncWithRetry(
                    async () => {
                        const response = await fetch('/api/read', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ filePath })
                        });
                        
                        if (!response.ok) {
                            const error = await response.text();
                            throw new Error(error || `Server error: ${response.status}`);
                        }
                        
                        const result = await response.json();
                        if (result.success && result.content !== undefined) {
                            return { path: filePath, content: result.content };
                        } else {
                            throw new Error(result.error || 'Unknown error');
                        }
                    },
                    { source: 'FileContextReader', operation: 'readScopeFiles', filePath },
                    { maxRetries: 2, baseDelay: 500 }
                );
                
                if (!result.success) {
                    errors.push({ path: filePath, error: result.error || 'Failed to read file' });
                    return null;
                }
                
                return result.data;
            } else {
                // Fallback to original logic
                try {
                    const response = await fetch('/api/read', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ filePath })
                    });
                    
                    if (!response.ok) {
                        const error = await response.text();
                        errors.push({ path: filePath, error: error || 'Failed to read file' });
                        return null;
                    }
                    
                    const result = await response.json();
                    if (result.success && result.content !== undefined) {
                        return { path: filePath, content: result.content };
                    } else {
                        errors.push({ path: filePath, error: result.error || 'Unknown error' });
                        return null;
                    }
                } catch (error) {
                    errors.push({ path: filePath, error: error.message || 'Network error' });
                    return null;
                }
            }
        });
        
        const batchResults = await Promise.all(promises);
        results.push(...batchResults.filter(r => r !== null));
    }
    
    if (results.length === 0 && errors.length > 0) {
        const errorHandler = window.ErrorHandler || null;
        if (errorHandler) {
            errorHandler.showUserNotification(
                `Failed to read all files: ${errors[0].error}`,
                { source: 'FileContextReader', operation: 'readScopeFiles' },
                { severity: ErrorHandler.Severity.ERROR, title: 'File Read Failed' }
            );
        }
        return { success: false, error: `Failed to read files: ${errors[0].error}` };
    }
    
    // Show notification if some files failed but some succeeded
    if (errors.length > 0) {
        const errorHandler = window.ErrorHandler || null;
        if (errorHandler) {
            errorHandler.showUserNotification(
                `${errors.length} file(s) failed to read. Partial results returned.`,
                { source: 'FileContextReader', operation: 'readScopeFiles', failedFiles: errors.length },
                { severity: ErrorHandler.Severity.WARNING, title: 'Partial File Read' }
            );
        }
    }
    
    return {
        success: true,
        files: results,
        errors: errors.length > 0 ? errors : undefined
    };
}

/**
 * Aggregates file contents into a context string
 * @param {Array<{path: string, content: string}>} files - Array of file objects
 * @param {number} maxSize - Maximum total size in characters (default: 100000)
 * @returns {string} Aggregated context string
 */
export function aggregateContext(files, maxSize = 100000) {
    if (!Array.isArray(files) || files.length === 0) {
        return '';
    }
    
    let context = '';
    let totalSize = 0;
    
    for (const file of files) {
        const fileContent = file.content || '';
        const fileHeader = `\n\n=== File: ${file.path} ===\n\n`;
        const fileSize = fileHeader.length + fileContent.length;
        
        // Check if adding this file would exceed max size
        if (totalSize + fileSize > maxSize) {
            const remaining = maxSize - totalSize - fileHeader.length - 50; // 50 for truncation message
            if (remaining > 0) {
                context += fileHeader + fileContent.substring(0, remaining) + '\n\n[File truncated due to size limit]';
            }
            break;
        }
        
        context += fileHeader + fileContent;
        totalSize += fileSize;
    }
    
    return context.trim();
}

