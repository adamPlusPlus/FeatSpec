// EventListenerManager - Tracks and manages event listeners for proper cleanup
// Prevents memory leaks by ensuring all event listeners are properly removed

/**
 * EventListenerManager - Manages event listener lifecycle
 */
class EventListenerManager {
    constructor() {
        // Map of element -> Map of event -> Set of handlers
        this.listeners = new Map();
    }
    
    /**
     * Add event listener with tracking
     * @param {HTMLElement|Window|Document} element - Element to attach listener to
     * @param {string} event - Event type
     * @param {Function} handler - Event handler function
     * @param {object|boolean} options - Event options (capture, once, passive) or useCapture boolean
     * @returns {Function} Cleanup function to remove this listener
     */
    add(element, event, handler, options = false) {
        if (!element) {
            console.warn('EventListenerManager.add: Invalid element provided');
            return () => {};
        }
        
        // Initialize tracking structure
        if (!this.listeners.has(element)) {
            this.listeners.set(element, new Map());
        }
        const elementListeners = this.listeners.get(element);
        
        if (!elementListeners.has(event)) {
            elementListeners.set(event, new Set());
        }
        const eventHandlers = elementListeners.get(event);
        
        // Add handler to tracking set
        eventHandlers.add(handler);
        
        // Add actual event listener
        element.addEventListener(event, handler, options);
        
        // Return cleanup function
        return () => {
            this.remove(element, event, handler);
        };
    }
    
    /**
     * Remove specific event listener
     * @param {HTMLElement|Window|Document} element - Element to remove listener from
     * @param {string} event - Event type
     * @param {Function} handler - Event handler function
     * @param {object|boolean} options - Event options (must match add() call)
     */
    remove(element, event, handler, options = false) {
        if (!element || !this.listeners.has(element)) {
            return;
        }
        
        const elementListeners = this.listeners.get(element);
        if (!elementListeners.has(event)) {
            return;
        }
        
        const eventHandlers = elementListeners.get(event);
        if (eventHandlers.has(handler)) {
            element.removeEventListener(event, handler, options);
            eventHandlers.delete(handler);
            
            // Clean up empty sets
            if (eventHandlers.size === 0) {
                elementListeners.delete(event);
            }
        }
        
        // Clean up empty maps
        if (elementListeners.size === 0) {
            this.listeners.delete(element);
        }
    }
    
    /**
     * Remove all listeners for a specific element
     * @param {HTMLElement|Window|Document} element - Element to clean up
     */
    cleanup(element) {
        if (!element || !this.listeners.has(element)) {
            return;
        }
        
        const elementListeners = this.listeners.get(element);
        
        // Remove all listeners
        for (const [event, handlers] of elementListeners.entries()) {
            for (const handler of handlers) {
                // Try both with and without options (can't track options, so try both)
                element.removeEventListener(event, handler, false);
                element.removeEventListener(event, handler, true);
                element.removeEventListener(event, handler, { capture: false });
                element.removeEventListener(event, handler, { capture: true });
            }
        }
        
        // Remove from tracking
        this.listeners.delete(element);
    }
    
    /**
     * Remove all tracked listeners
     */
    cleanupAll() {
        for (const element of this.listeners.keys()) {
            this.cleanup(element);
        }
        this.listeners.clear();
    }
    
    /**
     * Get count of tracked listeners
     * @returns {number} Total number of tracked listeners
     */
    getListenerCount() {
        let count = 0;
        for (const elementListeners of this.listeners.values()) {
            for (const handlers of elementListeners.values()) {
                count += handlers.size;
            }
        }
        return count;
    }
    
    /**
     * Check if element has tracked listeners
     * @param {HTMLElement|Window|Document} element - Element to check
     * @returns {boolean} True if element has tracked listeners
     */
    hasListeners(element) {
        return this.listeners.has(element) && this.listeners.get(element).size > 0;
    }
}

// Create singleton instance
const eventListenerManager = new EventListenerManager();

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EventListenerManager, eventListenerManager };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.EventListenerManager = EventListenerManager;
    window.eventListenerManager = eventListenerManager;
}
