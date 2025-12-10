# Simple HTTP server to run the feature spec app
# Since the app uses fetch() to load docs, it needs to run from the project root

param(
    [int]$Port = 8050
)

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
# Get project root (parent of feat-spec)
$ProjectRoot = Split-Path -Parent $ScriptDir

# Check if port is already in use
$portInUse = $false
try {
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        $portInUse = $true
    }
} catch {
    # Fallback: try netstat
    $netstat = netstat -an 2>$null | Select-String ":$Port "
    if ($netstat) {
        $portInUse = $true
    }
}

if ($portInUse) {
    Write-Host "Warning: Port $Port is already in use" -ForegroundColor Yellow
    Write-Host "Please stop the service using that port or use a different port"
    exit 1
}

# Get local IP address for LAN access
$LocalIP = $null
try {
    $adapters = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" }
    if ($adapters) {
        $LocalIP = ($adapters | Select-Object -First 1).IPAddress
    }
} catch {
    # Fallback: use ipconfig
    $ipconfig = ipconfig | Select-String "IPv4"
    if ($ipconfig) {
        $LocalIP = ($ipconfig | Select-Object -First 1).ToString() -replace '.*:\s*', ''
    }
}

Write-Host "Starting server from project root: $ProjectRoot"
Write-Host "Server will be available at: http://localhost:$Port/feat-spec"
if ($LocalIP) {
    Write-Host "Accessible on LAN at http://$LocalIP:$Port/feat-spec"
}
Write-Host "Press Ctrl+C to stop"
Write-Host ""

# Change to feat-spec directory
Set-Location $ScriptDir

# Try Node.js server first (has file watching capabilities)
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "Starting Node.js server with file watching..."
    $env:PORT = $Port
    node server.js
}
# Fallback to Python's built-in HTTP server
elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    Write-Host "Starting Python server (no file watching - use Node.js for automation features)..."
    Set-Location $ProjectRoot
    python3 -m http.server $Port --bind 0.0.0.0
}
elseif (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "Starting Python server (no file watching - use Node.js for automation features)..."
    Set-Location $ProjectRoot
    python -m http.server $Port --bind 0.0.0.0
}
else {
    Write-Host "Error: Neither Node.js nor Python found." -ForegroundColor Red
    Write-Host "Please install Node.js (recommended for automation) or Python."
    exit 1
}

