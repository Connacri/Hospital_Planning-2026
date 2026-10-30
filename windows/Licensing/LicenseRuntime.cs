using System;
using System.Collections.Generic;

namespace EHAinElTurck.Plannings.Licensing
{
    public static class LicenseRuntime
    {
        private static readonly object Sync = new object();
        private static ActivationProtocolService _protocol;
        private static string _machineId = String.Empty;
        private static string _initializationError = String.Empty;
        private static bool _configured;

        public static void Initialize(string appDataDirectory)
        {
            lock (Sync)
            {
                _configured = TrustedPublicKeyRing.IsConfigured;
                try
                {
                    IDictionary<int, byte[]> keys = TrustedPublicKeyRing.Create();
                    _configured = keys.Count > 0;
                    _machineId = MachineFingerprint.Create();
                    _protocol = new ActivationProtocolService(appDataDirectory, _machineId,
                        new Ed25519LicenseVerifier(keys));
                    _initializationError = String.Empty;
                }
                catch
                {
                    _protocol = null;
                    // Preserve configured=true when a pinned key exists but native initialization fails.
                    _initializationError = "MACHINE_OR_LICENSE_ENGINE_INITIALIZATION_FAILED";
                }
            }
        }

        public static string GetStatusJson()
        {
            lock (Sync)
            {
                if (_protocol == null)
                    return Status(_configured, LicenseState.Invalid, _initializationError, false);
                if (!_configured)
                    return Status(false, LicenseState.Unactivated, "TRUSTED_PUBLIC_KEY_NOT_PINNED", false);
                LicenseEvaluation evaluation = _protocol.EvaluateInstalledLicense(DateTime.UtcNow);
                return Status(true, evaluation.State, evaluation.ReasonCode, evaluation.AllowsBusinessFeatures);
            }
        }

        public static string GetMachineJson()
        {
            lock (Sync)
                return "{\"machineId\":" + JsonString(_machineId)
                    + ",\"productId\":" + JsonString(LicenseDocument.ExpectedProductId)
                    + ",\"configured\":" + (_configured ? "true" : "false") + "}";
        }

        public static string CreateRequestJson()
        {
            lock (Sync)
            {
                if (_protocol == null) throw new InvalidOperationException(_initializationError);
                return "{\"success\":true,\"qr\":" + JsonString(_protocol.CreateRequestQr()) + "}";
            }
        }

        public static string AcceptResponseJson(string responseQr)
        {
            lock (Sync)
            {
                if (_protocol == null)
                    return Status(_configured, LicenseState.Invalid, _initializationError, false);
                if (!_configured)
                    return Status(false, LicenseState.Invalid, "TRUSTED_PUBLIC_KEY_NOT_PINNED", false);
                LicenseEvaluation evaluation = _protocol.AcceptResponseQr(responseQr, DateTime.UtcNow);
                return Status(true, evaluation.State, evaluation.ReasonCode, evaluation.AllowsBusinessFeatures);
            }
        }

        private static string Status(bool configured, LicenseState state, string reason, bool allowed)
        {
            return "{\"configured\":" + (configured ? "true" : "false")
                + ",\"state\":" + JsonString(state.ToString())
                + ",\"reason\":" + JsonString(reason)
                + ",\"machineId\":" + JsonString(_machineId)
                + ",\"allowsBusinessFeatures\":" + (allowed ? "true" : "false")
                + ",\"activationAvailable\":true}";
        }

        private static string JsonString(string value)
        {
            if (value == null) return "null";
            return "\"" + value.Replace("\\", "\\\\").Replace("\"", "\\\"")
                .Replace("\r", "\\r").Replace("\n", "\\n").Replace("\t", "\\t") + "\"";
        }
    }
}
