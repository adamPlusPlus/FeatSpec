// Section Manager - Handles section management operations
class SectionManager {
    constructor(stateManager, eventSystem, renderingEngine, modalSystem, navigationService, pipelineConfig, stateUpdateHelper = null, errorHandler = null) {
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
        this.renderingEngine = renderingEngine;
        this.modalSystem = modalSystem;
        this.navigationService = navigationService;
        this.pipelineConfig = pipelineConfig;
        this.stateUpdateHelper = stateUpdateHelper;
        this.errorHandler = errorHandler;
        
        // Callbacks for methods that need app-level access
        this.loadPromptsForProjectCallback = null;
        this.removeInputGuidanceFromPromptCallback = null;
        this.checkDependenciesCallback = null;
        
        // Track event listeners for cleanup
        this.eventListenerCleanups = [];
    }
    
    /**
     * Set callbacks for methods that need app-level access
     */
    setCallbacks(callbacks) {
        if (callbacks.loadPromptsForProject) {
            this.loadPromptsForProjectCallback = callbacks.loadPromptsForProject;
        }
        if (callbacks.removeInputGuidanceFromPrompt) {
            this.removeInputGuidanceFromPromptCallback = callbacks.removeInputGuidanceFromPrompt;
        }
        if (callbacks.checkDependencies) {
            this.checkDependenciesCallback = callbacks.checkDependencies;
        }
    }
    
    /**
     * Mark section as complete
     */
    markSectionComplete(projectId, sectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        const section = project.sections.find(s => s.sectionId === sectionId);
        if (!section) return;
        
        // Update section status
        if (this.stateUpdateHelper) {
            this.stateUpdateHelper.updateSection(projectId, sectionId, {
                status: "complete"
            }, { source: 'SectionManager' });
        } else {
            this.stateManager.updateSection(projectId, sectionId, {
                status: "complete"
            });
        }
        
        // Enable next section
        if (this.pipelineConfig) {
            const nextSection = this.pipelineConfig.getNextSection(sectionId, project.sections);
            if (nextSection) {
                // Next section is now available (dependencies met)
                if (nextSection.status === "not_started") {
                    // Auto-navigate to next section could happen here
                }
            }
        }
    }
    
    /**
     * Mark section as needing revision
     */
    markSectionNeedsRevision(projectId, sectionId) {
        if (this.stateUpdateHelper) {
            this.stateUpdateHelper.updateSection(projectId, sectionId, {
                status: "needs_revision"
            }, { source: 'SectionManager' });
        } else {
            this.stateManager.updateSection(projectId, sectionId, {
                status: "needs_revision"
            });
        }
    }
    
    /**
     * Navigate to a specific section
     */
    navigateToSection(projectId, sectionId) {
        if (!projectId || !sectionId) return;
        
        this.stateManager.setActiveProject(projectId);
        
        // Remove active class from all pipeline section items first
        const allPipelineItems = document.querySelectorAll('.pipeline-section-item');
        allPipelineItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Update active section in rendering engine
        if (this.renderingEngine) {
            this.renderingEngine.activeSectionId = sectionId;
        }
        
        // Re-render
        this.renderingEngine.renderAll();
    }
    
    /**
     * Paste from previous section
     */
    async pasteFromPreviousSection(projectId, sectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        // Find current section index
        const currentIndex = project.sections.findIndex(s => s.sectionId === sectionId);
        if (currentIndex === -1) return;
        
        // Get all previous sections with outputs
        const previousSections = project.sections
            .slice(0, currentIndex)
            .filter(s => s.output && s.output.trim().length > 0)
            .map((s, idx) => ({
                sectionId: s.sectionId,
                sectionName: s.sectionName || s.stepName || s.sectionId,
                output: s.output,
                index: idx,
                status: s.status
            }));
        
        if (previousSections.length === 0) {
            const error = 'No previous steps with output available.';
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(error, {
                    source: 'SectionManager',
                    operation: 'pasteFromPrevious',
                    projectId,
                    sectionId
                }, {
                    severity: ErrorHandler.Severity.INFO,
                    title: 'No Previous Output'
                });
            } else {
                alert(error);
            }
            return;
        }
        
