import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarPlus,
  X,
  CheckCircle2,
  Trash2,
  Calendar as CalendarIcon,
  User,
  Tag,
  Clock,
  Info,
  Sparkles,
  Shield,
  HeartHandshake,
  Check,
  Plus,
  AlertCircle,
  CalendarCheck,
  Search,
} from 'lucide-react';
import {
  StaffEntity,
  StaffCategory,
  HospitalDocumentConfig,
  LeaveTypeItem,
  DEFAULT_LEAVE_TYPES,
  getTeamTheme,
  DayColumnMeta,
  StaffLeaveRecord,
  objectBoxStore,
  FRENCH_MONTH_NAMES,
  parseCurrentMonthYear,
  calculateMonthDateOverlap,
} from '../db/objectboxEngine';
import { DatePicker } from './DatePicker';

export interface StaffLeaveAssignmentModalProps {
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
    datesText: string,
    dateRange?: { startDate: string; endDate: string; durationDays: number }
  ) => void;
  onRemoveLeave: (staffId: number, startDay: number, endDay: number) => void;
  onCreateOrSwitchMonth?: (year: number, monthIndex: number) => void;
}

const COMMON_LEAVE_PRESETS = [
  { code: 'C', label: 'Congé Annuel', color: '#16a34a', bg: 'bg-emerald-950/70 border-emerald-600 text-emerald-200' },
  { code: 'CM', label: 'Congé Maladie', color: '#dc2626', bg: 'bg-red-950/70 border-red-600 text-red-200' },
  { code: 'MAT', label: 'Congé Maternité', color: '#db2777', bg: 'bg-pink-950/70 border-pink-600 text-pink-200' },
  { code: 'REC', label: 'Récupération (RE)', color: '#ca8a04', bg: 'bg-amber-950/70 border-amber-600 text-amber-200' },
  { code: 'CSS', label: 'Congé Sans Solde', color: '#475569', bg: 'bg-slate-900 border-slate-700 text-slate-300' },
  { code: 'MIS', label: 'Mission / Stage', color: '#2563eb', bg: 'bg-blue-950/70 border-blue-600 text-blue-200' },
  { code: 'AT', label: 'Accident du Travail', color: '#e11d48', bg: 'bg-rose-950/70 border-rose-600 text-rose-200' },
  { code: 'AA', label: 'Autorisation d\'Absence', color: '#0891b2', bg: 'bg-cyan-950/70 border-cyan-600 text-cyan-200' },
  { code: 'CP', label: 'Congé Paternité / Excep.', color: '#0d9488', bg: 'bg-teal-950/70 border-teal-600 text-teal-200' },
];

// Helper formatting YYYY-MM-DD
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

