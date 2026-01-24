// ChatSettings - Settings modal UI, form handling, validation
// Uses EventSystem and PathUtils

import { normalize, validate } from '../utils/PathUtils.js';

/**
 * ChatSettings - Manages the chat settings modal
 */
export class ChatSettings {
    constructor(eventSystem, containerElement) {
        this.eventSystem = eventSystem;
        this.containerElement = containerElement;
        this.modalElement = null;
        this.currentChatId = null;
        this.onSaveCallback = null;
        this.onCancelCallback = null;
        
        // Track event listeners for cleanup
        this.eventListenerCleanups = [];
        
        this._initialize();
    }
    
    /**
     * Initializes the settings modal
     * @private
     */
    _initialize() {
        if (!this.containerElement) {
            console.warn('ChatSettings: Container element not provided');
            return;
        }
        
        // Find or create modal element
        this.modalElement = this.containerElement.querySelector('#chat-settings-modal');
        
        if (!this.modalElement) {
            console.warn('ChatSettings: Settings modal element not found');
            return;
        }
        
        // Set up close button
        const closeButton = this.modalElement.querySelector('.chat-settings-close');
        if (closeButton) {
            const closeHandler = () => {
                this.hide();
            };
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(closeButton, 'click', closeHandler);
            } else {
                closeButton.addEventListener('click', closeHandler);
                this.eventListenerCleanups.push(() => {
                    closeButton.removeEventListener('click', closeHandler);
                });
            }
        }
        
