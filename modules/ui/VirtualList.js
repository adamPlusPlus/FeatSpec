// VirtualList - Virtual scrolling component for large lists
// Only renders visible items + buffer to improve performance with 100+ items

/**
 * VirtualList - Implements virtual scrolling for large lists
 */
class VirtualList {
    /**
     * @param {HTMLElement} container - Container element for the list
     * @param {Object} options - Configuration options
     * @param {number} options.itemHeight - Estimated height of each item (default: 50)
     * @param {number} options.overscan - Number of items to render outside viewport (default: 5)
     * @param {Function} options.renderItem - Function(item, index) that returns HTMLElement
     */
    constructor(container, options = {}) {
        this.container = container;
        this.itemHeight = options.itemHeight || 50;
        this.overscan = options.overscan || 5;
        this.renderItem = options.renderItem || ((item, index) => {
            const el = document.createElement('div');
            el.textContent = item.toString();
            return el;
        });
        
        this.items = [];
        this.visibleRange = { start: 0, end: 0 };
        this.scrollTop = 0;
        this.containerHeight = 0;
        
        // DOM elements
        this.wrapper = null;
        this.content = null;
        this.spacerTop = null;
        this.spacerBottom = null;
        
        // Event listeners
        this.scrollHandler = null;
        this.resizeHandler = null;
        
        this.init();
    }
    
    /**
     * Initialize virtual list DOM structure
     * @private
     */
    init() {
        // Clear container
        this.container.innerHTML = '';
        
        // Create wrapper for scrolling
        this.wrapper = document.createElement('div');
        this.wrapper.style.cssText = 'height: 100%; overflow-y: auto; position: relative;';
        this.wrapper.className = 'virtual-list-wrapper';
        
        // Create content container
        this.content = document.createElement('div');
        this.content.style.cssText = 'position: relative;';
        this.content.className = 'virtual-list-content';
        
        // Create spacer elements for non-visible items
        this.spacerTop = document.createElement('div');
        this.spacerTop.className = 'virtual-list-spacer-top';
        this.spacerTop.style.cssText = 'height: 0px;';
        
        this.spacerBottom = document.createElement('div');
        this.spacerBottom.className = 'virtual-list-spacer-bottom';
        this.spacerBottom.style.cssText = 'height: 0px;';
        
        // Assemble structure
        this.content.appendChild(this.spacerTop);
        this.content.appendChild(this.spacerBottom);
        this.wrapper.appendChild(this.content);
        this.container.appendChild(this.wrapper);
        
        // Setup scroll listener
        this.scrollHandler = () => this.handleScroll();
        this.wrapper.addEventListener('scroll', this.scrollHandler, { passive: true });
        
        // Setup resize listener
        this.resizeHandler = () => this.handleResize();
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(() => this.handleResize());
            this.resizeObserver.observe(this.container);
        } else {
            window.addEventListener('resize', this.resizeHandler);
        }
        
        // Initial render
        this.update();
    }
    
    /**
     * Set items to render
     * @param {Array} items - Array of items to display
     */
    setItems(items) {
        this.items = items || [];
        this.update();
    }
    
    /**
     * Calculate visible range based on scroll position
     * @private
     * @returns {Object} { start, end } indices
     */
    calculateVisibleRange() {
        const containerHeight = this.wrapper.clientHeight || this.containerHeight;
        const scrollTop = this.wrapper.scrollTop || this.scrollTop;
        
        const itemsPerViewport = Math.ceil(containerHeight / this.itemHeight);
        const start = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.overscan);
        const end = Math.min(
            this.items.length,
            start + itemsPerViewport + (this.overscan * 2)
        );
        
        return { start, end };
    }
    
    /**
     * Handle scroll event
     * @private
     */
    handleScroll() {
        this.scrollTop = this.wrapper.scrollTop;
        this.update();
    }
    
    /**
     * Handle resize event
     * @private
     */
    handleResize() {
        this.containerHeight = this.container.clientHeight;
        this.update();
    }
    
    /**
     * Update visible items
     * @private
     */
    update() {
        if (this.items.length === 0) {
            this.spacerTop.style.height = '0px';
            this.spacerBottom.style.height = '0px';
            // Clear existing items
            const existingItems = this.content.querySelectorAll('.virtual-list-item');
            existingItems.forEach(item => item.remove());
            return;
        }
        
        const range = this.calculateVisibleRange();
        this.visibleRange = range;
        
        // Update spacers
        const topHeight = range.start * this.itemHeight;
        const bottomHeight = (this.items.length - range.end) * this.itemHeight;
        
        this.spacerTop.style.height = `${topHeight}px`;
        this.spacerBottom.style.height = `${bottomHeight}px`;
        
        // Remove items outside visible range
        const existingItems = this.content.querySelectorAll('.virtual-list-item');
        existingItems.forEach((item, index) => {
            const itemIndex = parseInt(item.dataset.index);
            if (itemIndex < range.start || itemIndex >= range.end) {
                item.remove();
            }
        });
        
        // Add/update visible items
        const fragment = document.createDocumentFragment();
        for (let i = range.start; i < range.end; i++) {
            // Check if item already exists
            const existingItem = this.content.querySelector(`[data-index="${i}"]`);
            if (existingItem) {
                // Update existing item
                const newItem = this.renderItem(this.items[i], i);
                newItem.className = 'virtual-list-item';
                newItem.dataset.index = i;
                existingItem.replaceWith(newItem);
            } else {
                // Create new item
                const item = this.renderItem(this.items[i], i);
                item.className = 'virtual-list-item';
                item.dataset.index = i;
                fragment.appendChild(item);
            }
        }
        
        // Insert fragment after spacer top
        if (fragment.childNodes.length > 0) {
            this.spacerTop.after(fragment);
        }
    }
    
    /**
     * Scroll to specific item index
     * @param {number} index - Item index to scroll to
     * @param {string} align - 'start', 'center', 'end' (default: 'start')
     */
    scrollTo(index, align = 'start') {
        if (index < 0 || index >= this.items.length) return;
        
        let scrollTop = index * this.itemHeight;
        
        if (align === 'center') {
            const containerHeight = this.wrapper.clientHeight;
            scrollTop = scrollTop - (containerHeight / 2) + (this.itemHeight / 2);
        } else if (align === 'end') {
            const containerHeight = this.wrapper.clientHeight;
            scrollTop = scrollTop - containerHeight + this.itemHeight;
        }
        
        this.wrapper.scrollTop = Math.max(0, scrollTop);
        this.update();
    }
    
    /**
     * Get currently visible item range
     * @returns {Object} { start, end } indices
     */
    getVisibleRange() {
        return { ...this.visibleRange };
    }
    
    /**
     * Get total height of all items
     * @returns {number} Total height in pixels
     */
    getTotalHeight() {
        return this.items.length * this.itemHeight;
    }
    
    /**
     * Update item height (useful if items have variable heights)
     * @param {number} newHeight - New item height
     */
    setItemHeight(newHeight) {
        this.itemHeight = newHeight;
        this.update();
    }
    
    /**
     * Cleanup and remove event listeners
     */
    destroy() {
        if (this.scrollHandler) {
            this.wrapper.removeEventListener('scroll', this.scrollHandler);
        }
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.container && this.wrapper) {
            this.container.removeChild(this.wrapper);
        }
    }
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VirtualList };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.VirtualList = VirtualList;
}
