// Drag and Drop Handler - Handles drag-and-drop operations for pages and elements
class DragDropHandler {
    constructor(eventSystem, stateManager, pointerTracker, errorHandler = null) {
        this.eventSystem = eventSystem;
        this.stateManager = stateManager;
        this.pointerTracker = pointerTracker;
        this.errorHandler = errorHandler;
        this.dragState = null;
        this.dragThreshold = 5; // pixels
        this.dragOverElements = new Set();
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Use HTML5 drag and drop API for better browser support
        const pagesContainer = document.getElementById('pages-container');
        if (pagesContainer) {
            pagesContainer.addEventListener('dragover', (e) => this.handleDragOver(e));
            pagesContainer.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            pagesContainer.addEventListener('drop', (e) => this.handleDrop(e));
        }
    }
    
    // Start drag operation (called from element/page when drag starts)
    startDrag(type, sourceId, sourcePageId = null, sourceIndex = null, element = null) {
        const position = this.pointerTracker.getPosition() || { x: 0, y: 0 };
        
        this.dragState = {
            type: type, // 'element' or 'page'
            sourceId: sourceId,
            sourceIndex: sourceIndex,
            sourcePageId: sourcePageId,
            startPosition: { ...position },
            currentPosition: { ...position },
            draggedElement: element
        };
        
        this.eventSystem.emit(EventType.DRAG_STARTED, {
            source: 'DragDropHandler',
            data: { dragState: this.dragState }
        });
    }
    
    // Update drag position (called during drag)
    updateDrag(position) {
        if (!this.dragState) return;
        
        this.dragState.currentPosition = { ...position };
        
        this.eventSystem.emit(EventType.DRAG_MOVED, {
            source: 'DragDropHandler',
            data: { dragState: this.dragState }
        });
    }
    
    // End drag operation
    endDrag(position, target = null) {
        if (!this.dragState) return;
        
        const success = target && target.isValid;
        
        if (success) {
            this.executeDrop(target);
        } else {
            this.cancelDrag();
        }
        
        this.eventSystem.emit(EventType.DRAG_ENDED, {
            source: 'DragDropHandler',
            data: { success, dragState: this.dragState, target }
        });
        
        this.dragState = null;
        this.clearDragOverClasses();
    }
    
    // Cancel drag operation
    cancelDrag() {
        if (!this.dragState) return;
        
        this.dragState = null;
        this.clearDragOverClasses();
    }
    
    // Check if currently dragging
    isDragging() {
        return this.dragState !== null;
    }
    
    // Handle HTML5 dragover event
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        
        // Get drag data
        let dragData = null;
        try {
            const dataStr = e.dataTransfer.getData('text/plain');
            if (dataStr) {
                dragData = JSON.parse(dataStr);
            }
        } catch (err) {
            if (this.errorHandler) {
                this.errorHandler.handleError(err, {
                    source: 'DragDropHandler',
                    operation: 'handleDrop'
                });
            } else {
                console.error('Failed to parse drag data:', err);
            }
            return;
        }
        
        if (!dragData) return;
        
        // Find drop target
        const target = this.findDropTarget(e, dragData);
        
