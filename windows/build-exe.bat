@echo off
setlocal
cd /d "%~dp0\.."

echo =========================================================================
echo    Compilation du Lanceur Natif Windows (AnyCPU)
echo    E.H. Ain El Turck - Gestion des Plannings Hospitaliers
echo =========================================================================
echo.

set "CSC_EXE="
if exist "%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe" (
    set "CSC_EXE=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
) else if exist "%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe" (
    set "CSC_EXE=%WINDIR%\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

if not defined CSC_EXE (
    echo [ERREUR] Compilateur csc.exe (.NET Framework 4.x) introuvable dans %WINDIR%\Microsoft.NET\
    pause
    exit /b 1
)

if not exist "bin" mkdir "bin"

echo Utilisation du compilateur : %CSC_EXE%
"%CSC_EXE%" /target:winexe /platform:anycpu /optimize+ /win32icon:public\icon.ico /out:bin\EH_AinElTurck_Plannings.exe windows\Launcher.cs /reference:System.dll,System.Core.dll,System.Drawing.dll,System.Windows.Forms.dll

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCES] Executable genere avec succes : bin\EH_AinElTurck_Plannings.exe
    dir "bin\EH_AinElTurck_Plannings.exe"
) else (
    echo.
    echo [ECHEC] Erreur lors de la compilation de Launcher.cs
    pause
    exit /b %ERRORLEVEL%
)

exit /b 0
