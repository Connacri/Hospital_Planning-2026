import React from 'react';
import {
  LayoutGrid,
  FileSpreadsheet,
  Users,
  Calendar,
  Activity,
  SlidersHorizontal,
  ShieldCheck,
  Building2,
  Database,
  Cloud,
  Globe,
  Bell,
  Sparkles,
  Printer,
  Plus,
} from 'lucide-react';
import { SupportedLocale } from '../i18n/translations';
import avatarChief from '../assets/images/doctor_chief_avatar_1791546807017.jpg';

const AVATAR_CHIEF = avatarChief;
const FALLBACK_AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='32' fill='%230F172A'/%3E%3Cpath d='M32 16a10 10 0 100 20 10 10 0 000-20zm0 24c-11 0-20 6.7-20 15v1h40v-1c0-8.3-9-15-20-15z' fill='%2394A3B8'/%3E%3C/svg%3E";

export type ActiveTab = 'dashboard' | 'documents' | 'staff' | 'objectbox' | 'supabase' | 'flutter' | 'privacy';

interface ModernAppSidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenColumnWidths: () => void;
  onOpenCreateMonth: () => void;
  onOpenServiceSettings: () => void;
  onOpenRegulatoryAlerts: () => void;
  onOpenGuardStats: () => void;
  locale: SupportedLocale;
  onToggleLocale: () => void;
  staffCount: number;
}

