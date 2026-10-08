import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Edit3,
  Eye,
  Printer,
  FileText,
  FileSpreadsheet,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  ArrowUp,
  Repeat,
  Tag,
  HeartHandshake,
  BarChart3,
  AlertTriangle,
  Share2,
  Archive,
  Download,
  Stamp,
  Calendar,
  CalendarOff,
  Cloud,
} from 'lucide-react';
import { TranslationDictionary, SupportedLocale } from '../i18n/translations';

interface QuickActionsFloatingMenuProps {
  isReadOnly: boolean;
  onToggleReadOnly: (val?: boolean) => void;
  orientation: 'portrait' | 'landscape';
  onChangeOrientation: (o: 'portrait' | 'landscape') => void;
  zoomLevel: number;
  onChangeZoom: (updater: (prev: number) => number) => void;
  onResetZoom: () => void;
  onFitWidth?: () => void;
  onFitPageComplete?: () => void;
  onPrint: () => void;
  onResetDefaults?: () => void;
  onOpenGuardRotationModal?: () => void;
  onOpenLeaveTypesModal?: () => void;
  onOpenHolidayModal?: () => void;
  onOpenMaternityModal?: () => void;
  isModificatif?: boolean;
  onToggleModificatif?: () => void;
  onOpenModificatifModal?: () => void;
  onLoadOctoberPreset?: () => void;
  onLoadAprilPreset?: () => void;
  onLoadJanuaryPreset?: () => void;
  onOpenCreateMonthModal?: () => void;
  onDirectPdfDownload?: () => void;
  onOpenGuardStats?: () => void;
  onOpenRegulatoryAlerts?: () => void;
  onOpenStaffShare?: () => void;
  onOpenDocumentValidation?: () => void;
  onOpenMonthlyArchive?: () => void;
  onOpenSupabaseSync?: () => void;
  locale: SupportedLocale;
  t: TranslationDictionary;
}

