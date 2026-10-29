@echo off
chcp 65001 >nul
title E.H. Ain El Turck - Lancement de l'Application

setlocal enabledelayedexpansion
set "APP_DIR=%~dp0"
cd /d "%APP_DIR%"

echo =========================================================================
echo    E.H. Ain El Turck - Gestion des Plannings Hospitaliers
echo    Compatible Windows 7 SP1 / 8 / 8.1 / 10 / 11 (32-bit et 64-bit)
echo =========================================================================
echo.

:: 1. Verifier si l'executable natif existe
if exist "%APP_DIR%EH_AinElTurck_Plannings.exe" (
    echo [OK] Demarrage du moteur natif autonome...
    start "" "%APP_DIR%EH_AinElTurck_Plannings.exe"
    exit /b 0
)

if exist "%APP_DIR%bin\EH_AinElTurck_Plannings.exe" (
    echo [OK] Demarrage du moteur natif autonome depuis bin...
    start "" "%APP_DIR%bin\EH_AinElTurck_Plannings.exe"
    exit /b 0
)

:: 2. Si l'executable n'est pas encore compile, essayer de le compiler avec csc.exe integre a Windows
echo [INFO] Recherche du compilateur C# natif Windows...
set "CSC_PATH="
if exist "%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
    set "CSC_PATH=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
) else if exist "%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
    set "CSC_PATH=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

if defined CSC_PATH (
    if exist "%APP_DIR%windows\Launcher.cs" (
        echo [INFO] Compilation instantanee du lanceur natif Windows...
        if not exist "%APP_DIR%bin" mkdir "%APP_DIR%bin"
        "%CSC_PATH%" /target:winexe /platform:anycpu /optimize+ /win32icon:"%APP_DIR%public\icon.ico" /out:"%APP_DIR%bin\EH_AinElTurck_Plannings.exe" "%APP_DIR%windows\Launcher.cs" /reference:System.dll,System.Core.dll,System.Drawing.dll,System.Windows.Forms.dll >nul 2>&1
        if exist "%APP_DIR%bin\EH_AinElTurck_Plannings.exe" (
            copy /y "%APP_DIR%bin\EH_AinElTurck_Plannings.exe" "%APP_DIR%EH_AinElTurck_Plannings.exe" >nul 2>&1
            start "" "%APP_DIR%EH_AinElTurck_Plannings.exe"
            exit /b 0
        )
    )
)

:: 3. Secours ultime : ouverture directe dans le navigateur
if exist "%APP_DIR%resources\app\dist\index.html" (
    echo [OK] Ouverture directe du fichier d'application dans votre navigateur...
    start "" "%APP_DIR%resources\app\dist\index.html"
    exit /b 0
) else if exist "%APP_DIR%dist\index.html" (
    echo [OK] Ouverture directe du fichier d'application dans votre navigateur...
    start "" "%APP_DIR%dist\index.html"
    exit /b 0
)

echo [ERREUR] Aucun fichier de distribution web n'a ete trouve.
pause
exit /b 1
