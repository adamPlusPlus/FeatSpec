// Initialization Manager - Handles application initialization
class InitializationManager {
    constructor(appInstance, stateManager, eventSystem, dataLayer, renderingEngine, managers, services) {
        this.appInstance = appInstance;
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
        this.dataLayer = dataLayer;
        this.renderingEngine = renderingEngine;
        this.managers = managers;
        this.services = services;
        
        // Callbacks for methods that need app-level access
        this.loadPromptsForProjectCallback = null;
        this.createSampleProjectCallback = null;
        this.setupChatHandlersCallback = null;
    }
    
    /**
     * Set callbacks for methods that need app-level access
     */
    setCallbacks(callbacks) {
        if (callbacks.loadPromptsForProject) {
            this.loadPromptsForProjectCallback = callbacks.loadPromptsForProject;
        }
        if (callbacks.createSampleProject) {
            this.createSampleProjectCallback = callbacks.createSampleProject;
        }
        if (callbacks.setupChatHandlers) {
            this.setupChatHandlersCallback = callbacks.setupChatHandlers;
        }
    }
    
    /**
     * Initialize application
     */
    async initialize() {
        try {
            // Load saved state
            const savedState = this.dataLayer.loadState();
            if (savedState) {
                // Check if old format (pages) or new format (projects)
                if (savedState.pages && !savedState.projects) {
                    // Migrate old format to new format
                    await this.migrateOldDataFormat(savedState);
                } else if (savedState.projects && Array.isArray(savedState.projects)) {
                    // Check if projects need migration (old workflowType format)
                    const needsMigration = savedState.projects.some(p => 
                        p.workflowType && !p.case
                    );
                    
                    if (needsMigration) {
                        await this.migrateOldDataFormat(savedState);
                    } else {
                        this.stateManager.loadState(savedState);
                    }
                } else {
                    this.stateManager.loadState(savedState);
                }
                
                // Initialize current project group name from loaded state
                if (savedState && savedState.metadata && savedState.metadata.projectGroupName) {
                    if (this.managers.projectManager) {
                        this.managers.projectManager.setCurrentProjectGroupName(savedState.metadata.projectGroupName);
                    }
                }
            } else {
                // First run - create sample project
                if (this.createSampleProjectCallback) {
                    await this.createSampleProjectCallback();
                }
            }
            
            // Restore last active project from localStorage (device-specific)
            this.restoreLastActiveProject();
            
            // Setup UI event listeners
            if (this.managers.uiManager) {
                this.managers.uiManager.setupUIListeners();
            }
            
            // Load prompts and reference documents
            try {
                await window.PromptLoader?.loadTemplate();
                await window.ReferenceDocuments?.loadAll();
                
                // Load prompts for all existing projects
                const state = this.stateManager.getState();
                if (this.loadPromptsForProjectCallback) {
                    for (const project of state.projects) {
                        await this.loadPromptsForProjectCallback(project.id);
                    }
                }
            } catch (error) {
                console.warn('Failed to load prompts/references:', error);
            }
            
            // Initial render
            this.renderingEngine.renderAll();
            
            // Restore pane states
            this.restorePaneStates();
            
            // Populate project group dropdown
            if (this.managers.projectManager) {
                await this.managers.projectManager.populateProjectGroupDropdown();
            }
            
            this.eventSystem.emit(window.EventType.APPLICATION_INITIALIZED, {
                source: 'InitializationManager',
                data: {}
            });
        } catch (error) {
            console.error('Error initializing application:', error);
            alert('Failed to initialize application: ' + error.message);
        }
    }
    