        // Update visual feedback
        this.updateDragOverFeedback(e, dragData, target);
    }
    
    // Handle HTML5 dragleave event
    handleDragLeave(e) {
        const pagesContainer = document.getElementById('pages-container');
        if (pagesContainer && !pagesContainer.contains(e.relatedTarget)) {
            this.clearDragOverClasses();
        }
    }
    
    // Handle HTML5 drop event
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Get drag data
        let dragData = null;
        try {
            const dataStr = e.dataTransfer.getData('text/plain');
            if (dataStr) {
                dragData = JSON.parse(dataStr);
            }
        } catch (err) {
            if (this.errorHandler) {
                this.errorHandler.handleError(err, {
                    source: 'DragDropHandler',
                    operation: 'handleDrop'
                });
            } else {
                console.error('Failed to parse drag data:', err);
            }
            return;
        }
        
        if (!dragData) return;
        
        // Find drop target
        const target = this.findDropTarget(e, dragData);
        const position = { x: e.clientX, y: e.clientY };
        
        this.endDrag(position, target);
        this.clearDragOverClasses();
    }
    
    // Find drop target from event
    findDropTarget(event, dragData) {
        const position = { x: event.clientX, y: event.clientY };
        
        if (dragData.type === 'page') {
            const pageEl = event.target.closest('.page');
            if (pageEl) {
                const targetPageId = pageEl.dataset.pageId;
                return {
                    type: 'page',
                    pageId: targetPageId,
                    elementIndex: null,
                    position: position,
                    isValid: targetPageId !== dragData.pageId // Can't drop on itself
                };
            } else {
                // Drop on container (move to end)
                return {
                    type: 'container',
                    pageId: null,
                    elementIndex: null,
                    position: position,
                    isValid: true
                };
            }
        } else if (dragData.type === 'element') {
            // Check if dropping over a subtask
            const subtaskEl = event.target.closest('.subtask');
            if (subtaskEl) {
                // Find the parent element that contains this subtask
                const parentElementEl = subtaskEl.closest('.element');
                const pageEl = event.target.closest('.page');
                
                if (parentElementEl && pageEl) {
                    const targetPageId = pageEl.dataset.pageId;
                    const targetElementIndex = parseInt(parentElementEl.dataset.elementIndex) || 0;
                    
                    return {
                        type: 'subtask',
                        pageId: targetPageId,
                        elementIndex: targetElementIndex,
                        position: position,
                        isValid: true // Always valid to nest as subtask
                    };
                }
            }
            
            const elementEl = event.target.closest('.element');
            const pageEl = event.target.closest('.page');
            
            if (elementEl && pageEl) {
                const targetPageId = pageEl.dataset.pageId;
                const targetElementIndex = parseInt(elementEl.dataset.elementIndex) || 0;
                
                return {
                    type: 'element',
                    pageId: targetPageId,
                    elementIndex: targetElementIndex,
                    position: position,
                    isValid: !(targetPageId === dragData.pageId && targetElementIndex === dragData.elementIndex)
                };
            } else if (pageEl) {
                // Drop on page (move to end of page)
                const targetPageId = pageEl.dataset.pageId;
                return {
                    type: 'page',
                    pageId: targetPageId,
                    elementIndex: null,
                    position: position,
                    isValid: true
                };
            }
        }
        
        return {
            type: 'container',
            pageId: null,
            elementIndex: null,
            position: position,
            isValid: false
        };
    }
    
    // Update visual feedback during drag
    updateDragOverFeedback(event, dragData, target) {
        this.clearDragOverClasses();
        
        if (!target || !target.isValid) return;
        
        if (dragData.type === 'page') {
            const pageEl = event.target.closest('.page');
            const pagesContainer = document.getElementById('pages-container');
            
            if (pageEl) {
                pageEl.classList.add('drag-over');
                this.dragOverElements.add(pageEl);
            } else if (pagesContainer) {
                pagesContainer.classList.add('drag-over');
                this.dragOverElements.add(pagesContainer);
            }
        } else if (dragData.type === 'element') {
            // If dropping on subtask, highlight the parent element
            if (target.type === 'subtask') {
                const subtaskEl = event.target.closest('.subtask');
                if (subtaskEl) {
                    const parentElementEl = subtaskEl.closest('.element');
                    if (parentElementEl) {
                        parentElementEl.classList.add('drag-over');
                        this.dragOverElements.add(parentElementEl);
                    }
                }
            } else {
                const elementEl = event.target.closest('.element');
                if (elementEl) {
                    elementEl.classList.add('drag-over');
                    this.dragOverElements.add(elementEl);
                }
            }
        }
    }
    
    // Clear drag-over visual feedback
    clearDragOverClasses() {
        this.dragOverElements.forEach(el => {
            el.classList.remove('drag-over');
        });
        this.dragOverElements.clear();
        
        const pagesContainer = document.getElementById('pages-container');
        if (pagesContainer) {
            pagesContainer.classList.remove('drag-over');
        }
    }
    
    // Execute the drop operation
    executeDrop(target) {
        if (!this.dragState) return;
        
        if (this.dragState.type === 'page') {
            this.handlePageDrop(target);
        } else if (this.dragState.type === 'element') {
            this.handleElementDrop(target);
        }
    }
    
    // Handle page drop
    handlePageDrop(target) {
        const sourcePageId = this.dragState.sourceId;
        const state = this.stateManager.getState();
        const sourceIndex = state.pages.findIndex(p => p.id === sourcePageId);
        
        if (sourceIndex === -1) return;
        
        if (target.type === 'page' && target.pageId) {
            // Move page before target page
            const targetIndex = state.pages.findIndex(p => p.id === target.pageId);
            if (targetIndex === -1) return;
            
            const pageIds = state.pages.map(p => p.id);
            const sourcePage = pageIds.splice(sourceIndex, 1)[0];
            const insertIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
            pageIds.splice(insertIndex, 0, sourcePage);
            
            this.stateManager.reorderPages(pageIds);
        } else if (target.type === 'container') {
            // Move page to end
            const pageIds = state.pages.map(p => p.id);
            const sourcePage = pageIds.splice(sourceIndex, 1)[0];
            pageIds.push(sourcePage);
            
            this.stateManager.reorderPages(pageIds);
        }
    }
    
    // Handle element drop
    handleElementDrop(target) {
        const sourcePageId = this.dragState.sourcePageId;
        const sourceIndex = this.dragState.sourceIndex;
        const state = this.stateManager.getState();
        
        const sourcePage = state.pages.find(p => p.id === sourcePageId);
        if (!sourcePage || !sourcePage.elements[sourceIndex]) return;
        
        if (target.type === 'subtask' && target.pageId && target.elementIndex !== null) {
            // Convert element to subtask and add to parent element
            const targetPage = state.pages.find(p => p.id === target.pageId);
            if (!targetPage) return;
            
            const parentElement = targetPage.elements[target.elementIndex];
            if (!parentElement) return;
            
            // Only task and header-checkbox elements can have subtasks
            if (parentElement.type !== 'task' && parentElement.type !== 'header-checkbox') {
                return;
            }
            
            // Get the source element
            const sourceElement = sourcePage.elements[sourceIndex];
            
            // Convert element to subtask format
            const subtask = {
                text: sourceElement.text || '',
                timeAllocated: sourceElement.timeAllocated || '',
                repeats: sourceElement.repeats !== false,
                completed: sourceElement.completed || false
            };
            
            // Initialize subtasks array if needed
            if (!parentElement.subtasks) {
                parentElement.subtasks = [];
            }
            
            // Add subtask to parent
            parentElement.subtasks.push(subtask);
            
            // Remove source element
            sourcePage.elements.splice(sourceIndex, 1);
            
            // Update state
            this.stateManager.setState({ pages: state.pages });
            
        } else if (target.type === 'element' && target.pageId && target.elementIndex !== null) {
            // Move element to specific position
            const targetPage = state.pages.find(p => p.id === target.pageId);
            if (!targetPage) return;
            
            if (sourcePageId === target.pageId) {
                // Same page reorder
                const elementIndices = targetPage.elements.map((_, i) => i);
                const sourceElement = elementIndices.splice(sourceIndex, 1)[0];
                const insertIndex = sourceIndex < target.elementIndex ? target.elementIndex - 1 : target.elementIndex;
                elementIndices.splice(insertIndex, 0, sourceElement);
                this.stateManager.reorderElements(target.pageId, elementIndices);
            } else {
                // Move to different page
                const element = sourcePage.elements[sourceIndex];
                this.stateManager.removeElement(sourcePageId, sourceIndex);
                const targetPageAfter = this.stateManager.getPage(target.pageId);
                if (targetPageAfter) {
                    const newIndex = Math.min(target.elementIndex, targetPageAfter.elements.length);
                    // Insert at new position
                    const updatedElements = [...targetPageAfter.elements];
                    updatedElements.splice(newIndex, 0, element);
                    this.stateManager.updatePage(target.pageId, { elements: updatedElements });
                }
            }
        } else if (target.type === 'page' && target.pageId) {
            // Move element to end of target page
            const element = sourcePage.elements[sourceIndex];
            this.stateManager.removeElement(sourcePageId, sourceIndex);
            const targetPage = this.stateManager.getPage(target.pageId);
            if (targetPage) {
                this.stateManager.addElement(target.pageId, element);
            }
        }
    }
    
    // Create drag data for HTML5 drag and drop
    createDragData(type, pageId, elementIndex = null) {
        return JSON.stringify({
            type: type,
            pageId: pageId,
            elementIndex: elementIndex
        });
    }
}

