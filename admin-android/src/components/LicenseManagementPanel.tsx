import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type LicenseRow = {
  id: string;
  serial: string;
  machine_id: string;
  license_type: "TIME_LIMITED" | "PERPETUAL";
  issued_at_utc: string;
  expires_at_utc: string | null;
  status: "active" | "revoked";
  revoked_at: string | null;
  created_at: string;
};

function dateLabel(value: string | null): string {
  if (!value) return "Sans expiration";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value));
}

export default function LicenseManagementPanel() {
  const [rows, setRows] = useState<LicenseRow[]>([]);
  const [role, setRole] = useState("");
  const [query, setQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState<LicenseRow | null>(null);
  const [reason, setReason] = useState("Révocation administrative");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadLicenses = useCallback(async (search: string) => {
    setLoading(true);
    setError("");
    const { data, error: listError } = await supabase.functions.invoke("list-licenses", {
      body: { search, limit: 50, offset: 0 },
    });
    setLoading(false);
    if (listError || !data?.licenses) {
      setError(listError?.message || "Impossible de charger les licences.");
      return;
    }
    setRows(data.licenses as LicenseRow[]);
    setRole(data.role || "");
    setTotal(data.count || 0);
  }, []);

  useEffect(() => { void loadLicenses(""); }, [loadLicenses]);

  const revoke = async () => {
    if (!target || !reason.trim() || busy) return;
    setBusy(true); setError(""); setNotice("");
    const { data, error: revokeError } = await supabase.functions.invoke("revoke-license", {
      body: { license_id: target.id, reason: reason.trim() },
    });
    setBusy(false);
    if (revokeError || !data?.success) {
      setError(revokeError?.message || "La révocation a été refusée.");
      return;
    }
    setNotice("Licence " + target.serial + " révoquée. Les postes totalement hors ligne ne recevront cette information qu’après l’ajout d’un contrôle de révocation en ligne ou une mise à jour.");
    setTarget(null);
    await loadLicenses(query.trim());
  };

  return <section className="panel manage-panel">
    <div className="manage-heading">
      <div><h2>Gestion des licences</h2><p className="muted">{total} licence(s) enregistrée(s) · rôle : {role || "—"}</p></div>
      <button className="secondary small" onClick={() => void loadLicenses(query.trim())} disabled={loading}>{loading ? "Actualisation…" : "Actualiser"}</button>
    </div>

    <form className="license-search" onSubmit={event => { event.preventDefault(); void loadLicenses(query.trim()); }}>
      <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher par numéro ou début du Machine ID" maxLength={64} />
      <button type="submit" disabled={loading}>Rechercher</button>
    </form>

    {rows.length === 0 && !loading && <p className="muted">Aucune licence trouvée.</p>}
    <div className="license-list">
      {rows.map(row => {
        const expired = row.status === "active" && !!row.expires_at_utc && new Date(row.expires_at_utc).getTime() <= Date.now();
        const statusLabel = row.status === "revoked" ? "Révoquée" : expired ? "Expirée" : "Active";
        const statusClass = row.status === "revoked" ? "status-revoked" : expired ? "status-expired" : "status-active";
        return <article className="license-row" key={row.id}>
        <div className="license-row-main">
          <div className="license-row-title"><strong>{row.serial}</strong><span className={statusClass}>{statusLabel}</span></div>
          <div className="license-row-meta">{row.license_type === "PERPETUAL" ? "Perpétuelle" : "Temporaire"} · Émise le {dateLabel(row.issued_at_utc)} · Expiration : {dateLabel(row.expires_at_utc)}</div>
          <code className="license-machine-short">{row.machine_id.slice(0, 12)}…{row.machine_id.slice(-8)}</code>
        </div>
        {role === "owner" && row.status === "active" && !expired && <button className="danger small" onClick={() => { setTarget(row); setReason("Révocation administrative"); }}>Révoquer</button>}
        {target?.id === row.id && <div className="revoke-confirm">
          <label>Motif de révocation<input value={reason} onChange={event => setReason(event.target.value)} maxLength={500} /></label>
          <div className="revoke-actions">
            <button className="danger" onClick={() => void revoke()} disabled={busy || !reason.trim()}>{busy ? "Révocation…" : "Confirmer la révocation"}</button>
            <button className="secondary" onClick={() => setTarget(null)} disabled={busy}>Annuler</button>
          </div>
        </div>}
      </article>;
      })}
    </div>
    {notice && <p className="notice">{notice}</p>}
    {error && <p className="error">{error}</p>}
    <p className="small-text muted">La révocation est immédiate côté serveur. Un poste totalement hors ligne ne peut pas être bloqué à distance ; il faudra lui ajouter un contrôle de révocation en ligne ou lui transmettre une mise à jour.</p>
  </section>;
}