    /**
     * Initialize chat system (called after ES modules load)
     */
    initializeChatSystem() {
        // Wait for ChatSystem to be available (ES modules load asynchronously)
        const initChat = () => {
            if (typeof window.ChatSystem !== 'undefined') {
                try {
                    if (this.appInstance) {
                        this.appInstance.chatSystem = new window.ChatSystem(this.eventSystem, this.stateManager);
                        
                        // Initialize Chat UI modules
                        const chatWindowElement = document.getElementById('chat-window');
                        if (chatWindowElement) {
                            this.appInstance.chatWindow = new window.ChatWindow(this.eventSystem, document.body);
                            this.appInstance.chatTabBar = new window.ChatTabBar(this.eventSystem, chatWindowElement);
                            this.appInstance.chatMessageList = new window.ChatMessageList(this.eventSystem, chatWindowElement);
                            this.appInstance.chatInput = new window.ChatInput(this.eventSystem, chatWindowElement);
                            this.appInstance.chatSettings = new window.ChatSettings(this.eventSystem, document.body);
                        }
                        
                        // Setup chat handlers after initialization
                        if (this.setupChatHandlersCallback) {
                            this.setupChatHandlersCallback();
                        }
                    }
                } catch (error) {
                    console.warn('Failed to initialize chat system:', error);
                }
            } else {
                // Retry after a short delay
                setTimeout(initChat, AppConstants.TIMEOUTS.CHAT_INIT_RETRY);
            }
        };
        
        // Start initialization
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initChat);
        } else {
            initChat();
        }
    }
    
    /**
     * Restore last active project from localStorage
     */
    restoreLastActiveProject() {
        try {
            const lastActiveProjectId = localStorage.getItem('feat-spec-last-active-project');
            if (lastActiveProjectId) {
                const state = this.stateManager.getState();
                // Check if the project still exists
                const project = state.projects.find(p => p.id === lastActiveProjectId);
                if (project) {
                    // Restore the last active project
                    this.stateManager.setActiveProject(lastActiveProjectId);
                } else {
                    // Project no longer exists, clear the saved value
                    localStorage.removeItem('feat-spec-last-active-project');
                }
            }
        } catch (error) {
            console.warn('Error restoring last active project:', error);
        }
    }
    
    /**
     * Save last active project to localStorage
     */
    saveLastActiveProject(projectId) {
        try {
            if (projectId) {
                localStorage.setItem('feat-spec-last-active-project', projectId);
            } else {
                localStorage.removeItem('feat-spec-last-active-project');
            }
        } catch (error) {
            console.warn('Error saving last active project:', error);
        }
    }
    
    /**
     * Migrate old data format (pages/elements) to new format (projects/sections)
     */
    async migrateOldDataFormat(savedState) {
        // Migration logic would go here
        // This is a complex operation that converts old page/element structure to project/section structure
        // For now, we'll delegate to stateManager if it has migration support
        if (this.stateManager.migrateOldFormat) {
            await this.stateManager.migrateOldFormat(savedState);
        } else {
            // Fallback: try to load as-is
            this.stateManager.loadState(savedState);
        }
    }
    
    /**
     * Restore pane states
     */
    restorePaneStates() {
        try {
            const savedStates = localStorage.getItem('feat-spec-pane-states');
            if (savedStates) {
                const paneStates = JSON.parse(savedStates);
                Object.entries(paneStates).forEach(([paneName, isExpanded]) => {
                    this.updatePaneVisibility(paneName, isExpanded);
                });
            }
        } catch (error) {
            console.warn('Error restoring pane states:', error);
        }
    }
    
    /**
     * Update pane visibility
     */
    updatePaneVisibility(paneName, isExpanded) {
        // Implementation would update DOM based on pane state
        // This is a simplified version
        const pane = document.querySelector(`[data-pane="${paneName}"]`);
        if (pane) {
            if (isExpanded) {
                pane.classList.remove('collapsed');
            } else {
                pane.classList.add('collapsed');
            }
        }
    }
    
    /**
     * Setup event handlers between modules
     */
    setupEventHandlers() {
        // Save last active project when project is activated
        this.eventSystem.register(window.EventType.PROJECT_ACTIVATED, (event) => {
            const { projectId } = event.data;
            if (projectId) {
                this.saveLastActiveProject(projectId);
            }
        });
        
        // Clear saved last active project if it was deleted
        this.eventSystem.register(window.EventType.PROJECT_DELETED, (event) => {
            const { projectId } = event.data;
            if (projectId) {
                const savedLastActive = localStorage.getItem('feat-spec-last-active-project');
                if (savedLastActive === projectId) {
                    localStorage.removeItem('feat-spec-last-active-project');
                }
            }
        });
        
        // Auto-save on state changes
        this.eventSystem.register(window.EventType.STATE_CHANGED, (event) => {
            const state = this.stateManager.getState();
            this.dataLayer.saveState(state);
        });
        
        // Handle context menu actions
        this.eventSystem.register(window.EventType.CONTEXT_MENU_ACTION_SELECTED, (event) => {
            const actionId = event.data.action?.id || event.data.action;
            if (this.managers.uiManager) {
                this.managers.uiManager.handleContextMenuAction(actionId, event.data.context);
            }
        });
        
        // Handle keyboard shortcuts
        this.eventSystem.register(window.EventType.KEYBOARD_SHORTCUT_DETECTED, (event) => {
            if (this.managers.uiManager) {
                this.managers.uiManager.handleKeyboardShortcut(event.data);
            }
        });
        
        // Handle modal actions
        this.eventSystem.register(window.EventType.MODAL_SAVED, (event) => {
            if (this.managers.uiManager) {
                this.managers.uiManager.handleModalSave(event.data.type, event.data.data);
            }
        });
        
        // Handle file operations
        this.eventSystem.register(window.EventType.FILE_LOADED, async (event) => {
            // Autosave previous project group before loading new one
            if (this.managers.projectManager) {
                await this.managers.projectManager.autosaveCurrentProjectGroup();
            }
            
            // Load the new state
            this.stateManager.loadState(event.data.state);
            
            // Update current project group name
            const newState = event.data.state;
            if (newState.metadata && newState.metadata.projectGroupName) {
                if (this.managers.projectManager) {
                    this.managers.projectManager.setCurrentProjectGroupName(newState.metadata.projectGroupName);
                }
            } else if (event.data.filename) {
                // Extract from filename if not in metadata
                const nameWithoutExt = event.data.filename.replace(/\.json$/i, '').replace(/_/g, ' ');
                if (this.managers.projectManager) {
                    this.managers.projectManager.setCurrentProjectGroupName(nameWithoutExt);
                }
            }
            
            // Refresh dropdown to show updated list
            if (this.managers.projectManager) {
                await this.managers.projectManager.populateProjectGroupDropdown();
            }
            // Re-attach listeners after DOM changes
            if (this.managers.uiManager) {
                this.managers.uiManager.setupProjectGroupDropdownListeners();
            }
            
            this.renderingEngine.renderAll();
        });
        
        // Refresh dropdown when files are saved
        this.eventSystem.register(window.EventType.FILE_SAVED, async (event) => {
            if (this.managers.projectManager) {
                await this.managers.projectManager.populateProjectGroupDropdown();
            }
            // Re-attach listeners after DOM changes
            if (this.managers.uiManager) {
                this.managers.uiManager.setupProjectGroupDropdownListeners();
            }
        });
        
        // Handle automation directory initialization
        this.eventSystem.register('ensure-automation-directory', async (event) => {
            const projectId = event.data.projectId;
            if (projectId && this.appInstance && this.appInstance.ensureAutomationDirectory) {
                await this.appInstance.ensureAutomationDirectory(projectId);
                // Re-render to show the new directory
                this.renderingEngine.renderAll();
            }
        });
    }
}
