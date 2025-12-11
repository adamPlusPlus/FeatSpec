// Rendering Engine - Renders UI components to DOM
class RenderingEngine {
    constructor(eventSystem, stateManager, dragDropHandler) {
        this.eventSystem = eventSystem;
        this.stateManager = stateManager;
        this.dragDropHandler = dragDropHandler;
        this.container = document.getElementById('pages-container'); // Legacy
        this.activeProjectId = null;
        this.activeSectionId = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for state changes and re-render
        this.eventSystem.register(EventType.STATE_CHANGED, (event) => {
            this.renderAll();
        });
        
        // Listen for project changes
        this.eventSystem.register(EventType.PROJECT_CREATED, () => this.renderAll());
        this.eventSystem.register(EventType.PROJECT_DELETED, () => this.renderAll());
        this.eventSystem.register(EventType.PROJECT_UPDATED, () => this.renderAll());
        this.eventSystem.register(EventType.PROJECT_ACTIVATED, () => this.renderAll());
        this.eventSystem.register(EventType.SECTION_UPDATED, () => this.renderAll());
        
        // Legacy page/element events (for backward compatibility)
        this.eventSystem.register(EventType.PAGE_ADDED, () => this.renderAll());
        this.eventSystem.register(EventType.PAGE_DELETED, () => this.renderAll());
        this.eventSystem.register(EventType.PAGE_REORDERED, () => this.renderAll());
        this.eventSystem.register(EventType.ELEMENT_ADDED, () => this.renderAll());
        this.eventSystem.register(EventType.ELEMENT_DELETED, () => this.renderAll());
        this.eventSystem.register(EventType.ELEMENT_UPDATED, () => this.renderAll());
        this.eventSystem.register(EventType.ELEMENT_REORDERED, () => this.renderAll());
    }
    
    // Render all - checks for new format (projects) or old format (pages)
    renderAll() {
        const state = this.stateManager.getState();
        
        // Check if using new format (projects) or old format (pages)
        if (state.projects && Array.isArray(state.projects)) {
            this.renderProjectsSidebar();
            this.renderSectionView();
            this.renderPipelineFlowView();
        } else if (state.pages && Array.isArray(state.pages)) {
            // Legacy rendering for old format
            this.renderLegacyPages();
        }
    }
    
    // Render projects sidebar
    renderProjectsSidebar() {
        const sidebar = document.getElementById('projects-list');
        if (!sidebar) return;
        
        const state = this.stateManager.getState();
        const activeProjectId = state.activeProjectId;
        
        sidebar.innerHTML = '';
        
        if (state.projects.length === 0) {
            sidebar.innerHTML = '<p class="empty-message">No projects yet. Create a project to get started!</p>';
            return;
        }
        
        state.projects.forEach(project => {
            const projectEl = this.renderProjectItem(project, activeProjectId === project.id);
            sidebar.appendChild(projectEl);
        });
    }
    
