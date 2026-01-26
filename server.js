// Node.js server for feat-spec app with file watching capabilities
const http = require('http');
const fs = require('fs');
const path = require('path');
const { watch } = require('fs');
const { URL } = require('url');
const { exec, execFile, spawn } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);
const PathService = require('./server/utils/PathService');
const ServerErrorHandler = require('./server/utils/ServerErrorHandler');
const RateLimiter = require('./server/utils/RateLimiter');
const SchemaValidator = require('./server/utils/SchemaValidator');

const PORT = process.env.PORT || 8050;

// Initialize server error handler
const errorHandler = new ServerErrorHandler();
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SAVED_FILES_DIR = path.join(__dirname, 'saved-files');

// Initialize rate limiter (100 requests per minute per IP)
const rateLimiter = new RateLimiter(100, 60000);

// Initialize schema validator
const schemaValidator = new SchemaValidator();

// Cleanup rate limiter every minute
setInterval(() => rateLimiter.cleanup(), 60000);

// Server-side constants (matching client-side AppConstants)
const SERVER_CONSTANTS = {
    TIMEOUTS: {
        CURSOR_CLI_TIMEOUT: 300000,      // 5 minutes
        SERVER_OPERATION_DELAY: 100       // 100ms
    },
    BUFFERS: {
        CURSOR_CLI_MAX: 10 * 1024 * 1024  // 10MB
    }
};

// Initialize PathService
const pathService = new PathService(PROJECT_ROOT);

// Handle Windows path separators (legacy function, now uses PathService)
function normalizePath(p) {
    return pathService.normalize(p);
}

// Ensure saved-files directory exists
if (!fs.existsSync(SAVED_FILES_DIR)) {
    fs.mkdirSync(SAVED_FILES_DIR, { recursive: true });
}

// Store active watchers: { directoryPath: { watcher, files: Map, clients: Set } }
const watchers = new Map();

// Simple file server
function serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.md': 'text/markdown',
        '.txt': 'text/plain'
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            errorHandler.sendErrorResponse(res, err, {
                source: 'Server',
                operation: 'serveFile',
                filePath: filePath
            }, 404);
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// Watch a directory for file changes
function watchDirectory(dirPath, projectId, sectionId) {
    // Validate path using PathService
    const validation = pathService.validate(dirPath);
    if (!validation.valid) {
        return { error: validation.error || 'Access denied' };
    }
    
    const normalizedPath = validation.path;
    const key = `${projectId}:${sectionId}:${normalizedPath}`;
    
    if (!fs.existsSync(normalizedPath)) {
        return { error: 'Directory does not exist' };
    }
    
    if (!fs.statSync(normalizedPath).isDirectory()) {
        return { error: 'Path is not a directory' };
    }
    
    // Check if already watching
    if (watchers.has(key)) {
        return { success: true, alreadyWatching: true };
    }
    
    const fileStates = new Map();
    const watcher = watch(normalizedPath, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        
        const filePath = path.join(normalizedPath, filename);
        
        try {
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
                const state = fileStates.get(filename) || { lastModified: 0, size: 0 };
                const newState = {
                    lastModified: stats.mtimeMs,
                    size: stats.size,
                    path: filePath
                };
                
                // Check if file changed
                if (state.lastModified !== newState.lastModified || state.size !== newState.size) {
                    fileStates.set(filename, newState);
                }
            }
        } catch (err) {
            // File might have been deleted
            fileStates.delete(filename);
        }
    });
    
    watchers.set(key, {
        watcher,
        fileStates,
        directory: normalizedPath,
        projectId,
        sectionId
    });
    
    return { success: true, key };
}

// Get file list and states for a directory
function getDirectoryFiles(dirPath) {
    // Validate path using PathService
    const validation = pathService.validate(dirPath);
    if (!validation.valid) {
        return { error: validation.error || 'Access denied' };
    }
    
    const normalizedPath = validation.path;
    
    if (!fs.existsSync(normalizedPath)) {
        return { error: 'Directory does not exist' };
    }
    
    if (!fs.statSync(normalizedPath).isDirectory()) {
        return { error: 'Path is not a directory' };
    }
    
    try {
        const files = fs.readdirSync(normalizedPath, { withFileTypes: true })
            .filter(dirent => dirent.isFile())
            .map(dirent => {
                const filePath = path.join(normalizedPath, dirent.name);
                const stats = fs.statSync(filePath);
                return {
                    name: dirent.name,
                    path: filePath,
                    size: stats.size,
                    lastModified: stats.mtimeMs,
                    created: stats.birthtimeMs
                };
            });
        
        return { success: true, files };
    } catch (err) {
        return { error: err.message };
    }
}

// Read file contents (async to prevent blocking)
async function readFile(filePath) {
    const normalizedPath = path.resolve(PROJECT_ROOT, filePath);
    
    // Security: ensure path is within project root
    if (!normalizedPath.startsWith(PROJECT_ROOT)) {
        return { error: 'Access denied' };
    }
    
    try {
        // Use async readFile for large files to prevent blocking
        const content = await fs.promises.readFile(normalizedPath, 'utf8');
        const stats = await fs.promises.stat(normalizedPath);
        return {
            success: true,
            content,
            name: path.basename(normalizedPath),
            lastModified: stats.mtimeMs,
            size: stats.size
        };
    } catch (err) {
        return { error: err.message };
    }
}

// Stop watching a directory
function stopWatching(key) {
    if (watchers.has(key)) {
        const { watcher } = watchers.get(key);
        watcher.close();
        watchers.delete(key);
        return { success: true };
    }
    return { error: 'Watcher not found' };
}

