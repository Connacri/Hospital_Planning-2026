import React, { useEffect, useState } from 'react';
import { CalendarOff, X, Check, Trash2 } from 'lucide-react';
import { DayColumnMeta } from '../db/objectboxEngine';

interface HolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysColumns: DayColumnMeta[];
  onSetHolidays: (days: number[], holiday: boolean) => void;
  onClearHolidays: () => void;
}

export const HolidayModal: React.FC<HolidayModalProps> = ({
  isOpen,
  onClose,
  daysColumns,
  onSetHolidays,
  onClearHolidays,
}) => {
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) setSelected([]);
  }, [isOpen]);

  if (!isOpen) return null;

  const holidays = daysColumns.filter((c) => c.isHoliday).map((c) => c.day);

  const toggleSelect = (day: number) =>
    setSelected((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const handleMark = () => {
    if (!selected.length) return;
    onSetHolidays(selected, true);
    setSelected([]);
  };

  const handleRemove = () => {
    if (!selected.length) return;
    onSetHolidays(selected, false);
    setSelected([]);
  };

  const handleClearAll = () => {
    onClearHolidays();
    setSelected([]);
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-slate-950 border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 shrink-0">
              <CalendarOff className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 flex-wrap">
                <span>Jours Fériés</span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {holidays.length} jour(s)
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Sélectionnez un ou plusieurs jours dans le calendrier puis appliquez
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-slate-300">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-red-300">{holidays.length} jour(s) férié(s) ce mois</span>
            <span className="text-sky-300">{selected.length} sélectionné(s)</span>
          </div>

          {/* Calendar-style day picker */}
          <div className="grid grid-cols-7 gap-1.5">
            {daysColumns.map((col) => {
              const isHoliday = !!col.isHoliday;
              const isSelected = selected.includes(col.day);
              return (
                <button
                  key={col.day}
                  type="button"
                  onClick={() => toggleSelect(col.day)}
                  title={`${col.day} ${col.dow}${isHoliday ? ' — Férié' : ''}`}
                  className={`flex flex-col items-center justify-center py-1.5 rounded-lg border text-[11px] font-bold transition-colors min-h-[40px] ${
                    isSelected
                      ? 'bg-sky-600 border-sky-400 text-white ring-2 ring-sky-400/60'
                      : isHoliday
                        ? 'bg-red-950/70 border-red-700 text-red-200 hover:bg-red-900'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="tabular-nums leading-none">{col.day}</span>
                  <span className="text-[9px] font-medium opacity-80 leading-none mt-0.5">
                    {isHoliday ? 'FÉRIÉ' : col.dow}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500">
            Les jours fériés apparaissent en rouge dans le planning (en-tête et colonne).
          </p>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 p-3 sm:p-4 flex flex-wrap items-center gap-2 shrink-0 bg-slate-900/40">
          <button
            type="button"
            onClick={handleMark}
            disabled={!selected.length}
            className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-950/70 hover:bg-red-900 disabled:opacity-40 disabled:cursor-not-allowed border border-red-800 text-red-200 text-xs font-bold transition-colors"
            title="Marquer la sélection comme jour(s) férié(s)"
          >
            <Check className="w-4 h-4" />
            Marquer férié(s)
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={!selected.length}
            className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 text-slate-200 text-xs font-bold transition-colors"
            title="Retirer le statut férié de la sélection"
          >
            Retirer
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={!holidays.length}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 text-slate-400 hover:text-red-300 text-xs font-bold transition-colors"
            title="Retirer tous les jours fériés du mois"
          >
            <Trash2 className="w-4 h-4" />
            Tout effacer
          </button>
        </div>
      </div>
    </div>
  );
};
