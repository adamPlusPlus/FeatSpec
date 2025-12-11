// State Manager - Manages application state independently
class StateManager {
    constructor(eventSystem) {
        this.eventSystem = eventSystem;
        this.state = this.createInitialState();
    }
    
    // Create initial empty state
    createInitialState() {
        return {
            projects: [],
            activeProjectId: null,
            settings: this.getDefaultSettings(),
            paneStates: {
                projectsSidebar: true,  // true = expanded, false = collapsed
                mainContent: true,
                referencesPanel: true
            },
            metadata: {
                lastModified: new Date().toISOString(),
                version: '2.0', // Updated version for new data model
                automationMode: 'file-watching', // 'file-watching' | 'cursor-cli'
                scopeDirectory: null // Scope directory for cursor-cli mode
            }
        };
    }
    
    // Get default settings
    getDefaultSettings() {
        return {
            background: '#1a1a1a',
            page: {
                background: '#2d2d2d',
                margin: '0px',
                padding: '20px',
                borderRadius: '8px',
                fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
                fontSize: '14px',
                opacity: 1,
                color: '#e0e0e0',
                titleFontSize: '18px',
                titleColor: '#ffffff',
                titleMarginBottom: '15px'
            },
            element: {
                bg: 'transparent',
                margin: '0px',
                padding: '10px',
                fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
                fontSize: '14px',
                opacity: 1,
                color: '#e0e0e0',
                hoverBg: '#363636'
            },
            header: {
                fontSize: '16px',
                color: '#b8b8b8',
                margin: '10px 0'
            },
            checkboxSize: '18px'
        };
    }
    
    // Get current state
    getState() {
        return JSON.parse(JSON.stringify(this.state)); // Return deep copy
    }
    
    // Set state (immutable update)
    setState(updates) {
        this.state = {
            ...this.state,
            ...updates,
            metadata: {
                ...this.state.metadata,
                lastModified: new Date().toISOString(),
                ...(updates.metadata || {})
            }
        };
        this.emitStateChanged();
    }
    
    // Create a new project with all pipeline sections initialized
    async createProject(name, description, caseNumber = 1, caseChain = null, customWorkflow = false, automationEngine = 'file-watching') {
        const projectId = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        
        // Get sections for case
        const config = window.PipelineConfig;
        if (!config) {
            throw new Error('PipelineConfig not available');
        }
        
        // Generate sections based on case
        const sectionDefs = await config.generateSectionsForCase(caseNumber, caseChain);
        
        // Generate unique IDs for all sections
        const usedIds = new Set();
        const generateUniqueId = () => {
            const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let id;
            do {
                id = '';
                for (let i = 0; i < 4; i++) {
                    id += chars.charAt(Math.floor(Math.random() * chars.length));
                }
            } while (usedIds.has(id));
            usedIds.add(id);
            return id;
        };
        
        const sections = sectionDefs.map(sectionDef => ({
            sectionId: sectionDef.id,
            sectionName: sectionDef.name,
            stepName: sectionDef.stepName || sectionDef.id,
            automationId: generateUniqueId(), // Unique 4-character alphanumeric ID
            status: "not_started",
            validationStatus: sectionDef.isValidation ? "pending" : null,
            prompt: "", // Will be loaded by PromptLoader
            input: "",
            output: "",
            dependencies: sectionDef.dependencies || [],
            modifiers: sectionDef.modifiers || [],
            notes: "",
            overrideInstructions: "", // User-provided override instructions (visible when override-instructions modifier is active)
            isProcessStep: false,
            isInferenceStep: sectionDef.isInferenceStep || false,
            processStepType: null,
            specialized: sectionDef.specialized || null,
            lastModified: now
        }));
        
        const project = {
            id: projectId,
            name: name || "New Project",
            description: description || "",
            case: caseNumber,
            caseChain: caseChain || null,
            linkedFromCase4: null, // ID of Case 4 project that provided inputs
            customWorkflow: customWorkflow || false,
            workflowType: this.getWorkflowTypeFromCase(caseNumber), // Legacy support
            automationEngine: automationEngine || 'file-watching', // Automation engine: 'file-watching', 'cursor-cli', or 'multi-agent'
            automationDirectory: null, // Directory for automation file watching/creation
            scopeDirectory: null, // Directory that restricts agent focus/context
            status: "draft",
            sections: sections,
            createdAt: now,
            lastModified: now
        };
        
        const projects = [...this.state.projects, project];
        this.setState({ projects, activeProjectId: projectId });
        
        this.eventSystem.emit(EventType.PROJECT_CREATED, {
            source: 'StateManager',
            data: { project }
        });
        
        return project;
    }
    
