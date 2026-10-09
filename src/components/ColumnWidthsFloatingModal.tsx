import React, { useState } from 'react';
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Check,
  Eye,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Shield,
  Columns3,
} from 'lucide-react';
import {
  HospitalDocumentConfig,
  objectBoxStore,
  getColumnWidths,
  DEFAULT_COLUMN_WIDTHS,
  TableColumnWidthSettings,
} from '../db/objectboxEngine';

interface ColumnWidthsFloatingModalProps {
  config: HospitalDocumentConfig;
  isOpen: boolean;
  onClose: () => void;
  orientation: 'portrait' | 'landscape';
}

export const ColumnWidthsFloatingModal: React.FC<ColumnWidthsFloatingModalProps> = ({
  config,
  isOpen,
  onClose,
  orientation,
}) => {
  const [activeTab, setActiveTab] = useState<'landscape' | 'portrait'>(() => orientation);
  const [selectedLandscapeTable, setSelectedLandscapeTable] = useState<'medical' | 'paramedical_day' | 'guard' | 'hygiene'>('medical');
  const [selectedPortraitTable, setSelectedPortraitTable] = useState<'table1' | 'table2' | 'table3'>('table1');
  const [isMinimized, setIsMinimized] = useState(false);

  // Sync orientation with active tab when orientation changes
  React.useEffect(() => {
    setActiveTab(orientation);
  }, [orientation]);

  if (!isOpen) return null;

  const cw = getColumnWidths(config);

  const handleUpdate = (partial: Partial<TableColumnWidthSettings>) => {
    objectBoxStore.updateColumnWidths(partial);
  };

  const handleReset = () => {
    objectBoxStore.resetColumnWidths();
  };

  // Presets
  const applyPresetWideGrades = () => {
    handleUpdate({
      landscapeMedical: { name: 11.0, grade: 18.0 },
      landscapeParamedicalDay: { name: 10.0, grade: 14.0 },
      landscapeGuard: { name: 9.5, grade: 12.0, team: 3.4 },
      landscapeHygiene: { name: 10.0, grade: 14.0 },
    });
  };

  const applyPresetWideNames = () => {
    handleUpdate({
      landscapeMedical: { name: 14.0, grade: 15.5 },
      landscapeParamedicalDay: { name: 13.0, grade: 11.5 },
      landscapeGuard: { name: 12.0, grade: 10.5, team: 3.4 },
      landscapeHygiene: { name: 13.0, grade: 11.5 },
      portraitTable1: { name: 30.0 },
      portraitTable2: { name: 35.0, grade: 45.0, func: 20.0 },
      portraitTable3: { num: 8.0, name: 30.0, func: 30.0, obs: 32.0 },
    });
  };

  const applyPresetWideDays = () => {
    handleUpdate({
      landscapeMedical: { name: 9.0, grade: 14.0 },
      landscapeParamedicalDay: { name: 8.5, grade: 10.5 },
      landscapeGuard: { name: 8.5, grade: 9.5, team: 3.0 },
      landscapeHygiene: { name: 8.5, grade: 10.5 },
      portraitTable1: { name: 20.0 },
    });
  };

  const applyPresetWideTeam = () => {
    handleUpdate({
      landscapeGuard: { name: 9.5, grade: 10.5, team: 4.5 },
    });
  };

  // Render minimized floating pill
  if (isMinimized) {
    return (
      <div className="no-print fixed bottom-20 left-4 z-50">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-slate-900/95 hover:bg-slate-800 text-amber-300 hover:text-white border border-amber-500/40 shadow-2xl backdrop-blur-md text-xs font-semibold transition-all hover:scale-105 active:scale-95"
          title="Agrandir la fenêtre de réglage des largeurs de colonnes"
        >
          <SlidersHorizontal className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
          <span>Régler largeurs colonnes</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>
    );
  }

  // Calculate day widths remaining for current selected landscape table
  let currentNonDaySum = 0;
  if (selectedLandscapeTable === 'medical') {
    currentNonDaySum = cw.landscapeMedical.name + cw.landscapeMedical.grade;
  } else if (selectedLandscapeTable === 'paramedical_day') {
    currentNonDaySum = cw.landscapeParamedicalDay.name + cw.landscapeParamedicalDay.grade;
  } else if (selectedLandscapeTable === 'guard') {
    currentNonDaySum = cw.landscapeGuard.name + cw.landscapeGuard.grade + cw.landscapeGuard.team;
  } else if (selectedLandscapeTable === 'hygiene') {
    currentNonDaySum = cw.landscapeHygiene.name + cw.landscapeHygiene.grade;
  }
  const remainingDaysPct = Math.max(0, 100 - currentNonDaySum);
  const perDayPct = (remainingDaysPct / 31).toFixed(2);

  return (
    <div className="no-print fixed bottom-6 left-4 z-50 w-96 max-w-[calc(100vw-2rem)] bg-slate-950/95 text-white border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide">
              Réglage des Largeurs de Colonnes
            </h3>
            <p className="text-[10px] text-slate-400">
              Ajustement en temps réel pour l'écran et le PDF
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Réduire en bulle flottante"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Fermer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs (Landscape vs Portrait) */}
      <div className="p-2 bg-slate-900/60 border-b border-slate-800/80 flex gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('landscape')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'landscape'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>Tableaux Paysage (Activité)</span>
          {orientation === 'landscape' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Actuellement affiché" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('portrait')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'portrait'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>Tableaux Portrait</span>
          {orientation === 'portrait' && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Actuellement affiché" />
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-3.5 overflow-y-auto space-y-4 flex-1 text-xs">
        {/* LANDSCAPE CONTROLS */}
        {activeTab === 'landscape' && (
          <div className="space-y-3.5">
            {/* Table Selector */}
            <div>
              <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Sélectionner le tableau à ajuster :
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedLandscapeTable('medical')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    selectedLandscapeTable === 'medical'
                      ? 'bg-slate-800 border-amber-500/80 text-white shadow-sm'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <div className="font-bold text-[11px] truncate">1. Médecins (08h-16h)</div>
                  <div className="text-[9.5px] text-slate-400">Page 1 • Grades longs</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLandscapeTable('paramedical_day')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    selectedLandscapeTable === 'paramedical_day'
                      ? 'bg-slate-800 border-amber-500/80 text-white shadow-sm'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <div className="font-bold text-[11px] truncate">2. Paramédical Jour</div>
                  <div className="text-[9.5px] text-slate-400">Page 2 • 08h-16h</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLandscapeTable('guard')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    selectedLandscapeTable === 'guard'
                      ? 'bg-slate-800 border-amber-500/80 text-white shadow-sm'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <div className="font-bold text-[11px] truncate">3. Garde (16h)</div>
                  <div className="text-[9.5px] text-slate-400">Page 3 • Équipes A-E</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLandscapeTable('hygiene')}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    selectedLandscapeTable === 'hygiene'
                      ? 'bg-slate-800 border-amber-500/80 text-white shadow-sm'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <div className="font-bold text-[11px] truncate">4. Hygiène (12h)</div>
                  <div className="text-[9.5px] text-slate-400">Page 5 • Rotation</div>
                </button>
              </div>
            </div>

            {/* Sliders for Selected Table */}
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
              {/* MEDICAL TABLE */}
              {selectedLandscapeTable === 'medical' && (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Nom et Prénom :</span>
                      <span className="font-mono font-bold text-amber-400">
                        {cw.landscapeMedical.name.toFixed(1)} %
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={8}
                        max={18}
                        step={0.2}
                        value={cw.landscapeMedical.name}
                        onChange={(e) =>
                          handleUpdate({
                            landscapeMedical: {
                              ...cw.landscapeMedical,
                              name: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdate({
                              landscapeMedical: {
                                ...cw.landscapeMedical,
                                name: Math.max(8, Number((cw.landscapeMedical.name - 0.5).toFixed(1))),
                              },
                            })
                          }
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px]"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdate({
                              landscapeMedical: {
                                ...cw.landscapeMedical,
                                name: Math.min(18, Number((cw.landscapeMedical.name + 0.5).toFixed(1))),
                              },
                            })
                          }
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Grade :</span>
                      <span className="font-mono font-bold text-amber-400">
                        {cw.landscapeMedical.grade.toFixed(1)} %
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={10}
                        max={24}
                        step={0.2}
                        value={cw.landscapeMedical.grade}
                        onChange={(e) =>
                          handleUpdate({
                            landscapeMedical: {
                              ...cw.landscapeMedical,
                              grade: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdate({
                              landscapeMedical: {
                                ...cw.landscapeMedical,
                                grade: Math.max(10, Number((cw.landscapeMedical.grade - 0.5).toFixed(1))),
                              },
                            })
                          }
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px]"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdate({
                              landscapeMedical: {
                                ...cw.landscapeMedical,
                                grade: Math.min(24, Number((cw.landscapeMedical.grade + 0.5).toFixed(1))),
                              },
                            })
                          }
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      Recommandé : ≥ 16.5% pour que « Médecin Principal en Rhumatologie » tienne sur 1 ligne.
                    </p>
                  </div>
                </>
              )}

              {/* PARAMEDICAL DAY TABLE */}
              {selectedLandscapeTable === 'paramedical_day' && (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Nom et Prénom :</span>
                      <span className="font-mono font-bold text-amber-400">
                        {cw.landscapeParamedicalDay.name.toFixed(1)} %
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={8}
                        max={18}
                        step={0.2}
                        value={cw.landscapeParamedicalDay.name}
                        onChange={(e) =>
                          handleUpdate({
                            landscapeParamedicalDay: {
                              ...cw.landscapeParamedicalDay,
                              name: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Grade :</span>
                      <span className="font-mono font-bold text-amber-400">
                        {cw.landscapeParamedicalDay.grade.toFixed(1)} %
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={9}
                        max={20}
                        step={0.2}
                        value={cw.landscapeParamedicalDay.grade}
                        onChange={(e) =>
                          handleUpdate({
                            landscapeParamedicalDay: {
                              ...cw.landscapeParamedicalDay,
                              grade: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* GUARD 16H TABLE */}
              {selectedLandscapeTable === 'guard' && (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Nom et Prénom :</span>
                      <span className="font-mono font-bold text-amber-400">
                        {cw.landscapeGuard.name.toFixed(1)} %
                      </span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={16}
                      step={0.2}
                      value={cw.landscapeGuard.name}
                      onChange={(e) =>
                        handleUpdate({
                          landscapeGuard: {
                            ...cw.landscapeGuard,
                            name: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Grade :</span>
                      <span className="font-mono font-bold text-amber-400">
                        {cw.landscapeGuard.grade.toFixed(1)} %
                      </span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={18}
                      step={0.2}
                      value={cw.landscapeGuard.grade}
                      onChange={(e) =>
                        handleUpdate({
                          landscapeGuard: {
                            ...cw.landscapeGuard,
                            grade: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Colonne Équipe :</span>
                      <span className="font-mono font-bold text-amber-400">
                        {cw.landscapeGuard.team.toFixed(1)} %
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={2.0}
                        max={6.0}
                        step={0.2}
                        value={cw.landscapeGuard.team}
                        onChange={(e) =>
                          handleUpdate({
                            landscapeGuard: {
                              ...cw.landscapeGuard,
                              team: parseFloat(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdate({
                              landscapeGuard: {
                                ...cw.landscapeGuard,
                                team: Math.max(2.0, Number((cw.landscapeGuard.team - 0.2).toFixed(1))),
                              },
                            })
                          }
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px]"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdate({
                              landscapeGuard: {
                                ...cw.landscapeGuard,
                                team: Math.min(6.0, Number((cw.landscapeGuard.team + 0.2).toFixed(1))),
                              },
                            })
                          }
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* HYGIENE TABLE */}
              {selectedLandscapeTable === 'hygiene' && (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Nom et Prénom :</span>
                      <span className="font-mono font-bold text-amber-400">
                        {cw.landscapeHygiene.name.toFixed(1)} %
                      </span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={18}
                      step={0.2}
                      value={cw.landscapeHygiene.name}
                      onChange={(e) =>
                        handleUpdate({
                          landscapeHygiene: {
                            ...cw.landscapeHygiene,
                            name: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">Grade :</span>
                      <span className="font-mono font-bold text-amber-400">
                        {cw.landscapeHygiene.grade.toFixed(1)} %
                      </span>
                    </div>
                    <input
                      type="range"
                      min={9}
                      max={20}
                      step={0.2}
                      value={cw.landscapeHygiene.grade}
                      onChange={(e) =>
                        handleUpdate({
                          landscapeHygiene: {
                            ...cw.landscapeHygiene,
                            grade: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </>
              )}

              {/* Balance Bar: Visual Breakdown */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                  <span>Répartition horizontale :</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    31 Jours = {remainingDaysPct.toFixed(1)} % (~{perDayPct}%/j)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    style={{ width: `${currentNonDaySum}%` }}
                    className="bg-amber-500/80 transition-all duration-150"
                    title={`Fixe (Identité & Grade) : ${currentNonDaySum.toFixed(1)}%`}
                  />
                  <div
                    style={{ width: `${remainingDaysPct}%` }}
                    className="bg-emerald-500/80 transition-all duration-150"
                    title={`31 Colonnes journalières : ${remainingDaysPct.toFixed(1)}%`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PORTRAIT CONTROLS */}
        {activeTab === 'portrait' && (
          <div className="space-y-3.5">
            {/* Table Selector */}
            <div>
              <label className="block text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Sélectionner le tableau Portrait :
              </label>
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedPortraitTable('table1')}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    selectedPortraitTable === 'table1'
                      ? 'bg-slate-800 border-amber-500/80 text-white shadow-sm'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-[10.5px]">1. Médecins</div>
                  <div className="text-[9px] text-slate-400">Hebdomadaire</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPortraitTable('table2')}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    selectedPortraitTable === 'table2'
                      ? 'bg-slate-800 border-amber-500/80 text-white shadow-sm'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-[10.5px]">2. Personnel</div>
                  <div className="text-[9px] text-slate-400">Liste médicale</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPortraitTable('table3')}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    selectedPortraitTable === 'table3'
                      ? 'bg-slate-800 border-amber-500/80 text-white shadow-sm'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-[10.5px]">3. Paramédical</div>
                  <div className="text-[9px] text-slate-400">Complet</div>
                </button>
              </div>
            </div>

            {/* Portrait Table 1 */}
            {selectedPortraitTable === 'table1' && (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Nom et Prénom :</span>
                    <span className="font-mono font-bold text-amber-400">
                      {cw.portraitTable1.name.toFixed(1)} %
                    </span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={36}
                    step={0.5}
                    value={cw.portraitTable1.name}
                    onChange={(e) =>
                      handleUpdate({
                        portraitTable1: { name: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="text-[10px] text-emerald-400 font-mono mt-1">
                    5 jours (Dimanche-Jeudi) = {((100 - cw.portraitTable1.name) / 5).toFixed(1)} % par jour
                  </div>
                </div>
              </div>
            )}

            {/* Portrait Table 2 */}
            {selectedPortraitTable === 'table2' && (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Nom et Prénom :</span>
                    <span className="font-mono font-bold text-amber-400">
                      {cw.portraitTable2.name.toFixed(1)} %
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={40}
                    step={1}
                    value={cw.portraitTable2.name}
                    onChange={(e) =>
                      handleUpdate({
                        portraitTable2: { ...cw.portraitTable2, name: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Grade :</span>
                    <span className="font-mono font-bold text-amber-400">
                      {cw.portraitTable2.grade.toFixed(1)} %
                    </span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={60}
                    step={1}
                    value={cw.portraitTable2.grade}
                    onChange={(e) =>
                      handleUpdate({
                        portraitTable2: { ...cw.portraitTable2, grade: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Fonction :</span>
                    <span className="font-mono font-bold text-amber-400">
                      {cw.portraitTable2.func.toFixed(1)} %
                    </span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={35}
                    step={1}
                    value={cw.portraitTable2.func}
                    onChange={(e) =>
                      handleUpdate({
                        portraitTable2: { ...cw.portraitTable2, func: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Portrait Table 3 */}
            {selectedPortraitTable === 'table3' && (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">N° :</span>
                    <span className="font-mono font-bold text-amber-400">
                      {cw.portraitTable3.num.toFixed(1)} %
                    </span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={15}
                    step={0.5}
                    value={cw.portraitTable3.num}
                    onChange={(e) =>
                      handleUpdate({
                        portraitTable3: { ...cw.portraitTable3, num: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Nom et Prénom :</span>
                    <span className="font-mono font-bold text-amber-400">
                      {cw.portraitTable3.name.toFixed(1)} %
                    </span>
                  </div>
                  <input
                    type="range"
                    min={18}
                    max={35}
                    step={1}
                    value={cw.portraitTable3.name}
                    onChange={(e) =>
                      handleUpdate({
                        portraitTable3: { ...cw.portraitTable3, name: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Fonction :</span>
                    <span className="font-mono font-bold text-amber-400">
                      {cw.portraitTable3.func.toFixed(1)} %
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={40}
                    step={1}
                    value={cw.portraitTable3.func}
                    onChange={(e) =>
                      handleUpdate({
                        portraitTable3: { ...cw.portraitTable3, func: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Observation :</span>
                    <span className="font-mono font-bold text-amber-400">
                      {cw.portraitTable3.obs.toFixed(1)} %
                    </span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={45}
                    step={1}
                    value={cw.portraitTable3.obs}
                    onChange={(e) =>
                      handleUpdate({
                        portraitTable3: { ...cw.portraitTable3, obs: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Presets Bar */}
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Préréglages rapides en 1-clic :</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={applyPresetWideGrades}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-medium text-left truncate transition-colors"
              title="Élargit le grade pour que Médecin Principal en Rhumatologie ne dépasse pas"
            >
              🏷️ Grades larges (Recommandé)
            </button>
            <button
              type="button"
              onClick={applyPresetWideNames}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-medium text-left truncate transition-colors"
              title="Donne plus de place aux noms longs"
            >
              👤 Noms &amp; Prénoms larges
            </button>
            <button
              type="button"
              onClick={applyPresetWideTeam}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-medium text-left truncate transition-colors"
              title="Élargit la colonne Équipe sur le 3ème tableau de garde"
            >
              🛡️ Équipe élargie (3e tableau)
            </button>
            <button
              type="button"
              onClick={applyPresetWideDays}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-medium text-left truncate transition-colors"
              title="Resserre l'identité pour maximiser les colonnes des dates jours"
            >
              📅 Dates/Jours prioritaires
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          title="Réinitialiser les largeurs par défaut d'origine"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Réinitialiser</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Appliquer &amp; Fermer</span>
        </button>
      </div>
    </div>
  );
};
