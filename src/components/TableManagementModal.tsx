import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Calendar,
  Users,
  Check,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  Info,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Briefcase,
  UserPlus,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
  ListOrdered,
  Grid3X3,
  Undo2,
} from 'lucide-react';
import {
  StaffEntity,
  StaffCategory,
  DoctorWeeklySchedule,
  objectBoxStore,
  buildStandard08h16hActivity,
  buildGuard16hActivity,
  buildHygiene12hActivity,
} from '../db/objectboxEngine';

export type TableModalTab = 'table1' | 'table2' | 'table3';

interface TableManagementModalProps {
  isOpen: boolean;
  initialTab?: TableModalTab;
  staffList: StaffEntity[];
  onClose: () => void;
  onUpdateStaffField: <K extends keyof StaffEntity>(id: number, field: K, value: StaffEntity[K]) => void;
  onUpdateDoctorWeekly: (id: number, dayKey: keyof DoctorWeeklySchedule, value: string) => void;
  onAddStaff: (entity: Omit<StaffEntity, 'id'>) => void;
  onDeleteStaff: (id: number) => void;
}

// Quick presets with human-friendly descriptions and distinct color tags
const COMMON_ASSIGNMENTS = [
  { label: 'Biothérapie', value: 'Service Biothérapie', hint: 'Service spécialisé', bg: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' },
  { label: 'DMO', value: 'DMO', hint: 'Ostéodensitométrie', bg: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' },
  { label: 'Visite Générale', value: 'Visite Générale', hint: 'Visite de service', bg: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
  { label: 'Consult. BenSmir', value: 'Consultation\nE.P.S.P BenSmir', hint: 'Consultation extérieure', bg: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100' },
  { label: 'Consult. Mers El Kebir', value: 'Consultation\nE.P.S.P Mers El Kebir', hint: 'Consultation extérieure', bg: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-100' },
  { label: 'Journée Pédag.', value: 'Journée\nPédagogique', hint: 'Formation / Enseignement', bg: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100' },
  { label: 'SERVICE', value: 'SERVICE', hint: 'Activité normale au service', bg: 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200' },
  { label: 'Garde', value: 'Garde', hint: 'Service de garde', bg: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' },
  { label: 'Congé Annuel', value: 'Congé Annuel', hint: 'Absence autorisée', bg: 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100' },
  { label: 'Récupération', value: 'Récupération', hint: 'Repos récupérateur', bg: 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100' },
];

const DAYS_KEYS: Array<{ key: keyof DoctorWeeklySchedule; label: string; short: string }> = [
  { key: 'dimanche', label: 'Dimanche', short: 'Dim' },
  { key: 'lundi', label: 'Lundi', short: 'Lun' },
  { key: 'mardi', label: 'Mardi', short: 'Mar' },
  { key: 'mercredi', label: 'Mercredi', short: 'Mer' },
  { key: 'jeudi', label: 'Jeudi', short: 'Jeu' },
];

export const TableManagementModal: React.FC<TableManagementModalProps> = ({
  isOpen,
  initialTab = 'table1',
  staffList,
  onClose,
  onUpdateStaffField,
  onUpdateDoctorWeekly,
  onAddStaff,
  onDeleteStaff,
}) => {
  const [activeTab, setActiveTab] = useState<TableModalTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [paramedicalBlockFilter, setParamedicalBlockFilter] = useState<'all' | 'day' | 'guard' | 'hygiene'>('all');
  const [guardGroupFilter, setGuardGroupFilter] = useState<string>('all');
  const [showHelpBanner, setShowHelpBanner] = useState<boolean>(true);
  const [lastSavedNotice, setLastSavedNotice] = useState<string | null>(null);

  // Sync initial tab when reopened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery('');
    }
  }, [isOpen, initialTab]);

  // Flash auto-saved notice briefly
  const notifySaved = (msg: string) => {
    setLastSavedNotice(msg);
    setTimeout(() => {
      setLastSavedNotice(null);
    }, 2200);
  };

  if (!isOpen) return null;

  // Filter and sort items per category
  const allDoctors = staffList
    .filter((s) => s.category === 'medical')
    .sort((a, b) => a.portraitOrder - b.portraitOrder || a.id - b.id);

  const allParamedicalDay = staffList
    .filter((s) => s.category === 'paramedical_day')
    .sort((a, b) => a.portraitOrder - b.portraitOrder || a.id - b.id);

  const allParamedicalGuard = staffList
    .filter((s) => s.category === 'paramedical_guard')
    .sort((a, b) => a.portraitOrder - b.portraitOrder || a.id - b.id);

  const allHygieneStaff = staffList
    .filter((s) => s.category === 'hygiene')
    .sort((a, b) => a.portraitOrder - b.portraitOrder || a.id - b.id);

  // Search filters
  const q = searchQuery.toLowerCase().trim();

  const filteredDoctors = allDoctors.filter(
    (d) => !q || d.fullName.toLowerCase().includes(q) || (d.rolePortrait && d.rolePortrait.toLowerCase().includes(q))
  );

  const filteredParamedicalDay = allParamedicalDay.filter(
    (s) => !q || s.fullName.toLowerCase().includes(q) || (s.rolePortrait && s.rolePortrait.toLowerCase().includes(q))
  );

  const filteredParamedicalGuard = allParamedicalGuard.filter(
    (s) => !q || s.fullName.toLowerCase().includes(q) || (s.rolePortrait && s.rolePortrait.toLowerCase().includes(q)) || (s.teamGroup && s.teamGroup.toLowerCase().includes(q))
  );

  const filteredHygieneStaff = allHygieneStaff.filter(
    (s) => !q || s.fullName.toLowerCase().includes(q) || (s.rolePortrait && s.rolePortrait.toLowerCase().includes(q))
  );

  // Reorder helper
  const handleMoveItem = (fullList: StaffEntity[], staffId: number, direction: 'up' | 'down') => {
    const currentIndex = fullList.findIndex((s) => s.id === staffId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= fullList.length) return;

    const nextList = [...fullList];
    const temp = nextList[currentIndex];
    nextList[currentIndex] = nextList[targetIndex];
    nextList[targetIndex] = temp;

    const orderedIds = nextList.map((s) => s.id);
    objectBoxStore.reorderStaffCategory(orderedIds);
    notifySaved(`Position mise à jour (#${targetIndex + 1})`);
  };

  // Add new doctor
  const handleCreateDoctor = () => {
    onAddStaff({
      fullName: 'Nouveau Médecin',
      category: 'medical',
      rolePortrait: 'Médecin Généraliste',
      gradeLandscape: 'Médecin Généraliste',
      obsPortrait: '08h-16h',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: allDoctors.length + 1,
      landscapeOrder: allDoctors.length + 1,
      weeklySchedule: {
        dimanche: 'SERVICE',
        lundi: 'SERVICE',
        mardi: 'SERVICE',
        mercredi: 'SERVICE',
        jeudi: 'SERVICE',
      },
      dailyActivity: buildStandard08h16hActivity(),
    });
    notifySaved('Nouveau médecin ajouté avec succès');
  };

  // Add paramedical day
  const handleCreateParamedicalDay = () => {
    onAddStaff({
      fullName: 'Nouvel Agent 08h-16h',
      category: 'paramedical_day',
      rolePortrait: 'ATS',
      gradeLandscape: 'ATS',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: allParamedicalDay.length + 1,
      landscapeOrder: allParamedicalDay.length + 1,
      weeklySchedule: {
        dimanche: 'SERVICE',
        lundi: 'SERVICE',
        mardi: 'SERVICE',
        mercredi: 'SERVICE',
        jeudi: 'SERVICE',
      },
      dailyActivity: buildStandard08h16hActivity(),
    });
    notifySaved('Nouvel agent 08h-16h ajouté');
  };

  // Add guard member
  const handleCreateGuardMember = (groupLetter = 'A') => {
    onAddStaff({
      fullName: `Nouvel Agent Groupe ${groupLetter}`,
      category: 'paramedical_guard',
      rolePortrait: 'ATS',
      gradeLandscape: 'ATS',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: groupLetter,
      portraitOrder: allParamedicalGuard.length + 1,
      landscapeOrder: allParamedicalGuard.length + 1,
      weeklySchedule: {
        dimanche: 'SERVICE',
        lundi: 'SERVICE',
        mardi: 'SERVICE',
        mercredi: 'SERVICE',
        jeudi: 'SERVICE',
      },
      dailyActivity: buildGuard16hActivity(groupLetter),
    });
    notifySaved(`Agent ajouté au Groupe ${groupLetter}`);
  };

  // Add hygiene
  const handleCreateHygiene = () => {
    onAddStaff({
      fullName: "Nouvel Agent d'Hygiène",
      category: 'hygiene',
      rolePortrait: "Agent d'hygiène",
      gradeLandscape: "Agent d'hygiène",
      obsPortrait: '',
      horaireBlock: '12h',
      teamGroup: '',
      portraitOrder: allHygieneStaff.length + 1,
      landscapeOrder: allHygieneStaff.length + 1,
      weeklySchedule: {
        dimanche: 'SERVICE',
        lundi: 'SERVICE',
        mardi: 'SERVICE',
        mercredi: 'SERVICE',
        jeudi: 'SERVICE',
      },
      dailyActivity: buildHygiene12hActivity(allHygieneStaff.length % 2 === 0),
    });
    notifySaved("Nouvel agent d'hygiène ajouté");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-xs font-sans overflow-hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="table-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl h-full max-h-[94vh] flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================================
            HEADER : Accessible, clair, compréhensible avec statut d'enregistrement
           ========================================================================= */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="table-modal-title" className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                  Formulaires & Réorganisation des 3 Tableaux
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                  Enregistrement auto
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate hidden sm:block">
                Guide simple : réordonnez les lignes avec les flèches, modifiez les noms ou affectez les activités.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {lastSavedNotice && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 text-xs font-medium border border-emerald-700/50 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{lastSavedNotice}</span>
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="w-9 h-9 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors border border-transparent hover:border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            NAVIGATION DES ONGLETS (3 TABLEAUX OFFICIELS) - Adaptée Mobile & Desktop
           ========================================================================= */}
        <div className="px-3 sm:px-6 pt-2 bg-slate-100 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {/* Onglet 1 */}
            <button
              type="button"
              onClick={() => setActiveTab('table1')}
              className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-t border-x ${
                activeTab === 'table1'
                  ? 'bg-white text-slate-900 border-slate-300 border-b-white shadow-xs font-bold'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'table1' ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-slate-200 text-slate-600'}`}>
                1
              </div>
              <div className="text-left min-w-0 truncate">
                <div className="truncate">Tableau 1</div>
                <div className="text-[10px] text-slate-400 font-normal hidden sm:block truncate">Planning Hebdomadaire</div>
              </div>
              <span className="hidden md:inline-block ml-auto text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                Affecter & Ordre
              </span>
            </button>

            {/* Onglet 2 */}
            <button
              type="button"
              onClick={() => setActiveTab('table2')}
              className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-t border-x ${
                activeTab === 'table2'
                  ? 'bg-white text-slate-900 border-slate-300 border-b-white shadow-xs font-bold'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'table2' ? 'bg-emerald-100 text-emerald-700 font-bold' : 'bg-slate-200 text-slate-600'}`}>
                2
              </div>
              <div className="text-left min-w-0 truncate">
                <div className="truncate">Tableau 2</div>
                <div className="text-[10px] text-slate-400 font-normal hidden sm:block truncate">Liste Médicale Page 2</div>
              </div>
              <span className="hidden md:inline-block ml-auto text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                Ordre & Rôles
              </span>
            </button>

            {/* Onglet 3 */}
            <button
              type="button"
              onClick={() => setActiveTab('table3')}
              className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-t border-x ${
                activeTab === 'table3'
                  ? 'bg-white text-slate-900 border-slate-300 border-b-white shadow-xs font-bold'
                  : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'table3' ? 'bg-amber-100 text-amber-700 font-bold' : 'bg-slate-200 text-slate-600'}`}>
                3
              </div>
              <div className="text-left min-w-0 truncate">
                <div className="truncate">Tableau 3</div>
                <div className="text-[10px] text-slate-400 font-normal hidden sm:block truncate">Paramédical & Gardes</div>
              </div>
              <span className="hidden md:inline-block ml-auto text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                Groupes A–E & 08h
              </span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            BANDEAU D'AIDE ET BARRE D'OUTILS COMMUNE (RECHERCHE + AIDE DÉBUTANT)
           ========================================================================= */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-6 py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          {/* Recherche rapide */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un médecin, un agent ou une fonction..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-0.5"
                title="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Guide visuel "Mode débutant / Comprendre" */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setShowHelpBanner(!showHelpBanner)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>{showHelpBanner ? 'Masquer l’aide' : 'Comment ça marche ?'}</span>
            </button>
          </div>
        </div>

        {/* Bannière d'aide explicative claire pour les débutants */}
        {showHelpBanner && (
          <div className="bg-blue-50/70 border-b border-blue-100 px-4 sm:px-6 py-2.5 flex items-start justify-between gap-3 text-xs text-blue-900 shrink-0">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-950">
                  Comment utiliser cette fenêtre en 3 clics simples :
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-blue-800/90 mt-1">
                  <span><strong>1. Pour réordonner :</strong> cliquez sur les flèches <ArrowUp className="w-3 h-3 inline text-slate-600" /> monter ou <ArrowDown className="w-3 h-3 inline text-slate-600" /> descendre.</span>
                  <span><strong>2. Pour changer un nom :</strong> cliquez dans la boîte de texte et tapez directement.</span>
                  <span><strong>3. Pour affecter :</strong> cliquez sur un bouton coloré (Biothérapie, DMO...) pour remplir instantanément la case.</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowHelpBanner(false)}
              className="text-blue-500 hover:text-blue-700 p-1 rounded-md"
              title="Fermer l'aide"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* =========================================================================
            CORPS DÉFILANT PRINCIPAL
           ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 bg-slate-50/60">
          {/* =======================================================================
              ONGLET 1 : 1er TABLEAU (Planning Médical Hebdomadaire Dimanche - Jeudi)
             ======================================================================= */}
          {activeTab === 'table1' && (
            <div className="space-y-4">
              {/* Entête d'actions et palette de boutons d'affectation rapide */}
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>Palette d'affectation rapide en 1 clic :</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Cliquez sur n'importe quel bouton ci-dessous pour appliquer l'affectation à une case de jour.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateDoctor}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter un médecin</span>
                  </button>
                </div>

                {/* Boutons d'affectation rapide */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COMMON_ASSIGNMENTS.map((asg) => (
                    <div
                      key={asg.label}
                      title={`${asg.value} - ${asg.hint}`}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${asg.bg} transition-transform select-none shadow-2xs`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                      <span>{asg.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* État vide si recherche sans résultat */}
              {filteredDoctors.length === 0 && (
                <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Aucun médecin ne correspond à votre recherche "{searchQuery}"</p>
                  <p className="text-xs text-slate-400">Effacez la recherche pour afficher toute la liste.</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                  >
                    Réinitialiser le filtre
                  </button>
                </div>
              )}

              {/* Liste des cartes médecins pour le 1er Tableau */}
              <div className="space-y-3 sm:space-y-4">
                {filteredDoctors.map((doc) => {
                  const trueIndex = allDoctors.findIndex((d) => d.id === doc.id);
                  const isFirst = trueIndex === 0;
                  const isLast = trueIndex === allDoctors.length - 1;

                  return (
                    <div
                      key={doc.id}
                      className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 shadow-xs transition-all hover:border-slate-300 hover:shadow-md space-y-3"
                    >
                      {/* Ligne d'entête du médecin */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {/* Badge de position officielle */}
                          <div
                            className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-2xs"
                            title={`Position officielle n°${trueIndex + 1} dans les impressions`}
                          >
                            {trueIndex + 1}
                          </div>

                          {/* Champ Nom et Prénom */}
                          <div className="flex-1 min-w-[180px]">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              Nom et Prénom du médecin
                            </label>
                            <input
                              type="text"
                              value={doc.fullName}
                              onChange={(e) => onUpdateStaffField(doc.id, 'fullName', e.target.value)}
                              placeholder="ex: Dr. NOM Prénom"
                              className="w-full text-sm font-bold text-slate-900 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-lg px-2.5 py-1 outline-none transition-colors"
                            />
                          </div>

                          {/* Fonction / Spécialité */}
                          <div className="hidden lg:block w-48">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              Fonction
                            </label>
                            <input
                              type="text"
                              value={doc.rolePortrait}
                              onChange={(e) => onUpdateStaffField(doc.id, 'rolePortrait', e.target.value)}
                              placeholder="Médecin Généraliste..."
                              className="w-full text-xs text-slate-700 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {/* Boutons de Réorganisation et Suppression */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                          <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">
                            Ordre :
                          </span>
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => handleMoveItem(allDoctors, doc.id, 'up')}
                            title="Monter ce médecin d'une ligne dans le tableau"
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
                              isFirst
                                ? 'text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50'
                                : 'text-slate-700 hover:text-black hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Monter</span>
                          </button>

                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => handleMoveItem(allDoctors, doc.id, 'down')}
                            title="Descendre ce médecin d'une ligne dans le tableau"
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-colors ${
                              isLast
                                ? 'text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50'
                                : 'text-slate-700 hover:text-black hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Descendre</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Voulez-vous vraiment supprimer "${doc.fullName}" ?`)) {
                                onDeleteStaff(doc.id);
                                notifySaved('Médecin supprimé');
                              }
                            }}
                            title="Supprimer ce médecin"
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-colors ml-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 5 Cases de jours (Dimanche à Jeudi) - Responsive Grid */}
                      <div>
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>Affectations hebdomadaires (Dimanche au Jeudi) :</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Tapez du texte ou cliquez sur un raccourci
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                          {DAYS_KEYS.map(({ key: dayKey, label: dayLabel, short: dayShort }) => {
                            const currentVal = doc.weeklySchedule[dayKey] || '';

                            return (
                              <div
                                key={dayKey}
                                className="bg-slate-50/80 rounded-lg p-2 border border-slate-200 flex flex-col justify-between space-y-1.5 transition-colors hover:border-slate-300"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <span>{dayLabel}</span>
                                  </span>
                                  {currentVal && (
                                    <button
                                      type="button"
                                      onClick={() => onUpdateDoctorWeekly(doc.id, dayKey, '')}
                                      title="Effacer cette case"
                                      className="text-[10px] text-slate-400 hover:text-red-600 font-medium"
                                    >
                                      Vider
                                    </button>
                                  )}
                                </div>

                                {/* Zone de saisie directe */}
                                <textarea
                                  rows={2}
                                  value={currentVal}
                                  onChange={(e) => onUpdateDoctorWeekly(doc.id, dayKey, e.target.value)}
                                  placeholder="Écrire ou affecter..."
                                  className="w-full text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded p-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 leading-tight resize-none"
                                />

                                {/* Mini palette rapide par case pour les débutants */}
                                <div className="pt-1 border-t border-slate-200/60">
                                  <div className="text-[9px] text-slate-400 font-medium mb-1">
                                    Raccourcis :
                                  </div>
                                  <div className="grid grid-cols-2 gap-1">
                                    {COMMON_ASSIGNMENTS.slice(0, 4).map((asg) => (
                                      <button
                                        key={asg.label}
                                        type="button"
                                        onClick={() => onUpdateDoctorWeekly(doc.id, dayKey, asg.value)}
                                        className={`px-1 py-0.5 text-[9px] font-medium rounded border truncate text-center transition-colors ${asg.bg}`}
                                        title={asg.value}
                                      >
                                        {asg.label.replace('Consult. ', 'C. ')}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =======================================================================
              ONGLET 2 : 2ème TABLEAU (Liste du Personnel Médical Page 2)
             ======================================================================= */}
          {activeTab === 'table2' && (
            <div className="space-y-4">
              <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Réordonner le 2ème Tableau (Document Page 2 - Liste Médicale)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modifiez facilement l'ordre d'apparition, les noms, les fonctions et la colonne OBS.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateDoctor}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un médecin</span>
                </button>
              </div>

              {/* Vue Mobile sous forme de cartes simples */}
              <div className="block sm:hidden space-y-2.5">
                {filteredDoctors.map((doc) => {
                  const trueIndex = allDoctors.findIndex((d) => d.id === doc.id);
                  const isFirst = trueIndex === 0;
                  const isLast = trueIndex === allDoctors.length - 1;

                  return (
                    <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="w-6 h-6 rounded-md bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                          #{trueIndex + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => handleMoveItem(allDoctors, doc.id, 'up')}
                            className="p-1 rounded bg-slate-100 border border-slate-200 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => handleMoveItem(allDoctors, doc.id, 'down')}
                            className="p-1 rounded bg-slate-100 border border-slate-200 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteStaff(doc.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={doc.fullName}
                          onChange={(e) => onUpdateStaffField(doc.id, 'fullName', e.target.value)}
                          placeholder="Nom et Prénom"
                          className="w-full text-xs font-bold text-slate-900 border border-slate-200 rounded px-2 py-1"
                        />
                        <input
                          type="text"
                          value={doc.rolePortrait}
                          onChange={(e) => onUpdateStaffField(doc.id, 'rolePortrait', e.target.value)}
                          placeholder="Fonction"
                          className="w-full text-xs text-slate-700 border border-slate-200 rounded px-2 py-1"
                        />
                        <input
                          type="text"
                          value={doc.obsPortrait}
                          onChange={(e) => onUpdateStaffField(doc.id, 'obsPortrait', e.target.value)}
                          placeholder="OBS (ex: 08h-16h)"
                          className="w-full text-xs text-slate-700 border border-slate-200 rounded px-2 py-1"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vue Desktop / Tablette : Grand Tableau Épuré */}
              <div className="hidden sm:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3 w-16 text-center">N° Ordre</th>
                      <th className="py-2.5 px-3 w-28 text-center">Déplacer</th>
                      <th className="py-2.5 px-3">Nom et Prénom</th>
                      <th className="py-2.5 px-3">Fonction</th>
                      <th className="py-2.5 px-3 w-40">OBS (Horaires / Note)</th>
                      <th className="py-2.5 px-3 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDoctors.map((doc) => {
                      const trueIndex = allDoctors.findIndex((d) => d.id === doc.id);
                      const isFirst = trueIndex === 0;
                      const isLast = trueIndex === allDoctors.length - 1;

                      return (
                        <tr
                          key={doc.id}
                          className={`hover:bg-blue-50/40 transition-colors ${
                            trueIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-800 text-xs font-bold inline-flex items-center justify-center border border-slate-200">
                              {trueIndex + 1}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => handleMoveItem(allDoctors, doc.id, 'up')}
                                title="Monter ce médecin"
                                className={`p-1.5 rounded-md border transition-colors ${
                                  isFirst
                                    ? 'text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50'
                                    : 'text-slate-700 hover:bg-slate-200 border-slate-300'
                                }`}
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => handleMoveItem(allDoctors, doc.id, 'down')}
                                title="Descendre ce médecin"
                                className={`p-1.5 rounded-md border transition-colors ${
                                  isLast
                                    ? 'text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50'
                                    : 'text-slate-700 hover:bg-slate-200 border-slate-300'
                                }`}
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={doc.fullName}
                              onChange={(e) => onUpdateStaffField(doc.id, 'fullName', e.target.value)}
                              className="w-full text-xs font-bold text-slate-900 border border-slate-200 rounded px-2.5 py-1 outline-none focus:border-emerald-500 bg-white"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={doc.rolePortrait}
                              onChange={(e) => onUpdateStaffField(doc.id, 'rolePortrait', e.target.value)}
                              className="w-full text-xs font-medium text-slate-800 border border-slate-200 rounded px-2.5 py-1 outline-none focus:border-emerald-500 bg-white"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={doc.obsPortrait}
                              onChange={(e) => onUpdateStaffField(doc.id, 'obsPortrait', e.target.value)}
                              className="w-full text-xs font-medium text-slate-800 border border-slate-200 rounded px-2.5 py-1 outline-none focus:border-emerald-500 bg-white"
                              placeholder="08h-16h"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Supprimer ${doc.fullName} ?`)) {
                                  onDeleteStaff(doc.id);
                                  notifySaved('Médecin supprimé');
                                }
                              }}
                              title="Supprimer ce médecin"
                              className="p-1 rounded text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =======================================================================
              ONGLET 3 : 3ème TABLEAU (Planning Personnel Paramédical - 3 Blocs)
             ======================================================================= */}
          {activeTab === 'table3' && (
            <div className="space-y-4">
              {/* Filtre de blocs & boutons d'ajout */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Afficher :</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setParamedicalBlockFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      paramedicalBlockFilter === 'all'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Tous les 3 blocs
                  </button>
                  <button
                    type="button"
                    onClick={() => setParamedicalBlockFilter('day')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      paramedicalBlockFilter === 'day'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    1. Jour (08h-16h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setParamedicalBlockFilter('guard')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      paramedicalBlockFilter === 'guard'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    2. Garde 16h (Groupes A–E)
                  </button>
                  <button
                    type="button"
                    onClick={() => setParamedicalBlockFilter('hygiene')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      paramedicalBlockFilter === 'hygiene'
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    3. Hygiène (12h)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCreateParamedicalDay}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-black text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter Agent</span>
                  </button>
                </div>
              </div>

              {/* 1. Bloc 08h-16h (Jour) */}
              {(paramedicalBlockFilter === 'all' || paramedicalBlockFilter === 'day') && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-blue-500" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Bloc 1 : Personnel de Jour (08h–16h)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {allParamedicalDay.length} agent(s) · Ordre respecté dans les impressions
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateParamedicalDay}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter en 08h-16h</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {filteredParamedicalDay.map((staff) => {
                      const trueIdx = allParamedicalDay.findIndex((s) => s.id === staff.id);
                      const isFirst = trueIdx === 0;
                      const isLast = trueIdx === allParamedicalDay.length - 1;

                      return (
                        <div
                          key={staff.id}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="w-6 h-6 rounded-md bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center shrink-0">
                              {trueIdx + 1}
                            </span>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => handleMoveItem(allParamedicalDay, staff.id, 'up')}
                                title="Monter cet agent"
                                className="p-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => handleMoveItem(allParamedicalDay, staff.id, 'down')}
                                title="Descendre cet agent"
                                className="p-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex-1 min-w-[140px]">
                            <input
                              type="text"
                              value={staff.fullName}
                              onChange={(e) => onUpdateStaffField(staff.id, 'fullName', e.target.value)}
                              placeholder="Nom et Prénom"
                              className="w-full text-xs font-bold text-slate-900 border border-slate-200 rounded px-2.5 py-1 bg-white focus:border-blue-500"
                            />
                          </div>

                          <div className="w-full sm:w-36">
                            <input
                              type="text"
                              value={staff.rolePortrait}
                              onChange={(e) => onUpdateStaffField(staff.id, 'rolePortrait', e.target.value)}
                              placeholder="Fonction (ATS...)"
                              className="w-full text-xs text-slate-800 border border-slate-200 rounded px-2.5 py-1 bg-white focus:border-blue-500"
                            />
                          </div>

                          <div className="w-full sm:w-36">
                            <input
                              type="text"
                              value={staff.obsPortrait}
                              onChange={(e) => onUpdateStaffField(staff.id, 'obsPortrait', e.target.value)}
                              placeholder="OBS (Congé...)"
                              className="w-full text-xs text-slate-800 border border-slate-200 rounded px-2.5 py-1 bg-white focus:border-blue-500"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Supprimer ${staff.fullName} ?`)) {
                                onDeleteStaff(staff.id);
                                notifySaved('Agent supprimé');
                              }
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-200 self-end sm:self-auto"
                            title="Supprimer cet agent"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Bloc 16h (Groupes A à E) */}
              {(paramedicalBlockFilter === 'all' || paramedicalBlockFilter === 'guard') && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-emerald-500" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Bloc 2 : Personnel de Garde 16h (Groupes A, B, C, D, E)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {allParamedicalGuard.length} agents de garde au total
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={guardGroupFilter}
                        onChange={(e) => setGuardGroupFilter(e.target.value)}
                        className="text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:border-emerald-500"
                      >
                        <option value="all">Tous les groupes (A–E)</option>
                        {['A', 'B', 'C', 'D', 'E'].map((g) => (
                          <option key={g} value={g}>
                            Groupe {g}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleCreateGuardMember(guardGroupFilter === 'all' ? 'A' : guardGroupFilter)}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter en Garde</span>
                      </button>
                    </div>
                  </div>

                  {/* Groupes A à E */}
                  {['A', 'B', 'C', 'D', 'E']
                    .filter((g) => guardGroupFilter === 'all' || guardGroupFilter === g)
                    .map((groupLetter) => {
                      const groupMembers = allParamedicalGuard.filter((s) => s.teamGroup === groupLetter);
                      const filteredMembers = filteredParamedicalGuard.filter((s) => s.teamGroup === groupLetter);

                      if (searchQuery && filteredMembers.length === 0) return null;

                      return (
                        <div key={groupLetter} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs space-y-1">
                          <div className="bg-slate-900 text-white px-3.5 py-2 text-xs font-bold flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span>GROUPE {groupLetter}</span>
                            </div>
                            <span className="text-[11px] text-slate-300 font-normal">
                              {groupMembers.length} agent(s)
                            </span>
                          </div>

                          <div className="p-2.5 space-y-2 bg-slate-50/50">
                            {filteredMembers.map((staff) => {
                              const trueGIdx = groupMembers.findIndex((s) => s.id === staff.id);
                              const isFirst = trueGIdx === 0;
                              const isLast = trueGIdx === groupMembers.length - 1;

                              return (
                                <div
                                  key={staff.id}
                                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-lg bg-white border border-slate-200"
                                >
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 border border-slate-200">
                                      {trueGIdx + 1}
                                    </span>

                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <button
                                        type="button"
                                        disabled={isFirst}
                                        onClick={() => handleMoveItem(groupMembers, staff.id, 'up')}
                                        title="Monter dans ce groupe"
                                        className="p-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isLast}
                                        onClick={() => handleMoveItem(groupMembers, staff.id, 'down')}
                                        title="Descendre dans ce groupe"
                                        className="p-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex-1 min-w-[140px]">
                                    <input
                                      type="text"
                                      value={staff.fullName}
                                      onChange={(e) => onUpdateStaffField(staff.id, 'fullName', e.target.value)}
                                      placeholder="Nom et Prénom"
                                      className="w-full text-xs font-bold text-slate-900 border border-slate-200 rounded px-2 py-1 bg-white focus:border-emerald-500"
                                    />
                                  </div>

                                  <div className="w-full sm:w-24">
                                    <select
                                      value={staff.teamGroup}
                                      onChange={(e) => onUpdateStaffField(staff.id, 'teamGroup', e.target.value)}
                                      className="w-full text-xs font-bold border border-slate-200 rounded px-2 py-1 bg-white focus:border-emerald-500"
                                      title="Changer de groupe"
                                    >
                                      {['A', 'B', 'C', 'D', 'E'].map((g) => (
                                        <option key={g} value={g}>
                                          Groupe {g}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="w-full sm:w-28">
                                    <input
                                      type="text"
                                      value={staff.rolePortrait}
                                      onChange={(e) => onUpdateStaffField(staff.id, 'rolePortrait', e.target.value)}
                                      placeholder="Fonction"
                                      className="w-full text-xs text-slate-800 border border-slate-200 rounded px-2 py-1 bg-white focus:border-emerald-500"
                                    />
                                  </div>

                                  <div className="w-full sm:w-28">
                                    <input
                                      type="text"
                                      value={staff.obsPortrait}
                                      onChange={(e) => onUpdateStaffField(staff.id, 'obsPortrait', e.target.value)}
                                      placeholder="OBS"
                                      className="w-full text-xs text-slate-800 border border-slate-200 rounded px-2 py-1 bg-white focus:border-emerald-500"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Supprimer ${staff.fullName} ?`)) {
                                        onDeleteStaff(staff.id);
                                        notifySaved('Agent supprimé');
                                      }
                                    }}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded self-end sm:self-auto"
                                    title="Supprimer cet agent"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* 3. Bloc 12h (Hygiène) */}
              {(paramedicalBlockFilter === 'all' || paramedicalBlockFilter === 'hygiene') && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md bg-purple-500" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Bloc 3 : Agents d'Hygiène (12h)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {allHygieneStaff.length} agent(s) d'hygiène
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateHygiene}
                      className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter Agent d'hygiène</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {filteredHygieneStaff.map((staff) => {
                      const trueIdx = allHygieneStaff.findIndex((s) => s.id === staff.id);
                      const isFirst = trueIdx === 0;
                      const isLast = trueIdx === allHygieneStaff.length - 1;

                      return (
                        <div
                          key={staff.id}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-lg bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="w-6 h-6 rounded-md bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center shrink-0">
                              {trueIdx + 1}
                            </span>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => handleMoveItem(allHygieneStaff, staff.id, 'up')}
                                title="Monter cet agent"
                                className="p-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => handleMoveItem(allHygieneStaff, staff.id, 'down')}
                                title="Descendre cet agent"
                                className="p-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex-1 min-w-[140px]">
                            <input
                              type="text"
                              value={staff.fullName}
                              onChange={(e) => onUpdateStaffField(staff.id, 'fullName', e.target.value)}
                              placeholder="Nom et Prénom"
                              className="w-full text-xs font-bold text-slate-900 border border-slate-200 rounded px-2.5 py-1 bg-white focus:border-purple-500"
                            />
                          </div>

                          <div className="w-full sm:w-36">
                            <input
                              type="text"
                              value={staff.rolePortrait}
                              onChange={(e) => onUpdateStaffField(staff.id, 'rolePortrait', e.target.value)}
                              placeholder="Fonction"
                              className="w-full text-xs text-slate-800 border border-slate-200 rounded px-2.5 py-1 bg-white focus:border-purple-500"
                            />
                          </div>

                          <div className="w-full sm:w-36">
                            <input
                              type="text"
                              value={staff.obsPortrait}
                              onChange={(e) => onUpdateStaffField(staff.id, 'obsPortrait', e.target.value)}
                              placeholder="OBS"
                              className="w-full text-xs text-slate-800 border border-slate-200 rounded px-2.5 py-1 bg-white focus:border-purple-500"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Supprimer ${staff.fullName} ?`)) {
                                onDeleteStaff(staff.id);
                                notifySaved('Agent supprimé');
                              }
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-200 self-end sm:self-auto"
                            title="Supprimer cet agent"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =========================================================================
            PIED DE DIALOGUE : STATUT ET VALIDATION
           ========================================================================= */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Toutes les modifications sont automatiquement enregistrées et appliquées aux 3 tableaux A4.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-900 hover:bg-black text-white shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Terminer & Fermer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
