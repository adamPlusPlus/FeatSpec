// Automation System - Watches directories for files and automates pipeline progression
class AutomationSystem {
    constructor(eventSystem, stateManager) {
        this.eventSystem = eventSystem;
        this.stateManager = stateManager;
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
        
        // Try to use server-side file watching if available
        // Otherwise fall back to File System Access API
        try {
            const serverWatchResult = await this.setupServerWatch(projectId, automationDir);
            if (serverWatchResult.success) {
                this.targetDirectory = { type: 'server', path: automationDir, key: serverWatchResult.key };
            } else {
                // Fallback to File System Access API
                const directoryHandle = await this.requestDirectoryAccess();
                if (!directoryHandle) {
                    return; // User cancelled
                }
                this.targetDirectory = directoryHandle; // Store file handle for file watching
            }
        } catch (error) {
            console.error('Failed to setup directory watching:', error);
            // Try File System Access API as fallback
            try {
                const directoryHandle = await this.requestDirectoryAccess();
                if (!directoryHandle) {
                    return; // User cancelled
                }
                this.targetDirectory = directoryHandle;
            } catch (fallbackError) {
                alert('Failed to setup directory watching. Make sure the server supports file watching or your browser supports File System Access API.');
                return;
            }
        }
        
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
        } catch (error) {
            console.error('Failed to start automation:', error);
            alert('Failed to start automation: ' + error.message);
            this.isRunning = false;
        }
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
        
        // Then check every 2 minutes (120000ms)
        this.continuousCheckInterval = setInterval(() => {
            if (this.isRunning && this.currentProjectId === projectId) {
                this.checkAllSections(projectId);
            }
        }, 120000);
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
                if (window.app && window.app.generateDefaultAutomationId) {
                    const defaultId = window.app.generateDefaultAutomationId(projectId, section.sectionId);
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
                    files: ['*.md', '*.txt', '*.json'],
                    completeFiles: ['*-complete.md', '*-complete.txt'], // Generic pattern - section-specific check should prevent misuse
                    waitTime: 2000,
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
            const stepName = section?.stepName || sectionId;
            const automationId = section?.automationId || '';
            
            // DIAGNOSTIC: Log section data and verify UI/state consistency
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
            
            // Check for complete files
            if (this.targetDirectory.type === 'server') {
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
                            return;
                        }
                        console.warn(`Server error checking files for ${sectionId}: ${response.status}`);
                        return;
                    }
                    
