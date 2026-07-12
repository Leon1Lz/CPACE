# CPACE Learning Portal - Quick Status Check
# Simple development status script

Write-Host "🚀 CPACE Learning Portal - Development Status" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Last updated: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# System Information
Write-Host "📊 System Information:" -ForegroundColor Blue
Write-Host "   Node.js: $(node --version)" -ForegroundColor White
Write-Host "   npm:     $(npm --version)" -ForegroundColor White
Write-Host "   Current Directory: $(Get-Location)" -ForegroundColor White
Write-Host ""

# Development URLs
Write-Host "📱 Development URLs:" -ForegroundColor Blue
Write-Host "   🌐 Landing Page: http://localhost:3000" -ForegroundColor Yellow
Write-Host "   🔐 Login:        http://localhost:3000/login" -ForegroundColor Yellow
Write-Host "   📝 Register:     http://localhost:3000/register" -ForegroundColor Yellow
Write-Host "   📊 Dashboard:    http://localhost:3000/dashboard" -ForegroundColor Yellow
Write-Host "   🗄️ Database:     http://localhost:5555 (Prisma Studio)" -ForegroundColor Yellow
Write-Host ""

# Check Services
Write-Host "🔍 Service Status:" -ForegroundColor Blue

# Check Next.js dev server (port 3000)
try {
    $connection = New-Object System.Net.Sockets.TcpClient
    $connection.Connect("localhost", 3000)
    $connection.Close()
    Write-Host "   ✅ Next.js Dev Server on port 3000 is active" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Next.js Dev Server on port 3000 is not active" -ForegroundColor Red
}

# Check Prisma database (port 51213)
try {
    $connection = New-Object System.Net.Sockets.TcpClient
    $connection.Connect("localhost", 51213)
    $connection.Close()
    Write-Host "   ✅ Prisma Database on port 51213 is active" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Prisma Database on port 51213 is not active" -ForegroundColor Red
}

# Check Prisma Studio (port 5555)
try {
    $connection = New-Object System.Net.Sockets.TcpClient
    $connection.Connect("localhost", 5555)
    $connection.Close()
    Write-Host "   ✅ Prisma Studio on port 5555 is active" -ForegroundColor Green
}
catch {
    Write-Host "   ⚠️  Prisma Studio on port 5555 is not active" -ForegroundColor Gray
}
Write-Host ""

# Database Status
Write-Host "🗄️ Database Status:" -ForegroundColor Blue

if (Test-Path "node_modules\.prisma\client") {
    Write-Host "   ✅ Prisma client generated" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Prisma client not generated" -ForegroundColor Yellow
    Write-Host "   Run: npx prisma generate" -ForegroundColor Yellow
}

# Test database connection
try {
    npx prisma db pull --force 2>$null | Out-Null
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

# Project Statistics
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

# Quick Commands
Write-Host "📋 Quick Commands:" -ForegroundColor Blue
Write-Host "   npm run dev              - Start development server" -ForegroundColor Yellow
Write-Host "   npx prisma dev          - Start database server" -ForegroundColor Yellow
Write-Host "   npx prisma studio       - Open database GUI" -ForegroundColor Yellow
Write-Host "   npx prisma db push      - Apply schema changes" -ForegroundColor Yellow
Write-Host "   npm run build           - Build for production" -ForegroundColor Yellow
Write-Host ""

Write-Host "✨ Ready for development!" -ForegroundColor Green
