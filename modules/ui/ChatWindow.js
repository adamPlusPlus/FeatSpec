// ChatWindow - Main floating window container, visibility, positioning
// Uses WindowDragResize and EventSystem

import { makeDraggable, makeResizable, savePosition, loadPosition } from '../utils/WindowDragResize.js';

/**
 * ChatWindow - Manages the floating chat window
 */
export class ChatWindow {
    constructor(eventSystem, containerElement) {
        this.eventSystem = eventSystem;
        this.containerElement = containerElement || document.body;
        this.windowElement = null;
        this.isVisible = false;
        this.position = { x: 100, y: 100 };
        this.size = { width: 600, height: 700 };
        this.maxHeight = null; // Max height in pixels (null for default)
        this.dragCleanup = null;
        this.resizeCleanup = null;
        this.storageKey = 'chat_window_position';
        
        // Track event listeners for cleanup
        this.eventListenerCleanups = [];
        
        this._initialize();
    }
    
    /**
     * Initializes the window element
     * @private
     */
    _initialize() {
        // Create window element if it doesn't exist
        if (!this.windowElement) {
            this.windowElement = document.getElementById('chat-window');
            
            if (!this.windowElement) {
                console.warn('Chat window element not found in DOM');
                return;
            }
        }
        
        // Set initial position and size
        this.windowElement.style.position = 'fixed';
        this.windowElement.style.left = `${this.position.x}px`;
        this.windowElement.style.top = `${this.position.y}px`;
        this.windowElement.style.width = `${this.size.width}px`;
        this.windowElement.style.height = `${this.size.height}px`;
        this.windowElement.style.display = 'none';
        this.windowElement.style.zIndex = AppConstants.UI.Z_INDEX.CHAT_WINDOW.toString();
        
        // Load saved position
        loadPosition(this.windowElement, this.storageKey);
        
        // Make draggable (using header as handle)
        const headerElement = this.windowElement.querySelector('.chat-window-header');
        if (headerElement) {
            this.dragCleanup = makeDraggable(this.windowElement, headerElement, {
                storageKey: this.storageKey,
                onDrag: (position) => {
                    this.position = position;
                }
            });
        }
        
        // Make resizable
        this._updateResizeOptions();
    }
    
    /**
     * Shows the chat window
     */
    show() {
        if (!this.windowElement) {
            this._initialize();
        }
        
        if (this.windowElement) {
            this.windowElement.style.display = 'flex';
            this.isVisible = true;
            
            // Emit event
            this.eventSystem.emit('chat:window:shown', {
                source: 'ChatWindow',
                data: {}
            });
        }
    }
    
    /**
     * Hides the chat window
     */
    hide() {
        if (this.windowElement) {
            this.windowElement.style.display = 'none';
            this.isVisible = false;
            
            // Emit event
            this.eventSystem.emit('chat:window:hidden', {
                source: 'ChatWindow',
                data: {}
            });
        }
    }
    
    /**
     * Toggles the chat window visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * Checks if window is visible
     * @returns {boolean} True if visible
     */
    isWindowVisible() {
        return this.isVisible;
    }
    
    /**
     * Sets the window position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    setPosition(x, y) {
        this.position = { x, y };
        if (this.windowElement) {
            this.windowElement.style.left = `${x}px`;
            this.windowElement.style.top = `${y}px`;
            savePosition(this.windowElement, this.storageKey);
        }
    }
    
    /**
     * Sets the window size
     * @param {number} width - Width in pixels
     * @param {number} height - Height in pixels
     */
    setSize(width, height) {
        this.size = { width, height };
        if (this.windowElement) {
            this.windowElement.style.width = `${width}px`;
            this.windowElement.style.height = `${height}px`;
            savePosition(this.windowElement, this.storageKey);
        }
    }
    
    /**
     * Gets the current position
     * @returns {object} { x, y }
     */
    getPosition() {
        return { ...this.position };
    }
    
    /**
     * Gets the current size
     * @returns {object} { width, height }
     */
    getSize() {
        return { ...this.size };
    }
    
    /**
     * Sets the max height for the window
     * @param {number|null} maxHeight - Max height in pixels (null for default)
     */
    setMaxHeight(maxHeight) {
        this.maxHeight = maxHeight;
        
        if (this.windowElement) {
            if (maxHeight !== null && maxHeight !== undefined) {
                this.windowElement.style.maxHeight = `${maxHeight}px`;
            } else {
                this.windowElement.style.maxHeight = '90vh'; // Default CSS value
            }
        }
        
        // Update resize options to respect max height
        this._updateResizeOptions();
    }
    
    /**
     * Updates resize options based on current maxHeight
     * @private
     */
    _updateResizeOptions() {
        if (!this.windowElement) {
            return;
        }
        
        // Clean up existing resize handler
        if (this.resizeCleanup) {
            this.resizeCleanup();
            this.resizeCleanup = null;
        }
        
        // Calculate max height for resize
        const maxResizeHeight = this.maxHeight !== null && this.maxHeight !== undefined
            ? Math.min(this.maxHeight, window.innerHeight - 20)
            : window.innerHeight - 20;
        
        // Make resizable
        this.resizeCleanup = makeResizable(this.windowElement, {
            storageKey: this.storageKey,
            minSize: { width: 400, height: 300 },
            maxSize: { width: window.innerWidth - 20, height: maxResizeHeight },
            onResize: (size) => {
                this.size = size;
            }
        });
    }
    
    /**
     * Gets the window DOM element
     * @returns {HTMLElement|null} Window element
     */
    getElement() {
        return this.windowElement;
    }
    
    /**
     * Cleanup - removes event listeners
     */
    destroy() {
        if (this.dragCleanup) {
            this.dragCleanup();
            this.dragCleanup = null;
        }
        
        if (this.resizeCleanup) {
            this.resizeCleanup();
            this.resizeCleanup = null;
        }
    }
}

