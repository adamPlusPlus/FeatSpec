// Node.js server for feat-spec app with file watching capabilities
const http = require('http');
const fs = require('fs');
const path = require('path');
const { watch } = require('fs');
const { URL } = require('url');
const { exec, execFile, spawn } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

const PORT = process.env.PORT || 8050;
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SAVED_FILES_DIR = path.join(__dirname, 'saved-files');

// Handle Windows path separators
function normalizePath(p) {
    return p.replace(/\\/g, '/');
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
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// Watch a directory for file changes
function watchDirectory(dirPath, projectId, sectionId) {
    const normalizedPath = path.resolve(PROJECT_ROOT, dirPath);
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
    const normalizedPath = path.resolve(PROJECT_ROOT, dirPath);
    
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

// Read file contents
function readFile(filePath) {
    const normalizedPath = path.resolve(PROJECT_ROOT, filePath);
    
    // Security: ensure path is within project root
    if (!normalizedPath.startsWith(PROJECT_ROOT)) {
        return { error: 'Access denied' };
    }
    
    try {
        const content = fs.readFileSync(normalizedPath, 'utf8');
        const stats = fs.statSync(normalizedPath);
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

// Save file to server
function saveFileToServer(filename, content) {
    try {
        // Sanitize filename
        const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = path.join(SAVED_FILES_DIR, safeFilename);
        
        // Ensure content is a string
        const contentString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        
        fs.writeFileSync(filePath, contentString, 'utf8');
        return { success: true, filename: safeFilename, path: filePath };
    } catch (error) {
        return { success: false, error: error.message };
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
            let scopePath;
            const scopeDir = scopeDirectory.trim();
            
            // Normalize the input path first (handle forward/backward slashes)
            const normalizedInput = scopeDir.replace(/\\/g, '/');
            
            // Check if path is absolute (starts with / or drive letter like C:)
            if (path.isAbsolute(scopeDir) || normalizedInput.match(/^[A-Za-z]:/)) {
                // Already absolute - use as-is but verify it's within project root
                scopePath = path.resolve(scopeDir);
            } else {
                // Relative path - resolve relative to PROJECT_ROOT
                scopePath = path.resolve(PROJECT_ROOT, scopeDir);
            }
            
            // Normalize both paths for comparison (handle Windows case sensitivity and separators)
            // Use path.resolve to get absolute paths, then normalize
            const absScopePath = path.resolve(scopePath);
            const absProjectRoot = path.resolve(PROJECT_ROOT);
            
            // Convert to normalized strings for comparison
            const normalizedScopePath = absScopePath.replace(/\\/g, '/').toLowerCase();
            const normalizedProjectRoot = absProjectRoot.replace(/\\/g, '/').toLowerCase();
            
            // For chat system, allow scope directories outside project root (read-only context)
            // But still validate that the path exists and is accessible
            const isWithinProjectRoot = normalizedScopePath.startsWith(normalizedProjectRoot);
            
            if (!isWithinProjectRoot) {
                // Path is outside project root - this is allowed for chat scope directories
                // but we still need to validate it exists and is accessible
                console.log(`[Cursor CLI] Scope directory is outside project root (allowed for chat): ${absScopePath}`);
            } else {
                console.log(`[Cursor CLI] Path validation passed: ${absScopePath} is within ${absProjectRoot}`);
            }
            
            // Use the absolute resolved path
            scopePath = absScopePath;
            
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
                }, 300000);
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
        // Resolve the path relative to PROJECT_ROOT
        const targetPath = path.resolve(PROJECT_ROOT, filePath.trim());
        
        // Security: ensure path is within project root
        if (!targetPath.startsWith(PROJECT_ROOT)) {
            return { success: false, error: 'Access denied' };
        }
        
        // Ensure the directory exists
        const dirPath = path.dirname(targetPath);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // Ensure content is a string
        const contentString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        
        // Write the file
        fs.writeFileSync(targetPath, contentString, 'utf8');
        
        // Return relative path from project root
        const relativePath = path.relative(PROJECT_ROOT, targetPath);
        const normalizedPath = normalizePath(relativePath);
        
        return { success: true, path: normalizedPath };
    } catch (error) {
        return { success: false, error: error.message };
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
        // Sanitize filename
        const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
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
        
        return {
            success: true,
            filename: safeFilename,
            content: content,
            size: stats.size,
            modified: stats.mtime.toISOString()
        };
    } catch (error) {
        return { success: false, error: error.message };
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
        return { success: false, error: error.message };
    }
}

// Ensure directory exists (create if it doesn't)
function ensureDirectoryExists(dirPath) {
    try {
        if (!dirPath || !dirPath.trim()) {
            return { success: false, error: 'Directory path is required' };
        }
        
        // Normalize backslashes to forward slashes for Windows paths
        let normalizedInput = dirPath.trim().replace(/\\/g, '/');
        
        // Check if it's an absolute path (starts with drive letter like H:/ or C:/, or starts with /)
        // On Windows, absolute paths can be H:/... or H:\... or /... (UNC paths)
        const isAbsolute = /^([A-Z]:\/|\/)/.test(normalizedInput);
        let targetPath;
        
        if (isAbsolute) {
            // For absolute paths, convert to platform-specific separators
            // Node.js path functions handle both, but we normalize for consistency
            targetPath = normalizedInput.replace(/\//g, path.sep);
            // Verify it's actually absolute (path.isAbsolute works with platform-specific separators)
            if (!path.isAbsolute(targetPath)) {
                // If path.isAbsolute doesn't recognize it, try path.resolve
                targetPath = path.resolve(targetPath);
            }
        } else {
            // For relative paths, resolve relative to PROJECT_ROOT
            targetPath = path.resolve(PROJECT_ROOT, normalizedInput.replace(/\//g, path.sep));
            
            // Security: ensure relative paths are within project root
            if (!targetPath.startsWith(PROJECT_ROOT)) {
                return { success: false, error: 'Access denied: Path must be within project root' };
            }
        }
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(targetPath)) {
            try {
                fs.mkdirSync(targetPath, { recursive: true });
            } catch (mkdirError) {
                // If directory creation fails, it might be a permissions issue
                return { success: false, error: `Failed to create directory: ${mkdirError.message}` };
            }
        } else if (!fs.statSync(targetPath).isDirectory()) {
            return { success: false, error: 'Path exists but is not a directory' };
        }
        
        // Return normalized path (use forward slashes for consistency)
        const normalizedPath = normalizePath(isAbsolute ? targetPath : path.relative(PROJECT_ROOT, targetPath));
        
        return {
            success: true,
            path: normalizedPath,
            absolutePath: targetPath
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// List files in a directory
function listDirectoryFiles(dirPath) {
    try {
        if (!dirPath || !dirPath.trim()) {
            return { success: false, error: 'Directory path is required' };
        }
        
        // Resolve the path relative to PROJECT_ROOT
        const targetPath = path.resolve(PROJECT_ROOT, dirPath.trim());
        
        // Security: ensure path is within project root
        if (!targetPath.startsWith(PROJECT_ROOT)) {
            return { success: false, error: 'Access denied' };
        }
        
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
        return { success: false, error: error.message };
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
        return { success: false, error: error.message };
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
        return { success: false, error: error.message };
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
                    }, 100);
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
        return { success: false, error: error.message };
    }
}

// HTTP server
const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    console.log(`[${req.method}] ${pathname}`);
    
    // API endpoints
    if (pathname.startsWith('/api/')) {
        // Handle GET requests for /api/list-files
        if (pathname === '/api/list-files' && req.method === 'GET') {
            try {
                const result = listSavedFiles();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
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
                        const result = readFile(normalizedPath);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } else if (pathname === '/api/stop-watch') {
                        const { key } = data;
                        const result = stopWatching(key);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } else if (pathname === '/api/save-file') {
                        const { filename, content } = data;
                        const result = saveFileToServer(filename, content);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } else if (pathname === '/api/load-file') {
                        const { filename } = data;
                        const result = loadFileFromServer(filename);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } else if (pathname === '/api/delete-file') {
                        const { filename, filePath } = data;
                        // Support both filename (for saved-files) and filePath (for automation directories)
                        const result = deleteFileFromServer(filePath || filename);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
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
                        const result = ensureDirectoryExists(dirPath);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
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
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } else if (pathname === '/api/list-scope-files') {
                        const { scopeDirectory, maxDepth } = data;
                        const result = listScopeFilesRecursive(scopeDirectory, maxDepth || 10);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
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
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ 
                                    success: false, 
                                    error: error.message 
                                }));
                            });
                        return; // Don't continue processing
                    } else {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Endpoint not found' }));
                    }
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: err.message }));
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
});

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

