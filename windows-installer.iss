; Script Inno Setup 6 pour E.H. Aïn El Türck — Gestion des Plannings & Tableaux d'Activité
; Génère l'installateur Windows autonome .exe

#define MyAppName "EH Ain El Turck Plannings"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Etablissement Hospitalier d'Ain El Turck"
#define MyAppURL "https://sante.gov.dz"
#define MyAppExeName "EH_AinElTurck_Plannings.exe"

[Setup]
AppId={{E61A8F09-77BA-4BD3-9FE4-A6A4D92BD101}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DisableProgramGroupPage=yes
LicenseFile=LICENSE.txt
OutputDir=Output
OutputBaseFilename=EH_AinElTurck_Plannings_Setup_v1.0.0
SetupIconFile=public/icon.ico
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Distribution web compilée
Source: "dist\*"; DestDir: "{app}\resources\app\dist"; Flags: ignoreversion recursesubdirs createallsubdirs
; Lanceur / Wrapper webview Windows
Source: "public\*"; DestDir: "{app}\resources\app\public"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "windows-runner.bat"; DestDir: "{app}"; DestName: "{#MyAppExeName}"; Flags: ignoreversion

[Icons]
Name: "{autoprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\resources\app\public\icon.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; IconFilename: "{app}\resources\app\public\icon.ico"

[Run]
Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Filename: "{app}\{#MyAppExeName}"; Flags: nowait postinstall skipifsilent
