// Data Layer - Handles data persistence and file operations
class DataLayer {
    constructor(eventSystem, errorHandler = null, storageKey = 'prompt-spec-data') {
        this.eventSystem = eventSystem;
        this.errorHandler = errorHandler;
        this.storageKey = storageKey;
        
        // Debounced save instance (will be initialized after DebouncedSave is available)
        this.debouncedSaveInstance = null;
        
        // Web Worker for large state serialization (> 1MB)
        this.stateWorker = null;
        this.workerRequestId = 0;
        this.workerPendingRequests = new Map(); // requestId -> { resolve, reject }
        this._initializeStateWorker();
        
        // Storage Interface (localStorage wrapper)
        // Note: save() is now async-aware but maintains sync interface for compatibility
        this.storageInterface = {
            save: (key, value) => {
                if (this.errorHandler) {
                    const result = this.errorHandler.handleSync(() => {
                        // For storageInterface.save, use inline serialization (smaller operations)
                        localStorage.setItem(key, JSON.stringify(value));
                    }, { source: 'DataLayer', operation: 'storage.save' });
                    if (!result.success) {
                        this.eventSystem.emit(EventType.FILE_ERROR, {
                            source: 'DataLayer',
                            data: { error: result.error, operation: 'save', code: result.code }
                        });
                        throw new Error(result.error);
                    }
                } else {
                    // Fallback to original error handling if ErrorHandler not available
                    try {
                        localStorage.setItem(key, JSON.stringify(value));
                    } catch (error) {
                        console.error('Storage save error:', error);
                        this.eventSystem.emit(EventType.FILE_ERROR, {
                            source: 'DataLayer',
                            data: { error: 'Storage quota exceeded', operation: 'save' }
                        });
                        throw error;
                    }
                }
            },
            load: (key) => {
                if (this.errorHandler) {
                    const result = this.errorHandler.handleSync(() => {
                        const item = localStorage.getItem(key);
                        return item ? JSON.parse(item) : null;
                    }, { source: 'DataLayer', operation: 'storage.load' });
                    return result.success ? result.data : null;
                } else {
                    // Fallback to original error handling
                    try {
                        const item = localStorage.getItem(key);
                        return item ? JSON.parse(item) : null;
                    } catch (error) {
                        console.error('Storage load error:', error);
                        return null;
                    }
                }
            },
            remove: (key) => {
                localStorage.removeItem(key);
            },
            clear: () => {
                localStorage.clear();
            }
        };
        
        // File Interface (Browser File API wrapper)
        this.fileInterface = {
            readFile: (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = (e) => reject(new Error('File read error'));
                    reader.readAsText(file);
                });
            },
            writeFile: (data, filename) => {
                if (this.errorHandler) {
                    const result = this.errorHandler.handleSync(() => {
                        // Ensure data is a string
                        const dataString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
                        const blob = new Blob([dataString], { type: 'application/json;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        a.style.display = 'none';
                        document.body.appendChild(a);
                        
                        // Trigger download
                        a.click();
                        
                        // Clean up after a delay to ensure download starts
                        setTimeout(() => {
                            if (a.parentNode) {
                                document.body.removeChild(a);
                            }
                            URL.revokeObjectURL(url);
                        }, 200);
                    }, { source: 'DataLayer', operation: 'file.writeFile', filename });
                    if (!result.success) {
                        throw new Error(result.error);
                    }
                } else {
                    // Fallback to original error handling
                    try {
                        // Ensure data is a string
                        const dataString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
                        const blob = new Blob([dataString], { type: 'application/json;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename;
                        a.style.display = 'none';
                        document.body.appendChild(a);
                        
                        // Trigger download
                        a.click();
                        
                        // Clean up after a delay to ensure download starts
                        setTimeout(() => {
                            if (a.parentNode) {
                                document.body.removeChild(a);
                            }
                            URL.revokeObjectURL(url);
                        }, 200);
                    } catch (error) {
                        console.error('Failed to write file:', error);
                        throw error;
                    }
                }
            },
            showFilePicker: (options) => {
                return new Promise((resolve, reject) => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    if (options?.accept) {
                        input.accept = options.accept;
                    }
                    input.multiple = options?.multiple || false;
                    input.onchange = (e) => {
                        const file = e.target.files[0];
                        resolve(file || null);
                    };
                    input.oncancel = () => resolve(null);
                    input.click();
                });
            },
            fetchFile: (url) => {
                return fetch(url)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.text();
                    });
            },
            postFile: (url, data) => {
                return fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: data
                });
            }
        };
    }
    
    /**
     * Initialize Web Worker for state serialization
     * @private
     */
    _initializeStateWorker() {
        if (typeof Worker !== 'undefined') {
            try {
                this.stateWorker = new Worker('workers/stateSerializer.worker.js');
                this.stateWorker.onmessage = (e) => {
                    const { type, data, requestId, error } = e.data;
                    const pending = this.workerPendingRequests.get(requestId);
                    if (!pending) return;
                    
                    this.workerPendingRequests.delete(requestId);
                    
                    if (type === 'error') {
                        pending.reject(new Error(error));
                    } else {
                        pending.resolve(data);
                    }
                };
                this.stateWorker.onerror = (error) => {
                    console.error('State worker error:', error);
                    // Reject all pending requests
                    for (const [requestId, pending] of this.workerPendingRequests.entries()) {
                        pending.reject(error);
                    }
                    this.workerPendingRequests.clear();
                };
            } catch (error) {
                console.warn('Failed to initialize state worker:', error);
                this.stateWorker = null;
            }
        }
    }
    
    /**
     * Serialize state (using worker if large, otherwise inline)
     * @private
     * @param {Object} state - State object to serialize
     * @returns {Promise<string>} Serialized JSON string
     */
    async _serializeState(state) {
        // Estimate state size (rough approximation)
        const stateString = JSON.stringify(state);
        const stateSize = new Blob([stateString]).size;
        const LARGE_STATE_THRESHOLD = 1024 * 1024; // 1MB
        
        // Use worker for large states
        if (stateSize > LARGE_STATE_THRESHOLD && this.stateWorker) {
            return new Promise((resolve, reject) => {
                const requestId = ++this.workerRequestId;
                this.workerPendingRequests.set(requestId, { resolve, reject });
                
                // Set timeout (30 seconds)
                const timeout = setTimeout(() => {
                    this.workerPendingRequests.delete(requestId);
                    reject(new Error('State serialization timeout'));
                }, 30000);
                
                // Override resolve/reject to clear timeout
                const originalResolve = resolve;
                const originalReject = reject;
                this.workerPendingRequests.set(requestId, {
                    resolve: (data) => {
                        clearTimeout(timeout);
                        originalResolve(data);
                    },
                    reject: (error) => {
                        clearTimeout(timeout);
                        originalReject(error);
                    }
                });
                
                this.stateWorker.postMessage({
                    type: 'serialize',
                    data: { state, requestId }
                });
            });
        } else {
            // Use inline serialization for small states
            return Promise.resolve(stateString);
        }
    }
    
    // Internal method to actually save state (called by debounced function)
    async _saveState(state) {
        try {
            // Serialize state (using worker if large)
            const serialized = await this._serializeState(state);
            
            if (this.errorHandler) {
                const result = this.errorHandler.handleSync(() => {
                    // Save serialized string to localStorage
                    localStorage.setItem(this.storageKey, serialized);
                    this.eventSystem.emit(EventType.STATE_SAVED, {
                        source: 'DataLayer',
                        data: { state }
                    });
                }, { source: 'DataLayer', operation: 'saveState' });
                if (!result.success) {
                    this.eventSystem.emit(EventType.FILE_ERROR, {
                        source: 'DataLayer',
                        data: { error: result.error, operation: 'saveState', code: result.code }
                    });
                    throw new Error(result.error);
                }
            } else {
                // Fallback to original error handling
                try {
                    localStorage.setItem(this.storageKey, serialized);
                    this.eventSystem.emit(EventType.STATE_SAVED, {
                        source: 'DataLayer',
                        data: { state }
                    });
                } catch (error) {
                    this.eventSystem.emit(EventType.FILE_ERROR, {
                        source: 'DataLayer',
                        data: { error: error.message, operation: 'saveState' }
                    });
                    throw error;
                }
            }
        } catch (error) {
            this.eventSystem.emit(EventType.FILE_ERROR, {
                source: 'DataLayer',
                data: { error: error.message, operation: 'saveState' }
            });
            throw error;
        }
    }
    
    // Initialize debounced save (called after DebouncedSave is available)
    _initializeDebouncedSave() {
        if (typeof window !== 'undefined' && window.DebouncedSave && !this.debouncedSaveInstance) {
            const delay = window.AppConstants?.TIMEOUTS?.STATE_SAVE_DEBOUNCE || 500;
            // Wrap async _saveState in a function that handles the promise
            this.debouncedSaveInstance = new window.DebouncedSave((state) => {
                // Fire and forget - errors are handled in _saveState
                this._saveState(state).catch(error => {
                    if (this.errorHandler) {
                        this.errorHandler.handleError(error, {
                            source: 'DataLayer',
                            operation: 'saveState'
                        });
                    } else {
                        console.error('Error saving state:', error);
                    }
                });
            }, delay);
        }
    }
    
    // Save state to persistent storage (debounced)
    saveState(state) {
        // Initialize debounced save if not already done
        if (!this.debouncedSaveInstance) {
            this._initializeDebouncedSave();
        }
        
        // If debounced save is available, use it; otherwise save immediately
        if (this.debouncedSaveInstance) {
            this.debouncedSaveInstance.save(state);
        } else {
            // Fallback to immediate save if DebouncedSave not available
            this._saveState(state);
        }
    }
    
    // Flush pending save immediately (for critical saves like beforeunload)
    flushPendingSave() {
        if (this.debouncedSaveInstance && this.debouncedSaveInstance.isPending()) {
            this.debouncedSaveInstance.flush();
        }
    }
    
    // Load state from persistent storage
    loadState() {
        if (this.errorHandler) {
            const result = this.errorHandler.handleSync(() => {
                const state = this.storageInterface.load(this.storageKey);
                if (state) {
                    this.eventSystem.emit(EventType.STATE_LOADED, {
                        source: 'DataLayer',
                        data: { state }
                    });
                }
                return state;
            }, { source: 'DataLayer', operation: 'loadState' });
            return result.success ? result.data : null;
        } else {
            // Fallback to original error handling
            try {
                const state = this.storageInterface.load(this.storageKey);
                if (state) {
                    this.eventSystem.emit(EventType.STATE_LOADED, {
                        source: 'DataLayer',
                        data: { state }
                    });
                }
                return state;
            } catch (error) {
                console.error('Failed to load state:', error);
                this.eventSystem.emit(EventType.FILE_ERROR, {
                    source: 'DataLayer',
                    data: { error: error.message, operation: 'loadState' }
                });
                return null;
            }
        }
    }
    
    // Clear state from storage
    clearState() {
        this.storageInterface.remove(this.storageKey);
    }
    
    // Export state to file (server-based)
    async exportToFile(state, filename = null, silent = false) {
        if (this.errorHandler) {
            const result = await this.errorHandler.handleAsync(async () => {
                const data = JSON.stringify(state, null, 2);
                if (!filename) {
                    // Try to get project group name from state
                    const projectGroupName = state.metadata?.projectGroupName;
                    if (projectGroupName && projectGroupName.trim()) {
                        filename = `${projectGroupName.trim().replace(/[^a-z0-9]/gi, '_')}.json`;
                    } else {
                        // Fallback to timestamped backup
                        const dateStr = new Date().toISOString().split('T')[0];
                        const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
                        filename = `feat-spec-backup-${dateStr}-${timeStr}.json`;
                    }
                }
                
                // Ensure filename ends with .json
                if (!filename.toLowerCase().endsWith('.json')) {
                    filename = `${filename}.json`;
                }
                
                // Save to server (will overwrite if exists)
                const response = await fetch('/api/save-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename, content: data })
                });
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.error || 'Failed to save file');
                }
                
                this.eventSystem.emit(EventType.FILE_SAVED, {
                    source: 'DataLayer',
                    data: { filename: result.filename, state }
                });
                
                console.log('File saved to server:', result.filename);
                if (!silent) {
                    alert(`File saved successfully: ${result.filename}\n\nSaved to: feat-spec/saved-files/`);
                }
                
                return result;
            }, { source: 'DataLayer', operation: 'exportToFile', filename });
            
            if (!result.success) {
                if (!silent) {
                    alert('Failed to save file: ' + this.errorHandler.getUserMessage(result));
                }
                this.eventSystem.emit(EventType.FILE_ERROR, {
                    source: 'DataLayer',
                    data: { error: result.error, operation: 'exportToFile', code: result.code }
                });
                throw new Error(result.error);
            }
            return result.data;
        } else {
            // Fallback to original error handling
            try {
                const data = JSON.stringify(state, null, 2);
                if (!filename) {
                    // Try to get project group name from state
                    const projectGroupName = state.metadata?.projectGroupName;
                    if (projectGroupName && projectGroupName.trim()) {
                        filename = `${projectGroupName.trim().replace(/[^a-z0-9]/gi, '_')}.json`;
                    } else {
                        // Fallback to timestamped backup
                        const dateStr = new Date().toISOString().split('T')[0];
                        const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
                        filename = `feat-spec-backup-${dateStr}-${timeStr}.json`;
                    }
                }
                
                // Ensure filename ends with .json
                if (!filename.toLowerCase().endsWith('.json')) {
                    filename = `${filename}.json`;
                }
                
                // Save to server (will overwrite if exists)
                const response = await fetch('/api/save-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename, content: data })
                });
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.error || 'Failed to save file');
                }
                
                this.eventSystem.emit(EventType.FILE_SAVED, {
                    source: 'DataLayer',
                    data: { filename: result.filename, state }
                });
                
                console.log('File saved to server:', result.filename);
                if (!silent) {
                    alert(`File saved successfully: ${result.filename}\n\nSaved to: feat-spec/saved-files/`);
                }
                
                return result;
            } catch (error) {
                console.error('Failed to export file:', error);
                if (!silent) {
                    alert('Failed to save file: ' + error.message);
                }
                this.eventSystem.emit(EventType.FILE_ERROR, {
                    source: 'DataLayer',
                    data: { error: error.message, operation: 'exportToFile' }
                });
                throw error;
            }
        }
    }
    
    // Import state from file
    async importFromFile(file) {
        if (this.errorHandler) {
            const result = await this.errorHandler.handleAsync(async () => {
                const content = await this.fileInterface.readFile(file);
                const state = this.parseInputFile(content);
                
                // Validate state structure - support both old (pages) and new (projects) format
                if (!state) {
                    throw new Error('Invalid file format: empty state');
                }
                
                // Check for new format (projects) or old format (pages)
                if (!Array.isArray(state.projects) && !Array.isArray(state.pages)) {
                    throw new Error('Invalid file format: missing projects or pages array');
                }
                
                this.eventSystem.emit(EventType.FILE_LOADED, {
                    source: 'DataLayer',
                    data: { state, filename: file.name }
                });
                
                return state;
            }, { source: 'DataLayer', operation: 'importFromFile', filename: file?.name });
            
            if (!result.success) {
                this.eventSystem.emit(EventType.FILE_ERROR, {
                    source: 'DataLayer',
                    data: { error: result.error, operation: 'importFromFile', code: result.code }
                });
                throw new Error(result.error);
            }
            return result.data;
        } else {
            // Fallback to original error handling
            try {
                const content = await this.fileInterface.readFile(file);
                const state = this.parseInputFile(content);
                
                // Validate state structure - support both old (pages) and new (projects) format
                if (!state) {
                    throw new Error('Invalid file format: empty state');
                }
                
                // Check for new format (projects) or old format (pages)
                if (!Array.isArray(state.projects) && !Array.isArray(state.pages)) {
                    throw new Error('Invalid file format: missing projects or pages array');
                }
                
                this.eventSystem.emit(EventType.FILE_LOADED, {
                    source: 'DataLayer',
                    data: { state, filename: file.name }
                });
                
                return state;
            } catch (error) {
                console.error('Failed to import file:', error);
                this.eventSystem.emit(EventType.FILE_ERROR, {
                    source: 'DataLayer',
                    data: { error: error.message, operation: 'importFromFile' }
                });
                throw error;
            }
        }
    }
    
    // Load default file
    async loadDefaultFile() {
        if (this.errorHandler) {
            const result = await this.errorHandler.handleAsync(async () => {
                const content = await this.fileInterface.fetchFile('default.json');
                const state = this.parseInputFile(content);
                
                // Support both old and new formats
                if (!state || (!Array.isArray(state.projects) && !Array.isArray(state.pages))) {
                    throw new Error('Invalid default.json format: missing projects or pages array');
                }
                
                this.eventSystem.emit(EventType.FILE_LOADED, {
                    source: 'DataLayer',
                    data: { state, filename: 'default.json' }
                });
                
                return state;
            }, { source: 'DataLayer', operation: 'loadDefaultFile' });
            
            if (!result.success) {
                this.eventSystem.emit(EventType.FILE_ERROR, {
                    source: 'DataLayer',
                    data: { error: result.error, operation: 'loadDefaultFile', code: result.code }
                });
                throw new Error(result.error);
            }
            return result.data;
        } else {
            // Fallback to original error handling
            try {
                const content = await this.fileInterface.fetchFile('default.json');
                const state = this.parseInputFile(content);
                
                // Support both old and new formats
                if (!state || (!Array.isArray(state.projects) && !Array.isArray(state.pages))) {
                    throw new Error('Invalid default.json format: missing projects or pages array');
                }
                
                this.eventSystem.emit(EventType.FILE_LOADED, {
                    source: 'DataLayer',
                    data: { state, filename: 'default.json' }
                });
                
                return state;
            } catch (error) {
                console.error('Failed to load default file:', error);
                this.eventSystem.emit(EventType.FILE_ERROR, {
                    source: 'DataLayer',
                    data: { error: error.message, operation: 'loadDefaultFile' }
                });
                throw error;
            }
        }
    }
    
    // Save as default.json (POST to server)
    async saveAsDefault(state) {
        if (this.errorHandler) {
            const result = await this.errorHandler.handleAsync(async () => {
                const data = JSON.stringify(state, null, 2);
                const response = await this.fileInterface.postFile('default.json', data);
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                this.eventSystem.emit(EventType.FILE_SAVED, {
                    source: 'DataLayer',
                    data: { filename: 'default.json', state }
                });
            }, { source: 'DataLayer', operation: 'saveAsDefault' });
            
            if (!result.success) {
                this.eventSystem.emit(EventType.FILE_ERROR, {
                    source: 'DataLayer',
                    data: { error: result.error, operation: 'saveAsDefault', code: result.code }
                });
                throw new Error(result.error);
            }
        } else {
            // Fallback to original error handling
            try {
                const data = JSON.stringify(state, null, 2);
                const response = await this.fileInterface.postFile('default.json', data);
                
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                this.eventSystem.emit(EventType.FILE_SAVED, {
                    source: 'DataLayer',
                    data: { filename: 'default.json', state }
                });
            } catch (error) {
                console.error('Failed to save as default:', error);
                this.eventSystem.emit(EventType.FILE_ERROR, {
                    source: 'DataLayer',
                    data: { error: error.message, operation: 'saveAsDefault' }
                });
                throw error;
            }
        }
    }
    
    // Parse input file content (JSON)
    parseInputFile(content) {
        if (this.errorHandler) {
            const result = this.errorHandler.handleSync(() => {
                return JSON.parse(content);
            }, { source: 'DataLayer', operation: 'parseInputFile' });
            if (!result.success) {
                throw new Error(`Invalid JSON format: ${result.error}`);
            }
            return result.data;
        } else {
            // Fallback to original error handling
            try {
                return JSON.parse(content);
            } catch (error) {
                throw new Error(`Invalid JSON format: ${error.message}`);
            }
        }
    }
    
    // Get storage interface (for testing/integration)
    getStorageInterface() {
        return this.storageInterface;
    }
    
    // Get file interface (for testing/integration)
    getFileInterface() {
        return this.fileInterface;
    }
}

