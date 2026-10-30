using System;
using System.IO;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Text;

namespace EHAinElTurck.Plannings.Licensing
{
    [DataContract]
    internal sealed class ActivationRequestWire
    {
        [DataMember(Name = "protocol", Order = 1, IsRequired = true)] public string Protocol { get; set; }
        [DataMember(Name = "product_id", Order = 2, IsRequired = true)] public string ProductId { get; set; }
        [DataMember(Name = "machine_id", Order = 3, IsRequired = true)] public string MachineId { get; set; }
        [DataMember(Name = "request_id", Order = 4, IsRequired = true)] public string RequestId { get; set; }
        [DataMember(Name = "nonce", Order = 5, IsRequired = true)] public string Nonce { get; set; }
        [DataMember(Name = "created_at_utc", Order = 6, IsRequired = true)] public string CreatedAtUtc { get; set; }
    }

    [DataContract]
    internal sealed class LicenseDocumentWire
    {
        [DataMember(Name = "version", Order = 1, IsRequired = true)] public int Version { get; set; }
        [DataMember(Name = "product_id", Order = 2, IsRequired = true)] public string ProductId { get; set; }
        [DataMember(Name = "license_id", Order = 3, IsRequired = true)] public string LicenseId { get; set; }
        [DataMember(Name = "serial", Order = 4, IsRequired = true)] public string Serial { get; set; }
        [DataMember(Name = "machine_id", Order = 5, IsRequired = true)] public string MachineId { get; set; }
        [DataMember(Name = "request_nonce", Order = 6, IsRequired = true)] public string RequestNonce { get; set; }
        [DataMember(Name = "license_type", Order = 7, IsRequired = true)] public string LicenseType { get; set; }
        [DataMember(Name = "issued_at_utc", Order = 8, IsRequired = true)] public string IssuedAtUtc { get; set; }
        [DataMember(Name = "expires_at_utc", Order = 9, EmitDefaultValue = false)] public string ExpiresAtUtc { get; set; }
        [DataMember(Name = "features", Order = 10, IsRequired = true)] public string[] Features { get; set; }
        [DataMember(Name = "signature_algorithm", Order = 11, IsRequired = true)] public string SignatureAlgorithm { get; set; }
        [DataMember(Name = "signing_key_version", Order = 12, IsRequired = true)] public int SigningKeyVersion { get; set; }
        [DataMember(Name = "signature", Order = 13, IsRequired = true)] public string Signature { get; set; }
    }

    /// <summary>Interoperable QR JSON codec. Dates are explicit ISO-8601 UTC strings.</summary>
    public static class LicenseQrCodec
    {
        private const int MaxRequestBytes = 4096;
        private const int MaxLicenseBytes = 16384;
        private static readonly DataContractJsonSerializer RequestSerializer = new DataContractJsonSerializer(typeof(ActivationRequestWire));
        private static readonly DataContractJsonSerializer LicenseSerializer = new DataContractJsonSerializer(typeof(LicenseDocumentWire));

        public static string EncodeRequest(LicenseActivationRequest request)
        {
            if (request == null || !request.IsStructurallyValid()) throw new InvalidDataException("Activation request is invalid.");
            ActivationRequestWire wire = new ActivationRequestWire();
            wire.Protocol = request.Protocol;
            wire.ProductId = request.ProductId;
            wire.MachineId = request.MachineId;
            wire.RequestId = request.RequestId;
            wire.Nonce = request.Nonce;
            wire.CreatedAtUtc = FormatUtc(request.CreatedAtUtc);
            return Serialize(RequestSerializer, wire, MaxRequestBytes);
        }

        public static LicenseActivationRequest DecodeRequest(string json)
        {
            ActivationRequestWire wire = (ActivationRequestWire)Deserialize(RequestSerializer, json, MaxRequestBytes);
            LicenseActivationRequest request = new LicenseActivationRequest();
            request.Protocol = wire.Protocol;
            request.ProductId = wire.ProductId;
            request.MachineId = wire.MachineId;
            request.RequestId = wire.RequestId;
            request.Nonce = wire.Nonce;
            request.CreatedAtUtc = ParseUtc(wire.CreatedAtUtc);
            if (!request.IsStructurallyValid()) throw new InvalidDataException("Activation request payload is invalid.");
            return request;
        }

