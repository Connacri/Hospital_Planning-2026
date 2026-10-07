import React, { useState } from 'react';
import { X, Calendar, HeartHandshake, Check, Trash2, Info } from 'lucide-react';
import { StaffEntity, DayColumnMeta } from '../db/objectboxEngine';

interface MaternityModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffEntity[];
  daysColumns: DayColumnMeta[];
  targetStaff?: StaffEntity | null;
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
  daysColumns,
  targetStaff,
  onApplyMaternityLeave,
  onRemoveMaternityLeave,
}) => {
  const eligibleStaff = staffList.filter(
    (s) => s.category === 'paramedical_guard' || s.category === 'paramedical_day' || s.category === 'medical'
  );

  const defaultSelectedId = targetStaff?.id ?? eligibleStaff.find((s) => s.fullName.toLowerCase().includes('bakhouche'))?.id ?? eligibleStaff[0]?.id ?? 0;
  const [selectedStaffId, setSelectedStaffId] = useState<number>(defaultSelectedId);

  React.useEffect(() => {
    if (targetStaff) {
      setSelectedStaffId(targetStaff.id);
    }
  }, [targetStaff]);

  const currentStaff = staffList.find((s) => s.id === selectedStaffId) || targetStaff || eligibleStaff[0];

  const maxDay = daysColumns.length > 0 ? daysColumns[daysColumns.length - 1].day : 30;

  const [startDay, setStartDay] = useState<number>(currentStaff?.maternityLeave?.startDay ?? 1);
  const [endDay, setEndDay] = useState<number>(currentStaff?.maternityLeave?.endDay ?? 26);
  const [datesText, setDatesText] = useState<string>(
    currentStaff?.maternityLeave?.datesText ?? '25/11/2025 au 26/04/2026'
  );
  const [label, setLabel] = useState<string>(
    currentStaff?.maternityLeave?.label ?? 'Congé de Maternité'
  );

  // Sync state if staff changes
  React.useEffect(() => {
    if (currentStaff) {
      if (currentStaff.maternityLeave) {
        setStartDay(currentStaff.maternityLeave.startDay);
        setEndDay(currentStaff.maternityLeave.endDay);
        setDatesText(currentStaff.maternityLeave.datesText || '25/11/2025 au 26/04/2026');
        setLabel(currentStaff.maternityLeave.label || 'Congé de Maternité');
      } else if (currentStaff.fullName.toLowerCase().includes('bakhouche')) {
        setStartDay(1);
        setEndDay(Math.min(26, maxDay));
        setDatesText('25/11/2025 au 26/04/2026');
        setLabel('Congé de Maternité');
      }
    }
  }, [selectedStaffId, currentStaff, maxDay]);

  if (!isOpen) return null;

  const generatedObs = `CONGÉ de MATERNITÉ. ${datesText.trim()}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStaff) return;
    onApplyMaternityLeave(currentStaff.id, Number(startDay), Number(endDay), datesText.trim(), label.trim());
    onClose();
  };

  const handleRemove = () => {
    if (!currentStaff) return;
    onRemoveMaternityLeave(currentStaff.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-700 via-pink-700 to-rose-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white/15 rounded-xl">
              <HeartHandshake className="w-5 h-5 text-pink-200" />
            </span>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Gestion du Congé de Maternité (Cellule Fusionnée)
              </h3>
              <p className="text-xs text-pink-100">
                Fusion horizontale dans le tableau d'activité &amp; mention conforme dans le planning
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-sm text-slate-800">
          {/* Target Staff Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Agent / Employée concernée
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {eligibleStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.rolePortrait || s.gradeLandscape}) — {s.teamGroup ? `Groupe ${s.teamGroup}` : s.horaireBlock}
                </option>
              ))}
            </select>
          </div>

          {/* Quick preset for Bakhouche Sarra */}
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
            <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-950 flex-1">
              <div className="font-semibold text-rose-900">
                Modèle officiel du PDF (Bakhouche Sarra) :
              </div>
              <div>
                Période : <strong>25/11/2025 au 26/04/2026</strong> (Jours 1 à 26 fusionnés en Avril).
              </div>
              <button
                type="button"
                onClick={() => {
                  setStartDay(1);
                  setEndDay(Math.min(26, maxDay));
                  setDatesText('25/11/2025 au 26/04/2026');
                  setLabel('Congé de Maternité');
                }}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-900 underline"
              >
                Appliquer ces dates par défaut
              </button>
            </div>
          </div>

          {/* Date range in this month */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jour début dans le mois
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Jour</span>
                <input
                  type="number"
                  min={1}
                  max={maxDay}
                  value={startDay}
                  onChange={(e) => setStartDay(Math.max(1, Math.min(maxDay, Number(e.target.value))))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jour fin dans le mois
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Jour</span>
                <input
                  type="number"
                  min={1}
                  max={maxDay}
                  value={endDay}
                  onChange={(e) => setEndDay(Math.max(1, Math.min(maxDay, Number(e.target.value))))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Text interval for official OBS */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dates officielles du congé (du ... au ...)
            </label>
            <input
              type="text"
              value={datesText}
              onChange={(e) => setDatesText(e.target.value)}
              placeholder="ex: 25/11/2025 au 26/04/2026"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Label in merged cell */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Libellé de la cellule fusionnée (Tableau d'activité)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Congé de Maternité"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Preview */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Aperçu du rendu conforme au PDF
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600">Tableau d'activité (Paysage) :</span>
              <span className="font-bold text-rose-950 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                Cellule fusionnée de J{startDay} à J{endDay} ({endDay - startDay + 1} jours) : « {label} »
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600">Planning Paramédical (Portrait) :</span>
              <span className="font-mono text-[11px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-300 truncate max-w-[280px]">
                {generatedObs}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            {currentStaff?.maternityLeave ? (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer le congé</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 shadow-md transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Appliquer la fusion de cellule</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
