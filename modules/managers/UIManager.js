// UI Manager - Handles UI event listeners and modal management
class UIManager {
    constructor(stateManager, eventSystem, modalSystem, renderingEngine, contextMenuHandler, keyboardHandler, stateUpdateHelper = null) {
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
        this.modalSystem = modalSystem;
        this.renderingEngine = renderingEngine;
        this.contextMenuHandler = contextMenuHandler;
        this.keyboardHandler = keyboardHandler;
        this.stateUpdateHelper = stateUpdateHelper;
        
        // Callbacks for methods that need app-level access
        this.handleContextMenuActionCallback = null;
        this.projectManager = null;
        this.sectionManager = null;
        this.fileOperations = null;
        
        // Track event listeners for cleanup
        this.eventListenerCleanups = [];
    }
    
    /**
     * Set managers for cross-manager operations
     */
    setManagers(managers) {
        if (managers.projectManager) {
            this.projectManager = managers.projectManager;
        }
        if (managers.sectionManager) {
            this.sectionManager = managers.sectionManager;
        }
        if (managers.fileOperations) {
            this.fileOperations = managers.fileOperations;
        }
    }
    
    /**
     * Set callbacks for methods that need app-level access
     */
    setCallbacks(callbacks) {
        if (callbacks.handleContextMenuAction) {
            this.handleContextMenuActionCallback = callbacks.handleContextMenuAction;
        }
    }
    
    /**
     * Setup UI event listeners
     */
    setupUIListeners() {
        // New project button
        const newProjectBtn = document.getElementById('new-project');
        if (newProjectBtn) {
            const clickHandler = () => {
                const name = prompt('Enter project name:');
                if (name && name.trim()) {
                    const workflowType = confirm('Use UX-Only workflow? (Click OK for UX-Only, Cancel for Full)') ? 'ux-only' : 'full';
                    if (this.projectManager) {
                        this.projectManager.createProject(name, '', workflowType);
                        this.renderingEngine.renderAll();
                    }
                }
            };
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(newProjectBtn, 'click', clickHandler);
            } else {
                newProjectBtn.addEventListener('click', clickHandler);
                this.eventListenerCleanups.push(() => {
                    newProjectBtn.removeEventListener('click', clickHandler);
                });
            }
        }
        
