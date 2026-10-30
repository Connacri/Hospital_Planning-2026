using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Crypto.Signers;
using EHAinElTurck.Plannings.Licensing;

internal static class LicenseCryptoSelfTest
{
    private static int Main()
    {
        try
        {
            VerifyRfc8032Vector();
            VerifyCanonicalPayloadAndTamperDetection();
            VerifyQrRoundTripAndDpapiStorage();
            Console.WriteLine("All offline license crypto self-tests passed.");
            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(ex.ToString());
            return 1;
        }
    }

    private static void VerifyRfc8032Vector()
    {
        byte[] publicKey = Hex("d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a");
        byte[] signature = Hex("e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e06522490155" +
                              "5fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b");
        Ed25519Signer verifier = new Ed25519Signer();
        verifier.Init(false, new Ed25519PublicKeyParameters(publicKey, 0));
        if (!verifier.VerifySignature(signature))
            throw new InvalidOperationException("RFC 8032 Ed25519 known-answer test failed.");
    }

    private static void VerifyCanonicalPayloadAndTamperDetection()
    {
        byte[] seed = Hex("9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60");
        Ed25519PrivateKeyParameters privateKey = new Ed25519PrivateKeyParameters(seed, 0);
        byte[] publicKey = privateKey.GeneratePublicKey().GetEncoded();

        LicenseDocument license = new LicenseDocument();
        license.Version = LicenseDocument.CurrentVersion;
        license.ProductId = LicenseDocument.ExpectedProductId;
        license.LicenseId = "test-license-0001";
        license.Serial = "ABCDEFGHJK";
        license.MachineId = new String('a', 64);
        license.RequestNonce = new String('b', 48);
        license.LicenseType = "TIME_LIMITED";
        license.IssuedAtUtc = new DateTime(2026, 10, 30, 10, 0, 0, DateTimeKind.Utc);
        license.ExpiresAtUtc = new DateTime(2027, 10, 30, 10, 0, 0, DateTimeKind.Utc);
        license.Features = new string[] { "REPORTS", "FULL_ACCESS" };
        license.SignatureAlgorithm = LicenseDocument.ExpectedSignatureAlgorithm;
        license.SigningKeyVersion = 1;
        license.Signature = "placeholder";

        byte[] first = LicenseCanonicalizer.GetSigningBytes(license);
        using (SHA256 sha = SHA256.Create())
        {
            string canonicalHash = BitConverter.ToString(sha.ComputeHash(first)).Replace("-", "").ToLowerInvariant();
            if (canonicalHash != "0c0dac7a1f38c8892975adcfd32ce6179e9b5f6f4633bdd75c5cab7885c2301b")
                throw new InvalidOperationException("Canonical payload cross-language test vector mismatch: " + canonicalHash);
        }
        license.Features = new string[] { "FULL_ACCESS", "REPORTS" };
        byte[] second = LicenseCanonicalizer.GetSigningBytes(license);
        if (!Equal(first, second)) throw new InvalidOperationException("Feature ordering changed canonical signing bytes.");

        Ed25519Signer signer = new Ed25519Signer();
        signer.Init(true, privateKey);
        signer.BlockUpdate(first, 0, first.Length);
        license.Signature = Convert.ToBase64String(signer.GenerateSignature());

        Dictionary<int, byte[]> keys = new Dictionary<int, byte[]>();
        keys.Add(1, publicKey);
        Ed25519LicenseVerifier licenseVerifier = new Ed25519LicenseVerifier(keys);
        if (!licenseVerifier.Verify(license)) throw new InvalidOperationException("Valid signed license was rejected.");

        license.MachineId = new String('c', 64);
        if (licenseVerifier.Verify(license)) throw new InvalidOperationException("Tampered license was accepted.");
    }

