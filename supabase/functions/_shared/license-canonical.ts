const encoder = new TextEncoder();

function dotNetTicks(isoUtc: string): bigint {
  const millis = Date.parse(isoUtc);
  if (!Number.isFinite(millis)) throw new Error("Invalid UTC date.");
  return BigInt(millis) * 10000n + 621355968000000000n;
}

export function canonicalLicenseBytes(doc: {
  version: number;
  signature_algorithm: string;
  product_id: string;
  license_id: string;
  serial: string;
  machine_id: string;
  request_nonce: string;
  license_type: string;
  issued_at_utc: string;
  expires_at_utc: string | null;
  features: string[];
  signing_key_version: number;
}): Uint8Array {
  const chunks: Uint8Array[] = [];
  const push = (bytes: Uint8Array) => chunks.push(bytes);
  const int32 = (n: number) => {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setInt32(0, n, true);
    push(bytes);
  };
  const int64 = (n: bigint) => {
    const bytes = new Uint8Array(8);
    new DataView(bytes.buffer).setBigInt64(0, n, true);
    push(bytes);
  };
  const str = (s: string) => {
    const bytes = encoder.encode(s);
    int32(bytes.length);
    push(bytes);
  };

  str("HPL-LICENSE-SIGNATURE-V1");
  int32(doc.version);
  str(doc.signature_algorithm);
  str(doc.product_id);
  str(doc.license_id);
  str(doc.serial.toUpperCase());
  str(doc.machine_id.toLowerCase());
  str(doc.request_nonce);
  str(doc.license_type);
  int64(dotNetTicks(doc.issued_at_utc));
  int64(doc.expires_at_utc ? dotNetTicks(doc.expires_at_utc) : -1n);
  int32(doc.signing_key_version);
  const features = [...doc.features].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  int32(features.length);
  for (const feature of features) str(feature);

  const total = chunks.reduce((sum, item) => sum + item.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const item of chunks) { result.set(item, offset); offset += item.length; }
  return result;
}

