using System;
using System.Collections.Generic;

namespace EHAinElTurck.Plannings.Licensing
{
    /// <summary>Compiled trust anchors. Empty until the production public key is pinned.</summary>
    public static class TrustedPublicKeyRing
    {
        // Public key only. Never place the private signing key in this application.
        private const string PublicKeyV1Base64 = "";

        public static IDictionary<int, byte[]> Create()
        {
            Dictionary<int, byte[]> keys = new Dictionary<int, byte[]>();
            if (!String.IsNullOrWhiteSpace(PublicKeyV1Base64))
            {
                byte[] key = Convert.FromBase64String(PublicKeyV1Base64);
                if (key.Length != 32) throw new InvalidOperationException("Pinned Ed25519 public key must be exactly 32 bytes.");
                keys.Add(1, key);
            }
            return keys;
        }
    }
}
