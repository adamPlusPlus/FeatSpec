// ChatInput - Input field management, send button, keyboard shortcuts
// Standalone UI module

/**
 * ChatInput - Manages the chat input field
 */
export class ChatInput {
    constructor(eventSystem, containerElement) {
        this.eventSystem = eventSystem;
        this.containerElement = containerElement;
        this.inputElement = null;
        this.sendButtonElement = null;
        this.onSendCallback = null;
        this.onKeyDownCallback = null;
        
        // Track event listeners for cleanup
        this.eventListenerCleanups = [];
        
        this._initialize();
    }
    
    /**
     * Initializes the input elements
     * @private
     */
    _initialize() {
        if (!this.containerElement) {
            console.warn('ChatInput: Container element not provided');
            return;
        }
        
        // Find or create input elements
        this.inputElement = this.containerElement.querySelector('.chat-input-field');
        this.sendButtonElement = this.containerElement.querySelector('.chat-send-button');
        
        if (!this.inputElement) {
            console.warn('ChatInput: Input field not found');
            return;
        }
        
        // Set up event listeners
        const keyDownHandler = (e) => {
            this._handleKeyDown(e);
        };
        const sendClickHandler = () => {
            this._handleSend();
        };
        
        if (typeof window !== 'undefined' && window.eventListenerManager) {
            window.eventListenerManager.add(this.inputElement, 'keydown', keyDownHandler);
            if (this.sendButtonElement) {
                window.eventListenerManager.add(this.sendButtonElement, 'click', sendClickHandler);
            }
        } else {
            this.inputElement.addEventListener('keydown', keyDownHandler);
            this.eventListenerCleanups.push(() => {
                this.inputElement.removeEventListener('keydown', keyDownHandler);
            });
            
            if (this.sendButtonElement) {
                this.sendButtonElement.addEventListener('click', sendClickHandler);
                this.eventListenerCleanups.push(() => {
                    this.sendButtonElement.removeEventListener('click', sendClickHandler);
                });
            }
        }
    }
    
    /**
     * Cleanup event listeners
     */
    destroy() {
        if (typeof window !== 'undefined' && window.eventListenerManager) {
            if (this.inputElement) {
                window.eventListenerManager.cleanup(this.inputElement);
            }
            if (this.sendButtonElement) {
                window.eventListenerManager.cleanup(this.sendButtonElement);
            }
        } else {
            this.eventListenerCleanups.forEach(cleanup => cleanup());
            this.eventListenerCleanups = [];
        }
    }
    
    /**
     * Handles keyboard input
     * @private
     * @param {KeyboardEvent} e - Keyboard event
     */
    _handleKeyDown(e) {
        // Enter to send, Shift+Enter for newline
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this._handleSend();
        }
        
        // Call custom keydown handler if provided
        if (this.onKeyDownCallback) {
            this.onKeyDownCallback(e);
        }
    }
    
    /**
     * Handles send button click or Enter key
     * @private
     */
    _handleSend() {
        const message = this.getValue();
        if (message && message.trim()) {
            if (this.onSendCallback) {
                this.onSendCallback(message.trim());
            }

            // Emit event
            this.eventSystem.emit('chat:input:send', {
                source: 'ChatInput',
                data: { message: message.trim() }
            });

            // Clear input
            this.clear();
        }
    }
    
    /**
     * Focuses the input field
     */
    focus() {
        if (this.inputElement) {
            this.inputElement.focus();
        }
    }
    
    /**
     * Clears the input field
     */
    clear() {
        if (this.inputElement) {
            this.inputElement.value = '';
        }
    }
    
    /**
     * Gets the input value
     * @returns {string} Input value
     */
    getValue() {
        return this.inputElement ? this.inputElement.value : '';
    }
    
    /**
     * Sets the input value
     * @param {string} text - Text to set
     */
    setValue(text) {
        if (this.inputElement) {
            this.inputElement.value = text || '';
        }
    }
    
    /**
     * Sets the placeholder text
     * @param {string} text - Placeholder text
     */
    setPlaceholder(text) {
        if (this.inputElement) {
            this.inputElement.placeholder = text || '';
        }
    }
    
    /**
     * Sets the disabled state
     * @param {boolean} disabled - Whether input is disabled
     */
    setDisabled(disabled) {
        if (this.inputElement) {
            this.inputElement.disabled = disabled;
        }
        if (this.sendButtonElement) {
            this.sendButtonElement.disabled = disabled;
        }
    }
    
    /**
     * Sets the send callback
     * @param {function} callback - Callback function(message)
     */
    onSend(callback) {
        this.onSendCallback = callback;
    }
    
    /**
     * Sets the keydown callback
     * @param {function} callback - Callback function(event)
     */
    onKeyDown(callback) {
        this.onKeyDownCallback = callback;
    }
}

