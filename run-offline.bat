@echo off
title HalaqohV2 - Offline Runner
color 0A

echo.
echo ========================================
echo   HALAQOH V2 - RUNNER OFFLINE
echo ========================================
echo.

:: Cek Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js tidak ditemukan di PATH
    echo Silakan install Node.js atau jalankan via portable
    pause
    exit /b 1
)

:: Setup .env kalau belum ada
if not exist .env (
    echo [INFO] Membuat file .env...
    (echo DB_HOST=localhost
    echo DB_USER=root
    echo DB_PASSWORD=
    echo DB_NAME=tahfizh
    echo DB_PORT=3306
    echo PORT=3000
    echo SESSION_SECRET=halaqoh_offline_2024) > .env
)

:: Jalankan server
echo [INFO] Starting HalaqohV2 Server...
echo [INFO] Buka http://localhost:3000 di browser
echo.
node index.js

pause