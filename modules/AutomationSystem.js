// Automation System - Watches directories for files and automates pipeline progression
class AutomationSystem {
    constructor(eventSystem, stateManager, automationOrchestrator = null, projectManager = null, errorHandler = null) {
        this.eventSystem = eventSystem;
        this.stateManager = stateManager;
        this.orchestrator = automationOrchestrator;
        this.projectManager = projectManager;
        this.errorHandler = errorHandler;
        this.isRunning = false;
        this.currentProjectId = null;
        this.currentSectionId = null;
        this.watchHandle = null;
        this.watchInterval = null;
        this.continuousCheckInterval = null;
        this.targetDirectory = null;
        this.fileWatchers = new Map(); // sectionId -> { files: [], waitTime: 0, stabilityTime: 0, timeout: null, fileStates: Map }
        this.fileStates = new Map(); // fileName -> { lastModified: timestamp, stableSince: timestamp, size: number }
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for automation start/stop events
        this.eventSystem.register(EventType.AUTOMATION_START, (event) => {
            this.start(event.data.projectId);
        });
        
        this.eventSystem.register(EventType.AUTOMATION_STOP, () => {
            this.stop();
        });
    }
    
    /**
     * Setup directory watching for automation
     * @private
     * @returns {Promise<boolean>} True if setup succeeded, false otherwise
     */
    async _setupDirectoryWatching(projectId, automationDir) {
        // Try to use server-side file watching if available
        // Otherwise fall back to File System Access API
        if (this.errorHandler) {
            const setupResult = await this.errorHandler.handleAsync(async () => {
                const serverWatchResult = await this.setupServerWatch(projectId, automationDir);
                if (serverWatchResult.success) {
                    this.targetDirectory = { type: 'server', path: automationDir, key: serverWatchResult.key };
                } else {
                    // Fallback to File System Access API
                    const directoryHandle = await this.requestDirectoryAccess();
                    if (!directoryHandle) {
                        return false; // User cancelled
                    }
                    this.targetDirectory = directoryHandle; // Store file handle for file watching
                }
                return true;
            }, { source: 'AutomationSystem', operation: 'setupDirectoryWatching', projectId });
            
            if (!setupResult.success) {
                // Try File System Access API as fallback
                const fallbackResult = await this.errorHandler.handleAsync(async () => {
                    const directoryHandle = await this.requestDirectoryAccess();
                    if (!directoryHandle) {
                        return false; // User cancelled
                    }
                    this.targetDirectory = directoryHandle;
                    return true;
                }, { source: 'AutomationSystem', operation: 'fallbackDirectoryAccess' });
                
                if (!fallbackResult.success) {
                    alert(this.errorHandler.getUserMessage(fallbackResult) || 'Failed to setup directory watching. Make sure the server supports file watching or your browser supports File System Access API.');
                    return false;
                }
            }
            return true;
        } else {
            // Fallback to original error handling
            try {
                const serverWatchResult = await this.setupServerWatch(projectId, automationDir);
                if (serverWatchResult.success) {
                    this.targetDirectory = { type: 'server', path: automationDir, key: serverWatchResult.key };
                } else {
                    // Fallback to File System Access API
                    const directoryHandle = await this.requestDirectoryAccess();
                    if (!directoryHandle) {
                        return false; // User cancelled
                    }
                    this.targetDirectory = directoryHandle; // Store file handle for file watching
                }
                return true;
            } catch (error) {
                if (this.errorHandler) {
                    this.errorHandler.handleError(error, {
                        source: 'AutomationSystem',
                        operation: '_setupDirectoryWatching',
                        projectId
                    });
                } else {
                    console.error('Failed to setup directory watching:', error);
                }
                // Try File System Access API as fallback
                try {
                    const directoryHandle = await this.requestDirectoryAccess();
                    if (!directoryHandle) {
                        return false; // User cancelled
                    }
                    this.targetDirectory = directoryHandle;
                    return true;
                } catch (fallbackError) {
                    alert('Failed to setup directory watching. Make sure the server supports file watching or your browser supports File System Access API.');
                    return false;
                }
            }
        }
    }
    
    /**
     * Start automation for a specific section
     * @private
     * @returns {Promise<boolean>} True if started successfully, false otherwise
     */
    async _startAutomationForSection(projectId, startingSection) {
        if (this.errorHandler) {
            const startResult = await this.errorHandler.handleAsync(async () => {
                this.currentProjectId = projectId;
                this.currentSectionId = startingSection.sectionId;
                this.isRunning = true;
                
                // Start watching for current section
                await this.watchForSection(projectId, startingSection.sectionId);
                
                // Set up continuous checking every minute for all sections
                this.setupContinuousCheck(projectId);
                
                this.eventSystem.emit(EventType.AUTOMATION_STARTED, {
                    source: 'AutomationSystem',
                    data: { projectId, sectionId: startingSection.sectionId }
                });
            }, { source: 'AutomationSystem', operation: 'start', projectId });
            
            if (!startResult.success) {
                alert(this.errorHandler.getUserMessage(startResult) || 'Failed to start automation: ' + startResult.error);
                this.isRunning = false;
                return false;
            }
            return true;
        } else {
            // Fallback to original error handling
            try {
                this.currentProjectId = projectId;
                this.currentSectionId = startingSection.sectionId;
                this.isRunning = true;
                
                // Start watching for current section
                await this.watchForSection(projectId, startingSection.sectionId);
                
                // Set up continuous checking every minute for all sections
                this.setupContinuousCheck(projectId);
                
                this.eventSystem.emit(EventType.AUTOMATION_STARTED, {
                    source: 'AutomationSystem',
                    data: { projectId, sectionId: startingSection.sectionId }
                });
                return true;
            } catch (error) {
                if (this.errorHandler) {
                    const errorResult = this.errorHandler.handleError(error, {
                        source: 'AutomationSystem',
                        operation: '_startAutomationForSection',
                        projectId
                    });
                    this.errorHandler.showUserNotification(error, {
                        source: 'AutomationSystem',
                        operation: '_startAutomationForSection',
                        projectId
                    }, {
                        severity: ErrorHandler.Severity.ERROR,
                        title: 'Failed to Start Automation'
                    });
                } else {
                    console.error('Failed to start automation:', error);
                    alert('Failed to start automation: ' + error.message);
                }
                this.isRunning = false;
                return false;
            }
        }
    }
    
    // Start automation for a project
    async start(projectId) {
        if (this.isRunning) {
            console.warn('Automation already running');
            return;
        }
        
        const project = this.stateManager.getProject(projectId);
        if (!project) {
            console.error('Project not found:', projectId);
            return;
        }
        
        // Find first incomplete section (or just start with first section for continuous monitoring)
        const firstIncomplete = project.sections.find(s => 
            s.status !== 'complete' && s.status !== 'skipped'
        );
        
        // If all sections are complete, still start automation for continuous monitoring
        // Just use the first section as the starting point
        const startingSection = firstIncomplete || project.sections[0];
        if (!startingSection) {
            alert('No sections found in project.');
            return;
        }
        
        // Check if directory is set in project (text-based)
        const automationDir = project.automationDirectory;
        if (!automationDir) {
            alert('Please set the automation directory in the Pipeline Flow view before starting automation.');
            return;
        }
        
        // Setup directory watching
        const directorySetupSuccess = await this._setupDirectoryWatching(projectId, automationDir);
        if (!directorySetupSuccess) {
            return;
        }
        
        // Start automation for section
        await this._startAutomationForSection(projectId, startingSection);
    }
    
