import React, { useState } from 'react';
import {
  X,
  Archive,
  Save,
  RotateCcw,
  Calendar,
  Copy,
  Trash2,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  HospitalDocumentConfig,
  StaffEntity,
} from '../db/objectboxEngine';

export interface MonthlyArchiveRecord {
  id: string;
  name: string;
  createdAt: string;
  monthName: string;
  config: HospitalDocumentConfig;
  staffList: StaffEntity[];
}

interface MonthlyArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: HospitalDocumentConfig;
  currentStaffList: StaffEntity[];
  onLoadArchive: (archive: MonthlyArchiveRecord) => void;
  onDuplicateNextMonth: (nextMonthName: string) => void;
}

const ARCHIVES_STORAGE_KEY = 'eh_ain_el_turck_monthly_archives';

export const MonthlyArchiveModal: React.FC<MonthlyArchiveModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  currentStaffList,
  onLoadArchive,
  onDuplicateNextMonth,
}) => {
  const [archives, setArchives] = useState<MonthlyArchiveRecord[]>(() => {
    try {
      const saved = localStorage.getItem(ARCHIVES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [archiveName, setArchiveName] = useState(
    currentConfig.guardMonthName || "Mois d'Octobre 2026"
  );
  const [nextMonthInput, setNextMonthInput] = useState("Novembre 2026");

  const saveArchives = (updated: MonthlyArchiveRecord[]) => {
    setArchives(updated);
    try {
      localStorage.setItem(ARCHIVES_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save archives', err);
    }
  };

  const handleSaveCurrentArchive = () => {
    const newRecord: MonthlyArchiveRecord = {
      id: `archive_${Date.now()}`,
      name: archiveName.trim() || `Archive ${new Date().toLocaleDateString('fr-FR')}`,
      createdAt: new Date().toLocaleString('fr-FR'),
      monthName: currentConfig.guardMonthName || archiveName,
      config: JSON.parse(JSON.stringify(currentConfig)),
      staffList: JSON.parse(JSON.stringify(currentStaffList)),
    };

    const updated = [newRecord, ...archives];
    saveArchives(updated);
    setArchiveName('');
  };

  const handleDeleteArchive = (id: string) => {
    const updated = archives.filter((a) => a.id !== id);
    saveArchives(updated);
  };

  const handleApplyNextMonth = () => {
    if (nextMonthInput.trim()) {
      onDuplicateNextMonth(nextMonthInput.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Archives Mensuelles & Duplication</span>
              </h2>
              <p className="text-xs text-slate-400">
                Sauvegarde de versions et passage automatique au mois suivant
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Section 1 : Dupliquer vers le mois suivant */}
          <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-800/60 space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Dupliquer vers le mois suivant (avec rotation)</span>
            </div>
            <p className="text-xs text-slate-300">
              Crée un nouveau planning pour le mois suivant en appliquant automatiquement la rotation des groupes de garde (A, B, C, D, E) et en mettant à jour les en-têtes.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nextMonthInput}
                onChange={(e) => setNextMonthInput(e.target.value)}
                placeholder="Ex. Novembre 2026"
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white flex-1 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleApplyNextMonth}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-colors"
              >
                <span>Appliquer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section 2 : Sauvegarder l'état actuel */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Archiver la version actuelle</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={archiveName}
                onChange={(e) => setArchiveName(e.target.value)}
                placeholder="Nom de l'archive (ex. Octobre 2026 - Version Finale)"
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white flex-1 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleSaveCurrentArchive}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Archiver</span>
              </button>
            </div>
          </div>

          {/* Section 3 : Liste des archives */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Versions archivées ({archives.length})</span>
            </h3>

            {archives.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                Aucune archive enregistrée pour l'instant.
              </div>
            ) : (
              <div className="space-y-2">
                {archives.map((arch) => (
                  <div
                    key={arch.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">
                          {arch.name}
                        </h4>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{arch.monthName}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {arch.createdAt}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onLoadArchive(arch);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 text-xs font-semibold transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurer</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteArchive(arch.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
