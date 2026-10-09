import React, { useState } from 'react';
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
  Edit2,
  Save,
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

const COMMON_ASSIGNMENTS = [
  { label: 'Biothérapie', value: 'Service Biothérapie', color: 'bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200' },
  { label: 'DMO', value: 'DMO', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200' },
  { label: 'Visite Générale', value: 'Visite Générale', color: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200' },
  { label: 'Consult. BenSmir', value: 'Consultation\nE.P.S.P BenSmir', color: 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200' },
  { label: 'Consult. Mers El Kebir', value: 'Consultation\nE.P.S.P Mers El Kebir', color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 hover:bg-fuchsia-200' },
  { label: 'Journée Pédag.', value: 'Journée\nPédagogique', color: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' },
  { label: 'SERVICE', value: 'SERVICE', color: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200' },
  { label: 'Garde', value: 'Garde', color: 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200' },
  { label: 'Congé Annuel', value: 'Congé Annuel', color: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100' },
  { label: 'Récupération', value: 'Récupération', color: 'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-200' },
];

const DAYS_KEYS: Array<{ key: keyof DoctorWeeklySchedule; label: string }> = [
  { key: 'dimanche', label: 'Dimanche' },
  { key: 'lundi', label: 'Lundi' },
  { key: 'mardi', label: 'Mardi' },
  { key: 'mercredi', label: 'Mercredi' },
  { key: 'jeudi', label: 'Jeudi' },
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
  const [paramedicalBlockFilter, setParamedicalBlockFilter] = useState<'all' | 'day' | 'guard' | 'hygiene'>('all');
  const [guardGroupFilter, setGuardGroupFilter] = useState<string>('all');
  const [selectedDoctorIdForWeekly, setSelectedDoctorIdForWeekly] = useState<number | null>(null);

  // Sync initial tab when reopened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Filter and sort items per category
  const doctors = staffList
    .filter((s) => s.category === 'medical')
    .sort((a, b) => a.portraitOrder - b.portraitOrder || a.id - b.id);

  const paramedicalDay = staffList
    .filter((s) => s.category === 'paramedical_day')
    .sort((a, b) => a.portraitOrder - b.portraitOrder || a.id - b.id);

  const paramedicalGuard = staffList
    .filter((s) => s.category === 'paramedical_guard')
    .sort((a, b) => a.portraitOrder - b.portraitOrder || a.id - b.id);

  const hygieneStaff = staffList
    .filter((s) => s.category === 'hygiene')
    .sort((a, b) => a.portraitOrder - b.portraitOrder || a.id - b.id);

  // Reorder helper
  const handleMoveItem = (list: StaffEntity[], index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const nextList = [...list];
    const temp = nextList[index];
    nextList[index] = nextList[targetIndex];
    nextList[targetIndex] = temp;

    const orderedIds = nextList.map((s) => s.id);
    objectBoxStore.reorderStaffCategory(orderedIds);
  };

  // Add new doctor
  const handleCreateDoctor = () => {
    onAddStaff({
      fullName: 'Nouveau Médecin',
      category: 'medical',
      rolePortrait: 'Médecin Généraliste',
      gradeLandscape: 'Médecin',
      obsPortrait: '08h-16h',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: doctors.length + 1,
      landscapeOrder: doctors.length + 1,
      weeklySchedule: {
        dimanche: 'SERVICE',
        lundi: 'SERVICE',
        mardi: 'SERVICE',
        mercredi: 'SERVICE',
        jeudi: 'SERVICE',
      },
      dailyActivity: buildStandard08h16hActivity(),
    });
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
      portraitOrder: paramedicalDay.length + 1,
      landscapeOrder: paramedicalDay.length + 1,
      weeklySchedule: {
        dimanche: 'SERVICE',
        lundi: 'SERVICE',
        mardi: 'SERVICE',
        mercredi: 'SERVICE',
        jeudi: 'SERVICE',
      },
      dailyActivity: buildStandard08h16hActivity(),
    });
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
      portraitOrder: paramedicalGuard.length + 1,
      landscapeOrder: paramedicalGuard.length + 1,
      weeklySchedule: {
        dimanche: 'SERVICE',
        lundi: 'SERVICE',
        mardi: 'SERVICE',
        mercredi: 'SERVICE',
        jeudi: 'SERVICE',
      },
      dailyActivity: buildGuard16hActivity(groupLetter),
    });
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
      portraitOrder: hygieneStaff.length + 1,
      landscapeOrder: hygieneStaff.length + 1,
      weeklySchedule: {
        dimanche: 'SERVICE',
        lundi: 'SERVICE',
        mardi: 'SERVICE',
        mercredi: 'SERVICE',
        jeudi: 'SERVICE',
      },
      dailyActivity: buildHygiene12hActivity(hygieneStaff.length % 2 === 0),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs font-sans overflow-hidden"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Formulaires & Réorganisation des Tableaux</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Mode Édition
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Ajustez l'ordre des lignes, écrivez et affectez les plannings directement dans chaque tableau.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-100 border-b border-slate-200 flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('table1')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-t border-x ${
              activeTab === 'table1'
                ? 'bg-white text-slate-900 border-slate-300 border-b-transparent shadow-xs'
                : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Calendar className={`w-4 h-4 ${activeTab === 'table1' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span>1er Tableau (Hebdomadaire)</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-bold">
              Affecter & Réordonner
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table2')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-t border-x ${
              activeTab === 'table2'
                ? 'bg-white text-slate-900 border-slate-300 border-b-transparent shadow-xs'
                : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Users className={`w-4 h-4 ${activeTab === 'table2' ? 'text-emerald-600' : 'text-slate-500'}`} />
            <span>2ème Tableau (Liste Médicale)</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              Réordonner
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('table3')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-t border-x ${
              activeTab === 'table3'
                ? 'bg-white text-slate-900 border-slate-300 border-b-transparent shadow-xs'
                : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Clock className={`w-4 h-4 ${activeTab === 'table3' ? 'text-amber-600' : 'text-slate-500'}`} />
            <span>3ème Tableau (Paramédical)</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
              Réordonner
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {/* =========================================================================
              TAB 1 : 1er TABLEAU (Planning Médical Hebdomadaire - Réorganiser & Affecter)
             ========================================================================= */}
          {activeTab === 'table1' && (
            <div className="space-y-6">
              {/* Context bar with quick presets */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>Palette d'affectation rapide (cliquez sur une cellule d'un médecin pour l'appliquer) :</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Formatage automatique sur 1 ou 2 lignes (ex. <em>Consultation E.P.S.P BenSmir</em>, <em>Mers El Kebir</em>, <em>DMO</em>, etc.).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateDoctor}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un médecin</span>
                  </button>
                </div>

                {/* Preset Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COMMON_ASSIGNMENTS.map((asg) => (
                    <span
                      key={asg.label}
                      className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium border cursor-default shadow-2xs transition-transform ${asg.color}`}
                    >
                      {asg.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* List of Doctors with reordering and day assignment cells */}
              <div className="space-y-4">
                {doctors.map((doc, docIdx) => {
                  const isFirst = docIdx === 0;
                  const isLast = docIdx === doctors.length - 1;

                  return (
                    <div
                      key={doc.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs transition-shadow hover:shadow-md space-y-3"
                    >
                      {/* Doctor Header Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {/* Order Badge */}
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {docIdx + 1}
                          </span>

                          {/* Editable Doctor Name */}
                          <div className="flex-1 min-w-[200px]">
                            <label className="text-[10px] font-semibold text-slate-400 block uppercase">
                              Nom du médecin
                            </label>
                            <input
                              type="text"
                              value={doc.fullName}
                              onChange={(e) => onUpdateStaffField(doc.id, 'fullName', e.target.value)}
                              className="w-full text-sm font-bold text-slate-900 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded px-2 py-0.5 outline-none transition-colors"
                            />
                          </div>

                          <div className="hidden md:block text-xs text-slate-500 italic max-w-[200px] truncate">
                            {doc.rolePortrait}
                          </div>
                        </div>

                        {/* Order Buttons & Delete */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => handleMoveItem(doctors, docIdx, 'up')}
                            title="Monter ce médecin (#)"
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isFirst
                                ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                                : 'text-slate-700 hover:text-black hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => handleMoveItem(doctors, docIdx, 'down')}
                            title="Descendre ce médecin (#)"
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isLast
                                ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                                : 'text-slate-700 hover:text-black hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteStaff(doc.id)}
                            title="Supprimer ce médecin"
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-colors ml-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 5 Day Cells (Dimanche - Jeudi) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                        {DAYS_KEYS.map(({ key: dayKey, label: dayLabel }) => {
                          const currentVal = doc.weeklySchedule[dayKey] || '';

                          return (
                            <div
                              key={dayKey}
                              className="bg-slate-50 rounded-lg p-2 border border-slate-200 flex flex-col justify-between space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                                  {dayLabel}
                                </span>
                                {currentVal && (
                                  <button
                                    type="button"
                                    onClick={() => onUpdateDoctorWeekly(doc.id, dayKey, '')}
                                    title="Effacer cette case"
                                    className="text-[10px] text-slate-400 hover:text-red-600"
                                  >
                                    Effacer
                                  </button>
                                )}
                              </div>

                              {/* Textarea for Direct Typing */}
                              <textarea
                                rows={2}
                                value={currentVal}
                                onChange={(e) => onUpdateDoctorWeekly(doc.id, dayKey, e.target.value)}
                                placeholder="Activité..."
                                className="w-full text-xs font-medium text-slate-900 bg-white border border-slate-200 rounded p-1.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-400 leading-tight resize-none"
                              />

                              {/* Quick Affecter Mini Dropdown / Menu */}
                              <div className="pt-1 border-t border-slate-200/60">
                                <div className="text-[9px] text-slate-400 font-semibold mb-1">
                                  Affecter rapidement :
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {COMMON_ASSIGNMENTS.slice(0, 5).map((asg) => (
                                    <button
                                      key={asg.label}
                                      type="button"
                                      onClick={() => onUpdateDoctorWeekly(doc.id, dayKey, asg.value)}
                                      className={`px-1 py-0.5 text-[9px] font-medium rounded border transition-colors ${asg.color}`}
                                      title={asg.value}
                                    >
                                      {asg.label.replace('Consult. ', 'C.')}
                                    </button>
                                  ))}
                                  {COMMON_ASSIGNMENTS.slice(5).map((asg) => (
                                    <button
                                      key={asg.label}
                                      type="button"
                                      onClick={() => onUpdateDoctorWeekly(doc.id, dayKey, asg.value)}
                                      className={`px-1 py-0.5 text-[9px] font-medium rounded border transition-colors ${asg.color}`}
                                      title={asg.value}
                                    >
                                      {asg.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2 : 2ème TABLEAU (Liste Médicale Page 2 - Réordonner & Édition)
             ========================================================================= */}
          {activeTab === 'table2' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Réordonner le 2ème Tableau (Liste du Personnel Médical)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Utilisez les flèches pour changer l'ordre officiel des médecins dans le document Page 2.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateDoctor}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un médecin</span>
                </button>
              </div>

              {/* Doctors Table View with Reorder */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3 w-16 text-center">Ordre</th>
                      <th className="py-2.5 px-3 w-24 text-center">Position</th>
                      <th className="py-2.5 px-3">Nom et Prénom</th>
                      <th className="py-2.5 px-3">Fonction</th>
                      <th className="py-2.5 px-3 w-36">OBS</th>
                      <th className="py-2.5 px-3 w-16 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doctors.map((doc, docIdx) => {
                      const isFirst = docIdx === 0;
                      const isLast = docIdx === doctors.length - 1;

                      return (
                        <tr
                          key={doc.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            docIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center justify-center">
                              {docIdx + 1}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                disabled={isFirst}
                                onClick={() => handleMoveItem(doctors, docIdx, 'up')}
                                title="Monter (#)"
                                className={`p-1 rounded border transition-colors ${
                                  isFirst
                                    ? 'text-slate-300 border-slate-100 cursor-not-allowed'
                                    : 'text-slate-700 hover:bg-slate-200 border-slate-300'
                                }`}
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={isLast}
                                onClick={() => handleMoveItem(doctors, docIdx, 'down')}
                                title="Descendre (#)"
                                className={`p-1 rounded border transition-colors ${
                                  isLast
                                    ? 'text-slate-300 border-slate-100 cursor-not-allowed'
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
                              className="w-full text-xs font-bold text-slate-900 border border-slate-200 rounded px-2 py-1 outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={doc.rolePortrait}
                              onChange={(e) => onUpdateStaffField(doc.id, 'rolePortrait', e.target.value)}
                              className="w-full text-xs font-medium text-slate-800 border border-slate-200 rounded px-2 py-1 outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={doc.obsPortrait}
                              onChange={(e) => onUpdateStaffField(doc.id, 'obsPortrait', e.target.value)}
                              className="w-full text-xs font-medium text-slate-800 border border-slate-200 rounded px-2 py-1 outline-none focus:border-emerald-500"
                              placeholder="08h-16h"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => onDeleteStaff(doc.id)}
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

          {/* =========================================================================
              TAB 3 : 3ème TABLEAU (Planning Personnel Paramédical - Réordonner)
             ========================================================================= */}
          {activeTab === 'table3' && (
            <div className="space-y-6">
              {/* Filter tabs within Table 3 */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 mr-1">Bloc à réordonner :</span>
                  <button
                    type="button"
                    onClick={() => setParamedicalBlockFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      paramedicalBlockFilter === 'all'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Tous les blocs
                  </button>
                  <button
                    type="button"
                    onClick={() => setParamedicalBlockFilter('day')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      paramedicalBlockFilter === 'day'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    1. Jour (08h-16h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setParamedicalBlockFilter('guard')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      paramedicalBlockFilter === 'guard'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    2. Garde 16h (Groupes A–E)
                  </button>
                  <button
                    type="button"
                    onClick={() => setParamedicalBlockFilter('hygiene')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      paramedicalBlockFilter === 'hygiene'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    3. Hygiène (12h)
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCreateParamedicalDay}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-black text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Ajouter Agent</span>
                  </button>
                </div>
              </div>

              {/* 1. Bloc 08h-16h */}
              {(paramedicalBlockFilter === 'all' || paramedicalBlockFilter === 'day') && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span>Bloc 08h–16h (Personnel de Jour) — {paramedicalDay.length} agents</span>
                    </h4>
                    <button
                      type="button"
                      onClick={handleCreateParamedicalDay}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter 08h-16h</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {paramedicalDay.map((staff, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === paramedicalDay.length - 1;

                      return (
                        <div
                          key={staff.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={isFirst}
                              onClick={() => handleMoveItem(paramedicalDay, idx, 'up')}
                              className="p-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isLast}
                              onClick={() => handleMoveItem(paramedicalDay, idx, 'down')}
                              className="p-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <input
                            type="text"
                            value={staff.fullName}
                            onChange={(e) => onUpdateStaffField(staff.id, 'fullName', e.target.value)}
                            placeholder="Nom et Prénom"
                            className="flex-1 min-w-[140px] text-xs font-bold text-slate-900 border border-slate-200 rounded px-2 py-1 bg-white"
                          />

                          <input
                            type="text"
                            value={staff.rolePortrait}
                            onChange={(e) => onUpdateStaffField(staff.id, 'rolePortrait', e.target.value)}
                            placeholder="Fonction"
                            className="w-36 text-xs text-slate-800 border border-slate-200 rounded px-2 py-1 bg-white"
                          />

                          <input
                            type="text"
                            value={staff.obsPortrait}
                            onChange={(e) => onUpdateStaffField(staff.id, 'obsPortrait', e.target.value)}
                            placeholder="OBS (Congé...)"
                            className="w-36 text-xs text-slate-800 border border-slate-200 rounded px-2 py-1 bg-white"
                          />

                          <button
                            type="button"
                            onClick={() => onDeleteStaff(staff.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
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
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Bloc 16h (Personnel de Garde — Groupes A, B, C, D, E) — {paramedicalGuard.length} agents</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <select
                        value={guardGroupFilter}
                        onChange={(e) => setGuardGroupFilter(e.target.value)}
                        className="text-xs font-semibold border border-slate-200 rounded px-2 py-1 bg-slate-50"
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
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter en Garde</span>
                      </button>
                    </div>
                  </div>

                  {['A', 'B', 'C', 'D', 'E']
                    .filter((g) => guardGroupFilter === 'all' || guardGroupFilter === g)
                    .map((groupLetter) => {
                      const groupMembers = paramedicalGuard.filter((s) => s.teamGroup === groupLetter);

                      return (
                        <div key={groupLetter} className="border border-slate-200 rounded-lg overflow-hidden space-y-1">
                          <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
                            <span>GROUPE {groupLetter}</span>
                            <span className="text-[11px] text-slate-300 font-normal">
                              {groupMembers.length} membre{groupMembers.length > 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="p-2 space-y-1.5">
                            {groupMembers.map((staff, gIdx) => {
                              const isFirst = gIdx === 0;
                              const isLast = gIdx === groupMembers.length - 1;

                              return (
                                <div
                                  key={staff.id}
                                  className="flex items-center gap-2 p-1.5 rounded bg-slate-50 border border-slate-100"
                                >
                                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {gIdx + 1}
                                  </span>

                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      disabled={isFirst}
                                      onClick={() => handleMoveItem(groupMembers, gIdx, 'up')}
                                      className="p-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isLast}
                                      onClick={() => handleMoveItem(groupMembers, gIdx, 'down')}
                                      className="p-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <input
                                    type="text"
                                    value={staff.fullName}
                                    onChange={(e) => onUpdateStaffField(staff.id, 'fullName', e.target.value)}
                                    placeholder="Nom et Prénom"
                                    className="flex-1 min-w-[140px] text-xs font-bold text-slate-900 border border-slate-200 rounded px-2 py-0.5 bg-white"
                                  />

                                  <select
                                    value={staff.teamGroup}
                                    onChange={(e) => onUpdateStaffField(staff.id, 'teamGroup', e.target.value)}
                                    className="text-xs font-bold border border-slate-200 rounded px-1.5 py-0.5 bg-white"
                                    title="Changer de groupe"
                                  >
                                    {['A', 'B', 'C', 'D', 'E'].map((g) => (
                                      <option key={g} value={g}>
                                        Gr. {g}
                                      </option>
                                    ))}
                                  </select>

                                  <input
                                    type="text"
                                    value={staff.rolePortrait}
                                    onChange={(e) => onUpdateStaffField(staff.id, 'rolePortrait', e.target.value)}
                                    placeholder="Fonction"
                                    className="w-28 text-xs text-slate-800 border border-slate-200 rounded px-2 py-0.5 bg-white"
                                  />

                                  <input
                                    type="text"
                                    value={staff.obsPortrait}
                                    onChange={(e) => onUpdateStaffField(staff.id, 'obsPortrait', e.target.value)}
                                    placeholder="OBS"
                                    className="w-28 text-xs text-slate-800 border border-slate-200 rounded px-2 py-0.5 bg-white"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => onDeleteStaff(staff.id)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
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
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <span>Bloc 12h (Agents d'hygiène) — {hygieneStaff.length} agents</span>
                    </h4>
                    <button
                      type="button"
                      onClick={handleCreateHygiene}
                      className="text-xs text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter Agent d'hygiène</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {hygieneStaff.map((staff, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === hygieneStaff.length - 1;

                      return (
                        <div
                          key={staff.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                        >
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={isFirst}
                              onClick={() => handleMoveItem(hygieneStaff, idx, 'up')}
                              className="p-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isLast}
                              onClick={() => handleMoveItem(hygieneStaff, idx, 'down')}
                              className="p-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <input
                            type="text"
                            value={staff.fullName}
                            onChange={(e) => onUpdateStaffField(staff.id, 'fullName', e.target.value)}
                            placeholder="Nom et Prénom"
                            className="flex-1 min-w-[140px] text-xs font-bold text-slate-900 border border-slate-200 rounded px-2 py-1 bg-white"
                          />

                          <input
                            type="text"
                            value={staff.rolePortrait}
                            onChange={(e) => onUpdateStaffField(staff.id, 'rolePortrait', e.target.value)}
                            placeholder="Fonction"
                            className="w-36 text-xs text-slate-800 border border-slate-200 rounded px-2 py-1 bg-white"
                          />

                          <input
                            type="text"
                            value={staff.obsPortrait}
                            onChange={(e) => onUpdateStaffField(staff.id, 'obsPortrait', e.target.value)}
                            placeholder="OBS"
                            className="w-36 text-xs text-slate-800 border border-slate-200 rounded px-2 py-1 bg-white"
                          />

                          <button
                            type="button"
                            onClick={() => onDeleteStaff(staff.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
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

        {/* Modal Bottom Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Toutes les modifications sont synchronisées instantanément dans les feuilles A4 et la base locale.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-slate-900 hover:bg-black text-white shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Terminer & Fermer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
