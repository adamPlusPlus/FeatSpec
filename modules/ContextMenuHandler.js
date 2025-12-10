// Context Menu Handler - Manages context menu display and interaction
class ContextMenuHandler {
    constructor(eventSystem, stateManager, pointerTracker) {
        this.eventSystem = eventSystem;
        this.stateManager = stateManager;
        this.pointerTracker = pointerTracker;
        this.menuState = null;
        this.lastRightClickTime = 0;
        this.doubleClickThreshold = 300; // milliseconds for double right-click
        this.doubleClickDelay = 150; // milliseconds for left double-click
        this.lastLeftClickTime = 0;
        this.lastLeftClickTarget = null;
        this.touchPoints = {};
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Right-click context menu
        document.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        
        // Double-click (left) to open context menu
        document.addEventListener('click', (e) => {
            // Don't trigger on context menu clicks
            if (e.target.closest('.context-menu')) {
                return;
            }
            
            // Don't trigger on input/textarea/select elements
            if (e.target.tagName === 'INPUT' || 
                e.target.tagName === 'TEXTAREA' || 
                e.target.tagName === 'SELECT' ||
                e.target.isContentEditable) {
                this.lastLeftClickTime = 0;
                this.lastLeftClickTarget = null;
                return;
            }
            
            // Don't trigger on buttons
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                this.lastLeftClickTime = 0;
                this.lastLeftClickTarget = null;
                return;
            }
            
            const now = Date.now();
            const timeSinceLastClick = now - this.lastLeftClickTime;
            const sameTarget = e.target === this.lastLeftClickTarget || 
                              e.target.closest('.project-item') === this.lastLeftClickTarget ||
                              e.target.closest('.section-panel') === this.lastLeftClickTarget ||
                              e.target.closest('.section-view-content') === this.lastLeftClickTarget ||
                              e.target.closest('.pipeline-section-item') === this.lastLeftClickTarget ||
                              e.target.closest('.element') === this.lastLeftClickTarget ||
                              e.target.closest('.page') === this.lastLeftClickTarget;
            
            // Check for double-click (within threshold and same target)
            if (timeSinceLastClick < this.doubleClickDelay && 
                timeSinceLastClick > 0 && 
                sameTarget) {
                // Double-click detected - create synthetic contextmenu event
                const syntheticEvent = new MouseEvent('contextmenu', {
                    bubbles: true,
                    cancelable: true,
                    clientX: e.clientX,
                    clientY: e.clientY,
                    button: 2 // Right button
                });
                syntheticEvent.target = e.target;
                this.handleContextMenu(syntheticEvent);
                this.lastLeftClickTime = 0;
                this.lastLeftClickTarget = null;
            } else {
                // Single click - update tracking
                this.lastLeftClickTime = now;
                this.lastLeftClickTarget = e.target;
            }
            
            // Close menu on click outside (but not on menu items themselves)
            if (!e.target.closest('.context-menu') && !e.target.closest('.context-menu-item')) {
                this.hideMenu();
            }
        });
        
        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                this.hideMenu();
            }
        });
        
        // Touch gesture handlers
        this.setupTouchGestures();
        
        // Menu item click handlers (set up in showMenu)
    }
    
    // Handle context menu trigger
    handleContextMenu(e) {
        // Don't show menu if clicking on context menu itself
        if (e.target.closest('.context-menu')) {
            return;
        }
        
        // Allow context menu on project group input or select
        const projectGroupInput = e.target.closest('#project-group-name') || e.target.closest('#project-group-select') || e.target.closest('.project-group-container');
        if (projectGroupInput) {
            // Prevent default browser menu and show our custom menu
            e.preventDefault();
            e.stopPropagation();
            
            const context = this.determineContext(e.target);
            if (context) {
                this.showMenu({ x: e.clientX, y: e.clientY }, context);
            }
            return;
        }
        
        const now = Date.now();
        const timeSinceLastClick = now - this.lastRightClickTime;
        
        // Check for double right-click (show browser menu)
        if (timeSinceLastClick < this.doubleClickThreshold && this.isVisible()) {
            this.hideMenu();
            this.lastRightClickTime = 0;
            return; // Allow browser menu
        }
        
        e.preventDefault();
        e.stopPropagation();
        this.lastRightClickTime = now;
        
        // Determine context
        const context = this.determineContext(e.target);
        
        if (context) {
            this.showMenu({ x: e.clientX, y: e.clientY }, context);
        }
    }
    
    // Determine menu context from target element
    determineContext(target) {
        // Check for project group dropdown specifically (for right-click context menu)
        const projectGroupSelect = target.closest('#project-group-select');
        if (projectGroupSelect) {
            return {
                type: 'projectGroupDropdown'
            };
        }
        
        // Check for project group input or container (legacy context)
        const projectGroupInput = target.closest('#project-group-name') || target.closest('.project-group-container');
        if (projectGroupInput && !target.closest('#project-group-select')) {
            return {
                type: 'projectGroup'
            };
        }
        
        // Check for panes (projects-sidebar, main-content, references-panel)
        const projectsSidebar = target.closest('.projects-sidebar');
        const mainContent = target.closest('.main-content');
        const referencesPanel = target.closest('.references-panel');
        
        if (projectsSidebar && !target.closest('.project-item')) {
            return {
                type: 'pane',
                paneName: 'projectsSidebar'
            };
        }
        
        if (mainContent && !target.closest('.section-panel, .pipeline-section-item, .section-view-content, #pipeline-flow-view')) {
            return {
                type: 'pane',
                paneName: 'mainContent'
            };
        }
        
        if (referencesPanel) {
            return {
                type: 'pane',
                paneName: 'referencesPanel'
            };
        }
        
        // Check for project item (new structure)
        const projectItem = target.closest('.project-item');
        if (projectItem) {
            const projectId = projectItem.dataset.projectId;
            if (projectId) {
                return {
                    type: 'project',
                    projectId: projectId
                };
            }
        }
        
        // Check for section modifiers (collapsed or expanded) - check this first
        const sectionModifiers = target.closest('.section-modifiers');
        if (sectionModifiers) {
            const projectId = sectionModifiers.dataset.projectId;
            const sectionId = sectionModifiers.dataset.sectionId;
            
            if (projectId && sectionId) {
                return {
                    type: 'section',
                    projectId: projectId,
                    sectionId: sectionId
                };
            }
        }
        
        // Check for automation directory section
        const automationDirSection = target.closest('.automation-dir-section');
        if (automationDirSection) {
            const projectId = document.querySelector('#automation-dir-input')?.dataset.projectId;
            return {
                type: 'automationDirSection',
                projectId: projectId
            };
        }
        
        // Check for create automation directory button (check before other pipeline checks)
        if (target.id === 'create-automation-dir-btn') {
            const projectId = target.dataset.projectId;
            return {
                type: 'createAutomationDirBtn',
                projectId: projectId
            };
        }
        
        // Check for pipeline section items in pipeline flow view (different from section view)
        const pipelineSection = target.closest('.pipeline-section-item');
        const sectionViewElement = document.getElementById('section-view');
        const pipelineFlowViewElement = document.getElementById('pipeline-flow-view');
        const isSectionViewActive = sectionViewElement && sectionViewElement.style.display !== 'none';
        const isPipelineFlowViewActive = pipelineFlowViewElement && pipelineFlowViewElement.style.display !== 'none';
        
        if (pipelineSection && isPipelineFlowViewActive && !isSectionViewActive) {
            // This is a pipeline section item in the pipeline flow view
            const projectId = pipelineSection.dataset.projectId;
            const sectionId = pipelineSection.dataset.sectionId;
            
            if (projectId && sectionId) {
                return {
                    type: 'pipelineSection',
                    projectId: projectId,
                    sectionId: sectionId
                };
            }
        }
        
        // Check for section panel or section view (new structure)
        const sectionPanel = target.closest('.section-panel');
        const sectionView = target.closest('.section-view-content');
        
        if (sectionPanel || sectionView) {
            // Get project and section IDs from data attributes
            const projectId = target.closest('[data-project-id]')?.dataset.projectId ||
                            document.querySelector('.project-item.active')?.dataset.projectId;
            
            let sectionId = null;
            if (sectionPanel) {
                sectionId = sectionPanel.querySelector('[data-section-id]')?.dataset.sectionId;
            } else if (sectionView) {
                // Try to get from active section
                const activeSection = sectionView.querySelector('.section-title-row');
                if (activeSection) {
                    // Section ID might be in the navigation or we can get it from state
                    const state = this.stateManager.getState();
                    const activeProject = this.stateManager.getActiveProject();
                    if (activeProject && window.app?.renderingEngine?.activeSectionId) {
                        sectionId = window.app.renderingEngine.activeSectionId;
                    }
                }
            }
            
            if (projectId && sectionId) {
                return {
                    type: 'section',
                    projectId: projectId,
                    sectionId: sectionId
                };
            } else if (projectId) {
                // Just project context if section not found
                return {
                    type: 'project',
                    projectId: projectId
                };
            }
        }
        
        // Check for pipeline flow view (but not on section items or interactive elements)
        // Only check this if we're NOT in the section view
        // (sectionViewElement and pipelineFlowViewElement already checked above, reuse them)
        
        // Only check for pipeline flow view context if pipeline flow view is actually visible
        if (isPipelineFlowViewActive && !isSectionViewActive) {
            const pipelineFlowView = target.closest('#pipeline-flow-view');
            const pipelineFlowContent = target.closest('.pipeline-flow-content');
            const pipelineSections = target.closest('.pipeline-sections');
            
            // Don't show menu on interactive elements (inputs, buttons, links, etc.)
            const isInteractive = target.tagName === 'INPUT' || 
                                 target.tagName === 'BUTTON' || 
                                 target.tagName === 'A' ||
                                 target.tagName === 'SELECT' ||
                                 target.tagName === 'TEXTAREA' ||
                                 target.isContentEditable ||
                                 target.closest('input, button, a, select, textarea');
            
            // If clicking on pipeline flow view background but not on a section item or interactive element, show add step menu
            if ((pipelineFlowView || pipelineFlowContent || pipelineSections) && !pipelineSection && !isInteractive) {
                const projectId = target.closest('[data-project-id]')?.dataset.projectId ||
                                document.querySelector('.project-item.active')?.dataset.projectId ||
                                document.querySelector('#automation-dir-input')?.dataset.projectId;
                
                if (projectId) {
                    return {
                        type: 'pipelineFlowView',
                        projectId: projectId
                    };
                }
            }
        }
        
        // Legacy: Check for element
        const element = target.closest('.element');
        const page = target.closest('.page');
        const subtask = target.closest('.subtask');
        const pagesContainer = document.getElementById('pages-container');
        
        if (element) {
            const pageId = element.dataset.pageId;
            const elementIndex = parseInt(element.dataset.elementIndex);
            
            if (subtask && !isNaN(elementIndex)) {
                const subtaskContainer = element.querySelector('.subtask-container');
                if (subtaskContainer) {
                    const subtasks = subtaskContainer.querySelectorAll('.subtask');
                    const subtaskIndex = Array.from(subtasks).indexOf(subtask);
                    if (subtaskIndex !== -1) {
                        return {
                            type: 'subtask',
                            pageId: pageId,
                            elementIndex: elementIndex,
                            subtaskIndex: subtaskIndex
                        };
                    }
                }
            }
            
            if (pageId && !isNaN(elementIndex)) {
                return {
                    type: 'element',
                    pageId: pageId,
                    elementIndex: elementIndex
                };
            }
        }
        
        if (page) {
            const pageId = page.dataset.pageId;
            const isInContent = target.closest('[id^="page-content-"]');
            const isElement = target.closest('.element');
            const isControl = target.closest('.page-controls, .page-toggle-arrow, .add-element-btn');
            
            if (pageId && !isInContent && !isElement && !isControl) {
                return {
                    type: 'page',
                    pageId: pageId
                };
            }
        }
        
        if (pagesContainer && !target.closest('.page') && !target.closest('.element')) {
            return {
                type: 'empty'
            };
        }
        
        return null;
    }
    
    // Show context menu
    showMenu(position, context) {
        const menu = document.getElementById('context-menu');
        if (!menu) return;
        
        const items = this.getMenuItems(context);
        
        // Don't show menu if there are no items
        if (!items || items.length === 0) {
            return;
        }
        
        // Update menu items visibility
        this.updateMenuItems(menu, items, context);
        
        // Check if any items are actually visible
        const allMenuItems = menu.querySelectorAll('.context-menu-item');
        let hasVisibleItem = false;
        allMenuItems.forEach(item => {
            if (item.style.display !== 'none' && window.getComputedStyle(item).display !== 'none') {
                hasVisibleItem = true;
            }
        });
        
        if (!hasVisibleItem) {
            // No visible items, don't show the menu
            return;
        }
        
        // Position menu
        this.positionMenu(menu, position);
        
        // Show menu
        menu.classList.add('active');
        
        this.menuState = {
            visible: true,
            position: { ...position },
            context: context,
            items: items
        };
        
        // Set up click handlers
        this.setupMenuHandlers(menu, context);
        
        this.eventSystem.emit(EventType.CONTEXT_MENU_OPENED, {
            source: 'ContextMenuHandler',
            data: { context, position }
        });
    }
    
    // Hide context menu
    hideMenu() {
        const menu = document.getElementById('context-menu');
        if (menu) {
            menu.classList.remove('active');
        }
        
        if (this.menuState) {
            this.eventSystem.emit(EventType.CONTEXT_MENU_CLOSED, {
                source: 'ContextMenuHandler',
                data: { context: this.menuState.context }
            });
        }
        
        this.menuState = null;
    }
    
    // Check if menu is visible
    isVisible() {
        return this.menuState && this.menuState.visible;
    }
    
    // Get menu items for context
    getMenuItems(context) {
        const items = [];
        
        if (context.type === 'pane') {
            const paneName = context.paneName;
            const isExpanded = this.stateManager.getPaneState(paneName);
            const paneLabels = {
                'projectsSidebar': 'Projects Sidebar',
                'mainContent': 'Main Content',
                'referencesPanel': 'References Panel'
            };
            items.push({
                id: 'toggle-pane',
                label: isExpanded ? `Collapse ${paneLabels[paneName] || paneName}` : `Expand ${paneLabels[paneName] || paneName}`,
                action: 'toggle-pane'
            });
        } else         if (context.type === 'project') {
            const project = this.stateManager.getProject(context.projectId);
            items.push({ id: 'rename-project', label: 'Rename Project', action: 'rename-project' });
            items.push({ id: 'duplicate-project', label: 'Duplicate Project', action: 'duplicate-project' });
            items.push({ id: 'export-project', label: 'Export Project', action: 'export-project' });
            items.push({ id: 'set-active-project', label: 'Set as Active', action: 'set-active-project' });
            
            // Case 4 specific: Link to target project
            if (project && project.case === 4) {
                items.push({ id: 'link-to-project', label: 'Link to Target Project', action: 'link-to-project' });
            }
            
            // Other cases: Enhance from previous case or link from Case 4
            if (project && project.case !== 4) {
                items.push({ id: 'enhance-from-case', label: 'Enhance from Previous Case', action: 'enhance-from-case' });
                items.push({ id: 'link-from-case4', label: 'Link Input from Case 4', action: 'link-from-case4' });
            }
            
            items.push({ id: 'view-case-chain', label: 'View Case Chain', action: 'view-case-chain' });
            items.push({ id: 'delete-project', label: 'Delete Project', action: 'delete-project' });
        } else if (context.type === 'section') {
            const project = this.stateManager.getProject(context.projectId);
            const section = project?.sections.find(s => s.sectionId === context.sectionId);
            
            if (section) {
                const isComplete = section.status === 'complete';
                items.push({ 
                    id: 'mark-complete-section', 
                    label: isComplete ? 'Mark Incomplete' : 'Mark Complete', 
                    action: 'mark-complete-section' 
                });
                items.push({ id: 'edit-modifiers', label: 'Edit Modifiers', action: 'edit-modifiers' });
                items.push({ id: 'reset-modifiers', label: 'Reset Modifiers', action: 'reset-modifiers' });
                items.push({ id: 'copy-section-output', label: 'Copy Output', action: 'copy-section-output' });
                items.push({ id: 'copy-prompt-input', label: 'Copy Prompt + Input', action: 'copy-prompt-input' });
                items.push({ id: 'paste-previous-section', label: 'Paste from Previous', action: 'paste-previous-section' });
                items.push({ id: 'clear-section-output', label: 'Clear Output', action: 'clear-section-output' });
                items.push({ id: 'collapse-all-panels', label: 'Collapse All Panels', action: 'collapse-all-panels' });
                
                // Insert step options
                items.push({ id: 'separator-insert', label: '---', action: 'separator' });
                items.push({ id: 'insert-step-above', label: 'Insert Step Above', action: 'insert-step-above' });
                items.push({ id: 'insert-step-below', label: 'Insert Step Below', action: 'insert-step-below' });
                
                // Process step actions (if not a process step itself)
                if (!section.isProcessStep) {
                    items.push({ id: 'separator-process', label: '---', action: 'separator' });
                    items.push({ id: 'invoke-validation-loop', label: 'Invoke Validation Loop', action: 'invoke-validation-loop' });
                    items.push({ id: 'invoke-refinement-loop', label: 'Invoke Refinement Loop', action: 'invoke-refinement-loop' });
                    items.push({ id: 'invoke-integration-loop', label: 'Invoke Integration Loop', action: 'invoke-integration-loop' });
                }
                
                // View process step results if available
                if (section.isProcessStep) {
                    items.push({ id: 'separator-process', label: '---', action: 'separator' });
                    items.push({ id: 'view-process-step-results', label: 'View Process Step Results', action: 'view-process-step-results' });
                }
            }
        } else if (context.type === 'element') {
            items.push({ id: 'edit', label: 'Edit', action: 'edit' });
            items.push({ id: 'view-data', label: 'View Data', action: 'view-data' });
            items.push({ id: 'add-element', label: 'Add Element', action: 'add-element' });
            items.push({ id: 'delete', label: 'Delete', action: 'delete' });
            
            // Check if element has subtasks
            const element = this.stateManager.getElement(context.pageId, context.elementIndex);
            if (element && element.subtasks && element.subtasks.length > 0) {
                items.push({ id: 'toggle-subtasks', label: 'Toggle Subtasks', action: 'toggle-subtasks' });
            }
        } else if (context.type === 'subtask') {
            // Subtasks have limited options
            items.push({ id: 'view-data', label: 'View Data', action: 'view-data' });
        } else if (context.type === 'page') {
            items.push({ id: 'edit', label: 'Edit Page', action: 'edit-page' });
            items.push({ id: 'add-element', label: 'Add Element', action: 'add-element' });
            items.push({ id: 'delete-page', label: 'Delete Page', action: 'delete-page' });
            
            const state = this.stateManager.getState();
            const isExpanded = state.pageStates && state.pageStates[context.pageId] !== false;
            items.push({ 
                id: 'collapse-page', 
                label: isExpanded ? 'Collapse Page' : 'Expand Page', 
                action: 'collapse-page' 
            });
        } else if (context.type === 'empty') {
            items.push({ id: 'add-page', label: 'Add Page', action: 'add-page' });
            items.push({ id: 'collapse-all', label: 'Collapse All Pages', action: 'collapse-all' });
            items.push({ id: 'reset-today', label: 'Reset Today', action: 'reset-today' });
        } else if (context.type === 'pipelineFlowView') {
            items.push({ id: 'add-step', label: 'Add Step', action: 'add-step' });
        } else if (context.type === 'automationDirSection') {
            items.push({ id: 'open-automation-dir', label: 'Open Directory in File Browser', action: 'open-automation-dir' });
            items.push({ id: 'set-default-automation-dir', label: 'Set Default Directory', action: 'set-default-automation-dir' });
        } else if (context.type === 'createAutomationDirBtn') {
            items.push({ id: 'set-default-automation-dir', label: 'Set Default Directory', action: 'set-default-automation-dir' });
        } else if (context.type === 'pipelineSection') {
            // Menu items specific to pipeline flow view steps
            const project = this.stateManager.getProject(context.projectId);
            const section = project?.sections.find(s => s.sectionId === context.sectionId);
            
            if (section) {
                items.push({ id: 'jump-to-section', label: 'Jump to Section', action: 'jump-to-section' });
                items.push({ id: 'mark-complete-section', label: section.status === 'complete' ? 'Mark Incomplete' : 'Mark Complete', action: 'mark-complete-section' });
                items.push({ id: 'separator-insert', label: '---', action: 'separator' });
                items.push({ id: 'insert-step-above', label: 'Insert Step Above', action: 'insert-step-above' });
                items.push({ id: 'insert-step-below', label: 'Insert Step Below', action: 'insert-step-below' });
                items.push({ id: 'separator-delete', label: '---', action: 'separator' });
                items.push({ id: 'delete-step', label: 'Delete Step', action: 'delete-step' });
            }
        } else if (context.type === 'projectGroupDropdown') {
            // Menu items for project group dropdown right-click
            const state = this.stateManager.getState();
            const hasProjectGroup = state.metadata?.projectGroupName && state.metadata.projectGroupName.trim();
            
            items.push({ id: 'new-project-group', label: '🆕 Create New Project Group', action: 'new-project-group' });
            
            if (hasProjectGroup) {
                items.push({ id: 'edit-project-group', label: '✏️ Edit Project Group', action: 'edit-project-group' });
                items.push({ id: 'delete-project-group', label: '🗑️ Delete Project Group', action: 'delete-project-group' });
            }
        }
        
        return items;
    }
    
    // Update menu items visibility
    updateMenuItems(menu, items, context) {
        const allItems = menu.querySelectorAll('.context-menu-item');
        const visibleIds = new Set(items.map(item => item.id));
        
        allItems.forEach(item => {
            const itemId = item.id.replace('context-', '');
            if (visibleIds.has(itemId)) {
                item.style.display = 'block';
                // Update label if needed
                const menuItem = items.find(i => i.id === itemId);
                if (menuItem) {
                    item.textContent = menuItem.label;
                }
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // Position menu to stay in viewport
    positionMenu(menu, position) {
        const menuRect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let x = position.x;
        let y = position.y;
        
        // Adjust if menu would go off right edge
        if (x + menuRect.width > viewportWidth) {
            x = viewportWidth - menuRect.width - 10;
        }
        
        // Adjust if menu would go off bottom edge
        if (y + menuRect.height > viewportHeight) {
            y = viewportHeight - menuRect.height - 10;
        }
        
        // Ensure menu stays on screen
        x = Math.max(10, x);
        y = Math.max(10, y);
        
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
    }
    
    // Set up menu item click handlers
    setupMenuHandlers(menu, context) {
        // Remove all existing click listeners by cloning items
        menu.querySelectorAll('.context-menu-item').forEach(item => {
            const itemId = item.id.replace('context-', '');
            
            // Skip separator items
            if (itemId.includes('separator')) {
                return;
            }
            
            // Clone to remove old listeners
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            // Add click listener to all items (visibility check happens in selectAction if needed)
            newItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation(); // Prevent other handlers from running
                
                // Quick visibility check - avoid expensive getComputedStyle if possible
                if (newItem.style.display === 'none') {
                    return;
                }
                
                // Defer the action to avoid blocking the main thread
                // This allows the browser to handle the click event quickly
                setTimeout(() => {
                    // Final visibility check with computed style
                    const computedStyle = window.getComputedStyle(newItem);
                    if (computedStyle.display === 'none') {
                        return;
                    }
                    
                    // Call selectAction which will handle the action and hide the menu
                    this.selectAction(itemId, context);
                }, 0);
            }, true); // Use capture phase to handle before document click handler
        });
    }
    
    // Select menu action
    selectAction(actionId, context) {
        this.hideMenu();
        
        const action = {
            id: actionId,
            context: context
        };
        
        this.eventSystem.emit(EventType.CONTEXT_MENU_ACTION_SELECTED, {
            source: 'ContextMenuHandler',
            data: { action, context }
        });
    }
    
    // Action handlers (emit events for other modules to handle)
    handleEdit(context) {
        this.selectAction('edit', context);
    }
    
    handleEditPage(context) {
        this.selectAction('edit-page', context);
    }
    
    handleViewData(context) {
        this.selectAction('view-data', context);
    }
    
    handleAddElement(context) {
        this.selectAction('add-element', context);
    }
    
    handleDelete(context) {
        this.selectAction('delete', context);
    }
    
    handleDeletePage(context) {
        this.selectAction('delete-page', context);
    }
    
    handleAddPage(context) {
        this.selectAction('add-page', context);
    }
    
    handleCollapsePage(context) {
        this.selectAction('collapse-page', context);
    }
    
    handleCollapseAll(context) {
        this.selectAction('collapse-all', context);
    }
    
    handleToggleSubtasks(context) {
        this.selectAction('toggle-subtasks', context);
    }
    
    handleResetToday(context) {
        this.selectAction('reset-today', context);
    }
    
    // Setup touch gestures for two-finger context menu
    setupTouchGestures() {
        document.addEventListener('touchstart', (e) => {
            const touches = Array.from(e.touches);
            
            touches.forEach(touch => {
                if (!this.touchPoints[touch.identifier]) {
                    this.touchPoints[touch.identifier] = {
                        x: touch.clientX,
                        y: touch.clientY,
                        target: document.elementFromPoint(touch.clientX, touch.clientY),
                        time: Date.now()
                    };
                }
            });
            
            // Two-finger gesture
            if (touches.length === 2) {
                const touchIds = Object.keys(this.touchPoints).map(id => parseInt(id));
                const firstTouchId = touchIds.sort((a, b) => 
                    this.touchPoints[a].time - this.touchPoints[b].time
                )[0];
                
                const firstTouch = this.touchPoints[firstTouchId];
                const timeHeld = Date.now() - firstTouch.time;
                
                if (timeHeld >= 100 && firstTouch.target) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const targetAtPosition = document.elementFromPoint(firstTouch.x, firstTouch.y);
                    const context = this.determineContext(targetAtPosition || firstTouch.target);
                    
                    if (context) {
                        this.showMenu({ x: firstTouch.x, y: firstTouch.y }, context);
                    }
                }
            }
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            Array.from(e.touches).forEach(touch => {
                if (this.touchPoints[touch.identifier]) {
                    this.touchPoints[touch.identifier].x = touch.clientX;
                    this.touchPoints[touch.identifier].y = touch.clientY;
                }
            });
        });
        
        document.addEventListener('touchend', (e) => {
            Array.from(e.changedTouches).forEach(touch => {
                delete this.touchPoints[touch.identifier];
            });
            
            if (e.touches.length === 0) {
                this.touchPoints = {};
            }
        });
    }
}

