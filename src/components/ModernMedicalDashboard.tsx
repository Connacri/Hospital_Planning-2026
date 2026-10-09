import React, { useState } from 'react';
import {
  Stethoscope,
  Building2,
  Ambulance,
  Pill,
  Users,
  FolderClock,
  ShieldCheck,
  FlaskConical,
  Printer,
  SlidersHorizontal,
  Heart,
  Bone,
  Eye,
  Scan,
  Activity,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  ChevronRight,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  HospitalDocumentConfig,
  StaffEntity,
  TableColumnWidthSettings,
} from '../db/objectboxEngine';

// Images d'avatars de médecins générées
const AVATAR_CHIEF = '/src/assets/images/doctor_chief_avatar_1791546807017.jpg';
const AVATAR_SPECIALIST = '/src/assets/images/doctor_specialist_avatar_1791546817441.jpg';
const AVATAR_RESIDENT = '/src/assets/images/doctor_resident_avatar_1791546827755.jpg';

interface ModernMedicalDashboardProps {
  config: HospitalDocumentConfig;
  staffList: StaffEntity[];
  onOpenDocuments: (orientation?: 'portrait' | 'landscape') => void;
  onOpenStaff: () => void;
  onOpenColumnWidths: () => void;
  onOpenTableManagement: (tab?: 'table1' | 'table2' | 'table3') => void;
  onOpenServiceSettings: () => void;
  onOpenLeaveTypes: () => void;
  onOpenMonthHistory: () => void;
  onOpenRegulatoryAlerts: () => void;
  onOpenGuardStats: () => void;
  onOpenDocumentValidation: () => void;
  onOpenCreateMonth: () => void;
  onQuickPrint: () => void;
}

