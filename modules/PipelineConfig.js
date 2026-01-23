// Pipeline Configuration - Loads from pipeline-config.json and provides case-based workflow management
class PipelineConfig {
    constructor(errorHandler = null) {
        this.config = null;
        this.loaded = false;
        this.loading = false;
        this.sections = []; // Legacy support - will be populated from config
        this.errorHandler = errorHandler;
    }
    
    // Load configuration from JSON file
    async loadConfig() {
        if (this.loaded) {
            return this.config;
        }
        
        if (this.loading) {
            // Wait for existing load to complete
            while (this.loading) {
                await new Promise(resolve => setTimeout(resolve, AppConstants.TIMEOUTS.MODULE_LOAD_DELAY));
            }
            return this.config;
        }
        
        this.loading = true;
        
        try {
            // Try multiple path options with retry logic
            const pathOptions = [
                'reference/pipeline-config.json',
                './reference/pipeline-config.json',
                '../feat-spec/reference/pipeline-config.json',
                '/feat-spec/reference/pipeline-config.json'
            ];
            
            if (this.errorHandler) {
                const result = await this.errorHandler.handleAsyncWithRetry(
                    async () => {
                        let lastError = null;
                        let lastStatus = null;
                        
                        for (const path of pathOptions) {
                            try {
                                const response = await fetch(path);
                                if (response.ok) {
                                    return await response.json();
                                } else {
                                    lastStatus = response.status;
                                }
                            } catch (err) {
                                lastError = err;
                                continue;
                            }
                        }
                        
                        // If all paths failed, throw error
                        throw new Error(`Failed to load pipeline-config.json. Status: ${lastStatus || 'unknown'}. Tried paths: ${pathOptions.join(', ')}`);
                    },
                    { source: 'PipelineConfig', operation: 'loadConfig' },
                    { maxRetries: 3, baseDelay: 1000 }
                );
                
                if (!result.success) {
                    this.loading = false;
                    this.errorHandler.showUserNotification(result.error, {
                        source: 'PipelineConfig',
                        operation: 'loadConfig'
                    }, {
                        severity: ErrorHandler.Severity.ERROR,
                        title: 'Failed to Load Pipeline Configuration'
                    });
                    throw new Error(result.error);
                }
                
                this.config = result.data;
                this.loaded = true;
                this.loading = false;
                return this.config;
            } else {
                // Fallback to original logic
                let response;
                let lastError = null;
                let lastStatus = null;
                
                for (const path of pathOptions) {
                    try {
                        response = await fetch(path);
                        if (response.ok) {
                            this.config = await response.json();
                            this.loaded = true;
                            this.loading = false;
                            return this.config;
                        } else {
                            lastStatus = response.status;
                        }
                    } catch (err) {
                        lastError = err;
                        continue;
                    }
                }
                
                // If all paths failed, throw error
                throw new Error(`Failed to load pipeline-config.json. Status: ${lastStatus || 'unknown'}. Tried paths: ${pathOptions.join(', ')}`);
            }
        } catch (error) {
            this.loading = false;
            if (this.errorHandler && !(error instanceof Error && error.message.includes('Failed to load'))) {
                const errorResult = this.errorHandler.handleError(error, {
                    source: 'PipelineConfig',
                    operation: 'loadConfig'
                });
                this.errorHandler.showUserNotification(error, {
                    source: 'PipelineConfig',
                    operation: 'loadConfig'
                }, {
                    severity: ErrorHandler.Severity.ERROR,
                    title: 'Failed to Load Pipeline Configuration'
                });
                throw new Error(errorResult.error);
            } else {
                console.error('Error loading pipeline configuration:', error);
                throw error;
            }
        }
    }
    
    // Get case configuration
    async getCaseConfig(caseNumber) {
        await this.loadConfig();
        return this.config.cases[String(caseNumber)] || null;
    }
    
