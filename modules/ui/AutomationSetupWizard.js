// Automation Setup Wizard - Guides users through automation configuration
class AutomationSetupWizard {
    constructor(stateManager, projectManager) {
        this.stateManager = stateManager;
        this.projectManager = projectManager;
        this.currentStep = 1;
        this.totalSteps = 4;
        this.wizardData = {
            engine: 'file-watching',
            automationDirectory: '',
            scopeDirectory: '',
            createNewDir: true
        };
    }
    
    /**
     * Show automation setup wizard
     * @param {string} projectId - Project ID
     */
    show(projectId) {
        this.projectId = projectId;
        this.currentStep = 1;
        const project = this.stateManager.getProject(projectId);
        
        if (!project) {
            console.error('Project not found:', projectId);
            return;
        }
        
        // Initialize wizard data from project
        this.wizardData = {
            engine: project.automationEngine || 'file-watching',
            automationDirectory: project.automationDirectory || '',
            scopeDirectory: project.scopeDirectory || '',
            createNewDir: !project.automationDirectory
        };
        
        // Show modal
        const modal = document.getElementById('automation-setup-wizard-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.renderStep(1);
        }
    }
    
    /**
     * Render current step
     * @param {number} step - Step number (1-4)
     */
    renderStep(step) {
        this.currentStep = step;
        const body = document.getElementById('automation-setup-wizard-body');
        if (!body) return;
        
        let html = '';
        
        switch (step) {
            case 1:
                html = this.renderStep1();
                break;
            case 2:
                html = this.renderStep2();
                break;
            case 3:
                html = this.renderStep3();
                break;
            case 4:
                html = this.renderStep4();
                break;
        }
        
        if (window.safeSetInnerHTML) {
            window.safeSetInnerHTML(body, html, { trusted: true });
        } else {
            body.innerHTML = html;
        }
        
        // Update step indicator
        this.updateStepIndicator();
        
        // Setup event handlers for current step
        this.setupStepHandlers(step);
    }
    
