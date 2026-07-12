@echo off
title CPACE Learning Portal - Development Status

echo.
echo 🚀 CPACE Learning Portal - Development Status
echo ==========================================
echo Last updated: %date% %time%
echo.

echo 📊 System Information:
echo    Node.js: 
node --version
echo    npm:     
npm --version
echo    Current Directory: %cd%
echo.

echo 📱 Development URLs:
echo    🌐 Landing Page: http://localhost:3000
echo    🔐 Login:        http://localhost:3000/login
echo    📝 Register:     http://localhost:3000/register
echo    📊 Dashboard:    http://localhost:3000/dashboard
echo    🗄️ Database:     http://localhost:5555 (Prisma Studio)
echo.

echo 🔍 Service Status:
netstat -an | findstr :3000 >nul
if %errorlevel% == 0 (
    echo    ✅ Next.js Dev Server on port 3000 is active
) else (
    echo    ❌ Next.js Dev Server on port 3000 is not active
)

netstat -an | findstr :51213 >nul
if %errorlevel% == 0 (
    echo    ✅ Prisma Database on port 51213 is active
) else (
    echo    ❌ Prisma Database on port 51213 is not active
)

netstat -an | findstr :5555 >nul
if %errorlevel% == 0 (
    echo    ✅ Prisma Studio on port 5555 is active
) else (
    echo    ⚠️  Prisma Studio on port 5555 is not active
)
echo.

echo 🗄️ Database Status:
if exist "node_modules\.prisma\client" (
    echo    ✅ Prisma client generated
) else (
    echo    ⚠️  Prisma client not generated
    echo    Run: npx prisma generate
)

echo 📈 Project Statistics:
dir /s /b *.ts *.tsx 2>nul | find /c /v "" > temp_count.txt
set /p tsfiles=<temp_count.txt
echo    📄 TypeScript files: %tsfiles%
del temp_count.txt

dir /s /b *.css 2>nul | find /c /v "" > temp_count.txt
set /p cssfiles=<temp_count.txt
echo    🎨 CSS files: %cssfiles%
del temp_count.txt

echo.
echo 📋 Quick Commands:
echo    npm run dev              - Start development server
echo    npx prisma dev          - Start database server
echo    npx prisma studio       - Open database GUI
echo    npx prisma db push      - Apply schema changes
echo    npm run build           - Build for production
echo.

echo ✨ Ready for development!
echo.
pause
