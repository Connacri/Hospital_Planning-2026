import React from 'react';
import {
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  BarChart3,
  Layers,
} from 'lucide-react';

interface DocumentQuickNavigatorProps {
  orientation: 'portrait' | 'landscape';
  subPage: string; // 'all' | 'p1' | 'p2' | 'p3' | 'p4' | 'p5'
  onChangeSubPage: (page: string) => void;
  showDistributionChart: boolean;
  onToggleDistributionChart: () => void;
}

export const DocumentQuickNavigator: React.FC<DocumentQuickNavigatorProps> = ({
  orientation,
  subPage,
  onChangeSubPage,
  showDistributionChart,
  onToggleDistributionChart,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  const scrollToSheet = (sheetId: string, pageKey: string) => {
    // If the page is hidden because a single page filter is on, switch to that page or all
    if (subPage !== 'all' && subPage !== pageKey) {
      onChangeSubPage('all');
      setTimeout(() => {
        const el = document.getElementById(sheetId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return;
    }
    const el = document.getElementById(sheetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      onChangeSubPage(pageKey);
    }
  };

  const portraitPills = [
    { id: 'p1', sheetId: 'doc-sheet-p1-0', label: 'P.1', title: 'Page 1 — Planning des Médecins' },
    { id: 'p2', sheetId: 'doc-sheet-p2-0', label: 'P.2', title: 'Page 2 — Liste du Personnel Médical' },
    { id: 'p3', sheetId: 'doc-sheet-p3', label: 'P.3', title: 'Page 3 — Gardes Paramédical (16h)' },
  ];

  const landscapePills = [
    { id: 'p1', sheetId: 'doc-sheet-l1-0', label: 'P.1', title: 'Page 1 — Personnel Médical (08h-16h)' },
    { id: 'p2', sheetId: 'doc-sheet-l2-0', label: 'P.2', title: 'Page 2 — Paramédical Jour (08h-16h)' },
    { id: 'p3', sheetId: 'doc-sheet-l3-0', label: 'P.3', title: 'Page 3 — Gardes Paramédical (16h)' },
    { id: 'p4', sheetId: 'doc-sheet-l4-0', label: 'P.4', title: 'Page 4 — Agents d\'Hygiène (12h)' },
  ];

  const pills = orientation === 'portrait' ? portraitPills : landscapePills;

  return (
    <div
      role="navigation"
      aria-label="Navigation rapide des pages PDF"
      className="no-print fixed bottom-3 left-3 sm:bottom-5 sm:left-5 z-40 flex items-center gap-1 sm:gap-1.5 bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 p-1 sm:p-1.5 rounded-2xl shadow-2xl text-slate-200 select-none max-w-[calc(100vw-80px)] overflow-x-auto ring-1 ring-white/10"
    >
      {/* Scroll to Top */}
      <button
        type="button"
        onClick={scrollToTop}
        title="Remonter tout en haut de la page (Haut)"
        className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-semibold transition-colors shrink-0"
      >
        <ArrowUp className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span className="hidden md:inline text-[11px]">Haut</span>
      </button>

      {/* Mode View All */}
      <button
        type="button"
        onClick={() => onChangeSubPage('all')}
        title="Afficher toutes les pages l'une sous l'autre"
        className={`px-2 py-1.5 rounded-xl border text-[11px] font-bold transition-all shrink-0 ${
          subPage === 'all'
            ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
        }`}
      >
        <span className="hidden sm:inline">Toutes</span>
        <span className="sm:hidden">1-{pills.length}</span>
      </button>

      {/* Page Jump Pills */}
      <div className="flex items-center gap-1 shrink-0">
        {pills.map((p) => {
          const isSingleActive = subPage === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => scrollToSheet(p.sheetId, p.id)}
              title={p.title}
              className={`px-2 sm:px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                isSingleActive
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm ring-1 ring-indigo-400/30'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Scroll to Bottom (Signatures / Approvals) */}
      <button
        type="button"
        onClick={scrollToBottom}
        title="Descendre directement tout en bas de la page (Signatures, DAPM &amp; Direction)"
        className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 text-xs font-semibold transition-colors shrink-0"
      >
        <span className="hidden md:inline text-[11px]">Bas</span>
        <ArrowDown className="w-3.5 h-3.5 text-sky-400 shrink-0" />
      </button>

      {/* Toggle Presence Statistics */}
      <button
        type="button"
        onClick={onToggleDistributionChart}
        title={showDistributionChart ? 'Masquer le graphique pour réduire le scroll' : 'Afficher le graphique de présence'}
        className={`hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-xl border text-[11px] font-semibold transition-colors shrink-0 ${
          showDistributionChart
            ? 'bg-amber-950/70 border-amber-700 text-amber-300'
            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
        }`}
      >
        <BarChart3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>Stats</span>
      </button>
    </div>
  );
};
