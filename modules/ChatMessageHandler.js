// ChatMessageHandler - Message sending/receiving via Cursor CLI, conversation flow
// Uses ChatContextBuilder and EventSystem

import { ChatContextBuilder } from './ChatContextBuilder.js';

/**
 * ChatMessageHandler - Handles sending messages to Cursor CLI and managing conversation flow
 */
export class ChatMessageHandler {
    constructor(contextBuilder, eventSystem) {
        this.contextBuilder = contextBuilder;
        this.eventSystem = eventSystem;
    }
    
    /**
     * Sends a message to Cursor CLI and returns the response
     * @param {string} chatId - The chat ID
     * @param {string} userMessage - The user's message
     * @param {object} chatInstance - The chat instance
     * @returns {Promise<object>} { success: boolean, content?: string, error?: string }
     */
    async sendMessage(chatId, userMessage, chatInstance) {
        if (!chatId || !userMessage || !chatInstance) {
            return { success: false, error: 'Chat ID, message, and instance are required' };
        }

        // Build prompt with context and history
        const prompt = await this.buildPrompt(chatId, userMessage, chatInstance);

        // Get scope directory from chat instance or project
        let scopeDirectory = chatInstance.scopeDirectory ||
                              (chatInstance.projectId ? this._getProjectScopeDirectory(chatInstance.projectId) : null);

        if (!scopeDirectory) {
            return { success: false, error: 'Scope directory is required' };
        }
        
        // Normalize the scope directory path (convert backslashes to forward slashes for consistency)
        scopeDirectory = scopeDirectory.trim().replace(/\\/g, '/');
        
        // Emit message sending event
        this.eventSystem.emit('chat:message:sending', {
            source: 'ChatMessageHandler',
            data: { chatId, message: userMessage }
        });

        try {
            // Call Cursor CLI API
            const response = await fetch('/api/cursor-cli-execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    scopeDirectory: scopeDirectory
                })
            });
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Failed to execute Cursor CLI');
            }
            
            const result = await response.json();
            
            if (!result.success) {
                return { success: false, error: result.error || 'Cursor CLI execution failed' };
            }
            
            const assistantMessage = result.output || result.stderr || 'No response';
            
            // Add messages to history
            this.addMessageToHistory(chatId, 'user', userMessage, chatInstance);
            this.addMessageToHistory(chatId, 'assistant', assistantMessage, chatInstance);
            
            // Emit message received event
            this.eventSystem.emit('chat:message:received', {
                source: 'ChatMessageHandler',
                data: { chatId, message: assistantMessage }
            });
            
            return { success: true, content: assistantMessage };
        } catch (error) {
            const errorMessage = error.message || 'Network error';
            
            // Emit error event
            this.eventSystem.emit('chat:message:error', {
                source: 'ChatMessageHandler',
                data: { chatId, error: errorMessage }
            });
            
            // Still add user message to history even on error
            this.addMessageToHistory(chatId, 'user', userMessage, chatInstance);
            
            return { success: false, error: errorMessage };
        }
    }
    
    /**
     * Builds a prompt with context and conversation history
     * @param {string} chatId - The chat ID
     * @param {string} userMessage - The user's message
     * @param {object} chatInstance - The chat instance
     * @returns {Promise<string>} Complete prompt string
     */
    async buildPrompt(chatId, userMessage, chatInstance) {
        const parts = [];
        
        // Add context from scope directory and project
        const context = await this.contextBuilder.buildContext(chatId, chatInstance);
        if (context) {
            parts.push('=== Context ===');
            parts.push(context);
            parts.push('');
        }
        
        // Add conversation history if enabled
        if (chatInstance.saveHistory && chatInstance.history && chatInstance.history.length > 0) {
            parts.push('=== Conversation History ===');
            chatInstance.history.forEach(msg => {
                const role = msg.role === 'user' ? 'User' : 'Assistant';
                parts.push(`${role}: ${msg.content}`);
            });
            parts.push('');
        }
        
        // Add current user message
        parts.push('=== Current Request ===');
        parts.push(`User: ${userMessage}`);
        parts.push('');
        parts.push('Please respond to the user\'s request based on the context and conversation history above.');
        
        return parts.join('\n');
    }
    
    /**
     * Adds a message to the chat history
     * @param {string} chatId - The chat ID
     * @param {string} role - Message role ('user' or 'assistant')
     * @param {string} content - Message content
     * @param {object} chatInstance - The chat instance (will be modified)
     */
    addMessageToHistory(chatId, role, content, chatInstance) {
        if (!chatInstance) return;
        
        if (!chatInstance.history) {
            chatInstance.history = [];
        }
        
        const message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: role,
            content: content,
            timestamp: Date.now()
        };
        
        chatInstance.history.push(message);
        chatInstance.lastMessageTime = Date.now();
        
        // Emit history updated event
        this.eventSystem.emit('chat:history:updated', {
            source: 'ChatMessageHandler',
            data: { chatId, message }
        });
    }
    
    /**
     * Gets project scope directory from state manager
     * @private
     * @param {string} projectId - The project ID
     * @returns {string|null} Scope directory or null
     */
    _getProjectScopeDirectory(projectId) {
        if (!this.contextBuilder || !this.contextBuilder.stateManager) {
            return null;
        }
        
        const state = this.contextBuilder.stateManager.getState();
        const project = state.projects.find(p => p.id === projectId);
        return project ? project.scopeDirectory : null;
    }
}

