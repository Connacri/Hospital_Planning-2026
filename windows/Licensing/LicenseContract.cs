using System;
using System.Runtime.Serialization;

namespace EHAinElTurck.Plannings.Licensing
{
    [DataContract]
    public sealed class LicenseDocument
    {
        [DataMember(Order = 1, IsRequired = true)] public int Version { get; set; }
        [DataMember(Order = 2, IsRequired = true)] public string ProductId { get; set; }
        [DataMember(Order = 3, IsRequired = true)] public string LicenseId { get; set; }
        [DataMember(Order = 4, IsRequired = true)] public string Serial { get; set; }
        [DataMember(Order = 5, IsRequired = true)] public string MachineId { get; set; }
        [DataMember(Order = 6, IsRequired = true)] public string RequestNonce { get; set; }
        [DataMember(Order = 7, IsRequired = true)] public string LicenseType { get; set; }
        [DataMember(Order = 8, IsRequired = true)] public DateTime IssuedAtUtc { get; set; }
        [DataMember(Order = 9, EmitDefaultValue = false)] public DateTime? ExpiresAtUtc { get; set; }
        [DataMember(Order = 10, IsRequired = true)] public string[] Features { get; set; }
        [DataMember(Order = 11, IsRequired = true)] public string SignatureAlgorithm { get; set; }
        [DataMember(Order = 12, IsRequired = true)] public int SigningKeyVersion { get; set; }
        [DataMember(Order = 13, IsRequired = true)] public string Signature { get; set; }

        public const int CurrentVersion = 1;
        public const string ExpectedProductId = "HOSPITAL_PLANNING_2026";
        public const string ExpectedSignatureAlgorithm = "Ed25519";

        public bool HasRequiredFields()
        {
            return Version == CurrentVersion
                && ProductId == ExpectedProductId
                && !String.IsNullOrWhiteSpace(LicenseId)
                && LicenseId.Length <= 64
                && LicenseSerial.IsValid(Serial)
                && LicenseSerial.IsSha256Hex(MachineId)
                && !String.IsNullOrWhiteSpace(RequestNonce)
                && RequestNonce.Length >= 32
                && RequestNonce.Length <= 128
                && (LicenseType == "TIME_LIMITED" || LicenseType == "PERPETUAL")
                && IssuedAtUtc.Kind == DateTimeKind.Utc
                && (LicenseType != "PERPETUAL" || !ExpiresAtUtc.HasValue)
                && IssuedAtUtc > DateTime.MinValue
                && (LicenseType != "TIME_LIMITED" || (ExpiresAtUtc.HasValue && ExpiresAtUtc.Value.Kind == DateTimeKind.Utc && ExpiresAtUtc.Value > IssuedAtUtc))
                && Features != null
                && Features.Length > 0
                && Features.Length <= 32
                && SignatureAlgorithm == ExpectedSignatureAlgorithm
                && SigningKeyVersion > 0
                && !String.IsNullOrWhiteSpace(Signature);
        }
    }

    public static class LicenseSerial
    {
        // Alphabet excludes 0/O and 1/I to reduce transcription errors.
        private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        public static bool IsValid(string serial)
        {
            if (String.IsNullOrEmpty(serial) || serial.Length != 10) return false;
            for (int i = 0; i < serial.Length; i++)
                if (Alphabet.IndexOf(Char.ToUpperInvariant(serial[i])) < 0) return false;
            return true;
        }

        public static bool IsSha256Hex(string value)
        {
            if (String.IsNullOrEmpty(value) || value.Length != 64) return false;
            for (int i = 0; i < value.Length; i++)
            {
                char c = value[i];
                if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')))
                    return false;
            }
            return true;
        }
    }

    [DataContract]
    public sealed class LicenseActivationRequest
    {
        [DataMember(Order = 1, IsRequired = true)] public string Protocol { get; set; }
        [DataMember(Order = 2, IsRequired = true)] public string ProductId { get; set; }
        [DataMember(Order = 3, IsRequired = true)] public string MachineId { get; set; }
        [DataMember(Order = 4, IsRequired = true)] public string RequestId { get; set; }
        [DataMember(Order = 5, IsRequired = true)] public string Nonce { get; set; }
        [DataMember(Order = 6, IsRequired = true)] public DateTime CreatedAtUtc { get; set; }

        public const string CurrentProtocol = "HPL-ACTIVATION-1";

        private static bool IsBase64Url(string value)
        {
            for (int i = 0; i < value.Length; i++)
            {
                char ch = value[i];
                if (!((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')
                    || (ch >= '0' && ch <= '9') || ch == '-' || ch == '_')) return false;
            }
            return true;
        }

        public bool IsStructurallyValid()
        {
            return Protocol == CurrentProtocol
                && ProductId == LicenseDocument.ExpectedProductId
                && LicenseSerial.IsSha256Hex(MachineId)
                && !String.IsNullOrWhiteSpace(RequestId)
                && Guid.TryParseExact(RequestId, "N", out Guid parsedRequestId)
                && !String.IsNullOrWhiteSpace(Nonce)
                && Nonce.Length == 43
                && IsBase64Url(Nonce)
                && CreatedAtUtc.Kind == DateTimeKind.Utc
                && CreatedAtUtc > DateTime.MinValue;
        }
    }
}
