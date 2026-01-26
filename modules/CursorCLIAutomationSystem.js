// Cursor CLI Automation System - Executes pipeline steps sequentially via cursor-cli
class CursorCLIAutomationSystem {
    constructor(eventSystem, stateManager, renderingEngine, errorHandler = null) {
        this.eventSystem = eventSystem;
        this.stateManager = stateManager;
        this.renderingEngine = renderingEngine;
        this.errorHandler = errorHandler;
        this.isRunning = false;
        this.currentProjectId = null;
        this.shouldStop = false;
        this.progressModal = null;
        this.progressText = null;
        this.progressLog = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for automation stop events
        // Note: Start is handled directly by app.js based on mode
        this.eventSystem.register(EventType.AUTOMATION_STOP, () => {
            this.stop();
        });
    }
    
    // Start automation for a project - executes all incomplete sections sequentially
    /**
     * Validate project and dependencies before starting automation
     * @private
     * @returns {Object} Validation result with valid flag, message, and missingDeps
     */
    _validateBeforeStart(project, scopeDir) {
        if (!scopeDir || !scopeDir.trim()) {
            return {
                valid: false,
                message: 'Please set the scope directory in the Pipeline Flow view for cursor-cli mode',
                missingDeps: []
            };
        }
        
        // Validate dependencies before starting
        const validationResult = this.validateDependencies(project);
        if (!validationResult.valid) {
            return validationResult;
        }
        
        // Get all sections, filter out completed and skipped
        const sections = project.sections.filter(s => 
            s.status !== 'complete' && s.status !== 'skipped'
        );
        
        if (sections.length === 0) {
            return {
                valid: false,
                message: 'No incomplete sections to execute',
                missingDeps: []
            };
        }
        
        return { valid: true, sections };
    }
    