function formatFrenchDate(isoStr: string): string {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-').map(Number);
  if (!y || !m || !d) return isoStr;
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export const StaffLeaveAssignmentModal: React.FC<StaffLeaveAssignmentModalProps> = ({
  isOpen,
  onClose,
  staffList,
  config,
  initialStaffId,
  initialCategory = 'all',
  onAssignLeave,
  onRemoveLeave,
  onCreateOrSwitchMonth,
}) => {
  const currentMonthInfo = useMemo(() => {
    return parseCurrentMonthYear(config.guardMonthName);
  }, [config.guardMonthName]);

  const nextMonthInfo = useMemo(() => {
    let nextIdx = currentMonthInfo.monthIndex + 1;
    let nextY = currentMonthInfo.year;
    if (nextIdx > 11) {
      nextIdx = 0;
      nextY += 1;
    }
    return {
      year: nextY,
      monthIndex: nextIdx,
      monthLabel: FRENCH_MONTH_NAMES[nextIdx],
    };
  }, [currentMonthInfo]);

  const daysInCurrentMonth = config.daysColumns?.length || 31;
  const monthName = config.guardMonthName || 'Octobre 2026';

  // Agent selection
  const [categoryFilter, setCategoryFilter] = useState<StaffCategory | 'all'>(initialCategory);
  const [selectedStaffId, setSelectedStaffId] = useState<number>(() => {
    if (initialStaffId && staffList.some((s) => s.id === initialStaffId)) {
      return initialStaffId;
    }
    return staffList[0]?.id || 1;
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dates state (initialisé avec 23 Octobre 2026 et 31 jours / 22 Novembre 2026 comme dans le besoin exprimé)
  const [startDateStr, setStartDateStr] = useState<string>(() => {
    if (currentMonthInfo.monthIndex === 9 && currentMonthInfo.year === 2026) {
      return '2026-10-23';
    }
    return `${currentMonthInfo.year}-${String(currentMonthInfo.monthIndex + 1).padStart(2, '0')}-01`;
  });

  const [durationDays, setDurationDays] = useState<number>(31); // 1 mois par défaut (31 jours)

  const [endDateStr, setEndDateStr] = useState<string>(() => {
    if (currentMonthInfo.monthIndex === 9 && currentMonthInfo.year === 2026) {
      return '2026-11-22';
    }
    const d = new Date(Date.UTC(currentMonthInfo.year, currentMonthInfo.monthIndex, 1));
    d.setUTCDate(d.getUTCDate() + 30);
    return toIsoDate(d);
  });

  // Leave parameters
  const [selectedCode, setSelectedCode] = useState<string>('C');
  const [selectedLabel, setSelectedLabel] = useState<string>('Congé Annuel');
  const [isMergedSpan, setIsMergedSpan] = useState<boolean>(true);
  const [customDatesText, setCustomDatesText] = useState<string>('');

  // Tab: 'new_leave' | 'existing_leaves'
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // Synchronise l'agent sélectionné lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      if (initialStaffId && staffList.some((s) => s.id === initialStaffId)) {
        setSelectedStaffId(initialStaffId);
        const staff = staffList.find((s) => s.id === initialStaffId);
        if (staff) setCategoryFilter(staff.category);
      } else if (initialCategory && initialCategory !== 'all') {
        setCategoryFilter(initialCategory);
        const match = staffList.find((s) => s.category === initialCategory);
        if (match) setSelectedStaffId(match.id);
      }
    }
  }, [isOpen, initialStaffId, initialCategory, staffList]);

  // Met à jour datesText officiel
  useEffect(() => {
    const fStart = formatFrenchDate(startDateStr);
    const fEnd = formatFrenchDate(endDateStr);
    setCustomDatesText(`du ${fStart} au ${fEnd}`);
  }, [startDateStr, endDateStr]);

  // Active automatiquement la cellule fusionnée pour maternité ou congés >= 15 jours
  useEffect(() => {
    if (selectedCode === 'MAT' || /maternité|maternite/i.test(selectedLabel) || durationDays >= 15) {
      setIsMergedSpan(true);
    }
  }, [selectedCode, selectedLabel, durationDays]);

  const currentStaff = useMemo(() => {
    return staffList.find((s) => s.id === selectedStaffId) || staffList[0];
  }, [staffList, selectedStaffId]);

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

  // Congés déjà enregistrés pour l'agent
  const existingStaffLeaves = useMemo(() => {
    if (!currentStaff) return [];
    return objectBoxStore.getStaffLeaves(currentStaff.id);
  }, [currentStaff, isOpen]);

  // Analyse des chevauchements de mois
  const currentMonthOverlap = useMemo(() => {
    return calculateMonthDateOverlap(startDateStr, endDateStr, currentMonthInfo.year, currentMonthInfo.monthIndex);
  }, [startDateStr, endDateStr, currentMonthInfo]);

  const nextMonthOverlap = useMemo(() => {
    return calculateMonthDateOverlap(startDateStr, endDateStr, nextMonthInfo.year, nextMonthInfo.monthIndex);
  }, [startDateStr, endDateStr, nextMonthInfo]);

  const isCrossMonth = useMemo(() => {
    if (!currentMonthOverlap) return false;
    return currentMonthOverlap.endsAfterMonth || (nextMonthOverlap !== null && nextMonthOverlap.overlapDays > 0);
  }, [currentMonthOverlap, nextMonthOverlap]);

  if (!isOpen) return null;

  const handleSelectPreset = (p: { code: string; label: string }) => {
    setSelectedCode(p.code);
    setSelectedLabel(p.label);
    if (p.code === 'MAT' || /maternité|maternite/i.test(p.label)) {
      setIsMergedSpan(true);
      setDurationDays(98);
      try {
        const start = parseIsoDate(startDateStr);
        const end = new Date(start.getTime());
        end.setUTCDate(end.getUTCDate() + 98 - 1);
        setEndDateStr(toIsoDate(end));
      } catch {
        // ignore
      }
    }
  };

  const handleConfirmAssign = (createNext = false) => {
    if (!currentStaff) return;

    // Détermine startDay et endDay pour le mois actuellement ouvert
    let currentStartDay = 1;
    let currentEndDay = daysInCurrentMonth;
    if (currentMonthOverlap) {
      currentStartDay = currentMonthOverlap.startDay;
      currentEndDay = currentMonthOverlap.endDay;
    } else {
      // Si le congé ne chevauche pas le mois actif mais se trouve dans le futur
      currentStartDay = 1;
      currentEndDay = 1;
    }

    onAssignLeave(
      currentStaff.id,
      selectedCode,
      selectedLabel,
      currentStartDay,
      currentEndDay,
      isMergedSpan,
      customDatesText.trim(),
      {
        startDate: startDateStr,
        endDate: endDateStr,
        durationDays,
      }
    );

    if (createNext && onCreateOrSwitchMonth) {
      // Crée et bascule vers le mois suivant (ex: Novembre 2026)
      onCreateOrSwitchMonth(nextMonthInfo.year, nextMonthInfo.monthIndex);
    }

    onClose();
  };

  const handleConfirmRemove = () => {
    if (!currentStaff) return;
    const start = currentMonthOverlap ? currentMonthOverlap.startDay : 1;
    const end = currentMonthOverlap ? currentMonthOverlap.endDay : daysInCurrentMonth;
    onRemoveLeave(currentStaff.id, start, end);
    onClose();
  };

  const handleDeleteExistingLeave = (leaveId: string) => {
    objectBoxStore.removeStaffLeaveRecord(leaveId);
  };

  const sTheme = currentStaff ? getTeamTheme(currentStaff.teamGroup) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto font-sans"
    >
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Poser un Congé avec Calendrier Interactif
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Planning actif : {monthName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sélectionnez les dates au calendrier (de date à date ou par durée en jours) avec continuité multi-mois.
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

        {/* Tab switcher: Nouveau congé vs Congés enregistrés */}
        <div className="px-4 sm:px-6 py-2 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              <span>Nouveau Congé</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Congés Enregistrés ({existingStaffLeaves.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
            <span>Aujourd'hui :</span>
            <span className="font-mono text-emerald-300 font-bold">29 Octobre 2026</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs flex-1">
          {activeTab === 'history' ? (
            /* TAB: LISTE DES CONGÉS ENREGISTRÉS POUR CET AGENT */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">
                  Congés actifs pour {currentStaff?.fullName} :
                </span>
                <span className="text-[11px] text-slate-400">
                  {existingStaffLeaves.length} congé(s) trouvé(s)
                </span>
              </div>

              {existingStaffLeaves.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-8 text-center space-y-2">
                  <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-slate-300 font-medium text-xs">
                    Aucun congé enregistré pour cet agent pour le moment.
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Utilisez l'onglet « Nouveau Congé » pour lui affecter un congé annuel, maladie ou maternité.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Créer un congé maintenant</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {existingStaffLeaves.map((l) => (
                    <div
                      key={l.id}
                      className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono font-black text-xs px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                          {l.leaveCode}
                        </span>
                        <div className="min-w-0">
                          <div className="text-white font-bold text-xs truncate">
                            {l.leaveLabel} — <span className="text-emerald-300 font-mono">{l.datesText}</span>
                          </div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                            <span>Durée : {l.durationDays} jours</span>
                            <span>·</span>
                            <span>Du {formatFrenchDate(l.startDate)} au {formatFrenchDate(l.endDate)}</span>
                            {l.isMergedSpan && (
                              <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 text-[10px] border border-indigo-800">
                                Cellule fusionnée
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteExistingLeave(l.id)}
                        className="p-1.5 text-red-400 hover:text-red-200 hover:bg-red-950/60 border border-red-900/50 rounded-lg transition-colors shrink-0"
                        title="Supprimer ce congé"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* TAB: CRÉATION D'UN NOUVEAU CONGÉ */
            <>
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

                {/* Filtres de catégorie */}
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

                {/* Sélecteur de l'agent + carte de synthèse */}
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
                    Code sélectionné : {selectedCode} ({selectedLabel})
                  </span>
                </div>

                {/* Tuiles de présélection */}
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
                            ? `${preset.bg} ring-2 ring-white/30 scale-[1.01] shadow-sm font-bold`
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
              </div>

              {/* SECTION 3: SÉLECTION DU CALENDRIER & MODE DE CALCUL (COMPOSANT DATEPICKER INTERACTIF) */}
              <div className="space-y-3.5 bg-slate-900/50 border border-slate-800/80 p-3.5 sm:p-4 rounded-xl">
                <DatePicker
                  startDate={startDateStr}
                  endDate={endDateStr}
                  activePlanningMonth={monthName}
                  onChange={(s, e, d) => {
                    setStartDateStr(s);
                    setEndDateStr(e);
                    setDurationDays(d);
                  }}
                />

                {/* BANNIÈRE D'INFORMATION SUR LE CHEVAUCHEMENT MULTI-MOIS (OCTOBRE -> NOVEMBRE) */}
                {isCrossMonth && (
                  <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-600/50 rounded-xl p-3 sm:p-4 space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Continuité Multi-Mois Détectée (Congé de {durationDays} jours) :</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {currentMonthOverlap && (
                        <div className="bg-slate-950/60 border border-emerald-800/60 p-2.5 rounded-lg space-y-0.5">
                          <span className="text-slate-400 text-[11px] font-bold block">
                            Dans le planning d'{currentMonthInfo.monthLabel} {currentMonthInfo.year} :
                          </span>
                          <span className="text-white font-mono font-bold text-xs">
                            Jours {currentMonthOverlap.startDay} à {currentMonthOverlap.endDay} ({currentMonthOverlap.overlapDays} jours)
                          </span>
                        </div>
                      )}

                      {nextMonthOverlap && (
                        <div className="bg-slate-950/60 border border-indigo-800/60 p-2.5 rounded-lg space-y-0.5">
                          <span className="text-slate-400 text-[11px] font-bold block">
                            Dans le planning de {nextMonthInfo.monthLabel} {nextMonthInfo.year} :
                          </span>
                          <span className="text-indigo-300 font-mono font-bold text-xs">
                            Jours {nextMonthOverlap.startDay} à {nextMonthOverlap.endDay} ({nextMonthOverlap.overlapDays} jours)
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-300">
                      Ce congé sera automatiquement enregistré dans le système. Lorsque vous créerez ou consulterez le planning de{' '}
                      <strong className="text-white font-bold">{nextMonthInfo.monthLabel} {nextMonthInfo.year}</strong>,{' '}
                      {currentStaff?.fullName} aura directement ses jours {nextMonthOverlap?.startDay || 1} à {nextMonthOverlap?.endDay || 22} marqués en <strong className="text-emerald-400">{selectedCode}</strong> !
                    </p>
                  </div>
                )}

                {/* Option cellule fusionnée et mention officielle */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={isMergedSpan}
                      onChange={(e) => setIsMergedSpan(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-semibold">
                      Fusionner horizontalement la cellule sur les tableaux Paysage (recommandé pour les congés longs ou maternité)
                    </span>
                  </label>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-medium mb-1">
                      Mention officielle (colonne O.B.S Portrait) :
                    </label>
                    <input
                      type="text"
                      value={customDatesText}
                      onChange={(e) => setCustomDatesText(e.target.value)}
                      placeholder="ex: du 23/10/2026 au 22/11/2026"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: APERÇU DE LA GRILLE DU MOIS EN COURS */}
              {currentStaff && currentMonthOverlap && (
                <div className="space-y-2 bg-slate-900/50 border border-slate-800/80 p-3.5 rounded-xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      <span>Aperçu sur le planning actif ({currentMonthInfo.monthLabel}) pour {currentStaff.fullName} :</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Jours {currentMonthOverlap.startDay} à {currentMonthOverlap.endDay} en <strong className="text-emerald-400">{selectedCode}</strong>
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-lg bg-slate-950 p-2">
                    <div className="flex items-center gap-1 min-w-[620px]">
                      {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((d) => {
                        const isInPeriod = d >= currentMonthOverlap.startDay && d <= currentMonthOverlap.endDay;
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
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
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
              title="Supprimer le congé sur le mois actif et rétablir l'activité normale"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Retirer du mois actif</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Si congé se prolonge sur le mois suivant, proposer de créer/basculer directement vers ce mois */}
            {isCrossMonth && onCreateOrSwitchMonth && (
              <button
                type="button"
                onClick={() => handleConfirmAssign(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl font-bold shadow-lg transition-all text-xs min-h-[40px] flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                title={`Valider le congé et créer/ouvrir immédiatement le planning de ${nextMonthInfo.monthLabel} ${nextMonthInfo.year}`}
              >
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>Valider &amp; Créer {nextMonthInfo.monthLabel} {nextMonthInfo.year}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleConfirmAssign(false)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg transition-all text-xs min-h-[40px] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Appliquer au Planning {monthName}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