    // Get workflow type from case (for backward compatibility)
    getWorkflowTypeFromCase(caseNumber) {
        // Legacy mapping: case 1 or 2 = "full", case 3 could be "ux-only" or "full"
        // For now, default to "full" for all cases
        return "full";
    }
    
    // Get project
    getProject(projectId) {
        return this.state.projects.find(p => p.id === projectId) || null;
    }
    
    // Get active project
    getActiveProject() {
        if (!this.state.activeProjectId) return null;
        return this.getProject(this.state.activeProjectId);
    }
    
    // Set active project
    setActiveProject(projectId) {
        const project = this.getProject(projectId);
        if (project) {
            this.setState({ activeProjectId: projectId });
            this.eventSystem.emit(EventType.PROJECT_ACTIVATED, {
                source: 'StateManager',
                data: { projectId, project }
            });
        }
    }
    
    // Update project
    updateProject(projectId, updates) {
        const projects = this.state.projects.map(project => {
            if (project.id === projectId) {
                return { 
                    ...project, 
                    ...updates,
                    lastModified: new Date().toISOString()
                };
            }
            return project;
        });
        this.setState({ projects });
        this.eventSystem.emit(EventType.PROJECT_UPDATED, {
            source: 'StateManager',
            data: { projectId, updates }
        });
    }
    
    // Remove project
    removeProject(projectId) {
        const project = this.state.projects.find(p => p.id === projectId);
        const projects = this.state.projects.filter(p => p.id !== projectId);
        
        // If removing active project, clear active
        let activeProjectId = this.state.activeProjectId;
        if (activeProjectId === projectId) {
            activeProjectId = projects.length > 0 ? projects[0].id : null;
        }
        
        this.setState({ projects, activeProjectId });
        this.eventSystem.emit(EventType.PROJECT_DELETED, {
            source: 'StateManager',
            data: { projectId, project }
        });
    }
    
    // Get section from project
    getSection(projectId, sectionId) {
        const project = this.getProject(projectId);
        if (project) {
            return project.sections.find(s => s.sectionId === sectionId) || null;
        }
        return null;
    }
    
    // Update section
    updateSection(projectId, sectionId, updates) {
        const projects = this.state.projects.map(project => {
            if (project.id === projectId) {
                const sections = project.sections.map(section => {
                    if (section.sectionId === sectionId) {
                        return {
                            ...section,
                            ...updates,
                            lastModified: new Date().toISOString()
                        };
                    }
                    return section;
                });
                
                // Update project status based on section completion
                const allComplete = sections.every(s => s.status === "complete");
                const projectStatus = allComplete ? "complete" : 
                                     sections.some(s => s.status === "in_progress" || s.status === "complete") ? "in_progress" : "draft";
                
                return {
                    ...project,
                    sections,
                    status: projectStatus,
                    lastModified: new Date().toISOString()
                };
            }
            return project;
        });
        this.setState({ projects });
        this.eventSystem.emit(EventType.SECTION_UPDATED, {
            source: 'StateManager',
            data: { projectId, sectionId, updates }
        });
    }
    
    // Set case chain for a project
    setCaseChain(projectId, previousCase, currentCase, previousCaseOutput = null) {
        const caseChain = {
            previousCase: previousCase,
            currentCase: currentCase,
            previousCaseOutput: previousCaseOutput || ''
        };
        
        this.updateProject(projectId, { caseChain });
    }
    
    // Update modifiers for a section
    updateModifiers(projectId, sectionId, modifiers) {
        this.updateSection(projectId, sectionId, { modifiers });
    }
    
