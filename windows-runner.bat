@echo off
setlocal
cd /d "%~dp0\resources\app"
start "" http://localhost:3000 || start "" "%~dp0\resources\app\dist\index.html"
exit /b 0
