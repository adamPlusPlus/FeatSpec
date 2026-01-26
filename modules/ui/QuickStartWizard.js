// Quick Start Wizard - 4-step onboarding wizard for new users
class QuickStartWizard {
    constructor(stateManager, projectManager, appInstance) {
        this.stateManager = stateManager;
        this.projectManager = projectManager;
        this.appInstance = appInstance;
        this.currentStep = 1;
        this.totalSteps = 4;
        this.wizardData = {
            skipAutomation: false,
            projectName: '',
            projectDescription: '',
            caseNumber: null,
            templateId: 'empty',
            automationEngine: 'file-watching',
            automationDirectory: '',
            scopeDirectory: ''
        };
    }
    
    /**
     * Check if wizard should be shown
     * @returns {boolean} True if wizard should be shown
     */
    shouldShow() {
        // Check if user has dismissed wizard
        const dismissed = localStorage.getItem('quickStartWizardDismissed');
        if (dismissed === 'true') {
            return false;
        }
        
        // Check if user has any projects
        const state = this.stateManager.getState();
        const hasProjects = state.projects && state.projects.length > 0;
        
        // Show if no projects exist
        return !hasProjects;
    }
    
    /**
     * Show quick start wizard
     */
    show() {
        if (!this.shouldShow()) {
            return;
        }
        
        const modal = document.getElementById('quick-start-wizard-modal');
        if (!modal) {
            return;
        }
        
        modal.style.display = 'flex';
        this.currentStep = 1;
        this.renderStep(1);
        this.setupHandlers();
    }
    
    /**
     * Render current step
     * @param {number} step - Step number (1-4)
     */
    renderStep(step) {
        this.currentStep = step;
        const body = document.getElementById('quick-start-wizard-body');
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
        
        this.updateStepIndicator();
        this.setupStepHandlers(step);
    }
    
