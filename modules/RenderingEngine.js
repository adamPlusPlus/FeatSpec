// Rendering Engine - Renders UI components to DOM
class RenderingEngine {
    constructor(eventSystem, stateManager, dragDropHandler, services = {}, managers = {}, errorHandler = null) {
        this.eventSystem = eventSystem;
        this.stateManager = stateManager;
        this.dragDropHandler = dragDropHandler;
        this.errorHandler = errorHandler;
        this.container = document.getElementById('pages-container'); // Legacy
        this.activeProjectId = null;
        this.activeSectionId = null;
        
        // Services for business logic
        this.sectionLogic = services.sectionLogic;
        this.navigation = services.navigation;
        this.caseInfo = services.caseInfo;
        this.workflowContext = services.workflowContext;
        this.processSteps = services.processSteps;
        this.placeholder = services.placeholder;
        
        // Managers for operations
        this.projectManager = managers.projectManager;
        this.sectionManager = managers.sectionManager;
        this.uiManager = managers.uiManager;
        this.multiAgentAutomation = managers.multiAgentAutomation; // For agent discussions
        this.appInstance = managers.appInstance; // For methods not yet in managers
        
        // Track event listeners for cleanup
        this.eventListenerCleanups = [];
        
        // Change detection: track previous state snapshot
        this.previousState = null;
        
        // RenderQueue for batching renders
        this.renderQueue = typeof window !== 'undefined' && window.renderQueue ? window.renderQueue : null;
        
        // VirtualList instances for large lists
        this.projectsVirtualList = null;
        this.sectionsVirtualList = null;
        
        this.setupEventListeners();
        this.setupDynamicEventListeners();
    }
    
    setupDynamicEventListeners() {
        // Use event delegation for dynamically generated buttons
        const clickHandler = (e) => {
            const action = e.target.dataset.action;
            if (!action) return;
            
            const projectId = e.target.dataset.projectId;
            const sectionId = e.target.dataset.sectionId;
            const modifier = e.target.dataset.modifier;
            
            switch (action) {
                case 'navigate-section':
                    if (projectId && sectionId && this.sectionManager) {
                        this.sectionManager.navigateToSection(projectId, sectionId);
                    }
                    break;
                case 'paste-previous':
                    if (projectId && sectionId && this.sectionManager) {
                        this.sectionManager.pasteFromPreviousSection(projectId, sectionId);
                    }
                    break;
                case 'mark-complete':
                    if (projectId && sectionId && this.sectionManager) {
                        this.sectionManager.markSectionComplete(projectId, sectionId);
                        this.queueRender(['sections', 'pipeline']); // Only sections and pipeline need update
                    }
                    break;
                case 'mark-revision':
                    if (projectId && sectionId && this.sectionManager) {
                        this.sectionManager.markSectionNeedsRevision(projectId, sectionId);
                        this.queueRender(['sections', 'pipeline']); // Only sections and pipeline need update
                    }
                    break;
                case 'copy-prompt-input':
                    if (projectId && sectionId && this.appInstance) {
                        this.appInstance.copyPromptWithInput?.(projectId, sectionId);
                    }
                    break;
                case 'edit-modifiers':
                    if (projectId && sectionId && this.appInstance) {
                        this.appInstance.showModifierEditorModal?.(projectId, sectionId);
                    }
                    break;
                case 'remove-modifier':
                    if (projectId && sectionId && modifier && this.appInstance) {
                        this.appInstance.removeModifier?.(projectId, sectionId, modifier);
                    }
                    break;
                case 'show-agent-conversations':
                    if (projectId && sectionId && this.appInstance) {
                        e.stopPropagation();
                        this.appInstance.showAgentConversations?.(projectId, sectionId);
                    }
                    break;
                case 'delete-page':
                    if (e.target.dataset.pageId && this.appInstance) {
                        if (confirm('Delete this page?')) {
                            this.appInstance.deletePage?.(e.target.dataset.pageId);
                        }
                    }
                    break;
                case 'remove-multi-checkbox-item':
                    if (e.target.dataset.pageId && e.target.dataset.elementIndex !== undefined && e.target.dataset.itemIndex !== undefined && this.appInstance) {
                        this.appInstance.removeMultiCheckboxItem?.(
                            e.target.dataset.pageId,
                            parseInt(e.target.dataset.elementIndex),
                            parseInt(e.target.dataset.itemIndex)
                        );
                    }
                    break;
                case 'add-multi-checkbox-item':
                    if (e.target.dataset.pageId && e.target.dataset.elementIndex !== undefined && this.appInstance) {
                        this.appInstance.addMultiCheckboxItem?.(
                            e.target.dataset.pageId,
                            parseInt(e.target.dataset.elementIndex)
                        );
                    }
                    break;
            }
        };
        
        // Track document-level listeners for cleanup
        if (typeof window !== 'undefined' && window.eventListenerManager) {
            window.eventListenerManager.add(document, 'click', clickHandler);
        } else {
            document.addEventListener('click', clickHandler);
            this.eventListenerCleanups.push(() => {
                document.removeEventListener('click', clickHandler);
            });
        }
        
        // Handle select change events
        const changeHandler = (e) => {
            if (e.target.classList.contains('section-jump') && e.target.dataset.action === 'navigate-section-select') {
                const projectId = e.target.dataset.projectId;
                const sectionId = e.target.value;
                if (projectId && sectionId && this.sectionManager) {
                    this.sectionManager.navigateToSection(projectId, sectionId);
                }
            }
            // Handle automation ID updates
            if (e.target.dataset.action === 'update-automation-id') {
                const projectId = e.target.dataset.projectId;
                const sectionId = e.target.dataset.sectionId;
                const value = e.target.value;
                if (projectId && sectionId && this.appInstance && this.appInstance.updateAutomationId) {
                    this.appInstance.updateAutomationId(projectId, sectionId, value);
                }
            }
        };
        
        if (typeof window !== 'undefined' && window.eventListenerManager) {
            window.eventListenerManager.add(document, 'change', changeHandler);
        } else {
            document.addEventListener('change', changeHandler);
            this.eventListenerCleanups.push(() => {
                document.removeEventListener('change', changeHandler);
            });
        }
        
        // Handle blur events for automation ID validation
        const blurHandler = (e) => {
            if (e.target.dataset.actionBlur === 'validate-automation-id') {
                const projectId = e.target.dataset.projectId;
                const sectionId = e.target.dataset.sectionId;
                const value = e.target.value;
                if (projectId && sectionId && this.appInstance && this.appInstance.validateAutomationId) {
                    this.appInstance.validateAutomationId(projectId, sectionId, value);
                }
            }
        };
        
        if (typeof window !== 'undefined' && window.eventListenerManager) {
            window.eventListenerManager.add(document, 'blur', blurHandler, true);
        } else {
            document.addEventListener('blur', blurHandler, true);
            this.eventListenerCleanups.push(() => {
                document.removeEventListener('blur', blurHandler, true);
            });
        }
    }
    
    /**
     * Cleanup event listeners
     */
    cleanup() {
        // Cleanup document-level listeners
        if (typeof window !== 'undefined' && window.eventListenerManager) {
            window.eventListenerManager.cleanup(document);
        } else {
            // Fallback: use stored cleanup functions
            this.eventListenerCleanups.forEach(cleanup => cleanup());
            this.eventListenerCleanups = [];
        }
        
        // Note: Element-level listeners are automatically cleaned up when elements are removed
        // EventSystem listeners are managed by EventSystem and don't need cleanup here
    }
    
    setupEventListeners() {
        // Listen for state changes and queue incremental render
        this.eventSystem.register(EventType.STATE_CHANGED, (event) => {
            this.queueRender(['projects', 'sections', 'pipeline']);
        });
        
        // Listen for project changes - queue specific component renders
        this.eventSystem.register(EventType.PROJECT_CREATED, () => {
            this.queueRender(['projects'], 10); // High priority
        });
        this.eventSystem.register(EventType.PROJECT_DELETED, () => {
            this.queueRender(['projects', 'sections', 'pipeline'], 10); // High priority
        });
        this.eventSystem.register(EventType.PROJECT_UPDATED, () => {
            this.queueRender(['projects', 'sections', 'pipeline']);
        });
        this.eventSystem.register(EventType.PROJECT_ACTIVATED, () => {
            this.queueRender(['projects', 'sections', 'pipeline'], 10); // High priority - major change
        });
        this.eventSystem.register(EventType.SECTION_UPDATED, () => {
            this.queueRender(['sections', 'pipeline']); // Sections and pipeline affected
        });
        
        // Legacy page/element events (for backward compatibility)
        this.eventSystem.register(EventType.PAGE_ADDED, () => this.renderAll());
        this.eventSystem.register(EventType.PAGE_DELETED, () => this.renderAll());
        this.eventSystem.register(EventType.PAGE_REORDERED, () => this.renderAll());
        this.eventSystem.register(EventType.ELEMENT_ADDED, () => this.renderAll());
        this.eventSystem.register(EventType.ELEMENT_DELETED, () => this.renderAll());
        this.eventSystem.register(EventType.ELEMENT_UPDATED, () => this.renderAll());
        this.eventSystem.register(EventType.ELEMENT_REORDERED, () => this.renderAll());
    }
    
