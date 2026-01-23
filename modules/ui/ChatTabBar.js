// ChatTabBar - Tab rendering, tab switching, tab actions (close, rename)
// Uses EventSystem and MessageFormatter

import { truncateText } from '../utils/MessageFormatter.js';

/**
 * ChatTabBar - Manages the chat tab bar
 */
export class ChatTabBar {
    constructor(eventSystem, containerElement) {
        this.eventSystem = eventSystem;
        this.containerElement = containerElement;
        this.tabBarElement = null;
        this.tabs = new Map(); // chatId -> tab element
        this.activeTabId = null;
        
        this._initialize();
    }
    
    /**
     * Initializes the tab bar element
     * @private
     */
    _initialize() {
        if (!this.containerElement) {
            console.warn('ChatTabBar: Container element not provided');
            return;
        }
        
        // Find or create tab bar element
        this.tabBarElement = this.containerElement.querySelector('.chat-tab-bar');
        
        if (!this.tabBarElement) {
            console.warn('ChatTabBar: Tab bar element not found');
            return;
        }
        
        // Add new chat button if it exists
        const newChatButton = this.containerElement.querySelector('.chat-new-tab-button');
        if (newChatButton) {
            newChatButton.addEventListener('click', () => {
                this.eventSystem.emit('chat:tab:new', {
                    source: 'ChatTabBar',
                    data: {}
                });
            });
        }
    }
    
    /**
     * Renders the tab bar
     */
    render() {
        // Tabs are managed individually via addTab/removeTab
        // This method can be used to refresh the display
        this._updateActiveTab();
    }
    
    /**
     * Adds a tab
     * @param {string} chatId - The chat ID
     * @param {string} name - Tab name
     */
    addTab(chatId, name) {
        if (!this.tabBarElement || this.tabs.has(chatId)) {
            return;
        }
        
        const tabElement = document.createElement('div');
        tabElement.className = 'chat-tab';
        tabElement.dataset.chatId = chatId;
        
        const displayName = truncateText(name || 'New Chat', 20);
        
        // displayName is user-controlled (chat name) - escape and use safeSetInnerHTML
        const tabHtml = `
            <span class="chat-tab-name">${displayName}</span>
            <button class="chat-tab-close" aria-label="Close tab">×</button>
        `;
        if (typeof window !== 'undefined' && window.safeSetInnerHTML) {
            window.safeSetInnerHTML(tabElement, tabHtml, { trusted: false });
        } else {
            tabElement.innerHTML = tabHtml;
        }
        
        // Click handler for tab selection
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('chat-tab-close')) {
                this.setActiveTab(chatId);
            }
        });
        
        // Close button handler
        const closeButton = tabElement.querySelector('.chat-tab-close');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.eventSystem.emit('chat:tab:close', {
                    source: 'ChatTabBar',
                    data: { chatId }
                });
            });
        }
        
        this.tabBarElement.appendChild(tabElement);
        this.tabs.set(chatId, tabElement);
        
        // Set as active if it's the first tab
        if (this.tabs.size === 1) {
            this.setActiveTab(chatId);
        }
    }
    
    /**
     * Removes a tab
     * @param {string} chatId - The chat ID
     */
    removeTab(chatId) {
        const tabElement = this.tabs.get(chatId);
        if (tabElement && this.tabBarElement) {
            this.tabBarElement.removeChild(tabElement);
            this.tabs.delete(chatId);
            
            // If this was the active tab, switch to another
            if (this.activeTabId === chatId) {
                const remainingTabs = Array.from(this.tabs.keys());
                if (remainingTabs.length > 0) {
                    this.setActiveTab(remainingTabs[0]);
                } else {
                    this.activeTabId = null;
                }
            }
        }
    }
    
    /**
     * Sets the active tab
     * @param {string} chatId - The chat ID
     */
    setActiveTab(chatId) {
        if (!this.tabs.has(chatId)) {
            return;
        }
        
        // Update active state
        this.activeTabId = chatId;
        this._updateActiveTab();
        
        // Emit event
        this.eventSystem.emit('chat:tab:activated', {
            source: 'ChatTabBar',
            data: { chatId }
        });
    }
    
    /**
     * Updates tab name
     * @param {string} chatId - The chat ID
     * @param {string} newName - New tab name
     */
    updateTabName(chatId, newName) {
        const tabElement = this.tabs.get(chatId);
        if (tabElement) {
            const nameElement = tabElement.querySelector('.chat-tab-name');
            if (nameElement) {
                const displayName = truncateText(newName || 'New Chat', 20);
                nameElement.textContent = displayName;
            }
        }
    }
    
    /**
     * Gets the active tab ID
     * @returns {string|null} Active tab ID or null
     */
    getActiveTabId() {
        return this.activeTabId;
    }
    
    /**
     * Updates active tab styling
     * @private
     */
    _updateActiveTab() {
        for (const [chatId, tabElement] of this.tabs.entries()) {
            if (chatId === this.activeTabId) {
                tabElement.classList.add('chat-tab-active');
            } else {
                tabElement.classList.remove('chat-tab-active');
            }
        }
    }
}

