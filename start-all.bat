@echo off
chcp 65001 >nul
title OpenCode Manager - All Services

echo ========================================
echo  Starting OpenCode Manager
echo ========================================
echo.

REM Check if opencode is installed
where opencode.cmd >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] opencode.cmd not found in PATH
    echo Install: npm install -g opencode-ai@latest
    pause
    exit /b 1
)

REM Kill any existing processes on our ports
taskkill /F /FI "WINDOWTITLE eq OpenCode*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Frontend*" >nul 2>&1

echo [1/3] Starting OpenCode server on port 5551...
start "OpenCode Server" cmd /k "opencode.cmd serve --port 5551 --hostname 127.0.0.1"

REM Wait for OpenCode to start
timeout /t 3 >nul

echo [2/3] Starting Backend on port 5003...
start "Backend" cmd /k "pnpm.cmd --filter backend dev"

echo [3/3] Starting Frontend on port 5173...
start "Frontend" cmd /k "pnpm.cmd --filter frontend dev"

echo.
echo ========================================
echo  All services started!
echo ========================================
echo.
echo OpenCode API:  http://127.0.0.1:5551
echo Backend API:   http://localhost:5003
echo Frontend UI:   http://localhost:5173
echo.
echo Press Ctrl+C in each window to stop services.
echo.

pause