    // Get all available cases
    async getAllCases() {
        await this.loadConfig();
        return Object.entries(this.config.cases).map(([num, config]) => ({
            number: parseInt(num),
            name: config.name,
            description: config.description
        }));
    }
    
    // Get modifiers for a step based on case
    async getModifiersForStep(caseNumber, stepName, caseChain = null) {
        await this.loadConfig();
        const caseConfig = this.config.cases[String(caseNumber)];
        if (!caseConfig) return [];
        
        let modifiers = [];
        
        // Get base modifiers from case workflow
        if (caseConfig.workflow && caseConfig.workflow[stepName]) {
            modifiers = [...(caseConfig.workflow[stepName].modifiers || [])];
        }
        
        // Apply case chaining modifiers if applicable
        if (caseChain && caseChain.previousCase && caseChain.currentCase === caseNumber) {
            const chainKey = `${caseChain.previousCase}->${caseNumber}`;
            const chainConfig = this.config.caseChaining?.[chainKey];
            
            if (chainConfig) {
                // Determine which modifier set to use based on current case
                const modifierKey = caseNumber === 1 ? 'case1Modifiers' : 
                                   caseNumber === 2 ? 'case2Modifiers' : 
                                   'case3Modifiers';
                
                if (chainConfig[modifierKey] && chainConfig[modifierKey][stepName]) {
                    // Combine with base modifiers, respecting layering rules
                    const chainModifiers = chainConfig[modifierKey][stepName];
                    modifiers = this.applyModifierLayering(modifiers, chainModifiers);
                }
            }
        }
        
        return modifiers;
    }
    
    // Apply modifier layering rules (base first, then layering)
    applyModifierLayering(baseModifiers, additionalModifiers) {
        const layeringRules = this.config.modifierLayering;
        if (!layeringRules) return [...baseModifiers, ...additionalModifiers];
        
        const base = layeringRules.priority?.base || [];
        const layering = layeringRules.priority?.layering || [];
        
        // Separate base and layering modifiers
        const baseMods = baseModifiers.filter(m => base.includes(m));
        const layeringMods = baseModifiers.filter(m => layering.includes(m));
        
        const additionalBase = additionalModifiers.filter(m => base.includes(m));
        const additionalLayering = additionalModifiers.filter(m => layering.includes(m));
        
        // Combine: all base modifiers first, then all layering modifiers
        return [
            ...baseMods,
            ...additionalBase,
            ...layeringMods,
            ...additionalLayering
        ].filter((v, i, arr) => arr.indexOf(v) === i); // Remove duplicates
    }
    
    // Get process step triggers for a case
    async getProcessStepTriggers(caseNumber, stepName) {
        await this.loadConfig();
        const caseConfig = this.config.cases[String(caseNumber)];
        if (!caseConfig || !caseConfig.processSteps) return [];
        
        const triggers = [];
        for (const [processStepName, processStepConfig] of Object.entries(caseConfig.processSteps)) {
            if (processStepConfig.triggers && processStepConfig.triggers.includes(stepName)) {
                triggers.push({
                    name: processStepName,
                    step: processStepConfig.step,
                    required: processStepConfig.required || false
                });
            }
        }
        
        return triggers;
    }
    
    // Get inference steps for Case 2
    async getInferenceSteps(caseNumber) {
        await this.loadConfig();
        const caseConfig = this.config.cases[String(caseNumber)];
        if (!caseConfig || !caseConfig.inference) return [];
        
        return Object.entries(caseConfig.inference).map(([name, config]) => ({
            name: name,
            step: config.step,
            after: config.after
        }));
    }
    
    // Get modifier definition
    getModifier(modifierName) {
        if (!this.config) return null;
        
        // Modifiers are not explicitly defined in the config, they're just referenced by name
        // Return a basic structure with the name
        return {
            name: modifierName,
            description: `Modifier: ${modifierName}`
        };
    }
    
