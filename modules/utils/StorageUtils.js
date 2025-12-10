// StorageUtils - localStorage helpers, serialization, error handling
// Pure utility functions, no dependencies

/**
 * Saves a value to localStorage with error handling
 * @param {string} key - The storage key
 * @param {any} value - The value to save (will be JSON stringified)
 * @returns {object} { success: boolean, error?: string }
 */
export function save(key, value) {
    if (!key || typeof key !== 'string') {
        return { success: false, error: 'Invalid key' };
    }
    
    try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(key, serialized);
        return { success: true };
    } catch (error) {
        // Handle quota exceeded or other storage errors
        if (error.name === 'QuotaExceededError') {
            return { success: false, error: 'Storage quota exceeded' };
        }
        return { success: false, error: error.message || 'Failed to save to storage' };
    }
}

/**
 * Loads a value from localStorage with error handling
 * @param {string} key - The storage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} The loaded value or defaultValue
 */
export function load(key, defaultValue = null) {
    if (!key || typeof key !== 'string') {
        return defaultValue;
    }
    
    try {
        const item = localStorage.getItem(key);
        if (item === null) {
            return defaultValue;
        }
        return JSON.parse(item);
    } catch (error) {
        console.warn(`Failed to load from storage key "${key}":`, error);
        return defaultValue;
    }
}

/**
 * Removes a key from localStorage
 * @param {string} key - The storage key to remove
 * @returns {object} { success: boolean, error?: string }
 */
export function remove(key) {
    if (!key || typeof key !== 'string') {
        return { success: false, error: 'Invalid key' };
    }
    
    try {
        localStorage.removeItem(key);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message || 'Failed to remove from storage' };
    }
}

/**
 * Checks if a key exists in localStorage
 * @param {string} key - The storage key to check
 * @returns {boolean} True if key exists
 */
export function exists(key) {
    if (!key || typeof key !== 'string') {
        return false;
    }
    
    return localStorage.getItem(key) !== null;
}

/**
 * Gets all keys with a given prefix
 * @param {string} prefix - The prefix to filter by
 * @returns {string[]} Array of matching keys
 */
export function getAllKeys(prefix) {
    if (!prefix || typeof prefix !== 'string') {
        return [];
    }
    
    const keys = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key);
            }
        }
    } catch (error) {
        console.warn('Failed to get keys from storage:', error);
    }
    
    return keys;
}

/**
 * Clears all keys with a given prefix
 * @param {string} prefix - The prefix to filter by
 * @returns {object} { success: boolean, count: number, error?: string }
 */
export function clear(prefix) {
    if (!prefix || typeof prefix !== 'string') {
        return { success: false, count: 0, error: 'Invalid prefix' };
    }
    
    let count = 0;
    try {
        const keys = getAllKeys(prefix);
        for (const key of keys) {
            localStorage.removeItem(key);
            count++;
        }
        return { success: true, count };
    } catch (error) {
        return { success: false, count, error: error.message || 'Failed to clear storage' };
    }
}

