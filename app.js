// Feature Specification Prompt Creation App - Modular Architecture
// Main application that wires all modules together

class PromptSpecApp {
    constructor() {
        // Initialize core systems
        this.eventSystem = EventSystem.getInstance();
        this.stateManager = new StateManager(this.eventSystem);
        this.dataLayer = new DataLayer(this.eventSystem, 'prompt-spec-data');
        this.pointerTracker = new PointerTracker();
        
        // Initialize interaction handlers
        this.dragDropHandler = new DragDropHandler(this.eventSystem, this.stateManager, this.pointerTracker);
        this.contextMenuHandler = new ContextMenuHandler(this.eventSystem, this.stateManager, this.pointerTracker);
        this.modalSystem = new ModalSystem(this.eventSystem, this.stateManager);
        this.keyboardHandler = new KeyboardHandler(this.eventSystem, this.stateManager);
        this.automationSystem = new AutomationSystem(this.eventSystem, this.stateManager);
        
        // Initialize UI
        this.renderingEngine = new RenderingEngine(this.eventSystem, this.stateManager, this.dragDropHandler);
        
        // Initialize Cursor CLI Automation System (after renderingEngine for dependency)
        this.cursorCLIAutomation = new CursorCLIAutomationSystem(
            this.eventSystem,
            this.stateManager,
            this.renderingEngine
        );
        
        // Initialize Multi-Agent Automation System (after renderingEngine for dependency)
        this.multiAgentAutomation = new MultiAgentAutomationSystem(
            this.eventSystem,
            this.stateManager,
            this.renderingEngine
        );
        
        // Initialize Chat System (wait for ES modules to load)
        this.initializeChatSystem();
        
        // Wire event handlers
        this.setupEventHandlers();
        
        // Initialize application
        this.initialize();
    }
    
