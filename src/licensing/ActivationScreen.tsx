import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import ResponseQrScanner from "./ResponseQrScanner";

type LicenseStatus = {
  configured: boolean;
  state: string;
  reason: string;
  machineId: string;
  allowsBusinessFeatures: boolean;
  activationAvailable: boolean;
};

type Props = { status: LicenseStatus; onActivated: () => void | Promise<void> };

export default function ActivationScreen({ status, onActivated }: Props) {
  const [requestQr, setRequestQr] = useState("");
  const [manualResponse, setManualResponse] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scannerMessage, setScannerMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/license/request", { method: "POST", cache: "no-store" })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !data.qr) throw new Error(data.error || "Impossible de générer la demande QR.");
        if (!cancelled) setRequestQr(data.qr as string);
      })
      .catch(cause => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Moteur de licence indisponible.");
      });
    return () => { cancelled = true; };
  }, []);

  const activate = useCallback(async (raw: string) => {
    if (!raw.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || !("signature" in parsed)) {
        throw new Error("Le QR ne contient pas un document de licence signé.");
      }
      const response = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok || result.state !== "Active") {
        throw new Error(result.reason || "La licence a été refusée.");
      }
      await onActivated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Activation impossible.");
    } finally {
      setBusy(false);
    }
  }, [busy, onActivated]);

  const onDecoded = useCallback((value: string) => { void activate(value); }, [activate]);
  const onScannerError = useCallback((message: string) => setScannerMessage(message), []);

  return <main className="license-activation-page">
    <section className="license-activation-card">
      <div className="license-brand">HP</div>
      <p className="license-eyebrow">HOSPITAL PLANNING · LICENCE WINDOWS</p>
      <h1>Activation de votre application</h1>
      <p className="license-muted">Les données hospitalières locales sont conservées. Seules les fonctions métier sont verrouillées tant qu’une licence valide n’est pas activée.</p>

      <div className="license-status">
        <span>État</span><strong>{status.state}</strong>
        <span>Motif</span><code>{status.reason}</code>
      </div>
      <div className="license-machine">
        <span>Identifiant de cette machine</span>
        <code>{status.machineId || "Indisponible"}</code>
      </div>

      <h2>1. Affichez cette demande sur le téléphone administrateur</h2>
      {requestQr ? <div className="license-qr"><QRCodeSVG value={requestQr} size={250} level="H" includeMargin /></div> : <p className="license-muted">Préparation du QR de demande…</p>}
      <p className="license-muted">Ouvrez l’application Android License Admin et scannez ce code. L’administrateur choisira ensuite la durée de la licence.</p>

      <h2>2. Scannez le QR de réponse</h2>
      <div className="license-response-scanner"><ResponseQrScanner onDecoded={onDecoded} onError={onScannerError} /></div>
      {scannerMessage && <p className="license-muted">Caméra : {scannerMessage}</p>}
      <label className="license-paste-label">Ou collez le contenu JSON du QR de réponse
        <textarea rows={4} value={manualResponse} onChange={e => setManualResponse(e.target.value)} placeholder="Collez ici le document de licence signé…" />
      </label>
      <button className="license-primary-button" onClick={() => void activate(manualResponse)} disabled={busy || !manualResponse.trim()}>
        {busy ? "Vérification de la signature…" : "Vérifier et activer la licence"}
      </button>
      {error && <p className="license-error">{error}</p>}
      <p className="license-footnote">La signature est vérifiée localement par le moteur natif Windows. Une connexion Internet n’est pas nécessaire après l’activation.</p>
    </section>
  </main>;
}