export const QuickActionsFloatingMenu: React.FC<QuickActionsFloatingMenuProps> = ({
  isReadOnly,
  onToggleReadOnly,
  orientation,
  onChangeOrientation,
  zoomLevel,
  onChangeZoom,
  onResetZoom,
  onFitWidth,
  onFitPageComplete,
  onPrint,
  onResetDefaults,
  onOpenGuardRotationModal,
  onOpenLeaveTypesModal,
  onOpenHolidayModal,
  onOpenMaternityModal,
  isModificatif = false,
  onToggleModificatif,
  onOpenModificatifModal,
  onLoadOctoberPreset,
  onLoadAprilPreset,
  onLoadJanuaryPreset,
  onOpenCreateMonthModal,
  onDirectPdfDownload,
  onOpenGuardStats,
  onOpenRegulatoryAlerts,
  onOpenStaffShare,
  onOpenDocumentValidation,
  onOpenMonthlyArchive,
  onOpenSupabaseSync,
  locale,
  t,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <motion.aside
      key="quick-actions-floating-menu"
      initial={{ opacity: 0, y: 50, scale: 0.93 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.93 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      aria-label={t.quickActionsTitle}
      className="no-print fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 max-w-[calc(100vw-24px)] sm:max-w-sm select-none font-sans"
    >
      <AnimatePresence mode="wait">
        {/* COLLAPSED FLOATING PILL */}
        {!isExpanded && (
          <motion.div
            key="collapsed-pill"
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex items-center gap-2 bg-slate-950/95 backdrop-blur-md border border-slate-700/80 p-2 rounded-2xl shadow-2xl text-slate-100 hover:border-slate-500 transition-all"
          >
            <button
              type="button"
              onClick={() => onToggleReadOnly()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isReadOnly
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
              title={
                isReadOnly
                  ? 'Actuellement en Lecture Seule. Cliquez pour éditer.'
                  : 'Actuellement en Mode Édition. Cliquez pour verrouiller.'
              }
            >
              {isReadOnly ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t.modeReadOnly}</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{t.modeEdit}</span>
                </>
              )}
            </button>

            {isModificatif && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-1 rounded-lg border border-amber-500/40">
                (Modificatif)
              </span>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Ouvrir le panneau d'actions rapides"
            >
              <span>{t.quickActionsTitle}</span>
              <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
            </button>
          </motion.div>
        )}

        {/* EXPANDED FLOATING PANEL */}
        {isExpanded && (
          <motion.div
            key="expanded-panel"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-[calc(100vw-24px)] sm:w-[350px] max-w-sm bg-slate-950/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10"
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/80 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-sky-500/20 text-sky-400">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-bold tracking-tight text-white uppercase">
                  {t.quickActionsTitle}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                    isReadOnly
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}
                >
                  {isReadOnly ? (
                    <>
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                      <span>Protégé</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-2.5 h-2.5 text-amber-400" />
                      <span>Édition</span>
                    </>
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Réduire le menu flottant"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

          <div className="p-3.5 space-y-3 text-xs max-h-[82vh] overflow-y-auto">
            {/* PRIMARY TOGGLE: READ-ONLY VS EDIT MODE */}
            <div>
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-1.5">
                <span>Mode de Consultation &amp; Saisie</span>
                <span className="text-[10px] text-slate-500 font-normal">Protection</span>
              </div>

              <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl border border-slate-800 gap-1">
                {/* READ ONLY BUTTON */}
                <button
                  type="button"
                  onClick={() => onToggleReadOnly(true)}
                  className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg font-medium transition-all ${
                    isReadOnly
                      ? 'bg-emerald-600 text-white shadow-md font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <Lock className="w-3.5 h-3.5" />
                    <span>{t.modeReadOnly}</span>
                  </div>
                  <span
                    className={`text-[9.5px] mt-0.5 leading-none ${
                      isReadOnly ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    Sécurisé (Anti-clic)
                  </span>
                </button>

                {/* EDIT MODE BUTTON */}
                <button
                  type="button"
                  onClick={() => onToggleReadOnly(false)}
                  className={`flex flex-col items-center justify-center py-2 px-2 rounded-lg font-medium transition-all ${
                    !isReadOnly
                      ? 'bg-amber-600 text-white shadow-md font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t.modeEdit}</span>
                  </div>
                  <span
                    className={`text-[9.5px] mt-0.5 leading-none ${
                      !isReadOnly ? 'text-amber-100' : 'text-slate-500'
                    }`}
                  >
                    Saisie active
                  </span>
                </button>
              </div>
            </div>

            {/* VERSION MODIFICATIVE / (MODIFICATIF) TOGGLE */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                <span>Version du Planning</span>
                <span className="text-[10px] text-slate-500 font-normal">Mention officielle</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isModificatif ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span className="text-xs font-bold text-white truncate">Planning Modificatif</span>
                    {isModificatif && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/40">
                        (Modificatif)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    Affiche <strong>(Modificatif)</strong> en gras sur tous les titres
                  </p>
                </div>
                {onToggleModificatif && (
                  <button
                    type="button"
                    onClick={onToggleModificatif}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                      isModificatif
                        ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-xs'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {isModificatif ? 'Actif' : 'Activer'}
                  </button>
                )}
              </div>
            </div>

            {/* QUICK FORMAT & ORIENTATION TOGGLE */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-1.5">
                <span>Format Document A4</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {orientation === 'portrait' ? '210×297 mm' : '297×210 mm'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onChangeOrientation('portrait')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs transition-colors ${
                    orientation === 'portrait'
                      ? 'bg-sky-600 border-sky-500 text-white font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Portrait</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeOrientation('landscape')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs transition-colors ${
                    orientation === 'landscape'
                      ? 'bg-sky-600 border-sky-500 text-white font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Paysage</span>
                </button>
              </div>
            </div>

            {/* HOSPITAL TOOLS: MATERNITY LEAVE, GUARD ROTATION & LEAVE TYPES */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <div className="text-slate-300 font-semibold text-[11px] flex items-center justify-between">
                <span>Outils &amp; Congés Spécifiques</span>
                <span className="text-[10px] text-slate-500 font-normal">Actions</span>
              </div>
              <div className="space-y-1.5">
                {onOpenMaternityModal && (
                  <button
                    type="button"
                    onClick={onOpenMaternityModal}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-800/90 text-rose-200 text-[11px] font-semibold transition-colors"
                    title="Gérer le congé de maternité (cellule fusionnée J1-J26)"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
                    <span>Congé de Maternité (Cellule Fusionnée)</span>
                  </button>
                )}
                <div className="grid grid-cols-2 gap-1.5">
                  {onOpenGuardRotationModal && (
                    <button
                      type="button"
                      onClick={onOpenGuardRotationModal}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-sky-950/60 hover:bg-sky-900 border border-sky-800/80 text-sky-200 text-[11px] font-semibold transition-colors"
                      title="Gérer la rotation des équipes (Période ou Perpétuelle)"
                    >
                      <Repeat className="w-3.5 h-3.5 text-sky-400" />
                      <span>Rotation Garde</span>
                    </button>
                  )}
                  {onOpenLeaveTypesModal && (
                    <button
                      type="button"
                      onClick={onOpenLeaveTypesModal}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-800/80 text-amber-200 text-[11px] font-semibold transition-colors"
                      title="Ajouter, modifier ou supprimer des types de congés"
                    >
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>Types Congés</span>
                    </button>
                  )}
                </div>
                {onOpenHolidayModal && (
                  <button
                    type="button"
                    onClick={onOpenHolidayModal}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-200 text-[11px] font-semibold transition-colors"
                    title="Ajouter un ou plusieurs jours fériés dans le planning du mois"
                  >
                    <CalendarOff className="w-3.5 h-3.5 text-red-400" />
                    <span>Jours Fériés</span>
                  </button>
                )}
                {onOpenModificatifModal && (
                  <button
                    type="button"
                    onClick={onOpenModificatifModal}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-700/80 text-amber-200 text-[11px] font-semibold transition-colors"
                    title="Gérer la mention (Modificatif) tableau par tableau ou globale"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mentions (Modificatif) au Choix</span>
                  </button>
                )}
              </div>
            </div>

            {/* ADVANCED HOSPITAL MANAGEMENT & AUDIT TOOLS */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                <span>Gestion &amp; Contrôle Avancés</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {onOpenGuardStats && (
                  <button
                    type="button"
                    onClick={onOpenGuardStats}
                    className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-[10.5px] font-semibold transition-colors truncate"
                    title="Compteur et statistiques d'équité des gardes"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Compteur Gardes</span>
                  </button>
                )}
                {onOpenRegulatoryAlerts && (
                  <button
                    type="button"
                    onClick={onOpenRegulatoryAlerts}
                    className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-[10.5px] font-semibold transition-colors truncate"
                    title="Vérifier les anomalies et règles réglementaires de repos"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Contrôle &amp; Alertes</span>
                  </button>
                )}
                {onOpenStaffShare && (
                  <button
                    type="button"
                    onClick={onOpenStaffShare}
                    className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-[10.5px] font-semibold transition-colors truncate"
                    title="Envoyer la fiche individuelle par WhatsApp ou Email"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>WhatsApp / Fiche</span>
                  </button>
                )}
                {onOpenDocumentValidation && (
                  <button
                    type="button"
                    onClick={onOpenDocumentValidation}
                    className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-[10.5px] font-semibold transition-colors truncate"
                    title="Validation officielle, cachet et code QR de certification"
                  >
                    <Stamp className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Cachet &amp; QR Code</span>
                  </button>
                )}
                {onOpenMonthlyArchive && (
                  <button
                    type="button"
                    onClick={onOpenMonthlyArchive}
                    className="col-span-2 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-[10.5px] font-semibold transition-colors"
                    title="Archives mensuelles et duplication vers le mois suivant"
                  >
                    <Archive className="w-3.5 h-3.5 text-sky-400" />
                    <span>Archives &amp; Duplication Mois Suivant</span>
                  </button>
                )}
                {onOpenSupabaseSync && (
                  <button
                    type="button"
                    onClick={onOpenSupabaseSync}
                    className="col-span-2 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-200 rounded-lg text-[10.5px] font-semibold transition-colors"
                    title="Ouvrir la passerelle Remote DB et synchronisation Supabase"
                  >
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Remote DB &amp; Supabase Cloud Sync</span>
                  </button>
                )}
              </div>
            </div>

            {/* MONTH / PDF PRESETS */}
            {(onLoadOctoberPreset || onLoadAprilPreset || onLoadJanuaryPreset || onOpenCreateMonthModal) && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                  <span>Mois &amp; Continuité</span>
                  <span className="text-[9px] text-sky-400 font-mono">100% Automatique</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {onLoadOctoberPreset && (
                    <button
                      type="button"
                      onClick={onLoadOctoberPreset}
                      className="px-2 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700 text-indigo-200 rounded-lg text-[10.5px] font-bold text-left truncate transition-colors flex items-center justify-between"
                      title="Recharger le modèle officiel d'Octobre 2026 (Actuel)"
                    >
                      <span className="truncate">🍁 Octobre 2026</span>
                      <span className="text-[9px] bg-indigo-500/30 text-indigo-300 px-1 py-0.2 rounded font-mono shrink-0 ml-1">31j</span>
                    </button>
                  )}
                  {onOpenCreateMonthModal && (
                    <button
                      type="button"
                      onClick={onOpenCreateMonthModal}
                      className="px-2 py-1.5 bg-sky-950/80 hover:bg-sky-900 border border-sky-700 text-sky-200 rounded-lg text-[10.5px] font-bold text-left truncate transition-colors flex items-center justify-between"
                      title="Créer ou choisir un mois suivant en continuité perpétuelle"
                    >
                      <span className="truncate">🗓️ Mois Suivant...</span>
                      <span className="text-[9px] bg-sky-500/30 text-sky-300 px-1 py-0.2 rounded font-mono shrink-0 ml-1">+1</span>
                    </button>
                  )}
                  {onLoadAprilPreset && (
                    <button
                      type="button"
                      onClick={onLoadAprilPreset}
                      className="px-2 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-200 rounded-lg text-[10.5px] font-medium text-left truncate transition-colors flex items-center justify-between"
                      title="Charger le modèle d'Avril 2026"
                    >
                      <span className="truncate">🌸 Avril 2026</span>
                      <span className="text-[9px] bg-emerald-500/30 text-emerald-300 px-1 py-0.2 rounded font-mono shrink-0 ml-1">30j</span>
                    </button>
                  )}
                  {onLoadJanuaryPreset && (
                    <button
                      type="button"
                      onClick={onLoadJanuaryPreset}
                      className="px-2 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-700 text-amber-200 rounded-lg text-[10.5px] font-medium text-left truncate transition-colors flex items-center justify-between"
                      title="Charger Janvier 2026 avec mention (Modificatif)"
                    >
                      <span className="truncate">❄️ Janvier (Modif)</span>
                      <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1 py-0.2 rounded font-mono shrink-0 ml-1">31j</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ZOOM & PRINT CONTROLS (RESPONSIVE 2-ROW DESIGN) */}
            <div className="pt-2.5 border-t border-slate-800/90 space-y-2">
              {/* Row 1: Zoom tools + Back to top & Jump to bottom */}
              <div className="flex items-center justify-between gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => onChangeZoom((z) => Math.max(50, z - 10))}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                    title="Zoom -"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onResetZoom}
                    className="px-1.5 font-mono text-[11px] text-white font-bold hover:text-sky-300 transition-colors"
                    title="Réinitialiser à 100%"
                  >
                    {zoomLevel}%
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeZoom((z) => Math.min(150, z + 10))}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                    title="Zoom +"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {onFitWidth && (
                    <button
                      type="button"
                      onClick={onFitWidth}
                      className="px-2 py-0.5 text-[10px] font-bold bg-sky-950 text-sky-300 hover:bg-sky-900 rounded-md border border-sky-800 transition-colors"
                      title="Ajuster la vue pour voir tous les 30/31 jours"
                    >
                      30 jours
                    </button>
                  )}
                  {onFitPageComplete && (
                    <button
                      type="button"
                      onClick={onFitPageComplete}
                      className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 text-emerald-300 hover:bg-emerald-900 rounded-md border border-emerald-800 transition-colors"
                      title="Afficher la page complète (A4 vertical 100% visible)"
                    >
                      Entier
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={scrollToTop}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors ml-0.5"
                    title="Remonter tout en haut de la page"
                  >
                    <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
                  </button>
                  <button
                    type="button"
                    onClick={scrollToBottom}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                    title="Descendre tout en bas de la page (Signatures &amp; Validations)"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
                  </button>
                </div>
              </div>

              {/* Row 2: Print & PDF Direct Action Buttons */}
              <div className={`grid ${onDirectPdfDownload ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                {onDirectPdfDownload && (
                  <button
                    type="button"
                    onClick={onDirectPdfDownload}
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs transition-colors shadow-sm active:scale-95"
                    title="Télécharger le fichier PDF directement"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">PDF Direct</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onPrint}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm active:scale-95"
                  title="Imprimer ou enregistrer en PDF (A4)"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">Imprimer A4</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.aside>
  );
};