        // Set up save button
        const saveButton = this.modalElement.querySelector('.chat-settings-save');
        if (saveButton) {
            const saveHandler = () => {
                this._handleSave();
            };
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(saveButton, 'click', saveHandler);
            } else {
                saveButton.addEventListener('click', saveHandler);
                this.eventListenerCleanups.push(() => {
                    saveButton.removeEventListener('click', saveHandler);
                });
            }
        }
        
        // Set up cancel button
        const cancelButton = this.modalElement.querySelector('.chat-settings-cancel');
        if (cancelButton) {
            const cancelHandler = () => {
                this.hide();
            };
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(cancelButton, 'click', cancelHandler);
            } else {
                cancelButton.addEventListener('click', cancelHandler);
                this.eventListenerCleanups.push(() => {
                    cancelButton.removeEventListener('click', cancelHandler);
                });
            }
        }
        
        // Set up clear history button
        const clearHistoryButton = this.modalElement.querySelector('.chat-settings-clear-history');
        if (clearHistoryButton) {
            const clearHandler = () => {
                if (confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
                    this.eventSystem.emit('chat:history:clear', {
                        source: 'ChatSettings',
                        data: { chatId: this.currentChatId }
                    });
                }
            };
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(clearHistoryButton, 'click', clearHandler);
            } else {
                clearHistoryButton.addEventListener('click', clearHandler);
                this.eventListenerCleanups.push(() => {
                    clearHistoryButton.removeEventListener('click', clearHandler);
                });
            }
        }
        
        // Close on outside click
        const modalClickHandler = (e) => {
            if (e.target === this.modalElement) {
                this.hide();
            }
        };
        if (typeof window !== 'undefined' && window.eventListenerManager) {
            window.eventListenerManager.add(this.modalElement, 'click', modalClickHandler);
        } else {
            this.modalElement.addEventListener('click', modalClickHandler);
            this.eventListenerCleanups.push(() => {
                this.modalElement.removeEventListener('click', modalClickHandler);
            });
        }
    }
    
    /**
     * Cleanup event listeners
     */
    destroy() {
        if (typeof window !== 'undefined' && window.eventListenerManager) {
            if (this.modalElement) {
                window.eventListenerManager.cleanup(this.modalElement);
            }
        } else {
            this.eventListenerCleanups.forEach(cleanup => cleanup());
            this.eventListenerCleanups = [];
        }
    }
    
    /**
     * Shows the settings modal
     * @param {string} chatId - The chat ID
     * @param {object} chatInstance - The chat instance
     */
    show(chatId, chatInstance) {
        if (!this.modalElement) {
            return;
        }
        
        this.currentChatId = chatId;
        this.populate(chatInstance);
        this.modalElement.style.display = 'flex';
        
        // Emit event
        this.eventSystem.emit('chat:settings:shown', {
            source: 'ChatSettings',
            data: { chatId }
        });
    }
    
    /**
     * Hides the settings modal
     */
    hide() {
        if (this.modalElement) {
            this.modalElement.style.display = 'none';
            this.currentChatId = null;
            
            // Emit event
            this.eventSystem.emit('chat:settings:hidden', {
                source: 'ChatSettings',
                data: {}
            });
        }
    }
    
    /**
     * Populates the form with chat instance data
     * @param {object} chatInstance - The chat instance
     */
    populate(chatInstance) {
        if (!this.modalElement || !chatInstance) {
            return;
        }
        
        const nameInput = this.modalElement.querySelector('.chat-settings-name');
        const scopeInput = this.modalElement.querySelector('.chat-settings-scope');
        const saveHistoryCheckbox = this.modalElement.querySelector('.chat-settings-save-history');
        const maxHeightInput = this.modalElement.querySelector('.chat-settings-max-height');
        const projectSelect = this.modalElement.querySelector('.chat-settings-project');
        
        if (nameInput) {
            nameInput.value = chatInstance.name || '';
        }
        
        if (scopeInput) {
            scopeInput.value = chatInstance.scopeDirectory || '';
        }
        
        if (saveHistoryCheckbox) {
            saveHistoryCheckbox.checked = chatInstance.saveHistory !== false;
        }
        
        if (maxHeightInput) {
            maxHeightInput.value = chatInstance.maxHeight || '';
        }
        
        if (projectSelect) {
            // Populate project select if needed
            // This would require access to StateManager, so we'll handle it externally
        }
    }
    
    /**
     * Gets form data
     * @returns {object} Form data object
     */
    getFormData() {
        if (!this.modalElement) {
            return null;
        }
        
        const nameInput = this.modalElement.querySelector('.chat-settings-name');
        const scopeInput = this.modalElement.querySelector('.chat-settings-scope');
        const saveHistoryCheckbox = this.modalElement.querySelector('.chat-settings-save-history');
        const maxHeightInput = this.modalElement.querySelector('.chat-settings-max-height');
        
        const maxHeightValue = maxHeightInput ? maxHeightInput.value.trim() : '';
        const maxHeight = maxHeightValue ? parseInt(maxHeightValue, 10) : null;
        
        return {
            name: nameInput ? nameInput.value.trim() : '',
            scopeDirectory: scopeInput ? scopeInput.value.trim() : '',
            saveHistory: saveHistoryCheckbox ? saveHistoryCheckbox.checked : true,
            maxHeight: maxHeight && !isNaN(maxHeight) ? maxHeight : null
        };
    }
    
    /**
     * Validates the form data
     * @returns {object} { valid: boolean, errors?: Array<string> }
     */
    validate() {
        const data = this.getFormData();
        if (!data) {
            return { valid: false, errors: ['Form not available'] };
        }
        
        const errors = [];
        
        // Validate name
        if (!data.name || !data.name.trim()) {
            errors.push('Chat name is required');
        }
        
        // Validate scope directory if provided
        if (data.scopeDirectory && data.scopeDirectory.trim()) {
            const normalized = normalize(data.scopeDirectory.trim());
            // Basic validation - path should not be empty after normalization
            if (!normalized) {
                errors.push('Invalid scope directory path');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }
    
    /**
     * Handles save button click
     * @private
     */
    _handleSave() {
        const validation = this.validate();
        
        if (!validation.valid) {
            // Show errors (could emit event or display in UI)
            this.eventSystem.emit('chat:settings:validation-error', {
                source: 'ChatSettings',
                data: { errors: validation.errors }
            });
            return;
        }
        
        const data = this.getFormData();
        
        if (this.onSaveCallback) {
            this.onSaveCallback(this.currentChatId, data);
        }
        
        // Emit event
        this.eventSystem.emit('chat:settings:saved', {
            source: 'ChatSettings',
            data: { chatId: this.currentChatId, data }
        });
        
        this.hide();
    }
    
    /**
     * Sets the save callback
     * @param {function} callback - Callback function(chatId, data)
     */
    onSave(callback) {
        this.onSaveCallback = callback;
    }
    
    /**
     * Sets the cancel callback
     * @param {function} callback - Callback function()
     */
    onCancel(callback) {
        this.onCancelCallback = callback;
    }
}

