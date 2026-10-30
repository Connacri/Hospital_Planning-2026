import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  onDecoded: (text: string) => void;
  onError: (message: string) => void;
};

export default function QrScanner({ onDecoded, onError }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const deliveredRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode("license-qr-reader", false);
    scannerRef.current = scanner;
    let disposed = false;

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
      (decodedText) => {
        if (deliveredRef.current || disposed) return;
        deliveredRef.current = true;
        onDecoded(decodedText);
      },
      () => undefined,
    ).catch((error: unknown) => {
      if (!disposed) onError(error instanceof Error ? error.message : "Caméra indisponible.");
    });

    return () => {
      disposed = true;
      const active = scannerRef.current;
      scannerRef.current = null;
      if (active?.isScanning) {
        active.stop().catch(() => undefined).finally(() => active.clear());
      } else {
        active?.clear();
      }
    };
  }, [onDecoded, onError]);

  return <div id="license-qr-reader" className="qr-reader" aria-label="Scanner QR" />;
}
