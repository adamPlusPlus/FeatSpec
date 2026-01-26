// Project Templates - Provides starter templates for new projects
class ProjectTemplates {
    constructor() {
        this.templates = {
            'empty': {
                name: 'Empty Project',
                description: 'Start with a blank project and add sections manually',
                icon: '📄',
                case: null,
                sections: [],
                metadata: {
                    description: '',
                    tags: []
                }
            },
            'example-feature-spec': {
                name: 'Example Feature Spec',
                description: 'A sample project with example content to learn from',
                icon: '📚',
                case: 1,
                sections: [
                    {
                        sectionId: 'research',
                        sectionName: 'Research and Documentation Scanning',
                        input: 'Example: Analyze the login flow in the existing application...',
                        output: 'Example output showing research findings...',
                        status: 'complete'
                    },
                    {
                        sectionId: 'feature-extraction',
                        sectionName: 'Feature Extraction',
                        input: '',
                        output: '',
                        status: 'in_progress'
                    }
                ],
                metadata: {
                    description: 'An example project demonstrating how to use the feature specification system',
                    tags: ['example', 'tutorial']
                }
            },
            'quick-start-guide': {
                name: 'Quick Start Guide',
                description: 'A tutorial project with step-by-step instructions',
                icon: '🚀',
                case: 1,
                sections: [
                    {
                        sectionId: 'research',
                        sectionName: 'Research and Documentation Scanning',
                        input: 'Welcome! This is your first section. Start by describing what you want to analyze or build.',
                        output: '',
                        status: 'not_started',
                        notes: 'This is a tutorial project. Follow the instructions in each section to learn how to use the system.'
                    }
                ],
                metadata: {
                    description: 'Interactive tutorial to help you get started',
                    tags: ['tutorial', 'beginner']
                }
            }
        };
    }
    
    /**
     * Get all available templates
     * @returns {Array} Array of template objects with id, name, description, icon
     */
    getAllTemplates() {
        return Object.entries(this.templates).map(([id, template]) => ({
            id,
            name: template.name,
            description: template.description,
            icon: template.icon,
            case: template.case
        }));
    }
    
    /**
     * Get template by ID
     * @param {string} templateId - Template ID
     * @returns {Object|null} Template object or null
     */
    getTemplate(templateId) {
        return this.templates[templateId] || null;
    }
    
    /**
     * Load template data for project creation
     * @param {string} templateId - Template ID
     * @param {string} projectName - Project name to use
     * @param {string} projectDescription - Project description
     * @returns {Object} Project data object ready for creation
     */
    loadTemplate(templateId, projectName, projectDescription = '') {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        
        // If template has a case, use it; otherwise use case 1 as default
        const caseNumber = template.case || 1;
        
        return {
            name: projectName,
            description: projectDescription || template.metadata.description || '',
            case: caseNumber,
            caseChain: null,
            customWorkflow: false,
            automationEngine: 'file-watching',
            sections: template.sections.map(section => ({
                ...section,
                automationId: this._generateAutomationId(),
                validationStatus: null,
                prompt: '',
                dependencies: section.dependencies || [],
                modifiers: section.modifiers || [],
                overrideInstructions: '',
                isProcessStep: false,
                isInferenceStep: false,
                processStepType: null,
                specialized: null,
                lastModified: Date.now()
            })),
            metadata: {
                ...template.metadata,
                templateId: templateId,
                createdAt: new Date().toISOString()
            }
        };
    }
    
    /**
     * Generate a unique 4-character alphanumeric ID
     * @private
     * @returns {string} Unique ID
     */
    _generateAutomationId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < 4; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    }
    
    /**
     * Get templates for a specific case
     * @param {number} caseNumber - Case number
     * @returns {Array} Array of template objects matching the case
     */
    getTemplatesForCase(caseNumber) {
        return this.getAllTemplates().filter(t => t.case === caseNumber || t.case === null);
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.ProjectTemplates = ProjectTemplates;
}
