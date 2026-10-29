/**
 * Helper de synchronisation automatique avec Supabase (PostgreSQL)
 * Établissement Hospitalier d'Aïn El Türck - Dr. Medjber Tami
 * Permet la sauvegarde transparente de tout mois ouvert en local et sur le Cloud Supabase.
 */

import { ObjectBoxDatabaseSnapshot } from '../db/objectboxEngine';

export const STORAGE_KEY_SUPABASE = 'eh_ain_el_turck_supabase_config_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableNameConfig: string;
  tableNameStaff: string;
  tableNameSnapshots: string;
  autoSync: boolean;
  lastSyncedAt: string | null;
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta.env?.VITE_SUPABASE_URL as string) || 'https://vjwmocxrqxdybaijhsuo.supabase.co';
  const envAnon =
    (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) ||
    (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
    (import.meta.env?.VITE_SUPABASE_PUBLISH_KEY as string) ||
    '';

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPABASE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.url && envUrl) parsed.url = envUrl;
      if (!parsed.anonKey && envAnon) parsed.anonKey = envAnon;
      return parsed;
    }
  } catch {
    // ignore
  }
  return {
    url: envUrl,
    anonKey: envAnon,
    tableNameConfig: 'hospital_config',
    tableNameStaff: 'staff_members',
    tableNameSnapshots: 'objectbox_sync_snapshots',
    autoSync: false,
    lastSyncedAt: null,
  };
}

export function isSupabaseConfigured(): boolean {
  const cfg = getSupabaseConfig();
  return Boolean(cfg.url && cfg.url.trim() && cfg.anonKey && cfg.anonKey.trim());
}

/**
 * Sauvegarde le snapshot complet du mois actif dans Supabase si la configuration existe.
 * Ne bloque jamais l'application en cas d'échec réseau ou configuration manquante.
 */
export async function syncActiveMonthToSupabase(
  snapshot: ObjectBoxDatabaseSnapshot
): Promise<{ success: boolean; message: string; configured: boolean }> {
  const cfg = getSupabaseConfig();
  if (!cfg.url || !cfg.anonKey) {
    return {
      success: true,
      configured: false,
      message: 'Sauvegardé localement (IndexedDB/LocalStorage). Configurez Supabase pour la synchronisation Cloud.',
    };
  }

  const cleanUrl = cfg.url.trim().replace(/\/+$/, '');
  const headers = {
    apikey: cfg.anonKey.trim(),
    Authorization: `Bearer ${cfg.anonKey.trim()}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates',
  };

  const monthName = snapshot.config.guardMonthName || 'Mois Hospitalier';

  try {
    // 1. Envoyer le snapshot dans la table d'archives/snapshots
    const snapPayload = {
      snapshot_data: snapshot,
      version: snapshot.version || 7,
      month_name: monthName,
      staff_count: snapshot.staffBox?.length || 0,
      updated_at: new Date().toISOString(),
    };

    const snapRes = await fetch(
      `${cleanUrl}/rest/v1/${cfg.tableNameSnapshots || 'objectbox_sync_snapshots'}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(snapPayload),
      }
    );

    // 2. Mettre à jour la configuration courante singleton
    const configPayload = {
      id: 1,
      republic_header: snapshot.config.republicHeader,
      ministry_header: snapshot.config.ministryHeader,
      hospital_header: snapshot.config.hospitalHeader,
      unit_title: snapshot.config.unitTitle,
      guard_month_name: snapshot.config.guardMonthName || 'Octobre 2026',
      guard_month_offset_days: snapshot.config.guardMonthOffsetDays || 0,
      is_modificatif: !!snapshot.config.isModificatif,
      city_date_portrait: snapshot.config.cityDatePortrait,
      city_date_landscape: snapshot.config.cityDateLandscape,
      signatures_portrait: snapshot.config.signaturesPortrait,
      signatures_landscape: snapshot.config.signaturesLandscape,
      legend_items: snapshot.config.legendItems,
      leave_types: snapshot.config.leaveTypes,
      days_columns: snapshot.config.daysColumns,
      modificatif_overrides: snapshot.config.modificatifOverrides || {},
      updated_at: new Date().toISOString(),
    };

    await fetch(`${cleanUrl}/rest/v1/${cfg.tableNameConfig || 'hospital_config'}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(configPayload),
    });

    const nowStr = new Date().toLocaleString('fr-FR');
    try {
      const updatedCfg = { ...cfg, lastSyncedAt: nowStr };
      localStorage.setItem(STORAGE_KEY_SUPABASE, JSON.stringify(updatedCfg));
    } catch {
      // ignore
    }

    return {
      success: true,
      configured: true,
      message: `✅ « ${monthName} » sauvegardé localement et synchronisé sur Supabase (${nowStr}) !`,
    };
  } catch (err: any) {
    console.warn('[Supabase Sync Warning]', err);
    return {
      success: false,
      configured: true,
      message: `Sauvegardé localement. Avertissement Supabase : ${err.message || 'Problème de connexion'}`,
    };
  }
}
