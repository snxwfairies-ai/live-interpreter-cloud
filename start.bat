@echo off
title Live Interpreter

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Download from: https://nodejs.org
    pause & exit /b 1
)

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo  ============================================
echo   Live Interpreter — starting...
echo   Open: http://localhost:3000
echo  ============================================
echo.
node server.js
pause
