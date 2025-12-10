// ChatSystem - Chat instance lifecycle management, state coordination
// Coordinates between storage, message handler, and UI

import { ChatStorage } from './ChatStorage.js';
import { ChatMessageHandler } from './ChatMessageHandler.js';
import { ChatContextBuilder } from './ChatContextBuilder.js';

/**
 * ChatSystem - Core chat system managing chat instances
 */
export class ChatSystem {
    constructor(eventSystem, stateManager) {
        this.eventSystem = eventSystem;
        this.stateManager = stateManager;
        this.chats = new Map(); // chatId -> chatInstance
        
        // Initialize dependencies
        this.storage = new ChatStorage();
        this.contextBuilder = new ChatContextBuilder(stateManager);
        this.messageHandler = new ChatMessageHandler(this.contextBuilder, eventSystem);
        
        // Load existing chats
        this.loadAllChats();
        
        // Register event handlers
        this._setupEventHandlers();
    }
    
    /**
     * Creates a new chat instance
     * @param {object} options - Chat options
     * @param {string} options.name - Chat name (optional, will be auto-generated)
     * @param {string} options.scopeDirectory - Scope directory path
     * @param {string} options.projectId - Linked project ID (optional)
     * @param {boolean} options.saveHistory - Whether to save history (default: true)
     * @returns {string} The created chat ID
     */
    createChat(options = {}) {
        const chatId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();
        
        const chatInstance = {
            id: chatId,
            name: options.name || this._generateChatName(),
            scopeDirectory: options.scopeDirectory || null,
            projectId: options.projectId || null,
            saveHistory: options.saveHistory !== false, // Default to true
            maxHeight: options.maxHeight || null, // Default to null (use CSS default)
            history: [],
            createdAt: now,
            lastMessageTime: null,
            lastModified: now
        };
        
        this.chats.set(chatId, chatInstance);
        
        // Save to storage if history saving is enabled
        if (chatInstance.saveHistory) {
            this.storage.saveChat(chatId, chatInstance);
        }
        
        // Emit event
        this.eventSystem.emit('chat:created', {
            source: 'ChatSystem',
            data: { chatId, chatInstance }
        });
        
        return chatId;
    }
    
    /**
     * Deletes a chat instance
     * @param {string} chatId - The chat ID
     * @returns {boolean} True if deleted successfully
     */
    deleteChat(chatId) {
        if (!this.chats.has(chatId)) {
            return false;
        }
        
        this.chats.delete(chatId);
        this.storage.deleteChat(chatId);
        
        // Emit event
        this.eventSystem.emit('chat:deleted', {
            source: 'ChatSystem',
            data: { chatId }
        });
        
        return true;
    }
    
    /**
     * Gets a chat instance
     * @param {string} chatId - The chat ID
     * @returns {object|null} The chat instance or null
     */
    getChat(chatId) {
        return this.chats.get(chatId) || null;
    }
    
    /**
     * Gets all chat instances
     * @returns {Array<object>} Array of chat instances
     */
    getAllChats() {
        return Array.from(this.chats.values());
    }
    
    /**
     * Renames a chat
     * @param {string} chatId - The chat ID
     * @param {string} newName - New chat name
     * @returns {boolean} True if renamed successfully
     */
    renameChat(chatId, newName) {
        const chat = this.chats.get(chatId);
        if (!chat || !newName || !newName.trim()) {
            return false;
        }
        
        chat.name = newName.trim();
        chat.lastModified = Date.now();
        
        // Save to storage
        if (chat.saveHistory) {
            this.storage.saveChat(chatId, chat);
        }
        
        // Emit event
        this.eventSystem.emit('chat:renamed', {
            source: 'ChatSystem',
            data: { chatId, newName: chat.name }
        });
        
        return true;
    }
    
    /**
     * Sets the scope directory for a chat
     * @param {string} chatId - The chat ID
     * @param {string} scopeDirectory - Scope directory path
     * @returns {boolean} True if set successfully
     */
    setScopeDirectory(chatId, scopeDirectory) {
        const chat = this.chats.get(chatId);
        if (!chat) {
            return false;
        }
        
        chat.scopeDirectory = scopeDirectory ? scopeDirectory.trim() : null;
        chat.lastModified = Date.now();
        
        // Save to storage
        if (chat.saveHistory) {
            this.storage.saveChat(chatId, chat);
        }
        
        // Emit event
        this.eventSystem.emit('chat:scope:updated', {
            source: 'ChatSystem',
            data: { chatId, scopeDirectory: chat.scopeDirectory }
        });
        
        return true;
    }
    
