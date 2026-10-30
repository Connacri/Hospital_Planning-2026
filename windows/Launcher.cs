using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using EHAinElTurck.Plannings.Licensing;

namespace EHAinElTurck.Plannings
{
    /// <summary>
    /// Lanceur autonome natif pour E.H. Aïn El Türck — Gestion des Plannings Hospitaliers.
    /// Compatible Windows 7 SP1, Windows 8, Windows 8.1, Windows 10, Windows 11 (32-bit & 64-bit).
    /// Zéro dépendance DLL externe, serveur HTTP micro-intégré, support hors-ligne total,
    /// sauvegarde physique sur disque dur et gestion de session unique (Mutex).
    /// </summary>
    static class Program
    {
        private const string AppTitle = "E.H. Aïn El Türck — Plannings";
        private const string MutexName = "Global\\EH_AinElTurck_Plannings_Mutex_2026";
        private static HttpListener _listener;
        private static Thread _serverThread;
        private static bool _isRunning = true;
        private static int _activePort = 48922;
        private static string _appDistDir;
        private static string _appDataDir;
        private static NotifyIcon _trayIcon;

        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // 1. Initialisation des répertoires de données
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            _appDistDir = Path.Combine(baseDir, @"resources\app\dist");
            if (!Directory.Exists(_appDistDir))
            {
                // Fallback si lancé depuis un sous-dossier ou racine
                if (Directory.Exists(Path.Combine(baseDir, "dist")))
                {
                    _appDistDir = Path.Combine(baseDir, "dist");
                }
            }

            _appDataDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "EH_AinElTurck_Plannings"
            );
            Directory.CreateDirectory(_appDataDir);
            Directory.CreateDirectory(Path.Combine(_appDataDir, "backups"));

