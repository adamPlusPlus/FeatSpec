// File Operations Manager - Handles file import/export operations
class FileOperations {
    constructor(stateManager, eventSystem, dataLayer, renderingEngine, errorHandler = null) {
        this.stateManager = stateManager;
        this.eventSystem = eventSystem;
        this.dataLayer = dataLayer;
        this.renderingEngine = renderingEngine;
        this.errorHandler = errorHandler;
        
        // Callbacks for methods that need app-level access
        this.parseStructuredOutputsCallback = null;
    }
    
    /**
     * Set callbacks for methods that need app-level access
     */
    setCallbacks(callbacks) {
        if (callbacks.parseStructuredOutputs) {
            this.parseStructuredOutputsCallback = callbacks.parseStructuredOutputs;
        }
    }
    
    /**
     * Export a single project
     */
    async exportProject(projectId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) {
            alert('No project selected');
            return;
        }
        
        const filename = `${project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        await this.dataLayer.exportToFile(project, filename);
    }
    
    /**
     * Import a project from file
     */
    async importProject(file) {
        try {
            const content = await this.dataLayer.getFileInterface().readFile(file);
            const project = JSON.parse(content);
            
            // Validate project structure
            if (!project.id || !project.name || !Array.isArray(project.sections)) {
                const error = 'Invalid project format';
                if (this.errorHandler) {
                    this.errorHandler.showUserNotification(error, {
                        source: 'FileOperations',
                        operation: 'importProject'
                    }, {
                        severity: ErrorHandler.Severity.ERROR,
                        title: 'Import Failed'
                    });
                    throw new Error(error);
                } else {
                    throw new Error(error);
                }
            }
            
            // Add project to state
            const state = this.stateManager.getState();
            const projects = [...state.projects, project];
            this.stateManager.setState({ projects });
            this.stateManager.setActiveProject(project.id);
            this.renderingEngine.renderAll();
        } catch (err) {
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(err, {
                    source: 'FileOperations',
                    operation: 'importProject'
                }, {
                    severity: ErrorHandler.Severity.ERROR,
                    title: 'Import Failed'
                });
            } else {
                alert('Failed to import project: ' + err.message);
            }
        }
    }
    
    /**
     * Export final specification
     */
    async exportFinalSpec(projectId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) {
            alert('No project selected');
            return;
        }
        
        const section3 = project.sections.find(s => s.sectionId === '3');
        if (!section3 || !section3.output) {
            alert('Section 3 (Final Document Assembly) is not complete');
            return;
        }
        
        // Export as markdown
        const blob = new Blob([section3.output], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_final_specification.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    /**
     * Export structured outputs from Case 4 project
     */
    async exportStructuredOutputs(projectId) {
        const project = this.stateManager.getProject(projectId);
        if (!project) {
            const error = 'No project selected';
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(error, {
                    source: 'FileOperations',
                    operation: 'exportStructuredOutputs',
                    projectId
                }, {
                    severity: ErrorHandler.Severity.WARNING,
                    title: 'Export Failed'
                });
            } else {
                alert(error);
            }
            return;
        }
        
        // Check if output-mapping step is complete
        const outputMappingSection = project.sections.find(s => s.sectionId === 'output-mapping');
        if (!outputMappingSection || outputMappingSection.status !== 'complete') {
            const error = 'Please complete the Output Mapping step first to generate structured outputs.';
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(error, {
                    source: 'FileOperations',
                    operation: 'exportStructuredOutputs',
                    projectId
                }, {
                    severity: ErrorHandler.Severity.WARNING,
                    title: 'Export Failed'
                });
            } else {
                alert(error);
            }
            return;
        }
        
        // Parse the output mapping to get file associations
        const mapping = outputMappingSection.output;
        
        // Extract structured outputs from input-structuring step
        const structuringSection = project.sections.find(s => s.sectionId === 'input-structuring');
        if (!structuringSection || !structuringSection.output) {
            const error = 'Please complete the Input Structuring step first.';
            if (this.errorHandler) {
                this.errorHandler.showUserNotification(error, {
                    source: 'FileOperations',
                    operation: 'exportStructuredOutputs',
                    projectId
                }, {
                    severity: ErrorHandler.Severity.WARNING,
                    title: 'Export Failed'
                });
            } else {
                alert(error);
            }
            return;
        }
        
        // Parse structured outputs from the structuring step output
        const parseMethod = this.parseStructuredOutputsCallback || this.parseStructuredOutputs.bind(this);
        const structuredOutputs = parseMethod(structuringSection.output);
        
        // Create a zip or individual files
        const timestamp = new Date().toISOString().split('T')[0];
        const projectName = project.name.replace(/[^a-z0-9]/gi, '_');
        
        // Export each structured output as a separate file
        for (const [stepName, content] of Object.entries(structuredOutputs)) {
            const filename = `${projectName}_${stepName}_${timestamp}.json`;
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        // Also export the mapping file
        const mappingFilename = `${projectName}_output-mapping_${timestamp}.md`;
        const mappingBlob = new Blob([mapping], { type: 'text/markdown' });
        const mappingUrl = URL.createObjectURL(mappingBlob);
        const mappingA = document.createElement('a');
        mappingA.href = mappingUrl;
        mappingA.download = mappingFilename;
        document.body.appendChild(mappingA);
        mappingA.click();
        document.body.removeChild(mappingA);
        URL.revokeObjectURL(mappingUrl);
        
        alert(`Exported ${Object.keys(structuredOutputs).length} structured output file(s) and mapping file.`);
    }
    
    /**
     * Parse JSON content with error handling
     * @private
     * @returns {string} Pretty-printed JSON or raw content if parsing fails
     */
    _parseJsonContent(jsonContent) {
        try {
            const parsed = JSON.parse(jsonContent);
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            // If parsing fails, use raw content
            return jsonContent;
        }
    }
    
    /**
     * Parse Pattern 1: ### For [step-name] Step followed by ```json
     * @private
     */
    _parsePattern1(outputText, outputs) {
        const jsonBlockRegex = /### For (\w+(?:-\w+)*) Step\s*```json\s*([\s\S]*?)\s*```/g;
        let match;
        
        while ((match = jsonBlockRegex.exec(outputText)) !== null) {
            const stepName = match[1];
            const jsonContent = match[2].trim();
            outputs[stepName] = this._parseJsonContent(jsonContent);
        }
    }
    