                    const result = await response.json();
                    if (result.success && result.files) {
                        // Check if any complete files exist
                        for (const file of result.files) {
                            const fileName = file.name;
                            
                            // CRITICAL: Always check section-specific patterns FIRST to prevent cross-section contamination
                            // Must match BOTH step name AND automation ID for this specific section
                            let isCompleteFile = false;
                            const lowerFileName = fileName.toLowerCase();
                            const lowerStepName = stepName.toLowerCase();
                            const automationId = section?.automationId || '';
                            
                            // DIAGNOSTIC: Log pattern matching attempt
                            console.log(`[DIAG] Pattern matching for file: ${fileName}`);
                            console.log(`[DIAG] Section: ${sectionId}, stepName: ${stepName}, automationId: ${automationId}`);
                            
                            // First priority: Check for section-specific pattern with automation ID
                            if (automationId) {
                                // Match patterns like "theoria-[id]-complete.md" - must be exact match
                                const idPattern = `${lowerStepName}-${automationId.toLowerCase()}-complete`;
                                const exactPattern = new RegExp(`^${idPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.md$`, 'i');
                                const patternString = `^${idPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.md$`;
                                console.log(`[DIAG] Testing section-specific pattern with ID: ${patternString}`);
                                const testResult = exactPattern.test(fileName);
                                console.log(`[DIAG] Pattern test result: ${testResult}`);
                                if (testResult) {
                                    isCompleteFile = true;
                                    console.log(`[DIAG] ✓ File matches section pattern: ${fileName} for ${stepName} with ID ${automationId}`);
                                } else {
                                    console.log(`[DIAG] ✗ File does NOT match section pattern: ${fileName} (expected: ${stepName}-${automationId}-complete.md)`);
                                }
                            }
                            
                            // Fallback: match patterns without ID for backward compatibility
                            // This allows files without automation ID to still be processed
                            if (!isCompleteFile) {
                                // Try section-specific pattern without ID (e.g., "research-complete.md")
                                const exactPattern = new RegExp(`^${lowerStepName}-complete\\.md$`, 'i');
                                const patternString = `^${lowerStepName}-complete\\.md$`;
                                console.log(`[DIAG] Testing section-specific pattern without ID: ${patternString}`);
                                const testResult = exactPattern.test(fileName);
                                console.log(`[DIAG] Pattern test result: ${testResult}`);
                                if (testResult) {
                                    isCompleteFile = true;
                                    console.log(`[DIAG] ✓ File matches section pattern (no ID): ${fileName} for ${stepName}`);
                                }
                            }
                            
                            // Last resort: check generic patterns from instructions
                            // This allows files like "research-findings-complete.md" or "research-summary-complete.md"
                            // to match when they start with the step name
                            if (!isCompleteFile) {
                                console.log(`[DIAG] Section-specific pattern didn't match, checking generic patterns:`, instructions.completeFiles);
                                
                                // First check if file starts with step name (for files like "research-findings-complete.md")
                                const stepNamePrefixPattern = new RegExp(`^${lowerStepName}-.*-complete\\.md$`, 'i');
                                if (stepNamePrefixPattern.test(fileName)) {
                                    isCompleteFile = true;
                                    console.log(`[DIAG] ✓ File matches step name prefix pattern: ${fileName} for ${stepName}`);
                                } else {
                                    // Check generic patterns from instructions
                                    isCompleteFile = instructions.completeFiles.some(expected => {
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
                                    if (isCompleteFile) {
                                        console.log(`[DIAG] ⚠ File matched GENERIC pattern (not section-specific): ${fileName}`);
                                    }
                                }
                            }
                            
                            if (isCompleteFile) {
                                // Found a complete file - process it
                                console.log(`[DIAG] ✓ Final decision: Processing file ${fileName} for section ${sectionId}`);
                                await this.processCompleteFile(projectId, sectionId, fileName, checkDir, instructions);
                                break; // Only process one complete file per section
                            } else {
                                console.log(`[DIAG] ✗ Final decision: NOT processing file ${fileName} for section ${sectionId} (no match)`);
                            }
                        }
                    } else {
                        // No files found or error - continue gracefully
                        if (result && result.error) {
                            console.warn(`No files found for ${sectionId}:`, result.error);
                        }
                    }
                } catch (fetchError) {
                    // Gracefully handle network or parsing errors
                    console.warn(`Error checking files for ${sectionId}:`, fetchError.message);
                    return;
                }
            } else {
                // File System Access API or other path - continue gracefully
            }
        } catch (error) {
            console.warn(`Error checking section ${sectionId} for complete files:`, error);
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
            
            // Verify file matches this section - use same flexible matching as checkSectionForCompleteFiles
            let matches = false;
            let patternString = '';
            
            // First priority: Check for section-specific pattern with automation ID
            if (automationId) {
                const idPattern = `${lowerStepName}-${automationId.toLowerCase()}-complete`;
                patternString = `^${idPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.md$`;
                const exactPattern = new RegExp(patternString, 'i');
                matches = exactPattern.test(fileName);
                console.log(`[DIAG] Testing pattern with ID: ${patternString}`);
                console.log(`[DIAG] Pattern test result: ${matches}`);
            }
            
            // Fallback: match patterns without ID (e.g., "research-complete.md")
            if (!matches) {
                patternString = `^${lowerStepName}-complete\\.md$`;
                const exactPattern = new RegExp(patternString, 'i');
                matches = exactPattern.test(fileName);
                console.log(`[DIAG] Testing pattern without ID: ${patternString}`);
                console.log(`[DIAG] Pattern test result: ${matches}`);
            }
            
            // Last resort: check if file starts with step name (e.g., "research-findings-complete.md")
            if (!matches) {
                const stepNamePrefixPattern = new RegExp(`^${lowerStepName}-.*-complete\\.md$`, 'i');
                matches = stepNamePrefixPattern.test(fileName);
                console.log(`[DIAG] Testing step name prefix pattern: ^${lowerStepName}-.*-complete\\.md$`);
                console.log(`[DIAG] Pattern test result: ${matches}`);
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
                    // Update section output (but don't change status - allow continuous updates)
                    this.stateManager.updateSection(projectId, sectionId, {
                        output: result.content
                        // Don't set status to 'complete' - allow continuous monitoring
                    });
                    
                    // Delete draft file if it exists
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
                        console.warn('Failed to delete draft file:', err);
                    }
                    
                    // Emit event
                    this.eventSystem.emit(EventType.AUTOMATION_SECTION_COMPLETE, {
                        source: 'AutomationSystem',
                        data: { projectId, sectionId, fileCount: 1 }
                    });
                    
                    // Emit section updated event
                    this.eventSystem.emit(EventType.SECTION_UPDATED, {
                        source: 'AutomationSystem',
                        data: { projectId, sectionId }
                    });
                }
            }
        } catch (error) {
            console.error(`Error processing complete file for section ${sectionId}:`, error);
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
                    files: ['*.md', '*.txt', '*.json'], // Default patterns
                    completeFiles: ['*-complete.md', '*-complete.txt'], // Generic pattern - section-specific check should prevent misuse
                    waitTime: 2000,
                    fileCount: 1
                };
                console.log(`[DIAG] Using default file watching instructions with generic completeFiles patterns:`, defaultInstructions.completeFiles);
                // Continue with default instructions
                const watcher = {
                    files: defaultInstructions.files || [],
                    completeFiles: defaultInstructions.completeFiles || [],
                    waitTime: defaultInstructions.waitTime || 2000,
                    stabilityTime: 5000,
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
            waitTime: fileInstructions.waitTime || 2000, // Default 2 seconds
            stabilityTime: fileInstructions.stabilityTime || 5000, // Default 5 seconds of no changes
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
            waitTime: 2000,
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
            instructions.stabilityTime = 5000; // Default 5 seconds
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
                if (f.includes('-draft')) {
                    return f.replace('-draft', '-complete');
                } else if (!f.includes('-complete')) {
                    const base = f.replace(/\.md$/, '');
                    return `${base}-complete.md`;
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
        const stepName = section?.stepName || sectionId;
        
        try {
            const now = Date.now();
            const changedFiles = [];
            const newCompleteFiles = [];
            
            // Check if using server-side watching
            if (this.targetDirectory.type === 'server') {
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
                    console.warn(`Error fetching files for ${sectionId}:`, error.message);
                    return; // Gracefully continue
                }
                
                // If directory doesn't exist or has no files, try parent automation directory
                if (!response.ok || (result && (!result.success || result.error === 'Directory does not exist' || (result.files && result.files.length === 0)))) {
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
                            return;
                        }
                    } catch (error) {
                        console.warn(`Error checking parent directory for ${sectionId}:`, error.message);
                        return; // Gracefully continue
                    }
                }
                
                // Store the actual directory where files were found
                if (watcher) {
                    watcher.actualDirectory = normalizedWatchDir;
                }
                
                if (response.ok) {
                    if (result && result.success && result.files) {
                        for (const file of result.files) {
                            const fileName = file.name;
                            
                            // Check if file matches any expected pattern
                            const matchesPattern = instructions.files.length === 0 || 
                                instructions.files.some(expected => {
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
                            
                            // Check if file matches completion pattern
                            // CRITICAL: Always check section-specific patterns FIRST to prevent cross-section contamination
                            // Must match BOTH step name AND automation ID for this specific section
                            let isCompleteFile = false;
                            const lowerFileName = fileName.toLowerCase();
                            const lowerStepName = stepName.toLowerCase();
                            const automationId = section?.automationId || '';
                            
                            // First priority: Check for section-specific pattern with automation ID
                            if (automationId) {
                                // Match patterns like "theoria-[id]-complete.md" - must be exact match
                                const idPattern = `${lowerStepName}-${automationId.toLowerCase()}-complete`;
                                const exactPattern = new RegExp(`^${idPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.md$`, 'i');
                                if (exactPattern.test(fileName)) {
                                    isCompleteFile = true;
                                    console.log(`File matches section pattern: ${fileName} for ${stepName} with ID ${automationId}`);
                                }
                            }
                            
                            // Fallback: match patterns without ID for backward compatibility (only if no ID is set)
                            if (!isCompleteFile && !automationId) {
                                const exactPattern = new RegExp(`^${lowerStepName}-complete\\.md$`, 'i');
                                if (exactPattern.test(fileName)) {
                                    isCompleteFile = true;
                                    console.log(`File matches section pattern (no ID): ${fileName} for ${stepName}`);
                                }
                            }
                            
                            // Last resort: check generic patterns from instructions (but only if section-specific didn't match)
                            if (!isCompleteFile) {
                                isCompleteFile = instructions.completeFiles.some(expected => {
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
                            
                            if (matchesPattern || isCompleteFile) {
                                const fileState = watcher.fileStates.get(fileName);
                                
                                if (!fileState) {
                                    // New file detected
                                    watcher.fileStates.set(fileName, {
                                        lastModified: file.lastModified,
                                        stableSince: now,
                                        size: file.size
                                    });
                                    watcher.foundFiles.add(fileName);
                                    changedFiles.push({ fileName, file });
                                } else {
                                    // Existing file - check if it changed
                                    if (fileState.lastModified !== file.lastModified || fileState.size !== file.size) {
                                        // File was modified - reset stability timer
                                        watcher.fileStates.set(fileName, {
                                            lastModified: file.lastModified,
                                            stableSince: now,
                                            size: file.size
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
                                
                                if (matchesPattern) {
                                    console.log('File matches pattern:', fileName);
                                }
                            } else {
                                console.log('File does not match patterns:', fileName, 'expected:', instructions.files, 'complete:', instructions.completeFiles);
                            }
                        }
                    } else {
                        console.warn('Failed to get files from server:', result.error || 'Unknown error');
                    }
                } else {
                    console.warn('Server response not OK:', response.status);
                }
            } else if (this.targetDirectory.entries) {
                // File System Access API
                for await (const entry of this.targetDirectory.values()) {
                    if (entry.kind === 'file') {
                        const fileName = entry.name;
                        
                        try {
                            const fileHandle = await this.targetDirectory.getFileHandle(fileName);
                            const file = await fileHandle.getFile();
                            const fileSize = file.size;
                            const lastModified = file.lastModified;
                            
                            // Check if file matches any expected pattern
                            const matchesPattern = instructions.files.length === 0 || 
                                instructions.files.some(expected => {
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
                            
                            // Check if file matches completion pattern
                            // CRITICAL: Always check section-specific patterns FIRST to prevent cross-section contamination
                            // Must match BOTH step name AND automation ID for this specific section
                            let isCompleteFile = false;
                            const lowerFileName = fileName.toLowerCase();
                            const lowerStepName = stepName.toLowerCase();
                            const automationId = section?.automationId || '';
                            
                            // First priority: Check for section-specific pattern with automation ID
                            if (automationId) {
                                // Match patterns like "theoria-[id]-complete.md" - must be exact match
                                const idPattern = `${lowerStepName}-${automationId.toLowerCase()}-complete`;
                                const exactPattern = new RegExp(`^${idPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.md$`, 'i');
                                if (exactPattern.test(fileName)) {
                                    isCompleteFile = true;
                                    console.log(`File matches section pattern: ${fileName} for ${stepName} with ID ${automationId}`);
                                }
                            }
                            
                            // Fallback: match patterns without ID for backward compatibility (only if no ID is set)
                            if (!isCompleteFile && !automationId) {
                                const exactPattern = new RegExp(`^${lowerStepName}-complete\\.md$`, 'i');
                                if (exactPattern.test(fileName)) {
                                    isCompleteFile = true;
                                    console.log(`File matches section pattern (no ID): ${fileName} for ${stepName}`);
                                }
                            }
                            
                            // Last resort: check generic patterns from instructions (but only if section-specific didn't match)
                            if (!isCompleteFile) {
                                isCompleteFile = instructions.completeFiles.some(expected => {
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
                            
                            if (matchesPattern || isCompleteFile) {
                                const fileState = watcher.fileStates.get(fileName);
                                
                                if (!fileState) {
                                    // New file detected
                                    watcher.fileStates.set(fileName, {
                                        lastModified: lastModified,
                                        stableSince: now,
                                        size: fileSize
                                    });
                                    watcher.foundFiles.add(fileName);
                                    changedFiles.push({ fileName, entry, file });
                                } else {
                                    // Existing file - check if it changed
                                    if (fileState.lastModified !== lastModified || fileState.size !== fileSize) {
                                        // File was modified - reset stability timer
                                        watcher.fileStates.set(fileName, {
                                            lastModified: lastModified,
                                            stableSince: now,
                                            size: fileSize
                                        });
                                        changedFiles.push({ fileName, entry, file });
                                    }
                                }
                                
                                // Check if this is a completion file
                                if (isCompleteFile && !watcher.completeFiles.has(fileName)) {
                                    watcher.completeFiles.add(fileName);
                                    newCompleteFiles.push({ fileName, entry, file });
                                }
                            }
                        } catch (error) {
                            console.warn('Error accessing file:', fileName, error);
                        }
                    }
                }
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
                const isExistingFile = timeSinceLastChange < 2000; // Detected less than 2 seconds ago
                if (timeSinceLastChange >= watcher.stabilityTime || (isExistingFile && timeSinceLastChange >= 1000)) {
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
            const stepName = section?.stepName || sectionId;
            const automationId = section?.automationId || '';
            
            // DIAGNOSTIC: Log section data for validation
            console.log(`[DIAG] processFiles - sectionId: ${sectionId}, stepName: ${stepName}, automationId: ${automationId}`);
            console.log(`[DIAG] Section object:`, {
                sectionId: section?.sectionId,
                stepName: section?.stepName,
                automationId: section?.automationId,
                hasStepName: !!section?.stepName,
                hasAutomationId: !!section?.automationId
            });
            
            // Read all found files (prefer complete files, fallback to stable files)
            const fileContents = [];
            const filesToRead = watcher.completeFiles.size > 0 
                ? Array.from(watcher.completeFiles) 
                : Array.from(watcher.foundFiles);
            
            // DIAGNOSTIC: Log files to be processed
            console.log(`[DIAG] Files to process:`, Array.from(filesToRead));
            
            if (this.targetDirectory.type === 'server') {
                // Read files via server API
                // Use the actual directory where files were found (stored in watcher), otherwise fall back
                const baseDir = watcher.actualDirectory || 
                               (instructions.directory ? instructions.directory.replace(/`/g, '').trim() : this.targetDirectory.path);
                
                for (const fileName of filesToRead) {
                    // VALIDATION: Verify fileName matches section before processing
                    const lowerFileName = fileName.toLowerCase();
                    const lowerStepName = stepName.toLowerCase();
                    let matches = false;
                    
                    // More flexible validation: allow files that start with step name
                    if (automationId) {
                        // First try exact match with ID
                        const idPattern = `${lowerStepName}-${automationId.toLowerCase()}-complete`;
                        const exactPattern = new RegExp(`^${idPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.md$`, 'i');
                        matches = exactPattern.test(fileName);
                        console.log(`[DIAG] processFiles validation: ${fileName} matches ${stepName}-${automationId}-complete.md? ${matches}`);
                        
                        // Fallback: allow files starting with step name (e.g., "research-findings-complete.md")
                        if (!matches) {
                            const stepNamePrefixPattern = new RegExp(`^${lowerStepName}-.*-complete\\.md$`, 'i');
                            matches = stepNamePrefixPattern.test(fileName);
                            console.log(`[DIAG] processFiles validation: ${fileName} matches step name prefix pattern? ${matches}`);
                        }
                    } else {
                        // Try exact match first
                        const exactPattern = new RegExp(`^${lowerStepName}-complete\\.md$`, 'i');
                        matches = exactPattern.test(fileName);
                        console.log(`[DIAG] processFiles validation: ${fileName} matches ${stepName}-complete.md? ${matches}`);
                        
                        // Fallback: allow files starting with step name
                        if (!matches) {
                            const stepNamePrefixPattern = new RegExp(`^${lowerStepName}-.*-complete\\.md$`, 'i');
                            matches = stepNamePrefixPattern.test(fileName);
                            console.log(`[DIAG] processFiles validation: ${fileName} matches step name prefix pattern? ${matches}`);
                        }
                    }
                    
                    if (!matches) {
                        console.warn(`[DIAG] ⚠ SKIPPING file ${fileName} in processFiles - does not match section ${sectionId} (step: ${stepName}, ID: ${automationId})`);
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
                        console.warn('Failed to read file:', fileName, error);
                    }
                }
            } else if (this.targetDirectory.entries) {
                // File System Access API
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
                        console.warn('Failed to read file:', fileName, error);
                    }
                }
            }
            
            if (fileContents.length === 0) {
                console.warn('No files found to process');
                return;
            }
            
            // Combine file contents
            const combinedOutput = fileContents.map(f => 
                `## ${f.name}\n\n${f.content}`
            ).join('\n\n---\n\n');
            
            // Update section output
            this.stateManager.updateSection(projectId, sectionId, {
                output: combinedOutput,
                status: 'complete'
            });
            
            // Delete draft files if complete files are present
            await this.deleteDraftFiles(projectId, sectionId, instructions, filesToRead);
            
            // Emit event
            this.eventSystem.emit(EventType.AUTOMATION_SECTION_COMPLETE, {
                source: 'AutomationSystem',
                data: { projectId, sectionId, fileCount: fileContents.length }
            });
            
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
        
        const project = this.stateManager.getProject(projectId);
        if (!project) return;
        
        const pipelineConfig = window.PipelineConfig;
        if (!pipelineConfig) return;
        
        const nextSection = await pipelineConfig.getNextSection(currentSectionId, project.sections);
        if (!nextSection) {
            // No more sections - but don't stop automation, just continue monitoring
            // Automation will continue checking all sections for updates
            return;
        }
        
        // DO NOT automatically inject output into input - this should be manual only
        // Users can use the "Paste from Previous Section" button if they want to do this
        
        // Navigate to next section
        this.currentSectionId = nextSection.sectionId;
        
        // Start watching for next section
        await this.watchForSection(projectId, nextSection.sectionId);
        
        // Emit event to update UI
        this.eventSystem.emit(EventType.SECTION_UPDATED, {
            source: 'AutomationSystem',
            data: { projectId, sectionId: nextSection.sectionId }
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
                const altDraftName = completeFileName.replace(/-complete\.md$/, '-draft.md');
                if (altDraftName !== draftFileName && !draftFilesToDelete.includes(altDraftName)) {
                    draftFilesToDelete.push(altDraftName);
                }
            } else {
                // Check if there's a corresponding draft file in the watched files
                const matchingDraft = instructions.files.find(f => {
                    if (f.includes('-draft')) {
                        // Extract base name from complete file
                        const baseName = completeFileName.replace(/-complete\.md$/, '').replace(/\.md$/, '');
                        const draftBase = f.replace('-draft.md', '').replace('.md', '');
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

