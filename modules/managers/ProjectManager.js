// Project Manager - Handles project CRUD operations and project group management
class ProjectManager {
    constructor(stateManager, eventSystem, dataLayer, renderingEngine, pipelineConfig, stateUpdateHelper = null, errorHandler = null) {
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
        this.dataLayer = dataLayer;
        this.renderingEngine = renderingEngine;
        this.pipelineConfig = pipelineConfig;
        this.stateUpdateHelper = stateUpdateHelper;
        this.errorHandler = errorHandler;
        this.currentProjectGroupName = null;
        this.autosaveEnabled = true;
        
        // Callbacks for methods that need app-level access
        this.loadPromptsForProjectCallback = null;
        this.addInferenceStepsCallback = null;
        this.initializeExistingOutputsCallback = null;
        
        // Track event listeners for cleanup
        this.eventListenerCleanups = [];
    }
    
    /**
     * Cleanup event listeners
     */
    cleanup() {
        // ProjectManager doesn't directly attach listeners, but clean up any tracked ones
        if (typeof window !== 'undefined' && window.eventListenerManager) {
            // EventListenerManager handles cleanup automatically
        } else {
            this.eventListenerCleanups.forEach(cleanup => cleanup());
            this.eventListenerCleanups = [];
        }
    }
    
    /**
     * Set callbacks for methods that need app-level access
     */
    setCallbacks(callbacks) {
        if (callbacks.loadPromptsForProject) {
            this.loadPromptsForProjectCallback = callbacks.loadPromptsForProject;
        }
        if (callbacks.addInferenceSteps) {
            this.addInferenceStepsCallback = callbacks.addInferenceSteps;
        }
        if (callbacks.initializeExistingOutputs) {
            this.initializeExistingOutputsCallback = callbacks.initializeExistingOutputs;
        }
    }
    
    /**
     * Create a new project
     */
    async createProject(name, description, caseNumber = 1, caseChain = null, customWorkflow = false, automationEngine = 'file-watching') {
        // Validate project name
        if (window.validateProjectName) {
            const validation = window.validateProjectName(name);
            if (!validation.valid) {
                if (this.errorHandler) {
                    this.errorHandler.showUserNotification(validation.error, {
                        source: 'ProjectManager',
                        operation: 'createProject'
                    }, {
                        severity: ErrorHandler.Severity.WARNING,
                        title: 'Invalid Project Name'
                    });
                }
                throw new Error(validation.error);
            }
            name = validation.sanitized;
        }
        
        // If workflowType is provided (legacy), convert to case number
        if (typeof caseNumber === 'string' && (caseNumber === 'full' || caseNumber === 'ux-only')) {
            // Legacy support: convert workflowType to case
            caseNumber = caseNumber === 'ux-only' ? 2 : 1;
        }
        
        const project = await this.stateManager.createProject(name, description, caseNumber, caseChain, customWorkflow, automationEngine);
        
        // Add inference steps for Case 2
        if (caseNumber === 2 && this.addInferenceStepsCallback) {
            await this.addInferenceStepsCallback(project.id);
        }
        
        // Load prompts for all sections
        if (this.loadPromptsForProjectCallback) {
            await this.loadPromptsForProjectCallback(project.id);
        }
        
        return project;
    }
    
