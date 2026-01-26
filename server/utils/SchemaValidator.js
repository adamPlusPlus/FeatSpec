// Schema Validator - Validates project group files using JSON Schema
const Ajv = require('ajv');
const projectGroupSchema = require('./ProjectGroupSchema');

class SchemaValidator {
    constructor() {
        this.ajv = new Ajv({ 
            allErrors: true, 
            strict: false,
            validateSchema: false // Don't validate the schema itself
        });
        this.validate = this.ajv.compile(projectGroupSchema);
    }
    
    /**
     * Validate project group data against schema
     * @param {object} data - Project group data to validate
     * @returns {object} Validation result with success flag and errors
     */
    validateProjectGroup(data) {
        if (!data || typeof data !== 'object') {
            return {
                success: false,
                errors: [{ message: 'Data must be an object' }],
                message: 'Invalid data format: must be an object'
            };
        }
        
        const valid = this.validate(data);
        
        if (!valid) {
            return {
                success: false,
                errors: this.validate.errors || [],
                message: this.ajv.errorsText(this.validate.errors, { separator: '; ' })
            };
        }
        
        // Additional validation: ensure at least one of projects or pages exists
        if (!data.projects && !data.pages) {
            return {
                success: false,
                errors: [{ 
                    message: 'File must contain either "projects" or "pages" array',
                    instancePath: '',
                    schemaPath: '#/anyOf'
                }],
                message: 'File must contain either "projects" or "pages" array'
            };
        }
        
        return { success: true };
    }
    
    /**
     * Get formatted error message from validation errors
     * @param {array} errors - Validation errors array
     * @returns {string} Formatted error message
     */
    formatErrors(errors) {
        if (!errors || errors.length === 0) {
            return 'Validation failed';
        }
        
        return errors.map(err => {
            const path = err.instancePath || err.dataPath || 'root';
            const message = err.message || 'Invalid value';
            return `${path}: ${message}`;
        }).join('; ');
    }
}

module.exports = SchemaValidator;
