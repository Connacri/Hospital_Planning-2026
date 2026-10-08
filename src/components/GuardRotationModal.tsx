import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Check,
  Shield,
  Clock,
  Sparkles,
  Info,
  Play,
  Sun,
  Moon,
  Repeat,
  AlertTriangle,
  Edit2,
} from 'lucide-react';
import {
  DEFAULT_GUARD_ROTATION_ORDER,
  GUARD_MONTHS_PRESETS,
  buildContinuousGuard16hActivity,
} from '../db/objectboxEngine';

interface GuardRotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRotationOrder: string[];
  currentMonthOffsetDays: number;
  onApplyRotation: (
    rotationOrder: string[],
    cumulativeOffsetDays: number,
    daysInMonth: number,
    includeBouazizOverride: boolean,
    periodRange?: { startDay: number; endDay: number } | null
  ) => void;
}

const GUARD_TEAMS = ['A', 'B', 'C', 'D', 'E'];
const SHIFT_OPTIONS = ['Jour', 'Nuit', 'RE'];

export const GuardRotationModal: React.FC<GuardRotationModalProps> = ({
  isOpen,
  onClose,
  currentRotationOrder = DEFAULT_GUARD_ROTATION_ORDER,
  currentMonthOffsetDays = 0,
  onApplyRotation,
}) => {
  const [order, setOrder] = useState<string[]>(
    currentRotationOrder.length === 5 ? currentRotationOrder : [...DEFAULT_GUARD_ROTATION_ORDER]
  );
  const [selectedScope, setSelectedScope] = useState<'perpetual' | 'period'>('perpetual');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(0);
  const [periodStartDay, setPeriodStartDay] = useState<number>(1);
  const [periodEndDay, setPeriodEndDay] = useState<number>(15);
  const [includeBouazizOverride, setIncludeBouazizOverride] = useState<boolean>(true);

  // User cell edits inside preview
  const [customOverrides, setCustomOverrides] = useState<Record<string, Record<number, string>>>({});
  
  // Mandatory confirmation state
  const [showConfirmApply, setShowConfirmApply] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  if (!isOpen) return null;

  const currentMonth = GUARD_MONTHS_PRESETS[selectedMonthIdx] || GUARD_MONTHS_PRESETS[0];

  const moveTeam = (index: number, direction: 'left' | 'right') => {
    const newIdx = direction === 'left' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= order.length) return;
    const next = [...order];
    const temp = next[index];
    next[index] = next[newIdx];
    next[newIdx] = temp;
    setOrder(next);
  };

  const handleSetStartTeam = (team: string) => {
    const idx = order.indexOf(team);
    if (idx === -1) return;
    const next = [...order.slice(idx), ...order.slice(0, idx)];
    setOrder(next);
  };

  // Toggle cell shift value on click (Jour -> Nuit -> RE -> Jour)
  const handleToggleCellShift = (teamLetter: string, day: number, currentVal: string) => {
    const nextVal =
      currentVal === 'Jour' ? 'Nuit' : currentVal === 'Nuit' ? 'RE' : 'Jour';
    setCustomOverrides((prev) => ({
      ...prev,
      [teamLetter]: {
        ...(prev[teamLetter] || {}),
        [day]: nextVal,
      },
    }));
  };

  const handleResetOverrides = () => {
    setCustomOverrides({});
  };

  const handleConfirmApply = () => {
    const offset = selectedScope === 'perpetual' ? currentMonth.cumulativeOffsetDays : 0;
    const periodRange =
      selectedScope === 'period'
        ? {
            startDay: Math.min(periodStartDay, periodEndDay),
            endDay: Math.max(periodStartDay, periodEndDay),
          }
        : null;

    onApplyRotation(
      order,
      offset,
      currentMonth.daysCount,
      includeBouazizOverride,
      periodRange
    );
    setShowConfirmApply(false);
    onClose();
  };

  const handleRequestClose = () => {
    const hasModifications =
      JSON.stringify(order) !== JSON.stringify(currentRotationOrder) ||
      Object.keys(customOverrides).length > 0;

    if (hasModifications) {
      setShowConfirmCancel(true);
    } else {
      onClose();
    }
  };

  // Preview days count: 5 days or the period length
  const previewDays =
    selectedScope === 'period'
      ? Array.from(
          {
            length: Math.min(
              10,
              Math.max(periodStartDay, periodEndDay) - Math.min(periodStartDay, periodEndDay) + 1
            ),
          },
          (_, i) => Math.min(periodStartDay, periodEndDay) + i
        )
      : [1, 2, 3, 4, 5];

  const previewMap = GUARD_TEAMS.reduce<Record<string, Record<number, string>>>((acc, t) => {
    const baseActivity = buildContinuousGuard16hActivity(
      t,
      order,
      selectedScope === 'perpetual' ? currentMonth.cumulativeOffsetDays : 0,
      31,
      includeBouazizOverride
    );
    // Apply user manual edits in preview
    const teamOverrides = customOverrides[t] || {};
    acc[t] = { ...baseActivity, ...teamOverrides };
    return acc;
  }, {});

  const hasManualEdits = Object.keys(customOverrides).length > 0;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-slate-950 border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 flex-wrap">
                <span>Rotation des Équipes de Garde (16h)</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                  Paramédical Garde
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Réordonnez les équipes pour une période spécifique ou en cycle perpétuel continu.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            aria-label="Fermer"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1 overflow-y-auto text-xs">
          {/* Information Notice */}
          <div className="p-3 bg-sky-950/40 border border-sky-800/80 rounded-xl flex items-start gap-2.5 text-sky-200">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block text-xs">Gestion de l'ordre de garde :</span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Dans les tableaux officiels, les agents restent groupés par équipe (A, B, C, D, E) sans déplacement des effectifs.
                Cette boîte de dialogue permet de changer l'ordre de passage pour les gardes de <strong>Matin (Jour)</strong> et <strong>Nuit</strong> soit pour une <strong>période spécifique</strong>, soit de façon <strong>continue et perpétuelle</strong>.
              </p>
            </div>
          </div>

          {/* APPLICATION SCOPE SELECTOR */}
          <div>
            <div className="text-slate-300 font-semibold mb-2 flex items-center gap-1.5 text-xs">
              <Repeat className="w-3.5 h-3.5 text-sky-400" />
              <span>Portée de l'application :</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedScope('perpetual')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedScope === 'perpetual'
                    ? 'bg-sky-950/80 border-sky-500 text-white ring-1 ring-sky-500 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between text-white">
                  <span>Continuel & Perpétuel</span>
                  {selectedScope === 'perpetual' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Applique la rotation sur l'ensemble du mois et s'enchaîne automatiquement et sans coupure dans les mois suivants.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedScope('period')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedScope === 'period'
                    ? 'bg-amber-950/80 border-amber-500 text-white ring-1 ring-amber-500 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between text-white">
                  <span>Juste pour une Période</span>
                  {selectedScope === 'period' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Modifie la séquence de garde uniquement sur un intervalle de jours choisi (ex: Jours 10 à 20), sans toucher au reste.
                </div>
              </button>
            </div>
          </div>

          {/* PERIOD RANGE SELECTOR (Visible when scope is period) */}
          {selectedScope === 'period' && (
            <div className="p-3.5 sm:p-4 bg-amber-950/30 border border-amber-800/80 rounded-xl space-y-3 animate-in fade-in duration-150">
              <div className="text-amber-300 font-semibold text-xs flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Définir la période d'application (Jours 1 à 31) :</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1">
                    Jour de début :
                  </label>
                  <select
                    value={periodStartDay}
                    onChange={(e) => setPeriodStartDay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-amber-500 font-mono min-h-[38px]"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
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
                    value={periodEndDay}
                    onChange={(e) => setPeriodEndDay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-xs focus:outline-none focus:border-amber-500 font-mono min-h-[38px]"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        Jour {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Period Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10.5px] text-slate-400">Périodes courantes :</span>
                {[
                  { label: 'Jours 1 à 15 (1ère quinzaine)', s: 1, e: 15 },
                  { label: 'Jours 16 à 31 (2ème quinzaine)', s: 16, e: 31 },
                  { label: 'Jours 10 à 20 (Décade)', s: 10, e: 20 },
                  { label: 'Jours 1 à 7 (1ère semaine)', s: 1, e: 7 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setPeriodStartDay(preset.s);
                      setPeriodEndDay(preset.e);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[10.5px] transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* REORDERING SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Ordre de succession des 5 équipes (cycle de 5 jours) :</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {order.map((t, idx) => `Équipe ${t}${idx < 4 ? ' → ' : ''}`)}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {order.map((teamLetter, idx) => (
                <div
                  key={teamLetter}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-2 sm:p-2.5 flex flex-col items-center justify-between gap-1.5 relative group hover:border-slate-700 transition-colors"
                >
                  <span className="text-[10px] text-slate-400 font-mono">Rang #{idx + 1}</span>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center font-bold text-sky-400 text-sm sm:text-base shadow-sm">
                    {teamLetter}
                  </div>
                  <div className="flex items-center gap-1 w-full justify-center">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveTeam(idx, 'left')}
                      title="Déplacer vers la gauche"
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === order.length - 1}
                      onClick={() => moveTeam(idx, 'right')}
                      title="Déplacer vers la droite"
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 transition-colors"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick starting team selection */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400">Équipe qui commence au Jour 1 :</span>
              {GUARD_TEAMS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleSetStartTeam(t)}
                  className={`px-2.5 py-1 rounded font-bold transition-colors min-h-[30px] ${
                    order[0] === t
                      ? 'bg-sky-600 text-white shadow'
                      : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  Groupe {t}
                </button>
              ))}
            </div>
          </div>

          {/* MONTH CONTINUITY SELECTION (If perpetual) */}
          {selectedScope === 'perpetual' && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-slate-300 font-semibold flex items-center gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>Mois de départ & continuité perpétuelle :</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GUARD_MONTHS_PRESETS.map((m, idx) => {
                  const isSelected = selectedMonthIdx === idx;
                  return (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => setSelectedMonthIdx(idx)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-sky-950/80 border-sky-500 text-white ring-1 ring-sky-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs text-white flex items-center justify-between">
                        <span>{m.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {m.daysCount} j · +{m.cumulativeOffsetDays}j
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SIMULATION PREVIEW & DIRECT EDITING */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-300 font-semibold text-xs">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Aperçu du roulement (Matin / Nuit / Récupération) :</span>
                <span className="text-[10px] text-amber-400 font-normal ml-1">
                  (Édition active : Clic sur une cellule pour changer Jour/Nuit/RE)
                </span>
              </span>
              <div className="flex items-center gap-2">
                {hasManualEdits && (
                  <button
                    type="button"
                    onClick={handleResetOverrides}
                    className="text-[10px] text-amber-300 hover:underline flex items-center gap-1 font-normal"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Réinitialiser modifications manuelles
                  </button>
                )}
                <span className="text-[10px] text-slate-500 font-normal">
                  {selectedScope === 'period'
                    ? `Jours ${Math.min(periodStartDay, periodEndDay)} à ${Math.max(periodStartDay, periodEndDay)}`
                    : `${currentMonth.name} · Cycle 5 jours`}
                </span>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-900/40">
              <table className="w-full text-center text-xs border-collapse min-w-[340px]">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 h-7 text-[11px]">
                    <th className="px-3 text-left w-24">Équipe</th>
                    {previewDays.map((d) => (
                      <th key={d} className="px-1.5 font-medium">
                        Jour {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {GUARD_TEAMS.map((teamLetter) => {
                    const days = previewMap[teamLetter] || {};
                    return (
                      <tr key={teamLetter} className="h-9 hover:bg-slate-900/50 transition-colors">
                        <td className="px-3 text-left font-bold text-white text-[11px]">
                          Groupe {teamLetter}
                        </td>
                        {previewDays.map((d) => {
                          const val = days[d] || 'RE';
                          const isJour = val === 'Jour';
                          const isNuit = val === 'Nuit';
                          const isCustom = customOverrides[teamLetter]?.[d] !== undefined;

                          return (
                            <td key={d} className="px-1 py-1">
                              <button
                                type="button"
                                onClick={() => handleToggleCellShift(teamLetter, d, val)}
                                title={`Modifier le créneau pour Groupe ${teamLetter} au Jour ${d} (Actuel: ${val}) - Clic pour changer`}
                                className={`px-2 py-1 rounded text-[10px] sm:text-[10.5px] font-bold transition-transform active:scale-95 cursor-pointer relative shadow-sm ${
                                  isJour
                                    ? 'bg-sky-500 hover:bg-sky-400 text-white'
                                    : isNuit
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                } ${isCustom ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950' : ''}`}
                              >
                                <span>{val}</span>
                                {isCustom && (
                                  <span
                                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400"
                                    title="Modifié manuellement dans l'aperçu"
                                  />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend for preview */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10.5px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-sky-500" />
                  <span>Jour (Matin)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-600" />
                  <span>Nuit (Garde)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-800" />
                  <span>RE (Récupération)</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                Clic sur un badge = alterne Jour → Nuit → RE
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRequestClose}
            className="px-4 py-2.5 sm:py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl font-semibold transition-colors text-xs min-h-[40px] flex items-center justify-center"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={() => setShowConfirmApply(true)}
            className={`px-5 py-2.5 sm:py-2 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 text-xs min-h-[40px] ${
              selectedScope === 'period'
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-sky-600 hover:bg-sky-500 text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>
              {selectedScope === 'period'
                ? `Appliquer à la Période (Jours ${Math.min(periodStartDay, periodEndDay)}–${Math.max(periodStartDay, periodEndDay)})`
                : `Appliquer la Rotation Continue (${currentMonth.name})`}
            </span>
          </button>
        </div>
      </div>

      {/* MANDATORY CONFIRMATION DIALOG FOR APPLYING ROTATION */}
      {showConfirmApply && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-slate-950 border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-2.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Confirmation de rotation
                </h3>
                <p className="text-xs text-slate-400">
                  Application aux plannings officiels
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Êtes-vous sûr de vouloir appliquer cette rotation des équipes de garde (16h) ?
              {selectedScope === 'period'
                ? ` Les gardes de la période (Jours ${Math.min(periodStartDay, periodEndDay)} à ${Math.max(periodStartDay, periodEndDay)}) seront recalculées pour l'ensemble des agents paramédicaux.`
                : ` L'ensemble des 30/31 jours sera mis à jour avec le cycle continu (${order.join(' → ')}).`}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmApply(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleConfirmApply}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg"
              >
                Oui, appliquer la rotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY CONFIRMATION DIALOG FOR CANCEL / DISMISS */}
      {showConfirmCancel && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-slate-950 border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Abandonner les modifications ?
                </h3>
                <p className="text-xs text-slate-400">
                  Modifications de roulement non enregistrées
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Vous avez modifié l'ordre de garde ou les cellules du roulement. Si vous fermez maintenant, ces modifications seront perdues.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmCancel(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Continuer l'édition
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmCancel(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg"
              >
                Oui, fermer sans enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
