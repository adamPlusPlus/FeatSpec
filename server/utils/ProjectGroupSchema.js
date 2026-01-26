// JSON Schema for Project Group Files
// Supports both new format (projects) and old format (pages) for backward compatibility

const projectGroupSchema = {
    type: 'object',
    required: [],
    properties: {
        projects: {
            type: 'array',
            items: {
                type: 'object',
                required: ['id', 'name', 'sections'],
                properties: {
                    id: { type: 'string', minLength: 1 },
                    name: { type: 'string', minLength: 1 },
                    description: { type: 'string' },
                    case: { type: 'integer', minimum: 1, maximum: 4 },
                    caseChain: { 
                        type: ['object', 'null'],
                        properties: {
                            previousCase: { type: 'integer', minimum: 1, maximum: 4 },
                            enhancedFrom: { type: 'string' }
                        }
                    },
                    customWorkflow: { type: 'boolean' },
                    workflowType: { type: 'string' },
                    automationEngine: { type: 'string' },
                    automationDirectory: { type: ['string', 'null'] },
                    scopeDirectory: { type: ['string', 'null'] },
                    status: { type: 'string' },
                    sections: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: ['sectionId', 'sectionName', 'status'],
                            properties: {
                                sectionId: { type: 'string', minLength: 1 },
                                sectionName: { type: 'string' },
                                stepName: { type: 'string' },
                                automationId: { type: 'string' },
                                status: { type: 'string' },
                                validationStatus: { type: ['string', 'null'] },
                                prompt: { type: 'string' },
                                input: { type: 'string' },
                                output: { type: 'string' },
                                dependencies: { 
                                    type: 'array',
                                    items: { type: 'string' }
                                },
                                modifiers: {
                                    type: 'array',
                                    items: { type: 'string' }
                                },
                                notes: { type: 'string' },
                                overrideInstructions: { type: 'string' },
                                isProcessStep: { type: 'boolean' },
                                isInferenceStep: { type: 'boolean' },
                                processStepType: { type: ['string', 'null'] },
                                specialized: { type: ['string', 'null'] },
                                lastModified: { type: 'string' }
                            },
                            additionalProperties: true // Allow extra fields for flexibility
                        }
                    },
                    createdAt: { type: 'string' },
                    lastModified: { type: 'string' }
                },
                additionalProperties: true // Allow extra fields for flexibility
            }
        },
        pages: {
            type: 'array',
            items: {
                type: 'object',
                required: ['id', 'name'],
                properties: {
                    id: { type: 'string', minLength: 1 },
                    name: { type: 'string', minLength: 1 },
                    sections: {
                        type: 'array',
                        items: { type: 'object' }
                    }
                },
                additionalProperties: true
            }
        },
        metadata: {
            type: 'object',
            properties: {
                projectGroupName: { type: 'string' },
                lastModified: { type: 'string' },
                version: { type: 'string' },
                automationMode: { type: 'string' },
                scopeDirectory: { type: ['string', 'null'] }
            },
            additionalProperties: true
        },
        settings: {
            type: 'object',
            properties: {
                background: { type: 'string' },
                page: {
                    type: 'object',
                    properties: {
                        background: { type: 'string' },
                        margin: { type: 'string' },
                        padding: { type: 'string' },
                        borderRadius: { type: 'string' },
                        fontFamily: { type: 'string' },
                        fontSize: { type: 'string' },
                        opacity: { type: 'number' },
                        color: { type: 'string' },
                        titleFontSize: { type: 'string' },
                        titleColor: { type: 'string' },
                        titleMarginBottom: { type: 'string' }
                    },
                    additionalProperties: true
                },
                element: {
                    type: 'object',
                    additionalProperties: true
                },
                header: {
                    type: 'object',
                    additionalProperties: true
                },
                checkboxSize: { type: 'string' }
            },
            additionalProperties: true
        },
        paneStates: {
            type: 'object',
            properties: {
                projectsSidebar: { type: 'boolean' },
                mainContent: { type: 'boolean' },
                referencesPanel: { type: 'boolean' }
            },
            additionalProperties: true
        },
        activeProjectId: { type: ['string', 'null'] }
    },
    // At least one of projects or pages must exist
    anyOf: [
        { required: ['projects'] },
        { required: ['pages'] }
    ],
    additionalProperties: true // Allow extra root-level properties for flexibility
};

module.exports = projectGroupSchema;
