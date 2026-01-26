// Client-side Project Group Validator
// Provides basic structure validation (full schema validation done server-side)
// This provides immediate feedback before sending to server

class ProjectGroupValidator {
    /**
     * Validate project group structure (basic validation)
     * Full schema validation is done server-side with ajv
     * @param {object} data - Project group data to validate
     * @returns {object} Validation result with success flag and errors
     */
    validateProjectGroup(data) {
        const errors = [];
        
        if (!data || typeof data !== 'object') {
            return {
                success: false,
                errors: [{ message: 'Data must be an object' }],
                message: 'Invalid data format: must be an object'
            };
        }
        
        // Check for at least one of projects or pages
        if (!data.projects && !data.pages) {
            errors.push({
                message: 'File must contain either "projects" or "pages" array',
                path: 'root'
            });
        }
        
        // Validate projects array if present
        if (data.projects) {
            if (!Array.isArray(data.projects)) {
                errors.push({
                    message: '"projects" must be an array',
                    path: 'projects'
                });
            } else {
                data.projects.forEach((project, index) => {
                    if (!project || typeof project !== 'object') {
                        errors.push({
                            message: `Project at index ${index} must be an object`,
                            path: `projects[${index}]`
                        });
                        return;
                    }
                    
                    if (!project.id || typeof project.id !== 'string') {
                        errors.push({
                            message: `Project at index ${index} must have a string "id"`,
                            path: `projects[${index}].id`
                        });
                    }
                    
                    if (!project.name || typeof project.name !== 'string') {
                        errors.push({
                            message: `Project at index ${index} must have a string "name"`,
                            path: `projects[${index}].name`
                        });
                    }
                    
                    if (!Array.isArray(project.sections)) {
                        errors.push({
                            message: `Project at index ${index} must have a "sections" array`,
                            path: `projects[${index}].sections`
                        });
                    } else {
                        project.sections.forEach((section, secIndex) => {
                            if (!section || typeof section !== 'object') {
                                errors.push({
                                    message: `Section at index ${secIndex} in project ${index} must be an object`,
                                    path: `projects[${index}].sections[${secIndex}]`
                                });
                                return;
                            }
                            
                            if (!section.sectionId || typeof section.sectionId !== 'string') {
                                errors.push({
                                    message: `Section at index ${secIndex} in project ${index} must have a string "sectionId"`,
                                    path: `projects[${index}].sections[${secIndex}].sectionId`
                                });
                            }
                            
                            if (!section.sectionName || typeof section.sectionName !== 'string') {
                                errors.push({
                                    message: `Section at index ${secIndex} in project ${index} must have a string "sectionName"`,
                                    path: `projects[${index}].sections[${secIndex}].sectionName`
                                });
                            }
                            
                            if (!section.status || typeof section.status !== 'string') {
                                errors.push({
                                    message: `Section at index ${secIndex} in project ${index} must have a string "status"`,
                                    path: `projects[${index}].sections[${secIndex}].status`
                                });
                            }
                        });
                    }
                });
            }
        }
        
        // Validate pages array if present (old format)
        if (data.pages) {
            if (!Array.isArray(data.pages)) {
                errors.push({
                    message: '"pages" must be an array',
                    path: 'pages'
                });
            } else {
                data.pages.forEach((page, index) => {
                    if (!page || typeof page !== 'object') {
                        errors.push({
                            message: `Page at index ${index} must be an object`,
                            path: `pages[${index}]`
                        });
                        return;
                    }
                    
                    if (!page.id || typeof page.id !== 'string') {
                        errors.push({
                            message: `Page at index ${index} must have a string "id"`,
                            path: `pages[${index}].id`
                        });
                    }
                    
                    if (!page.name || typeof page.name !== 'string') {
                        errors.push({
                            message: `Page at index ${index} must have a string "name"`,
                            path: `pages[${index}].name`
                        });
                    }
                });
            }
        }
        
        if (errors.length > 0) {
            return {
                success: false,
                errors: errors,
                message: errors.map(e => `${e.path}: ${e.message}`).join('; ')
            };
        }
        
        return { success: true };
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.ProjectGroupValidator = ProjectGroupValidator;
}

// Export for ES modules (if imported)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectGroupValidator;
}