        // Open modal
        await this.openPreviousStepModal(projectId, sectionId, previousSections);
    }
    
    /**
     * Open previous step selection modal
     */
    async openPreviousStepModal(projectId, sectionId, previousSections) {
        const modal = document.getElementById('previous-step-modal');
        const listContainer = document.getElementById('previous-steps-list');
        const pasteBtn = document.getElementById('previous-step-paste');
        let selectedSectionId = null;
        
        if (!modal || !listContainer) return;
        
        // Clear previous content
        while (listContainer.firstChild) {
            listContainer.removeChild(listContainer.firstChild);
        }
        pasteBtn.disabled = true;
        selectedSectionId = null;
        
        // Populate list
        previousSections.forEach((section, idx) => {
            const outputPreview = section.output.length > 200 
                ? section.output.substring(0, 200) + '...' 
                : section.output;
            
            const item = document.createElement('div');
            item.className = 'previous-step-item';
            item.dataset.sectionId = section.sectionId;
            // section.sectionName and outputPreview are user data - escape and use safeSetInnerHTML
            const itemHtml = `
                <div class="previous-step-header">
                    <input type="radio" name="previous-step" value="${section.sectionId}" id="step-${idx}">
                    <label for="step-${idx}">
                        <strong>${this.escapeHtml(section.sectionName)}</strong>
                        ${section.status === 'complete' ? '<span class="status-badge complete">Complete</span>' : ''}
                    </label>
                </div>
                <div class="previous-step-preview">${this.escapeHtml(outputPreview)}</div>
            `;
            
            item.addEventListener('click', (e) => {
                if (e.target.type !== 'radio') {
                    const radio = item.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.checked = true;
                        selectedSectionId = section.sectionId;
                        pasteBtn.disabled = false;
                    }
                } else {
                    selectedSectionId = section.sectionId;
                    pasteBtn.disabled = false;
                }
            });
            
            listContainer.appendChild(item);
        });
        
        // Show modal
        modal.style.display = 'flex';
        
        // Handle paste button
        const handlePaste = () => {
            if (!selectedSectionId) return;
            
            const selectedSection = previousSections.find(s => s.sectionId === selectedSectionId);
            if (selectedSection) {
                const currentSection = project.sections.find(s => s.sectionId === sectionId);
                const existingInput = currentSection?.input || '';
                const newInput = existingInput 
                    ? `${existingInput}\n\n---\n\n${selectedSection.output}`
                    : selectedSection.output;
                
                if (this.stateUpdateHelper) {
                    this.stateUpdateHelper.updateSection(projectId, sectionId, {
                        input: newInput,
                        status: existingInput ? currentSection.status : 'in_progress'
                    }, { source: 'SectionManager' });
                } else {
                    this.stateManager.updateSection(projectId, sectionId, {
                        input: newInput,
                        status: existingInput ? currentSection.status : 'in_progress'
                    });
                }
                
                this.renderingEngine.queueRender(['sections', 'pipeline']);
            }
            
            modal.style.display = 'none';
            pasteBtn.removeEventListener('click', handlePaste);
            pasteBtn.removeEventListener('click', handleCancel);
        };
        
        const handleCancel = () => {
            modal.style.display = 'none';
            pasteBtn.removeEventListener('click', handlePaste);
            pasteBtn.removeEventListener('click', handleCancel);
        };
        
        // Track listeners for cleanup
        if (typeof window !== 'undefined' && window.eventListenerManager) {
            window.eventListenerManager.add(pasteBtn, 'click', handlePaste);
            const cancelBtn = document.getElementById('previous-step-cancel');
            if (cancelBtn) {
                window.eventListenerManager.add(cancelBtn, 'click', handleCancel);
            }
        } else {
            pasteBtn.addEventListener('click', handlePaste);
            const cancelBtn = document.getElementById('previous-step-cancel');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', handleCancel);
                this.eventListenerCleanups.push(() => {
                    pasteBtn.removeEventListener('click', handlePaste);
                    cancelBtn.removeEventListener('click', handleCancel);
                });
            } else {
                this.eventListenerCleanups.push(() => {
                    pasteBtn.removeEventListener('click', handlePaste);
                });
            }
        }
    }
    
    /**
     * Cleanup event listeners
     */
    cleanup() {
        // Cleanup using EventListenerManager if available
        if (typeof window !== 'undefined' && window.eventListenerManager) {
            // EventListenerManager handles cleanup automatically when elements are removed
            // But we can explicitly clean up if needed
        } else {
            // Fallback: use stored cleanup functions
            this.eventListenerCleanups.forEach(cleanup => cleanup());
            this.eventListenerCleanups = [];
        }
    }
    
    /**
     * Invoke process step
     */
    async invokeProcessStep(projectId, sectionId, processStepType) {
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        const section = project.sections.find(s => s.sectionId === sectionId);
        if (!section) return;
        
        const promptLoader = window.PromptLoader;
        if (!promptLoader) return;
        
        try {
            // Get process step prompt
            let prompt = await promptLoader.getProcessStepPrompt(
                processStepType,
                section,
                project
            );
            
            if (prompt) {
                // Remove Input Guidance section from process step prompt
                if (this.removeInputGuidanceFromPromptCallback) {
                    prompt = this.removeInputGuidanceFromPromptCallback(prompt);
                }
                
                // Create or update process step section
                const existingProcessStep = project.sections.find(s => 
                    s.isProcessStep && s.processStepType === processStepType && 
                    s.dependencies.includes(sectionId)
                );
                
                if (existingProcessStep) {
                    if (this.stateUpdateHelper) {
                        this.stateUpdateHelper.updateSection(projectId, existingProcessStep.sectionId, {
                            prompt: prompt,
                            status: 'in_progress'
                        }, { source: 'SectionManager' });
                    } else {
                        this.stateManager.updateSection(projectId, existingProcessStep.sectionId, {
                            prompt: prompt,
                            status: 'in_progress'
                        });
                    }
                } else {
                    const processStep = this.stateManager.addProcessStep(
                        projectId,
                        processStepType,
                        sectionId,
                        { prompt: prompt }
                    );
                    
                    if (processStep) {
                        // Navigate to process step
                        this.navigateToSection(projectId, processStep.sectionId);
                    }
                }
            }
        } catch (error) {
            if (this.errorHandler) {
                this.errorHandler.handleError(error, {
                    source: 'SectionManager',
                    operation: 'invokeProcessStep',
                    processStepType,
                    projectId,
                    sectionId
                });
                this.errorHandler.showUserNotification(error, {
                    source: 'SectionManager',
                    operation: 'invokeProcessStep',
                    processStepType
                }, {
                    severity: ErrorHandler.Severity.ERROR,
                    title: 'Process Step Failed'
                });
            } else {
                console.error(`Error invoking process step ${processStepType}:`, error);
            }
        }
    }
    
    /**
     * Update section input
     */
    updateSectionInput(projectId, sectionId, value) {
        if (this.stateUpdateHelper) {
            this.stateUpdateHelper.updateSection(projectId, sectionId, {
                input: value,
                status: value ? "in_progress" : "not_started"
            }, { source: 'SectionManager' });
        } else {
            this.stateManager.updateSection(projectId, sectionId, {
                input: value,
                status: value ? "in_progress" : "not_started"
            });
        }
    }
    
    /**
     * Update section output
     */
    updateSectionOutput(projectId, sectionId, value) {
        if (this.stateUpdateHelper) {
            this.stateUpdateHelper.updateSection(projectId, sectionId, {
                output: value
            }, { source: 'SectionManager' });
        } else {
            this.stateManager.updateSection(projectId, sectionId, {
                output: value
            });
        }
    }
    
    /**
     * Update section notes
     */
    updateSectionNotes(projectId, sectionId, value) {
        if (this.stateUpdateHelper) {
            this.stateUpdateHelper.updateSection(projectId, sectionId, {
                notes: value
            }, { source: 'SectionManager' });
        } else {
            this.stateManager.updateSection(projectId, sectionId, {
                notes: value
            });
        }
    }
    
    /**
     * Update section override instructions
     */
    updateSectionOverrideInstructions(projectId, sectionId, value) {
        if (this.stateUpdateHelper) {
            this.stateUpdateHelper.updateSection(projectId, sectionId, {
                overrideInstructions: value
            }, { source: 'SectionManager' });
        } else {
            this.stateManager.updateSection(projectId, sectionId, {
                overrideInstructions: value
            });
        }
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        // This function returns HTML string, not setting innerHTML
        // Create element, set textContent (escapes HTML), then return innerHTML
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML; // Safe: textContent already escaped any HTML
    }
}