    /**
     * Parse Pattern 2: ### For [step-name] Step (without "Step" in header)
     * @private
     */
    _parsePattern2(outputText, outputs) {
        const jsonBlockRegex = /### For (\w+(?:-\w+)*)\s*```json\s*([\s\S]*?)\s*```/g;
        let match;
        
        while ((match = jsonBlockRegex.exec(outputText)) !== null) {
            const stepName = match[1];
            if (!outputs[stepName]) { // Don't overwrite if already found
                const jsonContent = match[2].trim();
                outputs[stepName] = this._parseJsonContent(jsonContent);
            }
        }
    }
    
    /**
     * Parse Pattern 3: Any JSON code block with a heading above it
     * @private
     */
    _parsePattern3(outputText, outputs) {
        const jsonBlockRegex = /###\s+(\w+(?:\s+\w+)*)\s*[\s\S]*?```json\s*([\s\S]*?)\s*```/g;
        let match;
        const stepNames = ['research', 'feature-extraction', 'app-analysis', 'decomposition', 'atomic-features', 'ux-specification'];
        
        while ((match = jsonBlockRegex.exec(outputText)) !== null) {
            const heading = match[1].toLowerCase().replace(/\s+/g, '-');
            // Try to match to known step names
            const matchedStep = stepNames.find(s => heading.includes(s.replace('-', '')));
            
            if (matchedStep && !outputs[matchedStep]) {
                const jsonContent = match[2].trim();
                outputs[matchedStep] = this._parseJsonContent(jsonContent);
            }
        }
    }
    
    /**
     * Parse structured outputs from input-structuring step output
     */
    parseStructuredOutputs(outputText) {
        const outputs = {};
        
        // Look for JSON code blocks with step names - multiple patterns
        this._parsePattern1(outputText, outputs);
        this._parsePattern2(outputText, outputs);
        this._parsePattern3(outputText, outputs);
        
        return outputs;
    }
}
