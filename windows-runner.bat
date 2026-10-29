@echo off
setlocal
cd /d "%~dp0"

:: Si l'exécutable natif existe, le lancer
if exist "%~dp0EH_AinElTurck_Plannings.exe" (
    start "" "%~dp0EH_AinElTurck_Plannings.exe"
    exit /b 0
)

:: Sinon, ouvrir la page web
if exist "%~dp0resources\app\dist\index.html" (
    start "" "%~dp0resources\app\dist\index.html"
    exit /b 0
)

exit /b 0
