using System;
using System.Security.Cryptography;

namespace EHAinElTurck.Plannings.Licensing
{
    /// <summary>
    /// Coordinates offline QR activation. The server must independently enforce one-time
    /// request nonce consumption; this client-side store is an additional replay barrier.
    /// </summary>
    public sealed class ActivationProtocolService
    {
        private static readonly TimeSpan RequestLifetime = TimeSpan.FromMinutes(20);
        private readonly string _machineId;
        private readonly ClockGuard _clockGuard;
        private readonly PendingActivationStore _pending;
        private readonly DpapiLicenseStorage _licenseStorage;
        private readonly Ed25519LicenseVerifier _verifier;

        public ActivationProtocolService(string appDataDirectory, string machineId, Ed25519LicenseVerifier verifier)
        {
            if (String.IsNullOrWhiteSpace(appDataDirectory)) throw new ArgumentException("App data directory required.");
            if (!LicenseSerial.IsSha256Hex(machineId)) throw new ArgumentException("Machine identifier must be SHA-256 hex.");
            if (verifier == null) throw new ArgumentNullException("verifier");
            _machineId = machineId.ToLowerInvariant();
            _clockGuard = new ClockGuard(appDataDirectory, TimeSpan.FromMinutes(2));
            _pending = new PendingActivationStore(appDataDirectory);
            _licenseStorage = new DpapiLicenseStorage(appDataDirectory);
            _verifier = verifier;
        }

        public string CreateRequestQr()
        {
            byte[] nonceBytes = new byte[32];
            using (RandomNumberGenerator rng = RandomNumberGenerator.Create()) rng.GetBytes(nonceBytes);
            LicenseActivationRequest request = new LicenseActivationRequest();
            request.Protocol = LicenseActivationRequest.CurrentProtocol;
            request.ProductId = LicenseDocument.ExpectedProductId;
            request.MachineId = _machineId;
            request.RequestId = Guid.NewGuid().ToString("N");
            request.Nonce = Base64Url(nonceBytes);
            request.CreatedAtUtc = DateTime.UtcNow;
            _pending.Save(request);
            return LicenseQrCodec.EncodeRequest(request);
        }

        public LicenseEvaluation AcceptResponseQr(string responseJson, DateTime utcNow)
        {
            if (utcNow.Kind != DateTimeKind.Utc) throw new ArgumentException("UTC time required.");
            try
            {
                if (!_clockGuard.Observe(utcNow))
                    return new LicenseEvaluation(LicenseState.ClockTampered, "CLOCK_ROLLBACK_DETECTED");
            }
            catch { return new LicenseEvaluation(LicenseState.ClockTampered, "CLOCK_GUARD_UNAVAILABLE"); }
            LicenseActivationRequest pending = _pending.Load();
            if (pending == null) return new LicenseEvaluation(LicenseState.Invalid, "NO_PENDING_ACTIVATION_REQUEST");

            TimeSpan age = utcNow - pending.CreatedAtUtc;
            if (age < TimeSpan.FromMinutes(-2) || age > RequestLifetime)
                return new LicenseEvaluation(LicenseState.Invalid, "ACTIVATION_REQUEST_EXPIRED");

            LicenseDocument license;
            try { license = LicenseQrCodec.DecodeLicense(responseJson); }
            catch { return new LicenseEvaluation(LicenseState.Invalid, "LICENSE_QR_INVALID"); }

            if (!String.Equals(license.MachineId, _machineId, StringComparison.OrdinalIgnoreCase)
                || !String.Equals(license.RequestNonce, pending.Nonce, StringComparison.Ordinal))
                return new LicenseEvaluation(LicenseState.Invalid, "ACTIVATION_CHALLENGE_MISMATCH");

            if (license.IssuedAtUtc < pending.CreatedAtUtc.AddMinutes(-2)
                || license.IssuedAtUtc > utcNow.AddMinutes(2))
                return new LicenseEvaluation(LicenseState.Invalid, "LICENSE_ISSUE_TIME_INVALID");

            bool verified = _verifier.Verify(license);
            LicenseEvaluation evaluation = LicensePolicy.Evaluate(license, verified, _machineId, false, utcNow);
            if (!evaluation.AllowsBusinessFeatures) return evaluation;

            // Save the signed license before consuming the pending request. If disk writing fails,
            // the user can retry scanning the same response while the request remains pending.
            _licenseStorage.Save(license);
            _pending.Consume();
            return evaluation;
        }

        public LicenseEvaluation EvaluateInstalledLicense(DateTime utcNow)
        {
            if (utcNow.Kind != DateTimeKind.Utc) throw new ArgumentException("UTC time required.");
            LicenseDocument installed;
            try { installed = _licenseStorage.Load(); }
            catch { return new LicenseEvaluation(LicenseState.Invalid, "LOCAL_LICENSE_STORAGE_INVALID"); }
            if (installed == null) return new LicenseEvaluation(LicenseState.Unactivated, "LICENSE_NOT_INSTALLED");

            try
            {
                if (!_clockGuard.Observe(utcNow))
                    return new LicenseEvaluation(LicenseState.ClockTampered, "CLOCK_ROLLBACK_DETECTED");
            }
            catch { return new LicenseEvaluation(LicenseState.ClockTampered, "CLOCK_GUARD_UNAVAILABLE"); }

            bool verified = _verifier.Verify(installed);
            return LicensePolicy.Evaluate(installed, verified, _machineId, false, utcNow);
        }

        private static string Base64Url(byte[] bytes)
        {
            return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        }
    }
}