        public static string EncodeLicense(LicenseDocument license)
        {
            if (license == null || !license.HasRequiredFields()) throw new InvalidDataException("License is invalid.");
            LicenseDocumentWire wire = ToWire(license);
            return Serialize(LicenseSerializer, wire, MaxLicenseBytes);
        }

        public static LicenseDocument DecodeLicense(string json)
        {
            LicenseDocumentWire wire = (LicenseDocumentWire)Deserialize(LicenseSerializer, json, MaxLicenseBytes);
            LicenseDocument license = new LicenseDocument();
            license.Version = wire.Version;
            license.ProductId = wire.ProductId;
            license.LicenseId = wire.LicenseId;
            license.Serial = wire.Serial;
            license.MachineId = wire.MachineId;
            license.RequestNonce = wire.RequestNonce;
            license.LicenseType = wire.LicenseType;
            license.IssuedAtUtc = ParseUtc(wire.IssuedAtUtc);
            license.ExpiresAtUtc = String.IsNullOrEmpty(wire.ExpiresAtUtc) ? (DateTime?)null : ParseUtc(wire.ExpiresAtUtc);
            license.Features = wire.Features;
            license.SignatureAlgorithm = wire.SignatureAlgorithm;
            license.SigningKeyVersion = wire.SigningKeyVersion;
            license.Signature = wire.Signature;
            if (!license.HasRequiredFields()) throw new InvalidDataException("License payload is invalid.");
            return license;
        }

        private static LicenseDocumentWire ToWire(LicenseDocument license)
        {
            LicenseDocumentWire wire = new LicenseDocumentWire();
            wire.Version = license.Version; wire.ProductId = license.ProductId; wire.LicenseId = license.LicenseId;
            wire.Serial = license.Serial; wire.MachineId = license.MachineId; wire.RequestNonce = license.RequestNonce;
            wire.LicenseType = license.LicenseType; wire.IssuedAtUtc = FormatUtc(license.IssuedAtUtc);
            wire.ExpiresAtUtc = license.ExpiresAtUtc.HasValue ? FormatUtc(license.ExpiresAtUtc.Value) : null;
            wire.Features = license.Features; wire.SignatureAlgorithm = license.SignatureAlgorithm;
            wire.SigningKeyVersion = license.SigningKeyVersion; wire.Signature = license.Signature;
            return wire;
        }

        private static string Serialize(DataContractJsonSerializer serializer, object value, int maxBytes)
        {
            using (MemoryStream stream = new MemoryStream())
            {
                serializer.WriteObject(stream, value);
                if (stream.Length > maxBytes) throw new InvalidDataException("QR payload exceeds size limit.");
                return Encoding.UTF8.GetString(stream.ToArray());
            }
        }

        private static object Deserialize(DataContractJsonSerializer serializer, string json, int maxBytes)
        {
            if (String.IsNullOrWhiteSpace(json)) throw new InvalidDataException("QR payload is empty.");
            byte[] bytes = Encoding.UTF8.GetBytes(json);
            if (bytes.Length > maxBytes) throw new InvalidDataException("QR payload exceeds size limit.");
            using (MemoryStream stream = new MemoryStream(bytes, false)) return serializer.ReadObject(stream);
        }

        private static string FormatUtc(DateTime value)
        {
            if (value.Kind != DateTimeKind.Utc) throw new InvalidDataException("UTC date required.");
            return value.ToString("yyyy-MM-dd'T'HH:mm:ss.fffffff'Z'", System.Globalization.CultureInfo.InvariantCulture);
        }

        private static DateTime ParseUtc(string value)
        {
            DateTime parsed;
            if (String.IsNullOrWhiteSpace(value) || !value.EndsWith("Z", StringComparison.Ordinal)
                || !DateTime.TryParse(value, System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal, out parsed))
                throw new InvalidDataException("Date must be ISO-8601 UTC.");
            return DateTime.SpecifyKind(parsed, DateTimeKind.Utc);
        }
    }
}
