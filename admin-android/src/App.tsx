import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Session } from "@supabase/supabase-js";
import QrScanner from "./components/QrScanner";
import { supabase, supabaseConfigured } from "./lib/supabase";

type ActivationRequest = {
  protocol: "HPL-ACTIVATION-1";
  product_id: "HOSPITAL_PLANNING_2026";
  machine_id: string;
  request_id: string;
  nonce: string;
  created_at_utc: string;
};

type SignedLicense = {
  version: number;
  product_id: string;
  license_id: string;
  serial: string;
  machine_id: string;
  request_nonce: string;
  license_type: "TIME_LIMITED" | "PERPETUAL";
  issued_at_utc: string;
  expires_at_utc: string | null;
  features: string[];
  signature_algorithm: "Ed25519";
  signing_key_version: number;
  signature: string;
};

type LicenseDuration = "7" | "30" | "90" | "180" | "365" | "custom" | "perpetual";

function isActivationRequest(value: unknown): value is ActivationRequest {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return item.protocol === "HPL-ACTIVATION-1"
    && item.product_id === "HOSPITAL_PLANNING_2026"
    && typeof item.machine_id === "string" && /^[a-f0-9]{64}$/i.test(item.machine_id)
    && typeof item.request_id === "string" && /^[a-f0-9]{32}$/i.test(item.request_id)
    && typeof item.nonce === "string" && /^[A-Za-z0-9_-]{43}$/.test(item.nonce)
    && typeof item.created_at_utc === "string" && item.created_at_utc.endsWith("Z");
}

