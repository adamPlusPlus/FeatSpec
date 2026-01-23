// Automation Orchestrator - Handles automation business logic coordination
class AutomationOrchestrator {
    constructor(stateManager, pipelineConfig, eventSystem, stateUpdateHelper = null) {
        this.stateManager = stateManager;
        this.pipelineConfig = pipelineConfig;
        this.eventSystem = eventSystem;
        this.stateUpdateHelper = stateUpdateHelper;
    }
    
    /**
     * Process section output from automation file
     * @param {string} projectId - Project ID
     * @param {string} sectionId - Section ID
     * @param {string} fileContent - Content from the file
     * @param {boolean} markComplete - Whether to mark section as complete
     * @returns {Promise<void>}
     */
    async processSectionOutput(projectId, sectionId, fileContent, markComplete = false) {
        const updates = {
            output: fileContent
        };
        
        // Only mark as complete if explicitly requested (for processFiles, not processCompleteFile)
        if (markComplete) {
            updates.status = 'complete';
        }
        
        // Update section output
        this.stateManager.updateSection(projectId, sectionId, updates);
        
        // Emit events
        this.eventSystem.emit(window.EventType.AUTOMATION_SECTION_COMPLETE, {
            source: 'AutomationOrchestrator',
            data: { projectId, sectionId, fileCount: 1 }
        });
        
        this.eventSystem.emit(window.EventType.SECTION_UPDATED, {
            source: 'AutomationOrchestrator',
            data: { projectId, sectionId }
        });
    }
    
    /**
     * Process multiple file contents and combine them
     * @param {string} projectId - Project ID
     * @param {string} sectionId - Section ID
     * @param {Array} fileContents - Array of { name, content } objects
     * @returns {Promise<void>}
     */
    async processMultipleFiles(projectId, sectionId, fileContents) {
        if (!fileContents || fileContents.length === 0) {
            console.warn('No files to process');
            return;
        }
        
        // Combine file contents
        const combinedOutput = fileContents.map(f => 
            `## ${f.name}\n\n${f.content}`
        ).join('\n\n---\n\n');
        
        // Update section output and mark as complete
        if (this.stateUpdateHelper) {
            this.stateUpdateHelper.updateSection(projectId, sectionId, {
                output: combinedOutput,
                status: 'complete'
            }, { 
                source: 'AutomationOrchestrator',
                emitEvent: false // We'll emit custom events below
            });
        } else {
            this.stateManager.updateSection(projectId, sectionId, {
                output: combinedOutput,
                status: 'complete'
            });
        }
        
        // Emit events
        this.eventSystem.emit(window.EventType.AUTOMATION_SECTION_COMPLETE, {
            source: 'AutomationOrchestrator',
            data: { projectId, sectionId, fileCount: fileContents.length }
        });
        
        this.eventSystem.emit(window.EventType.SECTION_UPDATED, {
            source: 'AutomationOrchestrator',
            data: { projectId, sectionId }
        });
    }
    
    /**
     * Get next section in workflow
     * @param {string} projectId - Project ID
     * @param {string} currentSectionId - Current section ID
     * @returns {Promise<Object|null>} Next section or null
     */
    async getNextSection(projectId, currentSectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) {
            return null;
        }
        
        if (!this.pipelineConfig) {
            return null;
        }
        
        const nextSection = await this.pipelineConfig.getNextSection(currentSectionId, project.sections);
        return nextSection;
    }
    
    /**
     * Move to next section (returns next section info, doesn't update state)
     * @param {string} projectId - Project ID
     * @param {string} currentSectionId - Current section ID
     * @returns {Promise<Object|null>} Next section info or null
     */
    async moveToNextSection(projectId, currentSectionId) {
        const nextSection = await this.getNextSection(projectId, currentSectionId);
        
        if (!nextSection) {
            // No more sections
            return null;
        }
        
        // Return next section info (caller handles watching/state updates)
        return {
            sectionId: nextSection.sectionId || nextSection.id,
            sectionName: nextSection.sectionName || nextSection.name
        };
    }
    
    /**
     * Check if section needs input based on Input Guidance
     * @param {Object} section - Section object
     * @returns {Promise<boolean>} True if section needs input
     */
    async sectionNeedsInput(section) {
        if (!window.PromptLoader) {
            return false;
        }
        
        try {
            const guidance = await window.PromptLoader.getInputGuidance(
                section.stepName || section.sectionId,
                section.isProcessStep,
                section.isInferenceStep,
                section.processStepType
            );
            
            if (!guidance) {
                return false;
            }
            
            // Check if guidance mentions "Paste" or "previous" or "output"
            const needsInputPattern = /(paste|previous|output|from.*step|research summary|feature extraction)/i;
            return needsInputPattern.test(guidance);
        } catch (error) {
            console.warn('Failed to check input guidance:', error);
            return false;
        }
    }
    
    /**
     * Verify file matches section (business logic for file validation)
     * @param {string} fileName - File name
     * @param {string} stepName - Step name
     * @param {string} automationId - Automation ID
     * @returns {boolean} True if file matches section
     */
    verifyFileMatchesSection(fileName, stepName, automationId) {
        const lowerFileName = fileName.toLowerCase();
        const lowerStepName = stepName.toLowerCase();
        let matches = false;
        
        // First priority: Check for section-specific pattern with automation ID
        if (automationId) {
            const expectedFileName = AppConstants.generateCompleteFileName(stepName, automationId).toLowerCase();
            const exactPattern = new RegExp(`^${expectedFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            matches = exactPattern.test(fileName);
        }
        
        // Fallback: match patterns without ID (e.g., "research-complete.md")
        if (!matches) {
            const expectedFileName = AppConstants.generateCompleteFileName(stepName, null).toLowerCase();
            const exactPattern = new RegExp(`^${expectedFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            matches = exactPattern.test(fileName);
        }
        
        // Last resort: check if file starts with step name (e.g., "research-findings-complete.md")
        if (!matches) {
            const completeSuffix = AppConstants.FILE_PATTERNS.COMPLETE_SUFFIX.replace(/\./g, '\\.');
            const stepNamePrefixPattern = new RegExp(`^${lowerStepName}-.*${completeSuffix}$`, 'i');
            matches = stepNamePrefixPattern.test(fileName);
        }
        
        return matches;
    }
}
