using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace EHAinElTurck.Plannings.Licensing
{
    /// <summary>Detects obvious rollback. This is heuristic, not a trusted offline clock.</summary>
    public sealed class ClockGuard
    {
        private readonly string _path;
        private static readonly byte[] Entropy = Encoding.UTF8.GetBytes("EH-AIN-EL-TURCK|CLOCK_GUARD_V1");
        private readonly TimeSpan _allowedSkew;
        public ClockGuard(string applicationDataDirectory, TimeSpan allowedBackwardSkew)
        {
            if (String.IsNullOrWhiteSpace(applicationDataDirectory)) throw new ArgumentException("Directory required.");
            _path = Path.Combine(applicationDataDirectory, "clock.dat");
            _allowedSkew = allowedBackwardSkew < TimeSpan.Zero ? TimeSpan.Zero : allowedBackwardSkew;
        }
        public bool Observe(DateTime utcNow)
        {
            if (utcNow.Kind != DateTimeKind.Utc) throw new ArgumentException("UTC time required.");
            DateTime previous = Load();
            if (previous != DateTime.MinValue && utcNow + _allowedSkew < previous) return false;
            if (previous == DateTime.MinValue || utcNow > previous) Save(utcNow);
            return true;
        }
        private DateTime Load()
        {
            if (!File.Exists(_path)) return DateTime.MinValue;
            byte[] encrypted = File.ReadAllBytes(_path);
            if (encrypted.Length == 0 || encrypted.Length > 1024) throw new InvalidDataException("Clock guard file invalid.");
            byte[] bytes = ProtectedData.Unprotect(encrypted, Entropy, DataProtectionScope.CurrentUser);
            if (bytes.Length != 8) throw new InvalidDataException("Clock guard payload invalid.");
            return new DateTime(BitConverter.ToInt64(bytes, 0), DateTimeKind.Utc);
        }
        private void Save(DateTime value)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(_path));
            byte[] bytes = ProtectedData.Protect(BitConverter.GetBytes(value.Ticks), Entropy, DataProtectionScope.CurrentUser);
            string temp = _path + ".tmp";
            using (FileStream file = new FileStream(temp, FileMode.Create, FileAccess.Write, FileShare.None))
            { file.Write(bytes, 0, bytes.Length); file.Flush(true); }
            if (File.Exists(_path)) File.Replace(temp, _path, null, true); else File.Move(temp, _path);
        }
    }
}
