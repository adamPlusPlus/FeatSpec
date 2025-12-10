// ChatMessageList - Message list rendering, scrolling, message formatting
// Uses MessageFormatter and EventSystem

import { formatMessage, renderMarkdown } from '../utils/MessageFormatter.js';

/**
 * ChatMessageList - Manages the message list display
 */
export class ChatMessageList {
    constructor(eventSystem, containerElement) {
        this.eventSystem = eventSystem;
        this.containerElement = containerElement;
        this.messageListElement = null;
        this.messages = [];
        this.currentChatId = null;
        
        this._initialize();
    }
    
    /**
     * Initializes the message list element
     * @private
     */
    _initialize() {
        if (!this.containerElement) {
            console.warn('ChatMessageList: Container element not provided');
            return;
        }
        
        // Find or create message list element
        this.messageListElement = this.containerElement.querySelector('.chat-message-list');
        
        if (!this.messageListElement) {
            console.warn('ChatMessageList: Message list element not found');
            return;
        }
    }
    
    /**
     * Renders messages for a chat
     * @param {string} chatId - The chat ID
     * @param {Array} messages - Array of message objects
     */
    render(chatId, messages) {
        this.currentChatId = chatId;
        this.messages = messages || [];
        
        if (!this.messageListElement) {
            return;
        }
        
        // Clear existing messages
        this.messageListElement.innerHTML = '';
        
        // Render each message
        for (const message of this.messages) {
            this._renderMessage(message);
        }
        
        // Scroll to bottom
        this.scrollToBottom();
    }
    
    /**
     * Adds a message to the list
     * @param {string} role - Message role ('user' or 'assistant')
     * @param {string} content - Message content
     * @param {number} timestamp - Message timestamp
     */
    addMessage(role, content, timestamp) {
        if (!this.messageListElement) {
            return;
        }
        
        const message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: role,
            content: content,
            timestamp: timestamp || Date.now()
        };
        
        this.messages.push(message);
        this._renderMessage(message);
        this.scrollToBottom();
    }
    
    /**
     * Renders a single message
     * @private
     * @param {object} message - Message object
     */
    _renderMessage(message) {
        if (!this.messageListElement) {
            return;
        }
        
        const formatted = formatMessage(message.role, message.content, message.timestamp);
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message chat-message-${message.role}`;
        messageElement.dataset.messageId = message.id;
        
        const roleLabel = message.role === 'user' ? 'You' : 'Assistant';
        const timeStr = formatted.formattedTime || '';
        
        messageElement.innerHTML = `
            <div class="chat-message-header">
                <span class="chat-message-role">${roleLabel}</span>
                ${timeStr ? `<span class="chat-message-time">${timeStr}</span>` : ''}
            </div>
            <div class="chat-message-content">${formatted.html}</div>
        `;
        
        this.messageListElement.appendChild(messageElement);
    }
    
    /**
     * Shows a loading indicator
     */
    showLoading() {
        if (!this.messageListElement) {
            return;
        }
        
        // Remove existing loading indicator
        this.hideLoading();
        
        const loadingElement = document.createElement('div');
        loadingElement.className = 'chat-message chat-message-loading';
        loadingElement.id = 'chat-loading-indicator';
        loadingElement.innerHTML = `
            <div class="chat-message-header">
                <span class="chat-message-role">Assistant</span>
            </div>
            <div class="chat-message-content">
                <div class="chat-loading-spinner"></div>
                <span style="margin-left: 8px; color: #888;">Thinking...</span>
            </div>
        `;
        
        this.messageListElement.appendChild(loadingElement);
        this.scrollToBottom();
    }
    
    /**
     * Hides the loading indicator
     */
    hideLoading() {
        if (!this.messageListElement) {
            return;
        }
        
        const loadingElement = this.messageListElement.querySelector('#chat-loading-indicator');
        if (loadingElement) {
            loadingElement.remove();
        }
    }
    
    /**
     * Shows an error message
     * @param {string} error - Error message
     */
    showError(error) {
        if (!this.messageListElement) {
            return;
        }
        
        // Remove existing error message
        this.hideError();
        
        const errorElement = document.createElement('div');
        errorElement.className = 'chat-message chat-message-error';
        errorElement.id = 'chat-error-message';
        errorElement.innerHTML = `
            <div class="chat-message-header">
                <span class="chat-message-role" style="color: #ff5555;">Error</span>
            </div>
            <div class="chat-message-content" style="color: #ff5555;">
                ${this.escapeHtml(error)}
            </div>
        `;
        
        this.messageListElement.appendChild(errorElement);
        this.scrollToBottom();
    }
    
    /**
     * Hides the error message
     */
    hideError() {
        if (!this.messageListElement) {
            return;
        }
        
        const errorElement = this.messageListElement.querySelector('#chat-error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }
    
    /**
     * Escapes HTML special characters
     * @private
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Clears all messages
     */
    clear() {
        this.messages = [];
        if (this.messageListElement) {
            this.messageListElement.innerHTML = '';
        }
    }
    
    /**
     * Scrolls to the bottom of the message list
     */
    scrollToBottom() {
        if (this.messageListElement) {
            this.messageListElement.scrollTop = this.messageListElement.scrollHeight;
        }
    }
    
    /**
     * Scrolls to a specific message
     * @param {string} messageId - Message ID
     */
    scrollToMessage(messageId) {
        if (!this.messageListElement) {
            return;
        }
        
        const messageElement = this.messageListElement.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    /**
     * Updates a message's content
     * @param {string} messageId - Message ID
     * @param {string} content - New content
     */
    updateMessage(messageId, content) {
        if (!this.messageListElement) {
            return;
        }
        
        const messageElement = this.messageListElement.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const contentElement = messageElement.querySelector('.chat-message-content');
            if (contentElement) {
                contentElement.innerHTML = renderMarkdown(content);
            }
            
            // Update in messages array
            const message = this.messages.find(m => m.id === messageId);
            if (message) {
                message.content = content;
            }
        }
    }
}