    /**
     * Detect changes between old and new state
     * @private
     * @param {Object} oldState - Previous state snapshot
     * @param {Object} newState - Current state
     * @returns {Object} Object with changed component flags
     */
    _detectChanges(oldState, newState) {
        if (!oldState) {
            // First render - everything needs rendering
            return { projects: true, sections: true, pipeline: true };
        }
        
        const changes = {
            projects: false,
            sections: false,
            pipeline: false
        };
        
        // Check if projects changed
        if (!oldState.projects || !newState.projects) {
            changes.projects = oldState.projects !== newState.projects;
        } else {
            // Compare projects array
            if (oldState.projects.length !== newState.projects.length) {
                changes.projects = true;
            } else if (oldState.activeProjectId !== newState.activeProjectId) {
                changes.projects = true;
            } else {
                // Deep compare projects
                for (let i = 0; i < oldState.projects.length; i++) {
                    const oldProject = oldState.projects[i];
                    const newProject = newState.projects[i];
                    if (oldProject.id !== newProject.id || 
                        oldProject.name !== newProject.name ||
                        JSON.stringify(oldProject.sections) !== JSON.stringify(newProject.sections)) {
                        changes.projects = true;
                        break;
                    }
                }
            }
        }
        
        // Check if active project or section changed
        if (oldState.activeProjectId !== newState.activeProjectId ||
            oldState.activeSectionId !== newState.activeSectionId) {
            changes.sections = true;
            changes.pipeline = true;
        }
        
        // Check if sections changed (if active project exists)
        if (newState.activeProjectId && !changes.sections) {
            const oldProject = oldState.projects?.find(p => p.id === oldState.activeProjectId);
            const newProject = newState.projects?.find(p => p.id === newState.activeProjectId);
            if (oldProject && newProject) {
                if (oldProject.sections.length !== newProject.sections.length) {
                    changes.sections = true;
                    changes.pipeline = true;
                } else {
                    // Compare sections
                    for (let i = 0; i < oldProject.sections.length; i++) {
                        const oldSection = oldProject.sections[i];
                        const newSection = newProject.sections[i];
                        if (oldSection.sectionId !== newSection.sectionId ||
                            oldSection.status !== newSection.status ||
                            oldSection.input !== newSection.input ||
                            oldSection.output !== newSection.output) {
                            changes.sections = true;
                            changes.pipeline = true;
                            break;
                        }
                    }
                }
            }
        }
        
        return changes;
    }
    
    /**
     * Queue components for rendering using RenderQueue
     * @param {Array<string>|string} components - Component(s) to render ('projects', 'sections', 'pipeline')
     * @param {number} priority - Render priority (default: 0)
     */
    queueRender(components, priority = 0) {
        if (!this.renderQueue) {
            // Fallback to immediate render if RenderQueue not available
            this.renderAll();
            return;
        }
        
        const componentArray = Array.isArray(components) ? components : [components];
        for (const component of componentArray) {
            this.renderQueue.queueRender(component, priority);
        }
        
        // Setup flush callback if not already done
        if (!this._renderFlushCallback) {
            this._renderFlushCallback = (component) => {
                this.render(component);
            };
            
            // Store original flush method
            if (!this._originalFlush) {
                this._originalFlush = this.renderQueue.flush.bind(this.renderQueue);
                // Override flush to use our callback
                this.renderQueue.flush = () => {
                    return this._originalFlush(this._renderFlushCallback);
                };
            }
        }
    }
    
    /**
     * Render specific component(s)
     * @param {string|Array<string>} component - Component(s) to render ('projects', 'sections', 'pipeline')
     */
    render(component) {
        const state = this.stateManager.getState();
        
        // Check if using new format (projects) or old format (pages)
        if (state.projects && Array.isArray(state.projects)) {
            const components = Array.isArray(component) ? component : [component];
            
            for (const comp of components) {
                switch (comp) {
                    case 'projects':
                        this.renderProjectsSidebar();
                        break;
                    case 'sections':
                        this.renderSectionView();
                        break;
                    case 'pipeline':
                        this.renderPipelineFlowView();
                        break;
                    default:
                        // Unknown component - skip
                        break;
                }
            }
        } else if (state.pages && Array.isArray(state.pages)) {
            // Legacy rendering for old format
            this.renderLegacyPages();
        }
        
        // Update state snapshot after render
        try {
            this.previousState = JSON.parse(JSON.stringify(state));
        } catch (error) {
            // If state is too large or circular, just store reference
            this.previousState = state;
        }
    }
    
    // Render all - checks for new format (projects) or old format (pages)
    // This is kept for backward compatibility and full renders when needed
    renderAll() {
        const state = this.stateManager.getState();
        
        // Check if using new format (projects) or old format (pages)
        if (state.projects && Array.isArray(state.projects)) {
            // Use change detection to only render what changed
            const changes = this._detectChanges(this.previousState, state);
            
            if (changes.projects) {
                this.renderProjectsSidebar();
            }
            if (changes.sections) {
                this.renderSectionView();
            }
            if (changes.pipeline) {
                this.renderPipelineFlowView();
            }
            
            // If nothing changed but this is first render, render everything
            if (!this.previousState) {
                this.renderProjectsSidebar();
                this.renderSectionView();
                this.renderPipelineFlowView();
            }
        } else if (state.pages && Array.isArray(state.pages)) {
            // Legacy rendering for old format
            this.renderLegacyPages();
        }
        
        // Update state snapshot after render
        this.previousState = JSON.parse(JSON.stringify(state));
    }
    
    // Render projects sidebar
    renderProjectsSidebar() {
        const sidebar = document.getElementById('projects-list');
        if (!sidebar) return;
        
        const state = this.stateManager.getState();
        const activeProjectId = state.activeProjectId;
        
        if (state.projects.length === 0) {
            // Clear sidebar efficiently
            while (sidebar.firstChild) {
                sidebar.removeChild(sidebar.firstChild);
            }
            // Static message - safe
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'empty-message';
            emptyMsg.textContent = 'No projects yet. Create a project to get started!';
            sidebar.appendChild(emptyMsg);
            // Clean up virtual list if exists
            if (this.projectsVirtualList) {
                this.projectsVirtualList.destroy();
                this.projectsVirtualList = null;
            }
            return;
        }
        
        // Use VirtualList for large lists (> 20 projects)
        const VIRTUAL_LIST_THRESHOLD = 20;
        if (state.projects.length > VIRTUAL_LIST_THRESHOLD && typeof window !== 'undefined' && window.VirtualList) {
            // Use virtual list
            if (!this.projectsVirtualList) {
                // Clear sidebar
                while (sidebar.firstChild) {
                    sidebar.removeChild(sidebar.firstChild);
                }
                
                // Create virtual list
                this.projectsVirtualList = new window.VirtualList(sidebar, {
                    itemHeight: 80, // Estimated project item height
                    overscan: 3,
                    renderItem: (project, index) => {
                        return this.renderProjectItem(project, activeProjectId === project.id);
                    }
                });
            }
            
            // Update items
            this.projectsVirtualList.setItems(state.projects);
        } else {
            // Use normal rendering for small lists
            if (this.projectsVirtualList) {
                this.projectsVirtualList.destroy();
                this.projectsVirtualList = null;
            }
            
            // Clear sidebar efficiently
            while (sidebar.firstChild) {
                sidebar.removeChild(sidebar.firstChild);
            }
            
            // Use DocumentFragment for batch DOM operations
            const fragment = document.createDocumentFragment();
            state.projects.forEach(project => {
                const projectEl = this.renderProjectItem(project, activeProjectId === project.id);
                fragment.appendChild(projectEl);
            });
            
            // Append fragment once (single reflow)
            sidebar.appendChild(fragment);
        }
    }
    
