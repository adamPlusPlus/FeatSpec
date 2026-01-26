// Navigation Service - Handles section navigation logic
class NavigationService {
    constructor(stateManager, pipelineConfig) {
        this.stateManager = stateManager;
        this.pipelineConfig = pipelineConfig;
    }
    
    /**
     * Get previous section in workflow
     * @param {string} projectId - Project ID
     * @param {string} sectionId - Current section ID
     * @returns {Object|null} Previous section object or null
     */
    getPreviousSection(projectId, sectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project || !this.pipelineConfig) {
            return null;
        }
        
        return this.pipelineConfig.getPreviousSection(sectionId, project.sections);
    }
    
    /**
     * Get next section in workflow
     * @param {string} projectId - Project ID
     * @param {string} sectionId - Current section ID
     * @returns {Promise<Object|null>} Next section object or null
     */
    async getNextSection(projectId, sectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project || !this.pipelineConfig) {
            return null;
        }
        
        return await this.pipelineConfig.getNextSection(sectionId, project.sections);
    }
    
    /**
     * Get first incomplete section in project
     * @param {string} projectId - Project ID
     * @returns {Object|null} First incomplete section or null
     */
    getFirstIncompleteSection(projectId) {
        try {
            const project = this.stateManager.getProject(projectId);
            if (!project) {
                return null;
            }
            
            const pipelineConfig = this.pipelineConfig || window.PipelineConfig;
            if (!pipelineConfig) {
                // Fallback: find first section with status !== 'complete' && !== 'skipped'
                return project.sections.find(s => 
                    s.status !== 'complete' && s.status !== 'skipped'
                ) || null;
            }
            
            // Use workflow-aware logic if available
            const workflowSections = pipelineConfig.getSectionsForWorkflow 
                ? pipelineConfig.getSectionsForWorkflow(project.workflowType || 'full')
                : null;
            
            if (workflowSections && workflowSections.length > 0) {
                for (const sectionDef of workflowSections) {
                    const section = project.sections.find(s => s.sectionId === sectionDef.id);
                    if (section && section.status !== 'complete' && section.status !== 'skipped') {
                        // Check dependencies
                        const deps = this.checkDependencies(projectId, sectionDef.id);
                        if (deps && deps.met) {
                            return sectionDef;
                        }
                    }
                }
                return null;
            }
            
            // Fallback: find first incomplete section
            return project.sections.find(s => 
                s.status !== 'complete' && s.status !== 'skipped'
            ) || null;
        } catch (error) {
            console.warn('Error in getFirstIncompleteSection:', error);
            return null;
        }
    }
    
    /**
     * Check dependencies (helper method for getFirstIncompleteSection)
     * @private
     */
    checkDependencies(projectId, sectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project || !this.pipelineConfig) {
            return { met: true, missing: [] };
        }
        
        return this.pipelineConfig.checkDependencies(sectionId, project.sections);
    }
    
    /**
     * Get breadcrumb data for navigation
     * @param {string} projectId - Project ID
     * @param {string} sectionId - Current section ID
     * @returns {Object} Breadcrumb data with project and section info
     */
    getBreadcrumbData(projectId, sectionId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) {
            return { project: null, section: null };
        }
        
        const section = project.sections.find(s => s.sectionId === sectionId);
        
        return {
            project: {
                id: project.id,
                name: project.name
            },
            section: section ? {
                id: section.sectionId,
                name: section.sectionName
            } : null
        };
    }
    
    /**
     * Calculate project progress
     * @param {string} projectId - Project ID
     * @returns {Object} Progress data with percentage, counts, and section details
     */
    calculateProgress(projectId) {
        const project = this.stateManager.getProject(projectId);
        if (!project || !project.sections || project.sections.length === 0) {
            return {
                percentage: 0,
                completed: 0,
                total: 0,
                inProgress: 0,
                notStarted: 0,
                needsRevision: 0,
                sections: []
            };
        }
        
        const sections = project.sections;
        const total = sections.length;
        let completed = 0;
        let inProgress = 0;
        let notStarted = 0;
        let needsRevision = 0;
        
        const sectionDetails = sections.map(section => {
            let status = 'not_started';
            if (section.status === 'complete') {
                status = 'complete';
                completed++;
            } else if (section.status === 'in_progress') {
                status = 'in_progress';
                inProgress++;
            } else if (section.status === 'needs_revision') {
                status = 'needs_revision';
                needsRevision++;
            } else {
                notStarted++;
            }
            
            return {
                sectionId: section.sectionId,
                sectionName: section.sectionName,
                status: status
            };
        });
        
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return {
            percentage,
            completed,
            total,
            inProgress,
            notStarted,
            needsRevision,
            sections: sectionDetails
        };
    }
}
