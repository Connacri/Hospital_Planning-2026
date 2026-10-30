import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = { onDecoded: (value: string) => void; onError: (message: string) => void };

export default function ResponseQrScanner({ onDecoded, onError }: Props) {
  const delivered = useRef(false);
  useEffect(() => {
    const scanner = new Html5Qrcode("license-response-qr-reader", false);
    let disposed = false;
    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
      (value) => {
        if (disposed || delivered.current) return;
        delivered.current = true;
        onDecoded(value);
      },
      () => undefined,
    ).catch((error: unknown) => {
      if (!disposed) onError(error instanceof Error ? error.message : "Caméra indisponible.");
    });
    return () => {
      disposed = true;
      if (scanner.isScanning) scanner.stop().catch(() => undefined).finally(() => scanner.clear());
      else scanner.clear();
    };
  }, [onDecoded, onError]);
  return <div id="license-response-qr-reader" className="license-response-scanner" />;
}
