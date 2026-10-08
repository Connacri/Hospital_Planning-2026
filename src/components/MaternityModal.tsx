import React, { useState, useEffect } from 'react';
import { HeartHandshake, X, Calendar, Check, Trash2, Info, AlertTriangle } from 'lucide-react';
import { StaffEntity, DayColumnMeta } from '../db/objectboxEngine';

interface MaternityModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffEntity[];
  initialStaffId?: number;
  targetStaff?: StaffEntity | null;
  daysColumns?: DayColumnMeta[];
  daysInMonth?: number;
  onApplyMaternityLeave: (
    staffId: number,
    startDay: number,
    endDay: number,
    datesText: string,
    label: string
  ) => void;
  onRemoveMaternityLeave: (staffId: number) => void;
}

export const MaternityModal: React.FC<MaternityModalProps> = ({
  isOpen,
  onClose,
  staffList,
  initialStaffId,
  targetStaff,
  daysColumns,
  daysInMonth = 31,
  onApplyMaternityLeave,
  onRemoveMaternityLeave,
}) => {
  const actualDaysCount = daysColumns?.length || daysInMonth;

  const eligibleStaff = staffList.filter(
    (s) => s.category === 'paramedical_guard' || s.category === 'paramedical_day'
  );

  const defaultStaffId =
    targetStaff?.id ||
    initialStaffId ||
    eligibleStaff.find((s) => s.fullName.toLowerCase().includes('bakhouche'))?.id ||
    eligibleStaff[0]?.id ||
    1;

  const [selectedStaffId, setSelectedStaffId] = useState<number>(defaultStaffId);

  useEffect(() => {
    if (targetStaff?.id) {
      setSelectedStaffId(targetStaff.id);
    } else if (initialStaffId) {
      setSelectedStaffId(initialStaffId);
    }
  }, [targetStaff, initialStaffId]);
  const [startDay, setStartDay] = useState<number | string>(1);
  const [endDay, setEndDay] = useState<number | string>(26);
  const [label, setLabel] = useState<string>('CONGÉ DE MATERNITÉ');
  const [datesText, setDatesText] = useState<string>('du 01/10/2026 au 26/10/2026');
  const [confirmAction, setConfirmAction] = useState<'apply' | 'remove' | 'cancel' | null>(null);

  const currentStaff = staffList.find((s) => s.id === selectedStaffId);

  useEffect(() => {
    if (initialStaffId) {
      setSelectedStaffId(initialStaffId);
    }
  }, [initialStaffId]);

  useEffect(() => {
    if (!currentStaff) return;
    if (currentStaff.maternityLeave) {
      setStartDay(currentStaff.maternityLeave.startDay);
      setEndDay(Math.min(currentStaff.maternityLeave.endDay, actualDaysCount));
      setLabel(currentStaff.maternityLeave.label || 'CONGÉ DE MATERNITÉ');
      setDatesText(currentStaff.maternityLeave.datesText || '');
    } else {
      setStartDay(1);
      setEndDay(Math.min(26, actualDaysCount));
      setLabel('CONGÉ DE MATERNITÉ');
      setDatesText(`du 01/10/2026 au ${String(Math.min(26, actualDaysCount)).padStart(2, '0')}/10/2026`);
    }
  }, [selectedStaffId, currentStaff, actualDaysCount]);

  if (!isOpen) return null;

  const generatedObs = `CONGÉ de MATERNITÉ. ${datesText.trim()}`;

  const handleApplyConfirmed = () => {
    if (!currentStaff) return;
    onApplyMaternityLeave(
      currentStaff.id,
      Number(startDay),
      Number(endDay),
      datesText.trim(),
      label.trim()
    );
    setConfirmAction(null);
    onClose();
  };

  const handleRemoveConfirmed = () => {
    if (!currentStaff) return;
    onRemoveMaternityLeave(currentStaff.id);
    setConfirmAction(null);
    onClose();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStaff) return;
    setConfirmAction('apply');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 font-sans animate-in fade-in duration-150">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] sm:max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-700 via-pink-700 to-rose-800 text-white px-4 sm:px-5 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white/15 rounded-xl shrink-0">
              <HeartHandshake className="w-5 h-5 text-pink-200" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight">
                Gestion du Congé de Maternité
              </h3>
              <p className="text-[11px] sm:text-xs text-pink-100">
                Cellule fusionnée dans le tableau d'activité &amp; mention conforme
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la modal"
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 space-y-4 text-sm text-slate-800 overflow-y-auto flex-1">
          {/* Target Staff Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Agent / Employée concernée
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(Number(e.target.value))}
              className="w-full px-3 py-2.5 sm:py-2 border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 text-xs sm:text-sm min-h-[42px]"
            >
              {eligibleStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.rolePortrait || s.gradeLandscape}) — {s.teamGroup ? `Groupe ${s.teamGroup}` : s.horaireBlock}
                </option>
              ))}
            </select>
          </div>

          {/* Preset Helper */}
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
            <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 leading-relaxed">
              <strong>Règle conforme du service :</strong> Pour les agents en congé de maternité, les jours couverts sont fusionnés en une seule cellule horizontale grise avec le texte centré.
            </div>
          </div>

          {/* Days Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jour Début (1 à {daysInMonth})
              </label>
              <input
                type="number"
                min={1}
                max={daysInMonth}
                value={startDay}
                onChange={(e) => setStartDay(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jour Fin (1 à {daysInMonth})
              </label>
              <input
                type="number"
                min={1}
                max={daysInMonth}
                value={endDay}
                onChange={(e) => setEndDay(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>
          </div>

          {/* Custom Label */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Libellé affiché dans la fusion (Tableau Paysage)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="CONGÉ DE MATERNITÉ"
              required
            />
          </div>

          {/* Dates Mention for Portrait Observation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mention des dates (pour l'Observation Portrait)
            </label>
            <input
              type="text"
              value={datesText}
              onChange={(e) => setDatesText(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="du 01/10/2026 au 26/10/2026"
            />
          </div>

          {/* Live Preview */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-600" />
              <span>Aperçu de la fusion :</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Tableau d'Activité :</span>
              <span className="bg-slate-300 text-black px-2 py-0.5 rounded font-bold text-[10px] tracking-wider uppercase">
                {label} (Jour {startDay} → {endDay})
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-600">Observation Portrait :</span>
              <span className="font-mono text-[11px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-300 truncate max-w-full">
                {generatedObs}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-200 shrink-0">
            {currentStaff?.maternityLeave ? (
              <button
                type="button"
                onClick={() => setConfirmAction('remove')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-2 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors min-h-[42px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer le congé</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 sm:py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[42px] flex items-center justify-center"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 shadow-md transition-colors min-h-[42px]"
              >
                <Check className="w-4 h-4" />
                <span>Appliquer la fusion</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {confirmAction === 'apply'
                    ? 'Confirmer le congé de maternité ?'
                    : 'Confirmer la suppression du congé ?'}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {confirmAction === 'apply'
                    ? `Les jours ${startDay} à ${endDay} de ${currentStaff?.fullName} seront fusionnés en congé de maternité.`
                    : `La fusion de cellule pour ${currentStaff?.fullName} sera retirée et le planning restauré.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg min-h-[38px]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmAction === 'apply' ? handleApplyConfirmed : handleRemoveConfirmed}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm min-h-[38px]"
              >
                Confirmer l'opération
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
