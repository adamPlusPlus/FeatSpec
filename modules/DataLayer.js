// Data Layer - Handles data persistence and file operations
class DataLayer {
    constructor(eventSystem, storageKey = 'prompt-spec-data') {
        this.eventSystem = eventSystem;
        this.storageKey = storageKey;
        
        // Storage Interface (localStorage wrapper)
        this.storageInterface = {
            save: (key, value) => {
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
            },
            load: (key) => {
                try {
                    const item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : null;
                } catch (error) {
                    console.error('Storage load error:', error);
                    return null;
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
    
    // Save state to persistent storage
    saveState(state) {
        try {
            this.storageInterface.save(this.storageKey, state);
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
    
    // Load state from persistent storage
    loadState() {
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
    
    // Clear state from storage
    clearState() {
        this.storageInterface.remove(this.storageKey);
    }
    
    // Export state to file (server-based)
    async exportToFile(state, filename = null, silent = false) {
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
    
    // Import state from file
    async importFromFile(file) {
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
    
    // Load default file
    async loadDefaultFile() {
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
    
    // Save as default.json (POST to server)
    async saveAsDefault(state) {
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
    
    // Parse input file content (JSON)
    parseInputFile(content) {
        try {
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Invalid JSON format: ${error.message}`);
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

