import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarPlus,
  X,
  CheckCircle2,
  Trash2,
  Calendar,
  User,
  Tag,
  Clock,
  Info,
  Layers,
  Sparkles,
  Shield,
  HeartHandshake,
  Check,
} from 'lucide-react';
import {
  StaffEntity,
  StaffCategory,
  HospitalDocumentConfig,
  LeaveTypeItem,
  DEFAULT_LEAVE_TYPES,
  getTeamTheme,
  DayColumnMeta,
} from '../db/objectboxEngine';

interface StaffLeaveAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffEntity[];
  config: HospitalDocumentConfig;
  initialStaffId?: number | null;
  initialCategory?: StaffCategory | 'all';
  onAssignLeave: (
    staffId: number,
    leaveCode: string,
    leaveLabel: string,
    startDay: number,
    endDay: number,
    isMergedSpan: boolean,
    datesText: string
  ) => void;
  onRemoveLeave: (staffId: number, startDay: number, endDay: number) => void;
}

const COMMON_LEAVE_PRESETS = [
  { code: 'CA', label: 'Congé Annuel', color: '#16a34a', bg: 'bg-emerald-950/70 border-emerald-600 text-emerald-200' },
  { code: 'CM', label: 'Congé Maladie', color: '#dc2626', bg: 'bg-red-950/70 border-red-600 text-red-200' },
  { code: 'MAT', label: 'Congé Maternité', color: '#db2777', bg: 'bg-pink-950/70 border-pink-600 text-pink-200' },
  { code: 'REC', label: 'Récupération (RE)', color: '#ca8a04', bg: 'bg-amber-950/70 border-amber-600 text-amber-200' },
  { code: 'CSS', label: 'Congé Sans Solde', color: '#475569', bg: 'bg-slate-900 border-slate-700 text-slate-300' },
  { code: 'MIS', label: 'Mission / Stage', color: '#2563eb', bg: 'bg-blue-950/70 border-blue-600 text-blue-200' },
  { code: 'AT', label: 'Accident du Travail', color: '#e11d48', bg: 'bg-rose-950/70 border-rose-600 text-rose-200' },
  { code: 'AA', label: 'Autorisation d\'Absence', color: '#0891b2', bg: 'bg-cyan-950/70 border-cyan-600 text-cyan-200' },
  { code: 'CP', label: 'Congé Paternité / Excep.', color: '#0d9488', bg: 'bg-teal-950/70 border-teal-600 text-teal-200' },
];

