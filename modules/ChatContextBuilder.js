// ChatContextBuilder - Building context from scope directory files and project data
// Uses FileContextReader, PathUtils, and StateManager

import { listScopeFiles, readScopeFiles, filterTextFiles, aggregateContext } from './utils/FileContextReader.js';
import { normalize, validate } from './utils/PathUtils.js';

/**
 * ChatContextBuilder - Builds context for chat prompts
 */
export class ChatContextBuilder {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }
    
    /**
     * Builds context for a chat instance
     * @param {string} chatId - The chat ID
     * @param {object} chatInstance - The chat instance
     * @returns {Promise<string>} Context string
     */
    async buildContext(chatId, chatInstance) {
        if (!chatInstance) {
            return '';
        }
        
        const contextParts = [];
        
        // Add project context if linked
        if (chatInstance.projectId) {
            const projectContext = this.getProjectContext(chatInstance.projectId);
            if (projectContext) {
                contextParts.push(projectContext);
            }
        }
        
        // Add scope directory file context
        if (chatInstance.scopeDirectory) {
            const scopeContext = await this.getScopeFileContext(chatInstance.scopeDirectory);
            if (scopeContext) {
                contextParts.push(scopeContext);
            }
        }
        
        return contextParts.join('\n\n');
    }
    
    /**
     * Gets project context information
     * @param {string} projectId - The project ID
     * @returns {string|null} Project context string or null
     */
    getProjectContext(projectId) {
        if (!projectId || !this.stateManager) {
            return null;
        }
        
        const state = this.stateManager.getState();
        const project = state.projects.find(p => p.id === projectId);
        
        if (!project) {
            return null;
        }
        
        const contextParts = [];
        contextParts.push(`=== Project: ${project.name} ===`);
        if (project.description) {
            contextParts.push(`Description: ${project.description}`);
        }
        contextParts.push(`Case: ${project.case}`);
        contextParts.push(`Status: ${project.status}`);
        contextParts.push(`Automation Engine: ${project.automationEngine || 'file-watching'}`);
        
        if (project.automationDirectory) {
            contextParts.push(`Automation Directory: ${project.automationDirectory}`);
        }
        
        if (project.scopeDirectory) {
            contextParts.push(`Scope Directory: ${project.scopeDirectory}`);
        }
        
        // Add section summaries
        if (project.sections && project.sections.length > 0) {
            contextParts.push('\n=== Pipeline Sections ===');
            project.sections.forEach(section => {
                contextParts.push(`- ${section.sectionName} (${section.stepName}): ${section.status}`);
                if (section.output) {
                    const preview = section.output.substring(0, 200);
                    contextParts.push(`  Output preview: ${preview}${section.output.length > 200 ? '...' : ''}`);
                }
            });
        }
        
        return contextParts.join('\n');
    }
    
    /**
     * Gets context from scope directory files
     * @param {string} scopeDirectory - The scope directory path
     * @param {number} maxSize - Maximum context size in characters
     * @returns {Promise<string|null>} Context string or null
     */
    async getScopeFileContext(scopeDirectory, maxSize = 100000) {
        if (!scopeDirectory || !scopeDirectory.trim()) {
            return null;
        }
        
        const normalizedPath = normalize(scopeDirectory.trim());
        
        // Validate path (security check - ensure it's within project root)
        // Note: We'll rely on server-side validation, but normalize here
        const state = this.stateManager.getState();
        const projectRoot = window.PROJECT_ROOT || '/';
        
        try {
            // List files in scope directory
            const listResult = await listScopeFiles(normalizedPath);
            
            if (!listResult.success || !listResult.files || listResult.files.length === 0) {
                return null;
            }
            
            // Filter to text files only
            const textFiles = filterTextFiles(listResult.files);
            
            if (textFiles.length === 0) {
                return null;
            }
            
            // Read file contents
            const filePaths = textFiles.map(file => file.path);
            const readResult = await readScopeFiles(filePaths);
            
            if (!readResult.success || !readResult.files || readResult.files.length === 0) {
                return null;
            }
            
            // Aggregate context
            const context = aggregateContext(readResult.files, maxSize);
            
            if (!context) {
                return null;
            }
            
            return `=== Scope Directory Files (${normalizedPath}) ===\n${context}`;
        } catch (error) {
            console.warn('Failed to build scope file context:', error);
            return null;
        }
    }
    
    /**
     * Formats context from files and project data
     * @param {Array<{path: string, content: string}>} files - Array of file objects
     * @param {object} projectData - Project data object
     * @returns {string} Formatted context string
     */
    formatContext(files, projectData) {
        const parts = [];
        
        if (projectData) {
            parts.push(this.getProjectContext(projectData.id));
        }
        
        if (files && files.length > 0) {
            const fileContext = aggregateContext(files);
            if (fileContext) {
                parts.push(fileContext);
            }
        }
        
        return parts.filter(p => p).join('\n\n');
    }
}

