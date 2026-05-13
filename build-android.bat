@echo off
setlocal enabledelayedexpansion
title Live Interpreter Pro — Android Build

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   Live Interpreter Pro — Android Build Script    ║
echo  ║   snxwfairies innovations pvt. ltd               ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: ── Check Node.js ─────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Download from: https://nodejs.org
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo [OK] Node.js %%v

:: ── Check Java ────────────────────────────────────────────────
where java >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Java JDK 17 not found.
    echo         Download from: https://adoptium.net
    pause & exit /b 1
)
for /f "tokens=3" %%v in ('java -version 2^>^&1 ^| findstr version') do echo [OK] Java %%v

:: ── Set ANDROID_HOME ──────────────────────────────────────────
if not defined ANDROID_HOME (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
        echo [OK] Android SDK found at %LOCALAPPDATA%\Android\Sdk
    ) else (
        echo [WARN] ANDROID_HOME not set. Set it after installing Android Studio.
    )
) else (
    echo [OK] Android SDK: %ANDROID_HOME%
)

echo.
echo ── Step 1/5: Installing npm packages ─────────────────────
call npm install
if errorlevel 1 ( echo [ERROR] npm install failed & pause & exit /b 1 )
echo [OK] Packages installed.

echo.
echo ── Step 2/5: Building React app ──────────────────────────
call npm run build
if errorlevel 1 ( echo [ERROR] Build failed & pause & exit /b 1 )
echo [OK] React app built → dist/

echo.
echo ── Step 3/5: Adding Android platform ─────────────────────
if not exist "android" (
    call npx cap add android
    if errorlevel 1 ( echo [ERROR] cap add android failed & pause & exit /b 1 )
    echo [OK] Android platform added.
) else (
    echo [SKIP] android/ folder exists.
)

echo.
echo ── Step 4/5: Syncing web assets ──────────────────────────
call npx cap sync android
if errorlevel 1 ( echo [ERROR] cap sync failed & pause & exit /b 1 )
echo [OK] Assets synced.

echo.
echo ── Step 5/5: Patching AndroidManifest.xml ────────────────
set MANIFEST=android\app\src\main\AndroidManifest.xml
if exist "%MANIFEST%" (
    :: Check if permissions already added
    findstr /c:"RECORD_AUDIO" "%MANIFEST%" >nul 2>&1
    if errorlevel 1 (
        echo [INFO] Adding permissions to AndroidManifest.xml ...
        powershell -Command ^
          "(Get-Content '%MANIFEST%') -replace '<uses-permission android:name=""android.permission.INTERNET""', '<uses-permission android:name=""android.permission.RECORD_AUDIO"" />`n    <uses-permission android:name=""android.permission.MODIFY_AUDIO_SETTINGS"" />`n    <uses-permission android:name=""android.permission.WAKE_LOCK"" />`n    <uses-permission android:name=""android.permission.INTERNET""' | Set-Content '%MANIFEST%'"
        echo [OK] Permissions added.
    ) else (
        echo [SKIP] Permissions already present.
    )
) else (
    echo [WARN] Manifest not found — add permissions manually. See android-permissions.xml
)

echo.
echo ── Opening Android Studio ────────────────────────────────
call npx cap open android

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   BUILD PREP COMPLETE!                           ║
echo  ║                                                  ║
echo  ║   In Android Studio:                             ║
echo  ║   1. Wait for Gradle sync (bottom progress bar)  ║
echo  ║   2. Build → Build APK(s)  — for testing         ║
echo  ║      OR press ▶ Run to install on phone          ║
echo  ║                                                  ║
echo  ║   APK location after build:                      ║
echo  ║   android\app\build\outputs\apk\debug\           ║
echo  ╚══════════════════════════════════════════════════╝
echo.
pause
