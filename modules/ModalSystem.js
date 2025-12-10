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
        
        // Settings modal close handlers
        if (this.settingsModalElement) {
            const settingsClose = document.getElementById('settings-close');
            const settingsBackdrop = this.settingsModalElement.querySelector('.modal-backdrop');
            
            if (settingsClose) {
                settingsClose.addEventListener('click', () => this.closeSettingsModal());
            }
            
            if (settingsBackdrop) {
                settingsBackdrop.addEventListener('click', () => this.closeSettingsModal());
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
        if (this.settingsModalElement) {
            this.settingsModalElement.classList.add('active');
            this.eventSystem.emit(EventType.MODAL_OPENED, {
                source: 'ModalSystem',
                data: { type: 'settings' }
            });
        }
    }
    
    // Close settings modal
    closeSettingsModal() {
        if (this.settingsModalElement) {
            this.settingsModalElement.classList.remove('active');
            this.eventSystem.emit(EventType.MODAL_CLOSED, {
                source: 'ModalSystem',
                data: { type: 'settings' }
            });
        }
    }
    
    // Check if settings modal is open
    isSettingsOpen() {
        return this.settingsModalElement && this.settingsModalElement.classList.contains('active');
    }
}

