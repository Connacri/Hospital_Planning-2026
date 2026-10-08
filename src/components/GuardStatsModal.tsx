import React, { useState, useMemo } from 'react';
import { StaffEntity, DayColumnMeta } from '../db/objectboxEngine';
import {
  BarChart3,
  X,
  Download,
  Search,
  CheckCircle2,
  Calendar,
  Award,
} from 'lucide-react';

interface GuardStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffEntity[];
  daysColumns: DayColumnMeta[];
  monthName: string;
}

export interface AgentStats {
  id: number;
  fullName: string;
  category: string;
  teamGroup: string;
  nuitCount: number;
  reCount: number;
  jourCount: number;
  congeCount: number;
  weekendGuardCount: number; // Night guards on Friday/Saturday
  totalServices: number;
}

export const GuardStatsModal: React.FC<GuardStatsModalProps> = ({
  isOpen,
  onClose,
  staffList,
  daysColumns,
  monthName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const blackDaysSet = useMemo(() => {
    return new Set(daysColumns.filter((d) => d.isBlackColumn).map((d) => d.day));
  }, [daysColumns]);

  const stats: AgentStats[] = useMemo(() => {
    return staffList.map((staff) => {
      let nuitCount = 0;
      let reCount = 0;
      let jourCount = 0;
      let congeCount = 0;
      let weekendGuardCount = 0;
      let totalServices = 0;

      Object.entries(staff.dailyActivity || {}).forEach(([dayStr, code]) => {
        const day = Number(dayStr);
        const upper = (code || '').trim().toUpperCase();

        if (upper === 'N' || upper === 'NUIT' || upper === 'G') {
          nuitCount++;
          if (blackDaysSet.has(day)) {
            weekendGuardCount++;
          }
        } else if (upper === 'RE' || upper === 'R') {
          reCount++;
        } else if (upper === 'JOUR' || upper === 'J' || upper === '12H') {
          jourCount++;
        } else if (
          upper === 'C' ||
          upper === 'CM' ||
          upper === 'M' ||
          upper === 'F' ||
          upper.includes('CONGÉ')
        ) {
          congeCount++;
        }

        if (upper && upper !== 'RE' && upper !== 'R') {
          totalServices++;
        }
      });

      return {
        id: staff.id,
        fullName: staff.fullName,
        category: staff.category,
        teamGroup: staff.teamGroup,
        nuitCount,
        reCount,
        jourCount,
        congeCount,
        weekendGuardCount,
        totalServices,
      };
    });
  }, [staffList, blackDaysSet]);

  const filteredStats = useMemo(() => {
    return stats.filter((s) => {
      const matchCat =
        selectedCategory === 'all' || s.category === selectedCategory;
      const matchSearch =
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.teamGroup.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [stats, selectedCategory, searchTerm]);

  // Overall totals
  const totals = useMemo(() => {
    return filteredStats.reduce(
      (acc, s) => {
        acc.nuit += s.nuitCount;
        acc.re += s.reCount;
        acc.jour += s.jourCount;
        acc.conge += s.congeCount;
        acc.weekend += s.weekendGuardCount;
        return acc;
      },
      { nuit: 0, re: 0, jour: 0, conge: 0, weekend: 0 }
    );
  }, [filteredStats]);

  const handleExportCSV = () => {
    const headers = [
      'Nom et Prénom',
      'Catégorie',
      'Groupe',
      'Gardes Nuit (N)',
      'Repos (RE)',
      'Services Jour',
      'Congés (C/CM)',
      'Gardes Week-end (Ven/Sam)',
      'Total Activités',
    ];

    const rows = filteredStats.map((s) => [
      `"${s.fullName}"`,
      `"${s.category}"`,
      `"${s.teamGroup || '-'}"`,
      s.nuitCount,
      s.reCount,
      s.jourCount,
      s.congeCount,
      s.weekendGuardCount,
      s.totalServices,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Recapitulatif_Gardes_${monthName.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Compteur & Équité des Gardes — {monthName}</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {staffList.length} agents
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Service de Rhumatologie — Établissement Hospitalier d'Aïn El Türck
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Summary Cards */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/50 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Gardes Nuit (N)
            </span>
            <div className="text-2xl font-bold text-white mt-1">
              {totals.nuit}
            </div>
            <div className="text-[10px] text-slate-400">
              Moy. {(totals.nuit / Math.max(1, filteredStats.length)).toFixed(1)} / agent
            </div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Gardes Week-end
            </span>
            <div className="text-2xl font-bold text-white mt-1">
              {totals.weekend}
            </div>
            <div className="text-[10px] text-slate-400">Ven & Sam noirs</div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Repos (RE)
            </span>
            <div className="text-2xl font-bold text-white mt-1">{totals.re}</div>
            <div className="text-[10px] text-slate-400">Récupérations</div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-sky-400">
              Services Jour
            </span>
            <div className="text-2xl font-bold text-white mt-1">
              {totals.jour}
            </div>
            <div className="text-[10px] text-slate-400">08h–16h & 12h</div>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-semibold text-purple-400">
              Congés (C/CM)
            </span>
            <div className="text-2xl font-bold text-white mt-1">
              {totals.conge}
            </div>
            <div className="text-[10px] text-slate-400">Jours ouvrés</div>
          </div>
        </div>

        {/* Filters and Actions Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filtrer par nom ou groupe (A, B, C...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
            >
              <option value="all">Toutes les catégories</option>
              <option value="medical">Personnel Médical</option>
              <option value="paramedical_guard">Garde Paramédicale (A–E)</option>
              <option value="paramedical_day">Paramédical Jour (08h–16h)</option>
              <option value="hygiene">Agents d'Hygiène (12h)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter en CSV / Excel</span>
          </button>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <th className="py-2.5 px-3">Agent</th>
                <th className="py-2.5 px-3">Catégorie</th>
                <th className="py-2.5 px-3 text-center">Groupe</th>
                <th className="py-2.5 px-3 text-center text-amber-400">Gardes Nuit</th>
                <th className="py-2.5 px-3 text-center text-rose-400">Gardes W-E</th>
                <th className="py-2.5 px-3 text-center text-emerald-400">Repos RE</th>
                <th className="py-2.5 px-3 text-center text-sky-400">Jour</th>
                <th className="py-2.5 px-3 text-center text-purple-400">Congés</th>
                <th className="py-2.5 px-3 text-center font-bold text-white">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredStats.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Aucun agent trouvé avec ces critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredStats.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium text-white">
                      {s.fullName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 capitalize">
                      {s.category.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {s.teamGroup ? (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-bold">
                          Gr. {s.teamGroup}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-amber-300">
                      {s.nuitCount}
                    </td>
                    <td className="py-2.5 px-3 text-center font-semibold text-rose-300">
                      {s.weekendGuardCount}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-emerald-300">
                      {s.reCount}
                    </td>
                    <td className="py-2.5 px-3 text-center text-sky-300">
                      {s.jourCount}
                    </td>
                    <td className="py-2.5 px-3 text-center text-purple-300">
                      {s.congeCount}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-white">
                      {s.totalServices}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Affichage de <strong>{filteredStats.length}</strong> agents sur {staffList.length}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
