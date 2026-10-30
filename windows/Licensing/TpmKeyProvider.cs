using System;
using System.Security.Cryptography;
using System.Text;

namespace EHAinElTurck.Plannings.Licensing
{
    /// <summary>
    /// Optional TPM-backed CNG key. Microsoft Platform Crypto Provider stores the
    /// non-exportable ECDSA private key in the platform key store when supported.
    /// All methods fail closed to the caller; the application may fall back to DPAPI
    /// and the software hardware fingerprint when TPM is absent or unavailable.
    /// </summary>
    public static class TpmKeyProvider
    {
        private const string KeyName = "EH_AinElTurck_Plannings_TpmBinding_V1";
        private static readonly CngProvider PlatformProvider = new CngProvider("Microsoft Platform Crypto Provider");

        public static bool TryGetPublicKeyHash(out string hash)
        {
            hash = null;
            try
            {
                using (CngKey key = OpenOrCreateKey())
                {
                    byte[] publicBlob = key.Export(CngKeyBlobFormat.EccPublicBlob);
                    using (SHA256 sha = SHA256.Create())
                    {
                        byte[] digest = sha.ComputeHash(publicBlob);
                        StringBuilder result = new StringBuilder(digest.Length * 2);
                        for (int i = 0; i < digest.Length; i++) result.Append(digest[i].ToString("x2"));
                        hash = result.ToString();
                    }
                }
                return true;
            }
            catch
            {
                return false;
            }
        }

        public static bool TrySignChallenge(byte[] challenge, out byte[] signature)
        {
            signature = null;
            if (challenge == null || challenge.Length == 0 || challenge.Length > 4096) return false;
            try
            {
                using (CngKey key = OpenOrCreateKey())
                using (ECDsaCng signer = new ECDsaCng(key))
                {
                    signature = signer.SignData(challenge, HashAlgorithmName.SHA256);
                }
                return signature != null && signature.Length > 0;
            }
            catch
            {
                signature = null;
                return false;
            }
        }

        private static CngKey OpenOrCreateKey()
        {
            try
            {
                return CngKey.Open(KeyName, PlatformProvider);
            }
            catch
            {
                CngKeyCreationParameters parameters = new CngKeyCreationParameters();
                parameters.Provider = PlatformProvider;
                parameters.ExportPolicy = CngExportPolicies.None;
                parameters.KeyUsage = CngKeyUsages.Signing;
                return CngKey.Create(CngAlgorithm.ECDsaP256, KeyName, parameters);
            }
        }
    }
}