// Server-side constants for validation
const SERVER_VALIDATION = {
    MAX_FILENAME_LENGTH: 255,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_REQUEST_BODY_SIZE: 11 * 1024 * 1024, // 11MB (slightly larger than max file)
    ALLOWED_FILE_EXTENSIONS: ['.json', '.md', '.txt'],
    BLOCKED_EXTENSIONS: ['.exe', '.sh', '.bat', '.cmd', '.ps1', '.js', '.html']
};

// Save file to server
function saveFileToServer(filename, content) {
    try {
        // Validate filename
        if (!filename || typeof filename !== 'string') {
            return { success: false, error: 'Invalid filename' };
        }
        
        const trimmed = filename.trim();
        if (trimmed.length === 0) {
            return { success: false, error: 'Filename cannot be empty' };
        }
        
        if (trimmed.length > SERVER_VALIDATION.MAX_FILENAME_LENGTH) {
            return { success: false, error: 'Filename too long' };
        }
        
        // Reject path separators
        if (trimmed.includes('/') || trimmed.includes('\\')) {
            return { success: false, error: 'Filename cannot contain path separators' };
        }
        
        // Reject parent directory references
        if (trimmed.includes('..')) {
            return { success: false, error: 'Filename cannot contain parent directory references' };
        }
        
        // Reject control characters
        if (/[\x00-\x1f<>:"|?*]/.test(trimmed)) {
            return { success: false, error: 'Filename contains invalid characters' };
        }
        
        // Validate file extension
        const ext = path.extname(trimmed).toLowerCase();
        if (SERVER_VALIDATION.BLOCKED_EXTENSIONS.includes(ext)) {
            return { success: false, error: 'File type not allowed' };
        }
        
        // Sanitize filename (strict whitelist)
        const safeFilename = trimmed.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = path.join(SAVED_FILES_DIR, safeFilename);
        
        // Validate content size and ensure content is a string
        const contentString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        if (contentString.length > SERVER_VALIDATION.MAX_FILE_SIZE) {
            return { success: false, error: 'File size exceeds maximum allowed size' };
        }
        
        fs.writeFileSync(filePath, contentString, 'utf8');
        return { success: true, filename: safeFilename, path: filePath };
    } catch (error) {
        const result = errorHandler.handleError(error, {
            source: 'Server',
            operation: 'saveFileToServer',
            filename: filename
        });
        return { success: false, error: result.error, code: result.code };
    }
}

// Execute cursor-cli command
function executeCursorCLI(prompt, scopeDirectory) {
    console.log('[executeCursorCLI] Called with scopeDirectory:', scopeDirectory);
    console.log('[executeCursorCLI] Prompt length:', prompt ? prompt.length : 0);
    return new Promise((resolve, reject) => {
        try {
            if (!prompt || !scopeDirectory) {
                console.error('[executeCursorCLI] Missing prompt or scopeDirectory');
                reject(new Error('Prompt and scope directory are required'));
                return;
            }
            
            // Handle scope directory path (could be absolute or relative)
            const scopeDir = scopeDirectory.trim();
            
            // Use PathService to resolve and normalize
            let scopePath;
            if (pathService.isAbsolute(scopeDir)) {
                // Already absolute - validate it exists and is accessible
                scopePath = path.resolve(scopeDir);
                // For chat system, allow scope directories outside project root (read-only context)
                // But validate the path exists
                if (!fs.existsSync(scopePath)) {
                    reject(new Error('Scope directory does not exist'));
                    return;
                }
            } else {
                // Relative path - validate using PathService
                const validation = pathService.validate(scopeDir);
                if (!validation.valid) {
                    reject(new Error(validation.error || 'Invalid scope directory path'));
                    return;
                }
                scopePath = validation.path;
            }
            
            // Validate path exists
            if (!fs.existsSync(scopePath)) {
                reject(new Error('Scope directory does not exist'));
                return;
            }
            
            console.log(`[Cursor CLI] Path validation passed: ${scopePath}`);
            
            // Check if scope directory exists
            if (!fs.existsSync(scopePath) || !fs.statSync(scopePath).isDirectory()) {
                reject(new Error('Scope directory does not exist or is not a directory'));
                return;
            }
            
            // Build cursor-agent command
            // Syntax from https://cursor.com/cli: cursor-agent -p --force "prompt"
            // -p: print mode (non-interactive)
            // --force: enable file modifications
            // The agent works in the current directory context
            // Try cursor-agent from PATH first, then try WSL, then common install locations
            const homeDir = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH;
            let cursorAgentPath = 'cursor-agent';
            
            // Use WSL cursor-agent if Windows, otherwise use native
            if (process.platform === 'win32') {
                // Convert Windows path to WSL path for scope directory
                const wslScopePath = scopePath.replace(/^([A-Z]):/, (match, drive) => {
                    return `/mnt/${drive.toLowerCase()}`;
                }).replace(/\\/g, '/');
                
                // Get API key from environment variable
                const apiKey = process.env.CURSOR_API_KEY;
                if (!apiKey) {
                    throw new Error('CURSOR_API_KEY environment variable is required');
                }
                
                // Build the bash command - pass prompt via stdin using "$(cat)" to avoid escaping issues
                // This matches the working approach from the Unity bridge script
                const escapedApiKey = JSON.stringify(apiKey);
                const escapedScopePath = JSON.stringify(wslScopePath);
                
                // Use stdin approach exactly like the working Unity bridge script
                // Build command string WITHOUT the prompt (prompt goes to stdin)
                let command = 'cd ' + escapedScopePath + ' && ' +
                    'mkdir -p ~/.cursor && ' +
                    '(test -f ~/.cursor/cli-config.json || echo "{}" > ~/.cursor/cli-config.json) && ' +
                    'export PATH="$HOME/.local/bin:$PATH" && ' +
                    'export CURSOR_CLI_NO_RETRY=1';
                
                // Add API key as environment variable (not flag)
                if (apiKey) {
                    command += ' && export CURSOR_API_KEY=' + escapedApiKey;
                }
                
                // Add cursor-agent command with -p "$(cat)" to read from stdin
                // This is the exact pattern from the working script
                command += ' && cursor-agent --print -p "$(cat)"';
                
                const bashCmd = command;
                
                // Debug logging
                console.log('[Cursor CLI] Using stdin approach (matching working script)');
                console.log('[Cursor CLI] Command (no prompt, prompt goes to stdin):', bashCmd);
                console.log('[Cursor CLI] Scope path:', wslScopePath);
                console.log('[Cursor CLI] Prompt length:', prompt.length, 'chars');
                
                // Use spawn with stdin pipe enabled (exactly like working script)
                const wslProcess = spawn('wsl.exe', ['bash', '-c', bashCmd], {
                    cwd: scopePath,
                    shell: false,
                    stdio: ['pipe', 'pipe', 'pipe'] // Enable stdin to write prompt
                });
                
                let stdout = '';
                let stderr = '';
                
                // Write prompt to stdin (exactly like working script)
                wslProcess.stdin.write(prompt, 'utf8');
                wslProcess.stdin.end();
                
                wslProcess.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                
                wslProcess.stderr.on('data', (data) => {
                    const chunk = data.toString();
                    stderr += chunk;
                });

                wslProcess.on('close', (code) => {
                    // cursor-agent may exit with non-zero but still produce output
                    if (stdout || stderr) {
                        resolve({
                            success: true,
                            output: stdout,
                            stderr: stderr
                        });
                    } else if (code !== 0) {
                        reject(new Error(`Cursor CLI error: Process exited with code ${code}\n${stderr || 'No output'}`));
                    } else {
                        resolve({
                            success: true,
                            output: stdout,
                            stderr: stderr
                        });
                    }
                });
                
                wslProcess.on('error', (error) => {
                    reject(new Error(`Cursor CLI error: ${error.message}\n${stderr || ''}`));
                });
                
                // Set timeout
                setTimeout(() => {
                    if (!wslProcess.killed) {
                        wslProcess.kill();
                        reject(new Error('Cursor CLI timeout after 5 minutes'));
                    }
                }, 300000);
                return; // Early return for WSL path
            } else {
                // Linux/Mac - use stdin approach for consistency
                const apiKey = process.env.CURSOR_API_KEY;
                if (!apiKey) {
                    throw new Error('CURSOR_API_KEY environment variable is required');
                }
                const escapedApiKey = JSON.stringify(apiKey);
                const escapedScopePath = JSON.stringify(scopePath);
                
                // Build command using stdin approach (same as Windows/WSL)
                const bashCmd = 'export PATH="$HOME/.local/bin:$PATH" && ' +
                    'export CURSOR_API_KEY=' + escapedApiKey + ' && ' +
                    'cd ' + escapedScopePath + ' && ' +
                    'cursor-agent -p --force "$(cat)"';
                
                // Use spawn with stdin pipe enabled
                const cursorProcess = spawn('bash', ['-c', bashCmd], {
                    cwd: scopePath,
                    shell: false,
                    stdio: ['pipe', 'pipe', 'pipe'], // Enable stdin pipe
                    env: {
                        ...process.env,
                        PATH: `${homeDir ? `${homeDir}/.local/bin:` : ''}${process.env.PATH}`,
                        CURSOR_API_KEY: apiKey
                    }
                });
                
                let stdout = '';
                let stderr = '';
                
                // Write prompt to stdin (this avoids all escaping issues)
                cursorProcess.stdin.write(prompt, 'utf8');
                cursorProcess.stdin.end();
                
                cursorProcess.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                
                cursorProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                
                cursorProcess.on('close', (code) => {
                    // cursor-agent may exit with non-zero but still produce output
                    if (stdout || stderr) {
                        resolve({
                            success: true,
                            output: stdout,
                            stderr: stderr
                        });
                    } else if (code !== 0) {
                        reject(new Error(`Cursor CLI error: Process exited with code ${code}\n${stderr || 'No output'}`));
                    } else {
                        resolve({
                            success: true,
                            output: stdout,
                            stderr: stderr
                        });
                    }
                });
                
                cursorProcess.on('error', (error) => {
                    reject(new Error(`Cursor CLI error: ${error.message}\n${stderr || ''}`));
                });
                
                // Set timeout
                setTimeout(() => {
                    if (!cursorProcess.killed) {
                        cursorProcess.kill();
                        reject(new Error('Cursor CLI timeout after 5 minutes'));
                    }
                }, SERVER_CONSTANTS.TIMEOUTS.CURSOR_CLI_TIMEOUT);
                return; // Early return for native path
            }
            
            // Execute command in the scope directory
            exec(command, {
                cwd: scopePath,
                maxBuffer: 10 * 1024 * 1024, // 10MB buffer
                timeout: 300000 // 5 minute timeout
            }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Cursor CLI error: ${error.message}\n${stderr || ''}`));
                    return;
                }
                
                // Return the output
                resolve({
                    success: true,
                    output: stdout,
                    stderr: stderr || ''
                });
            });
        } catch (error) {
            reject(error);
        }
    });
}

// Save file to automation directory
function saveAutomationFile(filePath, content) {
    try {
        // Use PathService to resolve and validate path
        const validation = pathService.validate(filePath.trim());
        if (!validation.valid) {
            return { success: false, error: validation.error || 'Access denied' };
        }
        
        const targetPath = validation.path;
        
        // Ensure the directory exists using PathService
        const dirPath = path.dirname(targetPath);
        const dirResult = pathService.ensureDirectory(dirPath);
        if (!dirResult.success) {
            return { success: false, error: dirResult.error || 'Failed to create directory' };
        }
        
        // Ensure content is a string
        const contentString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        
        // Validate content size
        if (contentString.length > SERVER_VALIDATION.MAX_FILE_SIZE) {
            return { success: false, error: 'File size exceeds maximum allowed size' };
        }
        
        // Validate file extension
        const ext = path.extname(filePath).toLowerCase();
        if (SERVER_VALIDATION.BLOCKED_EXTENSIONS.includes(ext)) {
            return { success: false, error: 'File type not allowed' };
        }
        
        // Validate JSON structure if file is .json
        if (ext === '.json') {
            try {
                JSON.parse(contentString);
            } catch (parseError) {
                return { success: false, error: 'Invalid JSON content' };
            }
        }
        
        // Write the file
        fs.writeFileSync(targetPath, contentString, 'utf8');
        
        // Return relative path from project root (normalized)
        const relativePath = pathService.getRelative(targetPath);
        const normalizedPath = pathService.normalize(relativePath);
        
        return { success: true, path: normalizedPath };
    } catch (error) {
        const result = errorHandler.handleError(error, {
            source: 'Server',
            operation: 'saveFileToServer',
            filename: filename
        });
        return { success: false, error: result.error, code: result.code };
    }
}

// List saved files
function listSavedFiles() {
    try {
        const files = fs.readdirSync(SAVED_FILES_DIR)
            .filter(f => f.endsWith('.json'))
            .map(f => {
                const filePath = path.join(SAVED_FILES_DIR, f);
                const stats = fs.statSync(filePath);
                return {
                    name: f,
                    size: stats.size,
                    modified: stats.mtime.toISOString(),
                    created: stats.birthtime.toISOString()
                };
            })
            .sort((a, b) => new Date(b.modified) - new Date(a.modified)); // Most recent first
        
        return { success: true, files };
    } catch (error) {
        return { success: false, error: error.message, files: [] };
    }
}

// Load file from server
function loadFileFromServer(filename) {
    try {
        // Validate filename (same validation as saveFileToServer)
        if (!filename || typeof filename !== 'string') {
            return { success: false, error: 'Invalid filename' };
        }
        
        const trimmed = filename.trim();
        if (trimmed.length === 0 || trimmed.length > SERVER_VALIDATION.MAX_FILENAME_LENGTH) {
            return { success: false, error: 'Invalid filename' };
        }
        
        if (trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('..')) {
            return { success: false, error: 'Invalid filename' };
        }
        
        // Sanitize filename (strict whitelist)
        const safeFilename = trimmed.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = path.join(SAVED_FILES_DIR, safeFilename);
        
        // Security: ensure file is within saved-files directory
        const resolvedPath = path.resolve(filePath);
        const resolvedDir = path.resolve(SAVED_FILES_DIR);
        if (!resolvedPath.startsWith(resolvedDir)) {
            return { success: false, error: 'Access denied' };
        }
        
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'File not found' };
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const stats = fs.statSync(filePath);
        
        // Validate JSON content against schema
        try {
            const parsedData = JSON.parse(content);
            const validation = schemaValidator.validateProjectGroup(parsedData);
            
            if (!validation.success) {
                return {
                    success: false,
                    error: `Invalid file format: ${validation.message}`,
                    code: 'VALIDATION_ERROR'
                };
            }
        } catch (parseError) {
            // If JSON parsing fails, return error
            return {
                success: false,
                error: `Invalid JSON: ${parseError.message}`,
                code: 'PARSE_ERROR'
            };
        }
        
        return {
            success: true,
            filename: safeFilename,
            content: content,
            size: stats.size,
            modified: stats.mtime.toISOString()
        };
    } catch (error) {
        const result = errorHandler.handleError(error, {
            source: 'Server',
            operation: 'saveFileToServer',
            filename: filename
        });
        return { success: false, error: result.error, code: result.code };
    }
}

// Create automation directory
function createAutomationDirectory(caseSlug, defaultDir = null) {
    try {
        // Generate unique 6-character alphanumeric ID
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let uniqueId = '';
        for (let i = 0; i < 6; i++) {
            uniqueId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Create directory name: [case-slug]-[unique-id]
        const dirName = `${caseSlug}-${uniqueId}`;
        
        // Determine base directory: use defaultDir if provided, otherwise use feat-spec/projects
        let baseDir;
        if (defaultDir && defaultDir.trim()) {
            // Use provided default directory (relative to PROJECT_ROOT)
            baseDir = path.resolve(PROJECT_ROOT, defaultDir.trim());
        } else {
            // Default directory is feat-spec/projects
            baseDir = path.join(__dirname, 'projects');
        }
        
        const newDirPath = path.join(baseDir, dirName);
        
        // Ensure base directory exists
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }
        
        // Check if directory already exists (unlikely but possible)
        if (fs.existsSync(newDirPath)) {
            // Try again with a new ID
            return createAutomationDirectory(caseSlug, defaultDir);
        }
        
        // Create the directory
        fs.mkdirSync(newDirPath, { recursive: true });
        
        // Return relative path from project root
        const relativePath = path.relative(PROJECT_ROOT, newDirPath);
        // Normalize path separators for cross-platform compatibility
        const normalizedPath = normalizePath(relativePath);
        
        return {
            success: true,
            path: normalizedPath,
            absolutePath: newDirPath,
            dirName: dirName
        };
    } catch (error) {
        const result = errorHandler.handleError(error, {
            source: 'Server',
            operation: 'saveFileToServer',
            filename: filename
        });
        return { success: false, error: result.error, code: result.code };
    }
}

// Ensure directory exists (create if it doesn't)
function ensureDirectoryExists(dirPath) {
    try {
        if (!dirPath || !dirPath.trim()) {
            return { success: false, error: 'Directory path is required' };
        }
        
        // Use PathService to ensure directory exists
        const result = pathService.ensureDirectory(dirPath.trim());
        
        if (!result.success) {
            return result;
        }
        
        // Get absolute path for return value
        const absolutePath = pathService.resolve(dirPath.trim());
        
        // Verify it's actually a directory
        if (fs.existsSync(absolutePath) && !fs.statSync(absolutePath).isDirectory()) {
            return { success: false, error: 'Path exists but is not a directory' };
        }
        
        return {
            success: true,
            path: result.path,
            absolutePath: absolutePath
        };
    } catch (error) {
        const result = errorHandler.handleError(error, {
            source: 'Server',
            operation: 'saveFileToServer',
            filename: filename
        });
        return { success: false, error: result.error, code: result.code };
    }
}

// List files in a directory
function listDirectoryFiles(dirPath) {
    try {
        if (!dirPath || !dirPath.trim()) {
            return { success: false, error: 'Directory path is required' };
        }
        
        // Validate path using PathService
        const validation = pathService.validate(dirPath.trim());
        if (!validation.valid) {
            return { success: false, error: validation.error || 'Access denied' };
        }
        
        const targetPath = validation.path;
        
        if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isDirectory()) {
            return { success: false, error: 'Directory does not exist' };
        }
        
        const files = fs.readdirSync(targetPath, { withFileTypes: true })
            .filter(dirent => dirent.isFile())
            .map(dirent => dirent.name);
        
        return {
            success: true,
            files: files,
            path: targetPath
        };
    } catch (error) {
        const result = errorHandler.handleError(error, {
            source: 'Server',
            operation: 'saveFileToServer',
            filename: filename
        });
        return { success: false, error: result.error, code: result.code };
    }
}

// List files recursively in a scope directory (for chat context)
function listScopeFilesRecursive(scopeDirectory, maxDepth = 10) {
    try {
        if (!scopeDirectory || !scopeDirectory.trim()) {
            return { success: false, error: 'Scope directory is required' };
        }
        
        // Handle scope directory path (could be absolute or relative)
        let targetPath;
        const scopeDir = scopeDirectory.trim();
        
        // Check if path is absolute
        if (path.isAbsolute(scopeDir)) {
            // Already absolute - use as-is but verify it's within project root
            targetPath = path.resolve(scopeDir);
        } else {
            // Relative path - resolve relative to PROJECT_ROOT
            targetPath = path.resolve(PROJECT_ROOT, scopeDir);
        }
        
        // For chat system, allow paths outside project root (read-only context)
        // We still validate the path exists below
        
        if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isDirectory()) {
            return { success: false, error: 'Directory does not exist' };
        }
        
        // Text file extensions
        const textExtensions = [
            '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.json', '.html', '.css', '.scss',
            '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.go', '.rs', '.rb', '.php',
            '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.log', '.sh', '.bat',
            '.ps1', '.sql', '.r', '.m', '.swift', '.kt', '.dart', '.vue', '.svelte',
            '.graphql', '.gql', '.proto', '.thrift', '.avsc', '.avdl'
        ];
        
        const files = [];
        
        // Recursive function to walk directory tree
        function walkDir(dirPath, currentDepth) {
            if (currentDepth > maxDepth) {
                return; // Stop at max depth
            }
            
            try {
                const entries = fs.readdirSync(dirPath, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dirPath, entry.name);
                    
                    // Skip node_modules, .git, and other common ignore directories
                    if (entry.isDirectory()) {
                        const dirName = entry.name.toLowerCase();
                        if (dirName === 'node_modules' || dirName === '.git' || dirName === '.vscode' || dirName === '.idea') {
                            continue;
                        }
                        walkDir(fullPath, currentDepth + 1);
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name).toLowerCase();
                        // Only include text files
                        if (textExtensions.includes(ext)) {
                            try {
                                const stats = fs.statSync(fullPath);
                                const relativePath = path.relative(PROJECT_ROOT, fullPath);
                                files.push({
                                    path: normalizePath(relativePath),
                                    name: entry.name,
                                    size: stats.size,
                                    extension: ext,
                                    lastModified: stats.mtimeMs
                                });
                            } catch (err) {
                                // Skip files that can't be accessed
                                console.warn(`Skipping file ${fullPath}: ${err.message}`);
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn(`Error reading directory ${dirPath}: ${err.message}`);
            }
        }
        
        walkDir(targetPath, 0);
        
        return {
            success: true,
            files: files,
            count: files.length
        };
    } catch (error) {
        const result = errorHandler.handleError(error, {
            source: 'Server',
            operation: 'saveFileToServer',
            filename: filename
        });
        return { success: false, error: result.error, code: result.code };
    }
}

// Move files from one directory to another
function moveFilesBetweenDirectories(sourceDir, targetDir, fileNames) {
    try {
        const sourcePath = path.resolve(PROJECT_ROOT, sourceDir.trim());
        const targetPath = path.resolve(PROJECT_ROOT, targetDir.trim());
        
        // Security: ensure both paths are within project root
        if (!sourcePath.startsWith(PROJECT_ROOT) || !targetPath.startsWith(PROJECT_ROOT)) {
            return { success: false, error: 'Access denied' };
        }
        
        // Ensure target directory exists
        if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true });
        }
        
        const movedFiles = [];
        const errors = [];
        
        for (const fileName of fileNames) {
            try {
                const sourceFile = path.join(sourcePath, fileName);
                const targetFile = path.join(targetPath, fileName);
                
                if (fs.existsSync(sourceFile)) {
                    // If target file exists, add a timestamp to avoid overwriting
                    let finalTarget = targetFile;
                    if (fs.existsSync(finalTarget)) {
                        const ext = path.extname(fileName);
                        const base = path.basename(fileName, ext);
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        finalTarget = path.join(targetPath, `${base}-${timestamp}${ext}`);
                    }
                    
                    fs.copyFileSync(sourceFile, finalTarget);
                    fs.unlinkSync(sourceFile); // Remove from source
                    movedFiles.push(path.basename(finalTarget));
                }
            } catch (error) {
                errors.push({ file: fileName, error: error.message });
            }
        }
        
        return {
            success: errors.length === 0,
            movedFiles: movedFiles,
            errors: errors
        };
    } catch (error) {
        const result = errorHandler.handleError(error, {
            source: 'Server',
            operation: 'saveFileToServer',
            filename: filename
        });
        return { success: false, error: result.error, code: result.code };
    }
}

// Open directory in file browser
function openDirectoryInFileBrowser(dirPath) {
    return new Promise((resolve) => {
        try {
            let targetPath;
            
            // If dirPath is empty or not provided, use the default projects directory
            if (!dirPath || !dirPath.trim()) {
                targetPath = path.join(__dirname, 'projects');
            } else {
                // Resolve the path relative to PROJECT_ROOT
                targetPath = path.resolve(PROJECT_ROOT, dirPath.trim());
            }
            
            // Check if the directory exists
            let directoryExists = false;
            try {
                if (fs.existsSync(targetPath)) {
                    const stats = fs.statSync(targetPath);
                    directoryExists = stats.isDirectory();
                }
            } catch (err) {
                // Path doesn't exist or can't be accessed
                directoryExists = false;
            }
            
            // If the directory doesn't exist, use its parent directory
            if (!directoryExists) {
                const parentPath = path.dirname(targetPath);
                try {
                    if (fs.existsSync(parentPath) && fs.statSync(parentPath).isDirectory()) {
                        targetPath = parentPath;
                        directoryExists = true;
                    }
                } catch (err) {
                    // Parent doesn't exist either
                }
            }
            
            // If still no valid directory, use the default projects directory
            if (!directoryExists) {
                targetPath = path.join(__dirname, 'projects');
                // Create it if it doesn't exist
                if (!fs.existsSync(targetPath)) {
                    try {
                        fs.mkdirSync(targetPath, { recursive: true });
                        directoryExists = true;
                    } catch (err) {
                        resolve({ success: false, error: `Failed to create default directory: ${err.message}` });
                        return;
                    }
                } else {
                    directoryExists = true;
                }
            }
            
            // Open in file browser - Windows uses explorer.exe
            const isWindows = process.platform === 'win32';
            
            if (isWindows) {
                // Windows: use spawn with explorer.exe for better path handling
                // Normalize path separators for Windows
                const normalizedPath = targetPath.replace(/\//g, '\\');
                
                try {
                    const explorer = spawn('explorer.exe', [normalizedPath], {
                        detached: true,
                        stdio: 'ignore'
                    });
                    
                    // Handle spawn errors
                    explorer.on('error', (error) => {
                        resolve({ success: false, error: error.message });
                    });
                    
                    // Don't wait for the process - explorer opens in background
                    explorer.unref();
                    
                    // Give it a moment to start, then resolve
                    setTimeout(() => {
                        resolve({ success: true, path: targetPath });
                    }, SERVER_CONSTANTS.TIMEOUTS.SERVER_OPERATION_DELAY);
                } catch (error) {
                    resolve({ success: false, error: error.message });
                }
            } else if (process.platform === 'darwin') {
                // macOS: use open
                exec(`open "${targetPath}"`, (error) => {
                    if (error) {
                        resolve({ success: false, error: error.message });
                    } else {
                        resolve({ success: true, path: targetPath });
                    }
                });
            } else {
                // Linux: try xdg-open
                exec(`xdg-open "${targetPath}"`, (error) => {
                    if (error) {
                        resolve({ success: false, error: error.message });
                    } else {
                        resolve({ success: true, path: targetPath });
                    }
                });
            }
        } catch (error) {
            resolve({ success: false, error: error.message });
        }
    });
}

// Delete file from server
function deleteFileFromServer(filenameOrPath) {
    try {
        let filePath;
        
        // Check if it's a full path (contains path separators) or just a filename
        if (filenameOrPath.includes('/') || filenameOrPath.includes('\\')) {
            // It's a filePath - resolve relative to PROJECT_ROOT
            const normalizedPath = path.resolve(PROJECT_ROOT, filenameOrPath);
            
            // Security: ensure path is within project root
            if (!normalizedPath.startsWith(PROJECT_ROOT)) {
                return { success: false, error: 'Access denied' };
            }
            
            filePath = normalizedPath;
        } else {
            // It's just a filename - treat as saved-files directory
            const safeFilename = filenameOrPath.replace(/[^a-zA-Z0-9._-]/g, '_');
            filePath = path.join(SAVED_FILES_DIR, safeFilename);
            
            // Security: ensure file is within saved-files directory
            const resolvedPath = path.resolve(filePath);
            const resolvedDir = path.resolve(SAVED_FILES_DIR);
            if (!resolvedPath.startsWith(resolvedDir)) {
                return { success: false, error: 'Access denied' };
            }
        }
        
        if (!fs.existsSync(filePath)) {
            return { success: false, error: 'File not found' };
        }
        
        fs.unlinkSync(filePath);
        
        return {
            success: true,
            filename: path.basename(filePath),
            path: filePath
        };
    } catch (error) {
        const result = errorHandler.handleError(error, {
            source: 'Server',
            operation: 'saveFileToServer',
            filename: filename
        });
        return { success: false, error: result.error, code: result.code };
    }
}

// HTTP server
const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Content Security Policy headers
    const cspHeader = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self';";
    res.setHeader('Content-Security-Policy', cspHeader);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    console.log(`[${req.method}] ${pathname}`);
    
    // API endpoints - apply rate limiting
    if (pathname.startsWith('/api/')) {
        // Apply rate limiting middleware
        rateLimiter.middleware(req, res, () => {
            // Continue with API handling
            handleApiRequest(req, res, pathname);
        });
        return;
    }
    
    // Non-API file serving
    serveNonApiFiles(req, res, pathname);
});

// Handle API requests (extracted for rate limiting)
function handleApiRequest(req, res, pathname) {
        // Handle GET requests for /api/list-files
        if (pathname === '/api/list-files' && req.method === 'GET') {
            const result = errorHandler.handleSync(() => listSavedFiles(), {
                source: 'Server',
                operation: 'list-files',
                method: req.method
            });
            if (result.success) {
                errorHandler.sendSuccessResponse(res, result.data);
            } else {
                errorHandler.sendErrorResponse(res, result.error, {
                    source: 'Server',
                    operation: 'list-files'
                });
            }
            return;
        }
        
        // Handle POST requests (and other methods that need body)
        if (req.method === 'POST' || req.method === 'PUT') {
            let body = '';
            req.on('data', chunk => { body += chunk.toString(); });
            req.on('end', () => {
                try {
                    const data = body ? JSON.parse(body) : {};
                    
                    // Debug logging
                    console.log(`[${req.method}] ${pathname}`, Object.keys(data));
                    
                    if (pathname === '/api/watch') {
                        const { directory, projectId, sectionId } = data;
                        const result = watchDirectory(directory, projectId, sectionId);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } else if (pathname === '/api/files' || pathname === '/api/list-files') {
                        const { directory } = data;
                        const result = getDirectoryFiles(directory);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } else if (pathname === '/api/read') {
                        const { filePath } = data;
                        // Normalize path separators
                        const normalizedPath = normalizePath(filePath);
                        // readFile is now async - handle with promise
                        readFile(normalizedPath).then(result => {
                            if (result.success) {
                                errorHandler.sendSuccessResponse(res, result);
                            } else {
                                errorHandler.sendErrorResponse(res, result.error, {
                                    source: 'Server',
                                    operation: 'read-file',
                                    filePath: normalizedPath
                                }, result.error.includes('not found') ? 404 : 500);
                            }
                        }).catch(error => {
                            errorHandler.sendErrorResponse(res, error.message, {
                                source: 'Server',
                                operation: 'read-file',
                                filePath: normalizedPath
                            }, 500);
                        });
                    } else if (pathname === '/api/stop-watch') {
                        const { key } = data;
                        // Validate key parameter
                        if (!key || typeof key !== 'string') {
                            errorHandler.sendErrorResponse(res, 'Key parameter is required', {
                                source: 'Server',
                                operation: 'stop-watch',
                                pathname
                            }, 400);
                            return;
                        }
                        const result = stopWatching(key);
                        if (result.error) {
                            errorHandler.sendErrorResponse(res, result.error, {
                                source: 'Server',
                                operation: 'stop-watch',
                                key
                            }, 404);
                        } else {
                            errorHandler.sendSuccessResponse(res, result);
                        }
                    } else if (pathname === '/api/save-file') {
                        const { filename, content } = data;
                        const result = saveFileToServer(filename, content);
                        if (result.success) {
                            errorHandler.sendSuccessResponse(res, result);
                        } else {
                            errorHandler.sendErrorResponse(res, result.error, {
                                source: 'Server',
                                operation: 'save-file',
                                filename: filename
                            });
                        }
                    } else if (pathname === '/api/load-file') {
                        const { filename } = data;
                        const result = loadFileFromServer(filename);
                        if (result.success) {
                            errorHandler.sendSuccessResponse(res, result);
                        } else {
                            errorHandler.sendErrorResponse(res, result.error, {
                                source: 'Server',
                                operation: 'load-file',
                                filename: filename
                            }, result.error.includes('not found') ? 404 : 500);
                        }
                    } else if (pathname === '/api/delete-file') {
                        const { filename, filePath } = data;
                        // Support both filename (for saved-files) and filePath (for automation directories)
                        const result = deleteFileFromServer(filePath || filename);
                        if (result.success) {
                            errorHandler.sendSuccessResponse(res, result);
                        } else {
                            errorHandler.sendErrorResponse(res, result.error, {
                                source: 'Server',
                                operation: 'delete-file',
                                filename: filename || filePath
                            }, result.error.includes('not found') ? 404 : 500);
                        }
                    } else if (pathname === '/api/create-directory') {
                        const { caseSlug, defaultDir } = data;
                        const result = createAutomationDirectory(caseSlug, defaultDir);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } else if (pathname === '/api/open-directory') {
                        const { dirPath } = data;
                        openDirectoryInFileBrowser(dirPath).then(result => {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(result));
                        });
                        return; // Don't continue processing
                    } else if (pathname === '/api/ensure-directory') {
                        const { dirPath } = data;
                        // Validate dirPath parameter
                        if (!dirPath || typeof dirPath !== 'string') {
                            errorHandler.sendErrorResponse(res, 'dirPath parameter is required', {
                                source: 'Server',
                                operation: 'ensure-directory',
                                pathname
                            }, 400);
                            return;
                        }
                        const result = ensureDirectoryExists(dirPath);
                        if (result.success) {
                            errorHandler.sendSuccessResponse(res, result);
                        } else {
                            errorHandler.sendErrorResponse(res, result.error, {
                                source: 'Server',
                                operation: 'ensure-directory',
                                dirPath
                            });
                        }
                    } else if (pathname === '/api/list-directory') {
                        const { dirPath } = data;
                        const result = listDirectoryFiles(dirPath);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } else if (pathname === '/api/move-files') {
                        const { sourceDir, targetDir, fileNames } = data;
                        const result = moveFilesBetweenDirectories(sourceDir, targetDir, fileNames);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } else if (pathname === '/api/save-automation-file') {
                        const { filePath, content } = data;
                        const result = saveAutomationFile(filePath, content);
                        if (result.success) {
                            errorHandler.sendSuccessResponse(res, result);
                        } else {
                            errorHandler.sendErrorResponse(res, result.error, {
                                source: 'Server',
                                operation: 'save-automation-file',
                                filePath: filePath
                            });
                        }
                    } else if (pathname === '/api/list-scope-files') {
                        const { scopeDirectory, maxDepth } = data;
                        // Validate scopeDirectory parameter
                        if (!scopeDirectory || typeof scopeDirectory !== 'string') {
                            errorHandler.sendErrorResponse(res, 'scopeDirectory parameter is required', {
                                source: 'Server',
                                operation: 'list-scope-files',
                                pathname
                            }, 400);
                            return;
                        }
                        // Validate maxDepth
                        const depth = maxDepth && typeof maxDepth === 'number' && maxDepth > 0 && maxDepth <= 20 
                            ? maxDepth 
                            : 10;
                        const result = listScopeFilesRecursive(scopeDirectory, depth);
                        if (result.success) {
                            errorHandler.sendSuccessResponse(res, result);
                        } else {
                            errorHandler.sendErrorResponse(res, result.error, {
                                source: 'Server',
                                operation: 'list-scope-files',
                                scopeDirectory
                            });
                        }
                    } else if (pathname === '/api/cursor-cli-execute') {
                        console.log('[API] /api/cursor-cli-execute called');
                        const { prompt, scopeDirectory } = data;
                        console.log('[API] scopeDirectory:', scopeDirectory);
                        console.log('[API] prompt length:', prompt ? prompt.length : 0);
                        executeCursorCLI(prompt, scopeDirectory)
                            .then(result => {
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify(result));
                            })
                            .catch(error => {
                                errorHandler.sendErrorResponse(res, error, {
                                    source: 'Server',
                                    operation: 'cursor-cli-execute'
                                });
                            });
                        return; // Don't continue processing
                    } else {
                        errorHandler.sendErrorResponse(res, 'Endpoint not found', {
                            source: 'Server',
                            operation: 'api-handler',
                            pathname: pathname
                        }, 404);
                    }
                } catch (err) {
                    errorHandler.sendErrorResponse(res, err, {
                        source: 'Server',
                        operation: 'api-handler',
                        pathname: pathname,
                        method: req.method
                    });
                }
            });
            return;
        } else {
            // Method not allowed - log for debugging
            console.log(`Method not allowed: ${req.method} for ${pathname}`);
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Method not allowed: ${req.method}` }));
            return;
        }
}

// Serve non-API files
function serveNonApiFiles(req, res, pathname) {
    // Serve static files from feat-spec directory
    let filePath;
    
    // Default to index.html for root or feat-spec
    if (pathname === '/' || pathname === '/feat-spec' || pathname === '/feat-spec/') {
        filePath = path.join(__dirname, 'index.html');
    } else if (pathname.startsWith('/feat-spec/')) {
        // Remove /feat-spec prefix and serve from feat-spec directory
        filePath = path.join(__dirname, pathname.substring('/feat-spec'.length));
    } else {
        // For root-level requests (like /app.css, /modules/...), serve from feat-spec directory
        // Remove leading slash and serve from __dirname
        const cleanPath = pathname.startsWith('/') ? pathname.substring(1) : pathname;
        // Use path.resolve to ensure proper path construction
        filePath = path.resolve(__dirname, cleanPath);
    }
    
    // Security: ensure file is within feat-spec directory
    // Use case-insensitive comparison for Windows
    const resolvedPath = path.resolve(filePath);
    const resolvedDir = path.resolve(__dirname);
    const resolvedPathLower = resolvedPath.toLowerCase().replace(/\\/g, '/');
    const resolvedDirLower = resolvedDir.toLowerCase().replace(/\\/g, '/');
    
    if (!resolvedPathLower.startsWith(resolvedDirLower)) {
        console.log(`[403] Forbidden: ${resolvedPath} not in ${resolvedDir} (${resolvedPathLower} not in ${resolvedDirLower})`);
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }
    
    // Use the original (non-lowercase) filePath for actual file operations
    fs.stat(filePath, (err, stats) => {
        if (err) {
            // Debug: log the attempted path and error
            console.log(`[404] File not found: ${filePath} (requested: ${pathname}, error: ${err.message})`);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(`File not found: ${pathname}`);
            return;
        }
        if (!stats.isFile()) {
            console.log(`[404] Not a file: ${filePath} (requested: ${pathname})`);
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end(`File not found: ${pathname}`);
            return;
        }
        serveFile(filePath, res);
    });
}

server.listen(PORT, () => {
    console.log(`Feat-spec server running at http://localhost:${PORT}/feat-spec`);
    console.log(`API available at http://localhost:${PORT}/api/`);
    console.log(`Project root: ${PROJECT_ROOT}`);
    console.log(`Server __dirname: ${__dirname}`);
    console.log(`Test: app.css exists at ${path.join(__dirname, 'app.css')}: ${fs.existsSync(path.join(__dirname, 'app.css'))}`);
});

// Cleanup on exit
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    watchers.forEach(({ watcher }) => watcher.close());
    watchers.clear();
    server.close();
    process.exit(0);
});

