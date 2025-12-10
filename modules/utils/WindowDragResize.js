// WindowDragResize - Generic drag and resize functionality for any DOM element
// Pure utility functions, no dependencies

/**
 * Makes an element draggable
 * @param {HTMLElement} element - The element to make draggable
 * @param {HTMLElement} handleElement - The element to use as drag handle (default: element itself)
 * @param {object} options - Options object
 * @param {string} options.storageKey - Optional localStorage key to save position
 * @param {function} options.onDragStart - Callback when drag starts
 * @param {function} options.onDrag - Callback during drag
 * @param {function} options.onDragEnd - Callback when drag ends
 * @param {object} options.bounds - Bounds object { minX, maxX, minY, maxY }
 * @returns {function} Cleanup function to remove drag listeners
 */
export function makeDraggable(element, handleElement = null, options = {}) {
    if (!element) return () => {};
    
    const handle = handleElement || element;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;
    
    const onMouseDown = (e) => {
        // Only start drag on left mouse button
        if (e.button !== 0) return;
        
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        // Get current position
        const rect = element.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        
        // Prevent text selection during drag
        e.preventDefault();
        document.body.style.userSelect = 'none';
        
        if (options.onDragStart) {
            options.onDragStart({ x: initialX, y: initialY });
        }
    };
    
    const onMouseMove = (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newX = initialX + deltaX;
        let newY = initialY + deltaY;
        
        // Apply bounds if provided
        if (options.bounds) {
            if (options.bounds.minX !== undefined) newX = Math.max(newX, options.bounds.minX);
            if (options.bounds.maxX !== undefined) newX = Math.min(newX, options.bounds.maxX);
            if (options.bounds.minY !== undefined) newY = Math.max(newY, options.bounds.minY);
            if (options.bounds.maxY !== undefined) newY = Math.min(newY, options.bounds.maxY);
        }
        
        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
        
        if (options.onDrag) {
            options.onDrag({ x: newX, y: newY });
        }
    };
    
    const onMouseUp = () => {
        if (!isDragging) return;
        
        isDragging = false;
        document.body.style.userSelect = '';
        
        const rect = element.getBoundingClientRect();
        const position = { x: rect.left, y: rect.top };
        
        // Save position if storage key provided
        if (options.storageKey) {
            savePosition(element, options.storageKey);
        }
        
        if (options.onDragEnd) {
            options.onDragEnd(position);
        }
    };
    
    handle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    // Return cleanup function
    return () => {
        handle.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };
}

/**
 * Makes an element resizable
 * @param {HTMLElement} element - The element to make resizable
 * @param {object} options - Options object
 * @param {string} options.storageKey - Optional localStorage key to save size
 * @param {function} options.onResizeStart - Callback when resize starts
 * @param {function} options.onResize - Callback during resize
 * @param {function} options.onResizeEnd - Callback when resize ends
 * @param {object} options.minSize - Minimum size { width, height }
 * @param {object} options.maxSize - Maximum size { width, height }
 * @returns {function} Cleanup function to remove resize listeners
 */
