import React, { useState } from 'react';
import {
  X,
  ArrowUpDown,
  GripVertical,
  Users,
  ShieldCheck,
  Stethoscope,
  Briefcase,
  Layers,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  SlidersHorizontal,
  Download,
  Info,
} from 'lucide-react';
import {
  StaffEntity,
  StaffCategory,
  objectBoxStore,
  getGradeRank,
  getTeamBadgeClass,
  getTeamTheme,
} from '../db/objectboxEngine';

interface TableOrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffEntity[];
  initialCategory?: StaffCategory;
  onShowToast: (msg: string) => void;
}

export const TableOrganizerModal: React.FC<TableOrganizerModalProps> = ({
  isOpen,
  onClose,
  staffList,
  initialCategory = 'medical',
  onShowToast,
}) => {
  const [activeCategory, setActiveCategory] = useState<StaffCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetOrientation, setTargetOrientation] = useState<'both' | 'portrait' | 'landscape'>('both');
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setActiveCategory(initialCategory);
      setSearchQuery('');
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  // Filter staff by current active category
  const currentCategoryStaff = staffList
    .filter((s) => s.category === activeCategory)
    .sort((a, b) => {
      if (targetOrientation === 'landscape') {
        return a.landscapeOrder - b.landscapeOrder || a.id - b.id;
      }
      return a.portraitOrder - b.portraitOrder || a.id - b.id;
    });

  const q = searchQuery.toLowerCase().trim();
  const filteredStaff = currentCategoryStaff.filter(
    (s) =>
      !q ||
      s.fullName.toLowerCase().includes(q) ||
      (s.gradeLandscape && s.gradeLandscape.toLowerCase().includes(q)) ||
      (s.rolePortrait && s.rolePortrait.toLowerCase().includes(q)) ||
      (s.teamGroup && s.teamGroup.toLowerCase().includes(q))
  );

  const handleSort = (criteria: 'team' | 'name' | 'grade', direction: 'asc' | 'desc' = 'asc') => {
    objectBoxStore.sortStaffByCategory(activeCategory, criteria, direction, targetOrientation);
    const label =
      criteria === 'team'
        ? "par Équipe (A-E)"
        : criteria === 'name'
        ? direction === 'asc' ? "par Nom (A-Z)" : "par Nom (Z-A)"
        : "par Grade / Hiérarchie";
    onShowToast(`Tableau réorganisé ${label} pour ${getCategoryLabel(activeCategory)}`);
  };

  const handleMove = (sourceId: number, targetId: number) => {
    objectBoxStore.moveStaffItem(activeCategory, sourceId, targetId, targetOrientation);
    setDraggedId(null);
    setDragOverId(null);
    onShowToast(`Position déplacée avec succès`);
  };

  const handleStepMove = (staffId: number, direction: 'up' | 'down') => {
    const idx = currentCategoryStaff.findIndex((s) => s.id === staffId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentCategoryStaff.length) return;
    const targetId = currentCategoryStaff[targetIdx].id;
    handleMove(staffId, targetId);
  };

  function getCategoryLabel(cat: StaffCategory): string {
    switch (cat) {
      case 'medical':
        return 'Personnel Médical (Médecins)';
      case 'paramedical_day':
        return 'Paramédical de Jour (08h-16h)';
      case 'paramedical_guard':
        return 'Paramédical de Garde (16h)';
      case 'hygiene':
        return "Agents d'Hygiène (12h)";
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-sky-300 shadow-inner">
              <ArrowUpDown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  Organiser & Trier les Tableaux PDF
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-sky-400 text-slate-950">
                  Glisser-Déposer & Tri
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Triez par équipe, par nom ou par grade, ou réorganisez l'ordre des lignes par glisser-déposer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-white/80 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveCategory('medical')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'medical'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Stethoscope className="w-4 h-4 text-rose-300" />
              <span>Médecins</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('paramedical_day')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'paramedical_day'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-4 h-4 text-emerald-300" />
              <span>Paramédical Jour</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('paramedical_guard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'paramedical_guard'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-rose-300" />
              <span>Paramédical Garde 16h</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('hygiene')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === 'hygiene'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-300" />
              <span>Hygiène 12h</span>
            </button>
          </div>

          {/* Target orientation sync selector */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            <span>Appliquer à :</span>
            <select
              value={targetOrientation}
              onChange={(e) => setTargetOrientation(e.target.value as any)}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
            >
              <option value="both">Portrait & Paysage (Recommandé)</option>
              <option value="portrait">Portrait seulement</option>
              <option value="landscape">Paysage seulement</option>
            </select>
          </div>
        </div>

        {/* Quick Sorting Toolbar Bar */}
        <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Trier en 1 clic :
            </span>

            {/* Sort by Team */}
            <button
              type="button"
              onClick={() => handleSort('team', 'asc')}
              title="Organiser par groupe d'équipe (A, B, C, D, E)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 text-sky-700 hover:text-sky-900 border border-sky-200 text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <span>🛡️ Par Équipe (A-E)</span>
            </button>

            {/* Sort by Name A-Z */}
            <button
              type="button"
              onClick={() => handleSort('name', 'asc')}
              title="Trier par ordre alphabétique des noms (A à Z)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 hover:text-indigo-900 border border-indigo-200 text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <span>🔤 Par Nom (A-Z)</span>
            </button>

            {/* Sort by Name Z-A */}
            <button
              type="button"
              onClick={() => handleSort('name', 'desc')}
              title="Trier par ordre alphabétique inverse des noms (Z à A)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <span>🔤 Nom (Z-A)</span>
            </button>

            {/* Sort by Grade Hierarchy */}
            <button
              type="button"
              onClick={() => handleSort('grade', 'asc')}
              title="Trier selon la hiérarchie officielle hospitalière (Médecin Chef > Spécialiste > Résident > etc.)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-900 border border-emerald-200 text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <span>🎖️ Par Grade & Hiérarchie</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            />
          </div>
        </div>

        {/* Tip Banner */}
        <div className="px-6 py-2 bg-sky-50 border-b border-sky-100 flex items-center gap-2 text-xs text-sky-800">
          <Info className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            <strong>Astuce Glisser-Déposer :</strong> Attrapez une ligne avec la souris ou utilisez les flèches ▲ ▼ pour réordonner immédiatement la position dans les tableaux PDF.
          </span>
        </div>

        {/* Staff Draggable List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 flex-1">
          {filteredStaff.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Aucun membre trouvé dans cette catégorie.
            </div>
          ) : (
            filteredStaff.map((staff, idx) => {
              const isDragging = draggedId === staff.id;
              const isOver = dragOverId === staff.id;

              return (
                <div
                  key={staff.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedId(staff.id);
                    e.dataTransfer.setData('text/plain', String(staff.id));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedId !== staff.id) {
                      setDragOverId(staff.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverId === staff.id) {
                      setDragOverId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedId !== null && draggedId !== staff.id) {
                      handleMove(draggedId, staff.id);
                    }
                  }}
                  onDragEnd={() => {
                    setDraggedId(null);
                    setDragOverId(null);
                  }}
                  className={`group flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all select-none ${
                    isDragging
                      ? 'opacity-40 bg-slate-100 border-dashed border-sky-400'
                      : isOver
                      ? 'bg-sky-50 border-sky-500 shadow-md ring-2 ring-sky-300'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-sm'
                  }`}
                >
                  {/* Left: Drag Handle + Order Index + Name + Badges */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Drag Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Glisser-déposer pour changer la position"
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Order Number Badge */}
                    <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {/* Name & Function */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {staff.fullName}
                        </span>

                        {/* Team Badge (if any) */}
                        {staff.teamGroup && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTeamBadgeClass(
                              staff.teamGroup
                            )}`}
                          >
                            Équipe {staff.teamGroup}
                          </span>
                        )}

                        {/* Grade Badge */}
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {staff.gradeLandscape || staff.rolePortrait || 'Membre'}
                        </span>

                        {/* Obs / Horaires */}
                        {staff.obsPortrait && (
                          <span className="text-[10px] text-slate-400">
                            {staff.obsPortrait}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Step Move Arrows */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleStepMove(staff.id, 'up')}
                      title="Monter d'une position"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === filteredStaff.length - 1}
                      onClick={() => handleStepMove(staff.id, 'down')}
                      title="Descendre d'une position"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {filteredStaff.length} membre(s) dans cette liste
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            Terminer & Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
