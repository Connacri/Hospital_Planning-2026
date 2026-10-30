@echo off
setlocal
cd /d "%~dp0\.."
echo =========================================================================
echo    Compilation du lanceur Windows + moteur de licences hors ligne
echo =========================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "windows\build-exe.ps1"
if errorlevel 1 (
  echo [ECHEC] Compilation impossible. Consultez les erreurs ci-dessus.
  pause
  exit /b 1
)
echo [SUCCES] Lanceur compile.
exit /b 0
