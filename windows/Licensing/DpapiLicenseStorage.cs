using System;
using System.IO;
using System.Runtime.Serialization.Json;
using System.Security.Cryptography;
using System.Text;

namespace EHAinElTurck.Plannings.Licensing
{
    /// <summary>Per-Windows-user DPAPI storage. Does not protect against same-user malware/admin.</summary>
    public sealed class DpapiLicenseStorage
    {
        private const int MaxProtectedFileBytes = 65536;
        private static readonly byte[] Entropy = Encoding.UTF8.GetBytes("EH-AIN-EL-TURCK|HOSPITAL_PLANNING_2026|LICENSE_V1");
        private readonly string _filePath;
        public DpapiLicenseStorage(string applicationDataDirectory)
        {
            if (String.IsNullOrWhiteSpace(applicationDataDirectory))
                throw new ArgumentException("Application data directory is required.", "applicationDataDirectory");
            _filePath = Path.Combine(applicationDataDirectory, "license.dat");
        }
        public void Save(LicenseDocument license)
        {
            if (license == null || !license.HasRequiredFields())
                throw new InvalidDataException("Refusing to store an invalid license document.");
            byte[] json;
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(LicenseDocument));
            using (MemoryStream stream = new MemoryStream()) { serializer.WriteObject(stream, license); json = stream.ToArray(); }
            byte[] protectedBytes = ProtectedData.Protect(json, Entropy, DataProtectionScope.CurrentUser);
            if (protectedBytes.Length > MaxProtectedFileBytes) throw new InvalidDataException("License file is too large.");
            Directory.CreateDirectory(Path.GetDirectoryName(_filePath));
            string tempPath = _filePath + ".tmp";
            try
            {
                using (FileStream file = new FileStream(tempPath, FileMode.Create, FileAccess.Write, FileShare.None))
                { file.Write(protectedBytes, 0, protectedBytes.Length); file.Flush(true); }
                if (File.Exists(_filePath))
                {
                    string backupPath = _filePath + ".previous";
                    if (File.Exists(backupPath)) File.Delete(backupPath);
                    File.Replace(tempPath, _filePath, backupPath, true);
                }
                else File.Move(tempPath, _filePath);
            }
            finally { if (File.Exists(tempPath)) File.Delete(tempPath); }
        }
        public LicenseDocument Load()
        {
            if (!File.Exists(_filePath)) return null;
            FileInfo info = new FileInfo(_filePath);
            if (info.Length <= 0 || info.Length > MaxProtectedFileBytes) throw new InvalidDataException("Stored license size is invalid.");
            byte[] json = ProtectedData.Unprotect(File.ReadAllBytes(_filePath), Entropy, DataProtectionScope.CurrentUser);
            if (json.Length == 0 || json.Length > MaxProtectedFileBytes) throw new InvalidDataException("Decrypted license size is invalid.");
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(LicenseDocument));
            using (MemoryStream stream = new MemoryStream(json, false))
            {
                LicenseDocument license = (LicenseDocument)serializer.ReadObject(stream);
                if (license == null || !license.HasRequiredFields()) throw new InvalidDataException("Stored license is invalid.");
                return license;
            }
        }
        public bool Exists { get { return File.Exists(_filePath); } }
    }
}
