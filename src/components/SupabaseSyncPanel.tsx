import React, { useState, useEffect, useMemo } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Settings,
  Key,
  Layers,
  Download,
  Upload,
  Info,
  Server,
  Code2,
  Sparkles,
} from 'lucide-react';
import {
  objectBoxStore,
  HospitalDocumentConfig,
  StaffEntity,
  LeaveTypeItem,
} from '../db/objectboxEngine';

interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableNameConfig: string;
  tableNameStaff: string;
  tableNameSnapshots: string;
  autoSync: boolean;
  lastSyncedAt: string | null;
}

const STORAGE_KEY_SUPABASE = 'eh_ain_el_turck_supabase_config_v1';

export const SupabaseSyncPanel: React.FC<{
  onShowToast: (msg: string) => void;
}> = ({ onShowToast }) => {
  // State for config
  const [config, setConfig] = useState<SupabaseConfig>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SUPABASE);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return {
      url: '',
      anonKey: '',
      tableNameConfig: 'hospital_config',
      tableNameStaff: 'staff_members',
      tableNameSnapshots: 'objectbox_sync_snapshots',
      autoSync: false,
      lastSyncedAt: null,
    };
  });

  const [activeSubTab, setActiveSubTab] = useState<'status' | 'sql' | 'sync' | 'guide'>('status');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    statusText?: string;
    details?: string;
  } | null>(null);

  const [isSyncingPush, setIsSyncingPush] = useState(false);
  const [isSyncingPull, setIsSyncingPull] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedSeeds, setCopiedSeeds] = useState(false);

  // Save config changes to localStorage
  const saveConfig = (next: Partial<SupabaseConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...next };
      try {
        localStorage.setItem(STORAGE_KEY_SUPABASE, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const snapshot = objectBoxStore.getSnapshot();
  const staffList = snapshot.staffBox;
  const hospitalConfig = snapshot.config;

  // Supabase Table Creation SQL Script
  const sqlSchemaScript = useMemo(() => {
    return `-- =====================================================================
-- ÉTABLISSEMENT HOSPITALIER D'AÏN EL TÜRCK — DR. MEDJBER TAMI
-- SERVICE DE RHUMATOLOGIE — SCRIPT DE CRÉATION DE TABLES SUPABASE (POSTGRESQL)
-- =====================================================================

-- 1. Table de configuration globale des documents et entêtes
CREATE TABLE IF NOT EXISTS public.${config.tableNameConfig || 'hospital_config'} (
    id BIGINT PRIMARY KEY DEFAULT 1,
    republic_header TEXT NOT NULL DEFAULT 'RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE',
    ministry_header TEXT NOT NULL DEFAULT 'MINISTÈRE DE LA SANTÉ, DE LA POPULATION ET DE LA RÉFORME HOSPITALIÈRE',
    hospital_header TEXT NOT NULL DEFAULT 'Établissement Hospitalier d''Aïn El Türck - Dr. Medjber Tami',
    unit_title TEXT NOT NULL DEFAULT 'Unité : Service de Rhumatologie',
    guard_month_name TEXT NOT NULL DEFAULT 'Octobre 2026',
    guard_month_offset_days INT NOT NULL DEFAULT 0,
    is_modificatif BOOLEAN NOT NULL DEFAULT false,
    city_date_portrait TEXT NOT NULL DEFAULT 'fait à Aïn el Türck le : 26/09/2026',
    city_date_landscape TEXT NOT NULL DEFAULT 'Fait à Aïn el Türck le : 26/09/2026',
    signatures_portrait JSONB NOT NULL DEFAULT '["Le Médecin chef", "Le Surveillant Médical", "DAPM", "Le Directeur Général"]'::jsonb,
    signatures_landscape JSONB NOT NULL DEFAULT '["Le Médecin Chef", "Le Surveillant Médical", "DAPM", "Le Directeur Général"]'::jsonb,
    legend_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    leave_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    days_columns JSONB NOT NULL DEFAULT '[]'::jsonb,
    modificatif_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Table du personnel hospitalier (Médecins, Paramédical Jour, Garde 16h, Hygiène 12h)
CREATE TABLE IF NOT EXISTS public.${config.tableNameStaff || 'staff_members'} (
    id BIGINT PRIMARY KEY,
    full_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('medical', 'paramedical_day', 'paramedical_guard', 'hygiene')),
    role_portrait TEXT NOT NULL,
    grade_landscape TEXT NOT NULL,
    obs_portrait TEXT DEFAULT '',
    horaire_block TEXT NOT NULL DEFAULT '08h-16h',
    team_group TEXT DEFAULT '',
    portrait_order INT NOT NULL DEFAULT 0,
    landscape_order INT NOT NULL DEFAULT 0,
    weekly_schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
    daily_activity JSONB NOT NULL DEFAULT '{}'::jsonb,
    maternity_leave JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index pour requêtes performantes ObjectBox/Supabase
CREATE INDEX IF NOT EXISTS idx_staff_category ON public.${config.tableNameStaff || 'staff_members'} (category);
CREATE INDEX IF NOT EXISTS idx_staff_team_group ON public.${config.tableNameStaff || 'staff_members'} (team_group);
CREATE INDEX IF NOT EXISTS idx_staff_portrait_order ON public.${config.tableNameStaff || 'staff_members'} (portrait_order);

-- 3. Table de synchronisation instantanée d'instantanés complets ObjectBox
CREATE TABLE IF NOT EXISTS public.${config.tableNameSnapshots || 'objectbox_sync_snapshots'} (
    id TEXT PRIMARY KEY,
    month_name TEXT NOT NULL,
    version INT NOT NULL DEFAULT 7,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Activation de la sécurité au niveau des lignes (Row Level Security - RLS)
ALTER TABLE public.${config.tableNameConfig || 'hospital_config'} ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.${config.tableNameStaff || 'staff_members'} ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.${config.tableNameSnapshots || 'objectbox_sync_snapshots'} ENABLE ROW LEVEL SECURITY;

-- 5. Politiques d'accès ouvertes (lecture/écriture pour les clés anon & authenticated)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow anon all on config" ON public.${config.tableNameConfig || 'hospital_config'};
    CREATE POLICY "Allow anon all on config" ON public.${config.tableNameConfig || 'hospital_config'} FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon all on staff" ON public.${config.tableNameStaff || 'staff_members'};
    CREATE POLICY "Allow anon all on staff" ON public.${config.tableNameStaff || 'staff_members'} FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow anon all on snapshots" ON public.${config.tableNameSnapshots || 'objectbox_sync_snapshots'};
    CREATE POLICY "Allow anon all on snapshots" ON public.${config.tableNameSnapshots || 'objectbox_sync_snapshots'} FOR ALL USING (true) WITH CHECK (true);
END $$;
`;
  }, [config.tableNameConfig, config.tableNameStaff, config.tableNameSnapshots]);

  // SQL Seed Insert Generator
  const sqlSeedScript = useMemo(() => {
    const escapedStaff = staffList.map((s) => {
      const name = s.fullName.replace(/'/g, "''");
      const role = s.rolePortrait.replace(/'/g, "''");
      const grade = s.gradeLandscape.replace(/'/g, "''");
      const obs = (s.obsPortrait || '').replace(/'/g, "''");
      const weekly = JSON.stringify(s.weeklySchedule || {}).replace(/'/g, "''");
      const daily = JSON.stringify(s.dailyActivity || {}).replace(/'/g, "''");
      const mat = s.maternityLeave ? `'${JSON.stringify(s.maternityLeave).replace(/'/g, "''")}'::jsonb` : 'NULL';

      return `(${s.id}, '${name}', '${s.category}', '${role}', '${grade}', '${obs}', '${s.horaireBlock}', '${s.teamGroup || ''}', ${s.portraitOrder}, ${s.landscapeOrder}, '${weekly}'::jsonb, '${daily}'::jsonb, ${mat})`;
    });

    return `-- =====================================================================
-- INSERTION DES 34 AGENTS ET DE LA CONFIGURATION (OCTOBRE 2026) DANS SUPABASE
-- =====================================================================

-- Insertion ou mise à jour de la configuration de l'établissement
INSERT INTO public.${config.tableNameConfig || 'hospital_config'} (
    id, republic_header, ministry_header, hospital_header, unit_title,
    guard_month_name, guard_month_offset_days, is_modificatif,
    city_date_portrait, city_date_landscape,
    signatures_portrait, signatures_landscape, days_columns
) VALUES (
    1,
    '${hospitalConfig.republicHeader.replace(/'/g, "''")}',
    '${hospitalConfig.ministryHeader.replace(/'/g, "''")}',
    '${hospitalConfig.hospitalHeader.replace(/'/g, "''")}',
    '${hospitalConfig.unitTitle.replace(/'/g, "''")}',
    '${(hospitalConfig.guardMonthName || 'Octobre 2026').replace(/'/g, "''")}',
    ${hospitalConfig.guardMonthOffsetDays || 0},
    ${hospitalConfig.isModificatif ? 'true' : 'false'},
    '${hospitalConfig.cityDatePortrait.replace(/'/g, "''")}',
    '${hospitalConfig.cityDateLandscape.replace(/'/g, "''")}',
    '${JSON.stringify(hospitalConfig.signaturesPortrait).replace(/'/g, "''")}'::jsonb,
    '${JSON.stringify(hospitalConfig.signaturesLandscape).replace(/'/g, "''")}'::jsonb,
    '${JSON.stringify(hospitalConfig.daysColumns).replace(/'/g, "''")}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    guard_month_name = EXCLUDED.guard_month_name,
    is_modificatif = EXCLUDED.is_modificatif,
    city_date_portrait = EXCLUDED.city_date_portrait,
    city_date_landscape = EXCLUDED.city_date_landscape,
    updated_at = timezone('utc'::text, now());

-- Insertion des 34 membres du personnel (Upsert avec ON CONFLICT)
INSERT INTO public.${config.tableNameStaff || 'staff_members'} (
    id, full_name, category, role_portrait, grade_landscape, obs_portrait,
    horaire_block, team_group, portrait_order, landscape_order,
    weekly_schedule, daily_activity, maternity_leave
) VALUES
${escapedStaff.join(',\n')}
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    category = EXCLUDED.category,
    role_portrait = EXCLUDED.role_portrait,
    grade_landscape = EXCLUDED.grade_landscape,
    obs_portrait = EXCLUDED.obs_portrait,
    horaire_block = EXCLUDED.horaire_block,
    team_group = EXCLUDED.team_group,
    weekly_schedule = EXCLUDED.weekly_schedule,
    daily_activity = EXCLUDED.daily_activity,
    maternity_leave = EXCLUDED.maternity_leave,
    updated_at = timezone('utc'::text, now());
`;
  }, [staffList, hospitalConfig, config.tableNameConfig, config.tableNameStaff]);

  // Test Supabase Connection via direct PostgREST endpoint
  const handleTestConnection = async () => {
    if (!config.url || !config.anonKey) {
      setTestResult({
        success: false,
        message: 'Veuillez saisir votre URL de projet Supabase et votre clé API (anon key).',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const cleanUrl = config.url.trim().replace(/\/+$/, '');

    try {
      // Test basic connectivity to Supabase PostgREST root
      const response = await fetch(`${cleanUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: config.anonKey.trim(),
          Authorization: `Bearer ${config.anonKey.trim()}`,
        },
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Connexion réussie à Supabase ! L\'API REST PostgREST répond parfaitement.',
          statusText: `Code HTTP ${response.status} (${response.statusText || 'OK'})`,
        });
        onShowToast('Connexion à Supabase validée avec succès !');
      } else {
        const errorText = await response.text();
        setTestResult({
          success: false,
          message: `L'API Supabase a renvoyé une erreur (Code HTTP ${response.status}). Vérifiez que la clé anon est exacte.`,
          details: errorText.slice(0, 300),
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Impossible de joindre le serveur Supabase. Vérifiez l\'URL ou l\'accès réseau.',
        details: err?.message || String(err),
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Push local ObjectBox database to Supabase (REST API Upsert)
  const handlePushToSupabase = async () => {
    if (!config.url || !config.anonKey) {
      onShowToast('Veuillez configurer l\'URL et la clé Supabase avant la synchronisation.');
      return;
    }

    setIsSyncingPush(true);
    setSyncProgress('Préparation du payload ObjectBox...');

    const cleanUrl = config.url.trim().replace(/\/+$/, '');
    const headers = {
      'Content-Type': 'application/json',
      apikey: config.anonKey.trim(),
      Authorization: `Bearer ${config.anonKey.trim()}`,
      Prefer: 'resolution=merge-duplicates',
    };

    try {
      // 1. Push Snapshot Backup to objectbox_sync_snapshots
      setSyncProgress('Envoi de l\'instantané complet du mois...');
      const snapshotPayload = {
        id: `snapshot_${hospitalConfig.guardMonthName || 'octobre_2026'}`.toLowerCase().replace(/\s+/g, '_'),
        month_name: hospitalConfig.guardMonthName || 'Octobre 2026',
        version: snapshot.version || 7,
        snapshot_data: snapshot,
        updated_at: new Date().toISOString(),
      };

      const snapRes = await fetch(`${cleanUrl}/rest/v1/${config.tableNameSnapshots || 'objectbox_sync_snapshots'}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(snapshotPayload),
      });

      if (!snapRes.ok) {
        const snapErr = await snapRes.text();
        throw new Error(`Erreur lors de la sauvegarde du snapshot: ${snapRes.status} - ${snapErr}`);
      }

      // 2. Push 34 Staff Members in batch
      setSyncProgress(`Envoi des ${staffList.length} membres du personnel...`);
      const staffRows = staffList.map((s) => ({
        id: s.id,
        full_name: s.fullName,
        category: s.category,
        role_portrait: s.rolePortrait,
        grade_landscape: s.gradeLandscape,
        obs_portrait: s.obsPortrait || '',
        horaire_block: s.horaireBlock,
        team_group: s.teamGroup || '',
        portrait_order: s.portraitOrder,
        landscape_order: s.landscapeOrder,
        weekly_schedule: s.weeklySchedule,
        daily_activity: s.dailyActivity,
        maternity_leave: s.maternityLeave || null,
        updated_at: new Date().toISOString(),
      }));

      const staffRes = await fetch(`${cleanUrl}/rest/v1/${config.tableNameStaff || 'staff_members'}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(staffRows),
      });

      if (!staffRes.ok) {
        const staffErr = await staffRes.text();
        throw new Error(`Erreur lors de l'envoi du personnel: ${staffRes.status} - ${staffErr}`);
      }

      // 3. Push Hospital Config singleton
      setSyncProgress('Envoi de la configuration du service...');
      const configPayload = {
        id: 1,
        republic_header: hospitalConfig.republicHeader,
        ministry_header: hospitalConfig.ministryHeader,
        hospital_header: hospitalConfig.hospitalHeader,
        unit_title: hospitalConfig.unitTitle,
        guard_month_name: hospitalConfig.guardMonthName || 'Octobre 2026',
        guard_month_offset_days: hospitalConfig.guardMonthOffsetDays || 0,
        is_modificatif: !!hospitalConfig.isModificatif,
        city_date_portrait: hospitalConfig.cityDatePortrait,
        city_date_landscape: hospitalConfig.cityDateLandscape,
        signatures_portrait: hospitalConfig.signaturesPortrait,
        signatures_landscape: hospitalConfig.signaturesLandscape,
        legend_items: hospitalConfig.legendItems,
        leave_types: hospitalConfig.leaveTypes,
        days_columns: hospitalConfig.daysColumns,
        modificatif_overrides: hospitalConfig.modificatifOverrides || {},
        updated_at: new Date().toISOString(),
      };

      const configRes = await fetch(`${cleanUrl}/rest/v1/${config.tableNameConfig || 'hospital_config'}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(configPayload),
      });

      if (!configRes.ok) {
        const cfgErr = await configRes.text();
        throw new Error(`Erreur lors de l'envoi de la config: ${configRes.status} - ${cfgErr}`);
      }

      const nowStr = new Date().toLocaleString('fr-FR');
      saveConfig({ lastSyncedAt: nowStr });
      setSyncProgress(null);
      onShowToast(`✅ Synchronisation réussie vers Supabase (${staffList.length} agents + configuration) !`);
    } catch (err: any) {
      setSyncProgress(null);
      alert(`Erreur de synchronisation vers Supabase :\n${err.message}\n\nAvez-vous bien exécuté le script SQL dans Supabase SQL Editor ?`);
    } finally {
      setIsSyncingPush(false);
    }
  };

  // Pull database from Supabase and synchronize with ObjectBox Store
  const handlePullFromSupabase = async () => {
    if (!config.url || !config.anonKey) {
      onShowToast('Veuillez configurer l\'URL et la clé Supabase avant la synchronisation.');
      return;
    }

    setIsSyncingPull(true);
    setSyncProgress('Téléchargement des données distantes depuis Supabase...');

    const cleanUrl = config.url.trim().replace(/\/+$/, '');
    const headers = {
      apikey: config.anonKey.trim(),
      Authorization: `Bearer ${config.anonKey.trim()}`,
    };

    try {
      // 1. Check for full snapshot in objectbox_sync_snapshots
      const snapUrl = `${cleanUrl}/rest/v1/${config.tableNameSnapshots || 'objectbox_sync_snapshots'}?select=*&order=updated_at.desc&limit=1`;
      const snapRes = await fetch(snapUrl, { headers });

      if (snapRes.ok) {
        const snapData = await snapRes.json();
        if (Array.isArray(snapData) && snapData.length > 0 && snapData[0].snapshot_data) {
          const success = objectBoxStore.importJsonSnapshot(JSON.stringify(snapData[0].snapshot_data));
          if (success) {
            const nowStr = new Date().toLocaleString('fr-FR');
            saveConfig({ lastSyncedAt: nowStr });
            setSyncProgress(null);
            onShowToast(`✅ Données distantes Supabase chargées et synchronisées dans ObjectBox !`);
            return;
          }
        }
      }

      // 2. Fallback to staff_members table
      const staffUrl = `${cleanUrl}/rest/v1/${config.tableNameStaff || 'staff_members'}?select=*`;
      const staffRes = await fetch(staffUrl, { headers });

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        if (Array.isArray(staffData) && staffData.length > 0) {
          staffData.forEach((row: any) => {
            const mappedStaff: Partial<StaffEntity> = {
              fullName: row.full_name,
              category: row.category,
              rolePortrait: row.role_portrait,
              gradeLandscape: row.grade_landscape,
              obsPortrait: row.obs_portrait,
              horaireBlock: row.horaire_block,
              teamGroup: row.team_group,
              portraitOrder: row.portrait_order,
              landscapeOrder: row.landscape_order,
              weeklySchedule: row.weekly_schedule,
              dailyActivity: row.daily_activity,
              maternityLeave: row.maternity_leave || undefined,
            };
            objectBoxStore.putStaff({ ...mappedStaff, id: row.id } as StaffEntity);
          });

          const nowStr = new Date().toLocaleString('fr-FR');
          saveConfig({ lastSyncedAt: nowStr });
          setSyncProgress(null);
          onShowToast(`✅ ${staffData.length} membres du personnel synchronisés depuis Supabase !`);
          return;
        }
      }

      throw new Error('Aucune donnée trouvée sur Supabase. Exécutez d\'abord le script SQL ou envoyez les données.');
    } catch (err: any) {
      setSyncProgress(null);
      alert(`Erreur lors du téléchargement depuis Supabase :\n${err.message}`);
    } finally {
      setIsSyncingPull(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaScript);
    setCopiedSql(true);
    onShowToast('Script SQL copié dans le presse-papier !');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCopySeeds = () => {
    navigator.clipboard.writeText(sqlSeedScript);
    setCopiedSeeds(true);
    onShowToast('Script d\'amorçage SQL copié dans le presse-papier !');
    setTimeout(() => setCopiedSeeds(false), 2500);
  };

  const handleDownloadSqlFile = () => {
    const fullContent = `${sqlSchemaScript}\n\n${sqlSeedScript}`;
    const blob = new Blob([fullContent], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supabase_hospital_planning_schema_${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onShowToast('Fichier SQL téléchargé avec succès !');
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 p-6 rounded-2xl border border-emerald-800/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Cloud className="w-48 h-48 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Base de Données Distante &amp; Cloud</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono">
                PostgreSQL • Supabase REST API
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Passerelle Remote DB Supabase &amp; Synchronisation ObjectBox
            </h2>
            <p className="text-slate-300 text-sm max-w-2xl mt-1 leading-relaxed">
              Connectez votre projet Supabase PostgreSQL, générez automatiquement les tables et schémas nécessaires, et synchronisez les plannings du Service de Rhumatologie (34 agents, gardes et tableaux d'activité) dans le cloud.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              <Server className={`w-4 h-4 ${isTesting ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
              <span>{isTesting ? 'Test en cours...' : 'Tester Connexion'}</span>
            </button>

            <button
              type="button"
              onClick={handlePushToSupabase}
              disabled={isSyncingPush || !config.url}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/50 disabled:opacity-50 cursor-pointer"
            >
              <CloudUpload className={`w-4 h-4 ${isSyncingPush ? 'animate-bounce' : ''}`} />
              <span>{isSyncingPush ? 'Envoi en cours...' : 'Envoyer vers Supabase'}</span>
            </button>
          </div>
        </div>

        {/* CONNECTION STATUS PILL */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">État de la connexion :</span>
            {config.url && config.anonKey ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Configuré ({config.url.replace(/^https?:\/\//, '').split('/')[0]})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>En attente de configuration d'URL</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>
              Dernière sync :{' '}
              <strong className="text-slate-200 font-mono">
                {config.lastSyncedAt || 'Jamais'}
              </strong>
            </span>
            <span>
              Données locales :{' '}
              <strong className="text-slate-200">{staffList.length} agents</strong>
            </span>
          </div>
        </div>
      </div>

      {/* SYNC PROGRESS NOTIFICATION */}
      {syncProgress && (
        <div className="bg-sky-950/80 border border-sky-600/70 p-4 rounded-xl text-sky-200 text-xs flex items-center gap-3 animate-pulse">
          <RefreshCw className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
          <span>{syncProgress}</span>
        </div>
      )}

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm">
        <button
          type="button"
          onClick={() => setActiveSubTab('status')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${
            activeSubTab === 'status'
              ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Settings className="w-4 h-4 text-emerald-400" />
          <span>Configuration &amp; Clés</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sql')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${
            activeSubTab === 'sql'
              ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Terminal className="w-4 h-4 text-sky-400" />
          <span>Générateur SQL &amp; Tables</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sync')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${
            activeSubTab === 'sync'
              ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <RefreshCw className="w-4 h-4 text-indigo-400" />
          <span>Synchronisation Bidirectionnelle</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('guide')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-colors ${
            activeSubTab === 'guide'
              ? 'bg-slate-800 text-white shadow-xs border border-slate-700'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Info className="w-4 h-4 text-amber-400" />
          <span>Guide en 3 Étapes</span>
        </button>
      </div>

      {/* TAB 1: CONFIGURATION & CREDENTIALS */}
      {activeSubTab === 'status' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Paramètres de Connexion Supabase</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Renseignez ci-dessous l'URL de votre instance Supabase et votre clé d'API. Ces informations restent stockées localement dans votre navigateur en toute sécurité.
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    URL du Projet Supabase (Project URL)
                  </label>
                  <input
                    type="url"
                    value={config.url}
                    onChange={(e) => saveConfig({ url: e.target.value })}
                    placeholder="https://xyzabcdefghijklm.supabase.co"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Trouvé dans Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Clé API Publique (anon key) ou Clé Service
                  </label>
                  <input
                    type="password"
                    value={config.anonKey}
                    onChange={(e) => saveConfig({ anonKey: e.target.value })}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Trouvé dans Supabase Dashboard &gt; Project Settings &gt; API &gt; Project API keys &gt; `anon public`.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Table Config
                    </label>
                    <input
                      type="text"
                      value={config.tableNameConfig}
                      onChange={(e) => saveConfig({ tableNameConfig: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Table Personnel
                    </label>
                    <input
                      type="text"
                      value={config.tableNameStaff}
                      onChange={(e) => saveConfig({ tableNameStaff: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Table Snapshots
                    </label>
                    <input
                      type="text"
                      value={config.tableNameSnapshots}
                      onChange={(e) => saveConfig({ tableNameSnapshots: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting || !config.url}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {isTesting ? 'Vérification...' : 'Tester la Connexion'}
                    </button>
                    {config.url && (
                      <button
                        type="button"
                        onClick={() => {
                          saveConfig({ url: '', anonKey: '' });
                          setTestResult(null);
                          onShowToast('Identifiants réinitialisés.');
                        }}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs transition-colors"
                      >
                        Effacer
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-500">
                    Sauvegardé automatiquement dans le navigateur
                  </span>
                </div>
              </div>
            </div>

            {/* TEST RESULT DISPLAY */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-200 ${
                  testResult.success
                    ? 'bg-emerald-950/70 border-emerald-600 text-emerald-200'
                    : 'bg-rose-950/70 border-rose-600 text-rose-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold">{testResult.message}</p>
                    {testResult.statusText && (
                      <p className="font-mono text-[11px] opacity-80">{testResult.statusText}</p>
                    )}
                    {testResult.details && (
                      <pre className="mt-1 p-2 bg-black/40 rounded border border-rose-800/50 text-[10.5px] font-mono overflow-x-auto whitespace-pre-wrap">
                        {testResult.details}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR: SCHEMA STATS & INFOS */}
          <div className="space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Statistiques ObjectBox Locales</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-900">
                  <span className="text-slate-400">Total Personnel :</span>
                  <span className="font-bold text-white font-mono">{staffList.length} agents</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-900">
                  <span className="text-slate-400">Médecins (08h-16h) :</span>
                  <span className="font-bold text-sky-300 font-mono">
                    {staffList.filter((s) => s.category === 'medical').length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-900">
                  <span className="text-slate-400">Paramédical Jour :</span>
                  <span className="font-bold text-emerald-300 font-mono">
                    {staffList.filter((s) => s.category === 'paramedical_day').length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-900">
                  <span className="text-slate-400">Garde 16h (Groupes A-E) :</span>
                  <span className="font-bold text-purple-300 font-mono">
                    {staffList.filter((s) => s.category === 'paramedical_guard').length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-900">
                  <span className="text-slate-400">Hygiène 12h :</span>
                  <span className="font-bold text-amber-300 font-mono">
                    {staffList.filter((s) => s.category === 'hygiene').length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Mois Actuel :</span>
                  <span className="font-bold text-white font-mono">
                    {hospitalConfig.guardMonthName || 'Octobre 2026'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Architecture Sécurisée</span>
              </h4>
              <p className="text-[11.5px] text-slate-400 leading-relaxed">
                Les tables Supabase sont configurées avec Row Level Security (RLS) et s'alignent avec les schémas ObjectBox pour assurer une persistance pérenne et multi-postes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SQL SCHEMA & TABLE CREATION GENERATOR */}
      {activeSubTab === 'sql' && (
        <div className="space-y-4">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-sky-400" />
                  <span>Script SQL pour Supabase SQL Editor</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Copiez et collez ce script dans l'onglet « SQL Editor » de Supabase pour créer instantanément les 3 tables et leurs règles RLS.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copié !' : 'Copier Schéma SQL'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySeeds}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  {copiedSeeds ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSeeds ? 'Copié !' : 'Copier Inserts (34 agents)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSqlFile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger .sql</span>
                </button>
              </div>
            </div>

            {/* SQL CODE PREVIEW */}
            <div className="relative">
              <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-[11px] font-mono text-sky-200 overflow-x-auto max-h-[460px] leading-relaxed">
                <code>{sqlSchemaScript}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BIDIRECTIONAL SYNC ENGINE */}
      {activeSubTab === 'sync' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PUSH BOX */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/20">
                  <CloudUpload className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Envoyer vers Supabase (Push Local → Distant)
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Transfère la base locale ObjectBox vers votre projet Supabase. Met à jour les 34 fiches individuelles, la répartition des gardes et le mois d'activité actuel.
                </p>
                <div className="mt-4 p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 text-[11px] text-slate-300">
                  <div>• 34 membres du personnel avec rotations et activités</div>
                  <div>• Configuration d'en-tête et signatures officielles</div>
                  <div>• Sauvegarde JSON complète de l'instantané</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePushToSupabase}
                disabled={isSyncingPush || !config.url}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50 cursor-pointer"
              >
                <CloudUpload className="w-4 h-4" />
                <span>{isSyncingPush ? 'Synchronisation en cours...' : 'Envoyer vers Supabase Maintenant'}</span>
              </button>
            </div>

            {/* PULL BOX */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-3 border border-sky-500/20">
                  <CloudDownload className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Télécharger depuis Supabase (Pull Distant → Local)
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Récupère les plannings et agents hébergés sur Supabase pour écraser ou mettre à jour la base locale réactive ObjectBox de ce poste.
                </p>
                <div className="mt-4 p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1 text-[11px] text-slate-300">
                  <div>• Restaure l'état exact sauvegardé sur Supabase</div>
                  <div>• Pratique lors de l'accès depuis un nouveau navigateur</div>
                  <div>• Synchronise instantanément les tableaux A4</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePullFromSupabase}
                disabled={isSyncingPull || !config.url}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-lg shadow-sky-950/40 disabled:opacity-50 cursor-pointer"
              >
                <CloudDownload className="w-4 h-4" />
                <span>{isSyncingPull ? 'Téléchargement en cours...' : 'Télécharger depuis Supabase'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STEP-BY-STEP USER GUIDE */}
      {activeSubTab === 'guide' && (
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Guide Rapide : Comment créer votre base Supabase en 3 minutes</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Suivez ces instructions pour héberger gratuitement et de manière permanente votre base de données hospitalière.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="text-xs font-bold text-white">Créer le projet</h4>
              <p className="text-[11.5px] text-slate-400 leading-relaxed">
                Rendez-vous sur <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-2.5 h-2.5" /></a> et créez un projet (gratuit). Choisissez la région la plus proche (ex: Frankfurt ou Paris).
              </p>
            </div>

            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="text-xs font-bold text-white">Exécuter le script SQL</h4>
              <p className="text-[11.5px] text-slate-400 leading-relaxed">
                Dans Supabase, ouvrez l'onglet <strong>SQL Editor</strong>, collez le contenu du générateur SQL (onglet ci-dessus) et cliquez sur <strong>Run</strong>. Les 3 tables et la sécurité RLS sont créées.
              </p>
            </div>

            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="text-xs font-bold text-white">Connecter &amp; Synchroniser</h4>
              <p className="text-[11.5px] text-slate-400 leading-relaxed">
                Allez dans <strong>Project Settings &gt; API</strong>, copiez l'URL et la clé <code>anon public</code> dans l'onglet <strong>Configuration</strong>, puis cliquez sur <strong>Envoyer vers Supabase</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