    // Add a process step section
    addProcessStep(projectId, processStepType, afterSectionId, processStepData = {}) {
        const project = this.getProject(projectId);
        if (!project) return null;
        
        const afterIndex = project.sections.findIndex(s => s.sectionId === afterSectionId);
        if (afterIndex === -1) return null;
        
        const now = new Date().toISOString();
        const processStep = {
            sectionId: `${processStepType}-${Date.now()}`,
            sectionName: this.getProcessStepDisplayName(processStepType),
            stepName: processStepType,
            status: "not_started",
            validationStatus: null,
            prompt: "",
            input: processStepData.input || "",
            output: processStepData.output || "",
            dependencies: [afterSectionId],
            modifiers: [],
            notes: "",
            isProcessStep: true,
            isInferenceStep: false,
            processStepType: processStepType,
            specialized: null,
            lastModified: now
        };
        
        const sections = [
            ...project.sections.slice(0, afterIndex + 1),
            processStep,
            ...project.sections.slice(afterIndex + 1)
        ];
        
        this.updateProject(projectId, { sections });
        return processStep;
    }
    
    // Get process step display name
    getProcessStepDisplayName(processStepType) {
        const names = {
            'validation-loop': 'Validation Loop',
            'refinement-loop': 'Refinement Loop',
            'integration-loop': 'Integration Loop',
            'catom-refinement': 'cAtom Refinement',
            'catom-generation': 'cAtom Generation',
            'refinement-loop': 'Refinement Loop',
            'integration-loop': 'Integration Loop'
        };
        return names[processStepType] || processStepType;
    }
    
    // Add an inference step (Case 2)
    addInferenceStep(projectId, inferenceStepName, afterSectionId, inferenceStepData = {}) {
        const project = this.getProject(projectId);
        if (!project) return null;
        
        const afterIndex = project.sections.findIndex(s => s.sectionId === afterSectionId);
        if (afterIndex === -1) return null;
        
        const now = new Date().toISOString();
        const inferenceStep = {
            sectionId: inferenceStepName,
            sectionName: this.getInferenceStepDisplayName(inferenceStepName),
            stepName: inferenceStepName,
            status: "not_started",
            validationStatus: null,
            prompt: "",
            input: inferenceStepData.input || "",
            output: inferenceStepData.output || "",
            dependencies: [afterSectionId],
            modifiers: [],
            notes: "",
            isProcessStep: false,
            isInferenceStep: true,
            processStepType: null,
            specialized: null,
            lastModified: now
        };
        
        const sections = [
            ...project.sections.slice(0, afterIndex + 1),
            inferenceStep,
            ...project.sections.slice(afterIndex + 1)
        ];
        
        this.updateProject(projectId, { sections });
        return inferenceStep;
    }
    
    // Insert a core step at a specific index
    async insertCoreStep(projectId, insertIndex, stepName) {
        const project = this.getProject(projectId);
        if (!project) return null;
        
        const now = new Date().toISOString();
        const config = window.PipelineConfig;
        const displayName = config ? await config.getStepDisplayName(stepName) : stepName;
        
        // Generate unique sectionId to avoid collisions with duplicate step types
        const existingIds = new Set(project.sections.map(s => s.sectionId));
        const generateUniqueSectionId = () => {
            const baseId = stepName;
            let uniqueId = baseId;
            let counter = 1;
            while (existingIds.has(uniqueId)) {
                uniqueId = `${baseId}-${counter}`;
                counter++;
            }
            return uniqueId;
        };
        
        // Determine dependencies based on insertion position
        // If inserting at index 0, no dependencies. Otherwise, depend on the section before it.
        let dependencies = [];
        if (insertIndex > 0 && project.sections.length > 0) {
            const previousSection = project.sections[insertIndex - 1];
            if (previousSection) {
                dependencies = [previousSection.sectionId];
            }
        }
        
        const newSection = {
            sectionId: generateUniqueSectionId(),
            sectionName: displayName,
            stepName: stepName,
            status: "not_started",
            validationStatus: null,
            prompt: "",
            input: "",
            output: "",
            dependencies: dependencies,
            modifiers: [],
            notes: "",
            isProcessStep: false,
            isInferenceStep: false,
            processStepType: null,
            specialized: null,
            lastModified: now
        };
        
        const sections = [
            ...project.sections.slice(0, insertIndex),
            newSection,
            ...project.sections.slice(insertIndex)
        ];
        
        // Recalculate dependencies for sections that come after the inserted section
        // (in case they were depending on position-based logic)
        this.recalculateDependencies(projectId, sections);
        
        this.updateProject(projectId, { sections });
        return newSection;
    }
    