export const StaffLeaveAssignmentModal: React.FC<StaffLeaveAssignmentModalProps> = ({
  isOpen,
  onClose,
  staffList,
  config,
  initialStaffId,
  initialCategory = 'all',
  onAssignLeave,
  onRemoveLeave,
}) => {
  const daysInMonth = config.daysColumns?.length || 31;
  const monthName = config.guardMonthName || 'Mois en cours';

  const [categoryFilter, setCategoryFilter] = useState<StaffCategory | 'all'>(initialCategory);
  const [selectedStaffId, setSelectedStaffId] = useState<number>(() => {
    if (initialStaffId && staffList.some((s) => s.id === initialStaffId)) {
      return initialStaffId;
    }
    return staffList[0]?.id || 1;
  });

  const [selectedCode, setSelectedCode] = useState<string>('CA');
  const [selectedLabel, setSelectedLabel] = useState<string>('Congé Annuel');
  const [startDay, setStartDay] = useState<number>(1);
  const [endDay, setEndDay] = useState<number>(15);
  const [isMergedSpan, setIsMergedSpan] = useState<boolean>(false);
  const [customDatesText, setCustomDatesText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Synchronise l'agent sélectionné lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (initialStaffId && staffList.some((s) => s.id === initialStaffId)) {
        setSelectedStaffId(initialStaffId);
        const staff = staffList.find((s) => s.id === initialStaffId);
        if (staff) {
          setCategoryFilter(staff.category);
        }
      } else if (initialCategory && initialCategory !== 'all') {
        setCategoryFilter(initialCategory);
        const match = staffList.find((s) => s.category === initialCategory);
        if (match) setSelectedStaffId(match.id);
      }
    }
  }, [isOpen, initialStaffId, initialCategory, staffList]);

  const currentStaff = useMemo(() => {
    return staffList.find((s) => s.id === selectedStaffId) || staffList[0];
  }, [staffList, selectedStaffId]);

  // Met à jour datesText par défaut
  useEffect(() => {
    const s = Math.min(startDay, endDay);
    const e = Math.max(startDay, endDay);
    setCustomDatesText(`du ${String(s).padStart(2, '0')}/10/2026 au ${String(e).padStart(2, '0')}/10/2026`);
  }, [startDay, endDay]);

  // Si congé maternité sélectionné, cocher automatiquement la cellule fusionnée
  useEffect(() => {
    if (selectedCode === 'MAT' || /maternité/i.test(selectedLabel)) {
      setIsMergedSpan(true);
    }
  }, [selectedCode, selectedLabel]);

  // Filtrage du personnel
  const filteredStaffList = useMemo(() => {
    return staffList.filter((s) => {
      const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
      const matchSearch =
        searchQuery === '' ||
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.gradeLandscape.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rolePortrait.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.teamGroup.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [staffList, categoryFilter, searchQuery]);

  if (!isOpen) return null;

  const durationDays = Math.max(1, Math.abs(endDay - startDay) + 1);

  const handleSelectPreset = (p: { code: string; label: string }) => {
    setSelectedCode(p.code);
    setSelectedLabel(p.label);
    if (p.code === 'MAT' || /maternité/i.test(p.label)) {
      setIsMergedSpan(true);
    }
  };

  const handleApplyPresetPeriod = (s: number, e: number) => {
    setStartDay(Math.min(s, daysInMonth));
    setEndDay(Math.min(e, daysInMonth));
  };

  const handleConfirmAssign = () => {
    if (!currentStaff) return;
    const realStart = Math.min(startDay, endDay);
    const realEnd = Math.max(startDay, endDay);

    onAssignLeave(
      currentStaff.id,
      selectedCode,
      selectedLabel,
      realStart,
      realEnd,
      isMergedSpan,
      customDatesText.trim()
    );
    onClose();
  };

  const handleConfirmRemove = () => {
    if (!currentStaff) return;
    const realStart = Math.min(startDay, endDay);
    const realEnd = Math.max(startDay, endDay);

    onRemoveLeave(currentStaff.id, realStart, realEnd);
    onClose();
  };

  const sTheme = currentStaff ? getTeamTheme(currentStaff.teamGroup) : null;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                <span>Poser un Congé pour le Personnel</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {monthName}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Attribuez facilement un congé annuel, maladie, maternité ou récupération à un agent.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto text-xs flex-1">
          {/* SECTION 1: SÉLECTION DE L'AGENT */}
          <div className="space-y-2.5 bg-slate-900/50 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-slate-200 font-bold flex items-center gap-1.5 text-xs">
                <User className="w-4 h-4 text-sky-400" />
                <span>1. Sélectionner l'agent hospitalier :</span>
              </span>
              {currentStaff && (
                <span className="text-[11px] font-medium text-slate-400 font-mono">
                  ID #{currentStaff.id} · {currentStaff.horaireBlock}
                </span>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'medical', label: 'Médical (08h-16h)' },
                { id: 'paramedical_day', label: 'Paramédical Jour' },
                { id: 'paramedical_guard', label: 'Garde 16h' },
                { id: 'hygiene', label: 'Hygiène (12h)' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryFilter(c.id as StaffCategory | 'all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    categoryFilter === c.id
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Select Dropdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">
                  Nom de l'agent :
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-sky-500 min-h-[38px]"
                >
                  {filteredStaffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} — {s.gradeLandscape || s.rolePortrait} {s.teamGroup ? `(Éq. ${s.teamGroup})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected agent preview card */}
              {currentStaff && (
                <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-white font-bold text-xs truncate">
                      {currentStaff.fullName}
                    </div>
                    <div className="text-slate-400 text-[11px] truncate">
                      {currentStaff.gradeLandscape || currentStaff.rolePortrait}
                    </div>
                  </div>
                  {currentStaff.teamGroup && sTheme && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${sTheme.fullBadge}`}>
                      Équipe {currentStaff.teamGroup}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: MOTIF / TYPE DE CONGÉ */}
          <div className="space-y-2.5 bg-slate-900/50 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-slate-200 font-bold flex items-center gap-1.5 text-xs">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>2. Choisir le type de congé ou motif :</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-700">
                Code sélectionné : {selectedCode}
              </span>
            </div>

            {/* Preset tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
              {COMMON_LEAVE_PRESETS.map((preset) => {
                const isSelected = selectedCode === preset.code;
                return (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-1.5 ${
                      isSelected
                        ? `${preset.bg} ring-2 ring-white/30 scale-[1.02] shadow-sm font-bold`
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-black text-xs px-1.5 py-0.5 rounded bg-black/40">
                        {preset.code}
                      </span>
                      <span className="text-[11px] truncate">{preset.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom label/code input if needed */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">
                  Code affiché sur la grille :
                </label>
                <input
                  type="text"
                  value={selectedCode}
                  onChange={(e) => setSelectedCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-amber-500 uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">
                  Libellé du congé :
                </label>
                <input
                  type="text"
                  value={selectedLabel}
                  onChange={(e) => setSelectedLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-medium text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: PÉRIODE D'APPLICATION */}
          <div className="space-y-2.5 bg-slate-900/50 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-slate-200 font-bold flex items-center gap-1.5 text-xs">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>3. Définir la période du congé (Jours 1 à {daysInMonth}) :</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                Durée : {durationDays} {durationDays > 1 ? 'jours' : 'jour'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">
                  Jour de début :
                </label>
                <select
                  value={startDay}
                  onChange={(e) => setStartDay(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-emerald-500 font-mono min-h-[38px]"
                >
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Jour {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-medium mb-1">
                  Jour de fin :
                </label>
                <select
                  value={endDay}
                  onChange={(e) => setEndDay(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-emerald-500 font-mono min-h-[38px]"
                >
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Jour {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick period buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400">Périodes courantes :</span>
              {[
                { label: '1ère quinzaine (J1 à J15)', s: 1, e: 15 },
                { label: '2ème quinzaine (J16 à J30/31)', s: 16, e: daysInMonth },
                { label: '1ère semaine (J1 à J7)', s: 1, e: 7 },
                { label: 'Tout le mois (J1 à fin)', s: 1, e: daysInMonth },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyPresetPeriod(p.s, p.e)}
                  className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10.5px] transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Options: Cellule fusionnée & Mention officielle */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={isMergedSpan}
                  onChange={(e) => setIsMergedSpan(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold">
                  Fusionner la cellule horizontale sur le tableau Paysage (recommandé pour Maternité ou longs congés)
                </span>
              </label>

              {isMergedSpan && (
                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">
                    Dates précises pour la mention officielle (colonne O.B.S Portrait) :
                  </label>
                  <input
                    type="text"
                    value={customDatesText}
                    onChange={(e) => setCustomDatesText(e.target.value)}
                    placeholder="ex: du 01/10/2026 au 26/10/2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: APERÇU EN DIRECT SUR LES 31 JOURS */}
          {currentStaff && (
            <div className="space-y-2 bg-slate-900/50 border border-slate-800/80 p-3.5 rounded-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-200 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span>Aperçu de la grille après application pour {currentStaff.fullName} :</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Jours {Math.min(startDay, endDay)} à {Math.max(startDay, endDay)} en <strong className="text-emerald-400">{selectedCode}</strong>
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950 p-2">
                <div className="flex items-center gap-1 min-w-[620px]">
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                    const isInPeriod = d >= Math.min(startDay, endDay) && d <= Math.max(startDay, endDay);
                    const currentVal = currentStaff.dailyActivity?.[d] || 'N';
                    const displayVal = isInPeriod ? selectedCode : currentVal;

                    return (
                      <div
                        key={d}
                        className={`flex-1 flex flex-col items-center justify-center p-1 rounded border text-center transition-all ${
                          isInPeriod
                            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 ring-1 ring-emerald-400 font-bold'
                            : 'bg-slate-900/80 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="text-[9px] font-mono text-slate-500">{d}</span>
                        <span className="text-[10px] font-bold mt-0.5 truncate max-w-[28px]">
                          {displayVal}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-4 bg-slate-900 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl font-semibold transition-colors text-xs min-h-[40px] flex items-center justify-center"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleConfirmRemove}
              className="px-3.5 py-2 bg-red-950/60 hover:bg-red-900/80 border border-red-800/80 text-red-200 rounded-xl font-semibold transition-colors text-xs min-h-[40px] flex items-center gap-1.5"
              title="Supprimer le congé sur cette période et rétablir l'activité normale"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Retirer congé</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleConfirmAssign}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg transition-all text-xs min-h-[40px] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Valider &amp; Appliquer le Congé</span>
          </button>
        </div>
      </div>
    </div>
  );
};
