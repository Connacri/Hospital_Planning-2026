import React, { useState } from 'react';
import {
  X,
  Download,
  CheckCircle2,
  FileSpreadsheet,
  Stethoscope,
  ShieldAlert,
  Sparkles,
  Users,
  Check,
  Printer,
  ChevronRight,
  Layers,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { HospitalDocumentConfig } from '../db/objectboxEngine';

export interface ExportTableOption {
  id: string;
  sheetId: string;
  orientation: 'portrait' | 'landscape';
  title: string;
  category: 'medical' | 'paramedical_day' | 'paramedical_guard' | 'hygiene';
  pageLabel: string;
  description: string;
  filename: string;
  badge: string;
  badgeColor: string;
}

export const EXPORTABLE_TABLES: ExportTableOption[] = [
  {
    id: 'landscape_med',
    sheetId: 'doc-sheet-l1',
    orientation: 'landscape',
    title: "Tableau d'Activité Médicale (08h - 16h)",
    category: 'medical',
    pageLabel: 'Paysage · Page 1',
    description: "Activité journalière 30/31 jours des médecins avec totalisations, congés et gardes",
    filename: "EH_AinElTurck_Tableau_Activite_Medical_08h-16h.pdf",
    badge: "08h - 16h",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: 'landscape_paramed_day',
    sheetId: 'doc-sheet-l2',
    orientation: 'landscape',
    title: "Tableau d'Activité Paramédicale de Jour (08h - 16h)",
    category: 'paramedical_day',
    pageLabel: 'Paysage · Page 2',
    description: "Personnel paramédical de jour (surveillant médical, ISP, IDE, ATS)",
    filename: "EH_AinElTurck_Tableau_Activite_Paramedical_Jour_08h-16h.pdf",
    badge: "08h - 16h",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    id: 'landscape_guard',
    sheetId: 'doc-sheet-l3',
    orientation: 'landscape',
    title: "Tableau de Garde Paramédicale (16h — Équipes A, B, C, D, E)",
    category: 'paramedical_guard',
    pageLabel: 'Paysage · Page 3 & 4',
    description: "Permanence et gardes de nuit par roulement d'équipes A, B, C, D, E",
    filename: "EH_AinElTurck_Tableau_Garde_Paramedicale_16h.pdf",
    badge: "Garde 16h",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
  },
  {
    id: 'landscape_hygiene',
    sheetId: 'doc-sheet-l4',
    orientation: 'landscape',
    title: "Tableau d'Activité Agents d'Hygiène (12h)",
    category: 'hygiene',
    pageLabel: 'Paysage · Page 5',
    description: "Permanence hygiène hospitalière et salubrité (roulement jour/nuit)",
    filename: "EH_AinElTurck_Tableau_Activite_Hygiene_12h.pdf",
    badge: "12h",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    id: 'portrait_p1',
    sheetId: 'doc-sheet-p1',
    orientation: 'portrait',
    title: "Planning Hebdomadaire des Médecins",
    category: 'medical',
    pageLabel: 'Portrait · Page 1',
    description: "Planning des affectations hebdomadaires (Dimanche au Jeudi : Service, DMO, Biothérapie, BenSmir, etc.)",
    filename: "EH_AinElTurck_Planning_Hebdomadaire_Medecins.pdf",
    badge: "Hebdo",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  {
    id: 'portrait_p2',
    sheetId: 'doc-sheet-p2',
    orientation: 'portrait',
    title: "Liste Nominative du Personnel Médical & Observations",
    category: 'medical',
    pageLabel: 'Portrait · Page 2',
    description: "Liste officielle des médecins, fonctions, horaires et observations (congés maternité, etc.)",
    filename: "EH_AinElTurck_Liste_Personnel_Medical_OBS.pdf",
    badge: "Nominatif",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
  },
  {
    id: 'portrait_p3',
    sheetId: 'doc-sheet-p3',
    orientation: 'portrait',
    title: "Planning du Personnel Paramédical & Hygiène",
    category: 'paramedical_day',
    pageLabel: 'Portrait · Page 3',
    description: "Répartition synthétique du personnel paramédical (Jour, Garde 16h) et hygiène",
    filename: "EH_AinElTurck_Planning_Paramedical_Synthese.pdf",
    badge: "Synthèse",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
  },
];

interface ExportSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: HospitalDocumentConfig;
  currentOrientation: 'portrait' | 'landscape';
  onExportSingleTable: (option: ExportTableOption) => Promise<void>;
  onExportSelectedTables: (options: ExportTableOption[]) => Promise<void>;
  isExporting: boolean;
  exportProgress: { current: number; total: number };
}

export const ExportSelectionModal: React.FC<ExportSelectionModalProps> = ({
  isOpen,
  onClose,
  config,
  currentOrientation,
  onExportSingleTable,
  onExportSelectedTables,
  isExporting,
  exportProgress,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    // Par défaut : sélectionne les tableaux correspondant à l'orientation active
    return EXPORTABLE_TABLES.filter((t) => t.orientation === currentOrientation).map((t) => t.id);
  });
  const [filterOrientation, setFilterOrientation] = useState<'all' | 'landscape' | 'portrait'>('all');

  if (!isOpen) return null;

  const visibleTables = EXPORTABLE_TABLES.filter(
    (t) => filterOrientation === 'all' || t.orientation === filterOrientation
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = visibleTables.map((t) => t.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const deselectAllVisible = () => {
    const visibleIds = new Set(visibleTables.map((t) => t.id));
    setSelectedIds((prev) => prev.filter((id) => !visibleIds.has(id)));
  };

  const handleExportSelected = () => {
    const selectedOptions = EXPORTABLE_TABLES.filter((t) => selectedIds.includes(t.id));
    if (selectedOptions.length === 0) return;
    onExportSelectedTables(selectedOptions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner text-amber-300">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  Exporter les Tableaux au Choix
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950">
                  Sur-Mesure
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Choisissez précisément les feuilles et tableaux à exporter en PDF A4 individuellement ou en lot
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar (if exporting) */}
        {isExporting && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-3 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2.5 text-xs font-bold text-amber-900">
              <Sparkles className="w-4 h-4 text-amber-600 animate-spin" />
              <span>
                Génération PDF en cours... Page {exportProgress.current} sur {exportProgress.total}
              </span>
            </div>
            <div className="w-40 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{
                  width: `${(exportProgress.current / Math.max(1, exportProgress.total)) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Filter Tabs & Quick Select */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterOrientation('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterOrientation === 'all'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous ({EXPORTABLE_TABLES.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterOrientation('landscape')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterOrientation === 'landscape'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paysage (4)
            </button>
            <button
              type="button"
              onClick={() => setFilterOrientation('portrait')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterOrientation === 'portrait'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Portrait (3)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllVisible}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Tout cocher
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              onClick={deselectAllVisible}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              Tout décocher
            </button>
          </div>
        </div>

        {/* Scrollable Table List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 divide-y divide-slate-100 flex-1">
          {visibleTables.map((table) => {
            const isSelected = selectedIds.includes(table.id);
            return (
              <div
                key={table.id}
                className={`pt-3 first:pt-0 group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl transition-all border ${
                  isSelected
                    ? 'bg-indigo-50/40 border-indigo-200/80 shadow-sm'
                    : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50/70'
                }`}
              >
                {/* Left: Checkbox + Info */}
                <div
                  className="flex items-start gap-3 cursor-pointer flex-1"
                  onClick={() => toggleSelect(table.id)}
                >
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 bg-white group-hover:border-slate-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">
                        {table.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${table.badgeColor}`}
                      >
                        {table.badge}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {table.pageLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {table.description}
                    </p>
                  </div>
                </div>

                {/* Right: Quick Action Single Export */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportSingleTable(table);
                    }}
                    title="Exporter uniquement ce tableau en PDF (1 page)"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-300" />
                    <span>Exporter ce tableau</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            <span className="font-bold text-slate-900">{selectedIds.length}</span> tableau(x) sélectionné(s) sur {visibleTables.length}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              Fermer
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0 || isExporting}
              onClick={handleExportSelected}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Exporter la sélection ({selectedIds.length} tableau{selectedIds.length > 1 ? 'x' : ''})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
