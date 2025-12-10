// ChatStorage - Persistence layer for chat history and settings
// Uses StorageUtils for localStorage operations

import { save, load, remove, getAllKeys, clear } from './utils/StorageUtils.js';

const STORAGE_PREFIX = 'chat_';
const CHAT_LIST_KEY = 'chat_list';

/**
 * ChatStorage - Manages persistence of chat instances
 */
export class ChatStorage {
    constructor() {
        // No dependencies - pure storage layer
    }
    
    /**
     * Gets the storage key for a chat instance
     * @param {string} chatId - The chat ID
     * @returns {string} Storage key
     */
    getStorageKey(chatId) {
        return `${STORAGE_PREFIX}${chatId}`;
    }
    
    /**
     * Saves a chat instance to localStorage
     * @param {string} chatId - The chat ID
     * @param {object} chatInstance - The chat instance object
     * @returns {object} { success: boolean, error?: string }
     */
    saveChat(chatId, chatInstance) {
        if (!chatId || !chatInstance) {
            return { success: false, error: 'Chat ID and instance are required' };
        }
        
        const key = this.getStorageKey(chatId);
        const result = save(key, chatInstance);
        
        if (result.success) {
            // Update chat list
            this._updateChatList(chatId);
        }
        
        return result;
    }
    
    /**
     * Loads a chat instance from localStorage
     * @param {string} chatId - The chat ID
     * @returns {object|null} The chat instance or null if not found
     */
    loadChat(chatId) {
        if (!chatId) {
            return null;
        }
        
        const key = this.getStorageKey(chatId);
        return load(key, null);
    }
    
    /**
     * Deletes a chat instance from localStorage
     * @param {string} chatId - The chat ID
     * @returns {object} { success: boolean, error?: string }
     */
    deleteChat(chatId) {
        if (!chatId) {
            return { success: false, error: 'Chat ID is required' };
        }
        
        const key = this.getStorageKey(chatId);
        const result = remove(key);
        
        if (result.success) {
            // Update chat list
            this._removeFromChatList(chatId);
        }
        
        return result;
    }
    
    /**
     * Saves all chat instances (updates chat list)
     * @param {Array<string>} chatIds - Array of chat IDs
     * @returns {object} { success: boolean, error?: string }
     */
    saveAllChats(chatIds) {
        if (!Array.isArray(chatIds)) {
            return { success: false, error: 'Chat IDs must be an array' };
        }
        
        const result = save(CHAT_LIST_KEY, chatIds);
        return result;
    }
    
    /**
     * Loads all chat IDs from localStorage
     * @returns {Array<string>} Array of chat IDs
     */
    loadAllChats() {
        const chatIds = load(CHAT_LIST_KEY, []);
        return Array.isArray(chatIds) ? chatIds : [];
    }
    
    /**
     * Gets all chat instances
     * @returns {Array<object>} Array of chat instances
     */
    getAllChatInstances() {
        const chatIds = this.loadAllChats();
        const chats = [];
        
        for (const chatId of chatIds) {
            const chat = this.loadChat(chatId);
            if (chat) {
                chats.push(chat);
            }
        }
        
        return chats;
    }
    
    /**
     * Clears all chat data (for testing/cleanup)
     * @returns {object} { success: boolean, count: number, error?: string }
     */
    clearAllChats() {
        const result = clear(STORAGE_PREFIX);
        const listResult = remove(CHAT_LIST_KEY);
        
        return {
            success: result.success && listResult.success,
            count: result.count || 0,
            error: result.error || listResult.error
        };
    }
    
    /**
     * Updates the chat list to include a chat ID
     * @private
     * @param {string} chatId - The chat ID to add
     */
    _updateChatList(chatId) {
        const chatIds = this.loadAllChats();
        if (!chatIds.includes(chatId)) {
            chatIds.push(chatId);
            save(CHAT_LIST_KEY, chatIds);
        }
    }
    
    /**
     * Removes a chat ID from the chat list
     * @private
     * @param {string} chatId - The chat ID to remove
     */
    _removeFromChatList(chatId) {
        const chatIds = this.loadAllChats();
        const index = chatIds.indexOf(chatId);
        if (index > -1) {
            chatIds.splice(index, 1);
            save(CHAT_LIST_KEY, chatIds);
        }
    }
}