    // Render a single project item in sidebar
    renderProjectItem(project, isActive) {
        const item = document.createElement('div');
        item.className = `project-item ${isActive ? 'active' : ''}`;
        item.dataset.projectId = project.id;
        
        // Calculate completion percentage
        const totalSections = project.sections.length;
        const completeSections = project.sections.filter(s => s.status === 'complete').length;
        const progress = totalSections > 0 ? Math.round((completeSections / totalSections) * 100) : 0;
        
        // Status indicator
        let statusIcon = '○';
        if (project.status === 'complete') statusIcon = '●';
        else if (project.status === 'in_progress') statusIcon = '◐';
        
        // Get case information
        const caseNumber = project.case || 1;
        const caseName = this.getCaseDisplayName(caseNumber);
        const caseBadge = this.renderCaseBadge(caseNumber, project.caseChain);
        
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
        
        item.innerHTML = `
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
            if (window.app) {
                window.app.stateManager.setActiveProject(project.id);
                // Auto-navigate to first incomplete section
                let firstIncomplete = null;
                if (typeof window.app.getFirstIncompleteSection === 'function') {
                    try {
                        firstIncomplete = window.app.getFirstIncompleteSection(project.id);
                    } catch (error) {
                        console.warn('Error getting first incomplete section:', error);
                    }
                }
                if (firstIncomplete) {
                    this.activeSectionId = firstIncomplete.id;
                }
                this.renderAll();
            }
        });
        
        return item;
    }
    
    // Render case badge
    renderCaseBadge(caseNumber, caseChain = null) {
        const caseName = this.getCaseDisplayName(caseNumber);
        const caseClass = `case-badge case-${caseNumber}`;
        const chainIndicator = caseChain ? ` (from Case ${caseChain.previousCase})` : '';
        return `<span class="${caseClass}" title="${caseName}${chainIndicator}">Case ${caseNumber}</span>`;
    }
    
    // Get case display name
    getCaseDisplayName(caseNumber) {
        const caseNames = {
            1: 'Codebase Analysis',
            2: 'UI/UX-Only Analysis',
            3: 'User Input Analysis',
            4: 'Enhancement',
            5: 'Iterative Idea Refinement',
            6: 'Poiesis',
            7: 'Physis'
        };
        return caseNames[caseNumber] || `Case ${caseNumber}`;
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
                `<button class="modifier-remove" onclick="app.removeModifier('${projectId}', '${sectionId}', '${modifier}')" title="Remove modifier">×</button>` : '';
            
            return `<span class="${modifierClass}" title="${modifier}">
                ${modifier}
                ${removeBtn}
            </span>`;
        }).join('');
        
        const editBtn = editable ? 
            `<button class="btn-edit-modifiers" onclick="app.showModifierEditorModal('${projectId}', '${sectionId}')" title="Edit modifiers">✏️ Edit</button>` : '';
        
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
            if (window.app && typeof window.app.getFirstIncompleteSection === 'function') {
                try {
                    firstIncomplete = window.app.getFirstIncompleteSection(activeProject.id);
                } catch (error) {
                    console.warn('Error getting first incomplete section:', error);
                }
            }
            this.activeSectionId = firstIncomplete?.id || activeProject.sections[0]?.sectionId;
        }
        
        const section = activeProject.sections.find(s => s.sectionId === this.activeSectionId);
        if (!section) {
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
        
        sectionView.innerHTML = this.renderSectionContent(activeProject, section);
        
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
                const selector = `.section-${textareaType}[data-section-id="${section.sectionId}"]`;
                const newTextarea = sectionView.querySelector(selector);
                if (newTextarea) {
                    // Use setTimeout to ensure the textarea is fully rendered
                    setTimeout(() => {
                        // Restore textarea scroll position first
                        if (textareaScrollTop !== null && textareaScrollTop >= 0) {
                            newTextarea.scrollTop = textareaScrollTop;
                        }
                        // Then restore focus and cursor position
                        newTextarea.focus();
                        if (cursorPosition !== null && cursorPosition <= newTextarea.value.length) {
                            newTextarea.setSelectionRange(cursorPosition, cursorPosition);
                        }
                    }, 0);
                }
            }
        });
        
        // Load process step buttons asynchronously
        this.loadProcessStepButtons(activeProject, section);
        
        // Load input placeholder asynchronously
        this.loadInputPlaceholder(activeProject, section);
    }
    
    // Load process step buttons asynchronously
    async loadProcessStepButtons(project, section) {
        if (section.isProcessStep) {
            return; // Don't show process step buttons on process step sections themselves
        }
        
        const container = document.querySelector(`.process-step-buttons-container[data-project-id="${project.id}"][data-section-id="${section.sectionId}"]`);
        if (!container) return;
        
        const pipelineConfig = window.PipelineConfig;
        if (!pipelineConfig) {
            container.innerHTML = '';
            return;
        }
        
        try {
            const triggers = await pipelineConfig.getProcessStepTriggers(project.case || 1, section.stepName || section.sectionId);
            if (!triggers || triggers.length === 0) {
                container.innerHTML = '';
                return;
            }
            
            const buttons = triggers.map(trigger => {
                const buttonClass = trigger.required ? 'btn-process-step required' : 'btn-process-step';
                const buttonText = trigger.name.replace('-loop', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return `<button class="${buttonClass}" onclick="app.invokeProcessStep('${project.id}', '${section.sectionId}', '${trigger.name}')" title="${trigger.required ? 'Required' : 'Optional'} process step">
                    ⚙️ ${buttonText}
                </button>`;
            }).join('');
            
            container.innerHTML = `<div class="process-step-buttons">
                <h4>Process Steps</h4>
                <div class="process-step-actions">
                    ${buttons}
                </div>
            </div>`;
        } catch (error) {
            console.error('Error loading process step buttons:', error);
            container.innerHTML = '';
        }
    }
    
    // Load input placeholder asynchronously
    async loadInputPlaceholder(project, section) {
        const textarea = document.querySelector(`.section-input[data-project-id="${project.id}"][data-section-id="${section.sectionId}"]`);
        if (!textarea) return;
        
        try {
            const placeholder = await this.getInputPlaceholder(section, project);
            if (placeholder) {
                textarea.placeholder = placeholder;
            }
        } catch (error) {
            console.warn('Failed to load input placeholder:', error);
            textarea.placeholder = 'Enter input for this section...';
        }
    }
    
    // Render section content
    renderSectionContent(project, section) {
        const config = window.PipelineConfig;
        const sectionDef = config?.getSection(section.sectionId);
        
        // Check dependencies
        let deps = { met: true, missing: [] };
        if (window.app && typeof window.app.checkDependencies === 'function') {
            try {
                deps = window.app.checkDependencies(project.id, section.sectionId) || { met: true, missing: [] };
            } catch (error) {
                console.warn('Error checking dependencies:', error);
            }
        }
        const isLocked = !deps.met;
        
        // Status indicator
        let statusClass = 'status-not-started';
        let statusText = 'Not Started';
        if (section.status === 'complete') {
            statusClass = 'status-complete';
            statusText = 'Complete';
        } else if (section.status === 'in_progress') {
            statusClass = 'status-in-progress';
            statusText = 'In Progress';
        } else if (section.status === 'needs_revision') {
            statusClass = 'status-needs-revision';
            statusText = 'Needs Revision';
        }
        
        // Navigation
        const prevSection = config?.getPreviousSection(section.sectionId, project.sections);
        const nextSection = config?.getNextSection(section.sectionId, project.sections);
        
        // Get case information
        const caseNumber = project.case || 1;
        const caseBadge = this.renderCaseBadge(caseNumber, project.caseChain);
        const caseChainInfo = project.caseChain ? 
            `<span class="case-chain-info" title="Enhanced from Case ${project.caseChain.previousCase}">🔗 Enhanced from Case ${project.caseChain.previousCase}</span>` : '';
        
        // Get workflow context (step position)
        const currentIndex = project.sections.findIndex(s => s.sectionId === section.sectionId);
        const totalSteps = project.sections.length;
        const workflowContext = `Step ${currentIndex + 1} of ${totalSteps}`;
        
        // Get section type badge
        const sectionTypeBadge = this.renderSectionTypeBadge(section);
        
        return `
            <div class="section-view-content">
                <div class="section-case-header">
                    ${caseBadge}
                    ${caseChainInfo}
                    <span class="workflow-context">${workflowContext}</span>
                    ${sectionTypeBadge}
                </div>
                <div class="section-header">
                    <div class="section-title-row">
                        <h2 class="section-title">${this.escapeHtml(section.sectionName)}</h2>
                        <span class="section-status ${statusClass}">${statusText}</span>
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
                            onchange="app.updateAutomationId('${project.id}', '${section.sectionId}', this.value)"
                            onblur="app.validateAutomationId('${project.id}', '${section.sectionId}', this.value)"
                        />
                        <span class="automation-id-status" id="automation-id-status-${section.sectionId}" style="margin-left: 8px; font-size: 11px;"></span>
                    </div>
                    <div class="section-navigation">
                        <button class="btn-nav" ${!prevSection ? 'disabled' : ''} onclick="app.navigateToSection('${project.id}', '${prevSection?.sectionId || ''}')">← Previous</button>
                        <select class="section-jump" onchange="app.navigateToSection('${project.id}', this.value)">
                            ${project.sections.map(s => 
                                `<option value="${s.sectionId}" ${s.sectionId === section.sectionId ? 'selected' : ''}>${s.sectionName}</option>`
                            ).join('')}
                        </select>
                        <button class="btn-nav" ${!nextSection ? 'disabled' : ''} onclick="app.navigateToSection('${project.id}', '${nextSection?.sectionId || ''}')">Next →</button>
                    </div>
                </div>
                
                ${isLocked ? `
                    <div class="section-locked">
                        <p>⚠️ This section is locked. Complete the following sections first:</p>
                        <ul>
                            ${deps.missing.map(depId => {
                                const depSection = project.sections.find(s => s.sectionId === depId);
                                return `<li>${depSection?.sectionName || depId}</li>`;
                            }).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${section.isInferenceStep ? `
                    <div class="inference-step-indicator">
                        <span class="inference-badge">🔍 Inference Step</span>
                        <p>This is an inference step that generates implementation details from UX specifications.</p>
                    </div>
                ` : ''}
                
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
                
                <div class="section-panels">
                    <div class="section-panel prompt-panel" data-project-id="${project.id}" data-section-id="${section.sectionId}">
                        <div class="panel-header">
                            <h3>Prompt Template</h3>
                            <button class="btn-collapse" onclick="this.parentElement.nextElementSibling.classList.toggle('collapsed'); this.textContent = this.parentElement.nextElementSibling.classList.contains('collapsed') ? '▶' : '▼';">▼</button>
                        </div>
                        <div class="panel-content">
                            <pre class="prompt-text">${this.escapeHtml(section.prompt || 'Loading prompt...')}</pre>
                            <button class="btn-copy" onclick="app.copyPromptWithInput('${project.id}', '${section.sectionId}')">Copy Prompt + Input</button>
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
                                <button class="btn-paste" onclick="app.pasteFromPreviousSection('${project.id}', '${section.sectionId}')">Paste from Previous</button>
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
            </div>
        `;
    }
    
    // Render pipeline flow view
    renderPipelineFlowView() {
        const flowView = document.getElementById('pipeline-flow-view');
        if (!flowView) return;
        
        const state = this.stateManager.getState();
        const activeProject = this.stateManager.getActiveProject();
        
        if (!activeProject) {
            flowView.innerHTML = '<div class="pipeline-flow-placeholder"><p>Select a project to view pipeline</p></div>';
            return;
        }
        
        // Get case information
        const caseNumber = activeProject.case || 1;
        const caseBadge = this.renderCaseBadge(caseNumber, activeProject.caseChain);
        const caseChainInfo = activeProject.caseChain ? 
            `<span class="case-chain-info" title="Enhanced from Case ${activeProject.caseChain.previousCase}">🔗 Enhanced from Case ${activeProject.caseChain.previousCase}</span>` : '';
        
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
        
        html += '<div class="pipeline-sections">';
        
        // Render all sections from the project (includes inference steps for Case 2)
        activeProject.sections.forEach((section, index) => {
            let deps = { met: true };
            if (window.app && typeof window.app.checkDependencies === 'function') {
                try {
                    deps = window.app.checkDependencies(activeProject.id, section.sectionId) || { met: true };
                } catch (error) {
                    console.warn('Error checking dependencies:', error);
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
            if (activeProject.automationEngine === 'multi-agent' && section.status === 'complete') {
                // Try to get quality score from multi-agent system if available
                if (window.app && window.app.multiAgentAutomation && window.app.multiAgentAutomation.qualityScores) {
                    const qualityScore = window.app.multiAgentAutomation.qualityScores.get(section.sectionId);
                    if (qualityScore && typeof qualityScore.score === 'number') {
                        const scorePercent = (qualityScore.score * 100).toFixed(0);
                        const scoreColor = qualityScore.score >= 0.9 ? '#4caf50' : 
                                         qualityScore.score >= 0.8 ? '#8bc34a' : 
                                         qualityScore.score >= 0.7 ? '#ff9800' : '#f44336';
                        qualityScoreBadge = `<span class="quality-score" style="color: ${scoreColor};" title="Quality Score: ${scorePercent}%">⭐ ${scorePercent}%</span>`;
                    }
                }
            }
            
            html += `
                <div class="pipeline-section-item ${lockedClass} ${activeClass} ${sectionTypeClass}" 
                     data-project-id="${activeProject.id}" 
                     data-section-id="${section.sectionId}" 
                     onclick="app.navigateToSection('${activeProject.id}', '${section.sectionId}')">
                    <div class="section-item-header">
                        <span class="section-icon">${isLocked ? '🔒' : statusIcon}</span>
                        <span class="section-name">${this.escapeHtml(section.sectionName)}</span>
                        ${typeBadge}
                    </div>
                    <div class="section-item-meta">
                        ${modifierBadges}
                        ${qualityScoreBadge}
                        ${activeProject.automationEngine === 'multi-agent' && window.app && window.app.multiAgentAutomation && window.app.multiAgentAutomation.agentDiscussions ? this.renderAgentDiscussionIndicator(activeProject.id, section.sectionId) : ''}
                        <span class="section-status">${section.status === 'complete' ? '✓' : section.status === 'in_progress' ? '⏳' : section.status === 'needs_revision' ? '⚠' : ''}</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        html += '</div>';
        
        flowView.innerHTML = html;
        
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
            console.warn('pages-container not found, skipping render');
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
        header.innerHTML = `
            <span class="page-toggle-arrow" id="${pageToggleId}" style="cursor: pointer; margin-right: 8px; color: #888888; user-select: none;">${arrow}</span>
            <div class="page-title" data-page-id="${page.id}">${this.escapeHtml(page.title)}</div>
            <div class="page-controls">
                <button onclick="app.deletePage('${page.id}')">Delete</button>
            </div>
        `;
        
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
            if (window.app) {
                window.app.showAddElementModal(page.id);
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
                div.innerHTML = `<div class="header-text">${this.escapeHtml(element.text)}</div>`;
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
                           onchange="app.toggleMultiCheckboxItem('${pageId}', ${elementIndex}, ${itemIndex})">
                    <span class="checkbox-label">${this.escapeHtml(item.text)}</span>
                    ${element.items.length > 1 ? `<button onclick="app.removeMultiCheckboxItem('${pageId}', ${elementIndex}, ${itemIndex})" style="padding: 2px 6px; font-size: 11px; background: #e74c3c;">×</button>` : ''}
                </div>
            `;
        }).join('');
        
        div.innerHTML = `
            ${itemsHtml}
            <div class="multi-checkbox-controls">
                <button onclick="app.addMultiCheckboxItem('${pageId}', ${elementIndex})">+ Add</button>
            </div>
        `;
        
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
            
            // Open edit modal via app instance
            if (window.app && typeof window.app.showEditModal === 'function') {
                window.app.showEditModal(pageId, elementIndex);
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
        tooltip.style.cssText = 'position: absolute; background: #333; color: #fff; padding: 5px 10px; border-radius: 4px; z-index: 10000; pointer-events: none;';
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
    async getInputPlaceholder(section, project) {
        const stepName = section.stepName || section.sectionId;
        
        // Try to load input guidance from the step file
        if (window.PromptLoader) {
            try {
                const guidance = await window.PromptLoader.getInputGuidance(
                    stepName,
                    section.isProcessStep,
                    section.isInferenceStep,
                    section.processStepType
                );
                
                if (guidance) {
                    // Extract the first meaningful line for placeholder (usually the bullet point)
                    const lines = guidance.split('\n').filter(line => line.trim());
                    for (const line of lines) {
                        // Look for bullet points or bold text
                        const cleanLine = line.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '').trim();
                        if (cleanLine && cleanLine.length < 100) {
                            // Use first reasonable line, but truncate if too long
                            return cleanLine.length > 80 ? cleanLine.substring(0, 77) + '...' : cleanLine;
                        }
                    }
                    // If no good line found, use first line truncated
                    if (lines.length > 0) {
                        const firstLine = lines[0].replace(/^[-*•]\s*/, '').replace(/\*\*/g, '').trim();
                        return firstLine.length > 80 ? firstLine.substring(0, 77) + '...' : firstLine;
                    }
                }
            } catch (error) {
                console.warn('Failed to load input guidance:', error);
            }
        }
        
        // Fallback to generic placeholder
        return 'Enter input for this section...';
    }
    
    // Render agent discussion indicator for multi-agent projects
    renderAgentDiscussionIndicator(projectId, sectionId) {
        if (!window.app || !window.app.multiAgentAutomation) {
            return '';
        }
        
        const discussionId = `discussion-${sectionId}`;
        const discussion = window.app.multiAgentAutomation.agentDiscussions.get(discussionId);
        
        if (!discussion || discussion.length === 0) {
            return '';
        }
        
        return `<span class="agent-discussion-indicator" 
                      title="View agent conversations (${discussion.length} messages)" 
                      onclick="event.stopPropagation(); app.showAgentConversations('${projectId}', '${sectionId}');"
                      style="cursor: pointer; color: #9C27B0; font-size: 0.9em; margin-right: 4px;">💬 ${discussion.length}</span>`;
    }
}