    // Generate sections for a case
    async generateSectionsForCase(caseNumber, caseChain = null) {
        await this.loadConfig();
        const caseConfig = this.config.cases[String(caseNumber)];
        if (!caseConfig) return [];
        
        const sections = [];
        const workflow = caseConfig.workflow || {};
        
        // Core workflow steps (in order) - different for Case 4
        let coreStepOrder;
        if (caseNumber === 4) {
            coreStepOrder = [
                'input-parsing',
                'input-organization',
                'input-structuring',
                'output-mapping'
            ];
        } else if (caseNumber === 5) {
            coreStepOrder = [
                'idea-capture',
                'documentation-review',
                'user-interrogation',
                'iterative-refinement',
                'atomization',
                'flow-document',
                'atomic-document',
                'architecture-document',
                'pseudocode-document',
                'detailed-pseudocode',  // Optional step
                'implementation-specification'
            ];
        } else if (caseNumber === 6) {
            // Case 6: Poiesis - flexible, repeatable, linkable steps
            // Order is suggested but not enforced - user can rearrange
            coreStepOrder = [
                'theoria',
                'praxis',
                'doctrine',
                'poiesis'
            ];
        } else if (caseNumber === 7) {
            // Case 7: Physis - materialization of poiesis into implementable form
            coreStepOrder = [
                'physis'
            ];
        } else {
            coreStepOrder = [
                'research',
                'feature-extraction',
                'validation',
                'app-analysis',
                'decomposition',
                'atomic-features',
                'ux-specification'
            ];
        }
        
        let stepIndex = 0;
        for (const stepName of coreStepOrder) {
            if (!workflow[stepName]) continue;
            
            const stepConfig = workflow[stepName];
            const modifiers = await this.getModifiersForStep(caseNumber, stepName, caseChain);
            
            // For Case 6 (Poiesis), steps are flexible with no strict dependencies
            // User can inject input or reference any previous step
            let dependencies = [];
            if (caseNumber === 6) {
                // No dependencies - steps can be done in any order
                dependencies = [];
            } else {
                // For other cases, maintain sequential dependencies
                dependencies = stepIndex > 0 ? [coreStepOrder[stepIndex - 1]] : [];
            }
            
            sections.push({
                id: stepName,
                stepName: stepName,
                name: this.getStepDisplayName(stepName),
                dependencies: dependencies,
                promptLocation: stepConfig.step,
                modifiers: modifiers,
                isValidation: stepName === 'validation',
                isOptional: stepConfig.optional || false,
                specialized: stepConfig.specialized || null,
                flexible: caseNumber === 6 ? true : false,
                repeatable: caseNumber === 6 ? true : false,
                linkable: caseNumber === 6 ? true : false
            });
            
            stepIndex++;
        }
        
        // Add inference steps for Case 2 (after atomic-features)
        if (caseNumber === 2 && caseConfig.inference) {
            const inferenceSteps = await this.getInferenceSteps(2);
            let lastStepId = 'atomic-features';
            
            for (const infStep of inferenceSteps) {
                sections.push({
                    id: infStep.name,
                    stepName: infStep.name,
                    name: this.getStepDisplayName(infStep.name),
                    dependencies: [lastStepId],
                    promptLocation: infStep.step,
                    modifiers: [],
                    isValidation: false,
                    isOptional: false,
                    isInferenceStep: true
                });
                lastStepId = infStep.name;
            }
        }
        
        return sections;
    }
    
