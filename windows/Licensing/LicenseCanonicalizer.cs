using System;
using System.IO;
using System.Linq;
using System.Text;

namespace EHAinElTurck.Plannings.Licensing
{
    /// <summary>Versioned binary signing format; avoids JSON canonicalization ambiguity.</summary>
    public static class LicenseCanonicalizer
    {
        private static readonly UTF8Encoding Utf8 = new UTF8Encoding(false, true);
        public static byte[] GetSigningBytes(LicenseDocument license)
        {
            if (license == null) throw new ArgumentNullException("license");
            if (!license.HasRequiredFields()) throw new InvalidDataException("License structure is invalid.");
            string[] features = license.Features.OrderBy(x => x, StringComparer.Ordinal).ToArray();
            for (int i = 0; i < features.Length; i++)
            {
                if (String.IsNullOrWhiteSpace(features[i]) || features[i].Length > 64)
                    throw new InvalidDataException("Invalid feature identifier.");
                if (i > 0 && String.Equals(features[i], features[i - 1], StringComparison.Ordinal))
                    throw new InvalidDataException("Duplicate feature identifier.");
                for (int j = 0; j < features[i].Length; j++)
                {
                    char c = features[i][j];
                    if (!((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_' || c == '.' || c == '-'))
                        throw new InvalidDataException("Invalid feature identifier characters.");
                }
            }
            using (MemoryStream stream = new MemoryStream())
            using (BinaryWriter writer = new BinaryWriter(stream, Utf8))
            {
                WriteString(writer, "HPL-LICENSE-SIGNATURE-V1");
                writer.Write(license.Version);
                WriteString(writer, license.ProductId);
                WriteString(writer, license.LicenseId);
                WriteString(writer, license.Serial.ToUpperInvariant());
                WriteString(writer, license.MachineId.ToLowerInvariant());
                WriteString(writer, license.RequestNonce);
                WriteString(writer, license.LicenseType);
                writer.Write(license.IssuedAtUtc.Ticks);
                writer.Write(license.ExpiresAtUtc.HasValue ? license.ExpiresAtUtc.Value.Ticks : -1L);
                writer.Write(license.SigningKeyVersion);
                writer.Write(features.Length);
                for (int i = 0; i < features.Length; i++) WriteString(writer, features[i]);
                writer.Flush();
                return stream.ToArray();
            }
        }
        private static void WriteString(BinaryWriter writer, string value)
        {
            byte[] bytes = Utf8.GetBytes(value ?? String.Empty);
            writer.Write(bytes.Length);
            writer.Write(bytes);
        }
    }
}
