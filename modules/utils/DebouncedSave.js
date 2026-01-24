// DebouncedSave - Utility for debouncing state save operations
// Prevents excessive localStorage writes by batching rapid state changes

/**
 * Creates a debounced function that delays execution until after wait time has passed
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Object} Debounced function with cancel and flush methods
 */
function createDebouncedFunction(func, delay) {
    let timeoutId = null;
    let lastArgs = null;
    let lastThis = null;
    
    const debounced = function(...args) {
        lastArgs = args;
        lastThis = this;
        
        // Clear existing timeout
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        
        // Set new timeout
        timeoutId = setTimeout(() => {
            timeoutId = null;
            func.apply(lastThis, lastArgs);
            lastArgs = null;
            lastThis = null;
        }, delay);
    };
    
    // Cancel pending execution
    debounced.cancel = function() {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
            lastArgs = null;
            lastThis = null;
        }
    };
    
    // Flush immediately (execute pending call)
    debounced.flush = function() {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
            const args = lastArgs;
            const context = lastThis;
            lastArgs = null;
            lastThis = null;
            func.apply(context, args);
        }
    };
    
    // Check if there's a pending execution
    debounced.pending = function() {
        return timeoutId !== null;
    };
    
    return debounced;
}

/**
 * DebouncedSave - Manages debounced state saving
 */
class DebouncedSave {
    /**
     * @param {Function} saveFunction - Function to call for saving
     * @param {number} delay - Debounce delay in milliseconds
     */
    constructor(saveFunction, delay = 500) {
        this.saveFunction = saveFunction;
        this.delay = delay;
        this.debouncedSave = createDebouncedFunction(saveFunction, delay);
    }
    
    /**
     * Save state (debounced)
     * @param {...any} args - Arguments to pass to save function
     */
    save(...args) {
        this.debouncedSave(...args);
    }
    
    /**
     * Cancel pending save
     */
    cancel() {
        this.debouncedSave.cancel();
    }
    
    /**
     * Flush pending save immediately
     */
    flush() {
        this.debouncedSave.flush();
    }
    
    /**
     * Check if there's a pending save
     * @returns {boolean} True if save is pending
     */
    isPending() {
        return this.debouncedSave.pending();
    }
    
    /**
     * Update debounce delay
     * @param {number} newDelay - New delay in milliseconds
     */
    setDelay(newDelay) {
        this.delay = newDelay;
        // Cancel current and recreate with new delay
        this.debouncedSave.cancel();
        this.debouncedSave = createDebouncedFunction(this.saveFunction, newDelay);
    }
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DebouncedSave, createDebouncedFunction };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.DebouncedSave = DebouncedSave;
    window.createDebouncedFunction = createDebouncedFunction;
}