    // Render a single project item in sidebar
    renderProjectItem(project, isActive) {
        const item = document.createElement('div');
        item.className = `project-item ${isActive ? 'active' : ''}`;
        item.dataset.projectId = project.id;
        
        // Calculate completion percentage
        const progress = this.sectionLogic ? this.sectionLogic.calculateProgress(project).percentage : 0;
        
        // Status indicator
        const statusIcon = this.sectionLogic ? this.sectionLogic.getProjectStatusIcon(project) : '○';
        
        // Get case information
        const caseNumber = project.case || 1;
        const caseBadge = this.caseInfo ? this.caseInfo.renderCaseBadge(caseNumber, project.caseChain) : `<span class="case-badge case-${caseNumber}">Case ${caseNumber}</span>`;
        
        // Count inference steps for Case 2
        const inferenceStepCount = project.case === 2 ? 
            project.sections.filter(s => s.isInferenceStep).length : 0;
        
        // Count process steps
        const processStepCount = project.sections.filter(s => s.isProcessStep).length;
        
        // Automation engine indicator
        const automationEngine = project.automationEngine || 'file-watching';
        let engineBadge = '';
        if (automationEngine === 'cursor-cli') {
            engineBadge = '<span class="engine-badge" title="Cursor CLI Automation">🔧</span>';
        } else if (automationEngine === 'multi-agent') {
            engineBadge = '<span class="engine-badge" title="Multi-Agent Automation">🤖</span>';
        }
        
        // project.name is user data - escape and use safeSetInnerHTML
        const itemHtml = `
            <div class="project-item-header">
                <span class="project-status">${statusIcon}</span>
                <span class="project-name">${this.escapeHtml(project.name)}</span>
                ${engineBadge}
            </div>
            <div class="project-meta">
                ${caseBadge}
                ${project.caseChain ? `<span class="case-chain-indicator" title="Enhanced from Case ${project.caseChain.previousCase}">🔗</span>` : ''}
                ${inferenceStepCount > 0 ? `<span class="inference-count" title="${inferenceStepCount} inference steps">🔍 ${inferenceStepCount}</span>` : ''}
                ${processStepCount > 0 ? `<span class="process-count" title="${processStepCount} process steps">⚙️ ${processStepCount}</span>` : ''}
                <span class="project-progress">${progress}%</span>
            </div>
        `;
        
        item.addEventListener('click', () => {
            this.stateManager.setActiveProject(project.id);
            // Auto-navigate to first incomplete section
            let firstIncomplete = null;
            if (this.navigation) {
                try {
                    firstIncomplete = this.navigation.getFirstIncompleteSection(project.id);
                } catch (error) {
                    if (this.errorHandler) {
                        this.errorHandler.handleError(error, {
                            source: 'RenderingEngine',
                            operation: 'renderAll',
                            projectId: project.id
                        });
                    } else {
                        console.warn('Error getting first incomplete section:', error);
                    }
                }
            }
            if (firstIncomplete) {
                this.activeSectionId = firstIncomplete.id || firstIncomplete.sectionId;
            }
            this.queueRender(['projects', 'sections', 'pipeline'], 10); // High priority - user action
        });
        
        return item;
    }
    
    // Render case badge (delegates to CaseInfoService)
    renderCaseBadge(caseNumber, caseChain = null) {
        if (this.caseInfo) {
            return this.caseInfo.renderCaseBadge(caseNumber, caseChain);
        }
        // Fallback if service not available
        return `<span class="case-badge case-${caseNumber}" title="Case ${caseNumber}">Case ${caseNumber}</span>`;
    }
    
    // Get case display name (delegates to CaseInfoService)
    getCaseDisplayName(caseNumber) {
        if (this.caseInfo) {
            return this.caseInfo.getCaseDisplayName(caseNumber);
        }
        // Fallback if service not available
        return `Case ${caseNumber}`;
    }
    
    // Render section type badge
    renderSectionTypeBadge(section) {
        let badge = '';
        if (section.isProcessStep) {
            badge = `<span class="section-type-badge process-step-badge" title="Process Step">⚙️ Process</span>`;
        } else if (section.isInferenceStep) {
            badge = `<span class="section-type-badge inference-step-badge" title="Inference Step">🔍 Inference</span>`;
        } else {
            badge = `<span class="section-type-badge core-step-badge" title="Core Step">📋 Core</span>`;
        }
        
        // Add optional indicator if step is optional
        if (section.isOptional) {
            badge += ` <span class="section-type-badge section-type-badge-optional" title="This step is optional and can be skipped">Optional</span>`;
        }
        
        return badge;
    }
    
    // Render modifier tags
    renderModifierTags(modifiers, projectId, sectionId, editable = true) {
        if (!modifiers || modifiers.length === 0) {
            return '<div class="modifier-tags"><span class="no-modifiers">No modifiers</span></div>';
        }
        
        const pipelineConfig = window.PipelineConfig;
        const modifierLayering = pipelineConfig?.config?.modifierLayering;
        const baseModifiers = modifierLayering?.priority?.base || [];
        const layeringModifiers = modifierLayering?.priority?.layering || [];
        
        const modifierTags = modifiers.map(modifier => {
            const isBase = baseModifiers.includes(modifier);
            const isLayering = layeringModifiers.includes(modifier);
            const modifierClass = isLayering ? 'modifier-tag layering' : 'modifier-tag base';
            const removeBtn = editable ? 
                `<button class="modifier-remove" data-action="remove-modifier" data-project-id="${projectId}" data-section-id="${sectionId}" data-modifier="${modifier}" title="Remove modifier">×</button>` : '';
            
            return `<span class="${modifierClass}" title="${modifier}">
                ${modifier}
                ${removeBtn}
            </span>`;
        }).join('');
        
        const editBtn = editable ? 
            `<button class="btn-edit-modifiers" data-action="edit-modifiers" data-project-id="${projectId}" data-section-id="${sectionId}" title="Edit modifiers">✏️ Edit</button>` : '';
        
        return `<div class="modifier-tags">
            ${modifierTags}
            ${editBtn}
        </div>`;
    }
    
    // Render section view
    renderSectionView() {
        const sectionView = document.getElementById('section-view');
        if (!sectionView) return;
        
        const state = this.stateManager.getState();
        const activeProject = this.stateManager.getActiveProject();
        
        if (!activeProject) {
            sectionView.innerHTML = '<div class="section-view-placeholder"><p>Select a project to begin</p></div>';
            return;
        }
        
        // If no active section, use first incomplete or first section
        if (!this.activeSectionId) {
            // Safely get first incomplete section
            let firstIncomplete = null;
            if (this.navigation) {
                try {
                    firstIncomplete = this.navigation.getFirstIncompleteSection(activeProject.id);
                } catch (error) {
                    if (this.errorHandler) {
                        this.errorHandler.handleError(error, {
                            source: 'RenderingEngine',
                            operation: 'renderAll',
                            projectId: project.id
                        });
                    } else {
                        console.warn('Error getting first incomplete section:', error);
                    }
                }
            }
            this.activeSectionId = firstIncomplete?.id || firstIncomplete?.sectionId || activeProject.sections[0]?.sectionId;
        }
        
        const section = activeProject.sections.find(s => s.sectionId === this.activeSectionId);
        if (!section) {
            // Static message - safe
            sectionView.innerHTML = '<div class="section-view-placeholder"><p>No section selected</p></div>';
            return;
        }
        
        // Save scroll position and focus state before re-rendering
        const scrollTop = sectionView.scrollTop;
        const activeElement = document.activeElement;
        const isTextareaFocused = activeElement && activeElement.tagName === 'TEXTAREA' && (
            activeElement.classList.contains('section-input') ||
            activeElement.classList.contains('section-output') ||
            activeElement.classList.contains('section-notes') ||
            activeElement.classList.contains('section-override-instructions')
        );
        const textareaType = isTextareaFocused ? 
            (activeElement.classList.contains('section-input') ? 'input' :
             activeElement.classList.contains('section-output') ? 'output' :
             activeElement.classList.contains('section-override-instructions') ? 'override-instructions' : 'notes') : null;
        const cursorPosition = isTextareaFocused ? activeElement.selectionStart : null;
        const textareaScrollTop = isTextareaFocused ? activeElement.scrollTop : null;
        const textareaSectionId = isTextareaFocused ? activeElement.dataset.sectionId : null;
        
        // renderSectionContent is now async, so we need to await it
        this.renderSectionContent(activeProject, section).then(html => {
            sectionView.innerHTML = html;
            
            // Load process step buttons asynchronously
            this.loadProcessStepButtons(activeProject, section);
            
            // Load input placeholder asynchronously
            this.loadInputPlaceholder(activeProject, section);
        }).catch(error => {
            if (this.errorHandler) {
                this.errorHandler.handleError(error, {
                    source: 'RenderingEngine',
                    operation: 'renderSectionView',
                    projectId: activeProject.id,
                    sectionId: section.sectionId
                });
                this.errorHandler.showUserNotification(error, {
                    source: 'RenderingEngine',
                    operation: 'renderSectionView'
                }, {
                    severity: ErrorHandler.Severity.ERROR,
                    title: 'Rendering Error'
                });
            } else {
                console.error('Error rendering section content:', error);
            }
            // Static error message - safe
            sectionView.innerHTML = '<div class="error">Error rendering section</div>';
        });
        
        // DIAGNOSTIC: Log rendered automation ID after DOM update (disabled to reduce console noise)
        // Uncomment below for debugging automation ID issues
        /*
        requestAnimationFrame(() => {
            const automationIdInput = document.getElementById(`automation-id-${section.sectionId}`);
            if (automationIdInput) {
                console.log(`[DIAG] RenderingEngine - Rendered automationId for section ${section.sectionId}: State="${section.automationId || 'undefined'}", UI="${automationIdInput.value || 'empty'}"`);
            }
        });
        */
        
        // Restore scroll position and focus after DOM update
        requestAnimationFrame(() => {
            // Restore scroll position
            if (scrollTop > 0) {
                sectionView.scrollTop = scrollTop;
            }
            
            // Restore focus and cursor position if it was a textarea
            if (isTextareaFocused && textareaSectionId === section.sectionId && textareaType) {
                // Build selector - handle override-instructions specially
                let selector;
                if (textareaType === 'override-instructions') {
                    selector = `.section-override-instructions[data-section-id="${section.sectionId}"]`;
                } else {
                    selector = `.section-${textareaType}[data-section-id="${section.sectionId}"]`;
                }
                
                // Function to restore scroll and focus
                const restoreTextareaState = (textarea) => {
                    if (!textarea) return;
                    
                    // Save current scroll position to prevent it from being lost
                    const savedScrollTop = textareaScrollTop;
                    
                    // Restore scroll position BEFORE focus to prevent scroll jump
                    if (savedScrollTop !== null && savedScrollTop >= 0) {
                        textarea.scrollTop = savedScrollTop;
                    }
                    
                    // Restore focus and cursor position
                    textarea.focus({ preventScroll: true }); // Try to prevent scroll on focus
                    if (cursorPosition !== null && cursorPosition <= textarea.value.length) {
                        textarea.setSelectionRange(cursorPosition, cursorPosition);
                    }
                    
                    // Force scroll position again immediately after focus
                    if (savedScrollTop !== null && savedScrollTop >= 0) {
                        textarea.scrollTop = savedScrollTop;
                    }
                };
                
                // Try to find and restore immediately
                const newTextarea = sectionView.querySelector(selector);
                if (newTextarea) {
                    // Restore multiple times to ensure it sticks
                    // First attempt - immediate
                    restoreTextareaState(newTextarea);
                    
                    // Second attempt - after a short delay
                    setTimeout(() => {
                        restoreTextareaState(newTextarea);
                    }, AppConstants.TIMEOUTS.TEXTAREA_RESTORE);
                    
                    // Third attempt - after layout
                    requestAnimationFrame(() => {
                        restoreTextareaState(newTextarea);
                        
                        // Fourth attempt - after another frame
                        requestAnimationFrame(() => {
                            restoreTextareaState(newTextarea);
                        });
                    });
                } else {
                    // If textarea not found immediately, try again after a delay
                    setTimeout(() => {
                        const retryTextarea = sectionView.querySelector(selector);
                        if (retryTextarea) {
                            restoreTextareaState(retryTextarea);
                        }
                    }, 50);
                }
            }
        });
    }
    
