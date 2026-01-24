// RenderQueue - Batches render requests using requestAnimationFrame
// Prevents multiple full re-renders in the same frame and optimizes rendering performance

/**
 * RenderQueue - Manages batched render requests
 */
class RenderQueue {
    constructor() {
        this.queue = new Map(); // component -> priority
        this.scheduled = false;
        this.frameId = null;
    }
    
    /**
     * Queue a component for rendering
     * @param {string} component - Component identifier (e.g., 'projects', 'sections', 'pipeline')
     * @param {number} priority - Render priority (higher = more important, default: 0)
     */
    queueRender(component, priority = 0) {
        if (!component) return;
        
        // If component already queued, update priority if higher
        if (this.queue.has(component)) {
            const existingPriority = this.queue.get(component);
            if (priority > existingPriority) {
                this.queue.set(component, priority);
            }
        } else {
            this.queue.set(component, priority);
        }
        
        // Schedule flush if not already scheduled
        if (!this.scheduled) {
            this.scheduleFlush();
        }
    }
    
    /**
     * Schedule flush on next animation frame
     * @private
     */
    scheduleFlush() {
        if (this.scheduled) return;
        
        this.scheduled = true;
        this.frameId = requestAnimationFrame(() => {
            this.flush();
        });
    }
    
    /**
     * Execute all queued renders in priority order
     * @param {Function} renderCallback - Callback function(component) to perform actual rendering
     * @returns {Array<string>} Array of components that were rendered
     */
    flush(renderCallback = null) {
        if (this.queue.size === 0) {
            this.scheduled = false;
            return [];
        }
        
        // Sort by priority (highest first)
        const sortedComponents = Array.from(this.queue.entries())
            .sort((a, b) => b[1] - a[1]) // Sort by priority descending
            .map(entry => entry[0]);
        
        const rendered = [];
        
        // Execute renders
        for (const component of sortedComponents) {
            if (renderCallback) {
                try {
                    renderCallback(component);
                    rendered.push(component);
                } catch (error) {
                    console.error(`Error rendering component ${component}:`, error);
                }
            } else {
                rendered.push(component);
            }
        }
        
        // Clear queue
        this.queue.clear();
        this.scheduled = false;
        this.frameId = null;
        
        return rendered;
    }
    
    /**
     * Cancel pending render for a specific component
     * @param {string} component - Component identifier
     */
    cancel(component) {
        if (component) {
            this.queue.delete(component);
        }
    }
    
    /**
     * Cancel all pending renders
     */
    cancelAll() {
        this.queue.clear();
        if (this.frameId !== null) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        this.scheduled = false;
    }
    
    /**
     * Check if a component is queued
     * @param {string} component - Component identifier
     * @returns {boolean} True if component is queued
     */
    isQueued(component) {
        return this.queue.has(component);
    }
    
    /**
     * Get queue size
     * @returns {number} Number of queued components
     */
    size() {
        return this.queue.size;
    }
    
    /**
     * Check if flush is scheduled
     * @returns {boolean} True if flush is scheduled
     */
    isScheduled() {
        return this.scheduled;
    }
}

// Create singleton instance
const renderQueue = new RenderQueue();

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RenderQueue, renderQueue };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.RenderQueue = RenderQueue;
    window.renderQueue = renderQueue;
}