    /**
     * Render Step 1: Welcome & Purpose
     * @returns {string} HTML string
     */
    renderStep1() {
        return `
            <div class="wizard-step-content welcome-step">
                <div class="welcome-header">
                    <h2>Welcome to Feature Specification Creator!</h2>
                    <p class="welcome-subtitle">Let's get you started in just a few steps</p>
                </div>
                
                <div class="welcome-content">
                    <div class="welcome-section">
                        <h3>What is this app?</h3>
                        <p>This tool helps you create detailed feature specifications by breaking down complex features into structured, actionable sections. It guides you through a systematic workflow to ensure nothing is missed.</p>
                    </div>
                    
                    <div class="welcome-section">
                        <h3>How it works:</h3>
                        <ol class="welcome-list">
                            <li><strong>Choose a case type</strong> - Select the analysis type that matches your needs</li>
                            <li><strong>Work through sections</strong> - Complete each section step-by-step</li>
                            <li><strong>Use automation</strong> - Optionally automate sections with AI agents</li>
                            <li><strong>Export your spec</strong> - Generate a complete feature specification</li>
                        </ol>
                    </div>
                    
                    <div class="welcome-section">
                        <h3>Example use cases:</h3>
                        <ul class="welcome-list">
                            <li>Analyzing existing codebases to document features</li>
                            <li>Creating specs from UI/UX observations</li>
                            <li>Processing user input into structured specifications</li>
                            <li>Building comprehensive feature documentation</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render Step 2: Project Type Selection
     * @returns {string} HTML string
     */
    renderStep2() {
        const pipelineConfig = window.PipelineConfig;
        if (!pipelineConfig) {
            return '<div class="wizard-error">Pipeline config not available</div>';
        }
        
        // Get recommended case for beginners
        const recommendedCase = 1; // Case 1 is usually best for beginners
        
        return `
            <div class="wizard-step-content">
                <h3>Select Project Type</h3>
                <p class="wizard-step-description">Choose the type of analysis that best fits your needs. Don't worry, you can create more projects later!</p>
                
                <div class="wizard-case-recommendations">
                    <div class="recommendation-card recommended">
                        <div class="recommendation-badge">Recommended for Beginners</div>
                        <h4>Case 1: Codebase Analysis</h4>
                        <p>Best if you have access to source code. Perfect for understanding existing features and documenting implementations.</p>
                        <button class="wizard-case-btn" data-case="1">Select This</button>
                    </div>
                    
                    <div class="recommendation-card">
                        <h4>Other Options</h4>
                        <p>You can explore other case types after creating your first project, or click "Skip" to see all options.</p>
                        <button class="wizard-case-btn-secondary" id="show-all-cases-btn">Show All Cases</button>
                    </div>
                </div>
                
                <div id="all-cases-list" class="all-cases-list" style="display: none;">
                    <!-- Will be populated dynamically -->
                </div>
            </div>
        `;
    }
    
    /**
     * Render Step 3: Project Details
     * @returns {string} HTML string
     */
    renderStep3() {
        const projectTemplates = window.ProjectTemplates ? new window.ProjectTemplates() : null;
        const templates = projectTemplates ? projectTemplates.getAllTemplates() : [];
        
        const templatesHtml = templates.map(template => `
            <div class="wizard-template-option ${template.id === this.wizardData.templateId ? 'selected' : ''}" data-template="${template.id}">
                <span class="template-icon-small">${template.icon}</span>
                <div class="template-info-small">
                    <span class="template-name-small">${this._escapeHtml(template.name)}</span>
                    <span class="template-description-small">${this._escapeHtml(template.description)}</span>
                </div>
            </div>
        `).join('');
        
        return `
            <div class="wizard-step-content">
                <h3>Project Details</h3>
                <p class="wizard-step-description">Give your project a name and optionally choose a template to get started.</p>
                
                <div class="wizard-input-group">
                    <label for="wizard-project-name">Project Name *</label>
                    <input 
                        type="text" 
                        id="wizard-project-name" 
                        value="${this._escapeHtml(this.wizardData.projectName)}"
                        placeholder="My Feature Spec"
                        class="wizard-input"
                        required
                    />
                </div>
                
                <div class="wizard-input-group">
                    <label for="wizard-project-description">Description (Optional)</label>
                    <textarea 
                        id="wizard-project-description" 
                        placeholder="Brief description of what this project is about..."
                        class="wizard-input"
                        rows="3"
                    >${this._escapeHtml(this.wizardData.projectDescription)}</textarea>
                </div>
                
                ${templates.length > 0 ? `
                <div class="wizard-input-group">
                    <label>Template (Optional)</label>
                    <div class="wizard-template-options">
                        ${templatesHtml}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }
    
    /**
     * Render Step 4: Automation Setup
     * @returns {string} HTML string
     */
    renderStep4() {
        return `
            <div class="wizard-step-content">
                <h3>Automation Setup (Optional)</h3>
                <p class="wizard-step-description">You can set up automation now or skip this step and configure it later.</p>
                
                <div class="wizard-checkbox-group">
                    <label class="wizard-checkbox-option">
                        <input type="checkbox" id="wizard-skip-automation" ${this.wizardData.skipAutomation ? 'checked' : ''}>
                        <span>Skip automation setup for now</span>
                    </label>
                </div>
                
                <div id="wizard-automation-options" class="wizard-automation-options" style="${this.wizardData.skipAutomation ? 'display: none;' : ''}">
                    <div class="wizard-input-group">
                        <label for="wizard-auto-engine">Automation Engine:</label>
                        <select id="wizard-auto-engine" class="wizard-input">
                            <option value="file-watching" ${this.wizardData.automationEngine === 'file-watching' ? 'selected' : ''}>File Watching (Recommended for beginners)</option>
                            <option value="cursor-cli" ${this.wizardData.automationEngine === 'cursor-cli' ? 'selected' : ''}>Cursor CLI</option>
                            <option value="multi-agent" ${this.wizardData.automationEngine === 'multi-agent' ? 'selected' : ''}>Multi-Agent</option>
                        </select>
                    </div>
                    
                    <div class="wizard-input-group">
                        <label for="wizard-auto-dir">Automation Directory (Optional):</label>
                        <input 
                            type="text" 
                            id="wizard-auto-dir" 
                            value="${this._escapeHtml(this.wizardData.automationDirectory)}"
                            placeholder="./automation-output"
                            class="wizard-input"
                        />
                        <p class="wizard-help-text-small">Leave empty to set up later</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Setup step-specific handlers
     * @param {number} step - Step number
     */
    setupStepHandlers(step) {
        switch (step) {
            case 2:
                document.querySelectorAll('.wizard-case-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const caseNumber = parseInt(e.target.dataset.case);
                        this.wizardData.caseNumber = caseNumber;
                        this.renderStep(3);
                        this.updateButtons();
                    });
                });
                
                const showAllBtn = document.getElementById('show-all-cases-btn');
                const allCasesList = document.getElementById('all-cases-list');
                if (showAllBtn && allCasesList) {
                    showAllBtn.addEventListener('click', async () => {
                        if (allCasesList.style.display === 'none') {
                            await this.loadAllCases(allCasesList);
                            allCasesList.style.display = 'block';
                            showAllBtn.textContent = 'Hide All Cases';
                        } else {
                            allCasesList.style.display = 'none';
                            showAllBtn.textContent = 'Show All Cases';
                        }
                    });
                }
                break;
            case 3:
                const nameInput = document.getElementById('wizard-project-name');
                const descInput = document.getElementById('wizard-project-description');
                
                if (nameInput) {
                    nameInput.addEventListener('input', (e) => {
                        this.wizardData.projectName = e.target.value;
                    });
                }
                
                if (descInput) {
                    descInput.addEventListener('input', (e) => {
                        this.wizardData.projectDescription = e.target.value;
                    });
                }
                
                document.querySelectorAll('.wizard-template-option').forEach(option => {
                    option.addEventListener('click', () => {
                        document.querySelectorAll('.wizard-template-option').forEach(opt => opt.classList.remove('selected'));
                        option.classList.add('selected');
                        this.wizardData.templateId = option.dataset.template;
                    });
                });
                break;
            case 4:
                const skipCheckbox = document.getElementById('wizard-skip-automation');
                const autoOptions = document.getElementById('wizard-automation-options');
                
                if (skipCheckbox) {
                    skipCheckbox.addEventListener('change', (e) => {
                        this.wizardData.skipAutomation = e.target.checked;
                        if (autoOptions) {
                            autoOptions.style.display = e.target.checked ? 'none' : 'block';
                        }
                    });
                }
                
                const engineSelect = document.getElementById('wizard-auto-engine');
                const autoDirInput = document.getElementById('wizard-auto-dir');
                
                if (engineSelect) {
                    engineSelect.addEventListener('change', (e) => {
                        this.wizardData.automationEngine = e.target.value;
                    });
                }
                
                if (autoDirInput) {
                    autoDirInput.addEventListener('input', (e) => {
                        this.wizardData.automationDirectory = e.target.value;
                    });
                }
                break;
        }
    }
    
    /**
     * Load all cases for display
     * @private
     */
    async loadAllCases(container) {
        const pipelineConfig = window.PipelineConfig;
        if (!pipelineConfig) return;
        
        try {
            const cases = await pipelineConfig.getAllCases();
            const html = cases.map(caseInfo => `
                <div class="wizard-case-option" data-case="${caseInfo.number}">
                    <h4>Case ${caseInfo.number}: ${this._escapeHtml(caseInfo.name)}</h4>
                    <p>${this._escapeHtml(caseInfo.description)}</p>
                    <button class="wizard-case-btn" data-case="${caseInfo.number}">Select</button>
                </div>
            `).join('');
            
            if (window.safeSetInnerHTML) {
                window.safeSetInnerHTML(container, html, { trusted: true });
            } else {
                container.innerHTML = html;
            }
            
            // Setup handlers for dynamically added buttons
            container.querySelectorAll('.wizard-case-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const caseNumber = parseInt(e.target.dataset.case);
                    this.wizardData.caseNumber = caseNumber;
                    this.renderStep(3);
                    this.updateButtons();
                });
            });
        } catch (error) {
            console.error('Error loading cases:', error);
        }
    }
    
    /**
     * Update step indicator
     */
    updateStepIndicator() {
        const indicator = document.getElementById('quick-start-wizard-steps');
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
     * Update navigation buttons
     */
    updateButtons() {
        const prevBtn = document.getElementById('quick-start-wizard-prev');
        const nextBtn = document.getElementById('quick-start-wizard-next');
        const finishBtn = document.getElementById('quick-start-wizard-finish');
        
        if (prevBtn) {
            prevBtn.style.display = this.currentStep > 1 ? 'inline-block' : 'none';
        }
        
        if (nextBtn) {
            nextBtn.style.display = this.currentStep < this.totalSteps ? 'inline-block' : 'none';
        }
        
        if (finishBtn) {
            finishBtn.style.display = this.currentStep === this.totalSteps ? 'inline-block' : 'none';
        }
    }
    
    /**
     * Setup wizard handlers
     */
    setupHandlers() {
        const modal = document.getElementById('quick-start-wizard-modal');
        const prevBtn = document.getElementById('quick-start-wizard-prev');
        const nextBtn = document.getElementById('quick-start-wizard-next');
        const finishBtn = document.getElementById('quick-start-wizard-finish');
        const closeBtn = document.getElementById('quick-start-wizard-close');
        const skipBtn = document.getElementById('quick-start-wizard-skip');
        
        if (!modal) return;
        
        prevBtn?.addEventListener('click', () => {
            if (this.currentStep > 1) {
                this.renderStep(this.currentStep - 1);
                this.updateButtons();
            }
        });
        
        nextBtn?.addEventListener('click', () => {
            if (this.validateStep(this.currentStep)) {
                if (this.currentStep < this.totalSteps) {
                    this.renderStep(this.currentStep + 1);
                    this.updateButtons();
                }
            }
        });
        
        finishBtn?.addEventListener('click', async () => {
            if (this.validateStep(this.currentStep)) {
                await this.completeWizard();
            }
        });
        
        closeBtn?.addEventListener('click', () => {
            this.dismiss();
        });
        
        skipBtn?.addEventListener('click', () => {
            this.dismiss();
        });
        
        const backdrop = modal.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                this.dismiss();
            });
        }
        
        this.updateButtons();
    }
    
    /**
     * Validate current step
     * @private
     */
    validateStep(step) {
        switch (step) {
            case 2:
                if (!this.wizardData.caseNumber) {
                    alert('Please select a project type');
                    return false;
                }
                break;
            case 3:
                if (!this.wizardData.projectName || !this.wizardData.projectName.trim()) {
                    alert('Please enter a project name');
                    return false;
                }
                break;
        }
        return true;
    }
    
    /**
     * Complete wizard and create project
     * @private
     */
    async completeWizard() {
        if (!this.wizardData.projectName || !this.wizardData.caseNumber) {
            alert('Please complete all required fields');
            return;
        }
        
        try {
            // Create project
            if (this.appInstance && this.appInstance.createProjectFromTemplate) {
                await this.appInstance.createProjectFromTemplate(
                    this.wizardData.projectName,
                    this.wizardData.projectDescription,
                    this.wizardData.caseNumber,
                    null,
                    false,
                    this.wizardData.automationEngine,
                    this.wizardData.templateId
                );
                
                // Set automation directory if provided
                if (!this.wizardData.skipAutomation && this.wizardData.automationDirectory) {
                    const project = this.stateManager.getState().projects.find(p => 
                        p.name === this.wizardData.projectName
                    );
                    if (project) {
                        this.stateManager.updateProject(project.id, {
                            automationDirectory: this.wizardData.automationDirectory,
                            scopeDirectory: this.wizardData.scopeDirectory || null
                        });
                    }
                }
                
                // Render UI
                if (this.appInstance.renderingEngine) {
                    this.appInstance.renderingEngine.renderAll();
                }
            }
            
            // Close wizard
            const modal = document.getElementById('quick-start-wizard-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        } catch (error) {
            console.error('Error completing wizard:', error);
            alert('Error creating project: ' + error.message);
        }
    }
    
    /**
     * Dismiss wizard
     */
    dismiss() {
        const dontShowAgain = document.getElementById('quick-start-wizard-dont-show');
        if (dontShowAgain && dontShowAgain.checked) {
            localStorage.setItem('quickStartWizardDismissed', 'true');
        }
        
        const modal = document.getElementById('quick-start-wizard-modal');
        if (modal) {
            modal.style.display = 'none';
        }
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
    window.QuickStartWizard = QuickStartWizard;
}
