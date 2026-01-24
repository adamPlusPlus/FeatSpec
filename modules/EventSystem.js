// Event System - Centralized event bus for component communication
class EventSystem {
    constructor() {
        this.listeners = new Map();
    }
    
    // Singleton instance
    static getInstance() {
        if (!EventSystem.instance) {
            EventSystem.instance = new EventSystem();
        }
        return EventSystem.instance;
    }
    
    // Register event handler
    register(eventType, handler) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(handler);
    }
    
    // Unregister event handler
    unregister(eventType, handler) {
        if (!this.listeners.has(eventType)) {
            return;
        }
        const handlers = this.listeners.get(eventType);
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }
    
    // Emit event to all registered handlers
    emit(eventType, eventData) {
        if (!this.listeners.has(eventType)) {
            return;
        }
        
        const handlers = this.listeners.get(eventType);
        const event = {
            type: eventType,
            timestamp: Date.now(),
            source: eventData?.source || 'unknown',
            data: eventData?.data || {},
            target: eventData?.target || null
        };
        
        // Execute handlers synchronously to maintain order
        handlers.forEach(handler => {
            try {
                handler(event);
            } catch (error) {
                console.error(`Error in event handler for ${eventType}:`, error);
            }
        });
    }
    
    // Clear all listeners
    clear() {
        this.listeners.clear();
    }
    
    /**
     * Unregister all handlers for a specific event type
     * @param {string} eventType - Event type to clear
     */
    unregisterAll(eventType) {
        if (this.listeners.has(eventType)) {
            this.listeners.delete(eventType);
        }
    }
    
    /**
     * Get all registered event types
     * @returns {Array<string>} Array of event types
     */
    getRegisteredEventTypes() {
        return Array.from(this.listeners.keys());
    }
    
    // Check if event type has listeners
    hasListeners(eventType) {
        return this.listeners.has(eventType) && this.listeners.get(eventType).length > 0;
    }
}

// Event Type Constants - Make globally accessible
window.EventType = {
    // Project Events
    PROJECT_CREATED: 'PROJECT_CREATED',
    PROJECT_DELETED: 'PROJECT_DELETED',
    PROJECT_UPDATED: 'PROJECT_UPDATED',
    PROJECT_ACTIVATED: 'PROJECT_ACTIVATED',
    PROJECT_REORDERED: 'PROJECT_REORDERED',
    
    // Section Events
    SECTION_UPDATED: 'SECTION_UPDATED',
    
    // Legacy Page Events (for backward compatibility during migration)
    PAGE_ADDED: 'PAGE_ADDED',
    PAGE_DELETED: 'PAGE_DELETED',
    PAGE_TITLE_CHANGED: 'PAGE_TITLE_CHANGED',
    PAGE_COLLAPSED: 'PAGE_COLLAPSED',
    PAGE_EXPANDED: 'PAGE_EXPANDED',
    PAGE_REORDERED: 'PAGE_REORDERED',
    
    // Legacy Element Events (for backward compatibility during migration)
    ELEMENT_ADDED: 'ELEMENT_ADDED',
    ELEMENT_DELETED: 'ELEMENT_DELETED',
    ELEMENT_UPDATED: 'ELEMENT_UPDATED',
    ELEMENT_REORDERED: 'ELEMENT_REORDERED',
    ELEMENT_COMPLETION_TOGGLED: 'ELEMENT_COMPLETION_TOGGLED',
    
    // Interaction Events
    DRAG_STARTED: 'DRAG_STARTED',
    DRAG_MOVED: 'DRAG_MOVED',
    DRAG_ENDED: 'DRAG_ENDED',
    CONTEXT_MENU_OPENED: 'CONTEXT_MENU_OPENED',
    CONTEXT_MENU_CLOSED: 'CONTEXT_MENU_CLOSED',
    CONTEXT_MENU_ACTION_SELECTED: 'CONTEXT_MENU_ACTION_SELECTED',
    
    // Modal Events
    MODAL_OPENED: 'MODAL_OPENED',
    MODAL_CLOSED: 'MODAL_CLOSED',
    MODAL_SAVED: 'MODAL_SAVED',
    MODAL_CANCELLED: 'MODAL_CANCELLED',
    
    // Input Events
    KEYBOARD_SHORTCUT_DETECTED: 'KEYBOARD_SHORTCUT_DETECTED',
    TEXT_EDIT_STARTED: 'TEXT_EDIT_STARTED',
    TEXT_EDIT_ENDED: 'TEXT_EDIT_ENDED',
    
    // State Events
    STATE_CHANGED: 'STATE_CHANGED',
    STATE_SAVED: 'STATE_SAVED',
    STATE_LOADED: 'STATE_LOADED',
    
    // File Events
    FILE_LOADED: 'FILE_LOADED',
    FILE_SAVED: 'FILE_SAVED',
    FILE_ERROR: 'FILE_ERROR',
    
    // Settings Events
    SETTING_CHANGED: 'SETTING_CHANGED',
    SETTINGS_RESET: 'SETTINGS_RESET',
    
    // System Events
    DAILY_RESET_TRIGGERED: 'DAILY_RESET_TRIGGERED',
    APPLICATION_INITIALIZED: 'APPLICATION_INITIALIZED',
    
    // Error Events
    ERROR_OCCURRED: 'ERROR_OCCURRED',
    
    // Automation Events
    AUTOMATION_START: 'AUTOMATION_START',
    AUTOMATION_STOP: 'AUTOMATION_STOP',
    AUTOMATION_STARTED: 'AUTOMATION_STARTED',
    AUTOMATION_STOPPED: 'AUTOMATION_STOPPED',
    AUTOMATION_FILE_DETECTED: 'AUTOMATION_FILE_DETECTED',
    AUTOMATION_SECTION_COMPLETE: 'AUTOMATION_SECTION_COMPLETE'
};