    // Get step display name
    getStepDisplayName(stepName) {
        const displayNames = {
            'theoria': 'Theoria',
            'praxis': 'Praxis',
            'doctrine': 'Doctrine',
            'poiesis': 'Poiesis',
            'research': 'Research and Documentation Scanning',
            'feature-extraction': 'Feature Extraction',
            'validation': 'Validation',
            'app-analysis': 'App Analysis and Feature Inventory',
            'decomposition': 'Feature Decomposition to Atomic Level',
            'atomic-features': 'Atomic Feature Description Generation',
            'ux-specification': 'UX Specification Generation',
            'idea-capture': 'Idea Capture',
            'documentation-review': 'Documentation Review',
            'user-interrogation': 'User Interrogation',
            'iterative-refinement': 'Iterative Refinement',
            'atomization': 'Atomization',
            'flow-document': 'Flow Document',
            'atomic-document': 'Atomic Document',
            'architecture-document': 'Architecture Document',
            'pseudocode-document': 'Pseudocode Document',
            'detailed-pseudocode': 'Detailed Pseudocode (Optional)',
            'implementation-specification': 'Complete Implementation Specification',
            'data-model-inference': 'Data Model Inference',
            'state-machine-inference': 'State Machine Inference',
            'api-contract-inference': 'API Contract Inference',
            'behavioral-implementation-spec': 'Behavioral Implementation Specification',
            'input-parsing': 'Input Parsing',
            'input-organization': 'Input Organization',
            'input-structuring': 'Input Structuring',
            'output-mapping': 'Output Mapping'
        };
        return displayNames[stepName] || stepName;
    }
    
    // Get case chaining configuration
    async getCaseChainingConfig(previousCase, currentCase) {
        await this.loadConfig();
        const chainKey = `${previousCase}->${currentCase}`;
        return this.config.caseChaining?.[chainKey] || null;
    }
    
    // Get variable definitions
    async getVariableDefinitions() {
        await this.loadConfig();
        return this.config.variables || {};
    }
    
    // Legacy support methods (for backward compatibility)
    getAllSections() {
        return this.sections;
    }
    
    getSection(sectionId) {
        return this.sections.find(s => s.id === sectionId) || null;
    }
    
    // Get sections for workflow type (legacy support)
    getSectionsForWorkflow(workflowType) {
        // This is now handled by generateSectionsForCase
        // For backward compatibility, return all sections
        return this.sections;
    }
    
    // Get next section after given section
    getNextSection(sectionId, projectSections = null) {
        if (!projectSections || projectSections.length === 0) return null;
        
        const currentIndex = projectSections.findIndex(s => s.sectionId === sectionId);
        if (currentIndex >= 0 && currentIndex < projectSections.length - 1) {
            const nextSection = projectSections[currentIndex + 1];
            // Return full section object to preserve all properties (stepName, isProcessStep, etc.)
            return nextSection;
        }
        return null;
    }
    
    // Get previous section before given section
    getPreviousSection(sectionId, projectSections = null) {
        if (!projectSections || projectSections.length === 0) return null;
        
        const currentIndex = projectSections.findIndex(s => s.sectionId === sectionId);
        if (currentIndex > 0) {
            const previousSection = projectSections[currentIndex - 1];
            // Return full section object to preserve all properties (stepName, isProcessStep, etc.)
            return previousSection;
        }
        return null;
    }
    
    // Check if section dependencies are met
    checkDependencies(sectionId, projectSections) {
        const section = projectSections.find(s => s.sectionId === sectionId);
        if (!section || !section.dependencies || section.dependencies.length === 0) {
            return { met: true, missing: [] };
        }
        
        const missing = section.dependencies.filter(depId => {
            const depSection = projectSections.find(s => s.sectionId === depId);
            return !depSection || depSection.status !== "complete";
        });
        
        return {
            met: missing.length === 0,
            missing: missing
        };
    }
    
    // Get first section for workflow
    getFirstSection(projectSections = null) {
        if (!projectSections || projectSections.length === 0) return null;
        return {
            id: projectSections[0].sectionId,
            name: projectSections[0].sectionName
        };
    }
    
    // Get last section for workflow
    getLastSection(projectSections = null) {
        if (!projectSections || projectSections.length === 0) return null;
        const last = projectSections[projectSections.length - 1];
        return {
            id: last.sectionId,
            name: last.sectionName
        };
    }
}

// Export singleton instance
window.PipelineConfig = new PipelineConfig(window.ErrorHandler || null);
