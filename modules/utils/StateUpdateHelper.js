// State Update Helper - Standardizes state update patterns
class StateUpdateHelper {
    constructor(stateManager, eventSystem) {
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
    }
    
    /**
     * Update nested property (replaces manual nested updates)
     * @param {string} path - Dot-separated path (e.g., 'page.fontSize')
     * @param {any} value - Value to set
     * @param {object} target - Target object to update (defaults to current state)
     * @returns {object} Updated object (immutable)
     */
    updateNestedProperty(path, value, target = null) {
        if (!target) {
            target = this.stateManager.getState();
        }
        
        const keys = path.split('.');
        const result = { ...target };
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
                current[keys[i]] = {};
            } else {
                current[keys[i]] = { ...current[keys[i]] };
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return result;
    }
    
    /**
     * Update section with standard pattern
     * @param {string} projectId - Project ID
     * @param {string} sectionId - Section ID
     * @param {object} updates - Updates to apply
     * @param {object} options - Options (emitEvent, source)
     */
    updateSection(projectId, sectionId, updates, options = {}) {
        const standardUpdates = {
            ...updates,
            lastModified: new Date().toISOString()
        };
        
        this.stateManager.updateSection(projectId, sectionId, standardUpdates);
        
        if (options.emitEvent !== false) {
            this.eventSystem.emit(window.EventType.SECTION_UPDATED, {
                source: options.source || 'StateUpdateHelper',
                data: { projectId, sectionId, updates: standardUpdates }
            });
        }
    }
    
    /**
     * Update project with standard pattern
     * @param {string} projectId - Project ID
     * @param {object} updates - Updates to apply
     * @param {object} options - Options (emitEvent, source)
     */
    updateProject(projectId, updates, options = {}) {
        const standardUpdates = {
            ...updates,
            lastModified: new Date().toISOString()
        };
        
        this.stateManager.updateProject(projectId, standardUpdates);
        
        if (options.emitEvent !== false) {
            this.eventSystem.emit(window.EventType.PROJECT_UPDATED, {
                source: options.source || 'StateUpdateHelper',
                data: { projectId, updates: standardUpdates }
            });
        }
    }
    
    /**
     * Update setting (consolidated from app.js and UIManager.js)
     * @param {string} path - Dot-separated path (e.g., 'page.fontSize')
     * @param {any} value - Value to set
     * @param {object} options - Options (applyToDOM)
     */
    updateSetting(path, value, options = {}) {
        const state = this.stateManager.getState();
        const settings = state.settings || this.stateManager.getDefaultSettings();
        const updatedSettings = this.updateNestedProperty(path, value, settings);
        
        this.stateManager.updateSettings(updatedSettings);
        
        if (options.applyToDOM !== false) {
            this.applySettingsToDOM(updatedSettings, path, value);
        }
    }
    