    // Load process step buttons asynchronously
    async loadProcessStepButtons(project, section) {
        if (section.isProcessStep) {
            return; // Don't show process step buttons on process step sections themselves
        }
        
        const container = document.querySelector(`.process-step-buttons-container[data-project-id="${project.id}"][data-section-id="${section.sectionId}"]`);
        if (!container) return;
        
        if (!this.processSteps) {
            container.innerHTML = '';
            return;
        }
        
        try {
            const triggers = await this.processSteps.getProcessStepTriggers(project.id, section.sectionId, project, section);
            if (!triggers || triggers.length === 0) {
                container.innerHTML = '';
                return;
            }
            
            // renderProcessStepButtons returns trusted HTML template
            const buttonsHtml = this.processSteps.renderProcessStepButtons(triggers, project.id, section.sectionId);
            if (window.safeSetInnerHTML) {
                window.safeSetInnerHTML(container, buttonsHtml, { trusted: true });
            } else {
                container.innerHTML = buttonsHtml;
            }
            
            // Attach event listeners for process step buttons
            container.querySelectorAll('[data-action="invoke-process-step"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const projectId = btn.dataset.projectId;
                    const sectionId = btn.dataset.sectionId;
                    const processStep = btn.dataset.processStep;
                    if (projectId && sectionId && processStep && this.sectionManager) {
                        this.sectionManager.invokeProcessStep(projectId, sectionId, processStep);
                    }
                });
            });
        } catch (error) {
            if (this.errorHandler) {
                this.errorHandler.handleError(error, {
                    source: 'RenderingEngine',
                    operation: 'loadProcessStepButtons',
                    projectId: project.id,
                    sectionId: section.sectionId
                });
            } else {
                console.error('Error loading process step buttons:', error);
            }
            container.innerHTML = '';
        }
    }
    
    // Load input placeholder asynchronously
    async loadInputPlaceholder(project, section) {
        const textarea = document.querySelector(`.section-input[data-project-id="${project.id}"][data-section-id="${section.sectionId}"]`);
        if (!textarea) return;
        
        if (!this.placeholder) {
            textarea.placeholder = 'Enter input for this section...';
            return;
        }
        
        try {
            const placeholder = this.placeholder ? await this.placeholder.getInputPlaceholder(section, project) : 'Enter input for this section...';
            if (placeholder) {
                textarea.placeholder = placeholder;
            }
        } catch (error) {
            if (this.errorHandler) {
                this.errorHandler.handleError(error, {
                    source: 'RenderingEngine',
                    operation: 'loadInputPlaceholder',
                    projectId: project.id,
                    sectionId: section.sectionId
                });
            } else {
                console.warn('Failed to load input placeholder:', error);
            }
            textarea.placeholder = 'Enter input for this section...';
        }
    }
    
    /**
     * Prepare data for section content rendering
     * @private
     * @returns {Object} Object with all data needed for rendering
     */
    async _prepareSectionContentData(project, section) {
        // Check dependencies
        let deps = { met: true, missing: [] };
        if (this.sectionLogic) {
            try {
                deps = this.sectionLogic.checkDependencies(project.id, section.sectionId) || { met: true, missing: [] };
            } catch (error) {
                console.warn('Error checking dependencies:', error);
            }
        }
        const isLocked = !deps.met;
        
        // Status indicator
        const statusInfo = this.sectionLogic ? this.sectionLogic.determineStatus(section) : { class: 'status-not-started', text: 'Not Started', icon: '○' };
        const statusClass = statusInfo.class;
        const statusText = statusInfo.text;
        
        // Navigation
        const prevSection = this.navigation ? this.navigation.getPreviousSection(project.id, section.sectionId) : null;
        const nextSection = this.navigation ? await this.navigation.getNextSection(project.id, section.sectionId) : null;
        
        // Get case information
        const caseNumber = project.case || 1;
        const caseBadge = this.renderCaseBadge(caseNumber, project.caseChain);
        const caseChainInfo = this.caseInfo ? this.caseInfo.getCaseChainInfo(project.caseChain) : '';
        
        // Get workflow context (step position)
        const workflowInfo = this.workflowContext ? this.workflowContext.getWorkflowContext(project.id, section.sectionId) : { contextString: '' };
        const workflowContext = workflowInfo.contextString;
        
        // Get section type badge
        const sectionTypeBadge = this.renderSectionTypeBadge(section);
        
        return {
            deps,
            isLocked,
            statusClass,
            statusText,
            prevSection,
            nextSection,
            caseBadge,
            caseChainInfo,
            workflowContext,
            sectionTypeBadge
        };
    }
    
    /**
     * Render section header HTML
     * @private
     * @returns {string} HTML string for section header
     */
    _renderSectionHeader(data, project, section) {
        return `
            <div class="section-case-header">
                ${data.caseBadge}
                ${data.caseChainInfo}
                <span class="workflow-context">${data.workflowContext}</span>
                ${data.sectionTypeBadge}
            </div>
            <div class="section-header">
                <div class="section-title-row">
                    <h2 class="section-title">${this.escapeHtml(section.sectionName)}</h2>
                    <span class="section-status ${data.statusClass}">${data.statusText}</span>
                </div>
                <div class="section-automation-id-row">
                    <label for="automation-id-${section.sectionId}" style="font-size: 12px; color: #b8b8b8; margin-right: 8px;">Automation ID:</label>
                    <input 
                        type="text" 
                        id="automation-id-${section.sectionId}" 
                        name="automation-id-${section.sectionId}"
                        class="automation-id-input" 
                        data-project-id="${project.id}" 
                        data-section-id="${section.sectionId}"
                        value="${this.escapeHtml(section.automationId || '')}" 
                        placeholder="auto"
                        maxlength="20"
                        style="padding: 4px 8px; border: 1px solid #404040; background: #1a1a1a; color: #e0e0e0; border-radius: 4px; font-size: 12px; width: 100px;"
                        data-action="update-automation-id" data-project-id="${project.id}" data-section-id="${section.sectionId}"
                        data-action-blur="validate-automation-id" data-project-id="${project.id}" data-section-id="${section.sectionId}"
                    />
                    <span class="automation-id-status" id="automation-id-status-${section.sectionId}" style="margin-left: 8px; font-size: 11px;"></span>
                </div>
                <div class="section-navigation">
                    <button class="btn-nav" ${!data.prevSection ? 'disabled' : ''} onclick="app.navigateToSection('${project.id}', '${data.prevSection?.sectionId || ''}')">← Previous</button>
                    <select class="section-jump" data-action="navigate-section-select" data-project-id="${project.id}">
                        ${project.sections.map(s => 
                            `<option value="${s.sectionId}" ${s.sectionId === section.sectionId ? 'selected' : ''}>${s.sectionName}</option>`
                        ).join('')}
                    </select>
                    <button class="btn-nav" ${!data.nextSection ? 'disabled' : ''} data-action="navigate-section" data-project-id="${project.id}" data-section-id="${data.nextSection?.sectionId || ''}">Next →</button>
                </div>
            </div>
        `;
    }
    
    /**
     * Render section locked message
     * @private
     * @returns {string} HTML string for locked message or empty string
     */
    _renderSectionLockedMessage(data, project) {
        if (!data.isLocked) return '';
        
        return `
            <div class="section-locked">
                <p>⚠️ This section is locked. Complete the following sections first:</p>
                <ul>
                    ${data.deps.missing.map(depId => {
                        const depSection = project.sections.find(s => s.sectionId === depId);
                        return `<li>${depSection?.sectionName || depId}</li>`;
                    }).join('')}
                </ul>
            </div>
        `;
    }
    
    /**
     * Render inference step indicator
     * @private
     * @returns {string} HTML string for inference indicator or empty string
     */
    _renderInferenceStepIndicator(section) {
        if (!section.isInferenceStep) return '';
        
        return `
            <div class="inference-step-indicator">
                <span class="inference-badge">🔍 Inference Step</span>
                <p>This is an inference step that generates implementation details from UX specifications.</p>
            </div>
        `;
    }
    
    /**
     * Render modifiers section
     * @private
     * @returns {string} HTML string for modifiers section
     */
    _renderModifiersSection(section, project) {
        return `
            <div class="section-modifiers ${(!section.modifiers || section.modifiers.length === 0) ? 'collapsed' : ''}" 
                 data-project-id="${project.id}" 
                 data-section-id="${section.sectionId}">
                <h4>Active Modifiers</h4>
                <div class="modifier-content">
                    ${this.renderModifierTags(section.modifiers || [], project.id, section.sectionId, true)}
                </div>
            </div>
            <div class="process-step-buttons-container" data-project-id="${project.id}" data-section-id="${section.sectionId}">
                <!-- Process step buttons will be loaded asynchronously -->
            </div>
        `;
    }
    
    /**
     * Render section panels (prompt, input, output, notes)
     * @private
     * @returns {string} HTML string for section panels
     */
    _renderSectionPanels(project, section) {
        return `
            <div class="section-panels">
                <div class="section-panel prompt-panel" data-project-id="${project.id}" data-section-id="${section.sectionId}">
                    <div class="panel-header">
                        <h3>Prompt Template</h3>
                        <button class="btn-collapse" onclick="this.parentElement.nextElementSibling.classList.toggle('collapsed'); this.textContent = this.parentElement.nextElementSibling.classList.contains('collapsed') ? '▶' : '▼';">▼</button>
                    </div>
                    <div class="panel-content">
                        <pre class="prompt-text">${this.escapeHtml(section.prompt || 'Loading prompt...')}</pre>
                        <button class="btn-copy" data-action="copy-prompt-input" data-project-id="${project.id}" data-section-id="${section.sectionId}">Copy Prompt + Input</button>
                    </div>
                </div>
                
                ${(section.modifiers || []).includes('override-instructions') ? `
                <div class="section-panel override-instructions-panel" data-project-id="${project.id}" data-section-id="${section.sectionId}">
                    <div class="panel-header">
                        <h3>Override Instructions</h3>
                        <button class="btn-collapse" onclick="this.parentElement.nextElementSibling.classList.toggle('collapsed'); this.textContent = this.parentElement.nextElementSibling.classList.contains('collapsed') ? '▶' : '▼';">▼</button>
                    </div>
                    <div class="panel-content">
                        <textarea class="section-override-instructions" data-project-id="${project.id}" data-section-id="${section.sectionId}" placeholder="Enter override instructions that will be included in the copied prompt...">${this.escapeHtml(section.overrideInstructions || '')}</textarea>
                    </div>
                </div>
                ` : ''}
                
                <div class="section-panel input-panel" data-project-id="${project.id}" data-section-id="${section.sectionId}">
                    <div class="panel-header">
                        <h3>Input</h3>
                        <div class="panel-actions" style="display: flex; gap: 8px; align-items: center;">
                            <button class="btn-input-guidance" data-project-id="${project.id}" data-section-id="${section.sectionId}" title="Input Guidance" style="background: transparent; border: 1px solid #404040; border-radius: 4px; color: #888; cursor: pointer; padding: 4px 8px; font-size: 14px; font-weight: bold; transition: all 0.2s;" onmouseover="this.style.borderColor='#4a9eff'; this.style.color='#4a9eff';" onmouseout="this.style.borderColor='#404040'; this.style.color='#888';">?</button>
                            <button class="btn-paste" data-action="paste-previous" data-project-id="${project.id}" data-section-id="${section.sectionId}">Paste from Previous</button>
                            <button class="btn-collapse" onclick="this.closest('.panel-header').nextElementSibling.classList.toggle('collapsed'); this.textContent = this.closest('.panel-header').nextElementSibling.classList.contains('collapsed') ? '▶' : '▼';">▼</button>
                        </div>
                    </div>
                    <div class="panel-content">
                        <textarea id="section-input-${project.id}-${section.sectionId}" name="section-input-${project.id}-${section.sectionId}" class="section-input" data-project-id="${project.id}" data-section-id="${section.sectionId}" placeholder="Loading placeholder...">${this.escapeHtml(section.input)}</textarea>
                    </div>
                </div>
                
                <div class="section-panel output-panel" data-project-id="${project.id}" data-section-id="${section.sectionId}">
                    <div class="panel-header">
                        <h3>Output</h3>
                        <div class="panel-actions" style="display: flex; gap: 8px; align-items: center;">
                            <button class="btn-collapse" onclick="this.closest('.panel-header').nextElementSibling.classList.toggle('collapsed'); this.textContent = this.closest('.panel-header').nextElementSibling.classList.contains('collapsed') ? '▶' : '▼';">▼</button>
                            <button class="btn-complete" onclick="app.markSectionComplete('${project.id}', '${section.sectionId}')">Mark Complete</button>
                            <button class="btn-revision" onclick="app.markSectionNeedsRevision('${project.id}', '${section.sectionId}')">Needs Revision</button>
                        </div>
                    </div>
                    <div class="panel-content">
                        <textarea class="section-output" data-project-id="${project.id}" data-section-id="${section.sectionId}" placeholder="Paste LLM output here...">${this.escapeHtml(section.output)}</textarea>
                    </div>
                </div>
                
                <div class="section-panel notes-panel" data-project-id="${project.id}" data-section-id="${section.sectionId}">
                    <div class="panel-header">
                        <h3>Notes & Refinements</h3>
                        <button class="btn-collapse" onclick="this.parentElement.nextElementSibling.classList.toggle('collapsed'); this.textContent = this.parentElement.nextElementSibling.classList.contains('collapsed') ? '▶' : '▼';">▼</button>
                    </div>
                    <div class="panel-content">
                        <textarea class="section-notes" data-project-id="${project.id}" data-section-id="${section.sectionId}" placeholder="Add notes or refinements...">${this.escapeHtml(section.notes)}</textarea>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Render section content
    async renderSectionContent(project, section) {
        const config = window.PipelineConfig;
        const sectionDef = config?.getSection(section.sectionId);
        
        // Prepare all data needed for rendering
        const data = await this._prepareSectionContentData(project, section);
        
        // Build HTML from template sections
        return `
            <div class="section-view-content">
                ${this._renderSectionHeader(data, project, section)}
                ${this._renderSectionLockedMessage(data, project)}
                ${this._renderInferenceStepIndicator(section)}
                ${this._renderModifiersSection(section, project)}
                ${this._renderSectionPanels(project, section)}
            </div>
        `;
    }
    
    /**
     * Render a single pipeline section item as DOM element
     * @private
     * @param {Object} section - Section object
     * @param {Object} project - Project object
     * @param {number} index - Section index
     * @returns {HTMLElement} Section item element
     */
    _renderPipelineSectionItem(section, project, index) {
        let deps = { met: true };
        if (this.sectionLogic) {
            try {
                deps = this.sectionLogic.checkDependencies(project.id, section.sectionId) || { met: true };
            } catch (error) {
                if (this.errorHandler) {
                    this.errorHandler.handleError(error, {
                        source: 'RenderingEngine',
                        operation: 'renderPipelineSectionItem',
                        projectId: project.id,
                        sectionId: section.sectionId
                    });
                } else {
                    console.warn('Error checking dependencies:', error);
                }
            }
        }
        const isLocked = !deps.met;
        
        let statusIcon = '○';
        if (section.status === 'complete') statusIcon = '●';
        else if (section.status === 'in_progress') statusIcon = '◐';
        else if (section.status === 'needs_revision') statusIcon = '⚠';
        else if (section.status === 'skipped') statusIcon = '⊘';
        
        const lockedClass = isLocked ? 'locked' : '';
        const activeClass = section.sectionId === this.activeSectionId ? 'active' : '';
        const sectionTypeClass = section.isProcessStep ? 'process-step' : 
                               section.isInferenceStep ? 'inference-step' : 
                               'core-step';
        
        // Show modifiers if any
        const modifierBadges = (section.modifiers || []).length > 0 ? 
            `<span class="modifier-count" title="${section.modifiers.join(', ')}">🏷️ ${section.modifiers.length}</span>` : '';
        
        // Show section type badge
        const typeBadge = this.renderSectionTypeBadge(section);
        
        // Show quality score for multi-agent projects (if available)
        let qualityScoreBadge = '';
        if (project.automationEngine === 'multi-agent' && section.status === 'complete') {
            if (this.multiAgentAutomation && this.multiAgentAutomation.qualityScores) {
                const qualityScore = this.multiAgentAutomation.qualityScores.get(section.sectionId);
                if (qualityScore && typeof qualityScore.score === 'number') {
                    const scorePercent = (qualityScore.score * 100).toFixed(0);
                    const scoreColor = qualityScore.score >= 0.9 ? '#4caf50' : 
                                     qualityScore.score >= 0.8 ? '#8bc34a' : 
                                     qualityScore.score >= 0.7 ? '#ff9800' : '#f44336';
                    qualityScoreBadge = `<span class="quality-score" style="color: ${scoreColor};" title="Quality Score: ${scorePercent}%">⭐ ${scorePercent}%</span>`;
                }
            }
        }
        
        const item = document.createElement('div');
        item.className = `pipeline-section-item ${lockedClass} ${activeClass} ${sectionTypeClass}`;
        item.dataset.projectId = project.id;
        item.dataset.sectionId = section.sectionId;
        item.dataset.action = 'navigate-section';
        
        // section.sectionName contains user data - escape and use safeSetInnerHTML
        // itemHtml is a template with user data already escaped via escapeHtml() - mark as trusted
        const itemHtml = `
            <div class="section-item-header">
                <span class="section-icon">${isLocked ? '🔒' : statusIcon}</span>
                <span class="section-name">${this.escapeHtml(section.sectionName)}</span>
                ${typeBadge}
            </div>
            <div class="section-item-meta">
                ${modifierBadges}
                ${qualityScoreBadge}
                ${project.automationEngine === 'multi-agent' && this.multiAgentAutomation && this.multiAgentAutomation.agentDiscussions ? this.renderAgentDiscussionIndicator(project.id, section.sectionId) : ''}
                <span class="section-status">${section.status === 'complete' ? '✓' : section.status === 'in_progress' ? '⏳' : section.status === 'needs_revision' ? '⚠' : ''}</span>
            </div>
        `;
        
        if (window.safeSetInnerHTML) {
            window.safeSetInnerHTML(item, itemHtml, { trusted: true });
        } else {
            item.innerHTML = itemHtml;
        }
        
        return item;
    }
    
    // Render pipeline flow view
    renderPipelineFlowView() {
        const flowView = document.getElementById('pipeline-flow-view');
        if (!flowView) return;
        
        const state = this.stateManager.getState();
        const activeProject = this.stateManager.getActiveProject();
        
        if (!activeProject) {
            // Clean up virtual list if exists
            if (this.sectionsVirtualList) {
                this.sectionsVirtualList.destroy();
                this.sectionsVirtualList = null;
            }
            // Static message - safe
            if (window.safeSetInnerHTML) {
                window.safeSetInnerHTML(flowView, '<div class="pipeline-flow-placeholder"><p>Select a project to view pipeline</p></div>', { trusted: false });
            } else {
                flowView.innerHTML = '<div class="pipeline-flow-placeholder"><p>Select a project to view pipeline</p></div>';
            }
            return;
        }
        
        // Get case information
        const caseNumber = activeProject.case || 1;
        const caseBadge = this.renderCaseBadge(caseNumber, activeProject.caseChain);
        // Use CaseInfoService method if available, otherwise create manually with proper escaping
        const caseChainInfo = activeProject.caseChain ? 
            (this.caseInfo ? this.caseInfo.getCaseChainInfo(activeProject.caseChain) :
            `<span class="case-chain-info" title="Enhanced from Case ${this.escapeHtml(String(activeProject.caseChain.previousCase))}">🔗 Enhanced from Case ${this.escapeHtml(String(activeProject.caseChain.previousCase))}</span>`) : '';
        
        let html = '<div class="pipeline-flow-content">';
        html += `<div class="pipeline-header">
            <h2>Pipeline Flow</h2>
            <div class="pipeline-case-info">
                ${caseBadge}
                ${caseChainInfo}
            </div>
        </div>`;
        
        // Automation directory input - ensure it always has a value with unique ID
        let automationDir = activeProject.automationDirectory || '';
        const caseName = this.getCaseDisplayName(caseNumber);
        const caseNameSlug = caseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        
        // If empty, trigger async creation of directory with unique ID
        // This will be handled by ensureAutomationDirectory in app.js
        if (!automationDir) {
            // Emit event to trigger directory creation
            this.eventSystem.emit('ensure-automation-directory', {
                source: 'RenderingEngine',
                data: { projectId: activeProject.id }
            });
            
            // Show placeholder while directory is being created
            automationDir = 'Creating directory...';
        }
        // Get scope directory from project (per-project, not global)
        const scopeDir = activeProject.scopeDirectory || '';
        
        html += `<div class="automation-dir-section" style="padding: 15px; background: #2d2d2d; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #ffffff;">Directory Configuration</h3>
            
            <div style="margin-bottom: 20px;">
                <label for="automation-dir-input" style="display: block; margin-bottom: 8px; font-weight: 500; color: #e0e0e0;">
                    📁 Automation Directory:
                </label>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input 
                        type="text" 
                        id="automation-dir-input" 
                        name="automation-dir-input"
                        data-project-id="${activeProject.id}"
                        value="${this.escapeHtml(automationDir)}" 
                        placeholder="Enter directory path (e.g., ./output or H:/Projects/output)"
                        style="flex: 1; padding: 8px; background: #1e1e1e; border: 1px solid #404040; border-radius: 4px; color: #e0e0e0; font-family: monospace; font-size: 0.9em;"
                    />
                    <button 
                        id="create-automation-dir-btn" 
                        data-project-id="${activeProject.id}"
                        data-case-slug="${caseNameSlug}"
                        title="Create new automation directory"
                        style="padding: 8px 12px; background: #4a9eff; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 16px; font-weight: bold; white-space: nowrap;"
                        onmouseover="this.style.background='#5aaeff'"
                        onmouseout="this.style.background='#4a9eff'"
                    >+</button>
                </div>
                <p style="margin-top: 6px; font-size: 0.85em; color: #888;">
                    Used by the agent for file creation, editing, and reading. This directory will be used in prompts where {AUTOMATION_DIR} appears.
                </p>
            </div>
            
            <div style="padding-top: 15px; border-top: 1px solid #404040;">
                <label for="scope-directory-input" style="display: block; margin-bottom: 8px; font-weight: 500; color: #e0e0e0;">
                    🎯 Scope Directory:
                </label>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input 
                        type="text" 
                        id="scope-directory-input" 
                        name="scope-directory-input"
                        data-project-id="${activeProject.id}"
                        placeholder="Enter directory path (e.g., ./my-project or H:/Projects/my-project)"
                        value="${this.escapeHtml(scopeDir)}"
                        style="flex: 1; padding: 8px; background: #1e1e1e; border: 1px solid #404040; border-radius: 4px; color: #e0e0e0; font-family: monospace; font-size: 0.9em;"
                    />
                    <button 
                        id="browse-scope-dir" 
                        data-project-id="${activeProject.id}"
                        style="padding: 8px 12px; background: #4a9eff; border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 0.9em; white-space: nowrap;"
                        onmouseover="this.style.background='#5aaeff'"
                        onmouseout="this.style.background='#4a9eff'"
                    >Browse</button>
                </div>
                <p style="margin-top: 6px; font-size: 0.85em; color: #888;">
                    Restricts the agent's focus to this directory and its subdirectories. Used for context and file operations within this scope.
                </p>
            </div>
        </div>`;
        
        html += '<div class="pipeline-sections" id="pipeline-sections-container"></div>';
        html += '</div>';
        
        // html is a template with user data already escaped via escapeHtml() - mark as trusted
        // User data (section names, project names, etc.) are escaped before insertion
        console.log('Rendering pipeline flow view', { htmlLength: html.length, hasSafeSetInnerHTML: !!window.safeSetInnerHTML });
        if (window.safeSetInnerHTML) {
            window.safeSetInnerHTML(flowView, html, { trusted: true });
            console.log('Pipeline flow HTML set with safeSetInnerHTML (trusted: true)');
        } else {
            flowView.innerHTML = html;
            console.log('Pipeline flow HTML set with innerHTML (fallback)');
        }
        
        // Render sections list (with virtualization if > 30 sections)
        const sectionsContainer = document.getElementById('pipeline-sections-container');
        if (sectionsContainer) {
            const VIRTUAL_LIST_THRESHOLD = 30;
            
            if (activeProject.sections.length > VIRTUAL_LIST_THRESHOLD && typeof window !== 'undefined' && window.VirtualList) {
                // Use virtual list for large section lists
                if (!this.sectionsVirtualList) {
                    // Clear container
                    while (sectionsContainer.firstChild) {
                        sectionsContainer.removeChild(sectionsContainer.firstChild);
                    }
                    
                    // Create virtual list
                    this.sectionsVirtualList = new window.VirtualList(sectionsContainer, {
                        itemHeight: 70, // Estimated section item height
                        overscan: 5,
                        renderItem: (section, index) => {
                            return this._renderPipelineSectionItem(section, activeProject, index);
                        }
                    });
                }
                
                // Update items
                this.sectionsVirtualList.setItems(activeProject.sections);
            } else {
                // Use normal rendering for small lists
                if (this.sectionsVirtualList) {
                    this.sectionsVirtualList.destroy();
                    this.sectionsVirtualList = null;
                }
                
                // Clear container
                while (sectionsContainer.firstChild) {
                    sectionsContainer.removeChild(sectionsContainer.firstChild);
                }
                
                // Use DocumentFragment for batch DOM operations
                const fragment = document.createDocumentFragment();
                activeProject.sections.forEach((section, index) => {
                    const sectionEl = this._renderPipelineSectionItem(section, activeProject, index);
                    fragment.appendChild(sectionEl);
                });
                
                // Append fragment once (single reflow)
                sectionsContainer.appendChild(fragment);
            }
        }
        
        // Ensure only one item has the active class (safety check)
        const allItems = flowView.querySelectorAll('.pipeline-section-item');
        let activeFound = false;
        allItems.forEach(item => {
            const itemSectionId = item.dataset.sectionId;
            if (itemSectionId === this.activeSectionId && !activeFound) {
                item.classList.add('active');
                activeFound = true;
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    // Legacy rendering for old format (pages/elements)
    renderLegacyPages() {
        if (!this.container) {
            this.container = document.getElementById('pages-container');
        }
        if (!this.container) {
            if (this.errorHandler) {
                this.errorHandler.handleError('pages-container not found', {
                    source: 'RenderingEngine',
                    operation: 'renderLegacyPages'
                });
            } else {
                console.warn('pages-container not found, skipping render');
            }
            return;
        }
        
        this.container.innerHTML = '';
        
        const state = this.stateManager.getState();
        
        if (state.pages.length === 0) {
            this.container.innerHTML = '<p>No pages yet. Add a page to get started!</p>';
            return;
        }
        
        state.pages.forEach((page) => {
            const pageEl = this.renderPage(page);
            this.container.appendChild(pageEl);
        });
    }
    
    // Render a single page
    renderPage(page) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        pageDiv.dataset.pageId = page.id;
        pageDiv.draggable = true;
        
        const state = this.stateManager.getState();
        const isExpanded = state.pageStates[page.id] !== false; // default to true
        
        // Page header
        const header = document.createElement('div');
        header.className = 'page-header';
        
        const pageToggleId = `page-toggle-${page.id}`;
        const pageContentId = `page-content-${page.id}`;
        
        const arrow = isExpanded ? '▼' : '▶';
        // page.title is user data - escape and use safeSetInnerHTML
        const headerHtml = `
            <span class="page-toggle-arrow" id="${pageToggleId}" style="cursor: pointer; margin-right: 8px; color: #888888; user-select: none;">${arrow}</span>
            <div class="page-title" data-page-id="${page.id}">${this.escapeHtml(page.title)}</div>
            <div class="page-controls">
                <button data-action="delete-page" data-page-id="${page.id}">Delete</button>
            </div>
        `;
        if (window.safeSetInnerHTML) {
            window.safeSetInnerHTML(header, headerHtml, { trusted: false });
        } else {
            header.innerHTML = headerHtml;
        }
        
        // Page content
        const pageContent = document.createElement('div');
        pageContent.id = pageContentId;
        pageContent.style.display = isExpanded ? 'block' : 'none';
        
        // Elements list
        const elementsList = document.createElement('div');
        elementsList.className = 'elements-list';
        elementsList.id = `elements-list-${page.id}`;
        
        page.elements.forEach((element, elIndex) => {
            const elementEl = this.renderElement(page.id, element, elIndex);
            elementsList.appendChild(elementEl);
        });
        
        // Add element button
        const addElementBtn = document.createElement('button');
        addElementBtn.className = 'add-element-btn';
        addElementBtn.textContent = '+ Add Element';
        addElementBtn.onclick = () => {
            if (this.uiManager) {
                this.uiManager.showAddElementModal(page.id);
            }
        };
        
        pageContent.appendChild(elementsList);
        pageContent.appendChild(addElementBtn);
        
        pageDiv.appendChild(header);
        pageDiv.appendChild(pageContent);
        
        // Setup page event handlers
        this.setupPageHandlers(pageDiv, page, pageToggleId, pageContentId);
        
        return pageDiv;
    }
    
    // Setup page event handlers
    setupPageHandlers(pageDiv, page, toggleId, contentId) {
        // Toggle collapse/expand
        const toggleArrow = pageDiv.querySelector(`#${toggleId}`);
        if (toggleArrow) {
            toggleArrow.addEventListener('click', (e) => {
                e.stopPropagation();
                const state = this.stateManager.getState();
                const isCurrentlyExpanded = state.pageStates[page.id] !== false;
                this.stateManager.setPageCollapsed(page.id, isCurrentlyExpanded);
                
                // Update UI immediately
                const content = document.getElementById(contentId);
                if (content) {
                    const newState = !isCurrentlyExpanded;
                    content.style.display = newState ? 'block' : 'none';
                    toggleArrow.textContent = newState ? '▼' : '▶';
                }
            });
        }
        
        // Page title editing
        const titleEl = pageDiv.querySelector('.page-title');
        if (titleEl) {
            let lastClickTime = 0;
            titleEl.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation();
                titleEl.contentEditable = 'true';
                titleEl.focus();
                const range = document.createRange();
                range.selectNodeContents(titleEl);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            });
            
            titleEl.addEventListener('blur', () => {
                if (titleEl.contentEditable === 'true') {
                    const newTitle = titleEl.textContent.trim() || 'Untitled Page';
                    this.stateManager.updatePage(page.id, { title: newTitle });
                    titleEl.contentEditable = 'false';
                }
            });
            
            titleEl.addEventListener('keydown', (e) => {
                if (e.target.contentEditable === 'true' && e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
            });
        }
        
        // Drag and drop for pages
        pageDiv.addEventListener('dragstart', (e) => {
            if (e.target.closest('button') || e.target.closest('input') || 
                (e.target.closest('.page-title') && e.target.contentEditable === 'true') ||
                e.target.closest('.element')) {
                e.preventDefault();
                return;
            }
            
            e.dataTransfer.effectAllowed = 'move';
            const data = this.dragDropHandler.createDragData('page', page.id);
            e.dataTransfer.setData('text/plain', data);
            pageDiv.classList.add('dragging');
        });
        
        pageDiv.addEventListener('dragend', (e) => {
            pageDiv.classList.remove('dragging');
        });
    }
    
    // Render a single element
    renderElement(pageId, element, elementIndex) {
        const div = document.createElement('div');
        div.className = `element ${element.type} ${element.completed ? 'completed' : ''} ${element.repeats === false ? 'one-time' : ''}`;
        div.draggable = true;
        div.dataset.elementIndex = elementIndex;
        div.dataset.pageId = pageId;
        
        // Build tooltip text
        let tooltipText = '';
        if (element.timeAllocated) {
            tooltipText += `Time: ${element.timeAllocated}`;
        }
        if (element.funModifier) {
            tooltipText += tooltipText ? ` | Fun: ${element.funModifier}` : `Fun: ${element.funModifier}`;
        }
        
        // Render based on element type
        switch (element.type) {
            case 'task':
                this.renderTaskElement(div, pageId, element, elementIndex, tooltipText);
                break;
            case 'header':
                // element.text is user data - escape and use safeSetInnerHTML
                // element.text is user data - escape and use safeSetInnerHTML
                const headerHtml2 = `<div class="header-text">${this.escapeHtml(element.text)}</div>`;
                if (window.safeSetInnerHTML) {
                    window.safeSetInnerHTML(div, headerHtml2, { trusted: false });
                } else {
                    div.innerHTML = headerHtml2;
                }
                this.addTooltip(div, tooltipText);
                break;
            case 'header-checkbox':
                this.renderHeaderCheckboxElement(div, pageId, element, elementIndex, tooltipText);
                break;
            case 'multi-checkbox':
                this.renderMultiCheckboxElement(div, pageId, element, elementIndex, tooltipText);
                break;
            case 'one-time':
                this.renderTaskElement(div, pageId, element, elementIndex, tooltipText);
                break;
        }
        
        // Setup element event handlers
        this.setupElementHandlers(div, pageId, element, elementIndex);
        
        return div;
    }
    
    // Render task element
    renderTaskElement(div, pageId, element, elementIndex, tooltipText) {
        const taskHeader = document.createElement('div');
        taskHeader.className = 'task-header';
        
        const hasSubtasks = element.subtasks && element.subtasks.length > 0;
        const subtaskToggleId = `subtask-toggle-${pageId}-${elementIndex}`;
        const subtaskContentId = `subtask-content-${pageId}-${elementIndex}`;
        
        const taskTextSpan = document.createElement('span');
        taskTextSpan.className = 'task-text';
        
        if (hasSubtasks) {
            const state = this.stateManager.getState();
            const subtaskStateKey = `${pageId}-${elementIndex}`;
            const isExpanded = state.subtaskStates[subtaskStateKey] !== false; // default to true
            const initialArrow = isExpanded ? '▼' : '▶';
            
            taskTextSpan.innerHTML = `<span class="subtask-arrow" id="${subtaskToggleId}">${initialArrow}</span> ${this.escapeHtml(element.text)}`;
            taskTextSpan.onclick = (e) => {
                e.stopPropagation();
                const arrow = document.getElementById(subtaskToggleId);
                const content = document.getElementById(subtaskContentId);
                if (arrow && content) {
                    const newState = content.style.display === 'none';
                    this.stateManager.setSubtaskVisibility(pageId, elementIndex, newState);
                    content.style.display = newState ? 'block' : 'none';
                    arrow.textContent = newState ? '▼' : '▶';
                }
            };
        } else {
            taskTextSpan.textContent = element.text;
            // Removed onclick - only checkbox should toggle, double-click opens edit modal
        }
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `task-checkbox-${pageId}-${elementIndex}`;
        checkbox.name = `task-checkbox-${pageId}-${elementIndex}`;
        checkbox.checked = element.completed;
        checkbox.onchange = (e) => {
            e.stopPropagation();
            this.stateManager.toggleElementCompletion(pageId, elementIndex);
        };
        checkbox.onclick = (e) => {
            e.stopPropagation(); // Prevent double-click from triggering on element
        };
        
        taskHeader.appendChild(checkbox);
        taskHeader.appendChild(taskTextSpan);
        div.appendChild(taskHeader);
        
        if (tooltipText) {
            this.addTooltip(div, tooltipText);
        }
        
        // Render subtasks if present
        if (hasSubtasks) {
            this.renderSubtasks(div, pageId, element, elementIndex, subtaskContentId);
        }
    }
    
    // Render subtasks
    renderSubtasks(container, pageId, element, elementIndex, contentId) {
        const subtaskContainer = document.createElement('div');
        subtaskContainer.className = 'subtask-container';
        
        const state = this.stateManager.getState();
        const subtaskStateKey = `${pageId}-${elementIndex}`;
        const isExpanded = state.subtaskStates[subtaskStateKey] !== false;
        
        const content = document.createElement('div');
        content.className = 'dropdown-content';
        content.id = contentId;
        content.style.display = isExpanded ? 'block' : 'none';
        
        element.subtasks.forEach((subtask, stIndex) => {
            const stEl = document.createElement('div');
            stEl.className = 'subtask';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `subtask-checkbox-${pageId}-${elementIndex}-${stIndex}`;
            checkbox.name = `subtask-checkbox-${pageId}-${elementIndex}-${stIndex}`;
            checkbox.checked = subtask.completed;
            checkbox.onchange = (e) => {
                e.stopPropagation();
                // Toggle subtask completion - this would need to be handled by state manager
                // For now, emit event
                this.eventSystem.emit(EventType.ELEMENT_COMPLETION_TOGGLED, {
                    source: 'RenderingEngine',
                    data: { pageId, elementIndex, subtaskIndex: stIndex }
                });
            };
            checkbox.onclick = (e) => {
                e.stopPropagation(); // Prevent double-click from triggering on element
            };
            
            const span = document.createElement('span');
            span.textContent = subtask.text;
            // Removed onclick - only checkbox should toggle, double-click opens edit modal
            
            stEl.appendChild(checkbox);
            stEl.appendChild(span);
            
            if (subtask.timeAllocated) {
                this.addTooltip(stEl, `Time: ${subtask.timeAllocated}`);
            }
            
            content.appendChild(stEl);
        });
        
        subtaskContainer.appendChild(content);
        container.appendChild(subtaskContainer);
    }
    
    // Render header checkbox element
    renderHeaderCheckboxElement(div, pageId, element, elementIndex, tooltipText) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `header-checkbox-${pageId}-${elementIndex}`;
        checkbox.name = `header-checkbox-${pageId}-${elementIndex}`;
        checkbox.checked = element.completed;
        checkbox.onchange = (e) => {
            e.stopPropagation();
            this.stateManager.toggleElementCompletion(pageId, elementIndex);
        };
        checkbox.onclick = (e) => {
            e.stopPropagation(); // Prevent double-click from triggering on element
        };
        
        const headerText = document.createElement('span');
        headerText.className = 'header-text';
        headerText.textContent = element.text;
        
        div.appendChild(checkbox);
        div.appendChild(headerText);
        
        if (tooltipText) {
            this.addTooltip(div, tooltipText);
        }
    }
    
    // Render multi-checkbox element
    renderMultiCheckboxElement(div, pageId, element, elementIndex, tooltipText) {
        const itemsHtml = element.items.map((item, itemIndex) => {
            return `
                <div class="multi-checkbox-row" data-item-index="${itemIndex}">
                    <input type="checkbox" id="multi-checkbox-${pageId}-${elementIndex}-${itemIndex}" name="multi-checkbox-${pageId}-${elementIndex}-${itemIndex}" ${item.completed ? 'checked' : ''} 
                           data-action="toggle-multi-checkbox-item" data-page-id="${pageId}" data-element-index="${elementIndex}" data-item-index="${itemIndex}">
                    <span class="checkbox-label">${this.escapeHtml(item.text)}</span>
                    ${element.items.length > 1 ? `<button data-action="remove-multi-checkbox-item" data-page-id="${pageId}" data-element-index="${elementIndex}" data-item-index="${itemIndex}" style="padding: 2px 6px; font-size: 11px; background: #e74c3c;">×</button>` : ''}
                </div>
            `;
        }).join('');
        
        // Contains user data - sanitize
        const elementHtml = `
            ${itemsHtml}
            <div class="multi-checkbox-controls">
                <button data-action="add-multi-checkbox-item" data-page-id="${pageId}" data-element-index="${elementIndex}">+ Add</button>
            </div>
        `;
        if (window.safeSetInnerHTML) {
            window.safeSetInnerHTML(div, elementHtml, { trusted: false });
        } else {
            div.innerHTML = elementHtml;
        }
        
        // Add click handlers to checkboxes to stop propagation
        div.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent double-click from triggering on element
            });
        });
        
        if (tooltipText) {
            this.addTooltip(div, tooltipText);
        }
    }
    
    // Setup element event handlers
    setupElementHandlers(elementDiv, pageId, element, elementIndex) {
        // Drag and drop
        elementDiv.addEventListener('dragstart', (e) => {
            if (e.target.closest('input') || e.target.closest('button') || e.target.closest('textarea')) {
                e.preventDefault();
                return;
            }
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'move';
            const data = this.dragDropHandler.createDragData('element', pageId, elementIndex);
            e.dataTransfer.setData('text/plain', data);
            elementDiv.classList.add('dragging');
        });
        
        elementDiv.addEventListener('dragend', (e) => {
            elementDiv.classList.remove('dragging');
        });
        
        // Double-click to open edit modal (but not on checkbox, button, or subtask arrow)
        elementDiv.addEventListener('dblclick', (e) => {
            // Don't open edit modal if clicking on checkbox, button, or subtask arrow
            if (e.target.closest('input[type="checkbox"]') || 
                e.target.closest('button') || 
                e.target.closest('textarea') ||
                e.target.classList.contains('subtask-arrow') ||
                e.target.closest('.subtask-arrow')) {
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // Open edit modal via UI manager or app instance
            if (this.uiManager) {
                this.uiManager.showEditModal(pageId, elementIndex);
            } else if (this.appInstance && this.appInstance.showEditModal) {
                this.appInstance.showEditModal(pageId, elementIndex);
            }
        });
    }
    
    // Add tooltip to element
    addTooltip(element, text) {
        if (!text) return;
        element.addEventListener('mouseenter', () => {
            this.showTooltip(text);
        });
        element.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
    }
    
    // Show tooltip
    showTooltip(text) {
        // Tooltip implementation would go here
        // For now, use title attribute
        const tooltip = document.createElement('div');
        tooltip.id = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `position: absolute; background: #333; color: #fff; padding: 5px 10px; border-radius: 4px; z-index: ${AppConstants.UI.Z_INDEX.TOOLTIP}; pointer-events: none;`;
        document.body.appendChild(tooltip);
    }
    
    // Hide tooltip
    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
    
    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Clear container
    clearContainer() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
    
    // Get contextual placeholder text for input field based on step type
    // getInputPlaceholder is now handled by PlaceholderService
    // This method is kept for backward compatibility but delegates to service
    async getInputPlaceholder(section, project) {
        if (this.placeholder) {
            return await this.placeholder.getInputPlaceholder(section, project);
        }
        return 'Enter input for this section...';
    }
    
    // Render agent discussion indicator for multi-agent projects
    renderAgentDiscussionIndicator(projectId, sectionId) {
        if (!this.multiAgentAutomation) {
            return '';
        }
        
        const discussionId = `discussion-${sectionId}`;
        const discussion = this.multiAgentAutomation.agentDiscussions.get(discussionId);
        
        if (!discussion || discussion.length === 0) {
            return '';
        }
        
        return `<span class="agent-discussion-indicator" 
                      title="View agent conversations (${discussion.length} messages)" 
                      onclick="event.stopPropagation(); app.showAgentConversations('${projectId}', '${sectionId}');"
                      style="cursor: pointer; color: #9C27B0; font-size: 0.9em; margin-right: 4px;">💬 ${discussion.length}</span>`;
    }
}

