$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$nuget = Join-Path $env:TEMP 'nuget.exe'
if (-not (Test-Path $nuget)) {
    Write-Host 'Downloading NuGet CLI...'
    Invoke-WebRequest -Uri 'https://dist.nuget.org/win-x86-commandline/latest/nuget.exe' -OutFile $nuget
}
& $nuget install windows/Licensing/packages.config -OutputDirectory packages -NonInteractive -Verbosity quiet
if ($LASTEXITCODE -ne 0) { throw 'NuGet dependency restore failed.' }

$cryptoDll = Join-Path $repoRoot 'packages/BouncyCastle.Cryptography.2.7.0/lib/net461/BouncyCastle.Cryptography.dll'
if (-not (Test-Path $cryptoDll)) { throw "BouncyCastle assembly not found: $cryptoDll" }

$csc = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
if (-not (Test-Path $csc)) { $csc = Join-Path $env:WINDIR 'Microsoft.NET/Framework/v4.0.30319/csc.exe' }
if (-not (Test-Path $csc)) { throw '.NET Framework C# compiler (csc.exe) not found.' }

New-Item -ItemType Directory -Force -Path (Join-Path $repoRoot 'bin') | Out-Null
$licenseSources = Get-ChildItem -Path (Join-Path $repoRoot 'windows/Licensing') -Filter '*.cs' -File | ForEach-Object { $_.FullName }
$arguments = @(
    '/target:winexe', '/platform:anycpu', '/optimize+',
    '/win32icon:public/icon.ico',
    '/out:bin/EH_AinElTurck_Plannings.exe',
    'windows/Launcher.cs'
) + $licenseSources + @(
    '/reference:System.dll',
    '/reference:System.Core.dll',
    '/reference:System.Drawing.dll',
    '/reference:System.Windows.Forms.dll',
    '/reference:System.Runtime.Serialization.dll',
    '/reference:System.Security.dll',
    '/reference:System.Management.dll',
    "/reference:$cryptoDll"
)
Write-Host 'Compiling native launcher and offline licensing engine...'
& $csc @arguments
if ($LASTEXITCODE -ne 0) { throw "Launcher compilation failed with exit code $LASTEXITCODE" }
Copy-Item $cryptoDll -Destination (Join-Path $repoRoot 'bin/BouncyCastle.Cryptography.dll') -Force
Write-Host 'Build completed.'
Get-Item 'bin/EH_AinElTurck_Plannings.exe','bin/BouncyCastle.Cryptography.dll' | Format-Table Name,Length