function formatDate(value: string | null): string {
  if (!value) return "Sans expiration";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activation, setActivation] = useState<ActivationRequest | null>(null);
  const [duration, setDuration] = useState<LicenseDuration>("30");
  const [customDays, setCustomDays] = useState("30");
  const [signedLicense, setSignedLicense] = useState<SignedLicense | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);

  const onDecoded = useCallback((raw: string) => {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isActivationRequest(parsed)) throw new Error("Ce QR ne correspond pas à une demande d’activation Hospital Planning.");
      setActivation(parsed);
      setSignedLicense(null);
      setError("");
      setNotice("Demande QR lue. Vérifiez l’identifiant machine avant de délivrer la licence.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "QR invalide.");
    }
  }, []);

  const onScannerError = useCallback((message: string) => {
    setError("Accès caméra impossible : " + message + ". Autorisez la caméra ou utilisez le collage manuel.");
  }, []);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (loginError) setError("Connexion refusée. Vérifiez vos identifiants.");
  };

  const issueLicense = async () => {
    if (!activation) return;
    const custom = duration === "custom";
    const perpetual = duration === "perpetual";
    const days = custom ? Number(customDays) : Number(duration);
    if (!perpetual && (!Number.isInteger(days) || days < 1 || days > 3650)) {
      setError("La durée personnalisée doit être comprise entre 1 et 3650 jours.");
      return;
    }

    setBusy(true); setError(""); setNotice(""); setSignedLicense(null);
    const { data, error: invokeError } = await supabase.functions.invoke("issue-license", {
      body: {
        activation_request: activation,
        license_type: perpetual ? "PERPETUAL" : "TIME_LIMITED",
        duration_days: perpetual ? null : days,
        custom_duration: custom,
      },
    });
    setBusy(false);
    if (invokeError || !data?.license) {
      setError(invokeError?.message || data?.error || "Le serveur n’a pas délivré la licence.");
      return;
    }
    setSignedLicense(data.license as SignedLicense);
    setNotice("Licence signée par le serveur. Présentez ce QR au poste Windows pour terminer l’activation.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setActivation(null); setSignedLicense(null); setNotice(""); setError("");
  };

  const qrValue = useMemo(() => signedLicense ? JSON.stringify(signedLicense) : "", [signedLicense]);

  if (!supabaseConfigured) {
    return <main className="shell"><section className="panel"><h1>Configuration requise</h1><p>Créez le fichier <code>.env</code> à partir de <code>.env.example</code> et renseignez l’URL Supabase et la clé publique anon/publishable. Ne mettez jamais la clé service_role ni la clé privée Ed25519 dans cette application.</p></section></main>;
  }

  if (!session) {
    return <main className="shell"><section className="panel auth-panel">
      <div className="brand-mark">HP</div><p className="eyebrow">CONSOLE ADMINISTRATEUR</p><h1>Hospital Planning</h1><p className="muted">Connexion sécurisée pour délivrer les licences hors ligne.</p>
      <form onSubmit={handleLogin}>
        <label>Adresse e-mail<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Mot de passe<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        <button disabled={busy}>{busy ? "Connexion…" : "Se connecter"}</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section></main>;
  }

  return <main className="shell">
    <header className="topbar"><div><p className="eyebrow">ESPACE ADMINISTRATEUR</p><strong>Hospital Planning · Licences</strong></div><button className="secondary small" onClick={signOut}>Déconnexion</button></header>
    <section className="panel">
      <div className="step-heading"><span>01</span><div><h1>Scanner une demande</h1><p className="muted">Sur le poste Windows, ouvrez Activation et affichez le QR de demande.</p></div></div>
      {!activation && <QrScanner onDecoded={onDecoded} onError={onScannerError} />}
      {activation && <div className="machine-card">
        <p className="eyebrow">DEMANDE VALIDÉE</p>
        <div className="machine-row"><span>Produit</span><strong>Hospital Planning 2026</strong></div>
        <div className="machine-row"><span>Machine ID</span><code>{activation.machine_id}</code></div>
        <div className="machine-row"><span>Demande</span><code>{activation.request_id}</code></div>
        <div className="machine-row"><span>Créée le</span><strong>{formatDate(activation.created_at_utc)}</strong></div>
        <button className="secondary" onClick={() => { setActivation(null); setSignedLicense(null); setNotice(""); }}>Scanner une autre demande</button>
      </div>}
    </section>

    {activation && !signedLicense && <section className="panel">
      <div className="step-heading"><span>02</span><div><h2>Définir la licence</h2><p className="muted">Le serveur crée et signe le document. L’application Android ne détient aucune clé privée.</p></div></div>
      <label>Durée de licence
        <select value={duration} onChange={e => setDuration(e.target.value as LicenseDuration)}>
          <option value="7">7 jours</option><option value="30">30 jours</option><option value="90">90 jours</option>
          <option value="180">180 jours</option><option value="365">365 jours</option>
          <option value="custom">Durée personnalisée</option><option value="perpetual">Perpétuelle</option>
        </select>
      </label>
      {duration === "custom" && <label>Nombre de jours (1 à 3650)<input type="number" min="1" max="3650" value={customDays} onChange={e => setCustomDays(e.target.value)} /></label>}
      <button onClick={issueLicense} disabled={busy}>{busy ? "Signature en cours…" : "Générer et signer la licence"}</button>
    </section>}

    {signedLicense && <section className="panel issued-panel">
      <div className="step-heading"><span>03</span><div><h2>Licence prête</h2><p className="muted">Scannez ce QR depuis le poste Windows.</p></div></div>
      <div className="qr-output"><QRCodeSVG value={qrValue} size={280} level="H" includeMargin /></div>
      <div className="serial-box"><span>NUMÉRO DE LICENCE</span><strong>{signedLicense.serial}</strong></div>
      <div className="machine-row"><span>Type</span><strong>{signedLicense.license_type === "PERPETUAL" ? "Perpétuelle" : "Temporaire"}</strong></div>
      <div className="machine-row"><span>Expiration</span><strong>{formatDate(signedLicense.expires_at_utc)}</strong></div>
      <p className="muted small-text">Le numéro de 10 caractères sert de référence. Le QR contient le document signé complet et lié à cette machine.</p>
      <button className="secondary" onClick={() => { setActivation(null); setSignedLicense(null); setNotice(""); }}>Terminer et traiter une autre demande</button>
    </section>}

    {notice && <p className="notice">{notice}</p>}
    {error && <p className="error">{error}</p>}
    <footer>Accès réservé aux administrateurs autorisés · Toute émission est journalisée.</footer>
  </main>;
}