    private static void VerifyQrRoundTripAndDpapiStorage()
    {
        LicenseActivationRequest request = new LicenseActivationRequest();
        request.Protocol = LicenseActivationRequest.CurrentProtocol;
        request.ProductId = LicenseDocument.ExpectedProductId;
        request.MachineId = new String('a', 64);
        request.RequestId = Guid.NewGuid().ToString("N");
        request.Nonce = new String('A', 43);
        request.CreatedAtUtc = DateTime.UtcNow;
        string requestQr = LicenseQrCodec.EncodeRequest(request);
        LicenseActivationRequest decodedRequest = LicenseQrCodec.DecodeRequest(requestQr);
        if (decodedRequest.RequestId != request.RequestId || decodedRequest.Nonce != request.Nonce)
            throw new InvalidOperationException("Activation request QR round-trip failed.");

        byte[] seed = Hex("9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60");
        Ed25519PrivateKeyParameters privateKey = new Ed25519PrivateKeyParameters(seed, 0);
        LicenseDocument license = new LicenseDocument();
        license.Version = LicenseDocument.CurrentVersion;
        license.ProductId = LicenseDocument.ExpectedProductId;
        license.LicenseId = "qr-test-license";
        license.Serial = "ABCDEFGHJK";
        license.MachineId = new String('a', 64);
        license.RequestNonce = new String('B', 43);
        license.LicenseType = "TIME_LIMITED";
        DateTime issuedNow = DateTime.UtcNow;
        license.IssuedAtUtc = new DateTime(issuedNow.Ticks - (issuedNow.Ticks % TimeSpan.TicksPerMillisecond), DateTimeKind.Utc);
        license.ExpiresAtUtc = license.IssuedAtUtc.AddDays(30);
        license.Features = new string[] { "FULL_ACCESS" };
        license.SignatureAlgorithm = LicenseDocument.ExpectedSignatureAlgorithm;
        license.SigningKeyVersion = 1;
        license.Signature = "placeholder";
        byte[] payload = LicenseCanonicalizer.GetSigningBytes(license);
        Ed25519Signer signer = new Ed25519Signer();
        signer.Init(true, privateKey);
        signer.BlockUpdate(payload, 0, payload.Length);
        license.Signature = Convert.ToBase64String(signer.GenerateSignature());

        string licenseQr = LicenseQrCodec.EncodeLicense(license);
        LicenseDocument decodedLicense = LicenseQrCodec.DecodeLicense(licenseQr);
        Dictionary<int, byte[]> keys = new Dictionary<int, byte[]>();
        keys.Add(1, privateKey.GeneratePublicKey().GetEncoded());
        Ed25519LicenseVerifier verifier = new Ed25519LicenseVerifier(keys);
        if (!verifier.Verify(decodedLicense)) throw new InvalidOperationException("License QR round-trip signature check failed.");

        string temp = Path.Combine(Path.GetTempPath(), "HPL-License-Test-" + Guid.NewGuid().ToString("N"));
        try
        {
            DpapiLicenseStorage storage = new DpapiLicenseStorage(temp);
            storage.Save(decodedLicense);
            LicenseDocument loaded = storage.Load();
            if (loaded == null || !verifier.Verify(loaded))
                throw new InvalidOperationException("DPAPI protected license storage round-trip failed.");

            ClockGuard guard = new ClockGuard(temp, TimeSpan.FromMinutes(1));
            DateTime current = DateTime.UtcNow;
            if (!guard.Observe(current)) throw new InvalidOperationException("Clock guard rejected current time.");
            if (guard.Observe(current.AddHours(-1))) throw new InvalidOperationException("Clock guard failed to detect rollback.");
        }
        finally
        {
            if (Directory.Exists(temp)) Directory.Delete(temp, true);
        }
    }

    private static byte[] Hex(string value)
    {
        byte[] result = new byte[value.Length / 2];
        for (int i = 0; i < result.Length; i++) result[i] = Convert.ToByte(value.Substring(i * 2, 2), 16);
        return result;
    }
    private static bool Equal(byte[] a, byte[] b)
    {
        if (a.Length != b.Length) return false;
        int diff = 0;
        for (int i = 0; i < a.Length; i++) diff |= a[i] ^ b[i];
        return diff == 0;
    }
}
