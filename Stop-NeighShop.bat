@echo off
title NeighShop Global - Stop Services
color 0C
cls
echo ====================================================================
echo         STOPPING NEIGHSHOP LOCAL SHOWCASE SERVICES
echo ====================================================================
echo.

echo Terminating processes on Port 5000 (Backend API)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo Terminating processes on Port 5173 (Showcase Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo Terminating processes on Port 4173 (Preview Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo All NeighShop local servers stopped successfully.
echo.
pause