        // New project group button
        const newProjectGroupBtn = document.getElementById('new-project-group');
        if (newProjectGroupBtn) {
            const clickHandler = async () => {
                if (this.handleContextMenuActionCallback) {
                    await this.handleContextMenuActionCallback('new-project-group', { type: 'projectGroup' });
                }
            };
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(newProjectGroupBtn, 'click', clickHandler);
            } else {
                newProjectGroupBtn.addEventListener('click', clickHandler);
                this.eventListenerCleanups.push(() => {
                    newProjectGroupBtn.removeEventListener('click', clickHandler);
                });
            }
        }
        
        // View toggle buttons
        const viewSectionBtn = document.getElementById('view-section');
        const viewPipelineBtn = document.getElementById('view-pipeline');
        if (viewSectionBtn && viewPipelineBtn) {
            const sectionClickHandler = () => {
                document.getElementById('section-view').style.display = 'block';
                document.getElementById('pipeline-flow-view').style.display = 'none';
                viewSectionBtn.classList.add('active');
                viewPipelineBtn.classList.remove('active');
            };
            const pipelineClickHandler = () => {
                document.getElementById('section-view').style.display = 'none';
                document.getElementById('pipeline-flow-view').style.display = 'block';
                viewPipelineBtn.classList.add('active');
                viewSectionBtn.classList.remove('active');
                this.renderingEngine.renderPipelineFlowView();
            };
            
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(viewSectionBtn, 'click', sectionClickHandler);
                window.eventListenerManager.add(viewPipelineBtn, 'click', pipelineClickHandler);
            } else {
                viewSectionBtn.addEventListener('click', sectionClickHandler);
                viewPipelineBtn.addEventListener('click', pipelineClickHandler);
                this.eventListenerCleanups.push(() => {
                    viewSectionBtn.removeEventListener('click', sectionClickHandler);
                    viewPipelineBtn.removeEventListener('click', pipelineClickHandler);
                });
            }
        }
        
        // Universal click-outside-to-close handler for all modals
        const documentClickHandler = (e) => {
            // Check if click is on modal backdrop
            if (e.target.classList.contains('modal-backdrop')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    // Find the appropriate close action based on modal type
                    const modalId = modal.id;
                    
                    // For modals with save buttons, trigger save
                    if (modalId === 'project-group-edit-modal') {
                        const saveBtn = modal.querySelector('#project-group-edit-save');
                        if (saveBtn) saveBtn.click();
                    } else if (modalId === 'modifier-editor-modal') {
                        const saveBtn = modal.querySelector('#modifier-editor-save');
                        if (saveBtn) saveBtn.click();
                    } else {
                        // For other modals, just close
                        this.closeModal();
                    }
                }
            }
        };
        
        if (typeof window !== 'undefined' && window.eventListenerManager) {
            window.eventListenerManager.add(document, 'click', documentClickHandler);
        } else {
            document.addEventListener('click', documentClickHandler);
            this.eventListenerCleanups.push(() => {
                document.removeEventListener('click', documentClickHandler);
            });
        }
        
        // Dropdown toggle
        this.setupDropdownListeners();
        
        // Pane toggle buttons
        this.setupPaneToggleListeners();
    }
    
    /**
     * Setup dropdown toggle listeners
     */
    setupDropdownListeners() {
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const dropdownMenu = document.querySelector('.dropdown-menu');
        console.log('Setting up dropdown listeners:', { dropdownToggle, dropdownMenu });
        if (dropdownToggle && dropdownMenu) {
            const toggleClickHandler = (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('Dropdown toggle clicked');
                const isActive = dropdownMenu.classList.toggle('active');
                dropdownToggle.classList.toggle('active', isActive);
                console.log('Dropdown state:', { isActive, hasActive: dropdownMenu.classList.contains('active') });
            };
            
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(dropdownToggle, 'click', toggleClickHandler);
            } else {
                dropdownToggle.addEventListener('click', toggleClickHandler);
                this.eventListenerCleanups.push(() => {
                    dropdownToggle.removeEventListener('click', toggleClickHandler);
                });
            }
            
            // Close dropdown when clicking outside
            const outsideClickHandler = (e) => {
                if (!e.target.closest('.dropdown')) {
                    dropdownMenu.classList.remove('active');
                    dropdownToggle.classList.remove('active');
                }
            };
            
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(document, 'click', outsideClickHandler);
            } else {
                document.addEventListener('click', outsideClickHandler);
                this.eventListenerCleanups.push(() => {
                    document.removeEventListener('click', outsideClickHandler);
                });
            }
            
            // Close dropdown when clicking on menu items (except file operations)
            const menuItemClickHandler = (e) => {
                const button = e.target.closest('button');
                if (button) {
                    const buttonId = button.id;
                    // Don't auto-close for file operations - they handle their own cleanup
                    if (buttonId !== 'save-file' && buttonId !== 'load-file') {
                        dropdownMenu.classList.remove('active');
                        dropdownToggle.classList.remove('active');
                    }
                }
            };
            
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(dropdownMenu, 'click', menuItemClickHandler);
            } else {
                dropdownMenu.addEventListener('click', menuItemClickHandler);
                this.eventListenerCleanups.push(() => {
                    dropdownMenu.removeEventListener('click', menuItemClickHandler);
                });
            }
        }
    }
    
    /**
     * Setup pane toggle listeners
     */
    setupPaneToggleListeners() {
        // Projects sidebar toggle
        const toggleProjectsSidebar = document.getElementById('toggle-projects-sidebar');
        const toggleProjectsSidebarCollapsed = document.getElementById('toggle-projects-sidebar-collapsed');
        if (toggleProjectsSidebar) {
            const clickHandler = () => {
                const isExpanded = this.stateManager.togglePaneState('projectsSidebar');
                this.updatePaneVisibility('projectsSidebar', isExpanded);
            };
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(toggleProjectsSidebar, 'click', clickHandler);
            } else {
                toggleProjectsSidebar.addEventListener('click', clickHandler);
                this.eventListenerCleanups.push(() => {
                    toggleProjectsSidebar.removeEventListener('click', clickHandler);
                });
            }
        }
        if (toggleProjectsSidebarCollapsed) {
            const clickHandler = () => {
                const isExpanded = this.stateManager.togglePaneState('projectsSidebar');
                this.updatePaneVisibility('projectsSidebar', isExpanded);
            };
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(toggleProjectsSidebarCollapsed, 'click', clickHandler);
            } else {
                toggleProjectsSidebarCollapsed.addEventListener('click', clickHandler);
                this.eventListenerCleanups.push(() => {
                    toggleProjectsSidebarCollapsed.removeEventListener('click', clickHandler);
                });
            }
        }
        
        // Top bar toggle
        const toggleTopBar = document.getElementById('toggle-top-bar');
        const toggleTopBarCollapsed = document.getElementById('toggle-top-bar-collapsed');
        if (toggleTopBar) {
            const clickHandler = () => {
                const isExpanded = this.stateManager.togglePaneState('topBar');
                this.updatePaneVisibility('topBar', isExpanded);
            };
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(toggleTopBar, 'click', clickHandler);
            } else {
                toggleTopBar.addEventListener('click', clickHandler);
                this.eventListenerCleanups.push(() => {
                    toggleTopBar.removeEventListener('click', clickHandler);
                });
            }
        }
        if (toggleTopBarCollapsed) {
            const clickHandler = () => {
                const isExpanded = this.stateManager.togglePaneState('topBar');
                this.updatePaneVisibility('topBar', isExpanded);
            };
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(toggleTopBarCollapsed, 'click', clickHandler);
            } else {
                toggleTopBarCollapsed.addEventListener('click', clickHandler);
                this.eventListenerCleanups.push(() => {
                    toggleTopBarCollapsed.removeEventListener('click', clickHandler);
                });
            }
        }
        
        // References panel toggle
        const toggleReferencesPanel = document.getElementById('toggle-references-panel');
        const toggleReferencesPanelCollapsed = document.getElementById('toggle-references-panel-collapsed');
        if (toggleReferencesPanel) {
            const clickHandler = () => {
                const isExpanded = this.stateManager.togglePaneState('referencesPanel');
                this.updatePaneVisibility('referencesPanel', isExpanded);
            };
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(toggleReferencesPanel, 'click', clickHandler);
            } else {
                toggleReferencesPanel.addEventListener('click', clickHandler);
                this.eventListenerCleanups.push(() => {
                    toggleReferencesPanel.removeEventListener('click', clickHandler);
                });
            }
        }
        if (toggleReferencesPanelCollapsed) {
            const clickHandler = () => {
                const isExpanded = this.stateManager.togglePaneState('referencesPanel');
                this.updatePaneVisibility('referencesPanel', isExpanded);
            };
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(toggleReferencesPanelCollapsed, 'click', clickHandler);
            } else {
                toggleReferencesPanelCollapsed.addEventListener('click', clickHandler);
                this.eventListenerCleanups.push(() => {
                    toggleReferencesPanelCollapsed.removeEventListener('click', clickHandler);
                });
            }
        }
    }
    
    /**
     * Update pane visibility
     */
    updatePaneVisibility(paneName, isExpanded) {
        // Get pane elements
        let paneElement = null;
        let toggleBtn = null;
        let collapsedToggleBtn = null;
        
        if (paneName === 'projectsSidebar') {
            paneElement = document.getElementById('projects-sidebar');
            toggleBtn = document.getElementById('toggle-projects-sidebar');
            collapsedToggleBtn = document.getElementById('toggle-projects-sidebar-collapsed');
        } else if (paneName === 'topBar') {
            paneElement = document.getElementById('top-bar');
            toggleBtn = document.getElementById('toggle-top-bar');
            collapsedToggleBtn = document.getElementById('toggle-top-bar-collapsed');
        } else if (paneName === 'referencesPanel') {
            paneElement = document.getElementById('references-panel');
            toggleBtn = document.getElementById('toggle-references-panel');
            collapsedToggleBtn = document.getElementById('toggle-references-panel-collapsed');
        }
        
        if (paneElement) {
            if (isExpanded) {
                paneElement.classList.remove('collapsed');
                if (toggleBtn) {
                    if (paneName === 'topBar') {
                        toggleBtn.textContent = '▼';
                        toggleBtn.title = 'Collapse Top Bar';
                    } else if (paneName === 'projectsSidebar') {
                        toggleBtn.textContent = '◀';
                        toggleBtn.title = 'Collapse Sidebar';
                    } else if (paneName === 'referencesPanel') {
                        toggleBtn.textContent = '▶';
                        toggleBtn.title = 'Collapse References Panel';
                    }
                }
                if (collapsedToggleBtn) {
                    collapsedToggleBtn.style.display = 'none';
                }
            } else {
                paneElement.classList.add('collapsed');
                if (toggleBtn) {
                    if (paneName === 'topBar') {
                        toggleBtn.textContent = '▲';
                        toggleBtn.title = 'Expand Top Bar';
                    } else if (paneName === 'projectsSidebar') {
                        toggleBtn.textContent = '▶';
                        toggleBtn.title = 'Expand Sidebar';
                    } else if (paneName === 'referencesPanel') {
                        toggleBtn.textContent = '◀';
                        toggleBtn.title = 'Expand References Panel';
                    }
                }
                if (collapsedToggleBtn) {
                    collapsedToggleBtn.style.display = 'block';
                }
            }
        }
    }
    
    /**
     * Setup project group dropdown listeners
     */
    setupProjectGroupDropdownListeners() {
        // Use event delegation on the container to avoid losing listeners when DOM updates
        const container = document.querySelector('.project-group-container');
        if (!container) return;
        
        // Only attach listeners once (check if already attached)
        if (container._projectGroupListenersAttached) {
            return; // Already attached, skip
        }
        
        // Handle selection via event delegation
        const changeHandler = async (e) => {
            if (e.target.id === 'project-group-select') {
                const selectedFile = e.target.value;
                if (selectedFile && this.projectManager) {
                    await this.projectManager.loadProjectGroupFromFile(selectedFile, {
                        showLoadingOverlay: this.showLoadingOverlay.bind(this),
                        hideLoadingOverlay: this.hideLoadingOverlay.bind(this),
                        loadPromptsForProject: this.loadPromptsForProjectCallback,
                        setupProjectGroupDropdownListeners: this.setupProjectGroupDropdownListeners.bind(this)
                    });
                }
            }
        };
        
        // Add right-click context menu via event delegation
        const contextMenuHandler = (e) => {
            if (e.target.id === 'project-group-select' || e.target.closest('#project-group-select')) {
                e.preventDefault();
                e.stopPropagation();
                const context = { type: 'projectGroupDropdown' };
                this.contextMenuHandler.showMenu({ x: e.clientX, y: e.clientY }, context);
            }
        };
        
        if (typeof window !== 'undefined' && window.eventListenerManager) {
            window.eventListenerManager.add(container, 'change', changeHandler);
            window.eventListenerManager.add(container, 'contextmenu', contextMenuHandler);
        } else {
            container.addEventListener('change', changeHandler);
            container.addEventListener('contextmenu', contextMenuHandler);
            this.eventListenerCleanups.push(() => {
                container.removeEventListener('change', changeHandler);
                container.removeEventListener('contextmenu', contextMenuHandler);
            });
        }
        
        // Mark as attached to prevent duplicate listeners
        container._projectGroupListenersAttached = true;
        
        // Populate dropdown with saved project groups
        if (this.projectManager) {
            this.projectManager.populateProjectGroupDropdown();
        }
    }
    
    /**
     * Cleanup event listeners
     */
    cleanup() {
        // Cleanup using EventListenerManager if available
        if (typeof window !== 'undefined' && window.eventListenerManager) {
            // Cleanup document listeners
            window.eventListenerManager.cleanup(document);
            
            // Cleanup specific elements
            const newProjectBtn = document.getElementById('new-project');
            const newProjectGroupBtn = document.getElementById('new-project-group');
            const viewSectionBtn = document.getElementById('view-section');
            const viewPipelineBtn = document.getElementById('view-pipeline');
            const container = document.querySelector('.project-group-container');
            
            if (newProjectBtn) window.eventListenerManager.cleanup(newProjectBtn);
            if (newProjectGroupBtn) window.eventListenerManager.cleanup(newProjectGroupBtn);
            if (viewSectionBtn) window.eventListenerManager.cleanup(viewSectionBtn);
            if (viewPipelineBtn) window.eventListenerManager.cleanup(viewPipelineBtn);
            if (container) window.eventListenerManager.cleanup(container);
        } else {
            // Fallback: use stored cleanup functions
            this.eventListenerCleanups.forEach(cleanup => cleanup());
            this.eventListenerCleanups = [];
        }
    }
    
    /**
     * Handle keyboard shortcut
     */
    handleKeyboardShortcut(data) {
        if (data.action === 'add-element') {
            const element = this.createDefaultElement(data.elementType);
            this.stateManager.addElement(data.pageId, element);
        } else if (data.action === 'show-add-element-modal') {
            this.showAddElementModal(data.pageId);
        }
    }
    
    /**
     * Handle context menu action (delegates to callback)
     */
    async handleContextMenuAction(actionId, context) {
        if (this.handleContextMenuActionCallback) {
            return await this.handleContextMenuActionCallback(actionId, context);
        }
    }
    
    /**
     * Handle modal save
     */
    handleModalSave(type, data) {
        // Modal save handling would be implemented here
        // For now, this is a placeholder
    }
    
    /**
     * Show edit modal (legacy page/element support)
     */
    showEditModal(pageId, elementIndex) {
        this.renderEditModal(pageId, elementIndex);
    }
    
    /**
     * Show add element modal (legacy page/element support)
     */
    showAddElementModal(pageId) {
        this.renderAddElementModal(pageId);
    }
    
    /**
     * Render add element modal (legacy page/element support)
     */
    renderAddElementModal(pageId, elementIndex = null) {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        if (!modal || !modalBody) return;
        
        const types = {
            '1': 'task',
            '2': 'header',
            '3': 'header-checkbox',
            '4': 'multi-checkbox',
            '5': 'one-time'
        };
        
        // Contains user data (project/section names) - sanitize
        const modalHtml = `
            <h3>Add Element</h3>
            <p style="margin-bottom: 15px;">Press a number key, click, or drag to set count:</p>
            <div style="margin: 10px 0;">
                <div class="element-type-option" data-type="task" style="padding: 5px; cursor: pointer; user-select: none;"><strong>1</strong> - Task</div>
                <div class="element-type-option" data-type="header" style="padding: 5px; cursor: pointer; user-select: none;"><strong>2</strong> - Header</div>
                <div class="element-type-option" data-type="header-checkbox" style="padding: 5px; cursor: pointer; user-select: none;"><strong>3</strong> - Header with Checkbox</div>
                <div class="element-type-option" data-type="multi-checkbox" style="padding: 5px; cursor: pointer; user-select: none;"><strong>4</strong> - Multi-checkbox</div>
                <div class="element-type-option" data-type="one-time" style="padding: 5px; cursor: pointer; user-select: none;"><strong>5</strong> - One-time Task</div>
            </div>
            <div style="margin-top: 20px;">
                <button class="cancel" onclick="this.closest('.modal').style.display='none'">Cancel</button>
            </div>
        `;
        
        modal.classList.add('active');
        
        // Simplified implementation - full version would include drag functionality
        modalBody.querySelectorAll('.element-type-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const type = option.dataset.type;
                if (type) {
                    this.closeModal();
                    const element = this.createDefaultElement(type);
                    this.stateManager.addElement(pageId, element);
                }
            });
        });
    }
    
    /**
     * Render edit modal (legacy page/element support - simplified)
     */
    renderEditModal(pageId, elementIndex) {
        const element = this.stateManager.getElement(pageId, elementIndex);
        if (!element) return;
        
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        if (!modal || !modalBody) return;
        
        let html = ``;
        
        // Text field (only for elements that have text)
        if (element.type === 'task' || element.type === 'header' || element.type === 'header-checkbox') {
            html += `
                <label>Text:</label>
                <input type="text" id="edit-text" value="${this.escapeHtml(element.text || '')}" />
            `;
        }
        
        html += `
            <div style="margin-top: 20px;">
                <button onclick="this.closest('.modal').querySelector('#save-edit-btn')?.click()">Save</button>
                <button class="cancel" onclick="this.closest('.modal').style.display='none'">Cancel</button>
            </div>
        `;
        
        // html contains user data - sanitize
        if (window.safeSetInnerHTML) {
            window.safeSetInnerHTML(modalBody, html, { allowMarkdown: false });
        } else {
            modalBody.innerHTML = html;
        }
        modal.classList.add('active');
        
        // Simplified save handler
        const saveBtn = document.createElement('button');
        saveBtn.id = 'save-edit-btn';
        saveBtn.style.display = 'none';
        saveBtn.addEventListener('click', () => {
            this.saveEdit(pageId, elementIndex);
        });
        modalBody.appendChild(saveBtn);
    }
    
    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
        }
    }
    
    /**
     * Save edit (legacy page/element support - simplified)
     */
    saveEdit(pageId, elementIndex, skipClose = false) {
        const element = this.stateManager.getElement(pageId, elementIndex);
        if (!element) return;
        
        const textInput = document.getElementById('edit-text');
        if (textInput) {
            const updatedElement = { ...element, text: textInput.value };
            this.stateManager.updateElement(pageId, elementIndex, updatedElement);
        }
        
        if (!skipClose) {
            this.closeModal();
        }
        
        this.renderingEngine.renderAll();
    }
    
    /**
     * Show settings modal
     */
    showSettingsModal() {
        console.log('UIManager.showSettingsModal called', { modalSystem: this.modalSystem });
        if (this.modalSystem) {
            this.modalSystem.openSettingsModal();
        } else {
            console.error('ModalSystem not available in UIManager');
        }
    }
    
    /**
     * Update setting (delegates to StateUpdateHelper if available, otherwise uses fallback)
     */
    updateSetting(path, value) {
        if (this.stateUpdateHelper) {
            this.stateUpdateHelper.updateSetting(path, value);
        } else {
            // Fallback to original implementation
            const state = this.stateManager.getState();
            const settings = state.settings || this.stateManager.getDefaultSettings();
            
            // Update nested setting
            const keys = path.split('.');
            let current = settings;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            
            this.stateManager.updateSettings(settings);
            this.applySettings(settings);
        }
    }
    
    /**
     * Apply settings (delegates to StateUpdateHelper if available)
     */
    applySettings(settings) {
        if (this.stateUpdateHelper) {
            this.stateUpdateHelper.applySettingsToDOM(settings);
        } else {
            // Fallback to original implementation
            const root = document.documentElement;
            if (settings.background) {
                root.style.setProperty('--bg-color', settings.background);
            }
        }
    }
    
    /**
     * Create default element (legacy page/element support)
     */
    createDefaultElement(type) {
        const baseElement = {
            type: type,
            text: '',
            timeAllocated: '',
            funModifier: '',
            repeats: true
        };
        
        if (type === 'task' || type === 'header-checkbox') {
            baseElement.subtasks = [];
        }
        
        if (type === 'multi-checkbox') {
            baseElement.items = [];
        }
        
        return baseElement;
    }
    
    /**
     * Show loading overlay
     */
    showLoadingOverlay(text = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = overlay?.querySelector('.loading-text');
        if (overlay) {
            if (loadingText) {
                loadingText.textContent = text;
            }
            overlay.style.display = 'flex';
            // Force reflow to trigger animation
            void overlay.offsetHeight;
        }
    }
    
    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            // Wait for fade-out animation before hiding
            setTimeout(() => {
                overlay.style.display = 'none';
            }, AppConstants.TIMEOUTS.OVERLAY_HIDE);
        }
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
