import React, { useState, useMemo } from 'react';
import {
  Calendar,
  X,
  Sparkles,
  Shield,
  Check,
  Sun,
  AlertTriangle,
} from 'lucide-react';
import {
  FRENCH_MONTH_NAMES,
  GUARD_TEAM_THEMES,
  DEFAULT_GUARD_ROTATION_ORDER,
  getTeamBadgeClass,
} from '../db/objectboxEngine';

interface CreateMonthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonthName: string;
  onSelectMonth: (year: number, monthIndex: number, isModificatif?: boolean) => void;
}

export const CreateMonthModal: React.FC<CreateMonthModalProps> = ({
  isOpen,
  onClose,
  currentMonthName,
  onSelectMonth,
}) => {
  // Parse currently active month or default to 2026 / Octobre (9)
  const initialYear = useMemo(() => {
    const match = currentMonthName.match(/\d{4}/);
    return match ? parseInt(match[0], 10) : 2026;
  }, [currentMonthName]);

  const initialMonthIdx = useMemo(() => {
    const found = FRENCH_MONTH_NAMES.findIndex((m: string) =>
      currentMonthName.toLowerCase().includes(m.toLowerCase())
    );
    return found !== -1 ? found : 9; // 9 = Octobre
  }, [currentMonthName]);

  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(initialMonthIdx);
  const [isModificatif, setIsModificatif] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<'discard' | 'create' | null>(null);

  const isDirty = useMemo(() => {
    return selectedYear !== initialYear || selectedMonthIdx !== initialMonthIdx || isModificatif;
  }, [selectedYear, selectedMonthIdx, isModificatif, initialYear, initialMonthIdx]);

  // Calculate live preview metrics for the selected month
  const preview = useMemo(() => {
    const daysInMonth = new Date(Date.UTC(selectedYear, selectedMonthIdx + 1, 0)).getUTCDate();
    const firstDayDate = new Date(Date.UTC(selectedYear, selectedMonthIdx, 1));
    const firstDayDowIdx = firstDayDate.getUTCDay();
    const DOW_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const firstDayLabel = DOW_LABELS[firstDayDowIdx];

    // Reference base: 1 Octobre 2026 (daysDiff = 0)
    const baseTime = Date.UTC(2026, 9, 1);
    const targetFirstDayTime = Date.UTC(selectedYear, selectedMonthIdx, 1);
    const daysDiffFromBase = Math.round((targetFirstDayTime - baseTime) / 86400000);

    const order = DEFAULT_GUARD_ROTATION_ORDER;
    const teamJourIdx = (daysDiffFromBase % 5 + 5) % 5;
    const teamJour = order[teamJourIdx] || 'A';
    const teamNuitIdx = ((daysDiffFromBase - 1) % 5 + 5) % 5;
    const teamNuit = order[teamNuitIdx] || 'C';

    return {
      daysCount: daysInMonth,
      firstDayLabel,
      teamJour,
      teamNuit,
      monthName: `${FRENCH_MONTH_NAMES[selectedMonthIdx]} ${selectedYear}`,
    };
  }, [selectedYear, selectedMonthIdx]);

  if (!isOpen) return null;

  const handleRequestClose = () => {
    if (isDirty) {
      setConfirmDialog('discard');
    } else {
      onClose();
    }
  };

  const handleConfirmCreate = () => {
    onSelectMonth(selectedYear, selectedMonthIdx, isModificatif);
    setConfirmDialog(null);
    onClose();
  };

  const yearsList = [2025, 2026, 2027, 2028, 2029, 2030];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={handleRequestClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-0 sm:my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Créer ou Sélectionner un Mois de Planning</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Roulement Perpétuel
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Garantit la continuité mathématique des gardes 16h (Jour, Nuit, RE).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Quick Actions Shortcuts */}
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Raccourcis Fréquents :
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedYear(2026);
                  setSelectedMonthIdx(9);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedYear === 2026 && selectedMonthIdx === 9
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs">
                    Octobre 2026 (Mois Officiel Actuel)
                  </div>
                  {selectedYear === 2026 && selectedMonthIdx === 9 && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Recharge ou crée le mois d'Octobre 2026 officiel.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const nextMonthIdx = (selectedMonthIdx + 1) % 12;
                  const nextYear = selectedMonthIdx === 11 ? selectedYear + 1 : selectedYear;
                  setSelectedYear(nextYear);
                  setSelectedMonthIdx(nextMonthIdx);
                }}
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-indigo-900 text-xs group-hover:text-indigo-600">
                    Mois Suivant (+1 mois)
                  </div>
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Enchaîne sur {FRENCH_MONTH_NAMES[(selectedMonthIdx + 1) % 12]} {selectedMonthIdx === 11 ? selectedYear + 1 : selectedYear} en continuité.
                </div>
              </button>
            </div>
          </div>

          {/* Year and Month Pickers */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                1. Sélectionner l'Année :
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {yearsList.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setSelectedYear(y)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all text-center min-h-[38px] ${
                      selectedYear === y
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                2. Sélectionner le Mois :
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {FRENCH_MONTH_NAMES.map((m: string, idx: number) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMonthIdx(idx)}
                    className={`p-2.5 rounded-xl border text-left transition-all min-h-[42px] ${
                      selectedMonthIdx === idx
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-medium'
                    }`}
                  >
                    <div className="text-xs">{m}</div>
                    <div className={`text-[10px] mt-0.5 ${selectedMonthIdx === idx ? 'text-indigo-200' : 'text-slate-400'}`}>
                      Mois {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Continuity Preview Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Continuité Automatique pour {preview.monthName} :</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-mono">
                {preview.daysCount} jours
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500">1er jour du mois</span>
                <span className="font-bold text-slate-900 mt-1">{preview.firstDayLabel}</span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500">Garde Jour (Jour 1)</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold ${
                      getTeamBadgeClass(preview.teamJour)
                    }`}
                  >
                    {preview.teamJour}
                  </span>
                  <span className="font-bold text-slate-900">Groupe {preview.teamJour}</span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500">Garde Nuit (Jour 1)</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold ${
                      getTeamBadgeClass(preview.teamNuit)
                    }`}
                  >
                    {preview.teamNuit}
                  </span>
                  <span className="font-bold text-slate-900">Groupe {preview.teamNuit}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-600 leading-relaxed">
              <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Continuité perpétuelle garantie :</strong> Le roulement des 5 équipes
                (A &rarr; D &rarr; B &rarr; E &rarr; C) avec <strong>Jour</strong>, <strong>Nuit</strong> et <strong>RE</strong> s'enchaîne mathématiquement sans rupture.
              </span>
            </div>
          </div>

          {/* Option Planning Modificatif */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-500/20 text-amber-800 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <label htmlFor="is-modif-toggle" className="text-xs font-bold text-slate-900 cursor-pointer">
                  Créer en version « (Modificatif) »
                </label>
                <p className="text-[11px] text-slate-600">
                  Ajoute la mention (Modificatif) en gras sur les 7 tableaux officiels.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                id="is-modif-toggle"
                type="checkbox"
                checked={isModificatif}
                onChange={(e) => setIsModificatif(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 sm:px-6 py-3.5 sm:py-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={handleRequestClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition-colors min-h-[38px] flex items-center justify-center"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => setConfirmDialog('create')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-colors min-h-[38px]"
          >
            <Check className="w-4 h-4" />
            <span>Générer et Appliquer {preview.monthName}</span>
          </button>
        </div>
      </div>

      {/* Mandatory confirmation popup */}
      {confirmDialog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  confirmDialog === 'discard'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {confirmDialog === 'discard' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {confirmDialog === 'discard'
                    ? 'Quitter sans créer le mois ?'
                    : `Confirmer la création de ${preview.monthName} ?`}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {confirmDialog === 'discard'
                    ? 'Vous avez sélectionné une nouvelle période qui n\'a pas encore été générée.'
                    : `Voulez-vous initialiser le planning pour ${preview.monthName} (${preview.daysCount} jours) ? La continuité des équipes de garde sera appliquée.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg min-h-[36px]"
              >
                {confirmDialog === 'discard' ? 'Continuer' : 'Annuler'}
              </button>
              {confirmDialog === 'discard' ? (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDialog(null);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg min-h-[36px]"
                >
                  Ignorer et Fermer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmCreate}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg min-h-[36px]"
                >
                  Confirmer et Créer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
