// Process Step Service - Handles process step operations
class ProcessStepService {
    constructor(pipelineConfig) {
        this.pipelineConfig = pipelineConfig;
    }
    
    /**
     * Get process step triggers for a section
     * @param {string} projectId - Project ID (for context)
     * @param {string} sectionId - Section ID
     * @param {Object} project - Project object
     * @param {Object} section - Section object
     * @returns {Promise<Array>} Array of trigger objects
     */
    async getProcessStepTriggers(projectId, sectionId, project, section) {
        if (!this.pipelineConfig) {
            return [];
        }
        
        if (section.isProcessStep) {
            return []; // Don't show process step buttons on process step sections themselves
        }
        
        try {
            const caseNumber = project.case || 1;
            const stepName = section.stepName || sectionId;
            const triggers = await this.pipelineConfig.getProcessStepTriggers(caseNumber, stepName);
            return triggers || [];
        } catch (error) {
            console.error('Error getting process step triggers:', error);
            return [];
        }
    }
    
    /**
     * Render process step buttons HTML
     * @param {Array} triggers - Array of trigger objects
     * @param {string} projectId - Project ID
     * @param {string} sectionId - Section ID
     * @returns {string} HTML string for buttons
     */
    renderProcessStepButtons(triggers, projectId, sectionId) {
        if (!triggers || triggers.length === 0) {
            return '';
        }
        
        const buttons = triggers.map(trigger => {
            const buttonClass = trigger.required ? 'btn-process-step required' : 'btn-process-step';
            const buttonText = trigger.name.replace('-loop', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `<button class="${buttonClass}" data-action="invoke-process-step" data-project-id="${projectId}" data-section-id="${sectionId}" data-process-step="${trigger.name}" title="${trigger.required ? 'Required' : 'Optional'} process step">
                ⚙️ ${this.escapeHtml(buttonText)}
            </button>`;
        }).join('');
        
        return `<div class="process-step-buttons">
            <h4>Process Steps</h4>
            <div class="process-step-actions">
                ${buttons}
            </div>
        </div>`;
    }
    
    /**
     * Escape HTML to prevent XSS
     * @private
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
