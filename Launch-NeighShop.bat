@echo off
title NeighShop Global - Project Showcase Suite Launcher
color 0B
cls
echo ====================================================================
echo         NEIGHSHOP GLOBAL CLASSIFIED MARKETPLACE
echo              Full Showcase Suite (Localhost Edition)
echo ====================================================================
echo.
echo [1/3] Checking environment & Node.js runtime...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [2/3] Starting Backend API Server (Port 5000)...
start "NeighShop API (Port 5000)" /min cmd /c "cd /d %~dp0backend && npm run start"

echo [3/3] Starting Showcase Web Suite (Port 5173)...
start "NeighShop Showcase Web (Port 5173)" /min cmd /c "cd /d %~dp0admin-web && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo Waiting 3 seconds for local servers to initialize...
timeout /t 3 /nobreak >nul

echo.
echo Opening NeighShop Showcase in your web browser...
start http://127.0.0.1:5173

echo.
echo ====================================================================
echo  SUCCESS! NeighShop Showcase is now LIVE on your laptop:
echo.
echo  * Main Showcase Web: http://127.0.0.1:5173
echo  * Backend REST API:  http://127.0.0.1:5000/api
echo.
echo  Switch freely between:
echo   - 🛍️ Buyer Marketplace
echo   - 💼 Seller Studio
echo   - 🛡️ Admin Operations
echo   - 📱 Mobile App Simulator
echo.
echo  To shut down, double-click 'Stop-NeighShop.bat' or close the windows.
echo ====================================================================
echo.
pause
