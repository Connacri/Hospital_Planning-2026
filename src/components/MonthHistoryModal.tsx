import React, { useState, useMemo } from 'react';
import {
  Calendar,
  X,
  Search,
  Plus,
  Check,
  RotateCcw,
  Trash2,
  Copy,
  Clock,
  Sparkles,
  Layers,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  objectBoxStore,
  MonthHistoryItem,
  HospitalDocumentConfig,
  StaffEntity,
} from '../db/objectboxEngine';

interface MonthHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: HospitalDocumentConfig;
  onMonthChanged: (monthName: string) => void;
  onOpenCreateCustomMonth?: () => void;
}

type FilterType = 'all' | 'normal' | 'modificatif';

export const MonthHistoryModal: React.FC<MonthHistoryModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onMonthChanged,
  onOpenCreateCustomMonth,
}) => {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyList, setHistoryList] = useState<MonthHistoryItem[]>(() =>
    objectBoxStore.getMonthHistory()
  );
  const [saveCustomName, setSaveCustomName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const refreshList = () => {
    setHistoryList(objectBoxStore.getMonthHistory());
  };

  React.useEffect(() => {
    if (isOpen) {
      refreshList();
      setDeleteConfirmId(null);
    }
  }, [isOpen]);

  const activeMonthName = currentConfig.guardMonthName || 'Octobre 2026';
  const isCurrentModificatif = !!currentConfig.isModificatif;

  // Filtered list
  const filteredList = useMemo(() => {
    return historyList.filter((item) => {
      // Type filter
      if (filterType === 'normal' && item.isModificatif) return false;
      if (filterType === 'modificatif' && !item.isModificatif) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesYear = String(item.year).includes(q);
        const matchesModif = item.isModificatif
          ? 'modificatif'.includes(q)
          : 'normal standard'.includes(q);
        return matchesName || matchesYear || matchesModif;
      }
      return true;
    });
  }, [historyList, filterType, searchQuery]);

  // Counts
  const totalCount = historyList.length;
  const normalCount = historyList.filter((i) => !i.isModificatif).length;
  const modificatifCount = historyList.filter((i) => i.isModificatif).length;

  if (!isOpen) return null;

  const handleLoadMonth = (id: string, name: string) => {
    const success = objectBoxStore.loadMonthFromHistory(id);
    if (success) {
      refreshList();
      onMonthChanged(name);
      onClose();
    }
  };

  const handleCreateNextMonth = () => {
    const next = objectBoxStore.createNextMonth(false);
    refreshList();
    onMonthChanged(next.monthName);
    onClose();
  };

  const handleDuplicateAsModificatif = (id: string) => {
    const record = objectBoxStore.duplicateMonthAsModificatif(id);
    if (record) {
      refreshList();
      onMonthChanged(record.name);
      onClose();
    }
  };

  const handleDeleteMonth = (id: string) => {
    const success = objectBoxStore.deleteMonthFromHistory(id);
    if (success) {
      refreshList();
      setDeleteConfirmId(null);
    }
  };

  const handleSaveCurrentAsVersion = () => {
    const name = saveCustomName.trim();
    objectBoxStore.saveCurrentToHistory(name || undefined);
    setSaveCustomName('');
    refreshList();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-950 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Historique des Mois Créés
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {totalCount} mois
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Consultez, restaurez et filtrez vos plannings mensuels (Normaux &amp; Modificatifs)
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

        {/* Toolbar: Filters & Search */}
        <div className="p-4 sm:p-5 bg-slate-900/60 border-b border-slate-800 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterType === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Tous ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('normal')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  filterType === 'normal'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Normaux ({normalCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('modificatif')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                  filterType === 'modificatif'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Modificatifs ({modificatifCount})</span>
              </button>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateNextMonth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                title="Créer le mois suivant en appliquant la continuité perpétuelle des équipes"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Mois Suivant (+1 mois)</span>
              </button>
              {onOpenCreateCustomMonth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCreateCustomMonth();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                  title="Choisir une année et un mois spécifique"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Personnalisé...</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Box & Quick Save */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par mois, année ou statut..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={saveCustomName}
                onChange={(e) => setSaveCustomName(e.target.value)}
                placeholder="Nom d'archivage (optionnel)"
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-44"
              />
              <button
                type="button"
                onClick={handleSaveCurrentAsVersion}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors shrink-0"
                title="Sauvegarder l'état actuel dans l'historique"
              >
                Sauvegarder l'état
              </button>
            </div>
          </div>
        </div>

        {/* Month Cards List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 flex flex-col items-center justify-center gap-2">
              <AlertCircle className="w-8 h-8 text-slate-600" />
              <p className="font-semibold text-slate-400">
                Aucun mois trouvé pour ce filtre ({filterType}).
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm">
                Vous pouvez créer le mois suivant en continuité ou réinitialiser les filtres de recherche.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilterType('all');
                  setSearchQuery('');
                }}
                className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
              >
                Afficher tous les mois
              </button>
            </div>
          ) : (
            filteredList.map((item) => {
              const isActive =
                item.name.toLowerCase().includes(activeMonthName.toLowerCase()) ||
                (activeMonthName.toLowerCase().includes(item.name.toLowerCase()) &&
                  item.isModificatif === isCurrentModificatif);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isActive
                      ? 'bg-indigo-950/30 border-indigo-500/60 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Month Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 ${
                        item.isModificatif
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-600/60'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-600/60'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-sans">Mois</span>
                      <span className="text-xs font-mono -mt-0.5">
                        {item.monthIndex + 1 < 10
                          ? `0${item.monthIndex + 1}`
                          : item.monthIndex + 1}
                      </span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {item.name}
                        </h3>

                        {/* Modificatif Pill */}
                        {item.isModificatif ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/70 shadow-xs">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            <span>(Modificatif)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/70 shadow-xs">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Normal / Standard</span>
                          </span>
                        )}

                        {/* Active Badge */}
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                            ★ Mois Actif
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                        <span>{item.daysCount} jours</span>
                        <span>•</span>
                        <span>{item.staffBox?.length || 0} agents</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{item.createdAt}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Switch / Activate */}
                    <button
                      type="button"
                      onClick={() => handleLoadMonth(item.id, item.name)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Recharger' : 'Activer'}</span>
                    </button>

                    {/* Duplicate as Modificatif */}
                    {!item.isModificatif && (
                      <button
                        type="button"
                        onClick={() => handleDuplicateAsModificatif(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800 transition-colors"
                        title="Créer une version modificative de ce mois"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Créer Modif</span>
                      </button>
                    )}

                    {/* Delete */}
                    {historyList.length > 1 && (
                      deleteConfirmId === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteMonth(item.id)}
                            className="px-2 py-1 text-[11px] font-bold bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            Confirmer
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-1 text-[11px] text-slate-400 hover:text-white"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(item.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Supprimer ce mois de l'historique"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Continuité perpétuelle active</span>
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