    /**
     * Apply settings to DOM (extracted from app.js and UIManager.js)
     * @param {object} settings - Settings object
     * @param {string} path - Optional path for input syncing
     * @param {any} value - Optional value for input syncing
     */
    applySettingsToDOM(settings, path = null, value = null) {
        const root = document.documentElement;
        
        // Apply CSS custom properties
        root.style.setProperty('--bg-color', settings.background);
        root.style.setProperty('--page-bg', (settings.page && settings.page.background) || '#2d2d2d');
        root.style.setProperty('--page-margin', (settings.page && settings.page.margin) || '0px');
        root.style.setProperty('--page-padding', (settings.page && settings.page.padding) || '20px');
        root.style.setProperty('--page-border-radius', (settings.page && settings.page.borderRadius) || '8px');
        root.style.setProperty('--page-font-family', (settings.page && settings.page.fontFamily) || '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif');
        root.style.setProperty('--page-font-size', (settings.page && settings.page.fontSize) || '14px');
        root.style.setProperty('--page-opacity', (settings.page && settings.page.opacity) || '1');
        root.style.setProperty('--page-color', (settings.page && settings.page.color) || '#e0e0e0');
        root.style.setProperty('--page-title-font-size', (settings.page && settings.page.titleFontSize) || '18px');
        root.style.setProperty('--page-title-color', (settings.page && settings.page.titleColor) || '#ffffff');
        root.style.setProperty('--page-title-margin-bottom', (settings.page && settings.page.titleMarginBottom) || '15px');
        root.style.setProperty('--element-bg', (settings.element && settings.element.bg) || 'transparent');
        root.style.setProperty('--element-margin', (settings.element && settings.element.margin) || '0px');
        root.style.setProperty('--element-padding', (settings.element && settings.element.padding) || '10px');
        root.style.setProperty('--element-font-family', (settings.element && settings.element.fontFamily) || '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif');
        root.style.setProperty('--element-font-size', (settings.element && settings.element.fontSize) || '14px');
        root.style.setProperty('--element-opacity', (settings.element && settings.element.opacity) || '1');
        root.style.setProperty('--element-color', (settings.element && settings.element.color) || '#e0e0e0');
        root.style.setProperty('--element-hover-bg', (settings.element && settings.element.hoverBg) || '#363636');
        root.style.setProperty('--header-font-size', (settings.header && settings.header.fontSize) || '16px');
        root.style.setProperty('--header-color', (settings.header && settings.header.color) || '#b8b8b8');
        root.style.setProperty('--header-margin', (settings.header && settings.header.margin) || '10px 0');
        root.style.setProperty('--header-padding', (settings.header && settings.header.padding) || '5px 0');
        root.style.setProperty('--header-font-weight', (settings.header && settings.header.fontWeight) || '600');
        root.style.setProperty('--checkbox-size', (settings.checkbox && settings.checkbox.size) || '18px');
        root.style.setProperty('--checkbox-color', (settings.checkbox && settings.checkbox.color) || '#4CAF50');
        
        // Sync form inputs if path and value provided (from app.js updateSetting logic)
        if (path && value !== null) {
            // Sync color inputs
            if (path.includes('color') || path.includes('background') || path.includes('bg')) {
                const allInputs = document.querySelectorAll(`[data-setting-path="${path}"]`);
                allInputs.forEach(input => {
                    if (input.type === 'color' || input.type === 'text') {
                        input.value = value;
                    }
                });
            }
            
            // Sync opacity inputs
            if (path.includes('opacity')) {
                const numValue = parseFloat(value) * 100;
                const allInputs = document.querySelectorAll(`[data-setting-path="${path}"]`);
                allInputs.forEach(input => {
                    if (input.type === 'range' || input.type === 'number') {
                        input.value = numValue;
                    }
                });
            }
            
            // Sync slider inputs
            if (path.includes('Size') || path.includes('margin') || path.includes('padding') || path.includes('borderRadius') || path.includes('size')) {
                const numValue = parseFloat(value) || 0;
                const allInputs = document.querySelectorAll(`[data-setting-path="${path}"]`);
                allInputs.forEach(input => {
                    if (input.type === 'range' || input.type === 'number') {
                        input.value = numValue;
                    }
                });
            }
        }
    }
    
    /**
     * Batch multiple updates together
     * @param {Array} updates - Array of update objects { type: 'section'|'project', projectId, sectionId?, data }
     */
    batchUpdates(updates) {
        // Group updates by type and apply together
        const sectionUpdates = [];
        const projectUpdates = [];
        
        updates.forEach(update => {
            if (update.type === 'section') {
                sectionUpdates.push(update);
            } else if (update.type === 'project') {
                projectUpdates.push(update);
            }
        });
        
        // Apply section updates
        sectionUpdates.forEach(update => {
            this.updateSection(update.projectId, update.sectionId, update.data, { emitEvent: false });
        });
        
        // Apply project updates
        projectUpdates.forEach(update => {
            this.updateProject(update.projectId, update.data, { emitEvent: false });
        });
        
        // Emit single batch event
        this.eventSystem.emit(window.EventType.STATE_CHANGED, {
            source: 'StateUpdateHelper',
            data: { batch: true, count: updates.length }
        });
    }
}
