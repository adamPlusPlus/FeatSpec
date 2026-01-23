// Workflow Context Service - Handles workflow context calculations
class WorkflowContextService {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }
    
    /**
     * Get workflow context for a section
     * @param {string} projectId - Project ID
     * @param {string} sectionId - Section ID
     * @returns {Object} { currentIndex: number, totalSteps: number, contextString: string }
     */
    getWorkflowContext(projectId, sectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) {
            return { currentIndex: 0, totalSteps: 0, contextString: '' };
        }
        
        const currentIndex = project.sections.findIndex(s => s.sectionId === sectionId);
        const totalSteps = project.sections.length;
        const contextString = `Step ${currentIndex + 1} of ${totalSteps}`;
        
        return {
            currentIndex: currentIndex >= 0 ? currentIndex : 0,
            totalSteps: totalSteps,
            contextString: contextString
        };
    }
}
