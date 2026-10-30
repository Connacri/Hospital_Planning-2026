using System;
using System.Management;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Win32;

namespace EHAinElTurck.Plannings.Licensing
{
    /// <summary>Versioned hardware fingerprint; MAC addresses are excluded to avoid adapter churn.</summary>
    public static class MachineFingerprint
    {
        public static string Create()
        {
            string machineGuid = ReadMachineGuid();
            if (String.IsNullOrWhiteSpace(machineGuid)) throw new InvalidOperationException("Windows MachineGuid unavailable.");
            string biosUuid = ReadBiosUuid();
            string tpmPublicKeyHash;
            bool hasTpm = TpmKeyProvider.TryGetPublicKeyHash(out tpmPublicKeyHash);
            string tpmComponent = hasTpm ? tpmPublicKeyHash : "TPM-UNAVAILABLE";
            string material = "HPL-MACHINE-V2\n" + Normalize(machineGuid) + "\n"
                + Normalize(biosUuid) + "\n" + tpmComponent;
            using (SHA256 sha = SHA256.Create())
            {
                byte[] hash = sha.ComputeHash(Encoding.UTF8.GetBytes(material));
                StringBuilder result = new StringBuilder(hash.Length * 2);
                for (int i = 0; i < hash.Length; i++) result.Append(hash[i].ToString("x2"));
                return result.ToString();
            }
        }
        private static string ReadMachineGuid()
        {
            RegistryView view = Environment.Is64BitOperatingSystem ? RegistryView.Registry64 : RegistryView.Registry32;
            using (RegistryKey baseKey = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, view))
            using (RegistryKey key = baseKey.OpenSubKey(@"SOFTWARE\Microsoft\Cryptography", false))
                return key == null ? null : Convert.ToString(key.GetValue("MachineGuid", null));
        }
        private static string ReadBiosUuid()
        {
            try
            {
                using (ManagementObjectSearcher searcher = new ManagementObjectSearcher("SELECT UUID FROM Win32_ComputerSystemProduct"))
                using (ManagementObjectCollection rows = searcher.Get())
                    foreach (ManagementObject row in rows)
                    {
                        string value = Normalize(Convert.ToString(row["UUID"]));
                        if (value.Length > 0 && value != "00000000000000000000000000000000"
                            && value != "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF") return value;
                    }
            }
            catch { }
            return "WMI-UUID-UNAVAILABLE";
        }
        private static string Normalize(string value)
        {
            if (String.IsNullOrWhiteSpace(value)) return String.Empty;
            return value.Trim().Replace("-", String.Empty).Replace("{", String.Empty)
                .Replace("}", String.Empty).ToUpperInvariant();
        }
    }
}