export const ModernAppSidebar: React.FC<ModernAppSidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenColumnWidths,
  onOpenCreateMonth,
  onOpenServiceSettings,
  onOpenRegulatoryAlerts,
  onOpenGuardStats,
  locale,
  onToggleLocale,
  staffCount,
}) => {
  return (
    <aside className="no-print w-full lg:w-[82px] bg-[#1A1C29] m-2 sm:m-3 lg:m-4 rounded-[26px] sm:rounded-[32px] p-3 sm:py-5 flex lg:flex-col items-center justify-between shrink-0 shadow-2xl border border-white/5 select-none z-30">
      
      {/* Top Brand Medical Crescent Icon */}
      <div className="flex lg:flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          title="Accueil Dashboard Médical — E.H. Aïn El Türck"
          className="group relative w-11 h-11 rounded-full bg-[#27293A] hover:bg-[#303348] border border-white/10 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          {/* Medical Crescent & Star (Croissant Médical Hospitalier) */}
          <div className="relative flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 text-[#FF758F] transition-transform group-hover:scale-110 drop-shadow-[0_0_6px_rgba(255,117,143,0.6)]"
              fill="currentColor"
              aria-hidden="true"
            >
              {/* Croissant */}
              <path d="M12 2.2a9.8 9.8 0 1 0 9.8 9.8c0-.52-.04-1.03-.12-1.53a8 8 0 1 1-8.15-8.15c.5-.08 1.01-.12 1.53-.12-.35 0-.7.03-1.06.08v-.08z" />
              {/* Étoile */}
              <polygon points="16.5,7.8 17.2,9.4 18.9,9.5 17.6,10.6 18,12.3 16.5,11.3 15,12.3 15.4,10.6 14.1,9.5 15.8,9.4" />
            </svg>
          </div>
        </button>

        {/* Separator on desktop */}
        <div className="hidden lg:block w-7 h-[1px] bg-white/10 my-1" />
      </div>

      {/* Main Navigation Icons */}
      <nav className="flex lg:flex-col items-center gap-2 sm:gap-3">
        
        {/* 1. Dashboard (Vue d'ensemble prototype) */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          title="Tableau de bord (Vue d'ensemble)"
          className={`relative group w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            activeTab === 'dashboard'
              ? 'bg-[#FFB3BA] text-[#9F1239] shadow-lg font-bold scale-105'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          {activeTab === 'dashboard' && (
            <span className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 w-1.5 h-4 bg-[#FF758F] rounded-l-full shadow-sm" />
          )}
        </button>

        {/* 2. Documents & Plannings PDF (A4) */}
        <button
          type="button"
          onClick={() => onSelectTab('documents')}
          title="Tableaux d'Activité & Plannings PDF A4"
          className={`relative group w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            activeTab === 'documents'
              ? 'bg-[#FFB3BA] text-[#9F1239] shadow-lg font-bold scale-105'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5" />
          {activeTab === 'documents' && (
            <span className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 w-1.5 h-4 bg-[#FF758F] rounded-l-full shadow-sm" />
          )}
        </button>

        {/* 3. Personnel & Équipes */}
        <button
          type="button"
          onClick={() => onSelectTab('staff')}
          title={`Personnel Hospitalier (${staffCount} membres)`}
          className={`relative group w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            activeTab === 'staff'
              ? 'bg-[#FFB3BA] text-[#9F1239] shadow-lg font-bold scale-105'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-5 h-5" />
          {activeTab === 'staff' && (
            <span className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 w-1.5 h-4 bg-[#FF758F] rounded-l-full shadow-sm" />
          )}
        </button>

        {/* 4. Calendrier & Création Mois */}
        <button
          type="button"
          onClick={onOpenCreateMonth}
          title="Changer de mois ou créer un nouveau mois"
          className="group w-11 h-11 rounded-full text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-all"
        >
          <Calendar className="w-5 h-5" />
        </button>

        {/* 5. Activité & Statistiques de Gardes */}
        <button
          type="button"
          onClick={onOpenGuardStats}
          title="Statistiques de gardes & rotations"
          className="group w-11 h-11 rounded-full text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-all"
        >
          <Activity className="w-5 h-5" />
        </button>

        {/* 6. Alertes & Normes */}
        <button
          type="button"
          onClick={onOpenRegulatoryAlerts}
          title="Alertes réglementaires hospitalières"
          className="group w-11 h-11 rounded-full text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center transition-all"
        >
          <ShieldCheck className="w-5 h-5" />
        </button>

        {/* 7. Réglage en direct des largeurs de colonnes PDF */}
        <button
          type="button"
          onClick={onOpenColumnWidths}
          title="Régler les largeurs des colonnes (Nom, Grade, Équipe, etc.)"
          className="group w-11 h-11 rounded-full text-amber-400/90 hover:text-amber-300 hover:bg-amber-400/10 flex items-center justify-center transition-all"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>

        {/* 8. Cloud & Base de Données */}
        <button
          type="button"
          onClick={() => onSelectTab('supabase')}
          title="Synchronisation Supabase Cloud"
          className={`hidden lg:flex relative group w-11 h-11 rounded-full items-center justify-center transition-all ${
            activeTab === 'supabase'
              ? 'bg-[#FFB3BA] text-[#9F1239] shadow-lg font-bold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Cloud className="w-5 h-5" />
        </button>

        {/* 9. ObjectBox Studio */}
        <button
          type="button"
          onClick={() => onSelectTab('objectbox')}
          title="Moteur ObjectBox Réactif"
          className={`hidden lg:flex relative group w-11 h-11 rounded-full items-center justify-center transition-all ${
            activeTab === 'objectbox'
              ? 'bg-[#FFB3BA] text-[#9F1239] shadow-lg font-bold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Database className="w-5 h-5" />
        </button>

      </nav>

      {/* Bottom Profile & Actions */}
      <div className="flex lg:flex-col items-center gap-3">
        {/* Language switch */}
        <button
          type="button"
          onClick={onToggleLocale}
          title={`Langue: ${locale.toUpperCase()} (Cliquer pour changer)`}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-bold flex items-center justify-center border border-white/10 transition-colors"
        >
          {locale.toUpperCase()}
        </button>

        {/* Doctor Chief Avatar (From prototype) */}
        <div
          onClick={onOpenServiceSettings}
          className="cursor-pointer relative group w-10 h-10 rounded-full overflow-hidden ring-2 ring-rose-400/60 hover:ring-rose-300 shadow-md transition-all hover:scale-105"
          title="Dr. Medjber Tami · Médecin Chef en Rhumatologie"
        >
          <img
            src={AVATAR_CHIEF}
            alt="Dr. Medjber Tami"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_AVATAR;
            }}
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#1A1C29]" />
        </div>
      </div>

    </aside>
  );
};