    // Stop automation
    stop() {
        this.isRunning = false;
        
        // Stop server-side watchers
        if (this.targetDirectory && this.targetDirectory.type === 'server' && this.targetDirectory.key) {
            fetch('/api/stop-watch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: this.targetDirectory.key })
            }).catch(err => console.warn('Failed to stop server watcher:', err));
        }
        
        // Clear all watchers
        this.fileWatchers.forEach(watcher => {
            if (watcher.timeout) {
                clearTimeout(watcher.timeout);
            }
            if (watcher.stabilityTimeout) {
                clearTimeout(watcher.stabilityTimeout);
            }
        });
        this.fileWatchers.clear();
        this.fileStates.clear();
        
        if (this.watchInterval) {
            clearInterval(this.watchInterval);
            this.watchInterval = null;
        }
        
        if (this.continuousCheckInterval) {
            clearInterval(this.continuousCheckInterval);
            this.continuousCheckInterval = null;
        }
        
        this.currentProjectId = null;
        this.currentSectionId = null;
        this.targetDirectory = null;
        
        this.eventSystem.emit(EventType.AUTOMATION_STOPPED, {
            source: 'AutomationSystem',
            data: {}
        });
    }
    
    // Setup continuous checking every minute for all sections
    setupContinuousCheck(projectId) {
        // Clear any existing interval
        if (this.continuousCheckInterval) {
            clearInterval(this.continuousCheckInterval);
        }
        
        // Check all sections immediately
        this.checkAllSections(projectId);
        
        // Then check every 2 minutes
        this.continuousCheckInterval = setInterval(() => {
            if (this.isRunning && this.currentProjectId === projectId) {
                this.checkAllSections(projectId);
            }
        }, AppConstants.TIMEOUTS.CONTINUOUS_CHECK_INTERVAL);
    }
    
    // Check all sections for complete files
    async checkAllSections(projectId) {
        if (!this.isRunning) return;
        
        const project = this.stateManager.getProject(projectId);
        if (!project || !project.automationDirectory) return;
        
        console.log('Checking all sections for complete files...');
        
        // Check each section for complete files (including completed ones for continuous updates)
        for (const section of project.sections) {
            // Ensure section has an automation ID
            if (!section.automationId) {
                // Generate default ID if missing (use app's method if available)
                if (this.projectManager && this.projectManager.generateDefaultAutomationId) {
                    const defaultId = this.projectManager.generateDefaultAutomationId(projectId, section.sectionId);
                    this.stateManager.updateSection(projectId, section.sectionId, { automationId: defaultId });
                    section.automationId = defaultId;
                } else {
                    // Fallback: simple random ID
                    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    let id = '';
                    for (let i = 0; i < 4; i++) {
                        id += chars.charAt(Math.floor(Math.random() * chars.length));
                    }
                    this.stateManager.updateSection(projectId, section.sectionId, { automationId: id });
                    section.automationId = id;
                }
            }
            
            // Get file watching instructions for this section
            const fileInstructions = await this.parseFileWatchingInstructions(section, projectId);
            if (!fileInstructions) {
                // Use default instructions
                // NOTE: Default completeFiles patterns are intentionally broad for backward compatibility
                // but section-specific pattern matching should prevent cross-contamination
                const defaultInstructions = {
                    directory: project.automationDirectory,
                    files: [...AppConstants.FILE_PATTERNS.EXTENSIONS],
                    completeFiles: [...AppConstants.FILE_PATTERNS.COMPLETE_PATTERNS], // Generic pattern - section-specific check should prevent misuse
                    waitTime: AppConstants.TIMEOUTS.FILE_WATCH_WAIT,
                    fileCount: 1
                };
                console.log(`[DIAG] Using default instructions with generic completeFiles patterns:`, defaultInstructions.completeFiles);
                await this.checkSectionForCompleteFiles(projectId, section.sectionId, defaultInstructions);
            } else {
                await this.checkSectionForCompleteFiles(projectId, section.sectionId, fileInstructions);
            }
        }
    }
    
    // Check a specific section for complete files
    /**
     * Log diagnostic information about section state and UI consistency
     * @private
     */
    _logSectionDiagnostics(sectionId, section, stepName, automationId) {
        console.log(`[DIAG] checkSectionForCompleteFiles - sectionId: ${sectionId}, stepName: ${stepName}, automationId: ${automationId}`);
        console.log(`[DIAG] Section object:`, {
            sectionId: section?.sectionId,
            stepName: section?.stepName,
            automationId: section?.automationId,
            hasStepName: !!section?.stepName,
            hasAutomationId: !!section?.automationId
        });
        
        // Verify UI matches state
        const uiInput = document.getElementById(`automation-id-${sectionId}`);
        if (uiInput) {
            const uiValue = uiInput.value || '';
            console.log(`[DIAG] UI automationId value: "${uiValue}", State automationId: "${automationId}", Match: ${uiValue === automationId}`);
            if (uiValue !== automationId) {
                console.warn(`[DIAG] ⚠ MISMATCH: UI shows "${uiValue}" but state has "${automationId}"`);
            }
        } else {
            console.log(`[DIAG] UI input element not found for section ${sectionId}`);
        }
    }
    
    /**
     * Match file name against complete file patterns
     * Checks section-specific patterns first, then generic patterns
     * @private
     * @returns {boolean} True if file matches any complete file pattern
     */
    _matchFilePattern(fileName, stepName, automationId, instructions) {
        const lowerFileName = fileName.toLowerCase();
        const lowerStepName = stepName.toLowerCase();
        
        // DIAGNOSTIC: Log pattern matching attempt
        console.log(`[DIAG] Pattern matching for file: ${fileName}`);
        console.log(`[DIAG] Section: stepName: ${stepName}, automationId: ${automationId}`);
        
        // First priority: Check for section-specific pattern with automation ID
        if (automationId) {
            const idPattern = `${lowerStepName}-${automationId.toLowerCase()}-complete`;
            const exactPattern = new RegExp(`^${idPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.md$`, 'i');
            const patternString = `^${idPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.md$`;
            console.log(`[DIAG] Testing section-specific pattern with ID: ${patternString}`);
            const testResult = exactPattern.test(fileName);
            console.log(`[DIAG] Pattern test result: ${testResult}`);
            if (testResult) {
                console.log(`[DIAG] ✓ File matches section pattern: ${fileName} for ${stepName} with ID ${automationId}`);
                return true;
            }
            console.log(`[DIAG] ✗ File does NOT match section pattern: ${fileName} (expected: ${stepName}-${automationId}-complete.md)`);
        }
        
        // Fallback: match patterns without ID for backward compatibility
        const exactPattern = new RegExp(`^${lowerStepName}-complete\\.md$`, 'i');
        const patternString = `^${lowerStepName}-complete\\.md$`;
        console.log(`[DIAG] Testing section-specific pattern without ID: ${patternString}`);
        const testResult = exactPattern.test(fileName);
        console.log(`[DIAG] Pattern test result: ${testResult}`);
        if (testResult) {
            console.log(`[DIAG] ✓ File matches section pattern (no ID): ${fileName} for ${stepName}`);
            return true;
        }
        
        // Last resort: check generic patterns from instructions
        console.log(`[DIAG] Section-specific pattern didn't match, checking generic patterns:`, instructions.completeFiles);
        
        // First check if file starts with step name (for files like "research-findings-complete.md")
        const stepNamePrefixPattern = new RegExp(`^${lowerStepName}-.*-complete\\.md$`, 'i');
        if (stepNamePrefixPattern.test(fileName)) {
            console.log(`[DIAG] ✓ File matches step name prefix pattern: ${fileName} for ${stepName}`);
            return true;
        }
        
        // Check generic patterns from instructions
        const matchesGeneric = instructions.completeFiles.some(expected => {
            let pattern;
            if (expected.includes('*')) {
                pattern = new RegExp('^' + expected.replace(/\*/g, '.*') + '$');
            } else {
                const lowerExpected = expected.toLowerCase();
                // Use includes matching for non-regex patterns
                const matches = lowerFileName.includes(lowerExpected) || 
                               lowerExpected.includes(lowerFileName) || 
                               lowerFileName === lowerExpected;
                console.log(`[DIAG] Generic pattern test: "${expected}" -> ${matches}`);
                return matches;
            }
            const patternString = pattern.toString();
            const testResult = pattern.test(fileName);
            console.log(`[DIAG] Generic regex pattern test: ${patternString} -> ${testResult}`);
            return testResult;
        });
        
        if (matchesGeneric) {
            console.log(`[DIAG] ⚠ File matched GENERIC pattern (not section-specific): ${fileName}`);
            return true;
        }
        
        console.log(`[DIAG] ✗ Final decision: NOT processing file ${fileName} (no match)`);
        return false;
    }
    
    /**
     * Check server directory for complete files matching section patterns
     * @private
     * @returns {Promise<boolean>} True if a complete file was found and processed
     */
    async _checkServerFiles(checkDir, projectId, sectionId, stepName, automationId, instructions) {
        try {
            const response = await fetch('/api/list-files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ directory: checkDir })
            });
            
            if (!response.ok) {
                // Gracefully handle errors - directory might not exist or server issue
                if (response.status === 404) {
                    // Directory doesn't exist or endpoint not found - continue gracefully
                    return false;
                }
                console.warn(`Server error checking files for ${sectionId}: ${response.status}`);
                return false;
            }
            
            const result = await response.json();
            // Server wraps response in { success: true, data: { success: true, files: [...] } }
            const files = (result.data && result.data.files) || result.files || [];
            
            if (!result.success || !files || files.length === 0) {
                // No files found or error - continue gracefully
                if (result && result.error) {
                    console.warn(`No files found for ${sectionId}:`, result.error);
                }
                return false;
            }
            
            // Check if any complete files exist
            for (const file of files) {
                const fileName = file.name;
                
                if (this._matchFilePattern(fileName, stepName, automationId, instructions)) {
                    // Found a complete file - process it
                    console.log(`[DIAG] ✓ Final decision: Processing file ${fileName} for section ${sectionId}`);
                    await this.processCompleteFile(projectId, sectionId, fileName, checkDir, instructions);
                    return true; // Only process one complete file per section
                }
            }
            
            return false;
        } catch (fetchError) {
            // Gracefully handle network or parsing errors
            if (this.errorHandler) {
                this.errorHandler.handleError(fetchError, { source: 'AutomationSystem', operation: 'checkFiles', sectionId });
            } else {
                console.warn(`Error checking files for ${sectionId}:`, fetchError.message);
            }
            return false;
        }
    }
    
    async checkSectionForCompleteFiles(projectId, sectionId, instructions) {
        if (!this.targetDirectory) return;
        
        try {
            // Determine directory to check
            let checkDir = instructions.directory;
            if (checkDir && checkDir.includes('{AUTOMATION_DIR}')) {
                const project = this.stateManager.getProject(projectId);
                checkDir = checkDir.replace('{AUTOMATION_DIR}', project?.automationDirectory || '');
            }
            checkDir = checkDir?.replace(/`/g, '').trim() || this.targetDirectory.path;
            
            // Get section to determine step name for pattern matching
            const project = this.stateManager.getProject(projectId);
            const section = project?.sections.find(s => s.sectionId === sectionId);
            if (!section) return;
            
            const stepName = section.stepName || sectionId;
            const automationId = section.automationId || '';
            
            // Log diagnostic information
            this._logSectionDiagnostics(sectionId, section, stepName, automationId);
            
            // Check for complete files (only server type supported in this method)
            if (this.targetDirectory.type === 'server') {
                await this._checkServerFiles(checkDir, projectId, sectionId, stepName, automationId, instructions);
            }
            // File System Access API or other path - continue gracefully
        } catch (error) {
            if (this.errorHandler) {
                this.errorHandler.handleError(error, { source: 'AutomationSystem', operation: 'checkSectionForCompleteFiles', sectionId });
            } else {
                console.warn(`Error checking section ${sectionId} for complete files:`, error);
            }
        }
    }
    
    // Process a complete file for a section
    async processCompleteFile(projectId, sectionId, fileName, directory, instructions) {
        try {
            // CRITICAL: Verify the file matches this section's step name and automation ID before processing
            const project = this.stateManager.getProject(projectId);
            const section = project?.sections.find(s => s.sectionId === sectionId);
            if (!section) {
                console.warn(`[DIAG] Cannot process file: section ${sectionId} not found`);
                return;
            }
            
            const stepName = section.stepName || sectionId;
            const automationId = section.automationId || '';
            const lowerFileName = fileName.toLowerCase();
            const lowerStepName = stepName.toLowerCase();
            
            // DIAGNOSTIC: Log section data and verification attempt
            console.log(`[DIAG] processCompleteFile - sectionId: ${sectionId}, stepName: ${stepName}, automationId: ${automationId}`);
            console.log(`[DIAG] Section object:`, {
                sectionId: section.sectionId,
                stepName: section.stepName,
                automationId: section.automationId,
                hasStepName: !!section.stepName,
                hasAutomationId: !!section.automationId
            });
            console.log(`[DIAG] Verifying file: ${fileName} matches section ${sectionId}`);
            
            // Verify file matches this section - delegate to orchestrator
            let matches = false;
            if (this.orchestrator) {
                matches = this.orchestrator.verifyFileMatchesSection(fileName, stepName, automationId);
                console.log(`[DIAG] File verification result: ${matches}`);
            } else {
                // Fallback verification logic if orchestrator not available
                if (automationId) {
                    const idPattern = `${lowerStepName}-${automationId.toLowerCase()}-complete`;
                    const exactPattern = new RegExp(`^${idPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.md$`, 'i');
                    matches = exactPattern.test(fileName);
                }
                if (!matches) {
                    const exactPattern = new RegExp(`^${lowerStepName}-complete\\.md$`, 'i');
                    matches = exactPattern.test(fileName);
                }
                if (!matches) {
                    const stepNamePrefixPattern = new RegExp(`^${lowerStepName}-.*-complete\\.md$`, 'i');
                    matches = stepNamePrefixPattern.test(fileName);
                }
            }
            
            if (!matches) {
                console.warn(`[DIAG] ✗ VERIFICATION FAILED: File ${fileName} does not match section ${sectionId} (step: ${stepName}, ID: ${automationId}) - skipping processing`);
                return;
            }
            
            console.log(`[DIAG] ✓ VERIFICATION PASSED: File ${fileName} matches section ${sectionId} - proceeding with processing`);
            
            // Read the file
            const filePath = `${directory}/${fileName}`.replace(/\\/g, '/').replace(/\/\//g, '/');
            const response = await fetch('/api/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: filePath })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Delegate to orchestrator for business logic
                    if (this.orchestrator) {
                        await this.orchestrator.processSectionOutput(projectId, sectionId, result.content, false);
                    } else {
                        // Fallback if orchestrator not available
                        this.stateManager.updateSection(projectId, sectionId, {
                            output: result.content
                        });
                        this.eventSystem.emit(EventType.AUTOMATION_SECTION_COMPLETE, {
                            source: 'AutomationSystem',
                            data: { projectId, sectionId, fileCount: 1 }
                        });
                        this.eventSystem.emit(EventType.SECTION_UPDATED, {
                            source: 'AutomationSystem',
                            data: { projectId, sectionId }
                        });
                    }
                    
                    // Delete draft file if it exists (file operation stays here)
                    const draftFileName = fileName.replace('-complete', '-draft');
                    const draftFilePath = `${directory}/${draftFileName}`.replace(/\\/g, '/').replace(/\/\//g, '/');
                    try {
                        await fetch('/api/delete-file', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filePath: draftFilePath })
                        });
                        console.log(`Deleted draft file: ${draftFileName}`);
                    } catch (err) {
                        if (this.errorHandler) {
                            this.errorHandler.handleError(err, {
                                source: 'AutomationSystem',
                                operation: 'processCompleteFile',
                                sectionId: sectionId,
                                fileName: draftFileName
                            });
                            // Don't show notification for draft file deletion failures - not critical
                        } else {
                            console.warn('Failed to delete draft file:', err);
                        }
                    }
                }
            }
        } catch (error) {
            if (this.errorHandler) {
                this.errorHandler.handleError(error, {
                    source: 'AutomationSystem',
                    operation: 'processCompleteFile',
                    sectionId
                });
                this.errorHandler.showUserNotification(error, {
                    source: 'AutomationSystem',
                    operation: 'processCompleteFile',
                    sectionId
                }, {
                    severity: ErrorHandler.Severity.WARNING,
                    title: 'File Processing Error'
                });
            } else {
                console.error(`Error processing complete file for section ${sectionId}:`, error);
            }
        }
    }
    
    // Setup server-side file watching
    async setupServerWatch(projectId, directory) {
        try {
            const response = await fetch('/api/watch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    directory: directory,
                    projectId: projectId,
                    sectionId: this.currentSectionId || 'default'
                })
            });
            
            if (!response.ok) {
                return { success: false, error: 'Server not available' };
            }
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.warn('Server-side watching not available, will use File System Access API:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Request directory access using File System Access API
    async requestDirectoryAccess() {
        if (!window.showDirectoryPicker) {
            // Fallback: use input element for directory selection
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.webkitdirectory = true;
                input.directory = true;
                input.onchange = (e) => {
                    // For fallback, we'll use polling instead
                    resolve({ path: e.target.files[0]?.webkitRelativePath?.split('/')[0] || '' });
                };
                input.oncancel = () => resolve(null);
                input.click();
            });
        }
        
        try {
            return await window.showDirectoryPicker({
                mode: 'readwrite'
            });
        } catch (error) {
            if (error.name === 'AbortError') {
                return null; // User cancelled
            }
            throw error;
        }
    }
    
    // Watch for files for a specific section
    async watchForSection(projectId, sectionId) {
        if (!this.isRunning) return;
        
        const project = this.stateManager.getProject(projectId);
        const section = project?.sections.find(s => s.sectionId === sectionId);
        if (!section) return;
        
        // Parse file watching instructions from prompt
        const fileInstructions = await this.parseFileWatchingInstructions(section, projectId);
        if (!fileInstructions) {
            console.warn('No file watching instructions found for section:', sectionId);
            console.warn('Section prompt preview:', section.prompt?.substring(0, 500));
            // Don't stop - allow watching the automation directory directly
            // Create default instructions using the automation directory
            const project = this.stateManager.getProject(projectId);
            const automationDir = project?.automationDirectory;
            if (automationDir) {
                const defaultInstructions = {
                    directory: automationDir,
                    files: [...AppConstants.FILE_PATTERNS.EXTENSIONS], // Default patterns
                    completeFiles: [...AppConstants.FILE_PATTERNS.COMPLETE_PATTERNS], // Generic pattern - section-specific check should prevent misuse
                    waitTime: AppConstants.TIMEOUTS.FILE_WATCH_WAIT,
                    fileCount: 1
                };
                console.log(`[DIAG] Using default file watching instructions with generic completeFiles patterns:`, defaultInstructions.completeFiles);
                // Continue with default instructions
                const watcher = {
                    files: defaultInstructions.files || [],
                    completeFiles: defaultInstructions.completeFiles || [],
                    waitTime: defaultInstructions.waitTime || AppConstants.TIMEOUTS.FILE_WATCH_WAIT,
                    stabilityTime: AppConstants.TIMEOUTS.FILE_STABILITY,
                    timeout: null,
                    stabilityTimeout: null,
                    foundFiles: new Set(),
                    completeFiles: new Set(),
                    fileStates: new Map()
                };
                this.fileWatchers.set(sectionId, watcher);
                this.startWatching(projectId, sectionId, defaultInstructions);
                return;
            } else {
                this.stop();
                return;
            }
        }
        
        // Store watcher info
        this.fileWatchers.set(sectionId, {
            files: fileInstructions.files || [],
            completeFiles: fileInstructions.completeFiles || [], // Files that indicate completion
            waitTime: fileInstructions.waitTime || AppConstants.TIMEOUTS.FILE_WATCH_WAIT, // Default 2 seconds
            stabilityTime: fileInstructions.stabilityTime || AppConstants.TIMEOUTS.FILE_STABILITY, // Default 5 seconds of no changes
            timeout: null,
            stabilityTimeout: null,
            foundFiles: new Set(),
            completeFiles: new Set(),
            fileStates: new Map(), // Track file modification times and sizes
            actualDirectory: null // Store the actual directory where files were found
        });
        
        // Start watching
        this.startWatching(projectId, sectionId, fileInstructions);
    }
    
    // Parse file watching instructions from prompt
    async parseFileWatchingInstructions(section, projectId = null) {
        let prompt = section.prompt;
        
        // If prompt not loaded, try to load it
        if (!prompt && window.PromptLoader) {
            try {
                const projectIdToUse = projectId || this.currentProjectId;
                const project = this.stateManager.getProject(projectIdToUse);
                prompt = await window.PromptLoader.getPrompt(section.sectionId, section, project);
            } catch (error) {
                console.warn('Failed to load prompt for file instructions:', error);
            }
        }
        
        if (!prompt) return null;
        
        // Look for file watching instructions in format:
        // ## File Watching Instructions
        // - Target Directory: {DIRECTORY_NAME}
        // - Files to Watch: file1.md, file2.md
        // - Wait Time: 3000ms
        // - File Count: 2
        
        const instructionsMatch = prompt.match(/## File Watching Instructions\s*\n\n([\s\S]*?)(?=\n---|\n## |$)/i);
        if (!instructionsMatch) return null;
        
        const instructionsText = instructionsMatch[1];
        const instructions = {
            directory: null,
            files: [],
            waitTime: AppConstants.TIMEOUTS.FILE_WATCH_WAIT,
            fileCount: 1
        };
        
        // Parse directory - use project automationDirectory if {AUTOMATION_DIR} is in prompt
        const dirMatch = instructionsText.match(/Target Directory:\s*([^\n]+)/i);
        if (dirMatch) {
            let dirValue = dirMatch[1].trim();
            // Replace {AUTOMATION_DIR} with project's automationDirectory
            if (dirValue.includes('{AUTOMATION_DIR}')) {
                const project = this.stateManager.getProject(this.currentProjectId);
                const automationDir = project?.automationDirectory || '';
                if (automationDir) {
                    dirValue = dirValue.replace(/\{AUTOMATION_DIR\}/g, automationDir);
                } else {
                    // Remove placeholder if no directory set
                    dirValue = dirValue.replace(/\{AUTOMATION_DIR\}/g, '').trim();
                }
            }
            instructions.directory = dirValue;
        } else {
            // If no directory in instructions, use project's automationDirectory
            const project = this.stateManager.getProject(this.currentProjectId);
            instructions.directory = project?.automationDirectory || '';
        }
        
        // Parse files
        const filesMatch = instructionsText.match(/Files to Watch:\s*([^\n]+)/i);
        if (filesMatch) {
            instructions.files = filesMatch[1].split(',').map(f => f.trim());
        }
        
        // Parse wait time
        const waitMatch = instructionsText.match(/Wait Time:\s*(\d+)\s*ms/i);
        if (waitMatch) {
            instructions.waitTime = parseInt(waitMatch[1]);
        }
        
        // Parse stability time (how long file must be unchanged before processing)
        const stabilityMatch = instructionsText.match(/Stability Time:\s*(\d+)\s*ms/i);
        if (stabilityMatch) {
            instructions.stabilityTime = parseInt(stabilityMatch[1]);
        } else {
            instructions.stabilityTime = AppConstants.TIMEOUTS.FILE_STABILITY; // Default 5 seconds
        }
        
        // Parse file count
        const countMatch = instructionsText.match(/File Count:\s*(\d+)/i);
        if (countMatch) {
            instructions.fileCount = parseInt(countMatch[1]);
        }
        
        // Parse complete file patterns (files that indicate completion)
        const completeMatch = instructionsText.match(/Complete Files:\s*([^\n]+)/i);
        if (completeMatch) {
            instructions.completeFiles = completeMatch[1].split(',').map(f => f.trim());
        } else {
            // Default: look for files with "-complete" suffix or without "-draft" suffix
            instructions.completeFiles = instructions.files.map(f => {
                // Replace -draft with -complete, or add -complete if no suffix
                if (f.includes(AppConstants.FILE_PATTERNS.DRAFT_SUFFIX)) {
                    return f.replace(AppConstants.FILE_PATTERNS.DRAFT_SUFFIX, AppConstants.FILE_PATTERNS.COMPLETE_SUFFIX);
                } else if (!f.includes(AppConstants.FILE_PATTERNS.COMPLETE_SUFFIX)) {
                    const base = f.replace(/\.md$/, '');
                    return `${base}${AppConstants.FILE_PATTERNS.COMPLETE_SUFFIX}`;
                }
                return f;
            });
        }
        
        return instructions;
    }
    
    // Start watching for files
    async startWatching(projectId, sectionId, instructions) {
        if (!this.isRunning) {
            console.warn('Cannot start watching: automation is not running');
            return;
        }
        
        const watcher = this.fileWatchers.get(sectionId);
        if (!watcher) {
            console.warn('Cannot start watching: no watcher found for section:', sectionId);
            return;
        }
        
        console.log('Starting file watching for section:', sectionId, 'directory:', instructions.directory);
        
        // Check for existing files immediately
        await this.checkForFiles(projectId, sectionId, instructions);
        
        // Note: Continuous checking is handled by setupContinuousCheck which runs every 2 minutes
        // No need for per-section polling interval - it was causing excessive checks
    }
    
    /**
     * Check if file matches expected file patterns
     * @private
     * @returns {boolean} True if file matches any expected pattern
     */
    _matchesFilePattern(fileName, instructions) {
        if (instructions.files.length === 0) return true;
        
        return instructions.files.some(expected => {
            if (expected.includes('*')) {
                const pattern = new RegExp('^' + expected.replace(/\*/g, '.*') + '$');
                return pattern.test(fileName);
            }
            const lowerFileName = fileName.toLowerCase();
            const lowerExpected = expected.toLowerCase();
            return lowerFileName.includes(lowerExpected) || 
                   lowerExpected.includes(lowerFileName) || 
                   lowerFileName === lowerExpected;
        });
    }
    
    /**
     * Determine if file is a complete file (simplified version without diagnostic logging)
     * @private
     * @returns {boolean} True if file matches complete file pattern
     */
    _determineIfCompleteFile(fileName, stepName, automationId, instructions) {
        const lowerFileName = fileName.toLowerCase();
        const lowerStepName = stepName.toLowerCase();
        
        // First priority: Check for section-specific pattern with automation ID
        if (automationId) {
            const idPattern = `${lowerStepName}-${automationId.toLowerCase()}-complete`;
            const exactPattern = new RegExp(`^${idPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.md$`, 'i');
            if (exactPattern.test(fileName)) {
                console.log(`File matches section pattern: ${fileName} for ${stepName} with ID ${automationId}`);
                return true;
            }
        }
        
        // Fallback: match patterns without ID for backward compatibility (only if no ID is set)
        if (!automationId) {
            const exactPattern = new RegExp(`^${lowerStepName}-complete\\.md$`, 'i');
            if (exactPattern.test(fileName)) {
                console.log(`File matches section pattern (no ID): ${fileName} for ${stepName}`);
                return true;
            }
        }
        
        // Last resort: check generic patterns from instructions
        return instructions.completeFiles.some(expected => {
            if (expected.includes('*')) {
                const pattern = new RegExp('^' + expected.replace(/\*/g, '.*') + '$');
                return pattern.test(fileName);
            }
            const lowerExpected = expected.toLowerCase();
            return lowerFileName.includes(lowerExpected) || 
                   lowerExpected.includes(lowerFileName) || 
                   lowerFileName === lowerExpected;
        });
    }
    
    /**
     * Update file state tracking for a file
     * @private
     * @returns {Object} Object with changedFiles and newCompleteFiles arrays updated
     */
    _updateFileState(watcher, fileName, file, now, isCompleteFile, changedFiles, newCompleteFiles) {
        const fileState = watcher.fileStates.get(fileName);
        const lastModified = file.lastModified;
        const size = file.size;
        
        if (!fileState) {
            // New file detected
            watcher.fileStates.set(fileName, {
                lastModified: lastModified,
                stableSince: now,
                size: size
            });
            watcher.foundFiles.add(fileName);
            changedFiles.push({ fileName, file });
        } else {
            // Existing file - check if it changed
            if (fileState.lastModified !== lastModified || fileState.size !== size) {
                // File was modified - reset stability timer
                watcher.fileStates.set(fileName, {
                    lastModified: lastModified,
                    stableSince: now,
                    size: size
                });
                changedFiles.push({ fileName, file });
            }
        }
        
        // Check if this is a completion file
        if (isCompleteFile && !watcher.completeFiles.has(fileName)) {
            watcher.completeFiles.add(fileName);
            newCompleteFiles.push({ fileName, file });
            console.log('Complete file detected:', fileName);
        }
    }
    
    /**
     * Process files from server directory
     * @private
     * @returns {Promise<Object>} Object with changedFiles and newCompleteFiles arrays
     */
    async _processServerFiles(watcher, section, instructions, now, stepName) {
        const changedFiles = [];
        const newCompleteFiles = [];
        
        // Use the directory from instructions if it's more specific, otherwise use targetDirectory.path
        let watchDir = instructions.directory || this.targetDirectory.path;
        console.log('Checking files in directory:', watchDir);
        
        // Normalize path - remove backticks and trim
        let normalizedWatchDir = watchDir.replace(/`/g, '').trim();
        
        // Try the specified directory first
        let response;
        let result = null;
        try {
            response = await fetch('/api/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ directory: normalizedWatchDir })
            });
            
            if (response.ok) {
                result = await response.json();
            }
        } catch (error) {
            if (this.errorHandler) {
                this.errorHandler.handleError(error, {
                    source: 'AutomationSystem',
                    operation: 'checkSectionForCompleteFiles',
                    sectionId: section.sectionId
                });
                // Don't show notification - file checking is background operation
            } else {
                console.warn(`Error fetching files for ${section.sectionId}:`, error.message);
            }
            return { changedFiles, newCompleteFiles };
        }
        
        // If directory doesn't exist or has no files, try parent automation directory
        // /api/files returns { success: true, files: [...] } directly (not double-wrapped)
        let files = (result && result.data && result.data.files) || (result && result.files) || [];
        if (!response.ok || (result && (!result.success || result.error === 'Directory does not exist' || (files && files.length === 0)))) {
            console.log('Directory not found or empty, trying parent automation directory:', this.targetDirectory.path);
            normalizedWatchDir = this.targetDirectory.path;
            try {
                response = await fetch('/api/files', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ directory: normalizedWatchDir })
                });
                if (response.ok) {
                    result = await response.json();
                } else {
                    // Parent directory also doesn't exist - continue gracefully
                    return { changedFiles, newCompleteFiles };
                }
            } catch (error) {
                if (this.errorHandler) {
                    this.errorHandler.handleError(error, {
                        source: 'AutomationSystem',
                        operation: 'checkSectionForCompleteFiles',
                        sectionId: section.sectionId
                    });
                    // Don't show notification - directory checking is background operation
                } else {
                    console.warn(`Error checking parent directory for ${section.sectionId}:`, error.message);
                }
                return { changedFiles, newCompleteFiles };
            }
        }
        
        // Store the actual directory where files were found
        if (watcher) {
            watcher.actualDirectory = normalizedWatchDir;
        }
        
        if (!response.ok) {
            console.warn('Server response not OK:', response.status);
            return { changedFiles, newCompleteFiles };
        }
        
        // /api/files returns { success: true, files: [...] } directly (not double-wrapped)
        // /api/list-files returns { success: true, data: { success: true, files: [...] } }
        // Recalculate files after potential parent directory check (result may have been updated)
        files = (result && result.data && result.data.files) || (result && result.files) || [];
        
        if (!result || !result.success || !files || files.length === 0) {
            if (this.errorHandler) {
                this.errorHandler.handleError(result?.error || 'Unknown error', {
                    source: 'AutomationSystem',
                    operation: 'checkForFiles',
                    sectionId: section.sectionId
                });
                // Don't show notification - file checking is background operation
            } else {
                console.warn('Failed to get files from server:', result?.error || 'Unknown error');
            }
            return { changedFiles, newCompleteFiles };
        }
        
        const automationId = section?.automationId || '';
        
        for (const file of files) {
            const fileName = file.name;
            const matchesPattern = this._matchesFilePattern(fileName, instructions);
            const isCompleteFile = this._determineIfCompleteFile(fileName, stepName, automationId, instructions);
            
            if (matchesPattern || isCompleteFile) {
                this._updateFileState(watcher, fileName, file, now, isCompleteFile, changedFiles, newCompleteFiles);
                
                if (matchesPattern) {
                    console.log('File matches pattern:', fileName);
                }
            } else {
                console.log('File does not match patterns:', fileName, 'expected:', instructions.files, 'complete:', instructions.completeFiles);
            }
        }
        
        return { changedFiles, newCompleteFiles };
    }
    
    /**
     * Process files from File System Access API
     * @private
     * @returns {Promise<Object>} Object with changedFiles and newCompleteFiles arrays
     */
    async _processFileSystemAPIFiles(watcher, section, instructions, now, stepName) {
        const changedFiles = [];
        const newCompleteFiles = [];
        const automationId = section?.automationId || '';
        
        for await (const entry of this.targetDirectory.values()) {
            if (entry.kind !== 'file') continue;
            
            const fileName = entry.name;
            
            try {
                const fileHandle = await this.targetDirectory.getFileHandle(fileName);
                const file = await fileHandle.getFile();
                const fileSize = file.size;
                const lastModified = file.lastModified;
                
                const matchesPattern = this._matchesFilePattern(fileName, instructions);
                const isCompleteFile = this._determineIfCompleteFile(fileName, stepName, automationId, instructions);
                
                if (matchesPattern || isCompleteFile) {
                    this._updateFileState(watcher, fileName, { lastModified, size: fileSize, entry, file }, now, isCompleteFile, changedFiles, newCompleteFiles);
                }
            } catch (error) {
                console.warn('Error accessing file:', fileName, error);
            }
        }
        
        return { changedFiles, newCompleteFiles };
    }
    
    // Check for expected files
    async checkForFiles(projectId, sectionId, instructions) {
        if (!this.targetDirectory) return;
        
        const watcher = this.fileWatchers.get(sectionId);
        if (!watcher) return;
        
        // If we already processed this section, skip
        if (watcher.processed) return;
        
        // Get section info for pattern matching
        const project = this.stateManager.getProject(projectId);
        const section = project?.sections.find(s => s.sectionId === sectionId);
        if (!section) return;
        
        const stepName = section.stepName || sectionId;
        
        try {
            const now = Date.now();
            let changedFiles = [];
            let newCompleteFiles = [];
            
            // Check if using server-side watching
            if (this.targetDirectory.type === 'server') {
                const result = await this._processServerFiles(watcher, section, instructions, now, stepName);
                changedFiles = result.changedFiles;
                newCompleteFiles = result.newCompleteFiles;
            } else if (this.targetDirectory.entries) {
                // File System Access API
                const result = await this._processFileSystemAPIFiles(watcher, section, instructions, now, stepName);
                changedFiles = result.changedFiles;
                newCompleteFiles = result.newCompleteFiles;
            } else if (this.targetDirectory.path) {
                // Fallback: polling via fetch (requires server support)
                console.warn('File System Access API not available, polling not implemented');
                return;
            }
            
            // Check for stable files (no changes for stabilityTime)
            // For existing files detected on first check, mark them as stable immediately if they haven't changed
            const stableFiles = [];
            for (const [fileName, state] of watcher.fileStates.entries()) {
                // Skip stability check for complete files - they should be processed immediately
                if (watcher.completeFiles.has(fileName)) {
                    stableFiles.push(fileName);
                    continue;
                }
                
                const timeSinceLastChange = now - state.stableSince;
                // If file was just detected (stableSince is very recent) and no changes detected, 
                // consider it stable if it's been stable for at least 1 second (existing file)
                const isExistingFile = timeSinceLastChange < AppConstants.TIMEOUTS.FILE_DETECTION_THRESHOLD; // Detected less than 2 seconds ago
                if (timeSinceLastChange >= watcher.stabilityTime || (isExistingFile && timeSinceLastChange >= AppConstants.TIMEOUTS.FILE_EXISTING_CHECK)) {
                    stableFiles.push(fileName);
                }
            }
            
            // Check if we have complete files (preferred) or stable files
            const fileCount = instructions.fileCount || 1;
            const hasCompleteFiles = watcher.completeFiles.size >= fileCount;
            const hasStableFiles = stableFiles.length >= fileCount;
            
            console.log(`Stability check: completeFiles=${watcher.completeFiles.size}, stableFiles=${stableFiles.length}, hasCompleteFiles=${hasCompleteFiles}, hasStableFiles=${hasStableFiles}, fileCount=${fileCount}`);
            
            if (hasCompleteFiles || hasStableFiles) {
                // Clear any existing timeout
                if (watcher.timeout) {
                    clearTimeout(watcher.timeout);
                }
                if (watcher.stabilityTimeout) {
                    clearTimeout(watcher.stabilityTimeout);
                }
                
                // For complete files, process immediately (or after short wait)
                // For stable draft files, wait for final stability period
                const waitTime = hasCompleteFiles ? Math.min(watcher.waitTime, 1000) : watcher.waitTime;
                console.log(`Scheduling file processing in ${waitTime}ms (completeFiles: ${hasCompleteFiles})`);
                
                watcher.stabilityTimeout = setTimeout(async () => {
                    console.log('Processing files now...');
                    await this.processFiles(projectId, sectionId, instructions);
                }, waitTime);
            } else if (changedFiles.length > 0) {
                // Files are being edited - reset stability timeout
                if (watcher.stabilityTimeout) {
                    clearTimeout(watcher.stabilityTimeout);
                }
            }
        } catch (error) {
            console.error('Error checking for files:', error);
        }
    }
    
    /**
     * Validate that a file matches the section's step name and automation ID
     * @private
     * @returns {boolean} True if file matches section
     */
    _validateFileMatchesSection(fileName, stepName, automationId) {
        if (this.orchestrator) {
            const matches = this.orchestrator.verifyFileMatchesSection(fileName, stepName, automationId);
            console.log(`[DIAG] processFiles validation: ${fileName} matches section? ${matches}`);
            return matches;
        }
        
        // Fallback validation if orchestrator not available
        const lowerFileName = fileName.toLowerCase();
        const lowerStepName = stepName.toLowerCase();
        
        if (automationId) {
            const idPattern = `${lowerStepName}-${automationId.toLowerCase()}-complete`;
            const exactPattern = new RegExp(`^${idPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.md$`, 'i');
            if (exactPattern.test(fileName)) {
                return true;
            }
            const stepNamePrefixPattern = new RegExp(`^${lowerStepName}-.*-complete\\.md$`, 'i');
            return stepNamePrefixPattern.test(fileName);
        } else {
            const exactPattern = new RegExp(`^${lowerStepName}-complete\\.md$`, 'i');
            if (exactPattern.test(fileName)) {
                return true;
            }
            const stepNamePrefixPattern = new RegExp(`^${lowerStepName}-.*-complete\\.md$`, 'i');
            return stepNamePrefixPattern.test(fileName);
        }
    }
    
    /**
     * Read files from server directory
     * @private
     * @returns {Promise<Array>} Array of file contents
     */
    async _readServerFiles(filesToRead, baseDir, stepName, automationId) {
        const fileContents = [];
        
        for (const fileName of filesToRead) {
            // VALIDATION: Verify fileName matches section before processing
            if (!this._validateFileMatchesSection(fileName, stepName, automationId)) {
                console.warn(`[DIAG] ⚠ SKIPPING file ${fileName} in processFiles - does not match section (step: ${stepName}, ID: ${automationId})`);
                continue; // Skip this file
            }
            
            console.log(`[DIAG] ✓ Processing file ${fileName} - validation passed`);
            try {
                // Construct file path using the base directory from instructions
                const filePath = `${baseDir}/${fileName}`.replace(/\\/g, '/').replace(/\/\//g, '/');
                console.log('Reading file:', filePath);
                
                const response = await fetch('/api/read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filePath: filePath })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        fileContents.push({
                            name: result.name,
                            content: result.content
                        });
                    }
                }
            } catch (error) {
                if (this.errorHandler) {
                    this.errorHandler.handleError(error, {
                        source: 'AutomationSystem',
                        operation: 'readServerFiles',
                        fileName: fileName
                    });
                    // Don't show notification for individual file read failures - partial results are acceptable
                } else {
                    console.warn('Failed to read file:', fileName, error);
                }
            }
        }
        
        return fileContents;
    }
    
    /**
     * Read files from File System Access API
     * @private
     * @returns {Promise<Array>} Array of file contents
     */
    async _readFileSystemAPIFiles(filesToRead) {
        const fileContents = [];
        
        for (const fileName of filesToRead) {
            try {
                const fileHandle = await this.targetDirectory.getFileHandle(fileName);
                const file = await fileHandle.getFile();
                const content = await file.text();
                fileContents.push({
                    name: fileName,
                    content: content
                });
            } catch (error) {
                if (this.errorHandler) {
                    this.errorHandler.handleError(error, {
                        source: 'AutomationSystem',
                        operation: 'readServerFiles',
                        fileName: fileName
                    });
                    // Don't show notification for individual file read failures - partial results are acceptable
                } else {
                    console.warn('Failed to read file:', fileName, error);
                }
            }
        }
        
        return fileContents;
    }
    
    // Process found files
    async processFiles(projectId, sectionId, instructions) {
        if (!this.isRunning) return;
        
        const watcher = this.fileWatchers.get(sectionId);
        if (!watcher || watcher.processed) return;
        
        // Mark as processed to prevent duplicate processing
        watcher.processed = true;
        
        try {
            // Get section info for validation
            const project = this.stateManager.getProject(projectId);
            const section = project?.sections.find(s => s.sectionId === sectionId);
            if (!section) {
                watcher.processed = false;
                return;
            }
            
            const stepName = section.stepName || sectionId;
            const automationId = section.automationId || '';
            
            // DIAGNOSTIC: Log section data for validation
            console.log(`[DIAG] processFiles - sectionId: ${sectionId}, stepName: ${stepName}, automationId: ${automationId}`);
            console.log(`[DIAG] Section object:`, {
                sectionId: section.sectionId,
                stepName: section.stepName,
                automationId: section.automationId,
                hasStepName: !!section.stepName,
                hasAutomationId: !!section.automationId
            });
            
            // Read all found files (prefer complete files, fallback to stable files)
            const filesToRead = watcher.completeFiles.size > 0 
                ? Array.from(watcher.completeFiles) 
                : Array.from(watcher.foundFiles);
            
            // DIAGNOSTIC: Log files to be processed
            console.log(`[DIAG] Files to process:`, Array.from(filesToRead));
            
            let fileContents = [];
            if (this.targetDirectory.type === 'server') {
                // Read files via server API
                // Use the actual directory where files were found (stored in watcher), otherwise fall back
                const baseDir = watcher.actualDirectory || 
                               (instructions.directory ? instructions.directory.replace(/`/g, '').trim() : this.targetDirectory.path);
                fileContents = await this._readServerFiles(filesToRead, baseDir, stepName, automationId);
            } else if (this.targetDirectory.entries) {
                // File System Access API
                fileContents = await this._readFileSystemAPIFiles(filesToRead);
            }
            
            if (fileContents.length === 0) {
                console.warn('No files found to process');
                watcher.processed = false;
                return;
            }
            
            // Combine file contents
            const combinedOutput = fileContents.map(f => 
                `## ${f.name}\n\n${f.content}`
            ).join('\n\n---\n\n');
            
            // Delegate to orchestrator for business logic
            if (this.orchestrator) {
                await this.orchestrator.processMultipleFiles(projectId, sectionId, fileContents);
            } else {
                // Fallback if orchestrator not available
                this.stateManager.updateSection(projectId, sectionId, {
                    output: combinedOutput,
                    status: 'complete'
                });
                this.eventSystem.emit(EventType.AUTOMATION_SECTION_COMPLETE, {
                    source: 'AutomationSystem',
                    data: { projectId, sectionId, fileCount: fileContents.length }
                });
            }
            
            // Delete draft files if complete files are present (file operation stays here)
            await this.deleteDraftFiles(projectId, sectionId, instructions, filesToRead);
            
            // Move to next section
            await this.moveToNextSection(projectId, sectionId);
            
        } catch (error) {
            console.error('Error processing files:', error);
            watcher.processed = false; // Allow retry on error
        }
    }
    
    // Move to next section
    async moveToNextSection(projectId, currentSectionId) {
        if (!this.isRunning) return;
        
        // Delegate to orchestrator for business logic
        let nextSectionInfo = null;
        if (this.orchestrator) {
            nextSectionInfo = await this.orchestrator.moveToNextSection(projectId, currentSectionId);
        } else {
            // Fallback if orchestrator not available
            const project = this.stateManager.getProject(projectId);
            if (!project) return;
            
            const pipelineConfig = window.PipelineConfig;
            if (!pipelineConfig) return;
            
            const nextSection = await pipelineConfig.getNextSection(currentSectionId, project.sections);
            if (nextSection) {
                nextSectionInfo = {
                    sectionId: nextSection.sectionId || nextSection.id,
                    sectionName: nextSection.sectionName || nextSection.name
                };
            }
        }
        
        if (!nextSectionInfo) {
            // No more sections - but don't stop automation, just continue monitoring
            // Automation will continue checking all sections for updates
            return;
        }
        
        // DO NOT automatically inject output into input - this should be manual only
        // Users can use the "Paste from Previous Section" button if they want to do this
        
        // Navigate to next section (file watching logic stays here)
        this.currentSectionId = nextSectionInfo.sectionId;
        
        // Start watching for next section
        await this.watchForSection(projectId, nextSectionInfo.sectionId);
        
        // Emit event to update UI
        this.eventSystem.emit(EventType.SECTION_UPDATED, {
            source: 'AutomationSystem',
            data: { projectId, sectionId: nextSectionInfo.sectionId }
        });
    }
    
    // Check if section needs input based on Input Guidance
    async sectionNeedsInput(section) {
        if (!window.PromptLoader) return false;
        
        try {
            const guidance = await window.PromptLoader.getInputGuidance(
                section.stepName || section.sectionId,
                section.isProcessStep,
                section.isInferenceStep,
                section.processStepType
            );
            
            if (!guidance) return false;
            
            // Check if guidance mentions "Paste" or "previous" or "output"
            const needsInputPattern = /(paste|previous|output|from.*step|research summary|feature extraction)/i;
            return needsInputPattern.test(guidance);
        } catch (error) {
            console.warn('Failed to check input guidance:', error);
            return false;
        }
    }
    
    // Delete draft files when complete files are present
    async deleteDraftFiles(projectId, sectionId, instructions, completeFiles) {
        if (!this.targetDirectory) return;
        
        // Find draft files corresponding to complete files
        const draftFilesToDelete = [];
        
        for (const completeFileName of completeFiles) {
            // Check if this is a complete file (has -complete suffix)
            if (completeFileName.includes('-complete')) {
                // Generate draft filename by replacing -complete with -draft
                const draftFileName = completeFileName.replace('-complete', '-draft');
                draftFilesToDelete.push(draftFileName);
                
                // Also try alternative patterns (e.g., "research-findings-complete.md" -> "research-findings-draft.md")
                // This handles cases where the file name has additional parts
                const altDraftName = AppConstants.completeToDraft(completeFileName);
                if (altDraftName !== draftFileName && !draftFilesToDelete.includes(altDraftName)) {
                    draftFilesToDelete.push(altDraftName);
                }
            } else {
                // Check if there's a corresponding draft file in the watched files
                const matchingDraft = instructions.files.find(f => {
                    if (f.includes(AppConstants.FILE_PATTERNS.DRAFT_SUFFIX)) {
                        // Extract base name from complete file
                        const baseName = completeFileName.replace(new RegExp(AppConstants.FILE_PATTERNS.COMPLETE_SUFFIX.replace(/\./g, '\\.') + '$'), '').replace(/\.md$/, '');
                        const draftBase = f.replace(AppConstants.FILE_PATTERNS.DRAFT_SUFFIX, '').replace('.md', '');
                        return baseName === draftBase;
                    }
                    return false;
                });
                
                if (matchingDraft) {
                    draftFilesToDelete.push(matchingDraft);
                }
            }
        }
        
        if (draftFilesToDelete.length === 0) return;
        
        // Delete draft files
        // Use the actual directory where files were found (stored in watcher), otherwise fall back
        const watcher = this.fileWatchers.get(sectionId);
        const baseDir = watcher?.actualDirectory || 
                       (instructions.directory ? instructions.directory.replace(/`/g, '').trim() : this.targetDirectory.path);
        
        for (const draftFileName of draftFilesToDelete) {
            try {
                if (this.targetDirectory.type === 'server') {
                    // Delete via server API - use the same base directory as file reading
                    const filePath = `${baseDir}/${draftFileName}`.replace(/\\/g, '/').replace(/\/\//g, '/');
                    console.log('Deleting draft file:', filePath);
                    
                    const response = await fetch('/api/delete-file', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filePath: filePath })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            console.log('✓ Deleted draft file:', filePath);
                        } else {
                            console.warn('Failed to delete draft file:', filePath, result.error);
                        }
                    } else {
                        const errorText = await response.text();
                        console.warn('Failed to delete draft file (HTTP error):', filePath, response.status, errorText);
                    }
                } else if (this.targetDirectory.entries) {
                    // File System Access API - delete file
                    try {
                        const fileHandle = await this.targetDirectory.getFileHandle(draftFileName);
                        await fileHandle.remove();
                        console.log('Deleted draft file:', draftFileName);
                    } catch (error) {
                        // File might not exist, which is fine
                        if (error.name !== 'NotFoundError') {
                            console.warn('Failed to delete draft file:', draftFileName, error);
                        }
                    }
                }
            } catch (error) {
                console.warn('Error deleting draft file:', draftFileName, error);
            }
        }
    }
}

