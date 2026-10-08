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

  const handleApply = () => {
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
    onClose();
  };

  const handleResetDefault = () => {
    setOrder([...DEFAULT_GUARD_ROTATION_ORDER]);
    setSelectedMonthIdx(0);
    setSelectedScope('perpetual');
  };

  // Preview days count: 5 days or the period length
  const previewDays =
    selectedScope === 'period'
      ? Array.from(
          { length: Math.min(7, Math.max(periodStartDay, periodEndDay) - Math.min(periodStartDay, periodEndDay) + 1) },
          (_, i) => Math.min(periodStartDay, periodEndDay) + i
        )
      : [1, 2, 3, 4, 5];

  const previewMap = GUARD_TEAMS.reduce<Record<string, Record<number, string>>>((acc, t) => {
    acc[t] = buildContinuousGuard16hActivity(
      t,
      order,
      selectedScope === 'perpetual' ? currentMonth.cumulativeOffsetDays : 0,
      31,
      includeBouazizOverride
    );
    return acc;
  }, {});

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
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
            onClick={onClose}
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
                  { label: 'Jours 1–7 (Semaine 1)', s: 1, e: 7 },
                  { label: 'Jours 8–14 (Semaine 2)', s: 8, e: 14 },
                  { label: 'Jours 15–21 (Semaine 3)', s: 15, e: 21 },
                  { label: 'Jours 22–31 (Fin de mois)', s: 22, e: 31 },
                  { label: 'Jours 1–15 (1ère Quinzaine)', s: 1, e: 15 },
                  { label: 'Jours 16–31 (2ème Quinzaine)', s: 16, e: 31 },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setPeriodStartDay(p.s);
                      setPeriodEndDay(p.e);
                    }}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10px] min-h-[28px]"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TEAM REORDERING CHAIN */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-300 font-semibold text-xs">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Ordre de passage des équipes (Matin / Jour ➔ Nuit) :</span>
              </span>
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 self-start sm:self-auto min-h-[28px]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Réinitialiser (A ➔ D ➔ B ➔ E ➔ C)</span>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1 overflow-x-auto">
              {order.map((team, idx) => (
                <div
                  key={team}
                  className="p-2 sm:p-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-center flex flex-col items-center justify-between gap-1 shadow-sm min-w-[56px]"
                >
                  <span className="text-[10px] text-slate-400 font-mono">
                    #{idx + 1}
                  </span>
                  <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-lg bg-sky-600/20 text-sky-300 font-bold text-sm sm:text-base flex items-center justify-center border border-sky-500/30">
                    {team}
                  </div>
                  <div className="text-[9.5px] sm:text-[10px] text-slate-300 font-semibold truncate">
                    Grp {team}
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 mt-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveTeam(idx, 'left')}
                      className={`p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 min-h-[28px] min-w-[24px] flex items-center justify-center ${
                        idx === 0 ? 'opacity-20 cursor-not-allowed' : ''
                      }`}
                      title="Déplacer vers la gauche"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === order.length - 1}
                      onClick={() => moveTeam(idx, 'right')}
                      className={`p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 min-h-[28px] min-w-[24px] flex items-center justify-center ${
                        idx === order.length - 1 ? 'opacity-20 cursor-not-allowed' : ''
                      }`}
                      title="Déplacer vers la droite"
                    >
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick starting team selection */}
            <div className="pt-2 flex flex-wrap items-center gap-1.5 sm:gap-2 text-slate-400 text-[11px]">
              <span>Équipe prenant le Matin (Jour 1) :</span>
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

          {/* SIMULATION PREVIEW */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-300 font-semibold text-xs">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Aperçu du roulement (Matin / Nuit / Récupération) :</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                {selectedScope === 'period'
                  ? `Jours ${Math.min(periodStartDay, periodEndDay)} à ${Math.max(periodStartDay, periodEndDay)}`
                  : `${currentMonth.name} · Cycle 5 jours`}
              </span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-900/40">
              <table className="w-full text-center text-xs border-collapse min-w-[340px]">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 h-7 text-[11px]">
                    <th className="px-3 text-left w-24">Équipe</th>
                    {previewDays.map((d) => (
                      <th key={d} className="px-1.5">
                        Jour {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {GUARD_TEAMS.map((teamLetter) => {
                    const days = previewMap[teamLetter] || {};
                    return (
                      <tr key={teamLetter} className="h-8">
                        <td className="px-3 text-left font-bold text-white text-[11px]">
                          Groupe {teamLetter}
                        </td>
                        {previewDays.map((d) => {
                          const val = days[d] || 'RE';
                          const isJour = val === 'Jour';
                          const isNuit = val === 'Nuit';
                          return (
                            <td key={d} className="px-1.5">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded text-[10px] sm:text-[10.5px] font-bold ${
                                  isJour
                                    ? 'bg-sky-500 text-white'
                                    : isNuit
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {val}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 sm:py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl font-semibold transition-colors text-xs min-h-[40px] flex items-center justify-center"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleApply}
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
    </div>
  );
};
