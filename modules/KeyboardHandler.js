// Keyboard Handler - Detects and executes keyboard shortcuts
class KeyboardHandler {
    constructor(eventSystem, stateManager, managers = {}) {
        this.eventSystem = eventSystem;
        this.stateManager = stateManager;
        this.shortcuts = new Map();
        
        // Managers for operations
        this.projectManager = managers.projectManager;
        this.sectionManager = managers.sectionManager;
        this.renderingEngine = managers.renderingEngine;
        this.appInstance = managers.appInstance; // For methods not yet in managers
        
        this.setupEventListeners();
        this.registerDefaultShortcuts();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    // Register default shortcuts
    registerDefaultShortcuts() {
        // Ctrl+N for new project
        this.registerShortcut({
            key: 'n',
            ctrl: true,
            shift: false,
            alt: false,
            meta: false
        }, {
            handler: () => {
                const name = prompt('Project name:');
                if (name) {
                    const workflowType = confirm('Use UX-Only workflow? (Click OK for UX-Only, Cancel for Full)') ? 'ux-only' : 'full';
                    if (this.projectManager) {
                        this.projectManager.createProject(name, '', workflowType);
                        if (this.renderingEngine) {
                            this.renderingEngine.renderAll();
                        }
                    }
                }
            },
            description: 'Create new project',
            enabled: true
        });
        
        // Arrow keys for navigation
        this.registerShortcut({
            key: 'ArrowLeft',
            ctrl: false,
            shift: false,
            alt: false,
            meta: false
        }, {
            handler: () => {
                const activeProject = this.stateManager.getActiveProject();
                if (activeProject && this.renderingEngine && this.renderingEngine.activeSectionId) {
                    const navigationService = this.appInstance?.navigationService;
                    if (navigationService) {
                        const prev = navigationService.getPreviousSection(activeProject.id, this.renderingEngine.activeSectionId);
                        if (prev && this.sectionManager) {
                            this.sectionManager.navigateToSection(activeProject.id, prev.id || prev.sectionId);
                        }
                    }
                }
            },
            description: 'Previous section',
            enabled: true
        });
        
        this.registerShortcut({
            key: 'ArrowRight',
            ctrl: false,
            shift: false,
            alt: false,
            meta: false
        }, {
            handler: () => {
                const activeProject = this.stateManager.getActiveProject();
                if (activeProject && this.renderingEngine && this.renderingEngine.activeSectionId) {
                    const navigationService = this.appInstance?.navigationService;
                    if (navigationService) {
                        navigationService.getNextSection(activeProject.id, this.renderingEngine.activeSectionId).then(next => {
                            if (next && this.sectionManager) {
                                this.sectionManager.navigateToSection(activeProject.id, next.sectionId || next.id);
                            }
                        });
                    }
                }
            },
            description: 'Next section',
            enabled: true
        });
        
        // Ctrl+M for modifier editor
        this.registerShortcut({
            key: 'm',
            ctrl: true,
            shift: false,
            alt: false,
            meta: false
        }, {
            handler: () => {
                const activeProject = this.stateManager.getActiveProject();
                if (activeProject && this.renderingEngine && this.renderingEngine.activeSectionId) {
                    if (this.appInstance && this.appInstance.showModifierEditorModal) {
                        this.appInstance.showModifierEditorModal(activeProject.id, this.renderingEngine.activeSectionId);
                    }
                }
            },
            description: 'Edit modifiers',
            enabled: true
        });
        
        // Ctrl+V for validation loop
        this.registerShortcut({
            key: 'v',
            ctrl: true,
            shift: false,
            alt: false,
            meta: false
        }, {
            handler: () => {
                const activeProject = this.stateManager.getActiveProject();
                if (activeProject && this.renderingEngine && this.renderingEngine.activeSectionId) {
                    if (this.sectionManager) {
                        this.sectionManager.invokeProcessStep(activeProject.id, this.renderingEngine.activeSectionId, 'validation-loop');
                    }
                }
            },
            description: 'Invoke validation loop',
            enabled: true
        });
        
        // Legacy shortcuts (for backward compatibility)
        const elementTypes = {
            '1': 'task',
            '2': 'header',
            '3': 'header-checkbox',
            '4': 'multi-checkbox',
            '5': 'one-time'
        };
        
        Object.entries(elementTypes).forEach(([key, type]) => {
            this.registerShortcut({
                key: key,
                ctrl: true,
                shift: true,
                alt: false,
                meta: false
            }, {
                handler: () => {
                    const state = this.stateManager.getState();
                    const targetPageId = state.activePageId || (state.pages && state.pages.length > 0 ? state.pages[0].id : null);
                    if (targetPageId) {
                        this.eventSystem.emit(EventType.KEYBOARD_SHORTCUT_DETECTED, {
                            source: 'KeyboardHandler',
                            data: { action: 'add-element', elementType: type, pageId: targetPageId }
                        });
                    }
                },
                description: `Add ${type} element`,
                enabled: true
            });
        });
    }
    
    // Register a keyboard shortcut
    registerShortcut(shortcutKey, shortcutAction) {
        const key = this.getShortcutKey(shortcutKey);
        this.shortcuts.set(key, shortcutAction);
    }
    
    // Unregister a keyboard shortcut
    unregisterShortcut(shortcutKey) {
        const key = this.getShortcutKey(shortcutKey);
        this.shortcuts.delete(key);
    }
    
    // Handle keydown event
    handleKeyDown(event) {
        // Don't trigger if typing in input/textarea (except for navigation keys)
        if (this.isInputFocused() && !['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)) {
            return;
        }
        
        // Don't trigger if editing page title
        if (event.target.classList.contains('page-title') && event.target.contentEditable === 'true') {
            return;
        }
        
        // Don't trigger if typing in section textareas (except for navigation)
        if (event.target.classList.contains('section-input') || 
            event.target.classList.contains('section-output') || 
            event.target.classList.contains('section-notes')) {
            if (!['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)) {
                return;
            }
        }
        
        // Don't trigger if modal is open (unless it's Escape)
        const modal = document.getElementById('modal');
        if (modal && modal.classList.contains('active') && event.key !== 'Escape') {
            return;
        }
        
        const shortcutKey = {
            key: event.key.toLowerCase(),
            ctrl: event.ctrlKey,
            shift: event.shiftKey,
            alt: event.altKey,
            meta: event.metaKey
        };
        
        const key = this.getShortcutKey(shortcutKey);
        const action = this.shortcuts.get(key);
        
        if (action && action.enabled) {
            event.preventDefault();
            action.handler();
        }
    }
    
    // Check if input is focused
    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true'
        );
    }
    
    // Get shortcut key string
    getShortcutKey(shortcutKey) {
        const parts = [];
        if (shortcutKey.ctrl) parts.push('ctrl');
        if (shortcutKey.shift) parts.push('shift');
        if (shortcutKey.alt) parts.push('alt');
        if (shortcutKey.meta) parts.push('meta');
        parts.push(shortcutKey.key);
        return parts.join('+');
    }
}