    // Insert a process step at a specific index
    insertProcessStep(projectId, insertIndex, processStepType, referenceSectionId) {
        const project = this.getProject(projectId);
        if (!project) return null;
        
        const now = new Date().toISOString();
        const processStep = {
            sectionId: `${processStepType}-${Date.now()}`,
            sectionName: this.getProcessStepDisplayName(processStepType),
            stepName: processStepType,
            status: "not_started",
            validationStatus: null,
            prompt: "",
            input: "",
            output: "",
            dependencies: referenceSectionId ? [referenceSectionId] : [],
            modifiers: [],
            notes: "",
            isProcessStep: true,
            isInferenceStep: false,
            processStepType: processStepType,
            specialized: null,
            lastModified: now
        };
        
        const sections = [
            ...project.sections.slice(0, insertIndex),
            processStep,
            ...project.sections.slice(insertIndex)
        ];
        
        this.updateProject(projectId, { sections });
        return processStep;
    }
    
    // Insert an inference step at a specific index
    insertInferenceStep(projectId, insertIndex, inferenceStepName) {
        const project = this.getProject(projectId);
        if (!project) return null;
        
        const now = new Date().toISOString();
        
        // Generate unique sectionId to avoid collisions with duplicate step types
        const existingIds = new Set(project.sections.map(s => s.sectionId));
        const generateUniqueSectionId = () => {
            const baseId = inferenceStepName;
            let uniqueId = baseId;
            let counter = 1;
            while (existingIds.has(uniqueId)) {
                uniqueId = `${baseId}-${counter}`;
                counter++;
            }
            return uniqueId;
        };
        
        // Determine dependencies based on insertion position
        let dependencies = [];
        if (insertIndex > 0 && project.sections.length > 0) {
            const previousSection = project.sections[insertIndex - 1];
            if (previousSection) {
                dependencies = [previousSection.sectionId];
            }
        }
        
        const inferenceStep = {
            sectionId: generateUniqueSectionId(),
            sectionName: this.getInferenceStepDisplayName(inferenceStepName),
            stepName: inferenceStepName,
            status: "not_started",
            validationStatus: null,
            prompt: "",
            input: "",
            output: "",
            dependencies: dependencies,
            modifiers: [],
            notes: "",
            isProcessStep: false,
            isInferenceStep: true,
            processStepType: null,
            specialized: null,
            lastModified: now
        };
        
        const sections = [
            ...project.sections.slice(0, insertIndex),
            inferenceStep,
            ...project.sections.slice(insertIndex)
        ];
        
        // Recalculate dependencies for sections that come after the inserted section
        this.recalculateDependencies(projectId, sections);
        
        this.updateProject(projectId, { sections });
        return inferenceStep;
    }
    
    // Insert a custom step at a specific index
    insertCustomStep(projectId, insertIndex, stepName, displayName, prompt) {
        const project = this.getProject(projectId);
        if (!project) return null;
        
        const now = new Date().toISOString();
        // Determine dependencies based on insertion position
        let dependencies = [];
        if (insertIndex > 0 && project.sections.length > 0) {
            const previousSection = project.sections[insertIndex - 1];
            if (previousSection) {
                dependencies = [previousSection.sectionId];
            }
        }
        
        const customStep = {
            sectionId: `custom-${stepName}-${Date.now()}`,
            sectionName: displayName,
            stepName: stepName,
            status: "not_started",
            validationStatus: null,
            prompt: prompt,
            input: "",
            output: "",
            dependencies: dependencies,
            modifiers: [],
            notes: "",
            isProcessStep: false,
            isInferenceStep: false,
            processStepType: null,
            specialized: null,
            isCustom: true,
            lastModified: now
        };
        
        const sections = [
            ...project.sections.slice(0, insertIndex),
            customStep,
            ...project.sections.slice(insertIndex)
        ];
        
        // Recalculate dependencies for sections that come after the inserted section
        this.recalculateDependencies(projectId, sections);
        
        this.updateProject(projectId, { sections });
        return customStep;
    }
    
