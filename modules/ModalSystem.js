// Modal System - Manages modal display and interaction
class ModalSystem {
    constructor(eventSystem, stateManager) {
        this.eventSystem = eventSystem;
        this.stateManager = stateManager;
        this.currentModal = null;
        this.modalElement = document.getElementById('modal');
        this.settingsModalElement = document.getElementById('settings-modal');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Modal close handlers
        if (this.modalElement) {
            const backdrop = this.modalElement.querySelector('.modal-backdrop');
            const cancelBtn = document.getElementById('modal-cancel');
            const saveBtn = document.getElementById('modal-save');
            
            if (backdrop) {
                backdrop.addEventListener('click', () => this.cancelModal());
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.cancelModal());
            }
            
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveModal());
            }
            
            // Enter key to save
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && this.isOpen() && !e.target.closest('textarea')) {
                    e.preventDefault();
                    this.saveModal();
                }
            });
        }
        
        // Settings modal close handlers (use event delegation since content is dynamic)
        if (this.settingsModalElement) {
            const settingsBackdrop = this.settingsModalElement.querySelector('.modal-backdrop');
            const modalContent = this.settingsModalElement.querySelector('.modal-content');
            
            // Use event delegation for close button and backdrop
            const modalClickHandler = (e) => {
                // Close button click
                if (e.target.id === 'settings-close' || e.target.closest('#settings-close')) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Settings close button clicked');
                    this.closeSettingsModal();
                    return;
                }
                
                // Backdrop click - if click is NOT on modal-content or its children, close modal
                if (modalContent && !modalContent.contains(e.target)) {
                    // Click is outside modal-content, so close
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Settings backdrop clicked (outside modal-content)', { 
                        target: e.target, 
                        targetTag: e.target.tagName,
                        targetClass: e.target.className,
                        isBackdrop: e.target === settingsBackdrop,
                        isModal: e.target === this.settingsModalElement
                    });
                    this.closeSettingsModal();
                    return;
                }
            };
            
            if (typeof window !== 'undefined' && window.eventListenerManager) {
                window.eventListenerManager.add(this.settingsModalElement, 'click', modalClickHandler);
            } else {
                this.settingsModalElement.addEventListener('click', modalClickHandler);
            }
            
            // Also attach directly to backdrop as fallback
            if (settingsBackdrop) {
                const backdropHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Settings backdrop direct click');
                    this.closeSettingsModal();
                };
                if (typeof window !== 'undefined' && window.eventListenerManager) {
                    window.eventListenerManager.add(settingsBackdrop, 'click', backdropHandler);
                } else {
                    settingsBackdrop.addEventListener('click', backdropHandler);
                }
            }
        }
    }
    
    // Open modal
    openModal(type, data) {
        if (this.currentModal) {
            this.closeModal();
        }
        
        this.currentModal = {
            type: type,
            data: data,
            visible: true
        };
        
        if (this.modalElement) {
            this.modalElement.classList.add('active');
        }
        
        this.eventSystem.emit(EventType.MODAL_OPENED, {
            source: 'ModalSystem',
            data: { type, data }
        });
    }
    
    // Close modal
    closeModal() {
        if (this.currentModal) {
            const type = this.currentModal.type;
            const data = this.currentModal.data;
            
            this.currentModal = null;
            
            if (this.modalElement) {
                this.modalElement.classList.remove('active');
            }
            
            this.eventSystem.emit(EventType.MODAL_CLOSED, {
                source: 'ModalSystem',
                data: { type, data }
            });
        }
    }
    
    // Save modal (triggers validation and save)
    saveModal() {
        if (!this.currentModal) return;
        
        const type = this.currentModal.type;
        const data = this.currentModal.data;
        
        // Validate and save (implementation depends on modal type)
        const isValid = this.validateModal(type, data);
        
        if (isValid) {
            this.eventSystem.emit(EventType.MODAL_SAVED, {
                source: 'ModalSystem',
                data: { type, data }
            });
            
            this.closeModal();
        }
    }
    
    // Cancel modal
    cancelModal() {
        if (!this.currentModal) return;
        
        const type = this.currentModal.type;
        const data = this.currentModal.data;
        
        this.eventSystem.emit(EventType.MODAL_CANCELLED, {
            source: 'ModalSystem',
            data: { type, data }
        });
        
        this.closeModal();
    }
    
    // Check if modal is open
    isOpen() {
        return this.currentModal !== null && this.currentModal.visible;
    }
    
    // Get current modal
    getCurrentModal() {
        return this.currentModal ? { ...this.currentModal } : null;
    }
    
    // Validate modal data
    validateModal(type, data) {
        // Basic validation - can be extended per modal type
        if (type === 'edit' || type === 'add-element') {
            // Validate element data
            if (!data || !data.text) {
                return false; // Text is required
            }
        }
        return true;
    }
    
    // Open settings modal
    openSettingsModal() {
        console.log('ModalSystem.openSettingsModal called', { settingsModalElement: this.settingsModalElement });
        if (this.settingsModalElement) {
            // Ensure modal is visible
            this.settingsModalElement.style.display = 'flex';
            this.settingsModalElement.classList.add('active');
            console.log('Settings modal active class added', { 
                hasActive: this.settingsModalElement.classList.contains('active'),
                display: this.settingsModalElement.style.display,
                computedDisplay: window.getComputedStyle(this.settingsModalElement).display
            });
            
            this.eventSystem.emit(EventType.MODAL_OPENED, {
                source: 'ModalSystem',
                data: { type: 'settings' }
            });
        } else {
            console.error('Settings modal element not found!');
        }
    }
    
    // Close settings modal
    closeSettingsModal() {
        console.log('ModalSystem.closeSettingsModal called', { settingsModalElement: this.settingsModalElement });
        if (this.settingsModalElement) {
            // Remove inline display style if set
            this.settingsModalElement.style.display = '';
            this.settingsModalElement.classList.remove('active');
            console.log('Settings modal closed', { 
                hasActive: this.settingsModalElement.classList.contains('active'),
                display: window.getComputedStyle(this.settingsModalElement).display
            });
            this.eventSystem.emit(EventType.MODAL_CLOSED, {
                source: 'ModalSystem',
                data: { type: 'settings' }
            });
        } else {
            console.error('Settings modal element not found when trying to close!');
        }
    }
    
    // Check if settings modal is open
    isSettingsOpen() {
        return this.settingsModalElement && this.settingsModalElement.classList.contains('active');
    }
}

