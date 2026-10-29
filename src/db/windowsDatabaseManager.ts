/**
 * Gestionnaire d'intégrité de la base de données et synchronisation disque Windows
 * Établissement Hospitalier d'Aïn El Türck — Dr. Medjber Tami
 * 
 * Assure la triple persistance :
 * 1. LocalStorage + Clé miroir de secours
 * 2. IndexedDB persistant (haute capacité)
 * 3. Sauvegarde physique sur disque dur via l'exécutable natif Windows (/api/backup)
 */

import { ObjectBoxDatabaseSnapshot, createOctober2026Snapshot } from './objectboxEngine';

const IDB_NAME = 'EH_AinElTurck_HospitalDB_v1';
const IDB_STORE = 'database_snapshots';
const MIRROR_KEY = 'eh_ain_el_turck_objectbox_backup_mirror_v7';

// --- 1. PERSISTANCE INDEXEDDB ---
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB non disponible'));
    }
    const request = window.indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToIndexedDB(snapshot: ObjectBoxDatabaseSnapshot): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put({ key: 'active_snapshot', data: snapshot, savedAt: new Date().toISOString() });
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    });
  } catch {
    return false;
  }
}

export async function loadFromIndexedDB(): Promise<ObjectBoxDatabaseSnapshot | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get('active_snapshot');
      req.onsuccess = () => {
        db.close();
        if (req.result && req.result.data) {
          resolve(req.result.data as ObjectBoxDatabaseSnapshot);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

// --- 2. SYNCHRONISATION DISQUE PHYSIQUE WINDOWS ---
export async function syncWithWindowsLauncherDisk(snapshot: ObjectBoxDatabaseSnapshot): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    // Si l'application tourne via le lanceur natif Windows sur 127.0.0.1 ou localhost
    const isLocalhost =
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === 'localhost';

    if (!isLocalhost) return false;

    const res = await fetch('/api/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    });
    return res.ok;
  } catch {
    // Silencieux si hors contexte de l'exécutable
    return false;
  }
}

export async function fetchWindowsDiskBackup(): Promise<ObjectBoxDatabaseSnapshot | null> {
  if (typeof window === 'undefined') return null;
  try {
    const isLocalhost =
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === 'localhost';

    if (!isLocalhost) return null;

    const res = await fetch('/api/backup');
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.config && Array.isArray(data.staffBox)) {
      return data as ObjectBoxDatabaseSnapshot;
    }
    return null;
  } catch {
    return null;
  }
}

// --- 3. CLÉ MIROIR SYNCHRONE ---
export function saveMirrorBackup(snapshot: ObjectBoxDatabaseSnapshot): void {
  try {
    localStorage.setItem(MIRROR_KEY, JSON.stringify(snapshot));
  } catch {
    // ignore
  }
}

export function loadMirrorBackup(): ObjectBoxDatabaseSnapshot | null {
  try {
    const raw = localStorage.getItem(MIRROR_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.config && Array.isArray(parsed.staffBox)) {
        return parsed as ObjectBoxDatabaseSnapshot;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// --- 4. CONTRÔLE D'INTÉGRITÉ ET AUTO-RÉPARATION ---
export interface DatabaseIntegrityReport {
  isHealthy: boolean;
  staffCount: number;
  monthName: string;
  storageLayers: {
    localStorage: boolean;
    mirrorKey: boolean;
    indexedDbAvailable: boolean;
    windowsDiskAvailable: boolean;
  };
  repairedIssues: string[];
}

export function auditAndRepairSnapshot(
  snapshot: ObjectBoxDatabaseSnapshot
): { snapshot: ObjectBoxDatabaseSnapshot; report: DatabaseIntegrityReport } {
  const repairedIssues: string[] = [];
  let s = { ...snapshot };

  if (!s.config) {
    const baseline = createOctober2026Snapshot();
    s.config = baseline.config;
    repairedIssues.push('Configuration principale rétablie aux normes hospitalières');
  }

  if (!Array.isArray(s.staffBox) || s.staffBox.length === 0) {
    const baseline = createOctober2026Snapshot();
    s.staffBox = baseline.staffBox;
    repairedIssues.push("Liste du personnel restaurée depuis l'état officiel (34 agents)");
  }

  // Vérifier et réparer chaque agent
  const validStaff = s.staffBox.map((staff, idx) => {
    let modified = false;
    const item = { ...staff };

    if (!item.id || item.id <= 0) {
      item.id = idx + 1;
      modified = true;
    }
    if (!item.fullName || !item.fullName.trim()) {
      item.fullName = `Agent Hospitalier #${item.id}`;
      modified = true;
    }
    if (!item.category) {
      item.category = 'paramedical_day';
      modified = true;
    }
    if (!item.dailyActivity || typeof item.dailyActivity !== 'object') {
      item.dailyActivity = {};
      modified = true;
    }
    if (modified) {
      repairedIssues.push(`Propriétés requises régénérées pour ${item.fullName}`);
    }
    return item;
  });

  s.staffBox = validStaff;

  // Contrôle des couches de stockage
  let lsOk = false;
  try {
    localStorage.setItem('__health_test__', '1');
    localStorage.removeItem('__health_test__');
    lsOk = true;
  } catch {
    lsOk = false;
  }

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost');

  const report: DatabaseIntegrityReport = {
    isHealthy: repairedIssues.length === 0,
    staffCount: s.staffBox.length,
    monthName: s.config.guardMonthName || 'Octobre 2026',
    storageLayers: {
      localStorage: lsOk,
      mirrorKey: typeof localStorage !== 'undefined' && !!localStorage.getItem(MIRROR_KEY),
      indexedDbAvailable: typeof window !== 'undefined' && !!window.indexedDB,
      windowsDiskAvailable: isLocalhost,
    },
    repairedIssues,
  };

  return { snapshot: s, report };
}