    /**
     * Render Step 1: Engine Selection
     * @returns {string} HTML string
     */
    renderStep1() {
        const engines = [
            {
                id: 'file-watching',
                name: 'File Watching (Traditional)',
                description: 'Watch for files created by LLM agents. Best for manual agent workflows.',
                icon: '👁️',
                useCases: [
                    'Manual agent interaction',
                    'Step-by-step execution',
                    'File-based workflows'
                ]
            },
            {
                id: 'cursor-cli',
                name: 'Cursor CLI (Sequential)',
                description: 'Execute steps sequentially via Cursor CLI. Best for automated sequential workflows.',
                icon: '⚡',
                useCases: [
                    'Automated sequential execution',
                    'Direct Cursor integration',
                    'Single-agent workflows'
                ]
            },
            {
                id: 'multi-agent',
                name: 'Multi-Agent (Parallel with Quality Gates)',
                description: 'Execute steps in parallel with multiple agents and quality checks. Best for complex projects.',
                icon: '🤖',
                useCases: [
                    'Parallel execution',
                    'Quality gate validation',
                    'Multi-agent collaboration'
                ]
            }
        ];
        
        const enginesHtml = engines.map(engine => {
            const isSelected = this.wizardData.engine === engine.id;
            return `
                <div class="wizard-engine-option ${isSelected ? 'selected' : ''}" data-engine="${engine.id}">
                    <div class="wizard-engine-header">
                        <span class="wizard-engine-icon">${engine.icon}</span>
                        <div class="wizard-engine-info">
                            <h4 class="wizard-engine-name">${this._escapeHtml(engine.name)}</h4>
                            <p class="wizard-engine-description">${this._escapeHtml(engine.description)}</p>
                        </div>
                    </div>
                    <div class="wizard-engine-usecases">
                        <strong>Best for:</strong>
                        <ul>
                            ${engine.useCases.map(uc => `<li>${this._escapeHtml(uc)}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div class="wizard-step-content">
                <h3>Select Automation Engine</h3>
                <p class="wizard-step-description">Choose the automation engine that best fits your workflow.</p>
                <div class="wizard-engine-options">
                    ${enginesHtml}
                </div>
            </div>
        `;
    }
    
    /**
     * Render Step 2: Directory Configuration
     * @returns {string} HTML string
     */
    renderStep2() {
        const project = this.stateManager.getProject(this.projectId);
        const caseNumber = project?.case || 1;
        const caseName = this._getCaseDisplayName(caseNumber);
        const caseNameSlug = caseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const projectNameSlug = (project?.name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const suggestedDir = `./automation-output/${projectNameSlug}-${caseNameSlug}`;
        
        return `
            <div class="wizard-step-content">
                <h3>Configure Automation Directory</h3>
                <p class="wizard-step-description">Set the directory where automation files will be created and watched.</p>
                
                <div class="wizard-radio-group">
                    <label class="wizard-radio-option ${this.wizardData.createNewDir ? 'selected' : ''}">
                        <input type="radio" name="dir-option" value="new" ${this.wizardData.createNewDir ? 'checked' : ''}>
                        <span>Create New Directory</span>
                    </label>
                    <label class="wizard-radio-option ${!this.wizardData.createNewDir ? 'selected' : ''}">
                        <input type="radio" name="dir-option" value="existing" ${!this.wizardData.createNewDir ? 'checked' : ''}>
                        <span>Use Existing Directory</span>
                    </label>
                </div>
                
                <div class="wizard-input-group">
                    <label for="wizard-automation-dir">Automation Directory:</label>
                    <input 
                        type="text" 
                        id="wizard-automation-dir" 
                        value="${this._escapeHtml(this.wizardData.automationDirectory || suggestedDir)}"
                        placeholder="${this._escapeHtml(suggestedDir)}"
                        class="wizard-input"
                    />
                    <button type="button" id="wizard-use-suggested" class="wizard-btn-secondary">Use Suggested</button>
                </div>
                
                <div class="wizard-help-text">
                    <p><strong>What is this?</strong></p>
                    <p>This directory is where LLM agents will create, edit, and read files during automation. The path will be used in prompts where {AUTOMATION_DIR} appears.</p>
                </div>
            </div>
        `;
    }
    
    /**
     * Render Step 3: Scope Directory (for cursor-cli/multi-agent)
     * @returns {string} HTML string
     */
    renderStep3() {
        const needsScopeDir = this.wizardData.engine === 'cursor-cli' || this.wizardData.engine === 'multi-agent';
        
        if (!needsScopeDir) {
            // Skip to next step
            this.renderStep(4);
            return '';
        }
        
        return `
            <div class="wizard-step-content">
                <h3>Configure Scope Directory</h3>
                <p class="wizard-step-description">Set the directory that restricts agent focus and context.</p>
                
                <div class="wizard-input-group">
                    <label for="wizard-scope-dir">Scope Directory:</label>
                    <input 
                        type="text" 
                        id="wizard-scope-dir" 
                        value="${this._escapeHtml(this.wizardData.scopeDirectory)}"
                        placeholder="./src or H:/Projects/myproject"
                        class="wizard-input"
                    />
                </div>
                
                <div class="wizard-help-text">
                    <p><strong>What is this?</strong></p>
                    <p>The scope directory limits the agent's focus to a specific part of your codebase. This helps agents stay focused and avoid modifying unrelated files.</p>
                    <p><strong>For ${this.wizardData.engine === 'cursor-cli' ? 'Cursor CLI' : 'Multi-Agent'}:</strong> This directory defines the working context for automation execution.</p>
                </div>
            </div>
        `;
    }
    
    /**
     * Render Step 4: Review & Confirm
     * @returns {string} HTML string
     */
    renderStep4() {
        const project = this.stateManager.getProject(this.projectId);
        const validation = this.validateConfiguration();
        
        return `
            <div class="wizard-step-content">
                <h3>Review & Confirm</h3>
                <p class="wizard-step-description">Review your configuration and start automation.</p>
                
                <div class="wizard-review-section">
                    <div class="wizard-review-item">
                        <strong>Automation Engine:</strong>
                        <span>${this._escapeHtml(this.wizardData.engine)}</span>
                    </div>
                    <div class="wizard-review-item">
                        <strong>Automation Directory:</strong>
                        <span class="wizard-review-path">${this._escapeHtml(this.wizardData.automationDirectory || 'Not set')}</span>
                    </div>
                    ${(this.wizardData.engine === 'cursor-cli' || this.wizardData.engine === 'multi-agent') ? `
                    <div class="wizard-review-item">
                        <strong>Scope Directory:</strong>
                        <span class="wizard-review-path">${this._escapeHtml(this.wizardData.scopeDirectory || 'Not set')}</span>
                    </div>
                    ` : ''}
                </div>
                
                ${validation.valid ? '' : `
                <div class="wizard-validation-errors">
                    <h4>Please fix the following issues:</h4>
                    <ul>
                        ${validation.errors.map(err => `<li>${this._escapeHtml(err)}</li>`).join('')}
                    </ul>
                </div>
                `}
            </div>
        `;
    }
    
    /**
     * Setup event handlers for current step
     * @param {number} step - Step number
     */
    setupStepHandlers(step) {
        switch (step) {
            case 1:
                document.querySelectorAll('.wizard-engine-option').forEach(option => {
                    option.addEventListener('click', () => {
                        document.querySelectorAll('.wizard-engine-option').forEach(opt => opt.classList.remove('selected'));
                        option.classList.add('selected');
                        this.wizardData.engine = option.dataset.engine;
                    });
                });
                break;
            case 2:
                document.querySelectorAll('input[name="dir-option"]').forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        this.wizardData.createNewDir = e.target.value === 'new';
                        document.querySelectorAll('.wizard-radio-option').forEach(opt => opt.classList.remove('selected'));
                        e.target.closest('.wizard-radio-option').classList.add('selected');
                    });
                });
                
                const dirInput = document.getElementById('wizard-automation-dir');
                if (dirInput) {
                    dirInput.addEventListener('input', (e) => {
                        this.wizardData.automationDirectory = e.target.value;
                    });
                }
                
                const useSuggestedBtn = document.getElementById('wizard-use-suggested');
                if (useSuggestedBtn) {
                    useSuggestedBtn.addEventListener('click', () => {
                        const project = this.stateManager.getProject(this.projectId);
                        const caseNumber = project?.case || 1;
                        const caseName = this._getCaseDisplayName(caseNumber);
                        const caseNameSlug = caseName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        const projectNameSlug = (project?.name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        const suggestedDir = `./automation-output/${projectNameSlug}-${caseNameSlug}`;
                        this.wizardData.automationDirectory = suggestedDir;
                        if (dirInput) {
                            dirInput.value = suggestedDir;
                        }
                    });
                }
                break;
            case 3:
                const scopeInput = document.getElementById('wizard-scope-dir');
                if (scopeInput) {
                    scopeInput.addEventListener('input', (e) => {
                        this.wizardData.scopeDirectory = e.target.value;
                    });
                }
                break;
        }
    }
    
    /**
     * Update step indicator
     */
    updateStepIndicator() {
        const indicator = document.getElementById('automation-setup-wizard-steps');
        if (!indicator) return;
        
        const steps = Array.from({ length: this.totalSteps }, (_, i) => i + 1);
        const html = steps.map(step => `
            <div class="wizard-step-indicator ${step === this.currentStep ? 'active' : step < this.currentStep ? 'completed' : ''}">
                <span class="wizard-step-number">${step < this.currentStep ? '✓' : step}</span>
                <span class="wizard-step-label">Step ${step}</span>
            </div>
        `).join('');
        
        if (window.safeSetInnerHTML) {
            window.safeSetInnerHTML(indicator, html, { trusted: true });
        } else {
            indicator.innerHTML = html;
        }
    }
    
    /**
     * Validate configuration
     * @returns {Object} Validation result
     */
    validateConfiguration() {
        const errors = [];
        
        if (!this.wizardData.automationDirectory || !this.wizardData.automationDirectory.trim()) {
            errors.push('Automation directory is required');
        }
        
        if ((this.wizardData.engine === 'cursor-cli' || this.wizardData.engine === 'multi-agent') && 
            (!this.wizardData.scopeDirectory || !this.wizardData.scopeDirectory.trim())) {
            errors.push('Scope directory is required for ' + this.wizardData.engine);
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Apply configuration to project
     */
    async applyConfiguration() {
        const validation = this.validateConfiguration();
        if (!validation.valid) {
            return { success: false, errors: validation.errors };
        }
        
        try {
            // Update project with wizard data
            this.stateManager.updateProject(this.projectId, {
                automationEngine: this.wizardData.engine,
                automationDirectory: this.wizardData.automationDirectory.trim(),
                scopeDirectory: (this.wizardData.scopeDirectory || '').trim() || null
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error applying configuration:', error);
            return { success: false, errors: [error.message] };
        }
    }
    
    /**
     * Get case display name
     * @private
     */
    _getCaseDisplayName(caseNumber) {
        const names = {
            1: 'Codebase Analysis',
            2: 'UI/UX-Only Analysis',
            3: 'User Input Analysis',
            4: 'Input Preparation',
            5: 'Documentation',
            6: 'Poiesis',
            7: 'Physis'
        };
        return names[caseNumber] || `Case ${caseNumber}`;
    }
    
    /**
     * Escape HTML helper
     * @private
     */
    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.AutomationSetupWizard = AutomationSetupWizard;
}