    /**
     * Execute a section with error handling
     * @private
     * @returns {Promise<boolean>} True if execution succeeded, false if it failed
     */
    async _executeSectionWithErrorHandling(projectId, section, index, total) {
        this.updateProgress(
            `Executing step ${index + 1} of ${total}: ${section.sectionName || section.sectionId}`,
            `Starting ${section.sectionName || section.sectionId}...`
        );
        
        try {
            await this.executeSection(projectId, section);
            this.appendToLog(`✓ Completed ${section.sectionName || section.sectionId}`);
            return true;
        } catch (error) {
            this.appendToLog(`✗ Error in ${section.sectionName || section.sectionId}: ${error.message}`);
            this.updateProgress(`Error: ${error.message}`, '');
            // Stop execution on error
            const errorMsg = `Error executing ${section.sectionName || section.sectionId}: ${error.message}\n\nExecution stopped.`;
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(errorMsg, {
                    source: 'CursorCLIAutomationSystem',
                    operation: 'executeSection',
                    projectId,
                    sectionId: section.sectionId
                }, {
                    severity: ErrorHandler.Severity.ERROR,
                    title: 'Execution Error',
                    showModal: true,
                    actions: [
                        { label: 'Retry Section', action: () => this.executeSection(projectId, section) },
                        { label: 'Continue', action: () => {} },
                        { label: 'Stop', action: () => this.stop() }
                    ]
                });
            } else {
                alert(errorMsg);
            }
            return false;
        }
    }
    
    async start(projectId, scopeDirectory = null) {
        if (this.isRunning) {
            console.warn('Cursor CLI automation already running');
            return;
        }
        
        const project = this.stateManager.getProject(projectId);
        if (!project) {
            console.error('Project not found:', projectId);
            return;
        }
        
        // Use provided scopeDirectory or get from project (per-project, not global)
        const scopeDir = scopeDirectory || project.scopeDirectory || this.stateManager.getScopeDirectory();
        
        // Validate before starting
        const validation = this._validateBeforeStart(project, scopeDir);
        if (!validation.valid) {
            const errorMsg = validation.message + (validation.missingDeps?.length > 0 ? `\n\nMissing dependencies:\n${validation.missingDeps.join('\n')}` : '');
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(errorMsg, {
                    source: 'CursorCLIAutomationSystem',
                    operation: 'start',
                    projectId
                }, {
                    severity: ErrorHandler.Severity.ERROR,
                    title: 'Validation Failed',
                    showModal: true
                });
            } else {
                alert(errorMsg);
            }
            return;
        }
        
        const sections = validation.sections;
        
        this.currentProjectId = projectId;
        this.isRunning = true;
        this.shouldStop = false;
        
        // Show progress modal
        this.showProgressModal();
        this.updateProgress(`Starting execution of ${sections.length} step(s)...`, '');
        
        try {
            // Execute sections sequentially
            for (let i = 0; i < sections.length; i++) {
                if (this.shouldStop) {
                    this.updateProgress('Execution cancelled by user', '');
                    break;
                }
                
                const success = await this._executeSectionWithErrorHandling(projectId, sections[i], i, sections.length);
                if (!success) {
                    break; // Stop on error
                }
            }
            
            if (!this.shouldStop) {
                this.updateProgress('All steps completed successfully!', '');
                this.appendToLog('All steps completed');
                // Auto-close after 2 seconds
                setTimeout(() => {
                    this.hideProgressModal();
                }, AppConstants.TIMEOUTS.MODAL_AUTO_CLOSE);
            }
        } catch (error) {
            const errorMsg = this.errorHandler ? this.errorHandler.getUserMessage(error) : error.message;
            if (this.errorHandler) {
                this.errorHandler.handleError(error, { source: 'CursorCLIAutomationSystem', operation: 'start', projectId });
            } else {
                console.error('Error in cursor-cli automation:', error);
            }
            this.updateProgress(`Fatal error: ${errorMsg}`, '');
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(`Fatal error: ${errorMsg}`, {
                    source: 'CursorCLIAutomationSystem',
                    operation: 'start',
                    projectId
                }, {
                    severity: ErrorHandler.Severity.CRITICAL,
                    title: 'Fatal Automation Error',
                    showModal: true,
                    actions: [
                        { label: 'Retry', action: () => this.start(projectId, scopeDirectory) },
                        { label: 'OK', action: () => {} }
                    ]
                });
            } else {
                alert(`Fatal error: ${errorMsg}`);
            }
        } finally {
            this.isRunning = false;
            this.currentProjectId = null;
        }
    }
    
    // Execute a single section via cursor-cli
    async executeSection(projectId, section) {
        const project = this.stateManager.getProject(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        
        // Get input (user input or previous output)
        const input = await this.getSectionInput(projectId, section);
        
        // Get full prompt with all substitutions
        const prompt = await this.getFullPrompt(projectId, section);
        
        // Combine prompt + input
        const fullPrompt = `${prompt}\n\n## Input\n\n${input}`;
        
        // Get scope directory from project (per-project, not global)
        const scopeDir = project.scopeDirectory || this.stateManager.getScopeDirectory();
        if (!scopeDir) {
            throw new Error('Scope directory not set for this project');
        }
        
        // Execute cursor-cli
        const output = await this.executeCursorCLI(fullPrompt, scopeDir);
        
        // Save output to section state
        this.stateManager.updateSection(projectId, section.sectionId, {
            output: output,
            status: 'complete'
        });
        
        // Save output to file for persistence
        await this.saveOutputToFile(projectId, section, output);
        
        // Update UI
        this.renderingEngine.renderAll();
    }
    
    // Get section input (user input if exists, else from dependencies)
    async getSectionInput(projectId, section) {
        // If section has user input, use that
        if (section.input && section.input.trim()) {
            return section.input;
        }
        
        // Otherwise, get input from dependencies
        const project = this.stateManager.getProject(projectId);
        if (!project) return '';
        
        // If section has dependencies, use outputs from dependency sections
        if (section.dependencies && section.dependencies.length > 0) {
            const dependencyOutputs = [];
            for (const depId of section.dependencies) {
                const depSection = project.sections.find(s => s.sectionId === depId);
                if (depSection && depSection.output) {
                    dependencyOutputs.push(depSection.output);
                }
            }
            // Combine all dependency outputs, or use the first one if multiple
            return dependencyOutputs.join('\n\n---\n\n') || '';
        }
        
        // Fallback: use previous section by position (for backward compatibility)
        const currentIndex = project.sections.findIndex(s => s.sectionId === section.sectionId);
        if (currentIndex > 0) {
            const previousSection = project.sections[currentIndex - 1];
            return previousSection.output || '';
        }
        
        return '';
    }
    
    // Get full prompt with all variable substitutions
    async getFullPrompt(projectId, section) {
        const project = this.stateManager.getProject(projectId);
        const promptLoader = window.PromptLoader;
        
        if (!promptLoader) {
            throw new Error('PromptLoader not available');
        }
        
        // Get prompt with variable substitution (including input)
        const prompt = await promptLoader.getPrompt(
            section.sectionId,
            section,
            project,
            { substituteInput: true } // Include input in prompt
        );
        
        return prompt;
    }
    
    // Execute cursor-cli via server endpoint
    async executeCursorCLI(prompt, scopeDirectory) {
        const response = await fetch('/api/cursor-cli-execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                scopeDirectory: scopeDirectory
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Cursor CLI execution failed');
        }
        
        return result.output;
    }
    
    // Save output to file for persistence
    async saveOutputToFile(projectId, section, output) {
        const project = this.stateManager.getProject(projectId);
        const automationDir = project.automationDirectory;
        
        if (!automationDir) {
            console.warn('No automation directory set, skipping file save');
            return;
        }
        
        // Determine file name from section
        const stepName = section.stepName || section.sectionId;
        const fileName = `${stepName}-output.md`;
        const filePath = `${automationDir}/${fileName}`;
        
        try {
            const response = await fetch('http://localhost:8050/api/save-automation-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filePath: filePath,
                    content: output
                })
            });
            
            const result = await response.json();
            if (!result.success) {
                console.warn(`Failed to save output file: ${result.error}`);
            }
        } catch (error) {
            console.error('Error saving output file:', error);
        }
    }
    
    // Stop execution
    stop() {
        if (this.isRunning) {
            this.shouldStop = true;
            this.isRunning = false;
            this.updateProgress('Stopping execution...', '');
        }
    }
    
    // Show progress modal
    showProgressModal() {
        const modal = document.getElementById('cursor-cli-progress-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.progressModal = modal;
            this.progressText = document.getElementById('cursor-cli-progress-text');
            this.progressLog = document.getElementById('cursor-cli-progress-log');
            
            // Clear log
            if (this.progressLog) {
                while (this.progressLog.firstChild) {
                    this.progressLog.removeChild(this.progressLog.firstChild);
                }
            }
        }
    }
    
    // Hide progress modal
    hideProgressModal() {
        const modal = document.getElementById('cursor-cli-progress-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // Update progress text
    updateProgress(text, logEntry) {
        if (this.progressText) {
            this.progressText.textContent = text;
        }
        if (logEntry) {
            this.appendToLog(logEntry);
        }
    }
    
    // Append to progress log
    appendToLog(message) {
        if (this.progressLog) {
            const entry = document.createElement('div');
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            entry.style.marginBottom = '4px';
            this.progressLog.appendChild(entry);
            // Auto-scroll to bottom
            this.progressLog.scrollTop = this.progressLog.scrollHeight;
        }
    }
}

