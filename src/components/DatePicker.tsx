import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
  Check,
  RefreshCw,
  CalendarRange,
} from 'lucide-react';
import {
  FRENCH_MONTH_NAMES,
  parseCurrentMonthYear,
  calculateMonthDateOverlap,
} from '../db/objectboxEngine';

export interface DatePickerProps {
  startDate: string; // ISO "YYYY-MM-DD"
  endDate: string; // ISO "YYYY-MM-DD"
  onChange: (startDate: string, endDate: string, durationDays: number) => void;
  activePlanningMonth?: string; // e.g. "Octobre 2026"
  className?: string;
  initialMode?: 'date_to_date' | 'date_plus_days';
}

const DOW_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const DURATION_PRESETS = [
  { label: '1 mois (30j)', days: 30 },
  { label: '1 mois (31j)', days: 31 },
  { label: '15 jours', days: 15 },
  { label: '7 jours', days: 7 },
  { label: '21 jours', days: 21 },
  { label: '98j (Maternité)', days: 98 },
];

function toIsoDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoDate(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatFrenchDateFull(isoStr: string): string {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-').map(Number);
  if (!y || !m || !d) return isoStr;
  const date = new Date(Date.UTC(y, m - 1, d));
  const DOW_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const dow = DOW_FULL[date.getUTCDay()];
  const monthName = FRENCH_MONTH_NAMES[m - 1] || '';
  return `${dow} ${d} ${monthName} ${y}`;
}

function formatFrenchDateShort(isoStr: string): string {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-').map(Number);
  if (!y || !m || !d) return isoStr;
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  startDate,
  endDate,
  onChange,
  activePlanningMonth = 'Octobre 2026',
  className = '',
  initialMode = 'date_plus_days',
}) => {
  const currentMonthInfo = useMemo(() => {
    return parseCurrentMonthYear(activePlanningMonth);
  }, [activePlanningMonth]);

  const [mode, setMode] = useState<'date_to_date' | 'date_plus_days'>(initialMode);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Month navigation: display month 1 and month 2 (dual calendar)
  const [baseYear, setBaseYear] = useState<number>(() => {
    if (startDate) {
      const parsed = parseIsoDate(startDate);
      return parsed.getUTCFullYear();
    }
    return currentMonthInfo.year;
  });

  const [baseMonthIdx, setBaseMonthIdx] = useState<number>(() => {
    if (startDate) {
      const parsed = parseIsoDate(startDate);
      return parsed.getUTCMonth();
    }
    return currentMonthInfo.monthIndex;
  });

  // Calculate duration in days
  const durationDays = useMemo(() => {
    try {
      const s = parseIsoDate(startDate);
      const e = parseIsoDate(endDate);
      if (e >= s) {
        return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
      }
    } catch {
      // ignore
    }
    return 1;
  }, [startDate, endDate]);

  // Second month info for dual display
  const secondMonthInfo = useMemo(() => {
    let nextIdx = baseMonthIdx + 1;
    let nextY = baseYear;
    if (nextIdx > 11) {
      nextIdx = 0;
      nextY += 1;
    }
    return {
      year: nextY,
      monthIndex: nextIdx,
      label: FRENCH_MONTH_NAMES[nextIdx],
    };
  }, [baseYear, baseMonthIdx]);

  // Build grid for a given year & month
  const buildMonthGrid = (year: number, monthIdx: number) => {
    const daysCount = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
    const firstDow = new Date(Date.UTC(year, monthIdx, 1)).getUTCDay();
    const days: Array<{
      day: number;
      isoDate: string;
      dow: number;
      isWeekend: boolean;
      isToday: boolean;
    }> = [];

    const todayIso = '2026-10-29';

    for (let d = 1; d <= daysCount; d++) {
      const iso = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dow = (firstDow + d - 1) % 7;
      const isWeekend = dow === 5 || dow === 6; // Ven & Sam en Algérie
      const isToday = iso === todayIso;

      days.push({
        day: d,
        isoDate: iso,
        dow,
        isWeekend,
        isToday,
      });
    }

    return {
      year,
      monthIdx,
      label: FRENCH_MONTH_NAMES[monthIdx],
      firstDow,
      daysCount,
      days,
    };
  };

  const monthGrid1 = useMemo(() => buildMonthGrid(baseYear, baseMonthIdx), [baseYear, baseMonthIdx]);
  const monthGrid2 = useMemo(() => buildMonthGrid(secondMonthInfo.year, secondMonthInfo.monthIndex), [secondMonthInfo]);

  // Click on a calendar day
  const handleDayClick = (iso: string) => {
    if (mode === 'date_plus_days') {
      // Sets start date, calculates end date using current durationDays
      const start = parseIsoDate(iso);
      const end = new Date(start.getTime());
      end.setUTCDate(end.getUTCDate() + Math.max(1, durationDays) - 1);
      onChange(iso, toIsoDate(end), durationDays);
    } else {
      // Date to date logic
      if (!startDate || (startDate && endDate && startDate !== endDate)) {
        // First click: select start date
        onChange(iso, iso, 1);
      } else if (startDate && (!endDate || startDate === endDate)) {
        // Second click: select end date
        if (iso < startDate) {
          const s = parseIsoDate(iso);
          const e = parseIsoDate(startDate);
          const diff = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
          onChange(iso, startDate, diff);
        } else {
          const s = parseIsoDate(startDate);
          const e = parseIsoDate(iso);
          const diff = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
          onChange(startDate, iso, diff);
        }
      }
    }
  };

  // Adjust duration in days
  const handleDurationChange = (newDays: number) => {
    const days = Math.max(1, Math.min(365, newDays));
    const start = parseIsoDate(startDate);
    const end = new Date(start.getTime());
    end.setUTCDate(end.getUTCDate() + days - 1);
    onChange(startDate, toIsoDate(end), days);
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (baseMonthIdx === 0) {
      setBaseMonthIdx(11);
      setBaseYear((y) => y - 1);
    } else {
      setBaseMonthIdx((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (baseMonthIdx === 11) {
      setBaseMonthIdx(0);
      setBaseYear((y) => y + 1);
    } else {
      setBaseMonthIdx((m) => m + 1);
    }
  };

  const handleResetToPlanningMonth = () => {
    setBaseYear(currentMonthInfo.year);
    setBaseMonthIdx(currentMonthInfo.monthIndex);
  };

  // Check overlaps for multi-month indicator
  const currentMonthOverlap = useMemo(() => {
    return calculateMonthDateOverlap(startDate, endDate, currentMonthInfo.year, currentMonthInfo.monthIndex);
  }, [startDate, endDate, currentMonthInfo]);

  const nextMonthOverlap = useMemo(() => {
    let nIdx = currentMonthInfo.monthIndex + 1;
    let nY = currentMonthInfo.year;
    if (nIdx > 11) {
      nIdx = 0;
      nY += 1;
    }
    return calculateMonthDateOverlap(startDate, endDate, nY, nIdx);
  }, [startDate, endDate, currentMonthInfo]);

  // Effective range to illuminate (includes hover if dragging/picking)
  const effectiveEnd = useMemo(() => {
    if (mode === 'date_to_date' && startDate && startDate === endDate && hoverDate && hoverDate > startDate) {
      return hoverDate;
    }
    return endDate;
  }, [mode, startDate, endDate, hoverDate]);

  const renderMonthTable = (grid: ReturnType<typeof buildMonthGrid>) => {
    return (
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
        <div className="text-center font-bold text-xs text-white uppercase tracking-wider pb-2 border-b border-slate-800/80 font-mono">
          {grid.label} {grid.year}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center font-mono pt-2">
          {DOW_LABELS.map((label, idx) => (
            <div
              key={label}
              className={`text-[9.5px] font-bold py-0.5 ${
                idx === 5 || idx === 6 ? 'text-amber-400/80' : 'text-slate-400'
              }`}
            >
              {label}
            </div>
          ))}

          {/* Empty spacer cells */}
          {Array.from({ length: grid.firstDow }, (_, i) => (
            <div key={`spacer-${i}`} className="h-8" />
          ))}

          {/* Days */}
          {grid.days.map((item) => {
            const isStart = item.isoDate === startDate;
            const isEnd = item.isoDate === effectiveEnd;
            const inRange = item.isoDate >= startDate && item.isoDate <= effectiveEnd;

            return (
              <button
                key={item.isoDate}
                type="button"
                onClick={() => handleDayClick(item.isoDate)}
                onMouseEnter={() => setHoverDate(item.isoDate)}
                onMouseLeave={() => setHoverDate(null)}
                className={`h-8 rounded-lg flex flex-col items-center justify-center relative transition-all text-xs font-semibold cursor-pointer ${
                  isStart || isEnd
                    ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400 shadow-md scale-105 z-10'
                    : inRange
                    ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800/80 font-bold'
                    : item.isWeekend
                    ? 'bg-slate-900/40 text-amber-300/80 hover:bg-slate-800 border border-slate-900/80'
                    : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800/60'
                }`}
                title={`${item.day} ${grid.label} ${grid.year}${
                  isStart ? ' (Début)' : isEnd ? ' (Fin)' : ''
                }`}
              >
                <span>{item.day}</span>
                {isStart && (
                  <span className="text-[7px] font-mono leading-none tracking-tight text-emerald-200 -mt-0.5 font-bold">
                    Début
                  </span>
                )}
                {isEnd && !isStart && (
                  <span className="text-[7px] font-mono leading-none tracking-tight text-emerald-200 -mt-0.5 font-bold">
                    Fin
                  </span>
                )}
                {item.isToday && !isStart && !isEnd && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-sky-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Top Header: Mode Switcher & Quick Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/60 border border-slate-800/90 p-2.5 sm:p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-white text-xs block">
              Sélecteur de Dates Interactif (DatePicker)
            </span>
            <span className="text-[11px] text-slate-400">
              Cliquez directement sur les jours du calendrier
            </span>
          </div>
        </div>

        {/* Mode Toggle Button */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('date_plus_days')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'date_plus_days'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Date + Nombre de jours</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('date_to_date')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'date_to_date'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Du Date à Date</span>
          </button>
        </div>
      </div>

      {/* Date & Duration Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950 border border-slate-800/80 p-3 rounded-xl">
        {/* Date Début */}
        <div className="space-y-1">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
            Date de début :
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                if (e.target.value) {
                  const s = parseIsoDate(e.target.value);
                  const end = new Date(s.getTime());
                  end.setUTCDate(end.getUTCDate() + durationDays - 1);
                  onChange(e.target.value, toIsoDate(end), durationDays);
                }
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500 w-full"
            />
          </div>
          <span className="text-[10px] text-slate-400 truncate block">
            {formatFrenchDateFull(startDate)}
          </span>
        </div>

        {/* Durée ou Date Fin */}
        {mode === 'date_plus_days' ? (
          <div className="space-y-1">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
              Nombre de jours :
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleDurationChange(durationDays - 1)}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white"
                title="Moins un jour"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                min="1"
                max="365"
                value={durationDays}
                onChange={(e) => handleDurationChange(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono font-bold text-xs text-center focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleDurationChange(durationDays + 1)}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white"
                title="Plus un jour"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold block truncate">
              {durationDays} jour{durationDays > 1 ? 's' : ''} consécutifs
            </span>
          </div>
        ) : (
          <div className="space-y-1">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
              Date de fin :
            </span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => {
                if (e.target.value) {
                  const s = parseIsoDate(startDate);
                  const end = parseIsoDate(e.target.value);
                  const diff = Math.max(1, Math.round((end.getTime() - s.getTime()) / 86400000) + 1);
                  onChange(startDate, e.target.value, diff);
                }
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-500 w-full"
            />
            <span className="text-[10px] text-slate-400 truncate block">
              {formatFrenchDateFull(endDate)}
            </span>
          </div>
        )}

        {/* Synthèse globale */}
        <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-3 flex flex-col justify-center">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
            Période validée :
          </span>
          <div className="text-white font-bold text-xs font-mono">
            Du {formatFrenchDateShort(startDate)} au {formatFrenchDateShort(endDate)}
          </div>
          <span className="text-[10.5px] text-emerald-400 font-bold font-mono">
            Durée : {durationDays} jours calendaires
          </span>
        </div>
      </div>

      {/* Raccourcis de durée */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-slate-400 mr-1">Raccourcis de durée :</span>
        {DURATION_PRESETS.map((p) => (
          <button
            key={p.days}
            type="button"
            onClick={() => handleDurationChange(p.days)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
              durationDays === p.days
                ? 'bg-emerald-950 text-emerald-200 border-emerald-600 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* CALENDRIER INTERACTIF (DOUBLE VUE OCTOBRE + NOVEMBRE OU MOIS AU CHOIX) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              title="Reculer d'un mois"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white font-mono">
              Vue Calendrier : {monthGrid1.label} {monthGrid1.year} &amp; {monthGrid2.label} {monthGrid2.year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              title="Avancer d'un mois"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick jumps */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetToPlanningMonth}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10.5px] border border-slate-800 transition-colors"
              title="Revenir au mois actif du planning"
            >
              📌 {currentMonthInfo.monthLabel} {currentMonthInfo.year}
            </button>
          </div>
        </div>

        {/* Dual Month Grids Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {renderMonthTable(monthGrid1)}
          {renderMonthTable(monthGrid2)}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-[10.5px] text-slate-400 pt-2 border-t border-slate-900 gap-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block" />
            <span>Période sélectionnée</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/50 inline-block" />
            <span>Week-ends (Ven &amp; Sam)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
            <span>29 Octobre (Aujourd'hui)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