export const ModernMedicalDashboard: React.FC<ModernMedicalDashboardProps> = ({
  config,
  staffList,
  onOpenDocuments,
  onOpenStaff,
  onOpenColumnWidths,
  onOpenTableManagement,
  onOpenServiceSettings,
  onOpenLeaveTypes,
  onOpenMonthHistory,
  onOpenRegulatoryAlerts,
  onOpenGuardStats,
  onOpenDocumentValidation,
  onOpenCreateMonth,
  onQuickPrint,
}) => {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('rhumato');

  const doctors = staffList.filter((s) => s.category === 'medical');
  const paramedical = staffList.filter((s) => s.category.startsWith('paramedical'));
  const chiefDoctor = doctors.find((d) => d.fullName.toLowerCase().includes('medjber')) || doctors[0];
  const specialistDoctor = doctors.find((d) => d.fullName.toLowerCase().includes('bakhouche')) || doctors[1] || doctors[0];

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Top Banner / Welcome Kicker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-100 via-pink-50 to-amber-50 border border-rose-200/50 flex items-center justify-center text-rose-500 shadow-inner">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                {config.hospitalHeader || "Établissement Hospitalier d'Aïn El Türck"}
              </h1>
              <span className="hidden md:inline-flex px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-100/70 text-rose-700 border border-rose-200">
                {config.guardMonthName || "Octobre 2026"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {config.unitTitle || "Service de Rhumatologie"} · Dr. Medjber Tami · Gestion & Édition A4
            </p>
          </div>
        </div>

        {/* Quick Action Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenDocuments('landscape')}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-rose-300" />
            <span>Ouvrir Tableaux d'Activité</span>
          </button>
          <button
            type="button"
            onClick={onQuickPrint}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 text-xs font-bold transition-all"
            title="Imprimer ou exporter en PDF A4"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimer PDF</span>
          </button>
          <button
            type="button"
            onClick={onOpenColumnWidths}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 text-xs font-bold transition-all"
            title="Ajuster en direct les largeurs des colonnes"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
            <span>Régler Largeurs</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Column (What do you need?) & Right Column (Find Doctor + Your Appointments) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ====================================================================
            LEFT SECTION: "What do you need?" / "Modules & Services"
            (Matches the 2-column square white cards with circular icon wells)
           ==================================================================== */}
        <div className="lg:col-span-5 bg-white/60 backdrop-blur-sm p-5 sm:p-6 rounded-[32px] border border-slate-100/90 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Que souhaitez-vous faire ?
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sélectionnez votre module ou action hospitalière
            </p>
          </div>

          {/* Grid of 10 Rounded Square Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-3.5 pt-1">
            
            {/* 1. Médecins */}
            <button
              type="button"
              onClick={() => onOpenDocuments('landscape')}
              className="group p-4 rounded-3xl bg-white hover:bg-slate-50/80 border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md group-hover:bg-slate-800 transition-colors">
                <Stethoscope className="w-5 h-5 text-rose-300" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                1er Tab. Médecins
              </span>
            </button>

            {/* 2. Hôpital & Service */}
            <button
              type="button"
              onClick={onOpenServiceSettings}
              className="group p-4 rounded-3xl bg-white hover:bg-slate-50/80 border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/60 group-hover:bg-slate-200/80 transition-colors">
                <Building2 className="w-5 h-5 text-slate-700" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Hôpital & Service
              </span>
            </button>

            {/* 3. Garde & Urgences (3ème Tableau Équipes) */}
            <button
              type="button"
              onClick={() => onOpenDocuments('landscape')}
              className="group p-4 rounded-3xl bg-white hover:bg-slate-50/80 border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/60 group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                <Ambulance className="w-5 h-5 text-slate-700 group-hover:text-rose-600" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                3ème Tab. Garde 16h
              </span>
            </button>

            {/* 4. Codes & Congés */}
            <button
              type="button"
              onClick={onOpenLeaveTypes}
              className="group p-4 rounded-3xl bg-white hover:bg-slate-50/80 border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/60 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                <Pill className="w-5 h-5 text-slate-700 group-hover:text-amber-600" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Codes & Congés
              </span>
            </button>

            {/* 5. Paramédical Jour */}
            <button
              type="button"
              onClick={() => onOpenDocuments('landscape')}
              className="group p-4 rounded-3xl bg-white hover:bg-slate-50/80 border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/60 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                <Users className="w-5 h-5 text-slate-700 group-hover:text-sky-600" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Paramédical Jour
              </span>
            </button>

            {/* 6. Archives & Mois */}
            <button
              type="button"
              onClick={onOpenMonthHistory}
              className="group p-4 rounded-3xl bg-white hover:bg-slate-50/80 border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/60 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <FolderClock className="w-5 h-5 text-slate-700 group-hover:text-indigo-600" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Archives Mensuelles
              </span>
            </button>

            {/* 7. Alertes & Contrôle */}
            <button
              type="button"
              onClick={onOpenRegulatoryAlerts}
              className="group p-4 rounded-3xl bg-white hover:bg-slate-50/80 border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/60 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <ShieldCheck className="w-5 h-5 text-slate-700 group-hover:text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Alertes & Normes
              </span>
            </button>

            {/* 8. Analyses & Rotation */}
            <button
              type="button"
              onClick={onOpenGuardStats}
              className="group p-4 rounded-3xl bg-white hover:bg-slate-50/80 border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/60 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                <FlaskConical className="w-5 h-5 text-slate-700 group-hover:text-purple-600" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Stats & Rotation
              </span>
            </button>

            {/* 9. Réglage Largeurs Colonnes PDF */}
            <button
              type="button"
              onClick={onOpenColumnWidths}
              className="group p-4 rounded-3xl bg-white hover:bg-amber-50/40 border border-amber-200/60 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-300/60 group-hover:bg-amber-200 transition-colors">
                <SlidersHorizontal className="w-5 h-5 text-amber-700" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Largeurs Colonnes
              </span>
            </button>

            {/* 10. Gestion Tables & Lignes */}
            <button
              type="button"
              onClick={() => onOpenTableManagement('table1')}
              className="group p-4 rounded-3xl bg-white hover:bg-slate-50/80 border border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/60 group-hover:bg-slate-200/80 transition-colors">
                <Layers className="w-5 h-5 text-slate-700" />
              </div>
              <span className="text-xs font-bold text-slate-800">
                Gérer Tableaux
              </span>
            </button>

          </div>
        </div>

        {/* ====================================================================
            RIGHT SECTION:
            Part A: "Find Doctor / Spécialités & Médecins" (Pastel category tiles)
            Part B: "Your Appointments / Plannings & Gardes du Jour"
           ==================================================================== */}
        <div className="lg:col-span-7 space-y-6">

          {/* PART A: FIND DOCTOR / MÉDECINS & SPÉCIALITÉS */}
          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Médecins & Spécialités
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Service de Rhumatologie · E.H. Aïn El Türck
              </p>
            </div>

            {/* Pastel Category Tiles Grid (Exact match of prototype) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              {/* Pastel Yellow Card: Rhumatologie / Articulaire */}
              <div
                onClick={() => setSelectedSpecialty('rhumato')}
                className="cursor-pointer p-3.5 rounded-3xl bg-[#FFF3D6] text-[#8C6D1F] border border-[#FDE68A] flex flex-col items-center justify-center text-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform"
              >
                <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-[#8C6D1F]">
                  <Bone className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold">Rhumatologie</span>
              </div>

              {/* Pastel Coral / Pink Hero Card: Dr. Medjber Tami (Doctor Chief) */}
              <div
                onClick={() => onOpenDocuments('landscape')}
                className="cursor-pointer col-span-2 sm:col-span-1 p-3.5 rounded-3xl bg-[#FFE2E6] text-[#B83253] border border-[#FECDD3] flex flex-col items-center justify-center text-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform relative overflow-hidden group"
              >
                <img
                  src={AVATAR_CHIEF}
                  alt="Dr. Medjber Tami"
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <div className="leading-tight">
                  <div className="text-[11.5px] font-bold text-[#881337] truncate max-w-[130px]">
                    {chiefDoctor ? chiefDoctor.fullName : "Dr. Medjber Tami"}
                  </div>
                  <div className="text-[9.5px] text-[#9F1239] opacity-85">
                    Médecin Chef
                  </div>
                </div>
              </div>

              {/* Pastel Lavender / Purple Card: Radiologie */}
              <div
                onClick={() => setSelectedSpecialty('radio')}
                className="cursor-pointer p-3.5 rounded-3xl bg-[#EFE8FF] text-[#6941C6] border border-[#DDD6FE] flex flex-col items-center justify-center text-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform"
              >
                <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-[#6941C6]">
                  <Scan className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold">Radiologie</span>
              </div>

              {/* Pastel Mint / Cyan Card: Ortho */}
              <div
                onClick={() => setSelectedSpecialty('ortho')}
                className="cursor-pointer p-3.5 rounded-3xl bg-[#D9F4F6] text-[#0E7090] border border-[#A5F3FC] flex flex-col items-center justify-center text-center gap-1.5 shadow-sm hover:scale-[1.02] transition-transform"
              >
                <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-[#0E7090]">
                  <Bone className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold">Orthopédie</span>
              </div>

              {/* Pastel Lilac Card: Ophtalmologie / Examens */}
              <div
                onClick={() => setSelectedSpecialty('ophtalmo')}
                className="cursor-pointer col-span-2 p-3 rounded-3xl bg-[#EFE8FF] text-[#6941C6] border border-[#DDD6FE] flex items-center justify-center gap-2.5 shadow-sm hover:scale-[1.01] transition-transform"
              >
                <Eye className="w-4 h-4" />
                <span className="text-[11px] font-bold">Consultations Spécialisées</span>
              </div>

              {/* Pastel Gray Card: Chirurgie */}
              <div
                onClick={() => setSelectedSpecialty('chirurgie')}
                className="cursor-pointer p-3 rounded-3xl bg-[#F0F2F5] text-[#334155] border border-slate-200 flex items-center justify-center text-center shadow-sm hover:scale-[1.02] transition-transform"
              >
                <span className="text-[11px] font-bold">Hospitalisation</span>
              </div>

              {/* Pastel Orange / Amber Card: MPR */}
              <div
                onClick={() => setSelectedSpecialty('mpr')}
                className="cursor-pointer p-3 rounded-3xl bg-[#FFEAD5] text-[#9A3412] border border-[#FED7AA] flex items-center justify-center text-center shadow-sm hover:scale-[1.02] transition-transform"
              >
                <span className="text-[11px] font-bold">Rééducation</span>
              </div>
            </div>
          </div>

          {/* PART B: YOUR APPOINTMENTS / PLANNINGS & GARDES DU JOUR */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Plannings & Gardes Actives
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Répartition des équipes et permanence des soins
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenDocuments('landscape')}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 hover:underline"
              >
                <span>Tout afficher</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Doctor / Staff Appointment Cards (Exact layout from prototype) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Card 1: Dr. Medjber Tami */}
              <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <img
                    src={AVATAR_CHIEF}
                    alt="Dr. Medjber Tami"
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900">
                      {chiefDoctor?.fullName || "Dr. Medjber Tami"}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      E.H. Aïn El Türck · Rhumatologie
                    </p>
                  </div>
                </div>

                {/* Role Pill */}
                <div className="py-1 px-2.5 rounded-xl bg-[#FFE2E6] text-[#B83253] text-[10.5px] font-bold text-center">
                  Médecin Chef en Rhumatologie
                </div>

                {/* Date & Time Grid */}
                <div className="grid grid-cols-2 gap-2 text-center py-1 border-t border-b border-slate-100">
                  <div>
                    <div className="text-[9.5px] text-slate-400 font-semibold">Mois</div>
                    <div className="text-[11px] font-bold text-slate-800">
                      {config.guardMonthName || "Octobre 2026"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9.5px] text-slate-400 font-semibold">Horaires</div>
                    <div className="text-[11px] font-bold text-slate-800">08h00 - 16h00</div>
                  </div>
                </div>

                {/* Circular Action Buttons */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenDocuments('landscape')}
                    title="Voir dans le tableau d'activité"
                    className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-rose-300" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenColumnWidths}
                    title="Régler les largeurs de colonnes"
                    className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                  <button
                    type="button"
                    onClick={onQuickPrint}
                    title="Imprimer la feuille"
                    className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5 text-sky-300" />
                  </button>
                </div>
              </div>

              {/* Card 2: Dr. Bakhouche / Médecin Spécialiste */}
              <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <img
                    src={AVATAR_SPECIALIST}
                    alt="Dr. Bakhouche"
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900">
                      {specialistDoctor?.fullName || "Dr. Bakhouche"}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      Unité Hospitalisation & Soins
                    </p>
                  </div>
                </div>

                {/* Role Pill */}
                <div className="py-1 px-2.5 rounded-xl bg-[#EFE8FF] text-[#6941C6] text-[10.5px] font-bold text-center">
                  Médecin Spécialiste
                </div>

                {/* Date & Time Grid */}
                <div className="grid grid-cols-2 gap-2 text-center py-1 border-t border-b border-slate-100">
                  <div>
                    <div className="text-[9.5px] text-slate-400 font-semibold">Activité</div>
                    <div className="text-[11px] font-bold text-slate-800">Temps Plein</div>
                  </div>
                  <div>
                    <div className="text-[9.5px] text-slate-400 font-semibold">Permanence</div>
                    <div className="text-[11px] font-bold text-slate-800">Service Actif</div>
                  </div>
                </div>

                {/* Circular Action Buttons */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenDocuments('portrait')}
                    title="Voir en format Portrait A4"
                    className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-300" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenStaff}
                    title="Gérer le personnel"
                    className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                  <button
                    type="button"
                    onClick={onOpenGuardStats}
                    title="Statistiques de gardes"
                    className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-300" />
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
