using System;
using System.IO;
using System.Runtime.Serialization.Json;
using System.Security.Cryptography;
using System.Text;

namespace EHAinElTurck.Plannings.Licensing
{
    /// <summary>DPAPI-protected, short-lived activation request storage.</summary>
    public sealed class PendingActivationStore
    {
        private readonly string _path;
        private static readonly byte[] Entropy = Encoding.UTF8.GetBytes("EH-AIN-EL-TURCK|PENDING_ACTIVATION_V1");
        public PendingActivationStore(string appDataDirectory)
        {
            if (String.IsNullOrWhiteSpace(appDataDirectory)) throw new ArgumentException("Directory required.");
            _path = Path.Combine(appDataDirectory, "pending-activation.dat");
        }
        public void Save(LicenseActivationRequest request)
        {
            if (request == null || !request.IsStructurallyValid()) throw new InvalidDataException("Invalid pending request.");
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(LicenseActivationRequest));
            byte[] plain;
            using (MemoryStream stream = new MemoryStream()) { serializer.WriteObject(stream, request); plain = stream.ToArray(); }
            byte[] encrypted = ProtectedData.Protect(plain, Entropy, DataProtectionScope.CurrentUser);
            Directory.CreateDirectory(Path.GetDirectoryName(_path));
            string temp = _path + ".tmp";
            try
            {
                using (FileStream file = new FileStream(temp, FileMode.Create, FileAccess.Write, FileShare.None))
                { file.Write(encrypted, 0, encrypted.Length); file.Flush(true); }
                if (File.Exists(_path)) File.Replace(temp, _path, null, true); else File.Move(temp, _path);
            }
            finally { if (File.Exists(temp)) File.Delete(temp); }
        }
        public LicenseActivationRequest Load()
        {
            if (!File.Exists(_path)) return null;
            FileInfo info = new FileInfo(_path);
            if (info.Length <= 0 || info.Length > 8192) throw new InvalidDataException("Pending request file invalid.");
            byte[] plain = ProtectedData.Unprotect(File.ReadAllBytes(_path), Entropy, DataProtectionScope.CurrentUser);
            DataContractJsonSerializer serializer = new DataContractJsonSerializer(typeof(LicenseActivationRequest));
            using (MemoryStream stream = new MemoryStream(plain, false))
            {
                LicenseActivationRequest request = (LicenseActivationRequest)serializer.ReadObject(stream);
                if (request == null || !request.IsStructurallyValid()) throw new InvalidDataException("Pending request invalid.");
                return request;
            }
        }
        public void Consume()
        {
            if (File.Exists(_path)) File.Delete(_path);
        }
    }
}