    /**
     * Sets whether to save history for a chat
     * @param {string} chatId - The chat ID
     * @param {boolean} saveHistory - Whether to save history
     * @returns {boolean} True if set successfully
     */
    setSaveHistory(chatId, saveHistory) {
        const chat = this.chats.get(chatId);
        if (!chat) {
            return false;
        }
        
        chat.saveHistory = saveHistory;
        chat.lastModified = Date.now();
        
        // Save or remove from storage based on setting
        if (saveHistory) {
            this.storage.saveChat(chatId, chat);
        } else {
            // Clear history but keep chat instance
            chat.history = [];
            this.storage.deleteChat(chatId);
        }
        
        // Emit event
        this.eventSystem.emit('chat:settings:updated', {
            source: 'ChatSystem',
            data: { chatId, saveHistory }
        });
        
        return true;
    }
    
    /**
     * Sets the max height for a chat window
     * @param {string} chatId - The chat ID
     * @param {number|null} maxHeight - Max height in pixels (null for default)
     * @returns {boolean} True if set successfully
     */
    setMaxHeight(chatId, maxHeight) {
        const chat = this.chats.get(chatId);
        if (!chat) {
            return false;
        }
        
        // Validate maxHeight if provided
        if (maxHeight !== null && maxHeight !== undefined) {
            const height = parseInt(maxHeight, 10);
            if (isNaN(height) || height < 300 || height > 2000) {
                return false;
            }
            chat.maxHeight = height;
        } else {
            chat.maxHeight = null;
        }
        
        chat.lastModified = Date.now();
        
        // Save to storage
        if (chat.saveHistory) {
            this.storage.saveChat(chatId, chat);
        }
        
        // Emit event
        this.eventSystem.emit('chat:maxHeight:updated', {
            source: 'ChatSystem',
            data: { chatId, maxHeight: chat.maxHeight }
        });
        
        return true;
    }
    
    /**
     * Clears chat history
     * @param {string} chatId - The chat ID
     * @returns {boolean} True if cleared successfully
     */
    clearHistory(chatId) {
        const chat = this.chats.get(chatId);
        if (!chat) {
            return false;
        }
        
        chat.history = [];
        chat.lastModified = Date.now();
        
        // Save to storage
        if (chat.saveHistory) {
            this.storage.saveChat(chatId, chat);
        }
        
        // Emit event
        this.eventSystem.emit('chat:history:cleared', {
            source: 'ChatSystem',
            data: { chatId }
        });
        
        return true;
    }
    
    /**
     * Sends a message in a chat
     * @param {string} chatId - The chat ID
     * @param {string} message - The message content
     * @returns {Promise<object>} { success: boolean, content?: string, error?: string }
     */
    async sendMessage(chatId, message) {
        const chat = this.chats.get(chatId);
        if (!chat) {
            return { success: false, error: 'Chat not found' };
        }

        if (!message || !message.trim()) {
            return { success: false, error: 'Message is required' };
        }

        // Send message via message handler
        const result = await this.messageHandler.sendMessage(chatId, message.trim(), chat);
        
        // Update chat instance
        if (result.success) {
            chat.lastMessageTime = Date.now();
            chat.lastModified = Date.now();
            
            // Save to storage if history saving is enabled
            if (chat.saveHistory) {
                this.storage.saveChat(chatId, chat);
            }
        }
        
        return result;
    }
    
    /**
     * Loads all chats from storage
     * @private
     */
    loadAllChats() {
        const chatInstances = this.storage.getAllChatInstances();
        
        for (const chat of chatInstances) {
            this.chats.set(chat.id, chat);
        }
        
        // Emit loaded event
        this.eventSystem.emit('chat:loaded', {
            source: 'ChatSystem',
            data: { count: chatInstances.length }
        });
    }
    
    /**
     * Sets up event handlers
     * @private
     */
    _setupEventHandlers() {
        // Listen for project scope directory changes
        this.eventSystem.register('project:scopeDirectory:changed', (event) => {
            const { projectId, scopeDirectory } = event.data;
            
            // Update all chats linked to this project
            for (const [chatId, chat] of this.chats.entries()) {
                if (chat.projectId === projectId && !chat.scopeDirectory) {
                    this.setScopeDirectory(chatId, scopeDirectory);
                }
            }
        });
    }
    
    /**
     * Generates an auto name for a chat
     * @private
     * @returns {string} Generated chat name
     */
    _generateChatName() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        return `Chat ${timeStr}`;
    }
}

