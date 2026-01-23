// Section Logic Service - Handles section-related business logic
class SectionLogicService {
    constructor(stateManager, pipelineConfig) {
        this.stateManager = stateManager;
        this.pipelineConfig = pipelineConfig;
    }
    
    /**
     * Check if section dependencies are met
     * @param {string} projectId - Project ID
     * @param {string} sectionId - Section ID
     * @returns {Object} { met: boolean, missing: string[] }
     */
    checkDependencies(projectId, sectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) {
            return { met: false, missing: [] };
        }
        
        if (!this.pipelineConfig) {
            return { met: true, missing: [] };
        }
        
        return this.pipelineConfig.checkDependencies(sectionId, project.sections);
    }
    
    /**
     * Determine section status display properties
     * @param {Object} section - Section object
     * @returns {Object} { class: string, text: string, icon: string }
     */
    determineStatus(section) {
        let statusClass = 'status-not-started';
        let statusText = 'Not Started';
        let statusIcon = '○';
        
        if (section.status === 'complete') {
            statusClass = 'status-complete';
            statusText = 'Complete';
            statusIcon = '●';
        } else if (section.status === 'in_progress') {
            statusClass = 'status-in-progress';
            statusText = 'In Progress';
            statusIcon = '◐';
        } else if (section.status === 'needs_revision') {
            statusClass = 'status-needs-revision';
            statusText = 'Needs Revision';
            statusIcon = '⚠';
        } else if (section.status === 'skipped') {
            statusClass = 'status-skipped';
            statusText = 'Skipped';
            statusIcon = '⊘';
        }
        
        return {
            class: statusClass,
            text: statusText,
            icon: statusIcon
        };
    }
    
    /**
     * Calculate project progress
     * @param {Object} project - Project object
     * @returns {Object} { percentage: number, complete: number, total: number }
     */
    calculateProgress(project) {
        const totalSections = project.sections.length;
        const completeSections = project.sections.filter(s => s.status === 'complete').length;
        const progress = totalSections > 0 ? Math.round((completeSections / totalSections) * 100) : 0;
        
        return {
            percentage: progress,
            complete: completeSections,
            total: totalSections
        };
    }
    
    /**
     * Determine project status icon
     * @param {Object} project - Project object
     * @returns {string} Status icon character
     */
    getProjectStatusIcon(project) {
        if (project.status === 'complete') {
            return '●';
        } else if (project.status === 'in_progress') {
            return '◐';
        }
        return '○';
    }
}