    // Recalculate dependencies for all sections based on their position
    // This ensures dependencies are correct after steps are moved or inserted
    recalculateDependencies(projectId, sections) {
        if (!sections || sections.length === 0) return;
        
        // Only recalculate dependencies for sections that don't have explicit dependencies
        // (i.e., sections that were created with empty dependencies and should depend on position)
        // Process steps keep their explicit dependencies (they reference a specific section)
        
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            
            // Skip process steps - they have explicit dependencies that shouldn't be changed
            if (section.isProcessStep && section.dependencies && section.dependencies.length > 0) {
                continue;
            }
            
            // If section has no dependencies and isn't the first section, set dependency on previous section
            if ((!section.dependencies || section.dependencies.length === 0) && i > 0) {
                const previousSection = sections[i - 1];
                if (previousSection) {
                    section.dependencies = [previousSection.sectionId];
                }
            }
        }
    }
    
    // Get inference step display name
    getInferenceStepDisplayName(inferenceStepName) {
        const names = {
            'data-model-inference': 'Data Model Inference',
            'state-machine-inference': 'State Machine Inference',
            'api-contract-inference': 'API Contract Inference',
            'behavioral-implementation-spec': 'Behavioral Implementation Specification'
        };
        return names[inferenceStepName] || inferenceStepName;
    }
    
    // Skip a section
    skipSection(projectId, sectionId) {
        this.updateSection(projectId, sectionId, { status: "skipped" });
    }
    
    // Get custom workflow definition
    getCustomWorkflow(projectId) {
        const project = this.getProject(projectId);
        if (!project || !project.customWorkflow) return null;
        return project.customWorkflow;
    }
    
    // Set custom workflow definition
    setCustomWorkflow(projectId, workflowDefinition) {
        this.updateProject(projectId, { 
            customWorkflow: true,
            customWorkflowDefinition: workflowDefinition
        });
    }
    
    // Get pane state
    getPaneState(paneName) {
        return this.state.paneStates?.[paneName] !== false; // default to true
    }
    
    // Toggle pane state
    togglePaneState(paneName) {
        const currentState = this.getPaneState(paneName);
        const newState = !currentState;
        this.setState({
            ...this.state,
            paneStates: {
                ...this.state.paneStates,
                [paneName]: newState
            }
        });
        return newState;
    }
    
    // Reorder projects
    reorderProjects(projectIds) {
        const projectMap = new Map(this.state.projects.map(p => [p.id, p]));
        const projects = projectIds.map(id => projectMap.get(id)).filter(Boolean);
        this.setState({ projects });
        this.eventSystem.emit(EventType.PROJECT_REORDERED, {
            source: 'StateManager',
            data: { projectIds }
        });
    }
    
    // Update settings
    updateSettings(settings) {
        this.setState({ settings: { ...this.state.settings, ...settings } });
        this.eventSystem.emit(EventType.SETTING_CHANGED, {
            source: 'StateManager',
            data: { settings: this.state.settings }
        });
    }
    
    // Load state from external source
    loadState(state) {
        // Migrate existing projects: add automationEngine if missing
        if (state.projects && Array.isArray(state.projects)) {
            state.projects = state.projects.map(project => {
                if (!project.automationEngine) {
                    project.automationEngine = 'file-watching'; // Default for backward compatibility
                }
                return project;
            });
        }
        
        this.state = {
            ...this.createInitialState(),
            ...state,
            metadata: {
                ...this.createInitialState().metadata,
                ...(state.metadata || {}),
                lastModified: new Date().toISOString()
            }
        };
        this.emitStateChanged();
        this.eventSystem.emit(EventType.STATE_LOADED, {
            source: 'StateManager',
            data: { state: this.state }
        });
    }
    
    // Emit state changed event
    emitStateChanged() {
        this.eventSystem.emit(EventType.STATE_CHANGED, {
            source: 'StateManager',
            data: { state: this.state }
        });
    }
    
    // Get current automation mode
    getAutomationMode() {
        return this.state.metadata?.automationMode || 'file-watching';
    }
    
    // Set automation mode
    setAutomationMode(mode) {
        const updatedMetadata = {
            ...this.state.metadata,
            automationMode: mode
        };
        this.setState({
            metadata: updatedMetadata
        });
    }
    
    // Get scope directory
    getScopeDirectory() {
        return this.state.metadata?.scopeDirectory || null;
    }
    
    // Set scope directory
    setScopeDirectory(scopeDir) {
        const updatedMetadata = {
            ...this.state.metadata,
            scopeDirectory: scopeDir && scopeDir.trim() ? scopeDir.trim() : null
        };
        this.setState({
            metadata: updatedMetadata
        });
    }
}

