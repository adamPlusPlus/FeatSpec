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
        
        // Merge with defaults to ensure all values are valid
        const defaults = this.stateManager.getDefaultSettings();
        const mergedSettings = {
            background: settings.background || defaults.background,
            page: {
                ...defaults.page,
                ...(settings.page || {})
            },
            element: {
                ...defaults.element,
                ...(settings.element || {})
            },
            header: {
                ...defaults.header,
                ...(settings.header || {})
            },
            checkbox: {
                ...(defaults.checkbox || {}),
                ...(settings.checkbox || {})
            }
        };
        
        // Apply CSS custom properties with merged/validated values
        root.style.setProperty('--bg-color', mergedSettings.background);
        root.style.setProperty('--page-bg', mergedSettings.page.background);
        root.style.setProperty('--page-margin', mergedSettings.page.margin);
        root.style.setProperty('--page-padding', mergedSettings.page.padding);
        root.style.setProperty('--page-border-radius', mergedSettings.page.borderRadius);
        root.style.setProperty('--page-font-family', mergedSettings.page.fontFamily);
        root.style.setProperty('--page-font-size', mergedSettings.page.fontSize);
        root.style.setProperty('--page-opacity', mergedSettings.page.opacity);
        root.style.setProperty('--page-color', mergedSettings.page.color);
        root.style.setProperty('--page-title-font-size', mergedSettings.page.titleFontSize);
        root.style.setProperty('--page-title-color', mergedSettings.page.titleColor);
        root.style.setProperty('--page-title-margin-bottom', mergedSettings.page.titleMarginBottom);
        root.style.setProperty('--element-bg', mergedSettings.element.bg);
        root.style.setProperty('--element-margin', mergedSettings.element.margin);
        root.style.setProperty('--element-padding', mergedSettings.element.padding);
        root.style.setProperty('--element-font-family', mergedSettings.element.fontFamily);
        root.style.setProperty('--element-font-size', mergedSettings.element.fontSize);
        root.style.setProperty('--element-opacity', mergedSettings.element.opacity);
        root.style.setProperty('--element-color', mergedSettings.element.color);
        root.style.setProperty('--element-hover-bg', mergedSettings.element.hoverBg);
        root.style.setProperty('--header-font-size', mergedSettings.header.fontSize);
        root.style.setProperty('--header-color', mergedSettings.header.color);
        root.style.setProperty('--header-margin', mergedSettings.header.margin);
        root.style.setProperty('--header-padding', mergedSettings.header.padding || '5px 0');
        root.style.setProperty('--header-font-weight', mergedSettings.header.fontWeight || '600');
        root.style.setProperty('--checkbox-size', mergedSettings.checkbox?.size || '18px');
        root.style.setProperty('--checkbox-color', mergedSettings.checkbox?.color || '#4CAF50');
        
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