    /**
     * Delete project group
     */
    async deleteProjectGroup() {
        const state = this.stateManager.getState();
        const projectGroupName = state.metadata?.projectGroupName;
        
        if (!projectGroupName || !projectGroupName.trim()) {
            if (this.errorHandler) {
                this.errorHandler.showUserNotification('No project group is currently loaded.', {
                    source: 'ProjectManager',
                    operation: 'deleteProjectGroup'
                }, {
                    severity: ErrorHandler.Severity.WARNING,
                    title: 'No Project Group'
                });
            } else {
                alert('No project group is currently loaded.');
            }
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
                const error = `Server error: ${response.status}`;
                if (this.errorHandler) {
                    this.errorHandler.showUserNotification(error, {
                        source: 'ProjectManager',
                        operation: 'deleteProjectGroup'
                    }, {
                        severity: ErrorHandler.Severity.ERROR,
                        title: 'Delete Failed'
                    });
                }
                throw new Error(error);
            }
            
            const result = await response.json();
            if (!result.success) {
                const error = result.error || 'Failed to delete file';
                if (this.errorHandler) {
                    this.errorHandler.showUserNotification(error, {
                        source: 'ProjectManager',
                        operation: 'deleteProjectGroup'
                    }, {
                        severity: ErrorHandler.Severity.ERROR,
                        title: 'Delete Failed'
                    });
                }
                throw new Error(error);
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
            
            const message = `Project group "${projectGroupName}" has been deleted.`;
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(message, {
                    source: 'ProjectManager',
                    operation: 'deleteProjectGroup'
                }, {
                    severity: ErrorHandler.Severity.INFO,
                    title: 'Success'
                });
            } else {
                alert(message);
            }
        } catch (err) {
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(err, {
                    source: 'ProjectManager',
                    operation: 'deleteProjectGroup'
                }, {
                    severity: ErrorHandler.Severity.ERROR,
                    title: 'Delete Failed'
                });
            } else {
                if (this.errorHandler) {
                    this.errorHandler.handleError(err, {
                        source: 'ProjectManager',
                        operation: 'deleteProjectGroup'
                    });
                    this.errorHandler.showUserNotification(err, {
                        source: 'ProjectManager',
                        operation: 'deleteProjectGroup'
                    }, {
                        severity: ErrorHandler.Severity.ERROR,
                        title: 'Delete Failed'
                    });
                } else {
                    console.error('Error deleting project group:', err);
                    alert('Failed to delete project group: ' + err.message);
                }
            }
        }
    }
    
    /**
     * Link from Case 4 project
     */
    async linkFromCase4(targetProjectId) {
        const targetProject = this.stateManager.getProject(targetProjectId);
        if (!targetProject || (targetProject.case !== 1 && targetProject.case !== 2 && targetProject.case !== 3)) {
            const error = 'This action is only available for Case 1, 2, or 3 projects.';
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(error, {
                    source: 'ProjectManager',
                    operation: 'linkFromCase4',
                    projectId: targetProjectId
                }, {
                    severity: ErrorHandler.Severity.WARNING,
                    title: 'Invalid Project Type'
                });
            } else {
                alert(error);
            }
            return;
        }
        
        // Get all Case 4 projects
        const state = this.stateManager.getState();
        const case4Projects = state.projects.filter(p => 
            p.case === 4 && 
            p.sections.some(s => s.sectionId === 'output-mapping' && s.status === 'complete')
        );
        
        if (case4Projects.length === 0) {
            const error = 'No completed Case 4 projects found.';
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(error, {
                    source: 'ProjectManager',
                    operation: 'linkFromCase4',
                    projectId: targetProjectId
                }, {
                    severity: ErrorHandler.Severity.INFO,
                    title: 'No Case 4 Projects'
                });
            } else {
                alert(error);
            }
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
            const error = 'Case 4 project not found.';
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(error, {
                    source: 'ProjectManager',
                    operation: 'linkFromCase4',
                    projectId: targetProjectId
                }, {
                    severity: ErrorHandler.Severity.WARNING,
                    title: 'Project Not Found'
                });
            } else {
                alert(error);
            }
            return;
        }
        
        // Link and inject inputs
        await this.injectCase4Inputs(case4Project, targetProject);
    }
    
    /**
     * Inject Case 4 structured inputs into target project
     */
    async injectCase4Inputs(case4Project, targetProject) {
        // Get structured outputs from Case 4
        const structuringSection = case4Project.sections.find(s => s.sectionId === 'input-structuring');
        if (!structuringSection || !structuringSection.output) {
            const error = 'Case 4 project does not have structured outputs. Please complete the Input Structuring step.';
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(error, {
                    source: 'ProjectManager',
                    operation: 'injectCase4Inputs',
                    case4ProjectId: case4Project.id,
                    targetProjectId: targetProject.id
                }, {
                    severity: ErrorHandler.Severity.WARNING,
                    title: 'Structured Outputs Required'
                });
            } else {
                alert(error);
            }
            return;
        }
        
        // Parse structured outputs (delegate to FileOperations if available, otherwise use local method)
        const structuredOutputs = this.parseStructuredOutputs(structuringSection.output);
        
        if (Object.keys(structuredOutputs).length === 0) {
            const error = 'No structured outputs found in Case 4 project. Please complete the Input Structuring step.';
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(error, {
                    source: 'ProjectManager',
                    operation: 'injectCase4Inputs',
                    case4ProjectId: case4Project.id,
                    targetProjectId: targetProject.id
                }, {
                    severity: ErrorHandler.Severity.WARNING,
                    title: 'No Structured Outputs'
                });
            } else {
                alert(error);
            }
            return;
        }
        
        // Get input mapping from config
        if (!this.pipelineConfig) {
            const error = 'Pipeline configuration not available.';
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(error, {
                    source: 'ProjectManager',
                    operation: 'injectCase4Inputs',
                    case4ProjectId: case4Project.id,
                    targetProjectId: targetProject.id
                }, {
                    severity: ErrorHandler.Severity.ERROR,
                    title: 'Configuration Error'
                });
            } else {
                alert(error);
            }
            return;
        }
        
        const chainConfig = await this.pipelineConfig.getCaseChainingConfig(4, targetProject.case);
        
        if (!chainConfig || !chainConfig.inputMapping) {
            const error = `No input mapping configuration found for Case 4 → Case ${targetProject.case}.`;
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(error, {
                    source: 'ProjectManager',
                    operation: 'injectCase4Inputs',
                    case4ProjectId: case4Project.id,
                    targetProjectId: targetProject.id
                }, {
                    severity: ErrorHandler.Severity.ERROR,
                    title: 'Mapping Configuration Missing'
                });
            } else {
                alert(error);
            }
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
                    
                    if (this.stateUpdateHelper) {
                        this.stateUpdateHelper.updateSection(targetProject.id, targetSectionId, {
                            input: newInput,
                            status: existingInput ? targetSection.status : 'in_progress'
                        }, { source: 'ProjectManager' });
                    } else {
                        this.stateManager.updateSection(targetProject.id, targetSectionId, {
                            input: newInput,
                            status: existingInput ? targetSection.status : 'in_progress'
                        });
                    }
                    injectedCount++;
                }
            }
        }
        
        // Mark target project as linked from Case 4
        if (this.stateUpdateHelper) {
            this.stateUpdateHelper.updateProject(targetProject.id, {
                linkedFromCase4: case4Project.id
            }, { source: 'ProjectManager' });
        } else {
            this.stateManager.updateProject(targetProject.id, {
                linkedFromCase4: case4Project.id
            });
        }
        
        // Re-render
        this.renderingEngine.renderAll();
        
        const message = `Successfully linked Case 4 project "${case4Project.name}" to "${targetProject.name}".\n\nInjected ${injectedCount} structured input(s) into the appropriate sections.`;
        if (this.errorHandler) {
            this.errorHandler.showUserNotification(message, {
                source: 'ProjectManager',
                operation: 'injectCase4Inputs',
                case4ProjectId: case4Project.id,
                targetProjectId: targetProject.id
            }, {
                severity: ErrorHandler.Severity.INFO,
                title: 'Link Successful'
            });
        } else {
            alert(message);
        }
    }
    
    /**
     * Parse structured outputs from text
     */
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
    
    /**
     * Populate project group dropdown with saved files
     */
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
            
            // Server wraps response in { success: true, data: { success: true, files: [...] } }
            const files = (result.data && result.data.files) || result.files || [];
            
            if (result.success && files && files.length > 0) {
                // Clear existing options
                projectGroupSelect.innerHTML = ''; // Clearing - safe
                
                // Add file options
                files.forEach(file => {
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
                projectGroupSelect.innerHTML = ''; // Clearing - safe
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
            if (this.errorHandler) {
                this.errorHandler.handleError(error, {
                    source: 'ProjectManager',
                    operation: 'loadProjectGroups'
                });
                // Don't show notification for this - it's not critical
            } else {
                console.error('Failed to load project groups:', error);
            }
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
    
    /**
     * Load project group from file
     */
    async loadProjectGroupFromFile(filename, callbacks = {}) {
        // Show loading overlay
        if (callbacks.showLoadingOverlay) {
            callbacks.showLoadingOverlay('Loading project group...');
        }
        
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
                if (callbacks.loadPromptsForProject) {
                    for (const project of state.projects || []) {
                        await callbacks.loadPromptsForProject(project.id);
                    }
                }
                
                this.renderingEngine.renderAll();
                // Update dropdown AFTER state is loaded
                await this.populateProjectGroupDropdown();
            } else {
                const error = 'Invalid file format: File must contain either "pages" or "projects" array';
                if (this.errorHandler) {
                    this.errorHandler.showUserNotification(error, {
                        source: 'ProjectManager',
                        operation: 'loadProjectGroup',
                        filename
                    }, {
                        severity: ErrorHandler.Severity.ERROR,
                        title: 'Invalid File Format'
                    });
                } else {
                    alert(error);
                }
            }
            
            // Re-attach listeners after DOM changes
            if (callbacks.setupProjectGroupDropdownListeners) {
                callbacks.setupProjectGroupDropdownListeners();
            }
        } catch (error) {
            console.error('Load project group error:', error);
            if (this.errorHandler) {
                this.errorHandler.handleError(error, {
                    source: 'ProjectManager',
                    operation: 'loadProjectGroup',
                    filename
                });
                this.errorHandler.showUserNotification(error, {
                    source: 'ProjectManager',
                    operation: 'loadProjectGroup',
                    filename
                }, {
                    severity: ErrorHandler.Severity.ERROR,
                    title: 'Load Failed'
                });
            } else {
                alert('Failed to load project group: ' + error.message);
            }
        } finally {
            // Hide loading overlay
            if (callbacks.hideLoadingOverlay) {
                callbacks.hideLoadingOverlay();
            }
        }
    }
    
    /**
     * Autosave current project group
     */
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
    
    /**
     * Generate default automation ID
     */
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
    
    /**
     * Generate random ID
     */
    randomId(length) {
        const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let id = '';
        for (let i = 0; i < length; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }
    
    /**
     * Get current project group name
     */
    getCurrentProjectGroupName() {
        return this.currentProjectGroupName;
    }
    
    /**
     * Set current project group name
     */
    setCurrentProjectGroupName(name) {
        this.currentProjectGroupName = name;
    }
    
    /**
     * Set autosave enabled
     */
    setAutosaveEnabled(enabled) {
        this.autosaveEnabled = enabled;
    }
}
