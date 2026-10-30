using System;
using System.Collections.Generic;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Crypto.Signers;

namespace EHAinElTurck.Plannings.Licensing
{
    /// <summary>Offline Ed25519 verifier. Inject public keys only; never embed private keys.</summary>
    public sealed class Ed25519LicenseVerifier
    {
        private readonly IDictionary<int, byte[]> _publicKeys;
        public Ed25519LicenseVerifier(IDictionary<int, byte[]> trustedPublicKeys)
        {
            if (trustedPublicKeys == null) throw new ArgumentNullException("trustedPublicKeys");
            _publicKeys = new Dictionary<int, byte[]>();
            foreach (KeyValuePair<int, byte[]> entry in trustedPublicKeys)
            {
                if (entry.Key <= 0 || entry.Value == null || entry.Value.Length != 32)
                    throw new ArgumentException("Ed25519 public keys must be 32 bytes and have a positive version.");
                _publicKeys.Add(entry.Key, (byte[])entry.Value.Clone());
            }
        }
        public bool Verify(LicenseDocument license)
        {
            if (license == null || !license.HasRequiredFields()) return false;
            byte[] publicKey;
            if (!_publicKeys.TryGetValue(license.SigningKeyVersion, out publicKey)) return false;
            byte[] signature;
            try { signature = Convert.FromBase64String(license.Signature); }
            catch (FormatException) { return false; }
            if (signature.Length != 64) return false;
            try
            {
                byte[] payload = LicenseCanonicalizer.GetSigningBytes(license);
                Ed25519PublicKeyParameters key = new Ed25519PublicKeyParameters(publicKey, 0);
                Ed25519Signer verifier = new Ed25519Signer();
                verifier.Init(false, key);
                verifier.BlockUpdate(payload, 0, payload.Length);
                return verifier.VerifySignature(signature);
            }
            catch { return false; }
        }
    }
}
