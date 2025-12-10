// Pointer Tracker - Tracks pointer position and movement across input methods
class PointerTracker {
    constructor() {
        this.currentPosition = null;
        this.isPressed = false;
        this.pressStartPosition = null;
        this.pressStartTime = null;
        this.lastPosition = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Mouse events
        document.addEventListener('mousedown', (e) => this.handlePointerDown(e));
        document.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        document.addEventListener('mouseup', (e) => this.handlePointerUp(e));
        
        // Touch events
        document.addEventListener('touchstart', (e) => this.handlePointerDown(e.touches[0] || e));
        document.addEventListener('touchmove', (e) => {
            e.preventDefault(); // Prevent scrolling
            this.handlePointerMove(e.touches[0] || e);
        });
        document.addEventListener('touchend', (e) => this.handlePointerUp(e.changedTouches[0] || e));
        document.addEventListener('touchcancel', (e) => this.handlePointerUp(e.changedTouches[0] || e));
        
        // Pointer events (if supported)
        if (window.PointerEvent) {
            document.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
            document.addEventListener('pointermove', (e) => this.handlePointerMove(e));
            document.addEventListener('pointerup', (e) => this.handlePointerUp(e));
        }
    }
    
    handlePointerDown(event) {
        const position = this.getEventPosition(event);
        this.isPressed = true;
        this.pressStartPosition = position;
        this.pressStartTime = Date.now();
        this.currentPosition = position;
        this.lastPosition = position;
    }
    
    handlePointerMove(event) {
        const position = this.getEventPosition(event);
        this.currentPosition = position;
        this.lastPosition = position;
    }
    
    handlePointerUp(event) {
        this.isPressed = false;
        // Keep current position for reference, but clear press state
    }
    
    getEventPosition(event) {
        return {
            x: event.clientX || event.pageX || 0,
            y: event.clientY || event.pageY || 0
        };
    }
    
    // Get current pointer position
    getPosition() {
        return this.currentPosition ? { ...this.currentPosition } : null;
    }
    
    // Check if pointer is currently pressed
    isPointerDown() {
        return this.isPressed;
    }
    
    // Get duration since press started (in milliseconds)
    getPressDuration() {
        if (!this.pressStartTime) {
            return 0;
        }
        return Date.now() - this.pressStartTime;
    }
    
    // Get movement distance from press start position
    getMovementDistance() {
        if (!this.pressStartPosition || !this.currentPosition) {
            return 0;
        }
        const dx = this.currentPosition.x - this.pressStartPosition.x;
        const dy = this.currentPosition.y - this.pressStartPosition.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Reset tracker state
    reset() {
        this.isPressed = false;
        this.pressStartPosition = null;
        this.pressStartTime = null;
        // Keep currentPosition and lastPosition for reference
    }
    
    // Get press start position
    getPressStartPosition() {
        return this.pressStartPosition ? { ...this.pressStartPosition } : null;
    }
}