    // Initialize chat system (called after ES modules load)
    initializeChatSystem() {
        // Wait for ChatSystem to be available (ES modules load asynchronously)
        const initChat = () => {
            if (typeof window.ChatSystem !== 'undefined') {
                try {
                    this.chatSystem = new window.ChatSystem(this.eventSystem, this.stateManager);
                    
                    // Initialize Chat UI modules
                    const chatWindowElement = document.getElementById('chat-window');
                    if (chatWindowElement) {
                        this.chatWindow = new window.ChatWindow(this.eventSystem, document.body);
                        this.chatTabBar = new window.ChatTabBar(this.eventSystem, chatWindowElement);
                        this.chatMessageList = new window.ChatMessageList(this.eventSystem, chatWindowElement);
                        this.chatInput = new window.ChatInput(this.eventSystem, chatWindowElement);
                        this.chatSettings = new window.ChatSettings(this.eventSystem, document.body);
                    }
                    
                    // Setup chat handlers after initialization
                    this.setupChatHandlers();
                } catch (error) {
                    console.warn('Failed to initialize chat system:', error);
                }
            } else {
                // Retry after a short delay
                setTimeout(initChat, 50);
            }
        };
        
        // Start initialization
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initChat);
        } else {
            initChat();
        }
    }
    
    // Restore last active project from localStorage (device-specific)
    restoreLastActiveProject() {
        try {
            const lastActiveProjectId = localStorage.getItem('feat-spec-last-active-project');
            if (lastActiveProjectId) {
                const state = this.stateManager.getState();
                // Check if the project still exists
                const project = state.projects.find(p => p.id === lastActiveProjectId);
                if (project) {
                    // Restore the last active project (prioritize device-specific preference)
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
    
    // Save last active project to localStorage
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
    
    // Setup event handlers between modules
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
            this.handleContextMenuAction(actionId, event.data.context);
        });
        
        // Handle keyboard shortcuts
        this.eventSystem.register(window.EventType.KEYBOARD_SHORTCUT_DETECTED, (event) => {
            this.handleKeyboardShortcut(event.data);
        });
        
        // Handle modal actions
        this.eventSystem.register(window.EventType.MODAL_SAVED, (event) => {
            this.handleModalSave(event.data.type, event.data.data);
        });
        
        // Handle file operations
        this.eventSystem.register(window.EventType.FILE_LOADED, async (event) => {
            // Autosave previous project group before loading new one
            await this.autosaveCurrentProjectGroup();
            
            // Load the new state
            this.stateManager.loadState(event.data.state);
            
            // Update current project group name
            const newState = event.data.state;
            if (newState.metadata && newState.metadata.projectGroupName) {
                this.currentProjectGroupName = newState.metadata.projectGroupName;
            } else if (event.data.filename) {
                // Extract from filename if not in metadata
                const nameWithoutExt = event.data.filename.replace(/\.json$/i, '').replace(/_/g, ' ');
                this.currentProjectGroupName = nameWithoutExt;
            }
            
            // Refresh dropdown to show updated list
            await this.populateProjectGroupDropdown();
            // Re-attach listeners after DOM changes
            this.setupProjectGroupDropdownListeners();
            
            this.renderingEngine.renderAll();
        });
        
        // Refresh dropdown when files are saved
        this.eventSystem.register(window.EventType.FILE_SAVED, async (event) => {
            await this.populateProjectGroupDropdown();
            // Re-attach listeners after DOM changes
            this.setupProjectGroupDropdownListeners();
        });
        
        // Handle automation directory initialization
        this.eventSystem.register('ensure-automation-directory', async (event) => {
            const projectId = event.data.projectId;
            if (projectId) {
                await this.ensureAutomationDirectory(projectId);
                // Re-render to show the new directory
                this.renderingEngine.renderAll();
            }
        });
    }
    
    // Initialize application
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
                this.currentProjectGroupName = savedState.metadata.projectGroupName;
            }
            } else {
                // First run - create sample project
                await this.createSampleProject();
            }
            
            // Restore last active project from localStorage (device-specific)
            this.restoreLastActiveProject();
            
            // Setup UI event listeners
            this.setupUIListeners();
            
            // Load prompts and reference documents
            try {
                await window.PromptLoader?.loadTemplate();
                await window.ReferenceDocuments?.loadAll();
                
                // Load prompts for all existing projects
                const state = this.stateManager.getState();
                for (const project of state.projects) {
                    await this.loadPromptsForProject(project.id);
                }
            } catch (error) {
                console.warn('Failed to load prompts/references:', error);
            }
            
            // Initial render
            this.renderingEngine.renderAll();
            
            // Restore pane states
            this.restorePaneStates();
            
            // Populate project group dropdown
            await this.populateProjectGroupDropdown();
            
            this.eventSystem.emit(window.EventType.APPLICATION_INITIALIZED, {
                source: 'PromptSpecApp',
                data: {}
            });
        } catch (error) {
            console.error('Error initializing application:', error);
            alert('Failed to initialize application: ' + error.message);
        }
    }
    
    // Migrate old data format (pages/elements) to new format (projects/sections)
    async migrateOldDataFormat(oldState) {
        console.log('Migrating old data format to new format...');
        
        // Create new state structure
        const newState = {
            projects: [],
            activeProjectId: null,
            settings: oldState.settings || this.stateManager.getDefaultSettings(),
            metadata: {
                ...oldState.metadata,
                version: '2.1', // Updated version for case-based format
                migrated: true,
                migrationDate: new Date().toISOString()
            }
        };
        
        // Convert old projects to new format (if they exist)
        if (oldState.projects && Array.isArray(oldState.projects)) {
            for (const oldProject of oldState.projects) {
                // Map old workflowType to case number
                let caseNumber = 1; // Default to Case 1
                if (oldProject.workflowType === 'ux-only') {
                    caseNumber = 2; // UX-only maps to Case 2
                } else if (oldProject.workflowType === 'full') {
                    caseNumber = 1; // Full maps to Case 1
                }
                
                // Create new project with case
                const project = await this.stateManager.createProject(
                    oldProject.name || 'Migrated Project',
                    oldProject.description || 'Migrated from old format',
                    caseNumber
                );
                
                // Migrate sections if they exist
                if (oldProject.sections && Array.isArray(oldProject.sections)) {
                    for (const oldSection of oldProject.sections) {
                        // Find matching section in new project
                        const newSection = project.sections.find(s => 
                            s.sectionId === oldSection.sectionId || 
                            s.sectionName === oldSection.sectionName
                        );
                        
                        if (newSection) {
                            // Migrate section data
                            this.stateManager.updateSection(project.id, newSection.sectionId, {
                                input: oldSection.input || '',
                                output: oldSection.output || '',
                                notes: oldSection.notes || '',
                                status: oldSection.status || 'not_started'
                            });
                        }
                    }
                }
                
                newState.projects.push(project);
            }
            
            // Set active project
            if (oldState.activeProjectId) {
                const migratedProject = newState.projects.find(p => 
                    p.name === oldState.projects.find(op => op.id === oldState.activeProjectId)?.name
                );
                if (migratedProject) {
                    newState.activeProjectId = migratedProject.id;
                }
            } else if (newState.projects.length > 0) {
                newState.activeProjectId = newState.projects[0].id;
            }
        } else if (oldState.pages && Array.isArray(oldState.pages) && oldState.pages.length > 0) {
            // Convert pages to projects (legacy format)
            const firstPage = oldState.pages[0];
            const project = await this.stateManager.createProject(
                firstPage.title || 'Migrated Project',
                'Migrated from old format',
                1 // Default to Case 1
            );
            
            // Note: Old elements can't be directly mapped to pipeline sections
            // User will need to manually organize content into sections
            
            newState.projects = [project];
            newState.activeProjectId = project.id;
        }
        
        // Load the new state
        this.stateManager.loadState(newState);
        
        // Load prompts for migrated projects
        for (const project of newState.projects) {
            await this.loadPromptsForProject(project.id);
        }
        
        console.log('Migration complete');
    }
    
    // Create sample project for first-time users
    async createSampleProject() {
        const project = await this.createProject(
            'Sample Feature Specification',
            'This is a sample project to demonstrate the pipeline workflow. You can delete it and create your own projects.',
            1 // Case 1: Codebase Analysis
        );
        
        // Add some example content to first section
        const firstSection = project.sections[0];
        if (firstSection) {
            this.stateManager.updateSection(project.id, firstSection.sectionId, {
                input: 'Example: iOS Home Screen Hold to Edit feature\n\nDescribe the target application or feature you want to specify...',
                status: 'in_progress'
            });
        }
    }
    
    // Setup UI event listeners (buttons, file operations, etc.)
    setupUIListeners() {
        // Pane toggle buttons
        const toggleProjectsSidebar = document.getElementById('toggle-projects-sidebar');
        const toggleProjectsSidebarCollapsed = document.getElementById('toggle-projects-sidebar-collapsed');
        if (toggleProjectsSidebar) {
            toggleProjectsSidebar.addEventListener('click', () => {
                const isExpanded = this.stateManager.togglePaneState('projectsSidebar');
                this.updatePaneVisibility('projectsSidebar', isExpanded);
            });
        }
        if (toggleProjectsSidebarCollapsed) {
            toggleProjectsSidebarCollapsed.addEventListener('click', () => {
                const isExpanded = this.stateManager.togglePaneState('projectsSidebar');
                this.updatePaneVisibility('projectsSidebar', isExpanded);
            });
        }
        
        const toggleTopBar = document.getElementById('toggle-top-bar');
        const toggleTopBarCollapsed = document.getElementById('toggle-top-bar-collapsed');
        if (toggleTopBar) {
            toggleTopBar.addEventListener('click', () => {
                const isExpanded = this.stateManager.togglePaneState('topBar');
                this.updatePaneVisibility('topBar', isExpanded);
            });
        }
        if (toggleTopBarCollapsed) {
            toggleTopBarCollapsed.addEventListener('click', () => {
                const isExpanded = this.stateManager.togglePaneState('topBar');
                this.updatePaneVisibility('topBar', isExpanded);
            });
        }
        
        const toggleReferencesPanel = document.getElementById('toggle-references-panel');
        const toggleReferencesPanelCollapsed = document.getElementById('toggle-references-panel-collapsed');
        if (toggleReferencesPanel) {
            toggleReferencesPanel.addEventListener('click', () => {
                const isExpanded = this.stateManager.togglePaneState('referencesPanel');
                this.updatePaneVisibility('referencesPanel', isExpanded);
            });
        }
        if (toggleReferencesPanelCollapsed) {
            toggleReferencesPanelCollapsed.addEventListener('click', () => {
                const isExpanded = this.stateManager.togglePaneState('referencesPanel');
                this.updatePaneVisibility('referencesPanel', isExpanded);
            });
        }
        
        // Dropdown toggle
        const dropdownToggle = document.querySelector('.dropdown-toggle');
        const dropdownMenu = document.querySelector('.dropdown-menu');
        if (dropdownToggle && dropdownMenu) {
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isActive = dropdownMenu.classList.toggle('active');
                dropdownToggle.classList.toggle('active', isActive);
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.dropdown')) {
                    dropdownMenu.classList.remove('active');
                    dropdownToggle.classList.remove('active');
                }
            });
            
            // Close dropdown when clicking on menu items (except file operations)
            dropdownMenu.querySelectorAll('button').forEach(button => {
                const buttonId = button.id;
                // Don't auto-close for file operations - they handle their own cleanup
                if (buttonId !== 'save-file' && buttonId !== 'load-file') {
                    button.addEventListener('click', () => {
                        dropdownMenu.classList.remove('active');
                        dropdownToggle.classList.remove('active');
                    });
                }
            });
        }
        
        // Project group name input
        const projectGroupInput = document.getElementById('project-group-name');
        if (projectGroupInput) {
            // Load project group name from state
            const state = this.stateManager.getState();
            if (state.metadata && state.metadata.projectGroupName) {
                projectGroupInput.value = state.metadata.projectGroupName;
                this.currentProjectGroupName = state.metadata.projectGroupName;
            }
            
            // Save project group name on change
            projectGroupInput.addEventListener('change', async (e) => {
                const groupName = e.target.value.trim();
                this.currentProjectGroupName = groupName || null;
                this.stateManager.setState({
                    metadata: {
                        ...this.stateManager.getState().metadata,
                        projectGroupName: groupName || null
                    }
                });
                // Update dropdown to reflect the change
                await this.populateProjectGroupDropdown();
                // Re-attach listeners after DOM changes
                this.setupProjectGroupDropdownListeners();
            });
            
            // Also save on blur
            projectGroupInput.addEventListener('blur', async (e) => {
                const groupName = e.target.value.trim();
                this.currentProjectGroupName = groupName || null;
                this.stateManager.setState({
                    metadata: {
                        ...this.stateManager.getState().metadata,
                        projectGroupName: groupName || null
                    }
                });
                // Update dropdown to reflect the change
                await this.populateProjectGroupDropdown();
                // Re-attach listeners after DOM changes
                this.setupProjectGroupDropdownListeners();
            });
            
            // Handle Enter key to save
            projectGroupInput.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const groupName = e.target.value.trim();
                    this.currentProjectGroupName = groupName || null;
                    this.stateManager.setState({
                        metadata: {
                            ...this.stateManager.getState().metadata,
                            projectGroupName: groupName || null
                        }
                    });
                    // Update dropdown to reflect the change
                    this.populateProjectGroupDropdown().then(() => {
                        // Re-attach listeners after DOM changes
                        this.setupProjectGroupDropdownListeners();
                        projectGroupInput.blur();
                    });
                } else if (e.key === 'Escape') {
                    // Cancel - restore to current project group name
                    e.preventDefault();
                    const state = this.stateManager.getState();
                    const currentName = state.metadata?.projectGroupName || '';
                    projectGroupInput.value = currentName;
                    projectGroupInput.blur();
                }
            });
        }
        
        // Setup project group dropdown listeners
        this.setupProjectGroupDropdownListeners();
    }
    
    // Setup project group dropdown event listeners (can be called multiple times)
    setupProjectGroupDropdownListeners() {
        // Use event delegation on the container to avoid losing listeners when DOM updates
        const container = document.querySelector('.project-group-container');
        if (!container) return;
        
        // Only attach listeners once (check if already attached)
        if (container._projectGroupListenersAttached) {
            return; // Already attached, skip
        }
        
        // Handle selection via event delegation
        container.addEventListener('change', async (e) => {
            if (e.target.id === 'project-group-select') {
                const selectedFile = e.target.value;
                if (selectedFile) {
                    await this.loadProjectGroupFromFile(selectedFile);
                }
            }
        });
        
        // Add right-click context menu via event delegation
        container.addEventListener('contextmenu', (e) => {
            if (e.target.id === 'project-group-select' || e.target.closest('#project-group-select')) {
                e.preventDefault();
                e.stopPropagation();
                const context = { type: 'projectGroupDropdown' };
                this.contextMenuHandler.showMenu({ x: e.clientX, y: e.clientY }, context);
            }
        });
        
        // Mark as attached to prevent duplicate listeners
        container._projectGroupListenersAttached = true;
        
        // Populate dropdown with saved project groups
        this.populateProjectGroupDropdown();
        
        // File operations
        const saveFileBtn = document.getElementById('save-file');
        if (saveFileBtn) {
            saveFileBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent dropdown close
                console.log('Save file button clicked');
                try {
                    const state = this.stateManager.getState();
                    const projectGroupName = state.metadata?.projectGroupName;
                    
                    if (!projectGroupName || !projectGroupName.trim()) {
                        const name = prompt('Enter a project group name to save:');
                        if (!name || !name.trim()) {
                            alert('Project group name is required to save.');
                            return;
                        }
                        // Save the name to state
                        const trimmedName = name.trim();
                        this.stateManager.setState({
                            metadata: {
                                ...state.metadata,
                                projectGroupName: trimmedName
                            }
                        });
                        // Update the input field
                        if (projectGroupInput) {
                            projectGroupInput.value = trimmedName;
                        }
                        // Update current project group name
                        this.currentProjectGroupName = trimmedName;
                        // Use the new name
                        const filename = `${trimmedName.replace(/[^a-z0-9]/gi, '_')}.json`;
                        await this.dataLayer.exportToFile(state, filename);
                        // Update dropdown to show the saved project group
                        await this.populateProjectGroupDropdown();
                    } else {
                        // Update current project group name
                        this.currentProjectGroupName = projectGroupName;
                        // Use existing project group name
                        const filename = `${projectGroupName.replace(/[^a-z0-9]/gi, '_')}.json`;
                        await this.dataLayer.exportToFile(state, filename);
                        // Update dropdown to show the saved project group
                        await this.populateProjectGroupDropdown();
                    }
                    
                    // Close dropdown after save completes
                    setTimeout(() => {
                        const dropdownMenu = document.querySelector('.dropdown-menu');
                        const dropdownToggle = document.querySelector('.dropdown-toggle');
                        if (dropdownMenu) dropdownMenu.classList.remove('active');
                        if (dropdownToggle) dropdownToggle.classList.remove('active');
                    }, 200);
                } catch (err) {
                    console.error('Save file error:', err);
                    alert('Failed to save file: ' + err.message);
                }
            });
        } else {
            console.error('Save file button not found!');
        }
        
        // Export project
        const exportProjectBtn = document.getElementById('export-project');
        if (exportProjectBtn) {
            exportProjectBtn.addEventListener('click', () => {
                const activeProject = this.stateManager.getActiveProject();
                if (!activeProject) {
                    alert('No project selected');
                    return;
                }
                const filename = `${activeProject.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
                this.dataLayer.exportToFile(activeProject, filename);
            });
        }
        
        // Import project
        const importProjectBtn = document.getElementById('import-project');
        const fileInput = document.getElementById('file-input');
        if (importProjectBtn && fileInput) {
            importProjectBtn.addEventListener('click', () => {
                fileInput.click();
            });
            
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const content = await this.dataLayer.getFileInterface().readFile(file);
                        const project = JSON.parse(content);
                        
                        // Validate project structure
                        if (!project.id || !project.name || !Array.isArray(project.sections)) {
                            throw new Error('Invalid project format');
                        }
                        
                        // Add project to state
                        const state = this.stateManager.getState();
                        const projects = [...state.projects, project];
                        this.stateManager.setState({ projects });
                        this.stateManager.setActiveProject(project.id);
                        this.renderingEngine.renderAll();
                    } catch (err) {
                        alert('Failed to import project: ' + err.message);
                    }
                }
                e.target.value = '';
            });
        }
        
        // Export final specification
        const exportFinalSpecBtn = document.getElementById('export-final-spec');
        if (exportFinalSpecBtn) {
            exportFinalSpecBtn.addEventListener('click', () => {
                const activeProject = this.stateManager.getActiveProject();
                if (!activeProject) {
                    alert('No project selected');
                    return;
                }
                
                const section3 = activeProject.sections.find(s => s.sectionId === '3');
                if (!section3 || !section3.output) {
                    alert('Section 3 (Final Document Assembly) is not complete');
                    return;
                }
                
                // Export as markdown
                const blob = new Blob([section3.output], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${activeProject.name.replace(/[^a-z0-9]/gi, '_')}_final_specification.md`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }
        
        // Load from file handler (server-based with file browser)
        const loadFileBtn = document.getElementById('load-file');
        if (loadFileBtn) {
            loadFileBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent dropdown close
                console.log('Load file button clicked');
                
                // Close dropdown first
                const dropdownMenu = document.querySelector('.dropdown-menu');
                const dropdownToggle = document.querySelector('.dropdown-toggle');
                if (dropdownMenu) dropdownMenu.classList.remove('active');
                if (dropdownToggle) dropdownToggle.classList.remove('active');
                
                // Show file browser modal
                await this.showFileBrowserModal();
            });
        } else {
            console.error('Load file button not found!');
        }
        
        // Reload templates button
        const reloadTemplatesBtn = document.getElementById('reload-templates');
        if (reloadTemplatesBtn) {
            reloadTemplatesBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent dropdown close
                console.log('Reload templates button clicked');
                
                // Close dropdown first
                const dropdownMenu = document.querySelector('.dropdown-menu');
                const dropdownToggle = document.querySelector('.dropdown-toggle');
                if (dropdownMenu) dropdownMenu.classList.remove('active');
                if (dropdownToggle) dropdownToggle.classList.remove('active');
                
                // Reload templates
                try {
                    if (window.PromptLoader) {
                        await window.PromptLoader.reload();
                        // Reload prompts for all existing projects
                        const state = this.stateManager.getState();
                        for (const project of state.projects) {
                            await this.loadPromptsForProject(project.id);
                        }
                        alert('Templates reloaded successfully!');
                    } else {
                        alert('PromptLoader not available');
                    }
                } catch (error) {
                    console.error('Error reloading templates:', error);
                    alert('Failed to reload templates: ' + error.message);
                }
            });
        }
        
        // Settings
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }
        
        // Settings modal handlers
        const settingsClose = document.getElementById('settings-close');
        if (settingsClose) {
            settingsClose.addEventListener('click', () => {
                this.modalSystem.closeSettingsModal();
            });
        }
        
        const settingsReset = document.getElementById('settings-reset');
        if (settingsReset) {
            settingsReset.addEventListener('click', () => {
                const defaultSettings = this.stateManager.getDefaultSettings();
                this.stateManager.updateSettings(defaultSettings);
                this.showSettingsModal(); // Refresh
            });
        }
        
        // New project button
        const newProjectBtn = document.getElementById('new-project-btn');
        const newProjectMenuBtn = document.getElementById('new-project');
        const handleNewProject = async () => {
            const name = prompt('Project name:');
            if (name) {
                const result = await this.showCaseSelectionDialog();
                if (result !== null) {
                    // Handle both old format (number) and new format (object)
                    const caseNumber = typeof result === 'object' ? result.caseNumber : result;
                    const automationEngine = typeof result === 'object' ? result.automationEngine : 'file-watching';
                    await this.createProject(name, '', caseNumber, null, false, automationEngine);
                    this.renderingEngine.renderAll();
                }
            }
        };
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', handleNewProject);
        }
        if (newProjectMenuBtn) {
            newProjectMenuBtn.addEventListener('click', handleNewProject);
        }
        
        // New project group button
        const newProjectGroupBtn = document.getElementById('new-project-group');
        if (newProjectGroupBtn) {
            newProjectGroupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Handle immediately for prompt, but defer heavy operations
                this.handleContextMenuAction('new-project-group', { type: 'projectGroup' }).catch(err => {
                    console.error('Error handling new project group:', err);
                });
            });
        }
        
        // View toggle buttons
        const viewSectionBtn = document.getElementById('view-section');
        const viewPipelineBtn = document.getElementById('view-pipeline');
        if (viewSectionBtn && viewPipelineBtn) {
            viewSectionBtn.addEventListener('click', () => {
                document.getElementById('section-view').style.display = 'block';
                document.getElementById('pipeline-flow-view').style.display = 'none';
                viewSectionBtn.classList.add('active');
                viewPipelineBtn.classList.remove('active');
            });
            viewPipelineBtn.addEventListener('click', () => {
                document.getElementById('section-view').style.display = 'none';
                document.getElementById('pipeline-flow-view').style.display = 'block';
                viewPipelineBtn.classList.add('active');
                viewSectionBtn.classList.remove('active');
                this.renderingEngine.renderPipelineFlowView();
            });
        }
        
        // Handle collapsed section-modifiers clicks (expand on click, context menu on right-click)
        document.addEventListener('click', (e) => {
            const collapsedModifiers = e.target.closest('.section-modifiers.collapsed');
            if (collapsedModifiers && e.button === 0) { // Left click only
                // Expand the collapsed modifiers section
                collapsedModifiers.classList.remove('collapsed');
                e.stopPropagation();
            }
        });
        
        // Universal click-outside-to-close handler for all modals
        document.addEventListener('click', (e) => {
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
                    } else if (modalId === 'case-selection-modal') {
                        const cancelBtn = modal.querySelector('#case-selection-cancel');
                        if (cancelBtn) cancelBtn.click();
                    } else if (modalId === 'file-browser-modal') {
                        const cancelBtn = modal.querySelector('#file-browser-cancel');
                        if (cancelBtn) cancelBtn.click();
                    } else if (modalId === 'previous-step-modal') {
                        const cancelBtn = modal.querySelector('#previous-step-cancel');
                        if (cancelBtn) cancelBtn.click();
                    } else if (modalId === 'input-guidance-modal') {
                        const okBtn = modal.querySelector('#input-guidance-ok');
                        if (okBtn) okBtn.click();
                    } else if (modalId === 'settings-modal') {
                        this.modalSystem.closeSettingsModal();
                    } else if (modalId === 'automation-modal') {
                        modal.style.display = 'none';
                    } else if (modalId === 'cursor-cli-progress-modal') {
                        const cancelBtn = modal.querySelector('#cursor-cli-cancel');
                        if (cancelBtn) cancelBtn.click();
                    } else if (modalId === 'multi-agent-progress-modal') {
                        const cancelBtn = modal.querySelector('#multi-agent-cancel');
                        if (cancelBtn) cancelBtn.click();
                    } else if (modalId === 'modal') {
                        // Generic modal - trigger cancel
                        const cancelBtn = modal.querySelector('#modal-cancel');
                        if (cancelBtn) cancelBtn.click();
                    }
                }
            }
        });
        
        // Automation button
        const automationBtn = document.getElementById('automation-btn');
        const automationRefreshBtn = document.getElementById('automation-refresh-btn');
        const automationModal = document.getElementById('automation-modal');
        const automationStart = document.getElementById('automation-start');
        const automationStop = document.getElementById('automation-stop');
        const automationClose = document.getElementById('automation-close');
        const automationStatusText = document.getElementById('automation-status-text');
        const automationCurrentStep = document.getElementById('automation-current-step');
        
        if (automationBtn && automationModal) {
            automationBtn.addEventListener('click', async () => {
                const activeProject = this.stateManager.getActiveProject();
                if (!activeProject) {
                    alert('Please select a project first.');
                    return;
                }
                
                // If automation directory is set, toggle automation on/off
                if (activeProject.automationDirectory) {
                    if (this.automationSystem && this.automationSystem.isRunning) {
                        // Stop automation
                        this.stopAutomation();
                    } else {
                        // Start automation
                        await this.startAutomation(activeProject.id);
                    }
                } else {
                    // No directory set, show modal
                    automationModal.style.display = 'flex';
                    this.updateAutomationStatus();
                }
            });
        }
        
        // Automation modal close button
        if (automationClose) {
            automationClose.addEventListener('click', () => {
                automationModal.style.display = 'none';
            });
        }
        
        // Automation refresh button
        if (automationRefreshBtn) {
            automationRefreshBtn.addEventListener('click', async () => {
                const activeProject = this.stateManager.getActiveProject();
                if (!activeProject) {
                    alert('Please select a project first.');
                    return;
                }
                
                if (!this.automationSystem || !this.automationSystem.isRunning) {
                    alert('Automation is not running. Please start automation first.');
                    return;
                }
                
                // Trigger manual refresh
                await this.refreshAutomationCheck(activeProject.id);
            });
        }
        
        if (automationStart) {
            automationStart.addEventListener('click', async () => {
                const activeProject = this.stateManager.getActiveProject();
                if (!activeProject) {
                    alert('Please select a project first.');
                    return;
                }
                
                // Check if directory is set
                if (!activeProject.automationDirectory) {
                    alert('Please set the automation directory in the Pipeline Flow view before starting automation.');
                    return;
                }
                
                await this.startAutomation(activeProject.id);
            });
        }
        
        if (automationStop) {
            automationStop.addEventListener('click', () => {
                this.stopAutomation();
            });
        }
        
        if (automationClose) {
            automationClose.addEventListener('click', () => {
                automationModal.style.display = 'none';
            });
        }
        
        // Listen for automation events
        this.eventSystem.register(EventType.AUTOMATION_STARTED, (event) => {
            if (automationStart) automationStart.style.display = 'none';
            if (automationStop) automationStop.style.display = 'inline-block';
            if (automationStatusText) automationStatusText.textContent = 'Running';
            this.updateAutomationStatus();
            this.updateAutomationButtonIcon(true);
        });
        
        this.eventSystem.register(EventType.AUTOMATION_STOPPED, (event) => {
            if (automationStart) automationStart.style.display = 'inline-block';
            if (automationStop) automationStop.style.display = 'none';
            if (automationStatusText) automationStatusText.textContent = 'Stopped';
            if (automationCurrentStep) automationCurrentStep.textContent = '';
            this.updateAutomationStatus();
            this.renderingEngine.renderAll();
            this.updateAutomationButtonIcon(false);
        });
        
        this.eventSystem.register(EventType.AUTOMATION_SECTION_COMPLETE, (event) => {
            this.updateAutomationStatus();
            this.renderingEngine.renderAll();
        });
        
        // Reference documents button
        const referencesBtn = document.getElementById('references-btn');
        const referencesClose = document.getElementById('references-close');
        const referencesPanel = document.getElementById('references-panel');
        if (referencesBtn && referencesPanel) {
            referencesBtn.addEventListener('click', () => {
                referencesPanel.style.display = referencesPanel.style.display === 'none' ? 'block' : 'none';
                if (referencesPanel.style.display === 'block') {
                    this.renderReferenceDocuments();
                }
            });
        }
        
        // Process step results panel close button
        const processStepResultsClose = document.getElementById('process-step-results-close');
        if (processStepResultsClose) {
            processStepResultsClose.addEventListener('click', () => {
                const panel = document.getElementById('process-step-results-panel');
                if (panel) {
                    panel.style.display = 'none';
                }
            });
        }
        if (referencesClose && referencesPanel) {
            referencesClose.addEventListener('click', () => {
                referencesPanel.style.display = 'none';
            });
        }
        
        // Chat handlers will be set up after chat system initializes (in initializeChatSystem)
        
        // Setup textarea change handlers (delegated)
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('section-input')) {
                const projectId = e.target.dataset.projectId;
                const sectionId = e.target.dataset.sectionId;
                this.handleSectionInputChange(projectId, sectionId, e.target.value);
            } else if (e.target.classList.contains('section-output')) {
                const projectId = e.target.dataset.projectId;
                const sectionId = e.target.dataset.sectionId;
                this.handleSectionOutputChange(projectId, sectionId, e.target.value);
            } else if (e.target.classList.contains('section-notes')) {
                const projectId = e.target.dataset.projectId;
                const sectionId = e.target.dataset.sectionId;
                this.handleSectionNotesChange(projectId, sectionId, e.target.value);
            } else if (e.target.classList.contains('section-override-instructions')) {
                const projectId = e.target.dataset.projectId;
                const sectionId = e.target.dataset.sectionId;
                this.handleSectionOverrideInstructionsChange(projectId, sectionId, e.target.value);
            }
        });
        
        // Handle automation directory input on blur (when user clicks away) or Enter key
        document.addEventListener('blur', async (e) => {
            if (e.target.id === 'automation-dir-input') {
                const projectId = e.target.dataset.projectId;
                let directory = e.target.value.trim();
                // Normalize backslashes to forward slashes
                directory = directory.replace(/\\/g, '/');
                // Update input field with normalized path
                if (e.target.value !== directory) {
                    e.target.value = directory;
                }
                await this.handleAutomationDirectoryChange(projectId, directory);
            }
        }, true); // Use capture phase to ensure it fires
        
        // Handle paste events on automation directory input
        document.addEventListener('paste', (e) => {
            if (e.target.id === 'automation-dir-input') {
                // Normalize pasted path after paste event completes
                setTimeout(() => {
                    const directory = e.target.value.trim().replace(/\\/g, '/');
                    if (e.target.value !== directory) {
                        e.target.value = directory;
                    }
                }, 0);
            }
        });
        
        // Handle Enter key on automation directory input
        document.addEventListener('keydown', async (e) => {
            if (e.target.id === 'automation-dir-input' && e.key === 'Enter') {
                e.preventDefault(); // Prevent form submission if in a form
                const projectId = e.target.dataset.projectId;
                let directory = e.target.value.trim();
                // Normalize backslashes to forward slashes
                directory = directory.replace(/\\/g, '/');
                // Update input field with normalized path
                if (e.target.value !== directory) {
                    e.target.value = directory;
                }
                await this.handleAutomationDirectoryChange(projectId, directory);
                e.target.blur(); // Remove focus after processing
            }
        });
        
        // Automation mode toggle
        document.addEventListener('change', (e) => {
            if (e.target.name === 'automation-mode') {
                const mode = e.target.value;
                this.stateManager.setAutomationMode(mode);
                
                // Show/hide scope directory section
                const scopeSection = document.getElementById('scope-directory-section');
                if (scopeSection) {
                    scopeSection.style.display = mode === 'cursor-cli' ? 'block' : 'none';
                }
            }
        });
        
        // Scope directory input handlers (per-project)
        document.addEventListener('blur', async (e) => {
            if (e.target.id === 'scope-directory-input' && e.target.dataset.projectId) {
                const projectId = e.target.dataset.projectId;
                let scopeDir = e.target.value.trim();
                // Normalize backslashes to forward slashes
                scopeDir = scopeDir.replace(/\\/g, '/');
                // Update input field with normalized path
                if (e.target.value !== scopeDir) {
                    e.target.value = scopeDir;
                }
                // Save to project
                this.stateManager.updateProject(projectId, { scopeDirectory: scopeDir || null });
            }
        }, true);
        
        // Handle paste events on scope directory input
        document.addEventListener('paste', (e) => {
            if (e.target.id === 'scope-directory-input') {
                // Normalize pasted path after paste event completes
                setTimeout(() => {
                    const scopeDir = e.target.value.trim().replace(/\\/g, '/');
                    if (e.target.value !== scopeDir) {
                        e.target.value = scopeDir;
                    }
                }, 0);
            }
        });
        
        document.addEventListener('keydown', async (e) => {
            if (e.target.id === 'scope-directory-input' && e.target.dataset.projectId && e.key === 'Enter') {
                e.preventDefault();
                const projectId = e.target.dataset.projectId;
                let scopeDir = e.target.value.trim();
                // Normalize backslashes to forward slashes
                scopeDir = scopeDir.replace(/\\/g, '/');
                // Update input field with normalized path
                if (e.target.value !== scopeDir) {
                    e.target.value = scopeDir;
                }
                // Save to project
                this.stateManager.updateProject(projectId, { scopeDirectory: scopeDir || null });
                e.target.blur();
            }
        });
        
        // Browse scope directory button (per-project)
        document.addEventListener('click', async (e) => {
            if (e.target.id === 'browse-scope-dir' && e.target.dataset.projectId) {
                const projectId = e.target.dataset.projectId;
                const project = this.stateManager.getProject(projectId);
                const currentScope = project?.scopeDirectory || '';
                const newScope = prompt('Enter scope directory path (e.g., ./my-project or H:/Projects/my-project):', currentScope);
                if (newScope !== null) {
                    let normalizedScope = newScope.trim().replace(/\\/g, '/');
                    this.stateManager.updateProject(projectId, { scopeDirectory: normalizedScope || null });
                    const input = document.getElementById('scope-directory-input');
                    if (input && input.dataset.projectId === projectId) {
                        input.value = normalizedScope;
                    }
                }
            }
        });
        
        // Cursor CLI close and cancel buttons
        const cursorCLIClose = document.getElementById('cursor-cli-close');
        if (cursorCLIClose) {
            cursorCLIClose.addEventListener('click', () => {
                const modal = document.getElementById('cursor-cli-progress-modal');
                if (modal) {
                    const cancelBtn = modal.querySelector('#cursor-cli-cancel');
                    if (cancelBtn) cancelBtn.click();
                }
            });
        }
        
        // Multi-agent close and cancel buttons
        const multiAgentClose = document.getElementById('multi-agent-close');
        if (multiAgentClose) {
            multiAgentClose.addEventListener('click', () => {
                const modal = document.getElementById('multi-agent-progress-modal');
                if (modal) {
                    const cancelBtn = modal.querySelector('#multi-agent-cancel');
                    if (cancelBtn) cancelBtn.click();
                }
            });
        }
        
        // Cursor CLI cancel button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'cursor-cli-cancel') {
                if (this.cursorCLIAutomation && this.cursorCLIAutomation.isRunning) {
                    this.cursorCLIAutomation.stop();
                }
                const modal = document.getElementById('cursor-cli-progress-modal');
                if (modal) modal.style.display = 'none';
            }
            
            if (e.target.id === 'multi-agent-cancel') {
                if (this.multiAgentAutomation && this.multiAgentAutomation.isRunning) {
                    this.multiAgentAutomation.stop();
                }
                const modal = document.getElementById('multi-agent-progress-modal');
                if (modal) modal.style.display = 'none';
            }
            
            // Toggle conversations display
            if (e.target.id === 'multi-agent-toggle-conversations') {
                const container = document.getElementById('multi-agent-conversations');
                const button = e.target;
                if (container) {
                    if (container.style.display === 'none') {
                        container.style.display = 'block';
                        button.textContent = 'Hide';
                        // Update conversations when showing
                        if (this.multiAgentAutomation) {
                            this.multiAgentAutomation.updateConversations();
                        }
                    } else {
                        container.style.display = 'none';
                        button.textContent = 'Show';
                    }
                }
            }
            
            // Toggle RAG steps display
            if (e.target.id === 'multi-agent-toggle-rag') {
                const container = document.getElementById('multi-agent-rag-steps');
                const button = e.target;
                if (container) {
                    if (container.style.display === 'none') {
                        container.style.display = 'block';
                        button.textContent = 'Hide';
                        // Update RAG steps when showing
                        if (this.multiAgentAutomation) {
                            this.multiAgentAutomation.updateRAGSteps();
                        }
                    } else {
                        container.style.display = 'none';
                        button.textContent = 'Show';
                    }
                }
            }
        });
        
        // Setup button click handlers (delegated)
        document.addEventListener('click', async (e) => {
            if (e.target.id === 'create-automation-dir-btn') {
                const projectId = e.target.dataset.projectId;
                const caseSlug = e.target.dataset.caseSlug;
                await this.createAutomationDirectory(projectId, caseSlug);
            } else if (e.target.classList.contains('btn-input-guidance')) {
                const projectId = e.target.dataset.projectId;
                const sectionId = e.target.dataset.sectionId;
                await this.showInputGuidance(projectId, sectionId);
            }
        });
        
        // Input Guidance modal close handlers
        const inputGuidanceModal = document.getElementById('input-guidance-modal');
        const inputGuidanceClose = document.getElementById('input-guidance-close');
        const inputGuidanceOk = document.getElementById('input-guidance-ok');
        
        if (inputGuidanceClose) {
            inputGuidanceClose.addEventListener('click', () => {
                if (inputGuidanceModal) inputGuidanceModal.style.display = 'none';
            });
        }
        
        if (inputGuidanceOk) {
            inputGuidanceOk.addEventListener('click', () => {
                if (inputGuidanceModal) inputGuidanceModal.style.display = 'none';
            });
        }
        
        if (inputGuidanceModal) {
            const backdrop = inputGuidanceModal.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.addEventListener('click', () => {
                    inputGuidanceModal.style.display = 'none';
                });
            }
        }
    }
    
    // Render reference documents panel
    async renderReferenceDocuments() {
        const content = document.getElementById('references-content');
        if (!content) return;
        
        try {
            await window.ReferenceDocuments?.loadAll();
            const docKeys = window.ReferenceDocuments?.getAllDocumentKeys() || [];
            
            let html = '<div class="references-list">';
            docKeys.forEach(key => {
                const name = window.ReferenceDocuments?.getDocumentName(key) || key;
                html += `
                    <div class="reference-item" data-doc-key="${key}">
                        <h4>${this.escapeHtml(name)}</h4>
                        <button class="btn-view" onclick="app.viewReferenceDocument('${key}')">View</button>
                    </div>
                `;
            });
            html += '</div>';
            
            content.innerHTML = html;
        } catch (error) {
            console.error('Failed to render reference documents:', error);
            content.innerHTML = '<p>Failed to load reference documents</p>';
        }
    }
    
    // View a reference document
    async viewReferenceDocument(docKey) {
        const content = await window.ReferenceDocuments?.getDocument(docKey);
        if (!content) return;
        
        // Show in modal or expand in panel
        const modal = document.getElementById('modal');
        const modalHeader = document.getElementById('modal-header');
        const modalBody = document.getElementById('modal-body');
        
        if (modal && modalHeader && modalBody) {
            const name = window.ReferenceDocuments?.getDocumentName(docKey) || docKey;
            modalHeader.innerHTML = `<h2>${this.escapeHtml(name)}</h2><button class="close-btn" onclick="window.app.closeModal()">×</button>`;
            modalHeader.className = 'modal-header';
            modalBody.innerHTML = `<pre class="reference-content">${this.escapeHtml(content)}</pre>`;
            modal.classList.add('active');
        }
    }
    
    // Escape HTML helper
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Handle context menu actions
    async handleContextMenuAction(actionId, context) {
        switch (actionId) {
            // Project actions
            case 'rename-project':
                if (context.type === 'project' && context.projectId) {
                    const project = this.stateManager.getProject(context.projectId);
                    if (project) {
                        const newName = prompt('Enter new project name:', project.name);
                        if (newName && newName.trim()) {
                            this.stateManager.updateProject(context.projectId, { name: newName.trim() });
                            // Defer render to avoid blocking
                            setTimeout(() => {
                                this.renderingEngine.renderAll();
                            }, 0);
                        }
                    }
                }
                break;
            case 'duplicate-project':
                if (context.type === 'project' && context.projectId) {
                    const project = this.stateManager.getProject(context.projectId);
                    if (project) {
                        const newProject = this.createProject(
                            `${project.name} (Copy)`,
                            project.description,
                            project.workflowType
                        );
                        // Copy all section data
                        project.sections.forEach(section => {
                            this.stateManager.updateSection(newProject.id, section.sectionId, {
                                input: section.input,
                                output: section.output,
                                notes: section.notes,
                                status: section.status
                            });
                        });
                        // Defer render to avoid blocking
                        setTimeout(() => {
                            this.renderingEngine.renderAll();
                        }, 0);
                    }
                }
                break;
            case 'export-project':
                if (context.type === 'project' && context.projectId) {
                    const project = this.stateManager.getProject(context.projectId);
                    if (project) {
                        // For Case 4, export structured outputs
                        if (project.case === 4) {
                            this.exportStructuredOutputs(project);
                        } else {
                            const filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
                            this.dataLayer.exportToFile(project, filename);
                        }
                    }
                }
                break;
            case 'set-active-project':
                if (context.type === 'project' && context.projectId) {
                    this.stateManager.setActiveProject(context.projectId);
                    // Defer render to avoid blocking
                    setTimeout(() => {
                        this.renderingEngine.renderAll();
                    }, 0);
                }
                break;
            case 'delete-project':
                if (context.type === 'project' && context.projectId) {
                    const project = this.stateManager.getProject(context.projectId);
                    if (project && confirm(`Delete project "${project.name}"?`)) {
                        this.stateManager.removeProject(context.projectId);
                        // Defer render to avoid blocking
                        setTimeout(() => {
                            this.renderingEngine.renderAll();
                        }, 0);
                    }
                }
                break;
            // Project Group actions
            case 'new-project-group':
                // Prompt for new project group name
                const newGroupName = prompt('Enter new project group name:');
                if (newGroupName && newGroupName.trim()) {
                    const trimmedName = newGroupName.trim();
                    
                    // Autosave current project group if it exists
                    const currentState = this.stateManager.getState();
                    const currentProjectGroupName = currentState.metadata?.projectGroupName || this.currentProjectGroupName;
                    if (currentProjectGroupName && currentProjectGroupName.trim() && currentState.projects && currentState.projects.length > 0) {
                        try {
                            const filename = `${currentProjectGroupName.trim().replace(/[^a-z0-9]/gi, '_')}.json`;
                            await this.dataLayer.exportToFile(currentState, filename);
                        } catch (error) {
                            console.error('Failed to autosave current project group:', error);
                        }
                    }
                    
                    // Create new empty state with new project group name
                    const initialState = this.stateManager.createInitialState();
                    const newState = {
                        ...initialState,
                        metadata: {
                            ...initialState.metadata,
                            projectGroupName: trimmedName
                        }
                    };
                    
                    // Load the new empty state (this clears all projects)
                    this.stateManager.loadState(newState);
                    
                    this.currentProjectGroupName = trimmedName;
                    
                    // Save the new empty state to file
                    try {
                        const filename = `${trimmedName.replace(/[^a-z0-9]/gi, '_')}.json`;
                        await this.dataLayer.exportToFile(newState, filename);
                    } catch (error) {
                        console.error('Failed to save new project group:', error);
                    }
                    
                    // Update UI - show dropdown, hide input
                    const projectGroupInput = document.getElementById('project-group-name');
                    const projectGroupSelect = document.getElementById('project-group-select');
                    if (projectGroupInput) {
                        projectGroupInput.value = trimmedName;
                        projectGroupInput.style.display = 'none';
                    }
                    if (projectGroupSelect) {
                        projectGroupSelect.style.display = 'block';
                    }
                    
                    // Refresh dropdown and render all to show empty state
                    await this.populateProjectGroupDropdown();
                    // Re-attach listeners after DOM changes
                    this.setupProjectGroupDropdownListeners();
                    this.renderingEngine.renderAll();
                }
                break;
            case 'edit-project-group-name':
                // Show the input field with current name for editing
                const editProjectGroupInput = document.getElementById('project-group-name');
                const editProjectGroupSelect = document.getElementById('project-group-select');
                if (editProjectGroupInput && editProjectGroupSelect) {
                    const state = this.stateManager.getState();
                    const currentName = state.metadata?.projectGroupName || '';
                    editProjectGroupInput.value = currentName;
                    editProjectGroupInput.style.display = 'block';
                    editProjectGroupSelect.style.display = 'none';
                    editProjectGroupInput.focus();
                    editProjectGroupInput.select();
                }
                break;
            case 'save-project-group':
                if (context.type === 'projectGroup') {
                    // Trigger save file action
                    const state = this.stateManager.getState();
                    const projectGroupName = state.metadata?.projectGroupName;
                    const projectGroupInput = document.getElementById('project-group-name');
                    
                    if (!projectGroupName || !projectGroupName.trim()) {
                        const name = prompt('Enter a project group name to save:');
                        if (!name || !name.trim()) {
                            alert('Project group name is required to save.');
                            return;
                        }
                        // Save the name to state
                        const trimmedName = name.trim();
                        this.stateManager.setState({
                            metadata: {
                                ...state.metadata,
                                projectGroupName: trimmedName
                            }
                        });
                        // Update the input field
                        if (projectGroupInput) {
                            projectGroupInput.value = trimmedName;
                        }
                        // Update current project group name
                        this.currentProjectGroupName = trimmedName;
                        // Use the new name
                        const filename = `${trimmedName.replace(/[^a-z0-9]/gi, '_')}.json`;
                        await this.dataLayer.exportToFile(state, filename);
                        // Update dropdown to show the saved project group
                        await this.populateProjectGroupDropdown();
                    } else {
                        // Update current project group name
                        this.currentProjectGroupName = projectGroupName;
                        // Use existing project group name
                        const filename = `${projectGroupName.replace(/[^a-z0-9]/gi, '_')}.json`;
                        await this.dataLayer.exportToFile(state, filename);
                        // Update dropdown to show the saved project group
                        await this.populateProjectGroupDropdown();
                    }
                }
                break;
            case 'load-project-group':
                if (context.type === 'projectGroup') {
                    // Trigger load file modal
                    await this.showFileBrowserModal();
                }
                break;
            case 'edit-project-group':
                if (context.type === 'projectGroupDropdown') {
                    await this.showProjectGroupEditModal();
                }
                break;
            case 'delete-project-group':
                if (context.type === 'projectGroupDropdown') {
                    await this.deleteProjectGroup();
                }
                break;
            // Pane actions
            case 'toggle-pane':
                if (context.type === 'pane' && context.paneName) {
                    const isExpanded = this.stateManager.togglePaneState(context.paneName);
                    this.updatePaneVisibility(context.paneName, isExpanded);
                }
                break;
            // Section actions
            case 'mark-complete-section':
                if ((context.type === 'section' || context.type === 'pipelineSection') && context.projectId && context.sectionId) {
                    const project = this.stateManager.getProject(context.projectId);
                    const section = project?.sections.find(s => s.sectionId === context.sectionId);
                    if (section) {
                        const newStatus = section.status === 'complete' ? 'in_progress' : 'complete';
                        this.stateManager.updateSection(context.projectId, context.sectionId, { status: newStatus });
                        this.renderingEngine.renderAll();
                    }
                }
                break;
            case 'copy-section-output':
                if (context.type === 'section' && context.projectId && context.sectionId) {
                    const project = this.stateManager.getProject(context.projectId);
                    const section = project?.sections.find(s => s.sectionId === context.sectionId);
                    if (section && section.output) {
                        navigator.clipboard.writeText(section.output).catch(err => {
                            console.error('Failed to copy:', err);
                            alert('Failed to copy to clipboard');
                        });
                    }
                }
                break;
            case 'copy-prompt-input':
                if (context.type === 'section' && context.projectId && context.sectionId) {
                    this.copyPromptWithInput(context.projectId, context.sectionId);
                }
                break;
            case 'paste-previous-section':
                if (context.type === 'section' && context.projectId && context.sectionId) {
                    this.pasteFromPreviousSection(context.projectId, context.sectionId);
                    this.renderingEngine.renderAll();
                }
                break;
            case 'clear-section-output':
                if (context.type === 'section' && context.projectId && context.sectionId) {
                    if (confirm('Clear section output?')) {
                        this.stateManager.updateSection(context.projectId, context.sectionId, { output: '' });
                        this.renderingEngine.renderAll();
                    }
                }
                break;
            case 'collapse-all-panels':
                if (context.type === 'section' && context.projectId && context.sectionId) {
                    // Collapse all panels in the current section view
                    const sectionView = document.querySelector('.section-view-content');
                    if (sectionView) {
                        const allPanels = sectionView.querySelectorAll('.panel-content');
                        const allCollapseButtons = sectionView.querySelectorAll('.btn-collapse');
                        
                        allPanels.forEach(panel => {
                            panel.classList.add('collapsed');
                        });
                        
                        allCollapseButtons.forEach(btn => {
                            btn.textContent = '▶';
                        });
                    }
                }
                break;
            case 'insert-step-above':
                if ((context.type === 'section' || context.type === 'pipelineSection') && context.projectId && context.sectionId) {
                    await this.showAddStepDialog(context.projectId, context.sectionId, 'above');
                }
                break;
            case 'insert-step-below':
                if ((context.type === 'section' || context.type === 'pipelineSection') && context.projectId && context.sectionId) {
                    await this.showAddStepDialog(context.projectId, context.sectionId, 'below');
                }
                break;
            case 'jump-to-section':
                if ((context.type === 'section' || context.type === 'pipelineSection') && context.projectId && context.sectionId) {
                    this.navigateToSection(context.projectId, context.sectionId);
                }
                break;
            case 'delete-step':
                if (context.type === 'pipelineSection' && context.projectId && context.sectionId) {
                    if (confirm('Delete this step? This action cannot be undone.')) {
                        const project = this.stateManager.getProject(context.projectId);
                        if (project) {
                            const sections = project.sections.filter(s => s.sectionId !== context.sectionId);
                            this.stateManager.updateProject(context.projectId, { sections });
                            this.renderingEngine.renderAll();
                            const pipelineFlowView = document.getElementById('pipeline-flow-view');
                            if (pipelineFlowView && pipelineFlowView.style.display !== 'none') {
                                this.renderingEngine.renderPipelineFlowView();
                            }
                        }
                    }
                }
                break;
            case 'add-step':
                if (context.type === 'pipelineFlowView' && context.projectId) {
                    await this.showAddStepDialog(context.projectId);
                }
                break;
            case 'set-default-automation-dir':
                if (context.type === 'createAutomationDirBtn' || context.type === 'automationDirSection') {
                    await this.setDefaultAutomationDirectory();
                }
                break;
            case 'open-automation-dir':
                if (context.type === 'automationDirSection' && context.projectId) {
                    await this.openAutomationDirectory(context.projectId);
                }
                break;
            case 'enhance-from-case':
                if (context.type === 'project' && context.projectId) {
                    // Show dialog to select previous project
                    const state = this.stateManager.getState();
                    const otherProjects = state.projects.filter(p => p.id !== context.projectId);
                    if (otherProjects.length === 0) {
                        alert('No other projects available to enhance from.');
                        return;
                    }
                    const projectNames = otherProjects.map(p => `${p.id}: ${p.name}`).join('\n');
                    const selectedId = prompt(`Select a project to enhance from:\n${projectNames}\n\nEnter project ID:`, otherProjects[0].id);
                    if (selectedId) {
                        await this.enhanceFromPreviousCase(context.projectId, selectedId);
                        this.renderingEngine.renderAll();
                    }
                }
                break;
            case 'view-case-chain':
                if (context.type === 'project' && context.projectId) {
                    const project = this.stateManager.getProject(context.projectId);
                    if (project && project.caseChain) {
                        alert(`This project is enhanced from Case ${project.caseChain.previousCase}.\n\nPrevious output:\n${project.caseChain.previousOutput.substring(0, 200)}...`);
                    } else if (project && project.linkedFromCase4) {
                        const sourceProject = this.stateManager.getProject(project.linkedFromCase4);
                        alert(`This project is linked to Case 4 project: ${sourceProject?.name || project.linkedFromCase4}\n\nStructured inputs have been automatically injected into the appropriate sections.`);
                    } else {
                        alert('This project is not part of a case chain.');
                    }
                }
                break;
            case 'link-to-project':
                if (context.type === 'project' && context.projectId) {
                    await this.linkCase4ToTarget(context.projectId);
                }
                break;
            case 'link-from-case4':
                if (context.type === 'project' && context.projectId) {
                    await this.linkFromCase4(context.projectId);
                }
                break;
            case 'edit-modifiers':
                if (context.type === 'section' && context.projectId && context.sectionId) {
                    const modifiers = await this.showModifierEditorModal(context.projectId, context.sectionId);
                    if (modifiers !== null) {
                        await this.overrideModifiers(context.projectId, context.sectionId, modifiers);
                        this.renderingEngine.renderAll();
                    }
                }
                break;
            case 'reset-modifiers':
                if (context.type === 'section' && context.projectId && context.sectionId) {
                    const project = this.stateManager.getProject(context.projectId);
                    const section = project?.sections.find(s => s.sectionId === context.sectionId);
                    if (section) {
                        // Reset to default modifiers for this step
                        const pipelineConfig = window.PipelineConfig;
                        if (pipelineConfig) {
                            const caseConfig = pipelineConfig.getCase(project.case || 1);
                            const stepConfig = caseConfig?.workflow?.[section.stepName || section.sectionId];
                            const defaultModifiers = stepConfig?.modifiers || [];
                            await this.overrideModifiers(context.projectId, context.sectionId, defaultModifiers);
                            this.renderingEngine.renderAll();
                        }
                    }
                }
                break;
            case 'invoke-validation-loop':
                if (context.type === 'section' && context.projectId && context.sectionId) {
                    await this.invokeProcessStep(context.projectId, context.sectionId, 'validation-loop');
                }
                break;
            case 'invoke-refinement-loop':
                if (context.type === 'section' && context.projectId && context.sectionId) {
                    await this.invokeProcessStep(context.projectId, context.sectionId, 'refinement-loop');
                }
                break;
            case 'invoke-integration-loop':
                if (context.type === 'section' && context.projectId && context.sectionId) {
                    await this.invokeProcessStep(context.projectId, context.sectionId, 'integration-loop');
                }
                break;
            case 'view-process-step-results':
                if (context.type === 'section' && context.projectId && context.sectionId) {
                    const project = this.stateManager.getProject(context.projectId);
                    const section = project?.sections.find(s => s.sectionId === context.sectionId);
                    if (section && section.output) {
                        const panel = document.getElementById('process-step-results-panel');
                        const content = document.getElementById('process-step-results-content');
                        if (panel && content) {
                            content.textContent = section.output;
                            panel.style.display = 'flex';
                        }
                    }
                }
                break;
            // Legacy actions
            case 'edit':
                if (context.type === 'element') {
                    this.showEditModal(context.pageId, context.elementIndex);
                }
                break;
            case 'edit-page':
                if (context.type === 'page') {
                    // Make page title editable
                    const pageEl = document.querySelector(`[data-page-id="${context.pageId}"]`);
                    if (pageEl) {
                        const titleEl = pageEl.querySelector('.page-title');
                        if (titleEl) {
                            titleEl.contentEditable = 'true';
                            titleEl.focus();
                            const range = document.createRange();
                            range.selectNodeContents(titleEl);
                            const selection = window.getSelection();
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                    }
                }
                break;
            case 'add-element':
                this.showAddElementModal(context.pageId || context.pageId);
                break;
            case 'delete':
                if (context.type === 'element') {
                    if (confirm('Delete this element?')) {
                        this.stateManager.removeElement(context.pageId, context.elementIndex);
                    }
                }
                break;
            case 'delete-page':
                if (context.type === 'page') {
                    if (confirm('Delete this page?')) {
                        this.stateManager.removePage(context.pageId);
                    }
                }
                break;
            case 'add-page':
                this.addPage();
                break;
            case 'collapse-page':
                if (context.type === 'page') {
                    const state = this.stateManager.getState();
                    const isExpanded = state.pageStates[context.pageId] !== false;
                    this.stateManager.setPageCollapsed(context.pageId, isExpanded);
                }
                break;
            case 'collapse-all':
                const state = this.stateManager.getState();
                state.pages.forEach(page => {
                    if (state.pageStates[page.id] !== false) {
                        this.stateManager.setPageCollapsed(page.id, true);
                    }
                });
                break;
            case 'view-data':
                // Show data view modal
                this.showDataViewModal(context);
                break;
        }
    }
    
    // Handle keyboard shortcuts
    handleKeyboardShortcut(data) {
        if (data.action === 'add-element') {
            const element = this.createDefaultElement(data.elementType);
            this.stateManager.addElement(data.pageId, element);
        } else if (data.action === 'show-add-element-modal') {
            this.showAddElementModal(data.pageId);
        }
    }
    
    // Handle modal save
    handleModalSave(type, data) {
        // Modal save handling would be implemented here
        // For now, this is a placeholder
    }
    
    // Add page
    addPage() {
        const pageNum = this.stateManager.getState().pages.length + 1;
        const page = {
            id: `page-${pageNum}`,
            title: `Page ${pageNum}`,
            elements: []
        };
        this.stateManager.addPage(page);
    }
    
    // Delete page
    deletePage(pageId) {
        if (confirm('Delete this page?')) {
            this.stateManager.removePage(pageId);
        }
    }
    
    // Show edit modal
    showEditModal(pageId, elementIndex) {
        this.renderEditModal(pageId, elementIndex);
    }
    
    // Show add element modal
    showAddElementModal(pageId) {
        this.renderAddElementModal(pageId);
    }
    
    // Render add element modal
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
        
        modalBody.innerHTML = `
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
                <button class="cancel" onclick="window.app.closeModal()">Cancel</button>
            </div>
        `;
        
        modal.classList.add('active');
        
        // Track element count for drag functionality
        let elementCount = 1;
        const countDisplay = document.createElement('div');
        countDisplay.id = 'element-count-display';
        countDisplay.style.cssText = 'position: absolute; top: 10px; left: 50%; transform: translateX(-50%); font-size: 36px; font-weight: bold; color: #4a9eff; pointer-events: none; user-select: none; display: none; z-index: 2001; text-shadow: 0 2px 8px rgba(0,0,0,0.8); background: rgba(45, 45, 45, 0.95); padding: 8px 16px; border-radius: 8px; border: 2px solid #4a9eff; min-width: 60px; text-align: center;';
        countDisplay.textContent = '1';
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.insertBefore(countDisplay, modalContent.firstChild);
        }
        
        // Click handler for numbered options
        const handleOptionClick = (type, count = 1) => {
            this.closeModal();
            
            const state = this.stateManager.getState();
            const page = state.pages.find(p => p.id === pageId);
            if (!page) return;
            
            let firstElementIndex = null;
            let firstElement = null;
            let currentInsertIndex = elementIndex;
            
            // Add multiple elements
            if (elementIndex !== null && elementIndex >= 0) {
                // Add after the specified element
                for (let i = 0; i < count; i++) {
                    const newElement = this.createDefaultElement(type);
                    const insertIndex = currentInsertIndex + 1;
                    const updatedElements = [...page.elements];
                    updatedElements.splice(insertIndex, 0, newElement);
                    this.stateManager.updatePage(pageId, { elements: updatedElements });
                    if (i === 0) {
                        firstElementIndex = insertIndex;
                        firstElement = newElement;
                    }
                    currentInsertIndex++;
                }
            } else {
                // Add at the end
                const startIndex = page.elements.length;
                for (let i = 0; i < count; i++) {
                    const newElement = this.createDefaultElement(type);
                    this.stateManager.addElement(pageId, newElement);
                    if (i === 0) {
                        firstElementIndex = startIndex + i;
                        firstElement = newElement;
                    }
                }
            }
            
            // Open edit modal for the first element
            if (firstElementIndex !== null && firstElement) {
                setTimeout(() => {
                    this.renderEditModal(pageId, firstElementIndex);
                    setTimeout(() => {
                        const textInput = document.getElementById('edit-text');
                        if (textInput) {
                            textInput.focus();
                            textInput.select();
                        }
                    }, 50);
                }, 50);
            }
        };
        
        // Drag state tracking
        let dragState = {
            active: false,
            startX: 0,
            startCount: 1,
            currentType: null,
            pixelsPerElement: 20
        };
        
        // Global mouse move handler for dragging
        const globalMouseMove = (e) => {
            if (!dragState.active) return;
            const deltaX = e.clientX - dragState.startX;
            const countChange = Math.round(deltaX / dragState.pixelsPerElement);
            const newCount = Math.max(1, Math.min(10, dragState.startCount + countChange));
            if (newCount !== elementCount) {
                elementCount = newCount;
                countDisplay.textContent = elementCount;
            }
        };
        
        // Global mouse up handler for dragging
        const globalMouseUp = (e) => {
            if (!dragState.active) return;
            const wasDragging = Math.abs(e.clientX - dragState.startX) > 5;
            const type = dragState.currentType;
            const finalCount = elementCount;
            dragState.active = false;
            countDisplay.style.display = 'none';
            elementCount = 1;
            document.removeEventListener('mousemove', globalMouseMove);
            document.removeEventListener('mouseup', globalMouseUp);
            if (type && types[Object.keys(types).find(k => types[k] === type)]) {
                handleOptionClick(type, wasDragging ? finalCount : 1);
            }
        };
        
        // Add click and drag listeners to numbered options
        modalBody.querySelectorAll('.element-type-option').forEach(option => {
            option.addEventListener('mousedown', (e) => {
                const type = option.dataset.type;
                if (!type) return;
                dragState.active = true;
                dragState.startX = e.clientX;
                dragState.startCount = 1;
                dragState.currentType = type;
                elementCount = 1;
                countDisplay.style.display = 'block';
                document.addEventListener('mousemove', globalMouseMove);
                document.addEventListener('mouseup', globalMouseUp);
            });
            
            option.addEventListener('click', (e) => {
                if (dragState.active) {
                    e.preventDefault();
                    return;
                }
                const type = option.dataset.type;
                if (type) {
                    handleOptionClick(type, 1);
                }
            });
        });
        
        // Keyboard handler for number keys
        const keyHandler = (e) => {
            if (e.key in types) {
                e.preventDefault();
                handleOptionClick(types[e.key], 1);
            } else if (e.key === 'Escape') {
                this.closeModal();
            }
        };
        document.addEventListener('keydown', keyHandler);
        
        // Store cleanup
        this._addElementModalCleanup = () => {
            document.removeEventListener('keydown', keyHandler);
            document.removeEventListener('mousemove', globalMouseMove);
            document.removeEventListener('mouseup', globalMouseUp);
            if (countDisplay && countDisplay.parentNode) {
                countDisplay.remove();
            }
        };
    }
    
    // Render edit modal
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
        
        // Time allocated
        html += `
            <label>Time Allocated:</label>
            <input type="text" id="edit-time" value="${this.escapeHtml(element.timeAllocated || '')}" 
                   placeholder="e.g., 30 min+ or 20 min" />
        `;
        
        // Fun modifier (only for elements that support it)
        if (element.type !== 'header') {
            html += `
                <label>Fun Modifier:</label>
                <textarea id="edit-fun" placeholder="How to make this task fun">${this.escapeHtml(element.funModifier || '')}</textarea>
            `;
        }
        
        // Repeats checkbox (only for elements that can repeat)
        if (element.type !== 'header') {
            html += `
                <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px; font-size: 14px; font-weight: normal;">
                    <input type="checkbox" id="edit-repeats" ${element.repeats !== false ? 'checked' : ''} style="width: auto; margin: 0;" />
                    <span>Reset daily (repeating task)</span>
                </label>
            `;
        }
        
        // For tasks, show subtask editor
        if (element.type === 'task' || element.type === 'header-checkbox') {
            if (!element.subtasks) {
                element.subtasks = [];
            }
            html += `<label style="margin-top: 15px;">Subtasks:</label>`;
            html += `<div id="edit-subtasks-in-modal" class="edit-subtasks-container">`;
            if (element.subtasks.length > 0) {
                element.subtasks.forEach((subtask, idx) => {
                    html += `
                        <div class="subtask-item">
                            <input type="text" class="edit-subtask-text-modal" data-index="${idx}" 
                                   value="${this.escapeHtml(subtask.text)}" placeholder="Subtask text" />
                            <input type="text" class="edit-subtask-time-modal" data-index="${idx}" 
                                   value="${this.escapeHtml(subtask.timeAllocated || '')}" placeholder="Time" />
                            <label class="edit-subtask-repeat-label">
                                <input type="checkbox" class="edit-subtask-repeats-modal" data-index="${idx}" 
                                       ${subtask.repeats !== false ? 'checked' : ''} />
                                Repeats
                            </label>
                            <button onclick="window.app.removeEditSubtaskModal(${idx})" class="remove-subtask-btn">×</button>
                        </div>
                    `;
                });
            }
            html += `</div>`;
            html += `
                <div class="subtask-modal-actions">
                    <button onclick="window.app.addEditSubtaskModal()" class="add-subtask-btn">+ Add Subtask</button>
                    ${element.subtasks.length > 0 ? `<button onclick="window.app.removeAllSubtasksModal()" class="remove-all-subtasks-btn">Remove All Subtasks</button>` : ''}
                </div>
            `;
        }
        
        // For multi-checkbox, show items editor
        if (element.type === 'multi-checkbox' && element.items) {
            html += `<label style="margin-top: 15px;">Items:</label>`;
            html += `<div id="edit-items">`;
            element.items.forEach((item, idx) => {
                html += `
                    <div class="subtask-item">
                        <input type="text" class="edit-item-text" data-index="${idx}" 
                               value="${this.escapeHtml(item.text)}" />
                        <input type="text" class="edit-item-fun" data-index="${idx}" 
                               value="${this.escapeHtml(item.funModifier || '')}" placeholder="Fun modifier" />
                        <button onclick="window.app.removeEditItem(${idx})">×</button>
                    </div>
                `;
            });
            html += `</div>`;
            html += `<button onclick="window.app.addEditItem()" style="margin-top: 10px;">+ Add Item</button>`;
        }
        
        html += `
            <div style="margin-top: 20px;">
                <button onclick="window.app.saveEdit('${pageId}', ${elementIndex})">Save</button>
                <button class="cancel" onclick="window.app.closeModal()">Cancel</button>
            </div>
        `;
        
        modalBody.innerHTML = html;
        modal.classList.add('active');
        
        // Store current editing state
        this.currentEdit = {
            pageId: pageId,
            elementIndex: elementIndex,
            itemCount: element.items ? element.items.length : 0,
            elementType: element.type
        };
    }
    
    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Close modal
    closeModal() {
        if (this._addElementModalCleanup) {
            this._addElementModalCleanup();
            this._addElementModalCleanup = null;
        }
        this.modalSystem.closeModal();
        this.currentEdit = null;
    }
    
    // Save edit
    saveEdit(pageId, elementIndex, skipClose = false) {
        if (!this.currentEdit) return;
        
        const element = this.stateManager.getElement(pageId, elementIndex);
        if (!element) return;
        
        const updates = {};
        
        // Get text (if applicable)
        if (element.type === 'task' || element.type === 'header' || element.type === 'header-checkbox') {
            const textInput = document.getElementById('edit-text');
            if (textInput) {
                updates.text = textInput.value.trim();
            }
        }
        
        // Get time allocated
        const timeInput = document.getElementById('edit-time');
        if (timeInput) {
            updates.timeAllocated = timeInput.value.trim();
        }
        
        // Get fun modifier
        if (element.type !== 'header') {
            const funInput = document.getElementById('edit-fun');
            if (funInput) {
                updates.funModifier = funInput.value.trim();
            }
        }
        
        // Get repeats
        if (element.type !== 'header') {
            const repeatsInput = document.getElementById('edit-repeats');
            if (repeatsInput) {
                updates.repeats = repeatsInput.checked;
            }
        }
        
        // Get subtasks
        if (element.type === 'task' || element.type === 'header-checkbox') {
            const subtaskTexts = Array.from(document.querySelectorAll('.edit-subtask-text-modal'));
            const subtaskTimes = Array.from(document.querySelectorAll('.edit-subtask-time-modal'));
            const subtaskRepeats = Array.from(document.querySelectorAll('.edit-subtask-repeats-modal'));
            
            const subtasks = subtaskTexts.map((textInput, idx) => ({
                text: textInput.value.trim(),
                timeAllocated: subtaskTimes[idx] ? subtaskTimes[idx].value.trim() : '',
                repeats: subtaskRepeats[idx] ? subtaskRepeats[idx].checked : true,
                completed: element.subtasks && element.subtasks[idx] ? element.subtasks[idx].completed : false
            }));
            
            updates.subtasks = subtasks;
        }
        
        // Get multi-checkbox items
        if (element.type === 'multi-checkbox') {
            const itemTexts = Array.from(document.querySelectorAll('.edit-item-text'));
            const itemFuns = Array.from(document.querySelectorAll('.edit-item-fun'));
            
            const items = itemTexts.map((textInput, idx) => ({
                text: textInput.value.trim(),
                funModifier: itemFuns[idx] ? itemFuns[idx].value.trim() : '',
                completed: element.items && element.items[idx] ? element.items[idx].completed : false
            }));
            
            updates.items = items;
        }
        
        // Update element
        this.stateManager.updateElement(pageId, elementIndex, updates);
        
        if (!skipClose) {
            this.closeModal();
        }
    }
    
    // Add edit subtask
    addEditSubtaskModal() {
        if (!this.currentEdit) return;
        const element = this.stateManager.getElement(this.currentEdit.pageId, this.currentEdit.elementIndex);
        if (!element || !element.subtasks) return;
        
        element.subtasks.push({ text: '', timeAllocated: '', repeats: true, completed: false });
        this.renderEditModal(this.currentEdit.pageId, this.currentEdit.elementIndex);
    }
    
    // Remove edit subtask
    removeEditSubtaskModal(index) {
        if (!this.currentEdit) return;
        const element = this.stateManager.getElement(this.currentEdit.pageId, this.currentEdit.elementIndex);
        if (!element || !element.subtasks) return;
        
        element.subtasks.splice(index, 1);
        this.renderEditModal(this.currentEdit.pageId, this.currentEdit.elementIndex);
    }
    
    // Remove all subtasks
    removeAllSubtasksModal() {
        if (!this.currentEdit) return;
        const element = this.stateManager.getElement(this.currentEdit.pageId, this.currentEdit.elementIndex);
        if (!element || !element.subtasks) return;
        
        element.subtasks = [];
        this.renderEditModal(this.currentEdit.pageId, this.currentEdit.elementIndex);
    }
    
    // Add edit item
    addEditItem() {
        if (!this.currentEdit) return;
        const element = this.stateManager.getElement(this.currentEdit.pageId, this.currentEdit.elementIndex);
        if (!element || !element.items) return;
        
        element.items.push({ text: '', funModifier: '', completed: false });
        this.renderEditModal(this.currentEdit.pageId, this.currentEdit.elementIndex);
    }
    
    // Remove edit item
    removeEditItem(index) {
        if (!this.currentEdit) return;
        const element = this.stateManager.getElement(this.currentEdit.pageId, this.currentEdit.elementIndex);
        if (!element || !element.items || element.items.length <= 1) return;
        
        element.items.splice(index, 1);
        this.renderEditModal(this.currentEdit.pageId, this.currentEdit.elementIndex);
    }
    
    // Show settings modal with content
    showSettingsModal() {
        const modal = document.getElementById('settings-modal');
        const settingsBody = document.getElementById('settings-body');
        if (!modal || !settingsBody) return;
        
        const state = this.stateManager.getState();
        const settings = state.settings || this.stateManager.getDefaultSettings();
        
        let html = '<h3 style="margin-bottom: 20px; color: #ffffff;">Settings</h3>';
        
        // Background Section
        html += '<div class="settings-section">';
        html += '<div class="settings-section-title" data-collapse-target="settings-content-0">';
        html += '<span class="settings-toggle-arrow">▶</span>';
        html += '<span>Background</span>';
        html += '</div>';
        html += '<div class="settings-section-content" id="settings-content-0" style="display: none;">';
        html += '<div class="settings-subsection">';
        html += this.createColorControl('background', 'Background Color', settings.background);
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        // Page Section
        html += '<div class="settings-section">';
        html += '<div class="settings-section-title" data-collapse-target="settings-content-1">';
        html += '<span class="settings-toggle-arrow">▶</span>';
        html += '<span>Page Styles</span>';
        html += '</div>';
        html += '<div class="settings-section-content" id="settings-content-1" style="display: none;">';
        html += '<div class="settings-subsection">';
        html += this.createColorControl('page.background', 'Background Color', (settings.page && settings.page.background) || '#2d2d2d');
        html += this.createSliderControl('page.margin', 'Margin', (settings.page && settings.page.margin) || '0px', 0, 50, 1, 'px');
        html += this.createSliderControl('page.padding', 'Padding', (settings.page && settings.page.padding) || '20px', 0, 50, 1, 'px');
        html += this.createSliderControl('page.borderRadius', 'Border Radius', (settings.page && settings.page.borderRadius) || '8px', 0, 30, 1, 'px');
        html += this.createTextControl('page.fontFamily', 'Font Family', (settings.page && settings.page.fontFamily) || '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif');
        html += this.createSliderControl('page.fontSize', 'Font Size', (settings.page && settings.page.fontSize) || '14px', 8, 32, 1, 'px');
        html += this.createOpacityControl('page.opacity', 'Opacity', (settings.page && settings.page.opacity) || '1');
        html += this.createColorControl('page.color', 'Text Color', (settings.page && settings.page.color) || '#e0e0e0');
        html += '</div>';
        html += '<div class="settings-subsection">';
        html += '<div class="settings-subsection-title" data-collapse-target="settings-subcontent-1">';
        html += '<span class="settings-toggle-arrow">▶</span>';
        html += '<span>Page Title</span>';
        html += '</div>';
        html += '<div class="settings-subsection-content" id="settings-subcontent-1" style="display: none;">';
        html += this.createSliderControl('page.titleFontSize', 'Font Size', (settings.page && settings.page.titleFontSize) || '18px', 8, 48, 1, 'px');
        html += this.createColorControl('page.titleColor', 'Color', (settings.page && settings.page.titleColor) || '#ffffff');
        html += this.createSliderControl('page.titleMarginBottom', 'Margin Bottom', (settings.page && settings.page.titleMarginBottom) || '15px', 0, 50, 1, 'px');
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        // Element Section
        html += '<div class="settings-section">';
        html += '<div class="settings-section-title" data-collapse-target="settings-content-2">';
        html += '<span class="settings-toggle-arrow">▶</span>';
        html += '<span>Element Styles</span>';
        html += '</div>';
        html += '<div class="settings-section-content" id="settings-content-2" style="display: none;">';
        html += '<div class="settings-subsection">';
        const elementBg = (settings.element && settings.element.bg) || '#2d2d2d';
        html += this.createColorControl('element.bg', 'Background Color', elementBg === 'transparent' ? '#2d2d2d' : elementBg);
        html += this.createSliderControl('element.margin', 'Margin', (settings.element && settings.element.margin) || '0px', 0, 30, 1, 'px');
        html += this.createSliderControl('element.padding', 'Padding', (settings.element && settings.element.padding) || '10px', 0, 30, 1, 'px');
        html += this.createTextControl('element.fontFamily', 'Font Family', (settings.element && settings.element.fontFamily) || '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif');
        html += this.createSliderControl('element.fontSize', 'Font Size', (settings.element && settings.element.fontSize) || '14px', 8, 32, 1, 'px');
        html += this.createOpacityControl('element.opacity', 'Opacity', (settings.element && settings.element.opacity) || '1');
        html += this.createColorControl('element.color', 'Text Color', (settings.element && settings.element.color) || '#e0e0e0');
        html += this.createColorControl('element.hoverBg', 'Hover Background', (settings.element && settings.element.hoverBg) || '#363636');
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        // Header Section
        html += '<div class="settings-section">';
        html += '<div class="settings-section-title" data-collapse-target="settings-content-3">';
        html += '<span class="settings-toggle-arrow">▶</span>';
        html += '<span>Header Element Styles</span>';
        html += '</div>';
        html += '<div class="settings-section-content" id="settings-content-3" style="display: none;">';
        html += '<div class="settings-subsection">';
        html += this.createSliderControl('header.fontSize', 'Font Size', (settings.header && settings.header.fontSize) || '16px', 8, 48, 1, 'px');
        html += this.createColorControl('header.color', 'Color', (settings.header && settings.header.color) || '#b8b8b8');
        html += this.createTextControl('header.margin', 'Margin', (settings.header && settings.header.margin) || '10px 0');
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        // Checkbox Section
        html += '<div class="settings-section">';
        html += '<div class="settings-section-title" data-collapse-target="settings-content-4">';
        html += '<span class="settings-toggle-arrow">▶</span>';
        html += '<span>Checkbox Styles</span>';
        html += '</div>';
        html += '<div class="settings-section-content" id="settings-content-4" style="display: none;">';
        html += '<div class="settings-subsection">';
        html += this.createSliderControl('checkboxSize', 'Size', settings.checkboxSize || '18px', 10, 30, 1, 'px');
        html += '</div>';
        html += '</div>';
        html += '</div>';
        
        html += '<button class="settings-reset-btn" id="settings-reset">Reset to Defaults</button>';
        
        settingsBody.innerHTML = html;
        
        // Add event listeners to all controls
        settingsBody.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', (e) => {
                const path = e.target.dataset.settingPath;
                let value;
                if (e.target.type === 'color') {
                    value = e.target.value;
                } else if (e.target.type === 'range') {
                    if (path.includes('opacity')) {
                        value = (parseFloat(e.target.value) / 100).toFixed(2);
                    } else {
                        const numValue = parseFloat(e.target.value);
                        if (!isNaN(numValue) && (path.includes('Size') || path.includes('margin') || path.includes('padding') || path.includes('borderRadius') || path.includes('size'))) {
                            value = numValue + 'px';
                        } else {
                            value = e.target.value;
                        }
                    }
                } else if (e.target.type === 'number') {
                    if (path.includes('opacity')) {
                        value = (parseFloat(e.target.value) / 100).toFixed(2);
                    } else {
                        const numValue = parseFloat(e.target.value);
                        if (!isNaN(numValue) && (path.includes('Size') || path.includes('margin') || path.includes('padding') || path.includes('borderRadius') || path.includes('size'))) {
                            value = numValue + 'px';
                        } else {
                            value = e.target.value;
                        }
                    }
                } else {
                    value = e.target.value;
                }
                this.updateSetting(path, value);
            });
        });
        
        // Add collapse/expand functionality to section titles
        settingsBody.querySelectorAll('.settings-section-title').forEach(title => {
            title.style.cursor = 'pointer';
            title.addEventListener('click', () => {
                const targetId = title.dataset.collapseTarget;
                const content = document.getElementById(targetId);
                const arrow = title.querySelector('.settings-toggle-arrow');
                if (content) {
                    const isCollapsed = content.style.display === 'none';
                    content.style.display = isCollapsed ? 'block' : 'none';
                    arrow.textContent = isCollapsed ? '▼' : '▶';
                }
            });
        });
        
        // Add collapse/expand functionality to subsection titles
        settingsBody.querySelectorAll('.settings-subsection-title[data-collapse-target]').forEach(title => {
            title.style.cursor = 'pointer';
            title.addEventListener('click', () => {
                const targetId = title.dataset.collapseTarget;
                const content = document.getElementById(targetId);
                const arrow = title.querySelector('.settings-toggle-arrow');
                if (content) {
                    const isCollapsed = content.style.display === 'none';
                    content.style.display = isCollapsed ? 'block' : 'none';
                    arrow.textContent = isCollapsed ? '▼' : '▶';
                }
            });
        });
        
        this.modalSystem.openSettingsModal();
    }
    
    // Create color control
    createColorControl(path, label, value) {
        // Convert "transparent" to a valid hex color for color input
        const colorValue = (value === 'transparent' || !value) ? '#2d2d2d' : value;
        return `
            <div class="settings-control">
                <label>${label}:</label>
                <div class="settings-control-row">
                    <input type="color" data-setting-path="${path}" value="${colorValue}">
                    <input type="text" data-setting-path="${path}" value="${value || 'transparent'}" style="flex: 1;" placeholder="transparent or #hex">
                </div>
            </div>
        `;
    }
    
    // Create text control
    createTextControl(path, label, value) {
        return `
            <div class="settings-control">
                <label>${label}:</label>
                <input type="text" data-setting-path="${path}" value="${value}">
            </div>
        `;
    }
    
    // Create slider control
    createSliderControl(path, label, value, min = 0, max = 100, step = 1, unit = 'px') {
        const numValue = parseFloat(value) || 0;
        return `
            <div class="settings-control">
                <label>${label}:</label>
                <div class="settings-control-row">
                    <input type="range" min="${min}" max="${max}" step="${step}" data-setting-path="${path}" value="${numValue}">
                    <input type="number" min="${min}" max="${max}" step="${step}" data-setting-path="${path}" value="${numValue}" style="width: 80px;">
                    <span style="color: #888; min-width: 30px;">${unit}</span>
                </div>
            </div>
        `;
    }
    
    // Create opacity control
    createOpacityControl(path, label, value) {
        const numValue = parseFloat(value) * 100;
        return `
            <div class="settings-control">
                <label>${label}:</label>
                <div class="settings-control-row">
                    <input type="range" min="0" max="100" step="1" data-setting-path="${path}" value="${numValue}">
                    <input type="number" min="0" max="100" step="1" data-setting-path="${path}" value="${numValue}" style="width: 80px;">
                </div>
            </div>
        `;
    }
    
    // Update setting
    updateSetting(path, value) {
        const state = this.stateManager.getState();
        const settings = { ...state.settings };
        const keys = path.split('.');
        let obj = settings;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]]) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        
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
        
        this.stateManager.updateSettings(settings);
        this.applySettings(settings);
    }
    
    // Apply settings to CSS
    applySettings(settings) {
        const root = document.documentElement;
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
        root.style.setProperty('--checkbox-size', settings.checkboxSize || '18px');
    }
    
    // Show data view modal
    showDataViewModal(context) {
        let data = null;
        if (context.type === 'element') {
            data = this.stateManager.getElement(context.pageId, context.elementIndex);
        } else if (context.type === 'page') {
            data = this.stateManager.getPage(context.pageId);
        }
        
        if (data) {
            this.modalSystem.openModal('view-data', {
                data: data,
                context: context
            });
        }
    }
    
    // Create default element
    createDefaultElement(type) {
        const element = {
            type: type,
            text: '',
            completed: false,
            repeats: type !== 'one-time',
            timeAllocated: '',
            funModifier: ''
        };
        
        if (type === 'task' || type === 'header-checkbox') {
            element.subtasks = [];
        }
        
        if (type === 'multi-checkbox') {
            element.items = [{ text: '', completed: false, funModifier: '' }];
        }
        
        return element;
    }
    
    // Toggle element completion (for backward compatibility with inline handlers)
    toggleElement(pageId, elementIndex, subtaskIndex = null, itemIndex = null) {
        if (subtaskIndex !== null) {
            // Toggle subtask - would need state manager support
            const element = this.stateManager.getElement(pageId, elementIndex);
            if (element && element.subtasks && element.subtasks[subtaskIndex]) {
                const subtask = element.subtasks[subtaskIndex];
                subtask.completed = !subtask.completed;
                this.stateManager.updateElement(pageId, elementIndex, {
                    subtasks: element.subtasks
                });
            }
        } else if (itemIndex !== null) {
            // Toggle multi-checkbox item
            const element = this.stateManager.getElement(pageId, elementIndex);
            if (element && element.items && element.items[itemIndex]) {
                const item = element.items[itemIndex];
                item.completed = !item.completed;
                this.stateManager.updateElement(pageId, elementIndex, {
                    items: element.items
                });
            }
        } else {
            // Toggle main element
            this.stateManager.toggleElementCompletion(pageId, elementIndex);
        }
    }
    
    // Add multi-checkbox item (for backward compatibility)
    addMultiCheckboxItem(pageId, elementIndex) {
        const element = this.stateManager.getElement(pageId, elementIndex);
        if (element && element.items) {
            element.items.push({ text: '', completed: false, funModifier: '' });
            this.stateManager.updateElement(pageId, elementIndex, {
                items: element.items
            });
        }
    }
    
    // Remove multi-checkbox item (for backward compatibility)
    removeMultiCheckboxItem(pageId, elementIndex, itemIndex) {
        const element = this.stateManager.getElement(pageId, elementIndex);
        if (element && element.items && element.items.length > 1) {
            element.items.splice(itemIndex, 1);
            this.stateManager.updateElement(pageId, elementIndex, {
                items: element.items
            });
        }
    }
    
    // Toggle multi-checkbox item (for backward compatibility)
    toggleMultiCheckboxItem(pageId, elementIndex, itemIndex) {
        this.toggleElement(pageId, elementIndex, null, itemIndex);
    }
    
    // ============================================
    // Section Management Methods (Phase 9)
    // ============================================
    
    // Create a new project
    async createProject(name, description, caseNumber = 1, caseChain = null, customWorkflow = false, automationEngine = 'file-watching') {
        // If workflowType is provided (legacy), convert to case number
        if (typeof caseNumber === 'string' && (caseNumber === 'full' || caseNumber === 'ux-only')) {
            // Legacy support: convert workflowType to case
            caseNumber = caseNumber === 'ux-only' ? 2 : 1;
        }
        
        const project = await this.stateManager.createProject(name, description, caseNumber, caseChain, customWorkflow, automationEngine);
        
        // Add inference steps for Case 2
        if (caseNumber === 2) {
            await this.addInferenceSteps(project.id);
        }
        
        // Load prompts for all sections
        await this.loadPromptsForProject(project.id);
        
        return project;
    }
    
    // Remove Input Guidance section from prompt text
    removeInputGuidanceFromPrompt(prompt) {
        if (!prompt) return prompt;
        
        // Remove Input Guidance section - it's between --- separators and ends with ---
        // Pattern: ---\n\n## Input Guidance\n\n...content...\n\n---
        // This matches the entire section including the separators
        prompt = prompt.replace(/---\s*\n\s*\n\s*## Input Guidance\s*\n\s*\n[\s\S]*?\n\s*\n\s*---/g, '');
        
        // Also handle case where Input Guidance might not have --- before it
        prompt = prompt.replace(/\n\s*## Input Guidance\s*\n\s*\n[\s\S]*?(?=\n\s*---|\n\s*## |$)/g, '');
        
        // Handle case where Input Guidance is at the very end
        prompt = prompt.replace(/## Input Guidance\s*\n\s*\n[\s\S]*$/g, '');
        
        // Clean up any double newlines or trailing separators
        prompt = prompt.replace(/\n\n\n+/g, '\n\n');
        prompt = prompt.replace(/---\s*\n\s*---/g, '---');
        // Remove leading/trailing whitespace and clean up
        prompt = prompt.trim();
        
        return prompt;
    }
    
    // Load prompts for all sections in a project
    async loadPromptsForProject(projectId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        const promptLoader = window.PromptLoader;
        if (!promptLoader) return;
        
        // Ensure all sections have automation IDs
        for (const section of project.sections) {
            if (!section.automationId) {
                const defaultId = this.generateDefaultAutomationId(projectId, section.sectionId);
                this.stateManager.updateSection(projectId, section.sectionId, { automationId: defaultId });
                section.automationId = defaultId; // Update local reference
            }
        }
        
        // Extract suggested directory from first section if not set
        if (!project.automationDirectory && project.sections.length > 0) {
            await this.extractSuggestedDirectory(projectId, project.sections[0].sectionId);
            // Re-fetch project after potential update
            const updatedProject = this.stateManager.getProject(projectId);
            if (updatedProject) {
                project.automationDirectory = updatedProject.automationDirectory;
            }
        }
        
        for (const section of project.sections) {
            try {
                // Get prompt with modifier injection and variable substitution
                let prompt = await promptLoader.getPrompt(
                    section.sectionId,
                    section,
                    project
                );
                
                if (prompt) {
                    // Remove Input Guidance section from the prompt
                    // This section is now shown in a popup via the "?" button
                    const originalLength = prompt.length;
                    prompt = this.removeInputGuidanceFromPrompt(prompt);
                    
                    // Always update to ensure Input Guidance is removed (even if already removed)
                    // This handles cases where prompts were loaded before this feature was added
                    this.stateManager.updateSection(projectId, section.sectionId, { prompt });
                    
                    // Log removed input guidance only in debug mode (suppress normal console output)
                    // Uncomment the line below if you need to debug input guidance removal
                    // if (prompt.length !== originalLength) {
                    //     console.log(`Removed Input Guidance from ${section.sectionId}: ${originalLength - prompt.length} chars`);
                    // }
                }
            } catch (error) {
                console.warn(`Failed to load prompt for section ${section.sectionId}:`, error);
            }
        }
    }
    
    // Check if section dependencies are met
    checkDependencies(projectId, sectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return { met: false, missing: [] };
        
        const config = window.PipelineConfig;
        if (!config) return { met: true, missing: [] };
        
        return config.checkDependencies(sectionId, project.sections);
    }
    
    // Open modal to select previous section output
    pasteFromPreviousSection(projectId, sectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        // Find current section index
        const currentIndex = project.sections.findIndex(s => s.sectionId === sectionId);
        if (currentIndex === -1) return;
        
        // Get all previous sections with outputs
        const previousSections = project.sections
            .slice(0, currentIndex)
            .filter(s => s.output && s.output.trim().length > 0)
            .map((s, idx) => ({
                sectionId: s.sectionId,
                sectionName: s.sectionName || s.stepName || s.sectionId,
                output: s.output,
                index: idx,
                status: s.status
            }));
        
        if (previousSections.length === 0) {
            alert('No previous steps with output available.');
            return;
        }
        
        // Open modal
        this.openPreviousStepModal(projectId, sectionId, previousSections);
    }
    
    // Open previous step selection modal
    openPreviousStepModal(projectId, sectionId, previousSections) {
        const modal = document.getElementById('previous-step-modal');
        const listContainer = document.getElementById('previous-steps-list');
        const pasteBtn = document.getElementById('previous-step-paste');
        let selectedSectionId = null;
        
        if (!modal || !listContainer) return;
        
        // Clear previous content
        listContainer.innerHTML = '';
        pasteBtn.disabled = true;
        selectedSectionId = null;
        
        // Populate list
        previousSections.forEach((section, idx) => {
            const outputPreview = section.output.length > 200 
                ? section.output.substring(0, 200) + '...' 
                : section.output;
            
            const item = document.createElement('div');
            item.className = 'previous-step-item';
            item.style.cssText = 'padding: 12px; margin-bottom: 8px; border: 2px solid #404040; border-radius: 4px; cursor: pointer; background: #252525; transition: all 0.2s;';
            item.dataset.sectionId = section.sectionId;
            
            item.innerHTML = `
                <div style="font-weight: 600; color: #e0e0e0; margin-bottom: 4px;">${this.escapeHtml(section.sectionName)}</div>
                <div style="font-size: 0.85em; color: #888; margin-bottom: 6px;">Status: ${section.status || 'unknown'}</div>
                <div style="font-size: 0.9em; color: #aaa; line-height: 1.4; max-height: 60px; overflow: hidden;">${this.escapeHtml(outputPreview)}</div>
            `;
            
            // Add click handler - highlight on click
            item.addEventListener('click', () => {
                // Update selected state
                selectedSectionId = section.sectionId;
                pasteBtn.disabled = false;
                
                // Update visual selection - remove highlight from all, add to clicked item
                document.querySelectorAll('.previous-step-item').forEach(el => {
                    el.style.borderColor = '#404040';
                    el.style.background = '#252525';
                });
                item.style.borderColor = '#4a9eff';
                item.style.background = '#1a3a5a';
            });
            
            listContainer.appendChild(item);
        });
        
        // Show modal
        modal.classList.add('active');
        
        // Handle cancel
        const handleCancel = () => {
            modal.classList.remove('active');
            selectedSectionId = null;
        };
        
        document.getElementById('previous-step-close').onclick = handleCancel;
        document.getElementById('previous-step-cancel').onclick = handleCancel;
        modal.querySelector('.modal-backdrop').onclick = handleCancel;
        
        // Handle paste
        pasteBtn.onclick = () => {
            if (!selectedSectionId) return;
            
            const selectedSection = previousSections.find(s => s.sectionId === selectedSectionId);
            if (selectedSection) {
                this.stateManager.updateSection(projectId, sectionId, {
                    input: selectedSection.output,
                    status: "in_progress"
                });
                
                // Refresh the UI
                this.renderingEngine.renderAll();
                
                handleCancel();
            }
        };
    }
    
    // Copy prompt with input to clipboard
    async copyPromptWithInput(projectId, sectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        const section = project.sections.find(s => s.sectionId === sectionId);
        if (!section) return;
        
        // Get the full prompt with all substitutions EXCEPT input and automation ID (keep placeholders)
        let prompt = null;
        if (window.PromptLoader) {
            try {
                // Use getPrompt which handles modifiers, variables, and substitutions
                // But we need to reload with input and automation ID substitution enabled
                prompt = await window.PromptLoader.getPrompt(sectionId, section, project, { 
                    substituteInput: true, 
                    substituteAutomationId: true 
                });
                
                // Remove Input Guidance section - it's shown in the "?" popup, not in the prompt
                prompt = this.removeInputGuidanceFromPrompt(prompt);
                
                // Input and automation ID substitution are now handled by getPrompt with the options
                // But we may still need to handle cases where input should be appended
                if (section.input) {
                    // Check if prompt has {USER_INPUT} or {INPUT} placeholder (should already be substituted)
                    // If not found, it means the placeholder wasn't in the prompt, so append input
                    if (!prompt.includes('{USER_INPUT}') && !prompt.includes('{INPUT}') && !prompt.includes(section.input)) {
                        // Check if this is a process step that uses {PREVIOUS_OUTPUT}
                        if (section.isProcessStep && prompt.includes('{PREVIOUS_OUTPUT}')) {
                            // For process steps, the input field might contain the previous output
                            // Substitute it into {PREVIOUS_OUTPUT}
                            prompt = prompt.replace(/{PREVIOUS_OUTPUT}/g, section.input);
                        } else {
                            // If no placeholder exists, append input at the end with a clear separator
                            // Note: This is the NEW input for this step, not previous outputs
                            // Previous outputs are available in conversation memory if enabled
                            prompt += '\n\n---\n\n## Input\n\n' + section.input;
                        }
                    }
                }
            } catch (error) {
                console.warn('Failed to load prompt:', error);
                // Fallback to stored prompt
                prompt = section.prompt;
                
                // Remove Input Guidance from fallback prompt too
                prompt = this.removeInputGuidanceFromPrompt(prompt);
                
                // Still try to substitute input in fallback
                if (section.input) {
                    if (prompt.includes('{USER_INPUT}') || prompt.includes('{INPUT}')) {
                        prompt = prompt.replace(/{USER_INPUT}/g, section.input);
                        prompt = prompt.replace(/{INPUT}/g, section.input);
                    } else if (section.isProcessStep && prompt.includes('{PREVIOUS_OUTPUT}')) {
                        prompt = prompt.replace(/{PREVIOUS_OUTPUT}/g, section.input);
                    } else {
                        prompt += '\n\n---\n\n## Input\n\n' + section.input;
                    }
                }
            }
        } else {
            prompt = section.prompt;
            
            // Remove Input Guidance from stored prompt
            prompt = this.removeInputGuidanceFromPrompt(prompt);
            
            // Still try to substitute input in fallback
            if (section.input) {
                if (prompt.includes('{USER_INPUT}') || prompt.includes('{INPUT}')) {
                    prompt = prompt.replace(/{USER_INPUT}/g, section.input);
                    prompt = prompt.replace(/{INPUT}/g, section.input);
                } else if (section.isProcessStep && prompt.includes('{PREVIOUS_OUTPUT}')) {
                    prompt = prompt.replace(/{PREVIOUS_OUTPUT}/g, section.input);
                } else {
                    prompt += '\n\n---\n\n## Input\n\n' + section.input;
                }
            }
        }
        
        if (!prompt) {
            alert('No prompt available for this section.');
            return false;
        }
        
        // Build the text to copy, starting with explicit instructions and override instructions if present
        let textToCopy = '';
        
        // Check if override instructions are present (when override-instructions modifier is active)
        const hasOverrideInstructions = (section.modifiers || []).includes('override-instructions') && 
                                       section.overrideInstructions && 
                                       section.overrideInstructions.trim();
        
        if (hasOverrideInstructions) {
            // Add explicit instructions that precede override instructions (not visible to user in UI)
            textToCopy += 'IMPORTANT: The following override instructions take precedence over the standard prompt template. Apply these instructions first, then proceed with the standard prompt.\n\n';
            textToCopy += '---\n\n';
            textToCopy += '## Override Instructions\n\n';
            textToCopy += section.overrideInstructions.trim();
            textToCopy += '\n\n---\n\n';
        }
        
        // Add the prompt with input already substituted
        textToCopy += prompt;
        
        // Copy to clipboard
        try {
            await navigator.clipboard.writeText(textToCopy);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            // Fallback: select text in a temporary textarea
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return true;
            } catch (err) {
                document.body.removeChild(textarea);
                return false;
            }
        }
    }
    
    // Mark section as complete
    markSectionComplete(projectId, sectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        const section = project.sections.find(s => s.sectionId === sectionId);
        if (!section) return;
        
        // Update section status
        this.stateManager.updateSection(projectId, sectionId, {
            status: "complete"
        });
        
        // Enable next section
        const config = window.PipelineConfig;
        if (config) {
            const nextSection = config.getNextSection(sectionId, project.sections);
            if (nextSection) {
                // Next section is now available (dependencies met)
                // nextSection is already the full section object, no need to find it again
                if (nextSection.status === "not_started") {
                    // Auto-navigate to next section could happen here
                }
            }
        }
    }
    
    // Mark section as needing revision
    markSectionNeedsRevision(projectId, sectionId) {
        this.stateManager.updateSection(projectId, sectionId, {
            status: "needs_revision"
        });
    }
    
    // Get next section
    getNextSection(projectId, sectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return null;
        
        const config = window.PipelineConfig;
        if (!config) return null;
        
        return config.getNextSection(sectionId, project.workflowType);
    }
    
    // Get previous section
    getPreviousSection(projectId, sectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return null;
        
        const config = window.PipelineConfig;
        if (!config) return null;
        
        return config.getPreviousSection(sectionId, project.sections);
    }
    
    // Update pane visibility based on state
    updatePaneVisibility(paneName, isExpanded) {
        let paneElement = null;
        let toggleBtn = null;
        let collapsedToggleBtn = null;
        
        switch (paneName) {
            case 'topBar':
                paneElement = document.getElementById('top-bar');
                toggleBtn = document.getElementById('toggle-top-bar');
                collapsedToggleBtn = document.getElementById('toggle-top-bar-collapsed');
                break;
            case 'projectsSidebar':
                paneElement = document.getElementById('projects-sidebar');
                toggleBtn = document.getElementById('toggle-projects-sidebar');
                collapsedToggleBtn = document.getElementById('toggle-projects-sidebar-collapsed');
                break;
            case 'referencesPanel':
                paneElement = document.getElementById('references-panel');
                toggleBtn = document.getElementById('toggle-references-panel');
                collapsedToggleBtn = document.getElementById('toggle-references-panel-collapsed');
                break;
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
    
    // Restore pane states on initialization
    restorePaneStates() {
        const paneStates = this.stateManager.getState().paneStates || {};
        Object.keys(paneStates).forEach(paneName => {
            const isExpanded = this.stateManager.getPaneState(paneName);
            this.updatePaneVisibility(paneName, isExpanded);
        });
    }
    
    // Export structured outputs for Case 4 projects
    async exportStructuredOutputs(project) {
        if (!project || project.case !== 4) return;
        
        const outputMappingSection = project.sections.find(s => s.sectionId === 'output-mapping');
        if (!outputMappingSection || !outputMappingSection.output) {
            alert('Please complete the Output Mapping step first to generate structured outputs.');
            return;
        }
        
        // Parse the output mapping to get file associations
        const mapping = outputMappingSection.output;
        
        // Extract structured outputs from input-structuring step
        const structuringSection = project.sections.find(s => s.sectionId === 'input-structuring');
        if (!structuringSection || !structuringSection.output) {
            alert('Please complete the Input Structuring step first.');
            return;
        }
        
        // Parse structured outputs from the structuring step output
        // The output should contain JSON blocks for each target step
        const structuredOutputs = this.parseStructuredOutputs(structuringSection.output);
        
        // Create a zip or individual files
        const timestamp = new Date().toISOString().split('T')[0];
        const projectName = project.name.replace(/[^a-z0-9]/gi, '_');
        
        // Export each structured output as a separate file
        for (const [stepName, content] of Object.entries(structuredOutputs)) {
            const filename = `${projectName}_${stepName}_${timestamp}.json`;
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        // Also export the mapping file
        const mappingFilename = `${projectName}_output-mapping_${timestamp}.md`;
        const mappingBlob = new Blob([mapping], { type: 'text/markdown' });
        const mappingUrl = URL.createObjectURL(mappingBlob);
        const mappingA = document.createElement('a');
        mappingA.href = mappingUrl;
        mappingA.download = mappingFilename;
        document.body.appendChild(mappingA);
        mappingA.click();
        document.body.removeChild(mappingA);
        URL.revokeObjectURL(mappingUrl);
        
        alert(`Exported ${Object.keys(structuredOutputs).length} structured output file(s) and mapping file.`);
    }
    
    // Parse structured outputs from input-structuring step output
    parseStructuredOutputs(outputText) {
        const outputs = {};
        
        // Look for JSON code blocks with step names - multiple patterns
        // Pattern 1: ### For [step-name] Step followed by ```json
        let jsonBlockRegex = /### For (\w+(?:-\w+)*) Step\s*```json\s*([\s\S]*?)\s*```/g;
        let match;
        
        while ((match = jsonBlockRegex.exec(outputText)) !== null) {
            const stepName = match[1];
            const jsonContent = match[2].trim();
            
            // Try to parse and pretty-print JSON
            try {
                const parsed = JSON.parse(jsonContent);
                outputs[stepName] = JSON.stringify(parsed, null, 2);
            } catch (e) {
                // If parsing fails, use raw content
                outputs[stepName] = jsonContent;
            }
        }
        
        // Pattern 2: ### For [step-name] Step (without "Step" in header)
        jsonBlockRegex = /### For (\w+(?:-\w+)*)\s*```json\s*([\s\S]*?)\s*```/g;
        while ((match = jsonBlockRegex.exec(outputText)) !== null) {
            const stepName = match[1];
            if (!outputs[stepName]) { // Don't overwrite if already found
                const jsonContent = match[2].trim();
                try {
                    const parsed = JSON.parse(jsonContent);
                    outputs[stepName] = JSON.stringify(parsed, null, 2);
                } catch (e) {
                    outputs[stepName] = jsonContent;
                }
            }
        }
        
        // Pattern 3: Any JSON code block with a heading above it
        jsonBlockRegex = /###\s+(\w+(?:\s+\w+)*)\s*[\s\S]*?```json\s*([\s\S]*?)\s*```/g;
        while ((match = jsonBlockRegex.exec(outputText)) !== null) {
            const heading = match[1].toLowerCase().replace(/\s+/g, '-');
            // Try to match to known step names
            const stepNames = ['research', 'feature-extraction', 'app-analysis', 'decomposition', 'atomic-features', 'ux-specification'];
            const matchedStep = stepNames.find(s => heading.includes(s.replace('-', '')));
            
            if (matchedStep && !outputs[matchedStep]) {
                const jsonContent = match[2].trim();
                try {
                    const parsed = JSON.parse(jsonContent);
                    outputs[matchedStep] = JSON.stringify(parsed, null, 2);
                } catch (e) {
                    outputs[matchedStep] = jsonContent;
                }
            }
        }
        
        return outputs;
    }
    
    // Link Case 4 project to a target project
    async linkCase4ToTarget(case4ProjectId) {
        const case4Project = this.stateManager.getProject(case4ProjectId);
        if (!case4Project || case4Project.case !== 4) {
            alert('This action is only available for Case 4 projects.');
            return;
        }
        
        // Check if Case 4 is complete
        const outputMappingSection = case4Project.sections.find(s => s.sectionId === 'output-mapping');
        if (!outputMappingSection || outputMappingSection.status !== 'complete') {
            alert('Please complete the Output Mapping step in the Case 4 project before linking.');
            return;
        }
        
        // Get all projects that can receive Case 4 input (Case 1, 2, or 3)
        const state = this.stateManager.getState();
        const targetProjects = state.projects.filter(p => 
            p.id !== case4ProjectId && 
            (p.case === 1 || p.case === 2 || p.case === 3) &&
            !p.linkedFromCase4 // Don't show already linked projects
        );
        
        if (targetProjects.length === 0) {
            alert('No suitable target projects found. Please create a Case 1, 2, or 3 project first.');
            return;
        }
        
        // Show project selection dialog
        const projectList = targetProjects.map(p => 
            `Case ${p.case}: ${p.name}`
        ).join('\n');
        
        const selected = prompt(
            `Select target project to link Case 4 inputs to:\n\n${projectList}\n\nEnter project name:`,
            targetProjects[0].name
        );
        
        if (!selected) return;
        
        const targetProject = targetProjects.find(p => p.name === selected);
        if (!targetProject) {
            alert('Project not found.');
            return;
        }
        
        // Link and inject inputs
        await this.injectCase4Inputs(case4Project, targetProject);
    }
    
    // Link from Case 4 (called from target project)
    async linkFromCase4(targetProjectId) {
        const targetProject = this.stateManager.getProject(targetProjectId);
        if (!targetProject || (targetProject.case !== 1 && targetProject.case !== 2 && targetProject.case !== 3)) {
            alert('This action is only available for Case 1, 2, or 3 projects.');
            return;
        }
        
        // Get all Case 4 projects
        const state = this.stateManager.getState();
        const case4Projects = state.projects.filter(p => 
            p.case === 4 && 
            p.sections.some(s => s.sectionId === 'output-mapping' && s.status === 'complete')
        );
        
        if (case4Projects.length === 0) {
            alert('No completed Case 4 projects found.');
            return;
        }
        
        // Show Case 4 project selection dialog
        const projectList = case4Projects.map(p => p.name).join('\n');
        const selected = prompt(
            `Select Case 4 project to link inputs from:\n\n${projectList}\n\nEnter project name:`,
            case4Projects[0].name
        );
        
        if (!selected) return;
        
        const case4Project = case4Projects.find(p => p.name === selected);
        if (!case4Project) {
            alert('Case 4 project not found.');
            return;
        }
        
        // Link and inject inputs
        await this.injectCase4Inputs(case4Project, targetProject);
    }
    
    // Inject Case 4 structured inputs into target project
    async injectCase4Inputs(case4Project, targetProject) {
        // Get structured outputs from Case 4
        const structuringSection = case4Project.sections.find(s => s.sectionId === 'input-structuring');
        if (!structuringSection || !structuringSection.output) {
            alert('Case 4 project does not have structured outputs. Please complete the Input Structuring step.');
            return;
        }
        
        // Parse structured outputs
        const structuredOutputs = this.parseStructuredOutputs(structuringSection.output);
        
        if (Object.keys(structuredOutputs).length === 0) {
            alert('No structured outputs found in Case 4 project. Please complete the Input Structuring step.');
            return;
        }
        
        // Get input mapping from config
        const pipelineConfig = window.PipelineConfig;
        if (!pipelineConfig) {
            alert('Pipeline configuration not available.');
            return;
        }
        
        const chainConfig = await pipelineConfig.getCaseChainingConfig(4, targetProject.case);
        
        if (!chainConfig || !chainConfig.inputMapping) {
            alert(`No input mapping configuration found for Case 4 → Case ${targetProject.case}.`);
            return;
        }
        
        // Map and inject inputs
        let injectedCount = 0;
        const sectionMapping = {
            'research': 'research',
            'feature-extraction': 'feature-extraction',
            'app-analysis': 'app-analysis',
            'decomposition': 'decomposition',
            'atomic-features': 'atomic-features',
            'ux-specification': 'ux-specification'
        };
        
        for (const [targetSectionId, sourceKey] of Object.entries(chainConfig.inputMapping)) {
            // Find the structured output - try multiple matching strategies
            let matchingKey = null;
            
            // Strategy 1: Direct match by source key
            matchingKey = Object.keys(structuredOutputs).find(k => 
                k.toLowerCase().includes(sourceKey.toLowerCase().replace('-input', ''))
            );
            
            // Strategy 2: Match by target section name
            if (!matchingKey) {
                matchingKey = Object.keys(structuredOutputs).find(k => 
                    k.toLowerCase().includes(targetSectionId.toLowerCase().replace('-', ''))
                );
            }
            
            // Strategy 3: Match by section mapping
            if (!matchingKey && sectionMapping[targetSectionId]) {
                const mappedName = sectionMapping[targetSectionId];
                matchingKey = Object.keys(structuredOutputs).find(k => 
                    k.toLowerCase().includes(mappedName.toLowerCase())
                );
            }
            
            if (matchingKey) {
                const structuredInput = structuredOutputs[matchingKey];
                
                // Find target section in target project
                const targetSection = targetProject.sections.find(s => s.sectionId === targetSectionId);
                if (targetSection) {
                    // Inject as input (append if input already exists)
                    const existingInput = targetSection.input || '';
                    const newInput = existingInput ? `${existingInput}\n\n---\n\n${structuredInput}` : structuredInput;
                    
                    this.stateManager.updateSection(targetProject.id, targetSectionId, {
                        input: newInput,
                        status: existingInput ? targetSection.status : 'in_progress'
                    });
                    injectedCount++;
                }
            }
        }
        
        // Mark target project as linked from Case 4
        this.stateManager.updateProject(targetProject.id, {
            linkedFromCase4: case4Project.id
        });
        
        // Re-render
        this.renderingEngine.renderAll();
        
        alert(`Successfully linked Case 4 project "${case4Project.name}" to "${targetProject.name}".\n\nInjected ${injectedCount} structured input(s) into the appropriate sections.`);
    }
    
    // Get first incomplete section
    getFirstIncompleteSection(projectId) {
        try {
            const project = this.stateManager.getProject(projectId);
            if (!project) return null;
            
            const config = window.PipelineConfig;
            if (!config) return null;
            
            const workflowSections = config.getSectionsForWorkflow(project.workflowType);
            if (!workflowSections || workflowSections.length === 0) return null;
            
            for (const sectionDef of workflowSections) {
                const section = project.sections.find(s => s.sectionId === sectionDef.id);
                if (section && section.status !== "complete") {
                    // Check dependencies
                    const deps = this.checkDependencies(projectId, sectionDef.id);
                    if (deps && deps.met) {
                        return sectionDef;
                    }
                }
            }
            
            return null;
        } catch (error) {
            console.warn('Error in getFirstIncompleteSection:', error);
            return null;
        }
    }
    
    // Navigate to a specific section
    navigateToSection(projectId, sectionId) {
        if (!projectId || !sectionId) return;
        
        this.stateManager.setActiveProject(projectId);
        
        // Remove active class from all pipeline section items first
        const allPipelineItems = document.querySelectorAll('.pipeline-section-item');
        allPipelineItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Update active section in rendering engine
        if (this.renderingEngine) {
            this.renderingEngine.activeSectionId = sectionId;
        }
        
        // Re-render
        this.renderingEngine.renderAll();
    }
    
    // Handle section input change
    handleSectionInputChange(projectId, sectionId, value) {
        this.stateManager.updateSection(projectId, sectionId, {
            input: value,
            status: value ? "in_progress" : "not_started"
        });
    }
    
    // Handle section output change
    handleSectionOutputChange(projectId, sectionId, value) {
        this.stateManager.updateSection(projectId, sectionId, {
            output: value
        });
    }
    
    // Handle section notes change
    handleSectionNotesChange(projectId, sectionId, value) {
        this.stateManager.updateSection(projectId, sectionId, {
            notes: value
        });
    }
    
    // Handle section override instructions change
    handleSectionOverrideInstructionsChange(projectId, sectionId, value) {
        this.stateManager.updateSection(projectId, sectionId, {
            overrideInstructions: value
        });
    }
    
    // ============================================
    // Case Selection and Workflow Methods
    // ============================================
    
    // Show case selection dialog
    async showCaseSelectionDialog() {
        return new Promise((resolve) => {
            const modal = document.getElementById('case-selection-modal');
            if (!modal) {
                // Fallback to simple prompt
                const caseNum = prompt('Select case:\n1 - Codebase Analysis\n2 - UI/UX-Only Analysis\n3 - User Input Analysis\n4 - Input Preparation\n5 - Documentation\n6 - Poiesis\n7 - Physis', '1');
                resolve(caseNum ? parseInt(caseNum) : null);
                return;
            }
            
            const body = document.getElementById('case-selection-body');
            const confirmBtn = document.getElementById('case-selection-confirm');
            const cancelBtn = document.getElementById('case-selection-cancel');
            const closeBtn = document.getElementById('case-selection-close');
            
            if (!body || !confirmBtn || !cancelBtn || !closeBtn) {
                // Fallback to simple prompt
                const caseNum = prompt('Select case:\n1 - Codebase Analysis\n2 - UI/UX-Only Analysis\n3 - User Input Analysis\n4 - Input Preparation\n5 - Documentation\n6 - Poiesis\n7 - Physis', '1');
                resolve(caseNum ? parseInt(caseNum) : null);
                return;
            }
            
            let selectedCase = null;
            
            // Load case options
            const pipelineConfig = window.PipelineConfig;
            if (!pipelineConfig) {
                // Fallback to simple prompt
                const caseNum = prompt('Select case:\n1 - Codebase Analysis\n2 - UI/UX-Only Analysis\n3 - User Input Analysis\n4 - Input Preparation\n5 - Documentation\n6 - Poiesis\n7 - Physis', '1');
                resolve(caseNum ? parseInt(caseNum) : null);
                return;
            }
            
            pipelineConfig.getAllCases().then(cases => {
                body.innerHTML = cases.map(caseInfo => `
                    <div class="case-option" data-case="${caseInfo.number}">
                        <h3>Case ${caseInfo.number}: ${caseInfo.name}</h3>
                        <p>${caseInfo.description}</p>
                    </div>
                `).join('');
                
                // Handle case selection
                body.querySelectorAll('.case-option').forEach(option => {
                    option.addEventListener('click', () => {
                        body.querySelectorAll('.case-option').forEach(opt => opt.classList.remove('selected'));
                        option.classList.add('selected');
                        selectedCase = parseInt(option.dataset.case);
                        confirmBtn.disabled = false;
                    });
                });
                
                // Handle automation engine selection
                let selectedEngine = 'file-watching'; // Default
                const engineOptions = document.querySelectorAll('.automation-engine-option');
                engineOptions.forEach(option => {
                    option.addEventListener('click', () => {
                        engineOptions.forEach(opt => {
                            opt.classList.remove('selected');
                        });
                        option.classList.add('selected');
                        selectedEngine = option.dataset.engine;
                    });
                });
                
                // Handle confirm
                const handleConfirm = () => {
                    if (selectedCase) {
                        modal.style.display = 'none';
                        resolve({ caseNumber: selectedCase, automationEngine: selectedEngine });
                    }
                };
                
                // Handle cancel/close
                const handleCancel = () => {
                    modal.style.display = 'none';
                    resolve(null);
                };
                
                confirmBtn.onclick = handleConfirm;
                cancelBtn.onclick = handleCancel;
                closeBtn.onclick = handleCancel;
                const backdrop = modal.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.onclick = handleCancel;
                }
                
                // Show modal
                modal.style.display = 'flex';
                confirmBtn.disabled = true;
            }).catch(error => {
                console.error('Error loading cases:', error);
                // Fallback to simple prompt
                const caseNum = prompt('Select case:\n1 - Codebase Analysis\n2 - UI/UX-Only Analysis\n3 - User Input Analysis', '1');
                resolve(caseNum ? parseInt(caseNum) : null);
            });
        });
    }
    
    async showModifierEditorModal(projectId, sectionId) {
        return new Promise(async (resolve) => {
            const modal = document.getElementById('modifier-editor-modal');
            if (!modal) {
                resolve(null);
                return;
            }
            
            const body = document.getElementById('modifier-editor-body');
            const saveBtn = document.getElementById('modifier-editor-save');
            const cancelBtn = document.getElementById('modifier-editor-cancel');
            const closeBtn = document.getElementById('modifier-editor-close');
            
            if (!body || !saveBtn || !cancelBtn || !closeBtn) {
                resolve(null);
                return;
            }
            
            const project = this.stateManager.getProject(projectId);
            const section = project?.sections.find(s => s.sectionId === sectionId);
            if (!section) {
                resolve(null);
                return;
            }
            
            const currentModifiers = section.modifiers || [];
            const pipelineConfig = window.PipelineConfig;
            
            // Get available modifiers for this step
            const stepName = section.stepName || section.sectionId;
            const caseNumber = project.case || 1;
            
            // Get modifiers from config (async)
            const caseConfig = await pipelineConfig?.getCaseConfig(caseNumber);
            const stepConfig = caseConfig?.workflow?.[stepName];
            const availableModifierNames = stepConfig?.modifiers || [];
            
            // Create modifier checkboxes
            body.innerHTML = availableModifierNames.map(modifierName => {
                const isChecked = currentModifiers.includes(modifierName);
                const modifierDef = pipelineConfig?.getModifier(modifierName);
                return `
                    <div class="modifier-checkbox">
                        <input type="checkbox" id="modifier-${modifierName}" value="${modifierName}" ${isChecked ? 'checked' : ''}>
                        <label for="modifier-${modifierName}">${modifierName}</label>
                        ${modifierDef?.description ? `<div class="modifier-description">${modifierDef.description}</div>` : ''}
                    </div>
                `;
            }).join('');
            
            // Handle save
            const handleSave = () => {
                const selectedModifiers = Array.from(body.querySelectorAll('input[type="checkbox"]:checked'))
                    .map(cb => cb.value);
                modal.style.display = 'none';
                resolve(selectedModifiers);
            };
            
            // Handle cancel/close
            const handleCancel = () => {
                modal.style.display = 'none';
                resolve(null);
            };
            
            saveBtn.onclick = handleSave;
            cancelBtn.onclick = handleCancel;
            // Close button should trigger save (same as clicking outside)
            closeBtn.onclick = handleSave;
            const backdrop = modal.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.onclick = handleSave;
            }
            
            // Show modal
            modal.style.display = 'flex';
        });
    }
    
    // Add inference steps for Case 2
    async addInferenceSteps(projectId) {
        const project = this.stateManager.getProject(projectId);
        if (!project || project.case !== 2) return;
        
        const pipelineConfig = window.PipelineConfig;
        if (!pipelineConfig) return;
        
        try {
            const inferenceSteps = await pipelineConfig.getInferenceSteps(2);
            let lastSectionId = 'atomic-features';
            
            for (const infStep of inferenceSteps) {
                const existingSection = project.sections.find(s => s.sectionId === infStep.name);
                if (!existingSection) {
                    this.stateManager.addInferenceStep(projectId, infStep.name, lastSectionId);
                }
                lastSectionId = infStep.name;
            }
            
            // Reload prompts after adding inference steps
            await this.loadPromptsForProject(projectId);
        } catch (error) {
            console.error('Error adding inference steps:', error);
        }
    }
    
    // Enhance from previous case
    async enhanceFromPreviousCase(projectId, previousProjectId) {
        const previousProject = this.stateManager.getProject(previousProjectId);
        const currentProject = this.stateManager.getProject(projectId);
        
        if (!previousProject || !currentProject) return;
        
        const previousCase = previousProject.case || 1;
        const currentCase = currentProject.case || 3;
        
        // Get previous case output (from final section or UX specification)
        const previousOutput = previousProject.sections
            .filter(s => s.status === 'complete')
            .map(s => s.output)
            .join('\n\n---\n\n');
        
        // Set case chain
        this.stateManager.setCaseChain(projectId, previousCase, currentCase, previousOutput);
        
        // Update modifiers based on case chaining
        const pipelineConfig = window.PipelineConfig;
        if (pipelineConfig) {
            try {
                const chainConfig = await pipelineConfig.getCaseChainingConfig(previousCase, currentCase);
                if (chainConfig) {
                    // Update modifiers for affected sections
                    for (const section of currentProject.sections) {
                        const modifierKey = currentCase === 1 ? 'case1Modifiers' : 
                                          currentCase === 2 ? 'case2Modifiers' : 
                                          'case3Modifiers';
                        
                        if (chainConfig[modifierKey] && chainConfig[modifierKey][section.stepName]) {
                            const newModifiers = chainConfig[modifierKey][section.stepName];
                            this.stateManager.updateModifiers(projectId, section.sectionId, newModifiers);
                        }
                    }
                }
            } catch (error) {
                console.error('Error applying case chaining modifiers:', error);
            }
        }
        
        // Reload prompts with new modifiers
        await this.loadPromptsForProject(projectId);
    }
    
    // Invoke a process step
    async invokeProcessStep(projectId, sectionId, processStepType) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        const section = project.sections.find(s => s.sectionId === sectionId);
        if (!section) return;
        
        const promptLoader = window.PromptLoader;
        if (!promptLoader) return;
        
        try {
            // Get process step prompt
            const prompt = await promptLoader.getProcessStepPrompt(
                processStepType,
                section,
                project
            );
            
            if (prompt) {
                // Remove Input Guidance section from process step prompt
                prompt = this.removeInputGuidanceFromPrompt(prompt);
                
                // Create or update process step section
                const existingProcessStep = project.sections.find(s => 
                    s.isProcessStep && s.processStepType === processStepType && 
                    s.dependencies.includes(sectionId)
                );
                
                if (existingProcessStep) {
                    this.stateManager.updateSection(projectId, existingProcessStep.sectionId, {
                        prompt: prompt,
                        status: 'in_progress'
                    });
                } else {
                    const processStep = this.stateManager.addProcessStep(
                        projectId,
                        processStepType,
                        sectionId,
                        { prompt: prompt }
                    );
                    
                    if (processStep) {
                        // Navigate to process step
                        this.navigateToSection(projectId, processStep.sectionId);
                    }
                }
            }
        } catch (error) {
            console.error(`Error invoking process step ${processStepType}:`, error);
        }
    }
    
    // Show dialog to insert a new step
    // Insert a step into the pipeline
    async insertStep(projectId, referenceSectionId, position, stepType, stepName) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        const referenceIndex = project.sections.findIndex(s => s.sectionId === referenceSectionId);
        if (referenceIndex === -1) return;
        
        const insertIndex = position === 'above' ? referenceIndex : referenceIndex + 1;
        
        let newSection = null;
        
        if (stepType === 'core') {
            newSection = await this.stateManager.insertCoreStep(projectId, insertIndex, stepName);
        } else if (stepType === 'process') {
            newSection = await this.stateManager.insertProcessStep(projectId, insertIndex, stepName, referenceSectionId);
        } else if (stepType === 'inference') {
            newSection = await this.stateManager.insertInferenceStep(projectId, insertIndex, stepName);
        }
        
        if (newSection) {
            // Load prompt for the new section
            await this.loadPromptsForProject(projectId);
            // Re-render the pipeline flow view if it's visible
            const pipelineFlowView = document.getElementById('pipeline-flow-view');
            if (pipelineFlowView && pipelineFlowView.style.display !== 'none') {
                this.renderingEngine.renderPipelineFlowView();
            }
            // Navigate to the new section
            this.navigateToSection(projectId, newSection.sectionId);
        }
    }
    
    // Show dialog to add a step to the pipeline (at the end or after a selected section)
    async showAddStepDialog(projectId, referenceSectionId = null, position = null) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        const pipelineConfig = window.PipelineConfig;
        await pipelineConfig.loadConfig();
        
        // Get existing steps in project
        const existingSteps = project.sections.map(s => ({
            sectionId: s.sectionId,
            stepName: s.stepName,
            sectionName: s.sectionName,
            stepType: s.stepType || 'core'
        }));
        
        // Get all cases and their steps
        const config = pipelineConfig.config;
        if (!config || !config.cases) {
            alert('Unable to load pipeline configuration.');
            return;
        }
        
        const stepsByCase = [];
        
        // Sort cases by number
        const caseNumbers = Object.keys(config.cases).map(Number).sort((a, b) => a - b);
        
        for (const caseNum of caseNumbers) {
            const caseConfig = config.cases[String(caseNum)];
            if (!caseConfig) continue;
            
            const caseSteps = {
                caseNumber: caseNum,
                caseName: caseConfig.name || `Case ${caseNum}`,
                coreSteps: [],
                processSteps: [],
                inferenceSteps: []
            };
            
            // Get core steps from workflow
            if (caseConfig.workflow) {
                caseSteps.coreSteps = Object.keys(caseConfig.workflow).map(stepName => ({
                    name: stepName,
                    displayName: stepName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    type: 'core'
                }));
            }
            
            // Get process steps
            if (caseConfig.processSteps) {
                caseSteps.processSteps = Object.keys(caseConfig.processSteps).map(stepName => ({
                    name: stepName,
                    displayName: stepName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    type: 'process'
                }));
            }
            
            // Get inference steps
            if (caseConfig.inferenceSteps) {
                caseSteps.inferenceSteps = Object.keys(caseConfig.inferenceSteps).map(stepName => ({
                    name: stepName,
                    displayName: stepName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    type: 'inference'
                }));
            }
            
            if (caseSteps.coreSteps.length > 0 || caseSteps.processSteps.length > 0 || caseSteps.inferenceSteps.length > 0) {
                stepsByCase.push(caseSteps);
            }
        }
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2>${referenceSectionId ? (position === 'above' ? 'Insert Step Above' : 'Insert Step Below') : 'Add Step'}</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body" id="add-step-body" style="padding: 20px;">
                    ${existingSteps.length > 0 ? `
                        <div style="margin-bottom: 30px;">
                            <h3 style="margin-bottom: 10px; color: #e0e0e0;">Steps in Current Project</h3>
                            <div id="existing-steps-list" style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${existingSteps.map(s => `
                                    <button class="step-option-btn existing" 
                                            data-step="${s.stepName}" 
                                            data-type="${s.stepType}"
                                            title="Already in project (can be added again)">
                                        ${s.sectionName} (${existingSteps.filter(es => es.stepName === s.stepName).length}x)
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div>
                        <h3 style="margin-bottom: 10px; color: #e0e0e0;">All Available Steps (by Case)</h3>
                        <div id="all-steps-list" style="display: flex; flex-direction: column; gap: 20px;">
                            ${stepsByCase.map(caseData => `
                                <div style="border: 1px solid #404040; border-radius: 4px; padding: 15px; background: #252525;">
                                    <h4 style="margin: 0 0 10px 0; color: #4a9eff;">${caseData.caseName} (Case ${caseData.caseNumber})</h4>
                                    ${caseData.coreSteps.length > 0 ? `
                                        <div style="margin-bottom: 10px;">
                                            <strong style="color: #888; font-size: 0.9em;">Core Steps:</strong>
                                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 5px;">
                                                ${caseData.coreSteps.map(step => {
                                                    const existingCount = existingSteps.filter(s => s.stepName === step.name).length;
                                                    return `
                                                        <button class="step-option-btn" 
                                                                data-step="${step.name}" 
                                                                data-type="core"
                                                                title="${existingCount > 0 ? `Already in project (${existingCount}x) - can be added again` : 'Add step'}">
                                                            ${step.displayName}${existingCount > 0 ? ` (${existingCount}x)` : ''}
                                                        </button>
                                                    `;
                                                }).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                    ${caseData.processSteps.length > 0 ? `
                                        <div style="margin-bottom: 10px;">
                                            <strong style="color: #888; font-size: 0.9em;">Process Steps:</strong>
                                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 5px;">
                                                ${caseData.processSteps.map(step => {
                                                    const existingCount = existingSteps.filter(s => s.stepName === step.name).length;
                                                    return `
                                                        <button class="step-option-btn" 
                                                                data-step="${step.name}" 
                                                                data-type="process"
                                                                title="${existingCount > 0 ? `Already in project (${existingCount}x) - can be added again` : 'Add step'}">
                                                            ${step.displayName}${existingCount > 0 ? ` (${existingCount}x)` : ''}
                                                        </button>
                                                    `;
                                                }).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                    ${caseData.inferenceSteps.length > 0 ? `
                                        <div>
                                            <strong style="color: #888; font-size: 0.9em;">Inference Steps:</strong>
                                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 5px;">
                                                ${caseData.inferenceSteps.map(step => {
                                                    const existingCount = existingSteps.filter(s => s.stepName === step.name).length;
                                                    return `
                                                        <button class="step-option-btn" 
                                                                data-step="${step.name}" 
                                                                data-type="inference"
                                                                title="${existingCount > 0 ? `Already in project (${existingCount}x) - can be added again` : 'Add step'}">
                                                            ${step.displayName}${existingCount > 0 ? ` (${existingCount}x)` : ''}
                                                        </button>
                                                    `;
                                                }).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div id="step-position-area" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #404040;">
                        <label style="display: block; margin-bottom: 8px; color: #e0e0e0;">${referenceSectionId ? (position === 'above' ? 'Insert step above:' : 'Insert step below:') : 'Add step:'}</label>
                        <select id="step-position-select" style="width: 100%; padding: 8px; background: #1e1e1e; border: 1px solid #404040; border-radius: 4px; color: #e0e0e0;" ${referenceSectionId ? 'disabled' : ''}>
                            <option value="end" ${!referenceSectionId ? 'selected' : ''}>At the end</option>
                            ${project.sections.map(section => `
                                <option value="${section.sectionId}" ${referenceSectionId === section.sectionId ? 'selected' : ''}>After: ${section.sectionName}</option>
                            `).join('')}
                        </select>
                        ${referenceSectionId ? `<input type="hidden" id="insert-position" value="${position}">` : ''}
                        ${referenceSectionId ? `<input type="hidden" id="insert-reference-section-id" value="${referenceSectionId}">` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <p style="color: #888; font-size: 0.9em; margin: 0;">Click a step button to add it immediately</p>
                    <button id="add-step-cancel" class="btn-secondary">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex'; // Show the modal
        
        const cancelBtn = document.getElementById('add-step-cancel');
        const closeBtn = modal.querySelector('.modal-close');
        const positionSelect = document.getElementById('step-position-select');
        
        // Handle step selection - add immediately on click
        modal.querySelectorAll('.step-option-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const stepName = btn.dataset.step;
                const stepType = btn.dataset.type;
                
                if (!stepName || !stepType) {
                    console.warn('Missing step data:', btn.dataset);
                    return;
                }
                
                // Add visual feedback
                btn.classList.add('active');
                
                // Get position from dropdown or from function parameters
                const insertPositionInput = document.getElementById('insert-position');
                const insertReferenceInput = document.getElementById('insert-reference-section-id');
                let targetReferenceSectionId = insertReferenceInput ? insertReferenceInput.value : null;
                let insertPosition = insertPositionInput ? insertPositionInput.value : 'below';
                
                if (!targetReferenceSectionId) {
                    // Not inserting above/below - use dropdown selection
                    const position = positionSelect.value;
                    if (position === 'end') {
                        // Add at the end - use last section as reference
                        if (project.sections.length > 0) {
                            targetReferenceSectionId = project.sections[project.sections.length - 1].sectionId;
                            insertPosition = 'below';
                        }
                    } else {
                        // Add after selected section
                        targetReferenceSectionId = position;
                        insertPosition = 'below';
                    }
                }
                
                // Add the step immediately
                if (targetReferenceSectionId) {
                    await this.insertStep(projectId, targetReferenceSectionId, insertPosition, stepType, stepName);
                } else {
                    // Add at the beginning if no sections exist
                    let newSection = null;
                    if (stepType === 'core') {
                        newSection = await this.stateManager.insertCoreStep(projectId, 0, stepName);
                    } else if (stepType === 'process') {
                        // Process steps need a reference section, so we can't add at the beginning
                        alert('Process steps must be added after an existing section.');
                        return;
                    } else if (stepType === 'inference') {
                        newSection = await this.stateManager.insertInferenceStep(projectId, 0, stepName);
                    }
                    
                    if (newSection) {
                        await this.loadPromptsForProject(projectId);
                        this.navigateToSection(projectId, newSection.sectionId);
                    }
                }
                
                // Re-render and close modal
                this.renderingEngine.renderAll();
                const pipelineFlowView = document.getElementById('pipeline-flow-view');
                if (pipelineFlowView && pipelineFlowView.style.display !== 'none') {
                    this.renderingEngine.renderPipelineFlowView();
                }
                modal.remove();
            });
        });
        
        // Handle cancel/close
        const handleCancel = () => {
            modal.remove();
        };
        
        cancelBtn.onclick = handleCancel;
        closeBtn.onclick = handleCancel;
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) handleCancel();
        });
    }
    
    // Insert a custom step
    async insertCustomStep(projectId, referenceSectionId, position, stepName, displayName, prompt) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        const referenceIndex = project.sections.findIndex(s => s.sectionId === referenceSectionId);
        if (referenceIndex === -1) return;
        
        const insertIndex = position === 'above' ? referenceIndex : referenceIndex + 1;
        
        const newSection = this.stateManager.insertCustomStep(projectId, insertIndex, stepName, displayName, prompt);
        
        if (newSection) {
            await this.loadPromptsForProject(projectId);
            this.navigateToSection(projectId, newSection.sectionId);
        }
    }
    
    // Override modifiers for a section
    async overrideModifiers(projectId, sectionId, modifiers) {
        this.stateManager.updateModifiers(projectId, sectionId, modifiers);
        
        // Reload prompt with new modifiers
        await this.loadPromptsForProject(projectId);
        
        // Re-render the section to update the modifiers display
        this.renderingEngine.renderSectionView();
        
        // Expand the modifiers section if it was collapsed and now has modifiers
        if (modifiers && modifiers.length > 0) {
            const sectionModifiers = document.querySelector(`.section-modifiers[data-project-id="${projectId}"][data-section-id="${sectionId}"]`);
            if (sectionModifiers) {
                sectionModifiers.classList.remove('collapsed');
            }
        }
    }
    
    // Autosave current project group before loading a different one
    async autosaveCurrentProjectGroup() {
        if (!this.autosaveEnabled) return;
        
        const state = this.stateManager.getState();
        const projectGroupName = state.metadata?.projectGroupName || this.currentProjectGroupName;
        
        // Only autosave if we have a project group name and there are projects to save
        if (projectGroupName && projectGroupName.trim() && state.projects && state.projects.length > 0) {
            try {
                const filename = `${projectGroupName.trim().replace(/[^a-z0-9]/gi, '_')}.json`;
                await this.dataLayer.exportToFile(state, filename, true); // silent = true for autosave
                console.log(`[Autosave] Saved project group "${projectGroupName}" to ${filename}`);
            } catch (error) {
                console.error('[Autosave] Failed to autosave project group:', error);
                // Don't show alert for autosave failures - just log
            }
        }
    }
    
    // Populate project group dropdown with saved files
    async populateProjectGroupDropdown() {
        const projectGroupSelect = document.getElementById('project-group-select');
        if (!projectGroupSelect) return;
        
        // Get current project group name
        const state = this.stateManager.getState();
        const currentProjectGroupName = state.metadata?.projectGroupName || this.currentProjectGroupName;
        const currentFilename = currentProjectGroupName ? `${currentProjectGroupName.trim().replace(/[^a-z0-9]/gi, '_')}.json` : null;
        
        try {
            const response = await fetch('/api/list-files');
            const result = await response.json();
            
            if (result.success && result.files && result.files.length > 0) {
                // Clear existing options
                projectGroupSelect.innerHTML = '';
                
                // Add file options
                result.files.forEach(file => {
                    const option = document.createElement('option');
                    option.value = file.name;
                    // Display name without .json extension
                    const displayName = file.name.replace(/\.json$/i, '').replace(/_/g, ' ');
                    option.textContent = displayName;
                    
                    // Select the current project group if it matches
                    if (currentFilename && file.name === currentFilename) {
                        option.selected = true;
                    }
                    
                    projectGroupSelect.appendChild(option);
                });
                
                // If no option was selected and we have a current project group, add it as the first option
                if (currentProjectGroupName && currentFilename && !projectGroupSelect.value) {
                    const currentOption = document.createElement('option');
                    currentOption.value = currentFilename;
                    currentOption.textContent = currentProjectGroupName;
                    currentOption.selected = true;
                    projectGroupSelect.insertBefore(currentOption, projectGroupSelect.firstChild);
                }
            } else {
                // No saved files, but show current project group if we have one
                projectGroupSelect.innerHTML = '';
                if (currentProjectGroupName && currentFilename) {
                    const option = document.createElement('option');
                    option.value = currentFilename;
                    option.textContent = currentProjectGroupName;
                    option.selected = true;
                    projectGroupSelect.appendChild(option);
                } else {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'No saved project groups';
                    projectGroupSelect.appendChild(option);
                }
            }
        } catch (error) {
            console.error('Failed to load project groups:', error);
            projectGroupSelect.innerHTML = '';
            if (currentProjectGroupName && currentFilename) {
                const option = document.createElement('option');
                option.value = currentFilename;
                option.textContent = currentProjectGroupName;
                option.selected = true;
                projectGroupSelect.appendChild(option);
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Error loading project groups';
                projectGroupSelect.appendChild(option);
            }
        }
    }
    
    // Load project group from file
    async loadProjectGroupFromFile(filename) {
        // Show loading overlay
        this.showLoadingOverlay('Loading project group...');
        
        try {
            // Autosave current project group before loading new one
            await this.autosaveCurrentProjectGroup();
            
            // Load file from server
            const response = await fetch('/api/load-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename })
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to load file');
            }
            
            // Parse JSON content
            const state = JSON.parse(result.content);
            
            // Update project group name from loaded state or filename
            const projectGroupInput = document.getElementById('project-group-name');
            
            if (state.metadata && state.metadata.projectGroupName) {
                if (projectGroupInput) {
                    projectGroupInput.value = state.metadata.projectGroupName;
                }
                this.currentProjectGroupName = state.metadata.projectGroupName;
            } else {
                // Extract from filename
                const nameWithoutExt = filename.replace(/\.json$/i, '').replace(/_/g, ' ');
                if (projectGroupInput) {
                    projectGroupInput.value = nameWithoutExt;
                }
                // Save to state
                if (state.metadata) {
                    state.metadata.projectGroupName = nameWithoutExt;
                } else {
                    state.metadata = { projectGroupName: nameWithoutExt };
                }
                this.currentProjectGroupName = nameWithoutExt;
            }
            
            // Validate and load state FIRST
            if (state.pages && Array.isArray(state.pages)) {
                this.stateManager.loadState(state);
                this.renderingEngine.renderAll();
                // Update dropdown AFTER state is loaded
                await this.populateProjectGroupDropdown();
            } else if (state.projects && Array.isArray(state.projects)) {
                this.stateManager.loadState(state);
                
                // Load prompts for all projects
                for (const project of state.projects || []) {
                    await this.loadPromptsForProject(project.id);
                }
                
                this.renderingEngine.renderAll();
                // Update dropdown AFTER state is loaded
                await this.populateProjectGroupDropdown();
            } else {
                alert('Invalid file format: File must contain either "pages" or "projects" array');
            }
            
            // Re-attach listeners after DOM changes
            this.setupProjectGroupDropdownListeners();
        } catch (error) {
            console.error('Load project group error:', error);
            alert('Failed to load project group: ' + error.message);
        } finally {
            // Hide loading overlay
            this.hideLoadingOverlay();
        }
    }
    
    // Show loading overlay
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
    
    // Hide loading overlay
    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            // Wait for fade-out animation before hiding
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
        }
    }
    
    // Get Input Guidance from structured data file
    getInputGuidance(stepName, isProcessStep, isInferenceStep, processStepType, caseNumber = null, modifiers = []) {
        // Get case number from current project if not provided
        if (!caseNumber) {
            const state = this.stateManager.getState();
            const activeProject = state.projects?.find(p => p.id === state.activeProjectId);
            if (activeProject) {
                caseNumber = String(activeProject.case || 1);
            } else {
                caseNumber = '1'; // Default to case 1
            }
        } else {
            caseNumber = String(caseNumber);
        }
        
        // Check if InputGuidanceData is available
        if (typeof InputGuidanceData === 'undefined') {
            console.warn('InputGuidanceData not loaded, using fallback');
            return this.getFallbackGuidance(stepName, isProcessStep, isInferenceStep, processStepType);
        }
        
        // Get case-specific guidance
        const caseData = InputGuidanceData[caseNumber];
        if (!caseData) {
            console.warn(`No Input Guidance data for case ${caseNumber}, using fallback`);
            return this.getFallbackGuidance(stepName, isProcessStep, isInferenceStep, processStepType);
        }
        
        // Handle process steps
        if (isProcessStep && processStepType) {
            const processGuidance = caseData[processStepType];
            if (processGuidance && processGuidance.guidance) {
                return processGuidance.guidance;
            }
            // Fallback for process steps
            return 'Paste the output from the step you want to process. The process step will analyze and refine the output.';
        }
        
        // Handle inference steps
        if (isInferenceStep) {
            const inferenceGuidance = caseData[stepName];
            if (inferenceGuidance && inferenceGuidance.guidance) {
                return inferenceGuidance.guidance;
            }
            // Fallback for inference steps
            return 'Paste the UX Specification or previous inference step output. This step will infer implementation details.';
        }
        
        // Core steps - get case-specific guidance
        const stepGuidance = caseData[stepName];
        if (stepGuidance && stepGuidance.guidance) {
            // Check if modifiers match (for cases where same step has different modifiers)
            if (modifiers.length > 0 && stepGuidance.modifiers) {
                const modifiersMatch = modifiers.every(m => stepGuidance.modifiers.includes(m)) &&
                                      stepGuidance.modifiers.every(m => modifiers.includes(m));
                if (modifiersMatch) {
                    return stepGuidance.guidance;
                }
            } else if (!modifiers.length || !stepGuidance.modifiers || stepGuidance.modifiers.length === 0) {
                return stepGuidance.guidance;
            }
        }
        
        // Fallback if no specific guidance found
        return this.getFallbackGuidance(stepName, isProcessStep, isInferenceStep, processStepType);
    }
    
    // Fallback guidance when specific case/step combination not found
    getFallbackGuidance(stepName, isProcessStep, isInferenceStep, processStepType) {
        // Handle process steps
        if (isProcessStep && processStepType) {
            const processGuidance = {
                'validation-loop': 'Paste the output from the step you want to validate. The validation loop will check completeness, accuracy, and quality, then provide feedback for refinement.',
                'refinement-loop': 'Paste the output from the step you want to refine. The refinement loop will identify areas for improvement and suggest enhancements.',
                'integration-loop': 'Paste outputs from multiple steps that need to be integrated. The integration loop will merge, reconcile conflicts, and create a unified output.'
            };
            return processGuidance[processStepType] || 'Paste the output from the previous step that needs to be processed.';
        }
        
        // Handle inference steps
        if (isInferenceStep) {
            const inferenceGuidance = {
                'api-contract-inference': 'Paste the UX Specification output. This step will infer API contracts needed to implement the features.',
                'behavioral-implementation-spec': 'Paste outputs from Data Model, State Machine, and API Contract Inference steps. This consolidates all inference outputs into a single behavioral specification.',
                'data-model-inference': 'Paste the UX Specification output. This step will infer the data models needed to implement the features.',
                'state-machine-inference': 'Paste the UX Specification output. This step will infer state machines needed to implement the features.'
            };
            return inferenceGuidance[stepName] || 'Paste the UX Specification or previous inference step output.';
        }
        
        // Generic fallback for core steps
        return '**What to enter in the Input field:**\n\n- Paste the output from the previous step\n- Or enter new input relevant to this step\n\n**Tip**: Use "Paste from Previous" button if you want to include output from a previous step.';
    }
    
    // Show Input Guidance popup
    async showInputGuidance(projectId, sectionId) {
        const modal = document.getElementById('input-guidance-modal');
        const content = document.getElementById('input-guidance-content');
        
        if (!modal || !content) {
            console.error('Input Guidance modal not found');
            return;
        }
        
        // Show loading state
        content.innerHTML = '<p style="color: #888;">Loading guidance...</p>';
        modal.style.display = 'flex';
        
        try {
            const project = this.stateManager.getProject(projectId);
            if (!project) {
                throw new Error('Project not found');
            }
            
            const section = project.sections.find(s => s.sectionId === sectionId);
            if (!section) {
                throw new Error('Section not found');
            }
            
            // Get step name - try sectionId first, then stepName
            // For core steps, sectionId is the step name (e.g., 'research', 'feature-extraction')
            let stepName = section.sectionId || sectionId;
            
            // If stepName is set and different, use it (for process steps or renamed steps)
            if (section.stepName && section.stepName !== section.sectionId) {
                stepName = section.stepName;
            }
            
            // Get Input Guidance from hardcoded mapping
            const guidance = this.getInputGuidance(
                stepName,
                section.isProcessStep,
                section.isInferenceStep,
                section.processStepType
            );
            
            if (guidance) {
                // Convert markdown to HTML (basic conversion)
                // Split into lines for processing
                const lines = guidance.split('\n');
                let html = '';
                let inList = false;
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    
                    // Check for list items
                    if (/^[-*•]\s+/.test(line)) {
                        if (!inList) {
                            html += '<ul style="margin: 10px 0; padding-left: 20px; list-style-type: disc;">';
                            inList = true;
                        }
                        const listContent = line.replace(/^[-*•]\s+/, '');
                        // Process bold/italic in list items
                        const processedContent = listContent
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>');
                        html += `<li style="margin: 5px 0;">${processedContent}</li>`;
                    } else {
                        // Close list if we were in one
                        if (inList) {
                            html += '</ul>';
                            inList = false;
                        }
                        
                        // Process headings
                        if (line.startsWith('### ')) {
                            html += `<h3 style="margin-top: 20px; margin-bottom: 10px; color: #ffffff;">${line.substring(4)}</h3>`;
                        } else if (line.startsWith('## ')) {
                            html += `<h2 style="margin-top: 20px; margin-bottom: 10px; color: #ffffff;">${line.substring(3)}</h2>`;
                        } else if (line.startsWith('# ')) {
                            html += `<h1 style="margin-top: 20px; margin-bottom: 10px; color: #ffffff;">${line.substring(2)}</h1>`;
                        } else if (line) {
                            // Regular paragraph
                            const processedLine = line
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em>$1</em>');
                            html += `<p style="margin: 10px 0; line-height: 1.6;">${processedLine}</p>`;
                        } else {
                            // Empty line - add spacing
                            html += '<br>';
                        }
                    }
                }
                
                // Close list if still open
                if (inList) {
                    html += '</ul>';
                }
                
                content.innerHTML = html;
            } else {
                content.innerHTML = '<p style="color: #888;">No input guidance available for this step.</p>';
            }
        } catch (error) {
            console.error('Error loading input guidance:', error);
            content.innerHTML = `<p style="color: #ff5555;">Error loading guidance: ${error.message}</p>`;
        }
    }
    
    // Remove a modifier from a section
    async removeModifier(projectId, sectionId, modifier) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        const section = project.sections.find(s => s.sectionId === sectionId);
        if (!section) return;
        
        const currentModifiers = section.modifiers || [];
        const newModifiers = currentModifiers.filter(m => m !== modifier);
        
        await this.overrideModifiers(projectId, sectionId, newModifiers);
        this.renderingEngine.renderAll();
    }
    
    // Create custom workflow
    async createCustomWorkflow(name, description, workflowDefinition) {
        const project = await this.stateManager.createProject(name, description, 1, null, true);
        this.stateManager.setCustomWorkflow(project.id, workflowDefinition);
        return project;
    }
    
    // Start automation
    async startAutomation(projectId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) {
            alert('Project not found');
            return;
        }
        
        // Validate dependencies before starting
        const pipelineConfig = window.PipelineConfig;
        if (pipelineConfig) {
            const sections = project.sections;
            const sectionIds = new Set(sections.map(s => s.sectionId));
            const missingDeps = [];
            
            for (const section of sections) {
                if (section.dependencies && section.dependencies.length > 0) {
                    for (const depId of section.dependencies) {
                        if (!sectionIds.has(depId)) {
                            missingDeps.push(`Section "${section.sectionName || section.sectionId}" depends on missing section: ${depId}`);
                        }
                    }
                }
            }
            
            if (missingDeps.length > 0) {
                alert(`Cannot start automation: Some sections have missing dependencies.\n\nMissing dependencies:\n${missingDeps.join('\n')}`);
                return;
            }
        }
        
        // Route to appropriate automation system based on project.automationEngine
        const automationEngine = project.automationEngine || 'file-watching'; // Default for backward compatibility
        
        if (automationEngine === 'cursor-cli') {
            const scopeDir = this.stateManager.getScopeDirectory();
            if (!scopeDir) {
                alert('Please set the scope directory for cursor-cli mode');
                return;
            }
            await this.cursorCLIAutomation.start(projectId, scopeDir);
        } else if (automationEngine === 'multi-agent') {
            // Get initial input from project description or first section
            const firstIncomplete = project.sections.find(s => s.status !== 'complete' && s.status !== 'skipped');
            const initialInput = firstIncomplete?.input || project.description || null;
            await this.multiAgentAutomation.start(projectId, initialInput);
        } else {
            // Default: file-watching mode
            // Emit event to trigger automation system
            this.eventSystem.emit(EventType.AUTOMATION_START, {
                source: 'PromptSpecApp',
                data: { projectId }
            });
        }
    }
    
    // Stop automation
    stopAutomation() {
        const activeProject = this.stateManager.getActiveProject();
        if (!activeProject) {
            // Fallback to metadata-based mode for backward compatibility
            const mode = this.stateManager.getAutomationMode();
            if (mode === 'cursor-cli') {
                if (this.cursorCLIAutomation && this.cursorCLIAutomation.isRunning) {
                    this.cursorCLIAutomation.stop();
                }
            } else if (mode === 'multi-agent') {
                if (this.multiAgentAutomation && this.multiAgentAutomation.isRunning) {
                    this.multiAgentAutomation.stop();
                }
            } else {
                this.eventSystem.emit(EventType.AUTOMATION_STOP, {
                    source: 'PromptSpecApp',
                    data: {}
                });
            }
        } else {
            // Route based on project.automationEngine
            const automationEngine = activeProject.automationEngine || 'file-watching';
            
            if (automationEngine === 'cursor-cli') {
                if (this.cursorCLIAutomation && this.cursorCLIAutomation.isRunning) {
                    this.cursorCLIAutomation.stop();
                }
            } else if (automationEngine === 'multi-agent') {
                if (this.multiAgentAutomation && this.multiAgentAutomation.isRunning) {
                    this.multiAgentAutomation.stop();
                }
            } else {
                // Default: file-watching mode
                this.eventSystem.emit(EventType.AUTOMATION_STOP, {
                    source: 'PromptSpecApp',
                    data: {}
                });
            }
        }
        this.updateAutomationButtonIcon(false);
    }
    
    // Show agent conversations for a section
    showAgentConversations(projectId, sectionId) {
        if (!this.multiAgentAutomation) {
            alert('Multi-agent automation not available');
            return;
        }
        
        const discussionId = `discussion-${sectionId}`;
        const discussion = this.multiAgentAutomation.agentDiscussions.get(discussionId);
        
        if (!discussion || discussion.length === 0) {
            alert('No agent conversations for this section');
            return;
        }
        
        const project = this.stateManager.getProject(projectId);
        const section = project?.sections.find(s => s.sectionId === sectionId);
        const sectionName = section?.sectionName || sectionId;
        
        // Create modal content
        let html = `<div style="max-width: 700px; max-height: 80vh; overflow-y: auto;">`;
        html += `<h3 style="margin-top: 0;">Agent Conversations: ${this.escapeHtml(sectionName)}</h3>`;
        html += `<div style="margin-bottom: 20px; padding: 12px; background: #2d2d2d; border-radius: 4px;">`;
        
        discussion.forEach(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString();
            html += `<div style="margin-bottom: 16px; padding: 12px; background: #1a1a1a; border-radius: 4px; border-left: 3px solid #9C27B0;">`;
            html += `<div style="font-weight: 500; color: #4CAF50; margin-bottom: 8px;">${this.escapeHtml(entry.agentRole)} <span style="color: #888; font-size: 0.9em; font-weight: normal;">[${time}]</span></div>`;
            html += `<div style="color: #e0e0e0; white-space: pre-wrap; line-height: 1.6;">${this.escapeHtml(entry.message)}</div>`;
            html += `</div>`;
        });
        
        html += `</div></div>`;
        
        // Show in modal
        this.modalSystem.showModal('Agent Conversations', html, [
            { text: 'Close', action: () => this.modalSystem.hideModal() }
        ]);
    }
    
    // Escape HTML helper
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Refresh automation check for all sections
    async refreshAutomationCheck(projectId) {
        if (!this.automationSystem || !this.automationSystem.isRunning) {
            return;
        }
        
        // Trigger manual check
        await this.automationSystem.checkAllSections(projectId);
    }
    
    // Update automation button icon based on running state
    updateAutomationButtonIcon(isRunning) {
        const automationBtn = document.getElementById('automation-btn');
        if (automationBtn) {
            if (isRunning) {
                automationBtn.textContent = '⏸️';
                automationBtn.title = 'Automation Running';
            } else {
                automationBtn.textContent = '▶️';
                automationBtn.title = 'Automation';
            }
        }
    }
    
    // Update automation ID for a section
    updateAutomationId(projectId, sectionId, newId) {
        // DIAGNOSTIC: Log update attempt
        console.log(`[DIAG] updateAutomationId - projectId: ${projectId}, sectionId: ${sectionId}, newId: ${newId}`);
        
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        const section = project.sections.find(s => s.sectionId === sectionId);
        if (!section) return;
        
        const oldId = section.automationId || '';
        console.log(`[DIAG] Current automationId in state: ${oldId}`);
        
        // Validate ID format (alphanumeric, underscore, hyphen only)
        if (newId && !/^[a-zA-Z0-9_\-]+$/.test(newId)) {
            this.showAutomationIdStatus(projectId, sectionId, 'Invalid characters. Use only letters, numbers, underscore, or hyphen.', 'error');
            console.log(`[DIAG] Validation failed for automationId: ${newId} (invalid format)`);
            return;
        }
        
        // Check for uniqueness
        if (newId) {
            const isUnique = this.validateAutomationIdUniqueness(projectId, sectionId, newId);
            if (!isUnique) {
                this.showAutomationIdStatus(projectId, sectionId, 'ID already in use. Must be unique.', 'error');
                console.log(`[DIAG] Validation failed for automationId: ${newId} (not unique)`);
                return;
            }
        }
        
        const finalId = newId || this.generateDefaultAutomationId(projectId, sectionId);
        console.log(`[DIAG] Updating automationId from "${oldId}" to "${finalId}"`);
        
        // Update the ID
        this.stateManager.updateSection(projectId, sectionId, {
            automationId: finalId
        });
        
        // Verify update
        const updatedProject = this.stateManager.getProject(projectId);
        const updatedSection = updatedProject?.sections.find(s => s.sectionId === sectionId);
        console.log(`[DIAG] Verification - automationId in state after update: ${updatedSection?.automationId || 'undefined'}`);
        
        this.showAutomationIdStatus(projectId, sectionId, 'ID updated', 'success');
        
        // Re-render to update UI
        this.renderingEngine.renderAll();
    }
    
    // Validate automation ID uniqueness
    validateAutomationId(projectId, sectionId, newId) {
        if (!newId) {
            // Generate default if empty
            const defaultId = this.generateDefaultAutomationId(projectId, sectionId);
            this.updateAutomationId(projectId, sectionId, defaultId);
            return true;
        }
        
        const isUnique = this.validateAutomationIdUniqueness(projectId, sectionId, newId);
        if (!isUnique) {
            this.showAutomationIdStatus(projectId, sectionId, 'ID already in use. Must be unique.', 'error');
            return false;
        }
        
        this.showAutomationIdStatus(projectId, sectionId, '✓', 'success');
        return true;
    }
    
    // Check if automation ID is unique across all sections
    validateAutomationIdUniqueness(projectId, sectionId, id) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return false;
        
        const lowerId = id.toLowerCase();
        return !project.sections.some(s => 
            s.sectionId !== sectionId && 
            s.automationId && 
            s.automationId.toLowerCase() === lowerId
        );
    }
    
    // Generate default 4-character alphanumeric ID
    generateDefaultAutomationId(projectId, sectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return this.randomId(4);
        
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const usedIds = new Set(
            project.sections
                .filter(s => s.sectionId !== sectionId && s.automationId)
                .map(s => s.automationId.toLowerCase())
        );
        
        let id;
        let attempts = 0;
        do {
            id = '';
            for (let i = 0; i < 4; i++) {
                id += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            attempts++;
            if (attempts > 100) {
                // Fallback to timestamp-based if too many attempts
                id = Date.now().toString(36).substr(-4);
                break;
            }
        } while (usedIds.has(id.toLowerCase()));
        
        return id;
    }
    
    // Generate random ID
    randomId(length) {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let id = '';
        for (let i = 0; i < length; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }
    
    // Show automation ID status message
    showAutomationIdStatus(projectId, sectionId, message, type) {
        const statusEl = document.getElementById(`automation-id-status-${sectionId}`);
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.style.color = type === 'error' ? '#ff6b6b' : type === 'success' ? '#51cf66' : '#b8b8b8';
            
            // Clear success message after 2 seconds
            if (type === 'success' && message !== '✓') {
                setTimeout(() => {
                    if (statusEl.textContent === message) {
                        statusEl.textContent = '';
                    }
                }, 2000);
            }
        }
    }
    
    // Update automation status display
    updateAutomationStatus() {
        const automationStatusText = document.getElementById('automation-status-text');
        const automationCurrentStep = document.getElementById('automation-current-step');
        const automationDirectoryDisplay = document.getElementById('automation-directory-display');
        
        const project = this.stateManager.getActiveProject();
        if (!project) return;
        
        // Update directory display from project's automationDirectory
        if (automationDirectoryDisplay) {
            const savedDir = project.automationDirectory;
            if (savedDir) {
                automationDirectoryDisplay.textContent = savedDir;
            } else {
                automationDirectoryDisplay.textContent = 'No directory set';
            }
        }
        
        // Use project.automationEngine if available, otherwise fall back to metadata mode
        const automationEngine = project.automationEngine || this.stateManager.getAutomationMode();
        
        let isRunning = false;
        if (automationEngine === 'cursor-cli') {
            isRunning = (this.cursorCLIAutomation && this.cursorCLIAutomation.isRunning);
        } else if (automationEngine === 'multi-agent') {
            isRunning = (this.multiAgentAutomation && this.multiAgentAutomation.isRunning);
        } else {
            isRunning = (this.automationSystem && this.automationSystem.isRunning);
        }
        
        if (isRunning) {
            if (automationStatusText) automationStatusText.textContent = 'Running';
            if (automationCurrentStep) {
                if (automationEngine === 'cursor-cli') {
                    automationCurrentStep.textContent = 'Executing via Cursor CLI...';
                } else if (automationEngine === 'multi-agent') {
                    // Show active agents count
                    const activeAgentCount = this.multiAgentAutomation?.activeAgents?.size || 0;
                    if (activeAgentCount > 0) {
                        automationCurrentStep.textContent = `Multi-agent: ${activeAgentCount} agent(s) active`;
                    } else {
                        automationCurrentStep.textContent = 'Multi-agent: Processing...';
                    }
                } else {
                    const section = project.sections.find(s => s.sectionId === this.automationSystem.currentSectionId);
                    automationCurrentStep.textContent = section ? `Current: ${section.sectionName}` : '';
                }
            }
        } else {
            if (automationStatusText) automationStatusText.textContent = 'Stopped';
            if (automationCurrentStep) automationCurrentStep.textContent = '';
        }
    }
    
    // Handle automation directory change
    async handleAutomationDirectoryChange(projectId, directory) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        const oldDirectory = project.automationDirectory;
        let newDirectory = directory.trim();
        
        // Normalize Windows paths: convert backslashes to forward slashes
        // This handles paths like H:\_Projects\... or C:\Users\...
        newDirectory = newDirectory.replace(/\\/g, '/');
        
        // If directory is empty, create a new directory with unique ID
        if (!newDirectory) {
            const caseNumber = project.case || 1;
            const caseName = this.renderingEngine.getCaseDisplayName(caseNumber);
            const caseSlug = caseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            const state = this.stateManager.getState();
            const defaultDir = state.metadata?.defaultAutomationDirectory || null;
            
            try {
                const response = await fetch('/api/create-directory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ caseSlug, defaultDir })
                });
                
                const result = await response.json();
                
                if (result.success && result.path) {
                    newDirectory = result.path;
                    // Initialize existing outputs as files
                    await this.initializeExistingOutputs(projectId, newDirectory);
                } else {
                    // Fallback if creation fails
                    const fallbackPath = defaultDir && defaultDir.trim() 
                        ? `${defaultDir.trim()}/${caseSlug}-default`
                        : `feat-spec/projects/${caseSlug}-default`;
                    newDirectory = fallbackPath;
                }
            } catch (error) {
                console.error('Error creating directory:', error);
                // Fallback
                const fallbackPath = defaultDir && defaultDir.trim() 
                    ? `${defaultDir.trim()}/${caseSlug}-default`
                    : `feat-spec/projects/${caseSlug}-default`;
                newDirectory = fallbackPath;
            }
            
            // Update the input field to show the new directory
            const input = document.getElementById('automation-dir-input');
            if (input && input.dataset.projectId === projectId) {
                input.value = newDirectory;
            }
        }
        
        // Ensure the new directory exists (create if it doesn't)
        try {
            const ensureResponse = await fetch('http://localhost:8050/api/ensure-directory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dirPath: newDirectory })
            });
            
            if (!ensureResponse.ok) {
                throw new Error(`Server error: ${ensureResponse.status} ${ensureResponse.statusText}`);
            }
            
            const ensureResult = await ensureResponse.json();
            if (!ensureResult.success) {
                alert('Failed to create directory: ' + (ensureResult.error || 'Unknown error'));
                // Revert the input field
                const input = document.getElementById('automation-dir-input');
                if (input && input.dataset.projectId === projectId) {
                    input.value = oldDirectory || '';
                }
                return;
            }
        } catch (error) {
            console.error('Error ensuring directory exists:', error);
            alert('Error creating directory: ' + error.message + '\n\nPlease make sure the server is running and try again.');
            // Revert the input field
            const input = document.getElementById('automation-dir-input');
            if (input && input.dataset.projectId === projectId) {
                input.value = oldDirectory || '';
            }
            return;
        }
        
        // If directory changed and old directory had files, offer to move them
        if (oldDirectory && oldDirectory.trim() && oldDirectory.trim() !== newDirectory) {
            try {
                const listResponse = await fetch('http://localhost:8050/api/list-directory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dirPath: oldDirectory })
                });
                
                const listResult = await listResponse.json();
                if (listResult.success && listResult.files && listResult.files.length > 0) {
                    const fileCount = listResult.files.length;
                    const fileList = listResult.files.slice(0, 5).join(', ') + 
                        (listResult.files.length > 5 ? ` and ${listResult.files.length - 5} more` : '');
                    
                    const shouldMove = confirm(
                        `The automation directory has changed.\n\n` +
                        `Old directory: ${oldDirectory}\n` +
                        `New directory: ${newDirectory}\n\n` +
                        `Found ${fileCount} file(s) in the old directory:\n${fileList}\n\n` +
                        `Would you like to move these files to the new directory?`
                    );
                    
                    if (shouldMove) {
                        const moveResponse = await fetch('http://localhost:8050/api/move-files', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                sourceDir: oldDirectory,
                                targetDir: newDirectory,
                                fileNames: listResult.files
                            })
                        });
                        
                        const moveResult = await moveResponse.json();
                        if (moveResult.success) {
                            console.log(`Moved ${moveResult.movedFiles.length} file(s) to new directory`);
                            if (moveResult.errors && moveResult.errors.length > 0) {
                                console.warn('Some files had errors:', moveResult.errors);
                            }
                        } else {
                            alert('Failed to move files: ' + (moveResult.error || 'Unknown error'));
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking/moving files:', error);
                // Don't block the directory change if file check fails
            }
        }
        
        // Update the project with new directory
        this.stateManager.updateProject(projectId, { automationDirectory: newDirectory });
        
        // Reload prompts to update {AUTOMATION_DIR} variable
        await this.loadPromptsForProject(projectId);
        this.renderingEngine.renderAll();
    }
    
    // Ensure automation directory is set (auto-generate if empty)
    async ensureAutomationDirectory(projectId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        // If directory is already set, nothing to do
        if (project.automationDirectory && project.automationDirectory.trim()) {
            return;
        }
        
        // Generate case slug
        const caseNumber = project.case || 1;
        const caseName = this.renderingEngine.getCaseDisplayName(caseNumber);
        const caseSlug = caseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        // Get default directory from metadata if set
        const state = this.stateManager.getState();
        const defaultDir = state.metadata?.defaultAutomationDirectory || null;
        
        try {
            const response = await fetch('/api/create-directory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caseSlug, defaultDir })
            });
            
            const result = await response.json();
            
            if (result.success && result.path) {
                // Set the directory in the project (without triggering file move logic)
                this.stateManager.updateProject(projectId, { automationDirectory: result.path });
                
                // Initialize existing outputs as files
                await this.initializeExistingOutputs(projectId, result.path);
            } else {
                // Fallback: use default path even if creation failed
                const fallbackPath = defaultDir && defaultDir.trim() 
                    ? `${defaultDir.trim()}/${caseSlug}-default`
                    : `feat-spec/projects/${caseSlug}-default`;
                this.stateManager.updateProject(projectId, { automationDirectory: fallbackPath });
            }
        } catch (error) {
            console.error('Error ensuring automation directory:', error);
            // Fallback: use default path
            const fallbackPath = defaultDir && defaultDir.trim() 
                ? `${defaultDir.trim()}/${caseSlug}-default`
                : `feat-spec/projects/${caseSlug}-default`;
            this.stateManager.updateProject(projectId, { automationDirectory: fallbackPath });
        }
    }
    
    // Initialize existing section outputs as files in the automation directory
    async initializeExistingOutputs(projectId, automationDir) {
        const project = this.stateManager.getProject(projectId);
        if (!project || !automationDir) return;
        
        // Get prompt loader to understand file naming conventions
        const promptLoader = window.PromptLoader;
        if (!promptLoader) return;
        
        for (const section of project.sections) {
            if (!section.output || !section.output.trim()) continue;
            
            try {
                // Get the prompt to find file watching instructions
                const prompt = await promptLoader.getPrompt(section.sectionId, section, project);
                if (!prompt) continue;
                
                // Parse file watching instructions to get the target file name
                const instructionsMatch = prompt.match(/## File Watching Instructions[\s\S]*?Target Directory[:\s]+`?([^`\n]+)`?[\s\S]*?Files to Watch[:\s]+`?([^`\n]+)`?/i);
                if (!instructionsMatch) continue;
                
                let targetDir = instructionsMatch[1].trim();
                const filesToWatch = instructionsMatch[2].split(',').map(f => f.trim());
                
                // Replace {AUTOMATION_DIR} in target directory
                if (targetDir.includes('{AUTOMATION_DIR}')) {
                    targetDir = targetDir.replace(/\{AUTOMATION_DIR\}/g, automationDir);
                } else {
                    // If no {AUTOMATION_DIR}, use automationDir directly
                    targetDir = automationDir;
                }
                
                // Use the first file name from files to watch, or default
                const fileName = filesToWatch[0] || `${section.sectionId}-output.md`;
                
                // Save the output to the file
                const filePath = `${targetDir}/${fileName}`;
                const response = await fetch('http://localhost:8050/api/save-automation-file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filePath: filePath,
                        content: section.output
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    console.log(`Initialized output for ${section.sectionId} to ${filePath}`);
                }
            } catch (error) {
                console.error(`Error initializing output for ${section.sectionId}:`, error);
            }
        }
    }
    
    // Create a new automation directory
    async createAutomationDirectory(projectId, caseSlug) {
        try {
            // Get default directory from metadata if set
            const state = this.stateManager.getState();
            const defaultDir = state.metadata?.defaultAutomationDirectory || null;
            
            const response = await fetch('/api/create-directory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caseSlug, defaultDir })
            });
            
            const result = await response.json();
            
            if (result.success && result.path) {
                // Update the project with the new directory path (with unique ID)
                this.stateManager.updateProject(projectId, { automationDirectory: result.path });
                
                // Update the automation directory input
                const input = document.getElementById('automation-dir-input');
                if (input) {
                    input.value = result.path;
                }
                
                // Initialize existing outputs as files
                await this.initializeExistingOutputs(projectId, result.path);
                
                // Reload prompts and re-render
                await this.loadPromptsForProject(projectId);
                this.renderingEngine.renderAll();
            } else {
                alert('Failed to create directory: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error creating automation directory:', error);
            alert('Error creating directory: ' + error.message);
        }
    }
    
    // Set default automation directory for the project group
    async setDefaultAutomationDirectory() {
        const state = this.stateManager.getState();
        const currentDefault = state.metadata?.defaultAutomationDirectory || '';
        
        const newDefault = prompt('Enter default directory for new automation directories (leave empty to use feat-spec/projects):', currentDefault);
        
        if (newDefault === null) {
            // User cancelled
            return;
        }
        
        const trimmedDefault = newDefault.trim();
        
        // Update metadata with new default
        const updatedMetadata = {
            ...state.metadata,
            defaultAutomationDirectory: trimmedDefault || null
        };
        
        this.stateManager.setState({
            metadata: updatedMetadata
        });
        
        // Save to file if we have a project group name
        const projectGroupName = state.metadata?.projectGroupName || this.currentProjectGroupName;
        if (projectGroupName && projectGroupName.trim()) {
            try {
                const updatedState = this.stateManager.getState();
                const filename = `${projectGroupName.trim().replace(/[^a-z0-9]/gi, '_')}.json`;
                await this.dataLayer.exportToFile(updatedState, filename, true); // silent = true
                console.log(`[Default Directory] Updated and saved to ${filename}`);
            } catch (error) {
                console.error('Failed to save default directory:', error);
                alert('Default directory set, but failed to save to file: ' + error.message);
            }
        } else {
            console.log('[Default Directory] Set (not saved - no project group name)');
        }
    }
    
    async openAutomationDirectory(projectId) {
        try {
            const project = this.stateManager.getProject(projectId);
            if (!project) {
                console.error('Project not found:', projectId);
                return;
            }
            
            // Get the automation directory from the project, or use empty string to open default
            const automationDir = project.automationDirectory || '';
            
            // Call the server endpoint to open the directory
            const response = await fetch('http://localhost:8050/api/open-directory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ dirPath: automationDir })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                console.error('Failed to open directory:', result.error);
                alert('Failed to open directory: ' + result.error);
            }
        } catch (error) {
            console.error('Error opening automation directory:', error);
            alert('Error opening directory: ' + error.message);
        }
    }
    
    // Extract suggested directory from prompt and populate if empty
    async extractSuggestedDirectory(projectId, sectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        // If directory already set, don't override
        if (project.automationDirectory) return;
        
        const section = project.sections.find(s => s.sectionId === sectionId);
        if (!section) return;
        
        // Get the prompt
        const prompt = await window.PromptLoader?.getPrompt(sectionId, section, project);
        if (!prompt) return;
        
        // Look for Target Directory in File Watching Instructions
        const targetDirMatch = prompt.match(/Target Directory[:\s]+`?([^`\n]+)`?/i);
        if (targetDirMatch) {
            const suggestedDir = targetDirMatch[1].trim();
            // Remove {AUTOMATION_DIR} placeholder if present
            const cleanDir = suggestedDir.replace(/\{AUTOMATION_DIR\}/g, '').trim();
            if (cleanDir && cleanDir !== './automation-output') {
                // Update project with suggested directory
                this.stateManager.updateProject(projectId, { automationDirectory: cleanDir });
                // Update the input field if it exists
                const dirInput = document.getElementById('automation-dir-input');
                if (dirInput && dirInput.dataset.projectId === projectId) {
                    dirInput.value = cleanDir;
                }
            }
        }
    }
    
    // Show file browser modal for loading files
    async showFileBrowserModal() {
        const modal = document.getElementById('file-browser-modal');
        if (!modal) {
            console.error('File browser modal not found!');
            return;
        }
        
        // Reset state
        let selectedFile = null;
        let uploadedFile = null;
        
        // Show modal
        modal.style.display = 'flex';
        
        // Load saved files list
        const savedFilesList = document.getElementById('saved-files-list');
        const loadBtn = document.getElementById('file-browser-load');
        const uploadBtn = document.getElementById('file-upload-btn');
        const uploadInput = document.getElementById('file-upload-input');
        const uploadName = document.getElementById('file-upload-name');
        
        // Load server files
        const loadServerFiles = async () => {
            try {
                const response = await fetch('/api/list-files');
                const result = await response.json();
                
                if (result.success && result.files && result.files.length > 0) {
                    savedFilesList.innerHTML = result.files.map(file => {
                        const date = new Date(file.modified);
                        const sizeKB = (file.size / 1024).toFixed(2);
                        return `
                            <div class="file-item" data-filename="${file.name}" style="padding: 10px; margin: 5px 0; background: #2d2d2d; border-radius: 4px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center;">
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-weight: 500; color: #e0e0e0;">${file.name}</div>
                                    <div style="font-size: 0.85em; color: #888; margin-top: 4px;">
                                        ${sizeKB} KB • ${date.toLocaleString()}
                                    </div>
                                </div>
                                <button class="file-delete-btn" data-filename="${file.name}" style="margin-left: 10px; padding: 4px 8px; background: #ff5555; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em; transition: background 0.2s;" title="Delete file">🗑️</button>
                            </div>
                        `;
                    }).join('');
                    
                    // Add click handlers for file selection
                    savedFilesList.querySelectorAll('.file-item').forEach(item => {
                        const filename = item.dataset.filename;
                        // Click on the file item (but not the delete button) selects it
                        item.addEventListener('click', (e) => {
                            // Don't select if clicking the delete button
                            if (e.target.classList.contains('file-delete-btn') || e.target.closest('.file-delete-btn')) {
                                return;
                            }
                            // Deselect all
                            savedFilesList.querySelectorAll('.file-item').forEach(i => {
                                i.style.border = '2px solid transparent';
                                i.style.background = '#2d2d2d';
                            });
                            // Select this one
                            item.style.border = '2px solid #4a9eff';
                            item.style.background = '#3d3d3d';
                            selectedFile = filename;
                            uploadedFile = null;
                            uploadName.textContent = '';
                            loadBtn.disabled = false;
                        });
                    });
                    
                    // Add delete button handlers
                    savedFilesList.querySelectorAll('.file-delete-btn').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            e.stopPropagation(); // Prevent file selection
                            const filename = btn.dataset.filename;
                            
                            if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
                                return;
                            }
                            
                            try {
                                const response = await fetch('/api/delete-file', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ filename })
                                });
                                
                                if (!response.ok) {
                                    throw new Error(`Server error: ${response.status}`);
                                }
                                
                                const result = await response.json();
                                if (!result.success) {
                                    throw new Error(result.error || 'Failed to delete file');
                                }
                                
                                // If deleted file was selected, clear selection
                                if (selectedFile === filename) {
                                    selectedFile = null;
                                    loadBtn.disabled = true;
                                }
                                
                                // Reload file list
                                await loadServerFiles();
                                
                                // Refresh project group dropdown
                                await this.populateProjectGroupDropdown();
                            } catch (err) {
                                console.error('Delete file error:', err);
                                alert('Failed to delete file: ' + err.message);
                            }
                        });
                        
                        // Add hover effect
                        btn.addEventListener('mouseenter', () => {
                            btn.style.background = '#ff7777';
                        });
                        btn.addEventListener('mouseleave', () => {
                            btn.style.background = '#ff5555';
                        });
                    });
                } else {
                    savedFilesList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No saved files found.</p>';
                }
            } catch (error) {
                console.error('Failed to load server files:', error);
                savedFilesList.innerHTML = '<p style="color: #ff5555; text-align: center; padding: 20px;">Failed to load files from server.</p>';
            }
        };
        
        await loadServerFiles();
        
        // Handle file upload
        uploadBtn.addEventListener('click', () => {
            uploadInput.click();
        });
        
        uploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadedFile = file;
                selectedFile = null;
                uploadName.textContent = `Selected: ${file.name}`;
                // Deselect server files
                savedFilesList.querySelectorAll('.file-item').forEach(i => {
                    i.style.border = '2px solid transparent';
                    i.style.background = '#2d2d2d';
                });
                loadBtn.disabled = false;
            }
        });
        
        // Handle load button
        const handleLoad = async () => {
            // Show loading overlay
            this.showLoadingOverlay('Loading project group...');
            
            try {
                let state;
                let loadedFilename = null;
                
                if (uploadedFile) {
                    // Load from uploaded file
                    state = await this.dataLayer.importFromFile(uploadedFile);
                    loadedFilename = uploadedFile.name;
                } else if (selectedFile) {
                    // Load from server
                    const response = await fetch('/api/load-file', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename: selectedFile })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Server error: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    if (!result.success) {
                        throw new Error(result.error || 'Failed to load file');
                    }
                    
                    // Parse JSON content
                    state = JSON.parse(result.content);
                    loadedFilename = selectedFile;
                } else {
                    alert('Please select a file to load.');
                    this.hideLoadingOverlay();
                    return;
                }
                
                // Update project group name from loaded state or filename
                if (state.metadata && state.metadata.projectGroupName) {
                    const projectGroupInput = document.getElementById('project-group-name');
                    if (projectGroupInput) {
                        projectGroupInput.value = state.metadata.projectGroupName;
                    }
                } else if (loadedFilename) {
                    // Try to extract project group name from filename
                    const nameWithoutExt = loadedFilename.replace(/\.json$/i, '').replace(/_/g, ' ');
                    const projectGroupInput = document.getElementById('project-group-name');
                    if (projectGroupInput) {
                        projectGroupInput.value = nameWithoutExt;
                    }
                    // Save to state
                    if (state.metadata) {
                        state.metadata.projectGroupName = nameWithoutExt;
                    } else {
                        state.metadata = { projectGroupName: nameWithoutExt };
                    }
                }
                
                // Validate and load state
                if (state.pages && Array.isArray(state.pages)) {
                    this.stateManager.loadState(state);
                    this.renderingEngine.renderAll();
                    // Update dropdown AFTER state is loaded
                    await this.populateProjectGroupDropdown();
                    // Re-attach listeners after DOM changes
                    this.setupProjectGroupDropdownListeners();
                    modal.style.display = 'none';
                } else if (state.projects && Array.isArray(state.projects)) {
                    // Autosave current project group before loading new one
                    await this.autosaveCurrentProjectGroup();
                    
                    this.stateManager.loadState(state);
                    
                    // Update current project group name
                    if (state.metadata && state.metadata.projectGroupName) {
                        this.currentProjectGroupName = state.metadata.projectGroupName;
                    } else if (loadedFilename) {
                        const nameWithoutExt = loadedFilename.replace(/\.json$/i, '').replace(/_/g, ' ');
                        this.currentProjectGroupName = nameWithoutExt;
                    }
                    
                    // Load prompts for all projects
                    for (const project of state.projects || []) {
                        await this.loadPromptsForProject(project.id);
                    }
                    
                    this.renderingEngine.renderAll();
                    // Update dropdown AFTER state is loaded
                    await this.populateProjectGroupDropdown();
                    // Re-attach listeners after DOM changes
                    this.setupProjectGroupDropdownListeners();
                    modal.style.display = 'none';
                } else {
                    alert('Invalid file format: File must contain either "pages" or "projects" array');
                }
            } catch (err) {
                console.error('Load file error:', err);
                alert('Failed to load file: ' + err.message);
            } finally {
                // Hide loading overlay
                this.hideLoadingOverlay();
            }
        };
        
        // Handle cancel/close
        const handleCancel = () => {
            modal.style.display = 'none';
            selectedFile = null;
            uploadedFile = null;
            uploadName.textContent = '';
            loadBtn.disabled = true;
        };
        
        // Wire up buttons
        loadBtn.onclick = handleLoad;
        document.getElementById('file-browser-cancel').onclick = handleCancel;
        document.getElementById('file-browser-close').onclick = handleCancel;
        modal.querySelector('.modal-backdrop').onclick = handleCancel;
    }
    
    // Show project group edit modal
    async showProjectGroupEditModal() {
        const modal = document.getElementById('project-group-edit-modal');
        if (!modal) {
            console.error('Project group edit modal not found!');
            return;
        }
        
        const state = this.stateManager.getState();
        const projectGroupName = state.metadata?.projectGroupName || '';
        const projectGroupDescription = state.metadata?.projectGroupDescription || '';
        const projectGroupTags = state.metadata?.projectGroupTags || '';
        const defaultAutomationDir = state.metadata?.defaultAutomationDirectory || '';
        
        // Populate form fields
        const nameInput = document.getElementById('project-group-edit-name');
        const descriptionInput = document.getElementById('project-group-edit-description');
        const tagsInput = document.getElementById('project-group-edit-tags');
        const defaultDirInput = document.getElementById('project-group-edit-default-automation-dir');
        
        if (nameInput) nameInput.value = projectGroupName;
        if (descriptionInput) descriptionInput.value = projectGroupDescription;
        if (tagsInput) tagsInput.value = Array.isArray(projectGroupTags) ? projectGroupTags.join(', ') : projectGroupTags;
        if (defaultDirInput) defaultDirInput.value = defaultAutomationDir;
        
        // Show modal
        modal.style.display = 'flex';
        
        // Get buttons
        const saveBtn = document.getElementById('project-group-edit-save');
        const cancelBtn = document.getElementById('project-group-edit-cancel');
        const closeBtn = document.getElementById('project-group-edit-close');
        
        // Handle save
        const handleSave = async () => {
            const newName = nameInput?.value.trim() || '';
            const newDescription = descriptionInput?.value.trim() || '';
            const newTagsStr = tagsInput?.value.trim() || '';
            const newTags = newTagsStr ? newTagsStr.split(',').map(t => t.trim()).filter(t => t) : [];
            let newDefaultDir = defaultDirInput?.value.trim() || '';
            
            // Normalize backslashes to forward slashes for the default directory
            newDefaultDir = newDefaultDir.replace(/\\/g, '/');
            
            if (!newName) {
                alert('Project group name is required.');
                return;
            }
            
            try {
                // Get old filename if name changed
                const oldName = projectGroupName;
                const oldFilename = oldName ? `${oldName.trim().replace(/[^a-z0-9]/gi, '_')}.json` : null;
                const newFilename = `${newName.trim().replace(/[^a-z0-9]/gi, '_')}.json`;
                
                // Update state with new values
                const updatedState = {
                    ...state,
                    metadata: {
                        ...state.metadata,
                        projectGroupName: newName,
                        projectGroupDescription: newDescription,
                        projectGroupTags: newTags,
                        defaultAutomationDirectory: newDefaultDir || null
                    }
                };
                
                this.stateManager.setState(updatedState);
                
                // Update current project group name
                this.currentProjectGroupName = newName;
                
                // If name changed and old file exists, rename it
                if (oldName && oldName !== newName && oldFilename && oldFilename !== newFilename) {
                    // Save with new filename
                    await this.dataLayer.exportToFile(updatedState, newFilename, true);
                    
                    // Delete old file if it exists
                    try {
                        const response = await fetch('/api/delete-file', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filename: oldFilename })
                        });
                        const result = await response.json();
                        if (!result.success) {
                            console.warn('Could not delete old file:', result.error);
                        }
                    } catch (deleteErr) {
                        console.warn('Error deleting old file:', deleteErr);
                    }
                } else if (oldName === newName) {
                    // Name didn't change, just save with current filename
                    await this.dataLayer.exportToFile(updatedState, newFilename, true);
                }
                
                // Update UI
                const projectGroupInput = document.getElementById('project-group-name');
                if (projectGroupInput) {
                    projectGroupInput.value = newName;
                }
                
                // Refresh dropdown
                await this.populateProjectGroupDropdown();
                // Re-attach listeners after DOM changes
                this.setupProjectGroupDropdownListeners();
                
                // Close modal
                modal.style.display = 'none';
            } catch (err) {
                console.error('Error saving project group:', err);
                alert('Failed to save project group: ' + err.message);
            }
        };
        
        // Handle paste events on default automation directory input
        document.addEventListener('paste', (e) => {
            if (e.target.id === 'project-group-edit-default-automation-dir') {
                // Normalize pasted path after paste event completes
                setTimeout(() => {
                    const dir = e.target.value.trim().replace(/\\/g, '/');
                    if (e.target.value !== dir) {
                        e.target.value = dir;
                    }
                }, 0);
            }
        });
        
        // Handle blur on default automation directory input to normalize
        document.addEventListener('blur', (e) => {
            if (e.target.id === 'project-group-edit-default-automation-dir') {
                let dir = e.target.value.trim();
                // Normalize backslashes to forward slashes
                dir = dir.replace(/\\/g, '/');
                // Update input field with normalized path
                if (e.target.value !== dir) {
                    e.target.value = dir;
                }
            }
        }, true);
        
        // Handle cancel/close
        const handleCancel = () => {
            modal.style.display = 'none';
        };
        
        // Remove old listeners by cloning
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        
        // Re-attach listeners to cloned buttons
        const finalSaveBtn = document.getElementById('project-group-edit-save');
        const finalCancelBtn = document.getElementById('project-group-edit-cancel');
        const finalCloseBtn = document.getElementById('project-group-edit-close');
        
        if (finalSaveBtn) finalSaveBtn.onclick = handleSave;
        if (finalCancelBtn) finalCancelBtn.onclick = handleCancel;
        // Close button should trigger save (same as clicking outside)
        if (finalCloseBtn) finalCloseBtn.onclick = handleSave;
        
        newSaveBtn.onclick = handleSave;
        newCancelBtn.onclick = handleCancel;
        newCloseBtn.onclick = handleCancel;
        
        // Close on backdrop click
        const backdropHandler = (e) => {
            if (e.target === modal) handleCancel();
        };
        modal.removeEventListener('click', backdropHandler);
        modal.addEventListener('click', backdropHandler);
        
        // Handle Enter key in name input
        if (nameInput) {
            const enterHandler = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSave();
                }
            };
            nameInput.removeEventListener('keydown', enterHandler);
            nameInput.addEventListener('keydown', enterHandler);
            nameInput.focus();
        }
    }
    
    // Delete project group
    async deleteProjectGroup() {
        const state = this.stateManager.getState();
        const projectGroupName = state.metadata?.projectGroupName;
        
        if (!projectGroupName || !projectGroupName.trim()) {
            alert('No project group is currently loaded.');
            return;
        }
        
        const filename = `${projectGroupName.trim().replace(/[^a-z0-9]/gi, '_')}.json`;
        
        if (!confirm(`Are you sure you want to delete the project group "${projectGroupName}"?\n\nThis will delete the file "${filename}" from the server. This action cannot be undone.`)) {
            return;
        }
        
        try {
            // Delete file from server
            const response = await fetch('/api/delete-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename })
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to delete file');
            }
            
            // Clear current project group from state
            this.stateManager.setState({
                metadata: {
                    ...state.metadata,
                    projectGroupName: null,
                    projectGroupDescription: null,
                    projectGroupTags: null
                }
            });
            
            // Update UI
            const projectGroupInput = document.getElementById('project-group-name');
            const projectGroupSelect = document.getElementById('project-group-select');
            
            if (projectGroupInput) {
                projectGroupInput.value = '';
                projectGroupInput.style.display = 'none';
            }
            if (projectGroupSelect) {
                projectGroupSelect.value = '';
                projectGroupSelect.style.display = 'block';
            }
            
            this.currentProjectGroupName = null;
            
            // Refresh dropdown
            await this.populateProjectGroupDropdown();
            
            alert(`Project group "${projectGroupName}" has been deleted.`);
        } catch (err) {
            console.error('Error deleting project group:', err);
            alert('Failed to delete project group: ' + err.message);
        }
    }
    
    // Setup chat system handlers
    setupChatHandlers() {
        // Wait for chat system to be initialized
        if (!this.chatSystem || !this.chatWindow) {
            // Retry after a short delay if not ready
            setTimeout(() => this.setupChatHandlers(), 100);
            return;
        }
        
        // Chat button - toggle window
        const chatBtn = document.getElementById('chat-btn');
        if (chatBtn) {
            chatBtn.addEventListener('click', () => {
                this.chatWindow.toggle();
            });
        }
        
        // Chat window clear history button
        const chatWindowClearHistory = document.querySelector('.chat-window-clear-history');
        if (chatWindowClearHistory) {
            chatWindowClearHistory.addEventListener('click', () => {
                const activeChatId = this.chatTabBar ? this.chatTabBar.getActiveTabId() : null;
                if (activeChatId) {
                    if (confirm('Are you sure you want to clear all chat history for this chat? This cannot be undone.')) {
                        this.chatSystem.clearHistory(activeChatId);
                    }
                } else {
                    alert('No active chat to clear history for.');
                }
            });
        }
        
        // Chat window close button
        const chatWindowClose = document.querySelector('.chat-window-close');
        if (chatWindowClose) {
            chatWindowClose.addEventListener('click', () => {
                this.chatWindow.hide();
            });
        }
        
        // Chat input send handler
        if (this.chatInput) {
            this.chatInput.onSend((message) => {
                const activeChatId = this.chatTabBar ? this.chatTabBar.getActiveTabId() : null;
                if (activeChatId) {
                    this.chatSystem.sendMessage(activeChatId, message).then(result => {
                        if (!result.success) {
                            alert('Failed to send message: ' + result.error);
                        }
                    });
                } else {
                    // Create new chat if none exists
                    const state = this.stateManager.getState();
                    const activeProject = state.projects.find(p => p.id === state.activeProjectId);
                    const scopeDirectory = activeProject ? activeProject.scopeDirectory : null;

                    const newChatId = this.chatSystem.createChat({
                        scopeDirectory: scopeDirectory,
                        projectId: activeProject ? activeProject.id : null
                    });

                    if (this.chatTabBar) {
                        const chat = this.chatSystem.getChat(newChatId);
                        this.chatTabBar.addTab(newChatId, chat.name);
                        this.chatTabBar.setActiveTab(newChatId);
                    }

                    this.chatSystem.sendMessage(newChatId, message).then(result => {
                        if (!result.success) {
                            alert('Failed to send message: ' + result.error);
                        }
                    });
                }
            });
        }
        
        // Chat system event handlers
        this.eventSystem.register('chat:created', (event) => {
            const { chatId, chatInstance } = event.data;
            if (this.chatTabBar) {
                this.chatTabBar.addTab(chatId, chatInstance.name);
                this.chatTabBar.setActiveTab(chatId);
            }
            if (this.chatMessageList) {
                this.chatMessageList.render(chatId, chatInstance.history || []);
            }
        });
        
        this.eventSystem.register('chat:deleted', (event) => {
            const { chatId } = event.data;
            if (this.chatTabBar) {
                this.chatTabBar.removeTab(chatId);
            }
        });
        
        this.eventSystem.register('chat:tab:new', (event) => {
            const state = this.stateManager.getState();
            const activeProject = state.projects.find(p => p.id === state.activeProjectId);
            const scopeDirectory = activeProject ? activeProject.scopeDirectory : null;
            
            const newChatId = this.chatSystem.createChat({
                scopeDirectory: scopeDirectory,
                projectId: activeProject ? activeProject.id : null
            });
        });
        
        this.eventSystem.register('chat:tab:close', (event) => {
            const { chatId } = event.data;
            if (confirm('Are you sure you want to close this chat?')) {
                this.chatSystem.deleteChat(chatId);
            }
        });
        
        this.eventSystem.register('chat:tab:activated', (event) => {
            const { chatId } = event.data;
            const chat = this.chatSystem.getChat(chatId);
            if (chat) {
                // Apply max height setting for this chat
                if (this.chatWindow) {
                    this.chatWindow.setMaxHeight(chat.maxHeight);
                }
                // Render messages
                if (this.chatMessageList) {
                    this.chatMessageList.render(chatId, chat.history || []);
                }
            }
        });
        
        this.eventSystem.register('chat:message:sending', (event) => {
            const { chatId } = event.data;
            const activeChatId = this.chatTabBar ? this.chatTabBar.getActiveTabId() : null;
            if (chatId === activeChatId) {
                if (this.chatMessageList) {
                    this.chatMessageList.hideError();
                    this.chatMessageList.showLoading();
                }
                if (this.chatInput) {
                    this.chatInput.setDisabled(true);
                }
            }
        });
        
        this.eventSystem.register('chat:message:received', (event) => {
            const { chatId, message } = event.data;
            const activeChatId = this.chatTabBar ? this.chatTabBar.getActiveTabId() : null;
            if (chatId === activeChatId && this.chatMessageList) {
                this.chatMessageList.hideLoading();
                if (this.chatInput) {
                    this.chatInput.setDisabled(false);
                }
                const chat = this.chatSystem.getChat(chatId);
                if (chat) {
                    const lastMessage = chat.history[chat.history.length - 1];
                    if (lastMessage) {
                        this.chatMessageList.addMessage(lastMessage.role, lastMessage.content, lastMessage.timestamp);
                    }
                }
            }
        });
        
        this.eventSystem.register('chat:message:error', (event) => {
            const { chatId, error } = event.data;
            const activeChatId = this.chatTabBar ? this.chatTabBar.getActiveTabId() : null;
            if (chatId === activeChatId) {
                if (this.chatMessageList) {
                    this.chatMessageList.hideLoading();
                    this.chatMessageList.showError(error || 'Failed to send message');
                }
                if (this.chatInput) {
                    this.chatInput.setDisabled(false);
                }
            }
        });
        
        this.eventSystem.register('chat:history:updated', (event) => {
            const { chatId, message } = event.data;
            const activeChatId = this.chatTabBar ? this.chatTabBar.getActiveTabId() : null;
            if (chatId === activeChatId && this.chatMessageList && message.role === 'user') {
                this.chatMessageList.addMessage(message.role, message.content, message.timestamp);
            }
        });
        
        this.eventSystem.register('chat:renamed', (event) => {
            const { chatId, newName } = event.data;
            if (this.chatTabBar) {
                this.chatTabBar.updateTabName(chatId, newName);
            }
        });
        
        this.eventSystem.register('chat:settings:saved', (event) => {
            const { chatId, data } = event.data;
            const chat = this.chatSystem.getChat(chatId);
            if (!chat) return;
            
            if (data.name && data.name !== chat.name) {
                this.chatSystem.renameChat(chatId, data.name);
            }
            if (data.scopeDirectory !== undefined) {
                this.chatSystem.setScopeDirectory(chatId, data.scopeDirectory);
            }
            if (data.saveHistory !== undefined) {
                this.chatSystem.setSaveHistory(chatId, data.saveHistory);
            }
            if (data.maxHeight !== undefined) {
                this.chatSystem.setMaxHeight(chatId, data.maxHeight);
                // Apply max height to window if this is the active chat
                const activeChatId = this.chatTabBar ? this.chatTabBar.getActiveTabId() : null;
                if (chatId === activeChatId && this.chatWindow) {
                    this.chatWindow.setMaxHeight(data.maxHeight);
                }
            }
        });
        
        this.eventSystem.register('chat:history:clear', (event) => {
            const { chatId } = event.data;
            this.chatSystem.clearHistory(chatId);
        });
        
        this.eventSystem.register('chat:history:cleared', (event) => {
            const { chatId } = event.data;
            // Update UI
            const activeChatId = this.chatTabBar ? this.chatTabBar.getActiveTabId() : null;
            if (chatId === activeChatId && this.chatMessageList) {
                this.chatMessageList.clear();
            }
        });
        
        // Load existing chats and render tabs
        const allChats = this.chatSystem.getAllChats();
        for (const chat of allChats) {
            if (this.chatTabBar) {
                this.chatTabBar.addTab(chat.id, chat.name);
            }
        }
        if (allChats.length > 0 && this.chatTabBar) {
            this.chatTabBar.setActiveTab(allChats[0].id);
            const firstChat = allChats[0];
            // Apply max height for the first chat
            if (this.chatWindow) {
                this.chatWindow.setMaxHeight(firstChat.maxHeight);
            }
            if (this.chatMessageList) {
                this.chatMessageList.render(firstChat.id, firstChat.history || []);
            }
        }
    }
}

// Initialize app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptSpecApp;
} else {
    window.app = new PromptSpecApp();
}