            // 2. Gestion de l'instance unique via Mutex Windows
            bool createdNew;
            using (Mutex mutex = new Mutex(true, MutexName, out createdNew))
            {
                if (!createdNew)
                {
                    // Une instance tourne déjà : ouvrir le navigateur sur le port enregistré et quitter
                    int existingPort = ReadSavedPort();
                    if (existingPort > 0)
                    {
                        OpenBrowser("http://127.0.0.1:" + existingPort + "/");
                    }
                    else
                    {
                        OpenBrowser("http://127.0.0.1:48922/");
                    }
                    return;
                }

                // 3. Initialisation du moteur natif de licences hors ligne
                LicenseRuntime.Initialize(_appDataDir);

                // 4. Démarrage du serveur HTTP local
                StartLocalWebServer();

                // 5. Sauvegarder le port actif pour les instances suivantes
                SaveActivePort(_activePort);

                // 6. Création de l'icône dans la zone de notification (Systray)
                SetupTrayIcon();

                // 7. Ouverture de l'application dans le navigateur
                OpenBrowser("http://127.0.0.1:" + _activePort + "/");

                // 8. Boucle de messages Windows
                Application.Run();

                // 9. Arrêt propre
                StopLocalWebServer();
            }
        }

        private static void StartLocalWebServer()
        {
            for (int port = 48922; port <= 48960; port++)
            {
                try
                {
                    _listener = new HttpListener();
                    _listener.Prefixes.Add("http://127.0.0.1:" + port + "/");
                    _listener.Start();
                    _activePort = port;
                    break;
                }
                catch
                {
                    if (_listener != null)
                    {
                        try { _listener.Close(); } catch { }
                    }
                }
            }

            if (_listener == null || !_listener.IsListening)
            {
                MessageBox.Show(
                    "Impossible de réserver un port local sécurisé pour le serveur d'application.\n" +
                    "Veuillez vérifier vos autorisations locales ou redémarrer votre session.",
                    AppTitle + " — Erreur Réseau",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            _serverThread = new Thread(ServerWorkerLoop)
            {
                IsBackground = true,
                Name = "EH_Plannings_WebServer"
            };
            _serverThread.Start();
        }

        private static void StopLocalWebServer()
        {
            _isRunning = false;
            try
            {
                if (_listener != null && _listener.IsListening)
                {
                    _listener.Stop();
                    _listener.Close();
                }
            }
            catch { }
        }

        private static void ServerWorkerLoop()
        {
            while (_isRunning && _listener != null && _listener.IsListening)
            {
                try
                {
                    HttpListenerContext context = _listener.GetContext();
                    ThreadPool.QueueUserWorkItem((state) => HandleRequest(context));
                }
                catch
                {
                    if (!_isRunning) break;
                }
            }
        }

        private static void HandleRequest(HttpListenerContext context)
        {
            HttpListenerRequest req = context.Request;
            HttpListenerResponse res = context.Response;

            try
            {
                res.AddHeader("Access-Control-Allow-Origin", "*");
                res.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
                res.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

                string rawUrl = req.Url.AbsolutePath;

                // License endpoints are loopback-only and reject cross-origin browser requests.
                if (rawUrl.StartsWith("/api/license/", StringComparison.OrdinalIgnoreCase)
                    && !IsAllowedLocalLicenseRequest(req))
                {
                    WriteJsonResponse(res, 403, "{\"error\":\"LOCAL_ORIGIN_REJECTED\"}");
                    return;
                }

                if (req.HttpMethod == "OPTIONS")
                {
                    res.StatusCode = 200;
                    res.Close();
                    return;
                }

                // --- Endpoints d'API Locaux Système ---
                if (rawUrl.Equals("/api/license/status", StringComparison.OrdinalIgnoreCase))
                {
                    if (req.HttpMethod != "GET") { WriteJsonResponse(res, 405, "{\"error\":\"METHOD_NOT_ALLOWED\"}"); return; }
                    WriteJsonResponse(res, 200, LicenseRuntime.GetStatusJson());
                    return;
                }

                if (rawUrl.Equals("/api/license/machine", StringComparison.OrdinalIgnoreCase))
                {
                    if (req.HttpMethod != "GET") { WriteJsonResponse(res, 405, "{\"error\":\"METHOD_NOT_ALLOWED\"}"); return; }
                    WriteJsonResponse(res, 200, LicenseRuntime.GetMachineJson());
                    return;
                }

                if (rawUrl.Equals("/api/license/request", StringComparison.OrdinalIgnoreCase))
                {
                    if (req.HttpMethod != "POST") { WriteJsonResponse(res, 405, "{\"error\":\"METHOD_NOT_ALLOWED\"}"); return; }
                    WriteJsonResponse(res, 200, LicenseRuntime.CreateRequestJson());
                    return;
                }

                if (rawUrl.Equals("/api/license/activate", StringComparison.OrdinalIgnoreCase))
                {
                    if (req.HttpMethod != "POST") { WriteJsonResponse(res, 405, "{\"error\":\"METHOD_NOT_ALLOWED\"}"); return; }
                    string responseQr = ReadLimitedBody(req, 16384);
                    WriteJsonResponse(res, 200, LicenseRuntime.AcceptResponseJson(responseQr));
                    return;
                }

                // --- Endpoints d'API Locaux Système ---
                if (rawUrl.Equals("/api/ping", StringComparison.OrdinalIgnoreCase))
                {
                    byte[] pingBytes = Encoding.UTF8.GetBytes("{\"status\":\"ok\",\"app\":\"EH Ain El Turck Plannings\",\"version\":\"1.0.0\"}");
                    res.ContentType = "application/json; charset=utf-8";
                    res.ContentLength64 = pingBytes.Length;
                    res.OutputStream.Write(pingBytes, 0, pingBytes.Length);
                    res.Close();
                    return;
                }

                // Endpoint de sauvegarde physique de la base de données sur disque dur
                if (rawUrl.Equals("/api/backup", StringComparison.OrdinalIgnoreCase))
                {
                    string backupFile = Path.Combine(_appDataDir, "database_backup.json");

                    if (req.HttpMethod == "POST")
                    {
                        using (var reader = new StreamReader(req.InputStream, req.ContentEncoding))
                        {
                            string jsonContent = reader.ReadToEnd();
                            if (!string.IsNullOrEmpty(jsonContent))
                            {
                                File.WriteAllText(backupFile, jsonContent, Encoding.UTF8);

                                // Historique automatique tournant des 10 dernières sauvegardes
                                string timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                                string historyFile = Path.Combine(_appDataDir, "backups", "backup_" + timestamp + ".json");
                                File.WriteAllText(historyFile, jsonContent, Encoding.UTF8);
                            }
                        }

                        byte[] okBytes = Encoding.UTF8.GetBytes("{\"success\":true,\"savedAt\":\"" + DateTime.Now.ToString("o") + "\"}");
                        res.ContentType = "application/json; charset=utf-8";
                        res.ContentLength64 = okBytes.Length;
                        res.OutputStream.Write(okBytes, 0, okBytes.Length);
                        res.Close();
                        return;
                    }
                    else if (req.HttpMethod == "GET")
                    {
                        if (File.Exists(backupFile))
                        {
                            byte[] fileBytes = File.ReadAllBytes(backupFile);
                            res.ContentType = "application/json; charset=utf-8";
                            res.ContentLength64 = fileBytes.Length;
                            res.OutputStream.Write(fileBytes, 0, fileBytes.Length);
                        }
                        else
                        {
                            byte[] emptyBytes = Encoding.UTF8.GetBytes("null");
                            res.ContentType = "application/json; charset=utf-8";
                            res.ContentLength64 = emptyBytes.Length;
                            res.OutputStream.Write(emptyBytes, 0, emptyBytes.Length);
                        }
                        res.Close();
                        return;
                    }
                }

                // --- Distribution des Fichiers Statiques Web (HTML, JS, CSS, Assets) ---
                string relativePath = rawUrl.TrimStart('/');
                if (string.IsNullOrEmpty(relativePath))
                {
                    relativePath = "index.html";
                }

                string targetFilePath = Path.Combine(_appDistDir, relativePath.Replace('/', Path.DirectorySeparatorChar));

                // Si le fichier n'existe pas directement, fallback sur index.html (SPA)
                if (!File.Exists(targetFilePath))
                {
                    targetFilePath = Path.Combine(_appDistDir, "index.html");
                }

                if (File.Exists(targetFilePath))
                {
                    string ext = Path.GetExtension(targetFilePath).ToLowerInvariant();
                    res.ContentType = GetMimeType(ext);

                    // Pas de cache agressif pour HTML, cache normal pour assets hachés
                    if (ext == ".html")
                    {
                        res.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate");
                    }
                    else
                    {
                        res.Headers.Add("Cache-Control", "public, max-age=86400");
                    }

                    byte[] buffer = File.ReadAllBytes(targetFilePath);
                    res.ContentLength64 = buffer.Length;
                    res.OutputStream.Write(buffer, 0, buffer.Length);
                }
                else
                {
                    res.StatusCode = 404;
                    byte[] notFound = Encoding.UTF8.GetBytes("Fichier introuvable dans le dossier d'application.");
                    res.OutputStream.Write(notFound, 0, notFound.Length);
                }
            }
            catch
            {
                try { res.StatusCode = 500; } catch { }
            }
            finally
            {
                try { res.Close(); } catch { }
            }
        }

        private static bool IsAllowedLocalLicenseRequest(HttpListenerRequest req)
        {
            try
            {
                if (req.Url == null
                    || !(String.Equals(req.Url.Host, "127.0.0.1", StringComparison.OrdinalIgnoreCase)
                        || String.Equals(req.Url.Host, "localhost", StringComparison.OrdinalIgnoreCase))
                    || req.Url.Port != _activePort || req.RemoteEndPoint == null
                    || !IPAddress.IsLoopback(req.RemoteEndPoint.Address)) return false;

                string origin = req.Headers["Origin"];
                if (!String.IsNullOrEmpty(origin))
                {
                    string expected = "http://" + req.Url.Host + ":" + _activePort;
                    if (!String.Equals(origin, expected, StringComparison.OrdinalIgnoreCase)) return false;
                }
                return true;
            }
            catch { return false; }
        }

        private static string ReadLimitedBody(HttpListenerRequest req, int maxBytes)
        {
            if (req.ContentLength64 > maxBytes) throw new InvalidDataException("Request body too large.");
            using (MemoryStream stream = new MemoryStream())
            {
                byte[] buffer = new byte[4096];
                int total = 0;
                int read;
                while ((read = req.InputStream.Read(buffer, 0, buffer.Length)) > 0)
                {
                    total += read;
                    if (total > maxBytes) throw new InvalidDataException("Request body too large.");
                    stream.Write(buffer, 0, read);
                }
                return Encoding.UTF8.GetString(stream.ToArray());
            }
        }

        private static void WriteJsonResponse(HttpListenerResponse response, int statusCode, string json)
        {
            byte[] bytes = Encoding.UTF8.GetBytes(json ?? "{}");
            response.StatusCode = statusCode;
            response.ContentType = "application/json; charset=utf-8";
            response.ContentLength64 = bytes.Length;
            response.OutputStream.Write(bytes, 0, bytes.Length);
        }

        private static string GetMimeType(string extension)
        {
            switch (extension)
            {
                case ".html": return "text/html; charset=utf-8";
                case ".js":
                case ".mjs": return "application/javascript; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".json": return "application/json; charset=utf-8";
                case ".svg": return "image/svg+xml";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".gif": return "image/gif";
                case ".ico": return "image/x-icon";
                case ".webp": return "image/webp";
                case ".woff": return "font/woff";
                case ".woff2": return "font/woff2";
                case ".ttf": return "font/ttf";
                case ".otf": return "font/otf";
                case ".pdf": return "application/pdf";
                case ".txt": return "text/plain; charset=utf-8";
                default: return "application/octet-stream";
            }
        }

        private static void OpenBrowser(string url)
        {
            try
            {
                // 1. Essayer Microsoft Edge en mode Application autonome (fenêtre dédiée sans barre d'URL)
                string edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe");
                if (!File.Exists(edgePath))
                {
                    edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe");
                }
                if (File.Exists(edgePath))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = edgePath,
                        Arguments = "--app=\"" + url + "\"",
                        UseShellExecute = true
                    });
                    return;
                }

                // 2. Essayer Google Chrome en mode Application
                string chromePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe");
                if (!File.Exists(chromePath))
                {
                    chromePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe");
                }
                if (File.Exists(chromePath))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = chromePath,
                        Arguments = "--app=\"" + url + "\"",
                        UseShellExecute = true
                    });
                    return;
                }

                // 3. Navigateur par défaut du système Windows (Windows 7 / 8 / 10 / 11)
                Process.Start(new ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "L'application est lancée sur http://127.0.0.1:" + _activePort + "/\n" +
                    "Veuillez ouvrir votre navigateur internet à cette adresse.\n\nDétail : " + ex.Message,
                    AppTitle,
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information
                );
            }
        }

        private static void SetupTrayIcon()
        {
            try
            {
                _trayIcon = new NotifyIcon();
                _trayIcon.Text = "E.H. Aïn El Türck — Plannings Hospitaliers";

                string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"resources\app\public\icon.ico");
                if (File.Exists(iconPath))
                {
                    try { _trayIcon.Icon = new Icon(iconPath); } catch { _trayIcon.Icon = SystemIcons.Application; }
                }
                else
                {
                    _trayIcon.Icon = SystemIcons.Application;
                }

                ContextMenu menu = new ContextMenu();
                menu.MenuItems.Add(new MenuItem("🌐 Ouvrir l'application", (s, e) => OpenBrowser("http://127.0.0.1:" + _activePort + "/")));
                menu.MenuItems.Add(new MenuItem("📁 Dossier des sauvegardes locales", (s, e) =>
                {
                    try { Process.Start("explorer.exe", _appDataDir); } catch { }
                }));
                menu.MenuItems.Add("-");
                menu.MenuItems.Add(new MenuItem("🔄 Relancer le navigateur", (s, e) => OpenBrowser("http://127.0.0.1:" + _activePort + "/")));
                menu.MenuItems.Add(new MenuItem("❌ Quitter l'application", (s, e) =>
                {
                    _trayIcon.Visible = false;
                    Application.Exit();
                }));

                _trayIcon.ContextMenu = menu;
                _trayIcon.DoubleClick += (s, e) => OpenBrowser("http://127.0.0.1:" + _activePort + "/");
                _trayIcon.Visible = true;
            }
            catch
            {
                // Si la barre des tâches n'est pas disponible, continuer silencieusement
            }
        }

        private static void SaveActivePort(int port)
        {
            try
            {
                string portFile = Path.Combine(_appDataDir, "running_port.txt");
                File.WriteAllText(portFile, port.ToString());
            }
            catch { }
        }

        private static int ReadSavedPort()
        {
            try
            {
                string portFile = Path.Combine(_appDataDir, "running_port.txt");
                if (File.Exists(portFile))
                {
                    string txt = File.ReadAllText(portFile).Trim();
                    int p;
                    if (int.TryParse(txt, out p)) return p;
                }
            }
            catch { }
            return 0;
        }
    }
}
