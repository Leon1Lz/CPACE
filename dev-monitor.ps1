# CPACE Learning Portal - Development Monitor (PowerShell)
# Live development tracking script for Windows

param(
    [string]$Command = "monitor"
)

Write-Host "🚀 CPACE Learning Portal - Development Monitor" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a process is running
function Test-ProcessRunning {
    param([string]$ProcessName)
    
    $process = Get-Process | Where-Object { $_.ProcessName -like "*$ProcessName*" } -ErrorAction SilentlyContinue
    return $process -ne $null
}

# Function to check if a port is in use
function Test-PortInUse {
    param([int]$Port)
    
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Function to show development URLs
function Show-Urls {
    Write-Host "📱 Development URLs:" -ForegroundColor Blue
    Write-Host "   🌐 Landing Page: http://localhost:3000" -ForegroundColor Yellow
    Write-Host "   🔐 Login:        http://localhost:3000/login" -ForegroundColor Yellow
    Write-Host "   📝 Register:     http://localhost:3000/register" -ForegroundColor Yellow
    Write-Host "   📊 Dashboard:    http://localhost:3000/dashboard" -ForegroundColor Yellow
    Write-Host "   🗄️ Database:     http://localhost:5555 (Prisma Studio)" -ForegroundColor Yellow
    Write-Host ""
}

# Function to show system information
function Show-SystemInfo {
    Write-Host "📊 System Information:" -ForegroundColor Blue
    Write-Host "   Node.js: $(node --version)" -ForegroundColor White
    Write-Host "   npm:     $(npm --version)" -ForegroundColor White
    Write-Host "   Current Directory: $(Get-Location)" -ForegroundColor White
    Write-Host ""
}

# Function to show git status
function Show-GitStatus {
    Write-Host "📋 Git Status:" -ForegroundColor Blue
    try {
        $status = git status --porcelain
        if ($status) {
            $status | Select-Object -First 5 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
            if (($status | Measure-Object).Count -gt 5) {
                Write-Host "   ... and more files" -ForegroundColor Gray
            }
        } else {
            Write-Host "   Working directory clean" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "   Git not available" -ForegroundColor Red
    }
    Write-Host ""
}

# Function to start services
function Start-Services {
    Write-Host "🔧 Starting Services..." -ForegroundColor Yellow
    
    # Start Next.js dev server if not running
    if (-not (Test-ProcessRunning "next")) {
        Write-Host "   Starting Next.js development server..." -ForegroundColor Yellow
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
        Start-Sleep -Seconds 3
    }
    
    # Start Prisma dev server if not running
    if (-not (Test-ProcessRunning "prisma")) {
        Write-Host "   Starting Prisma development server..." -ForegroundColor Yellow
        Start-Process -FilePath "npx" -ArgumentList "prisma", "dev" -NoNewWindow
        Start-Sleep -Seconds 3
    }
    
    Write-Host ""
}

# Function to show database status
function Show-DatabaseStatus {
    Write-Host "🗄️ Database Status:" -ForegroundColor Blue
    
    # Check if Prisma client is generated
    if (Test-Path "node_modules\.prisma\client") {
        Write-Host "   ✅ Prisma client generated" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Prisma client not generated" -ForegroundColor Yellow
        Write-Host "   Run: npx prisma generate" -ForegroundColor Yellow
    }
    
    # Test database connection
    try {
        $result = npx prisma db pull --force 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Database connection successful" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Database connection failed" -ForegroundColor Red
            Write-Host "   Check DATABASE_URL in .env file" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "   ❌ Database connection failed" -ForegroundColor Red
        Write-Host "   Check DATABASE_URL in .env file" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Function to show project statistics
function Show-ProjectStats {
    Write-Host "📈 Project Statistics:" -ForegroundColor Blue
    
    $tsFiles = (Get-ChildItem -Recurse -Filter "*.ts" | Measure-Object).Count
    $tsxFiles = (Get-ChildItem -Recurse -Filter "*.tsx" | Measure-Object).Count
    $cssFiles = (Get-ChildItem -Recurse -Filter "*.css" | Measure-Object).Count
    
    Write-Host "   📄 TypeScript files: $($tsFiles + $tsxFiles)" -ForegroundColor White
    Write-Host "   🎨 CSS files:        $cssFiles" -ForegroundColor White
    
    if (Test-Path "package.json") {
        try {
            $package = Get-Content "package.json" | ConvertFrom-Json
            $deps = if ($package.dependencies) { $package.dependencies.PSObject.Properties.Count } else { 0 }
            $devDeps = if ($package.devDependencies) { $package.devDependencies.PSObject.Properties.Count } else { 0 }
            Write-Host "   📦 Dependencies:     $deps" -ForegroundColor White
            Write-Host "   🔧 Dev Dependencies: $devDeps" -ForegroundColor White
        }
        catch {
            Write-Host "   📦 Dependencies:     N/A" -ForegroundColor Gray
        }
    }
    Write-Host ""
}

# Function to show service status
function Show-ServiceStatus {
    Write-Host "🔍 Service Status:" -ForegroundColor Blue
    
    # Check Next.js dev server (port 3000)
    if (Test-PortInUse 3000) {
        Write-Host "   ✅ Next.js Dev Server on port 3000 is active" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Next.js Dev Server on port 3000 is not active" -ForegroundColor Red
    }
    
    # Check Prisma database (port 51213)
    if (Test-PortInUse 51213) {
        Write-Host "   ✅ Prisma Database on port 51213 is active" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Prisma Database on port 51213 is not active" -ForegroundColor Red
    }
    
    # Check Prisma Studio (port 5555)
    if (Test-PortInUse 5555) {
        Write-Host "   ✅ Prisma Studio on port 5555 is active" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Prisma Studio on port 5555 is not active" -ForegroundColor Gray
    }
    Write-Host ""
}

# Function to show quick commands
function Show-QuickCommands {
    Write-Host "📋 Quick Commands:" -ForegroundColor Blue
    Write-Host "   npm run dev        - Start development server" -ForegroundColor Yellow
    Write-Host "   npx prisma dev      - Start database server" -ForegroundColor Yellow
    Write-Host "   npx prisma studio   - Open database GUI" -ForegroundColor Yellow
    Write-Host "   npx prisma db push  - Apply schema changes" -ForegroundColor Yellow
    Write-Host "   npm run build       - Build for production" -ForegroundColor Yellow
    Write-Host ""
}

# Main monitoring loop
function Start-Monitor {
    while ($true) {
        Clear-Host
        Write-Host "🚀 CPACE Learning Portal - Live Development Monitor" -ForegroundColor Cyan
        Write-Host "====================================================" -ForegroundColor Cyan
        Write-Host "Last updated: $(Get-Date)" -ForegroundColor Gray
        Write-Host ""
        
        # Show all status information
        Show-SystemInfo
        Show-Urls
        Show-GitStatus
        Show-DatabaseStatus
        Show-ProjectStats
        Show-ServiceStatus
        Show-QuickCommands
        
        Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Green
        Write-Host "Auto-refresh in 30 seconds..." -ForegroundColor Yellow
        
        Start-Sleep -Seconds 30
    }
}

# Command handling
switch ($Command.ToLower()) {
    "start" {
        Write-Host "🚀 Starting all development services..." -ForegroundColor Yellow
        Start-Services
        Show-Urls
    }
    "status" {
        Write-Host "📊 Current Status:" -ForegroundColor Blue
        Show-SystemInfo
        Show-Urls
        Show-DatabaseStatus
        Show-ProjectStats
        Show-ServiceStatus
    }
    "monitor" {
        Start-Monitor
    }
    "help" {
        Write-Host "CPACE Development Monitor"
        Write-Host ""
        Write-Host "Usage: .\dev-monitor.ps1 [command]"
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  start    - Start all development services"
        Write-Host "  status   - Show current status"
        Write-Host "  monitor  - Start live monitoring (auto-refresh)"
        Write-Host "  help     - Show this help message"
        Write-Host ""
        Write-Host "Examples:"
        Write-Host "  .\dev-monitor.ps1 start     # Start services"
        Write-Host "  .\dev-monitor.ps1 monitor   # Live monitoring"
        Write-Host "  .\dev-monitor.ps1 status    # Quick status check"
    }
    default {
        Write-Host "🚀 Starting CPACE Development Monitor..." -ForegroundColor Yellow
        Write-Host "Use '.\dev-monitor.ps1 help' for all commands" -ForegroundColor Blue
        Write-Host ""
        Start-Monitor
    }
}
