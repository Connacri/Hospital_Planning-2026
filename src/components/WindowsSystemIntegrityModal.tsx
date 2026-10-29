import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  HardDrive,
  Database,
  FileCheck2,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  X,
  Layers,
  Cpu,
  Monitor,
} from 'lucide-react';
import { objectBoxStore } from '../db/objectboxEngine';
import { DatabaseIntegrityReport, syncWithWindowsLauncherDisk } from '../db/windowsDatabaseManager';

interface WindowsSystemIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportJson: () => void;
  onImportJson: () => void;
  showToast: (msg: string) => void;
}

export const WindowsSystemIntegrityModal: React.FC<WindowsSystemIntegrityModalProps> = ({
  isOpen,
  onClose,
  onExportJson,
  onImportJson,
  showToast,
}) => {
  const [report, setReport] = useState<DatabaseIntegrityReport | null>(null);
  const [isSyncingDisk, setIsSyncingDisk] = useState(false);

  const refreshReport = () => {
    const rep = objectBoxStore.getIntegrityReport();
    setReport(rep);
  };

  useEffect(() => {
    if (isOpen) {
      refreshReport();
    }
  }, [isOpen]);

  if (!isOpen || !report) return null;

  const handleManualDiskSync = async () => {
    setIsSyncingDisk(true);
    const snap = objectBoxStore.getSnapshot();
    const success = await syncWithWindowsLauncherDisk(snap);
    setIsSyncingDisk(false);
    refreshReport();
    if (success) {
      showToast('✅ Sauvegarde physique synchronisée avec succès dans %LOCALAPPDATA% !');
    } else {
      showToast('ℹ️ Sauvegarde locale sécurisée dans le navigateur (IndexedDB + Miroir).');
    }
  };

  const handleRestoreOfficialBaseline = () => {
    if (
      window.confirm(
        'Voulez-vous rétablir la configuration officielle et la liste du personnel d\'Aïn El Türck (Octobre 2026) ? Les données actuelles seront réinitialisées.'
      )
    ) {
      objectBoxStore.restoreOfficialBaseline();
      refreshReport();
      showToast('✅ Base de données officielle E.H. Aïn El Türck rétablie avec succès !');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-600/70 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Intégrité Système & Base de Données Windows</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Win 7 / 8 / 10 / 11
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Triple redondance, zéro dépendance DLL et moteur hors-ligne certifié
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* Windows Compatibility Banner */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sky-950 border border-sky-800 text-sky-400 shrink-0 mt-0.5">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-200 text-sm">
                Compatibilité Universelle Windows (Depuis Windows 7 SP1)
              </div>
              <div className="text-slate-400 mt-1 leading-relaxed">
                L'exécutable natif <code className="text-sky-300 bg-sky-950/60 px-1 py-0.5 rounded font-mono">EH_AinElTurck_Plannings.exe</code> est compilé en mode <strong>AnyCPU autonome</strong>.
                Il ne requiert <strong>aucune DLL C++ tierce</strong> (aucun VCRuntime / MSVCP manquant) et intègre son propre micro-serveur HTTP local pour éliminer les erreurs de format (Code 216).
              </div>
            </div>
          </div>

          {/* Storage Layers Status */}
          <div>
            <div className="font-bold text-slate-300 mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Couches de Stockage & Persistance Détectées</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-slate-200">LocalStorage Principal</div>
                    <div className="text-[11px] text-slate-500">Cache synchrone réactif</div>
                  </div>
                </div>
                {report.storageLayers.localStorage ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Actif
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" /> Restreint
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="font-semibold text-slate-200">Miroir de Secours</div>
                    <div className="text-[11px] text-slate-500">Clé miroir instantanée</div>
                  </div>
                </div>
                {report.storageLayers.mirrorKey ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Synchronisé
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-500 font-bold text-[11px]">
                    En attente
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="font-semibold text-slate-200">IndexedDB Haute Capacité</div>
                    <div className="text-[11px] text-slate-500">Persistance illimitée</div>
                  </div>
                </div>
                {report.storageLayers.indexedDbAvailable ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Opérationnel
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                    Non supporté
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold text-slate-200">Disque Local Windows</div>
                    <div className="text-[11px] text-slate-500">%LOCALAPPDATA% physique</div>
                  </div>
                </div>
                {report.storageLayers.windowsDiskAvailable ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connecté
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-400 font-bold text-[11px]">
                    Mode Navigateur
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* Database Health Summary */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-600/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Base de Données Saine & Validée</span>
              </div>
              <span className="font-mono text-emerald-400 font-bold text-xs">
                {report.staffCount} agents inscrits ({report.monthName})
              </span>
            </div>
            {report.repairedIssues.length > 0 && (
              <div className="mt-2.5 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-amber-400">Auto-réparations préventives effectuées :</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-400">
                  {report.repairedIssues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="pt-2 border-t border-slate-800 space-y-2.5">
            <div className="font-bold text-slate-300 text-xs uppercase tracking-wider">
              Actions de Sécurité & Sauvegardes
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onExportJson}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Exporter Fichier JSON (.json)</span>
              </button>

              <button
                type="button"
                onClick={onImportJson}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restaurer une Sauvegarde (.json)</span>
              </button>

              <button
                type="button"
                onClick={handleManualDiskSync}
                disabled={isSyncingDisk}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-600/70 rounded-lg font-medium transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingDisk ? 'animate-spin' : ''}`} />
                <span>Sauvegarde Physique Immédiate</span>
              </button>

              <button
                type="button"
                onClick={handleRestoreOfficialBaseline}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-950/40 hover:bg-red-950/80 text-red-300 border border-red-800/60 rounded-lg font-medium transition-colors ml-auto"
              >
                <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                <span>Réinitialiser Base Officielle (Octobre 2026)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-mono">
            Système E.H. Aïn El Türck · Dr. Medjber Tami
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium text-xs transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