export function makeResizable(element, options = {}) {
    if (!element) return () => {};
    
    // Ensure element is positioned
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.position === 'static') {
        element.style.position = 'absolute';
    }
    
    // Create resize handles (corners and edges)
    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    const handleElements = [];
    
    handles.forEach(handle => {
        const handleEl = document.createElement('div');
        handleEl.className = `resize-handle resize-handle-${handle}`;
        handleEl.style.cssText = `
            position: absolute;
            background: transparent;
            z-index: 1000;
        `;
        
        // Set handle size and position
        if (handle.includes('n') || handle.includes('s')) {
            handleEl.style.height = '4px';
            handleEl.style.width = '100%';
            handleEl.style.cursor = handle.includes('n') ? 'ns-resize' : 'ns-resize';
            handleEl.style[handle.includes('n') ? 'top' : 'bottom'] = '0';
        }
        if (handle.includes('e') || handle.includes('w')) {
            handleEl.style.width = '4px';
            handleEl.style.height = '100%';
            handleEl.style.cursor = handle.includes('e') ? 'ew-resize' : 'ew-resize';
            handleEl.style[handle.includes('e') ? 'right' : 'left'] = '0';
        }
        if (handle.length === 2) {
            handleEl.style.width = '8px';
            handleEl.style.height = '8px';
            if (handle === 'nw') {
                handleEl.style.cursor = 'nwse-resize';
                handleEl.style.top = '0';
                handleEl.style.left = '0';
            } else if (handle === 'ne') {
                handleEl.style.cursor = 'nesw-resize';
                handleEl.style.top = '0';
                handleEl.style.right = '0';
            } else if (handle === 'se') {
                handleEl.style.cursor = 'nwse-resize';
                handleEl.style.bottom = '0';
                handleEl.style.right = '0';
            } else if (handle === 'sw') {
                handleEl.style.cursor = 'nesw-resize';
                handleEl.style.bottom = '0';
                handleEl.style.left = '0';
            }
        }
        
        element.appendChild(handleEl);
        handleElements.push({ element: handleEl, type: handle });
    });
    
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;
    let startLeft = 0;
    let startTop = 0;
    let resizeType = '';
    
    const onMouseDown = (e, type) => {
        if (e.button !== 0) return;
        
        isResizing = true;
        resizeType = type;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = element.getBoundingClientRect();
        startWidth = rect.width;
        startHeight = rect.height;
        startLeft = rect.left;
        startTop = rect.top;
        
        e.preventDefault();
        document.body.style.userSelect = 'none';
        
        if (options.onResizeStart) {
            options.onResizeStart({ width: startWidth, height: startHeight });
        }
    };
    
    const onMouseMove = (e) => {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;
        
        // Calculate new dimensions based on resize type
        if (resizeType.includes('e')) {
            newWidth = startWidth + deltaX;
        }
        if (resizeType.includes('w')) {
            newWidth = startWidth - deltaX;
            newLeft = startLeft + deltaX;
        }
        if (resizeType.includes('s')) {
            newHeight = startHeight + deltaY;
        }
        if (resizeType.includes('n')) {
            newHeight = startHeight - deltaY;
            newTop = startTop + deltaY;
        }
        
        // Apply min/max constraints
        if (options.minSize) {
            if (options.minSize.width !== undefined) newWidth = Math.max(newWidth, options.minSize.width);
            if (options.minSize.height !== undefined) newHeight = Math.max(newHeight, options.minSize.height);
        }
        if (options.maxSize) {
            if (options.maxSize.width !== undefined) newWidth = Math.min(newWidth, options.maxSize.width);
            if (options.maxSize.height !== undefined) newHeight = Math.min(newHeight, options.maxSize.height);
        }
        
        // Apply constraints
        newWidth = Math.max(200, newWidth); // Minimum 200px
        newHeight = Math.max(200, newHeight); // Minimum 200px
        
        element.style.width = `${newWidth}px`;
        element.style.height = `${newHeight}px`;
        if (resizeType.includes('w')) element.style.left = `${newLeft}px`;
        if (resizeType.includes('n')) element.style.top = `${newTop}px`;
        
        if (options.onResize) {
            options.onResize({ width: newWidth, height: newHeight });
        }
    };
    
    const onMouseUp = () => {
        if (!isResizing) return;
        
        isResizing = false;
        document.body.style.userSelect = '';
        
        const rect = element.getBoundingClientRect();
        const size = { width: rect.width, height: rect.height };
        
        // Save size if storage key provided
        if (options.storageKey) {
            savePosition(element, options.storageKey);
        }
        
        if (options.onResizeEnd) {
            options.onResizeEnd(size);
        }
    };
    
    // Attach listeners to all handles
    handleElements.forEach(({ element: handleEl, type }) => {
        handleEl.addEventListener('mousedown', (e) => onMouseDown(e, type));
    });
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    // Return cleanup function
    return () => {
        handleElements.forEach(({ element: handleEl }) => {
            handleEl.removeEventListener('mousedown', onMouseDown);
            handleEl.remove();
        });
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };
}

/**
 * Saves element position to localStorage
 * @param {HTMLElement} element - The element
 * @param {string} storageKey - localStorage key
 */
export function savePosition(element, storageKey) {
    if (!element || !storageKey) return;
    
    const rect = element.getBoundingClientRect();
    const position = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
    };
    
    try {
        localStorage.setItem(storageKey, JSON.stringify(position));
    } catch (error) {
        console.warn('Failed to save position:', error);
    }
}

/**
 * Loads element position from localStorage
 * @param {HTMLElement} element - The element
 * @param {string} storageKey - localStorage key
 * @returns {boolean} True if position was loaded
 */
export function loadPosition(element, storageKey) {
    if (!element || !storageKey) return false;
    
    try {
        const data = localStorage.getItem(storageKey);
        if (!data) return false;
        
        const position = JSON.parse(data);
        
        if (position.x !== undefined) element.style.left = `${position.x}px`;
        if (position.y !== undefined) element.style.top = `${position.y}px`;
        if (position.width !== undefined) element.style.width = `${position.width}px`;
        if (position.height !== undefined) element.style.height = `${position.height}px`;
        
        return true;
    } catch (error) {
        console.warn('Failed to load position:', error);
        return false;
    }
}

