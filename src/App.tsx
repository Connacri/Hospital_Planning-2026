/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  Users,
  Database,
  Code2,
  Shield,
  Printer,
  RotateCcw,
  Download,
  Upload,
  Plus,
  Search,
  Check,
  Copy,
  Trash2,
  PaintBucket,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar,
  Layers,
  Sparkles,
  Info,
  X,
  FileSpreadsheet,
  Building2,
  AlertTriangle,
  Lock,
  Unlock,
  Edit3,
  Eye,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  SlidersHorizontal,
  Tag,
  Repeat,
  HeartHandshake,
  BarChart3,
  Share2,
  Archive,
  Stamp,
  CheckCircle2,
  Globe,
  Cloud,
} from 'lucide-react';
import {
  objectBoxStore,
  HospitalDocumentConfig,
  StaffEntity,
  StaffCategory,
  DoctorWeeklySchedule,
  LeaveTypeItem,
  DEFAULT_LEAVE_TYPES,
  DEFAULT_GUARD_ROTATION_ORDER,
  GUARD_MONTHS_PRESETS,
  buildStandard08h16hActivity,
  buildGuard16hActivity,
  buildHygiene12hActivity,
  TableModificatifKey,
  isTableModificatif,
  TABLE_MODIFICATIF_LABELS,
  GUARD_TEAM_THEMES,
  getTeamBadgeClass,
  getTeamTheme,
} from './db/objectboxEngine';
import { AnimatePresence } from 'framer-motion';
import { PortraitPdfSheets } from './components/PortraitPdfSheets';
import { LandscapePdfSheets } from './components/LandscapePdfSheets';
import { QuickActionsFloatingMenu } from './components/QuickActionsFloatingMenu';
import { DocumentQuickNavigator } from './components/DocumentQuickNavigator';
import { CreateMonthModal } from './components/CreateMonthModal';
import { GuardRotationModal } from './components/GuardRotationModal';
import { LeaveTypesModal } from './components/LeaveTypesModal';
import { HolidayModal } from './components/HolidayModal';
import { MaternityModal } from './components/MaternityModal';
import { ModificatifModal } from './components/ModificatifModal';
import { StaffDistributionChartWidget } from './components/StaffDistributionChartWidget';
import { ServiceSettingsModal } from './components/ServiceSettingsModal';
import { GuardStatsModal } from './components/GuardStatsModal';
import { RegulatoryAlertsModal } from './components/RegulatoryAlertsModal';
import { StaffShareModal } from './components/StaffShareModal';
import { DocumentValidationModal, ValidationStatus } from './components/DocumentValidationModal';
import { MonthlyArchiveModal, MonthlyArchiveRecord } from './components/MonthlyArchiveModal';
import { SupabaseSyncPanel } from './components/SupabaseSyncPanel';
import { exportDirectPdf } from './utils/pdfExportHelper';
import { translations, SupportedLocale } from './i18n/translations';

type ActiveTab = 'documents' | 'staff' | 'objectbox' | 'supabase' | 'flutter' | 'privacy';

export default function App() {
  const [locale, setLocale] = useState<SupportedLocale>('fr');
  const t = translations[locale];

  // ObjectBox Store Reactive State
  const [snapshot, setSnapshot] = useState(() => objectBoxStore.getSnapshot());

  useEffect(() => {
    const unsubscribe = objectBoxStore.subscribe(() => {
      setSnapshot({ ...objectBoxStore.getSnapshot() });
    });
    return unsubscribe;
  }, []);

  // Update HTML lang & dir attributes when locale changes
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  const config = snapshot.config;
  const staffList = snapshot.staffBox;

  // Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('documents');

  // Documents View State
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Update body data-orientation for print A4 paper formatting
  useEffect(() => {
    document.body.setAttribute('data-orientation', orientation);
  }, [orientation]);
  const [portraitSubPage, setPortraitSubPage] = useState<'all' | 'p1' | 'p2' | 'p3'>('all');
  const [landscapeSubPage, setLandscapeSubPage] = useState<'all' | 'p1' | 'p2' | 'p3' | 'p4' | 'p5'>('all');
  const [activePaintCode, setActivePaintCode] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(62);
  const [autoFitWidth, setAutoFitWidth] = useState<boolean>(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const [printMarginMm, setPrintMarginMm] = useState<number>(12.7);

  // Nouvelles fonctionnalitÃ©s avancÃ©es
  const [isGuardStatsModalOpen, setIsGuardStatsModalOpen] = useState(false);
  const [isRegulatoryAlertsModalOpen, setIsRegulatoryAlertsModalOpen] = useState(false);
  const [isStaffShareModalOpen, setIsStaffShareModalOpen] = useState(false);
  const [isDocumentValidationModalOpen, setIsDocumentValidationModalOpen] = useState(false);
  const [isMonthlyArchiveModalOpen, setIsMonthlyArchiveModalOpen] = useState(false);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('approved_service');
  const [showOfficialStamp, setShowOfficialStamp] = useState(true);
  const [showQrCode, setShowQrCode] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [isCreateMonthModalOpen, setIsCreateMonthModalOpen] = useState(false);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [showDistributionChart, setShowDistributionChart] = useState(false);

  // Synchronise les marges d'impression physiques strictes (1.27cm des 4 cÃ´tÃ©s) pour l'export PDF
  useEffect(() => {
    let styleEl = document.getElementById('print-margins-style') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'print-margins-style';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      @media print {
        @page {
          margin: 0 !important;
          size: auto;
        }
        .a4-portrait-sheet,
        .a4-landscape-sheet {
          padding: ${printMarginMm}mm !important;
          padding-left: ${printMarginMm}mm !important;
          padding-right: ${printMarginMm}mm !important;
          padding-top: ${printMarginMm}mm !important;
          padding-bottom: ${printMarginMm}mm !important;
        }
      }
    `;
  }, [printMarginMm]);

  const applyManualZoom = (z: number | ((prev: number) => number)) => {
    setAutoFitWidth(false);
    setZoomLevel((prev) => (typeof z === 'function' ? z(prev) : z));
  };

  // Affiche la page A4 verticale complÃ¨tement de haut en bas sans coupure
  const handleFitPageComplete = () => {
    setAutoFitWidth(false);
    if (typeof window !== 'undefined') {
      const availH = Math.max(320, window.innerHeight - 200);
      const target = orientation === 'portrait' ? 1122.5 : 794;
      const calculated = Math.min(100, Math.max(35, Math.round((availH / target) * 100)));
      setZoomLevel(calculated);
    } else {
      setZoomLevel(orientation === 'portrait' ? 62 : 75);
    }
  };

  // Calcule le zoom (%) pour que la feuille A4 remplisse toute la largeur disponible
  const computeFitWidthZoom = (): number | null => {
    const el = stageRef.current;
    if (!el) return null;
    const sheetMm = orientation === 'portrait' ? 210 : 297;
    const mmToPx = 96 / 25.4;
    const availPx = el.clientWidth - 24;
    const z = Math.round((availPx / (sheetMm * mmToPx)) * 100);
    if (!Number.isFinite(z)) return null;
    return Math.min(200, Math.max(30, z));
  };

  const handleFitWidth = () => {
    const z = computeFitWidthZoom();
    if (z) setZoomLevel(z);
    setAutoFitWidth(true);
  };

  // Responsive : ajuste automatiquement la largeur Ã  l'ouverture,
  // au changement d'orientation et au redimensionnement de la fenÃªtre
  useEffect(() => {
    if (!autoFitWidth) return;
    const apply = () => {
      const z = computeFitWidthZoom();
      if (z) setZoomLevel(z);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [orientation, autoFitWidth]);

  const handleChangeOrientation = (nextO: 'portrait' | 'landscape') => {
    setOrientation(nextO);
    // Recalcul responsive automatique (fit-width) sur changement d'orientation
    setAutoFitWidth(true);
  };

  // Read-Only vs Edit Mode (protects against accidental schedule modifications)
  const [isReadOnly, setIsReadOnly] = useState<boolean>(true);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState<boolean>(true);

  const toggleReadOnly = (newValue?: boolean) => {
    const next = newValue !== undefined ? newValue : !isReadOnly;
    setIsReadOnly(next);
    showToast(next ? t.toastReadOnlyActive : t.toastEditActive);
  };

  const handleDirectPdfDownload = async () => {
    setIsExportingPdf(true);
    setExportProgress({ current: 1, total: 1 });
    showToast("GÃ©nÃ©ration du document PDF direct en cours...");
    try {
      const monthSlug = (config.guardMonthName || 'Planning_2026').replace(/\s+/g, '_');
      const filename = `EH_Ain_El_Turck_${orientation.toUpperCase()}_${monthSlug}.pdf`;
      await exportDirectPdf({
        orientation,
        filename,
        onProgress: (current, total) => setExportProgress({ current, total }),
      });
      showToast("Fichier PDF tÃ©lÃ©chargÃ© avec succÃ¨s !");
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la capture directe, ouverture de la boÃ®te d'impression.");
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDuplicateNextMonth = (nextMonthName: string) => {
    const nextOffset = ((config.guardMonthOffsetDays || 0) + 1) % 5;
    const partial: Partial<HospitalDocumentConfig> = {
      guardMonthName: nextMonthName,
      guardMonthOffsetDays: nextOffset,
      pdf1Page1Title: `Planning des MÃ©decins Â« ${nextMonthName} Â»`,
      pdf1Page2Title: `La liste du personnel mÃ©dical du ${nextMonthName}`,
      pdf1Page3Title: `Planning du Personnel ParamÃ©dical du ${nextMonthName}`,
      pdf2Page1Title: `TABLEAU D'ACTIVITÃ‰ DU ${nextMonthName.toUpperCase()} â€” 08h Ã  16h`,
      pdf2Page2Title: `TABLEAU D'ACTIVITÃ‰ DU ${nextMonthName.toUpperCase()} â€” 08h Ã  16h`,
      pdf2Page3Title: `TABLEAU D'ACTIVITÃ‰ DU ${nextMonthName.toUpperCase()} â€” 16h`,
      pdf2Page5Title: `TABLEAU D'ACTIVITÃ‰ DU ${nextMonthName.toUpperCase()} â€” Agents d'hygiÃ¨ne 12h`,
      isModificatif: false,
    };
    handleUpdateConfig(partial);
    const nextPreset = GUARD_MONTHS_PRESETS.find((m) => m.name === nextMonthName);
    handleApplyGuardRotation(
      config.guardRotationOrder || DEFAULT_GUARD_ROTATION_ORDER,
      nextOffset,
      nextPreset?.daysCount ?? 31,
      true
    );
    showToast(`Planning dupliquÃ© et mis Ã  jour pour ${nextMonthName} !`);
  };

  const handleLoadArchive = (archive: MonthlyArchiveRecord) => {
    handleUpdateConfig(archive.config);
    objectBoxStore.restoreStaffList(archive.staffList);
    setSnapshot(objectBoxStore.getSnapshot());
    showToast(`Archive "${archive.name}" restaurÃ©e avec succÃ¨s !`);
  };

  // Staff Manager View State
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedStaffCategory, setSelectedStaffCategory] = useState<string>('all');
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);

  // New Staff Form State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffCategory, setNewStaffCategory] = useState<StaffCategory>('paramedical_day');
  const [newStaffRole, setNewStaffRole] = useState('ATS');
  const [newStaffGrade, setNewStaffGrade] = useState('ATS');
  const [newStaffHoraire, setNewStaffHoraire] = useState('08h-16h');
  const [newStaffTeam, setNewStaffTeam] = useState('');

  // ObjectBox Studio Query State
  const [queryCategory, setQueryCategory] = useState<string>('all');
  const [queryOffset, setQueryOffset] = useState<number>(0);
  const [queryLimit, setQueryLimit] = useState<number>(10);
  const [queryOrderField, setQueryOrderField] = useState<'name' | 'id' | 'portraitOrder'>('id');

  // Modals for Guard Rotation, Leave Types, Service Settings & Maternity Leave Management
  const [isGuardRotationModalOpen, setIsGuardRotationModalOpen] = useState(false);
  const [isLeaveTypesModalOpen, setIsLeaveTypesModalOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [isMaternityModalOpen, setIsMaternityModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isModificatifModalOpen, setIsModificatifModalOpen] = useState(false);
  const [maternityTargetStaff, setMaternityTargetStaff] = useState<StaffEntity | null>(null);

  const handleToggleTableModificatif = (tableKey: TableModificatifKey) => {
    objectBoxStore.toggleTableModificatif(tableKey);
    const updated = !isTableModificatif(config, tableKey);
    showToast(
      updated
        ? `Mention (Modificatif) ACTIVÃ‰E sur : ${TABLE_MODIFICATIF_LABELS[tableKey]}`
        : `Mention (Modificatif) DÃ‰SACTIVÃ‰E sur : ${TABLE_MODIFICATIF_LABELS[tableKey]}`
    );
  };

  const handleSetAllTablesModificatif = (enabled: boolean) => {
    objectBoxStore.setAllTablesModificatif(enabled);
    showToast(
      enabled
        ? 'Mention (Modificatif) ACTIVÃ‰E sur TOUS les 7 tableaux !'
        : 'Mention (Modificatif) dÃ©sactivÃ©e sur tous les tableaux.'
    );
  };

  const handleLoadOctober2026 = () => {
    objectBoxStore.loadOctoberPreset();
    showToast("Plannings officiels d'Octobre 2026 (Service Rhumatologie) rechargÃ©s avec succÃ¨s !");
  };

  const handleLoadApril2026 = () => {
    objectBoxStore.createNewMonth(2026, 3);
    const bakhouche = objectBoxStore.getSnapshot().staffBox.find((s) =>
      s.fullName.toLowerCase().includes('bakhouche')
    );
    if (bakhouche) {
      objectBoxStore.setMaternityLeave(
        bakhouche.id,
        1,
        26,
        '25/11/2025 au 26/04/2026',
        'CongÃ© de MaternitÃ©'
      );
    }
    showToast("Planning d'Avril 2026 chargÃ© (avec congÃ© maternitÃ© historique Bakhouche Sarra jusqu'au 26/04/2026).");
  };

  const handleLoadJanuary2026 = () => {
    objectBoxStore.createNewMonth(2026, 0);
    objectBoxStore.setAllTablesModificatif(true);
    showToast('Planning de Janvier 2026 (Modificatif) chargÃ© avec succÃ¨s !');
  };

  const handleOpenMaternityModal = (staff?: StaffEntity) => {
    setMaternityTargetStaff(staff || null);
    setIsMaternityModalOpen(true);
  };

  const handleApplyMaternityLeave = (
    staffId: number,
    startDay: number,
    endDay: number,
    datesText: string,
    label: string
  ) => {
    objectBoxStore.setMaternityLeave(staffId, startDay, endDay, datesText, label);
    showToast('CongÃ© de maternitÃ© configurÃ© avec cellule fusionnÃ©e et mention officielle !');
  };

  const handleRemoveMaternityLeave = (staffId: number) => {
    objectBoxStore.removeMaternityLeave(staffId);
    showToast('CongÃ© de maternitÃ© retirÃ©.');
  };

  const handleToggleModificatif = () => {
    const nextVal = !config.isModificatif;
    objectBoxStore.updateConfig({ isModificatif: nextVal });
    showToast(
      nextVal
        ? "Mode Modificatif activÃ© : Â« (Modificatif) Â» s'affiche en gras sur les plannings."
        : 'Mode Modificatif dÃ©sactivÃ©.'
    );
  };

  const handleSelectMonth = (year: number, monthIndex: number) => {
    objectBoxStore.createNewMonth(year, monthIndex);
    const monthName = objectBoxStore.getConfig().guardMonthName;
    showToast(`Mois de Â« ${monthName} Â» activÃ© avec continuitÃ© perpÃ©tuelle des gardes !`);
  };

  const handleApplyGuardRotation = (
    rotationOrder: string[],
    cumulativeOffsetDays: number,
    daysInMonth: number,
    includeBouazizOverride: boolean,
    periodRange?: { startDay: number; endDay: number } | null
  ) => {
    objectBoxStore.applyContinuousGuardRotation(
      rotationOrder,
      cumulativeOffsetDays,
      daysInMonth,
      includeBouazizOverride,
      periodRange
    );
    showToast(
      periodRange
        ? `Rotation appliquÃ©e pour la pÃ©riode du jour ${periodRange.startDay} au ${periodRange.endDay} !`
        : 'Rotation continue et perpÃ©tuelle des Ã©quipes de garde appliquÃ©e !'
    );
  };

  const handleAddLeaveType = (item: Omit<LeaveTypeItem, 'id'>) => {
    objectBoxStore.addLeaveType(item);
    showToast(`Type de congÃ© Â« ${item.code} Â» ajoutÃ© !`);
  };

  const handleUpdateLeaveType = (id: string, updates: Partial<LeaveTypeItem>) => {
    objectBoxStore.updateLeaveType(id, updates);
    showToast('Type de congÃ© mis Ã  jour !');
  };

  const handleDeleteLeaveType = (id: string) => {
    objectBoxStore.deleteLeaveType(id);
    showToast('Type de congÃ© supprimÃ© !');
  };

  // Reset Confirmation Modal
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handlers for ObjectBox Store Mutations
  const handleUpdateConfig = (partial: Partial<HospitalDocumentConfig>) => {
    objectBoxStore.updateConfig(partial);
  };

  const handleSetHolidays = (days: number[], holiday: boolean) => {
    handleUpdateConfig({
      daysColumns: config.daysColumns.map((col) =>
        days.includes(col.day) ? { ...col, isHoliday: holiday } : col
      ),
    });
  };

  const handleClearHolidays = () => {
    handleUpdateConfig({
      daysColumns: config.daysColumns.map((col) =>
        col.isHoliday ? { ...col, isHoliday: false } : col
      ),
    });
  };

  const handleUpdateStaffField = <K extends keyof StaffEntity>(
    id: number,
    field: K,
    value: StaffEntity[K]
  ) => {
    objectBoxStore.updateStaffField(id, field, value);
  };

  const handleUpdateStaffDayCell = (id: number, day: number, code: string) => {
    objectBoxStore.updateStaffDayCell(id, day, code);
  };

  const handleUpdateDoctorWeekly = (
    id: number,
    dayKey: keyof DoctorWeeklySchedule,
    value: string
  ) => {
    objectBoxStore.updateDoctorWeeklyCell(id, dayKey, value);
  };

  const handleAddStaff = (entity: Omit<StaffEntity, 'id'>) => {
    objectBoxStore.putStaff(entity);
    showToast(t.addStaffMember + ' âœ“');
  };

  const handleDeleteStaff = (id: number) => {
    objectBoxStore.removeStaff(id);
    showToast(t.deleteRow + ' âœ“');
  };

  const handleResetDefaults = () => {
    objectBoxStore.resetToOriginalPdfs();
    setShowResetConfirm(false);
    showToast(t.resetDefaultData + ' âœ“');
  };

  const handleWipeData = () => {
    localStorage.removeItem('eh_ain_el_turck_objectbox_store_v1');
    objectBoxStore.resetToOriginalPdfs();
    setShowWipeConfirm(false);
    showToast(t.localDataDeletedNotice);
  };

  // Export JSON Snapshot
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `EH_Ain_El_Turck_Planning_Oct2026_ObjectBox_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('JSON ExportÃ© avec succÃ¨s !');
  };

  // Import JSON Snapshot
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = objectBoxStore.importJsonSnapshot(content);
      if (success) {
        showToast('JSON importÃ© et synchronisÃ© dans ObjectBox !');
      } else {
        alert('Erreur: Fichier JSON invalide pour le schÃ©ma ObjectBox.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Quick cycle application in Staff Manager
  const handleApplyCycle = (
    id: number,
    cycleType: 'workday' | 'guard16h' | 'hygiene12h',
    team: string
  ) => {
    if (cycleType === 'workday') {
      const activity = buildStandard08h16hActivity();
      for (let d = 1; d <= 31; d++) {
        objectBoxStore.updateStaffDayCell(id, d, activity[d]);
      }
      showToast(`${t.applyCycleBtn}: ${t.cycleWorkdayNormal}`);
    } else if (cycleType === 'guard16h') {
      const activity = buildGuard16hActivity(team || 'A');
      for (let d = 1; d <= 31; d++) {
        objectBoxStore.updateStaffDayCell(id, d, activity[d]);
      }
      showToast(`${t.applyCycleBtn}: ${t.cycleGuard5Days} (Grp ${team || 'A'})`);
    } else if (cycleType === 'hygiene12h') {
      const activity = buildHygiene12hActivity(true);
      for (let d = 1; d <= 31; d++) {
        objectBoxStore.updateStaffDayCell(id, d, activity[d]);
      }
      showToast(`${t.applyCycleBtn}: ${t.cycleHygiene12h}`);
    }
  };

  // Filtered staff for Staff Manager View
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchesSearch =
        staffSearch === '' ||
        s.fullName.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.rolePortrait.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.gradeLandscape.toLowerCase().includes(staffSearch.toLowerCase()) ||
        s.teamGroup.toLowerCase().includes(staffSearch.toLowerCase());

      const matchesCat =
        selectedStaffCategory === 'all' || s.category === selectedStaffCategory;

      const matchesTeam =
        selectedTeamFilter === 'all' ||
        (s.teamGroup && s.teamGroup.toUpperCase() === selectedTeamFilter.toUpperCase());

      return matchesSearch && matchesCat && matchesTeam;
    });
  }, [staffList, staffSearch, selectedStaffCategory, selectedTeamFilter]);

  // ObjectBox Query results
  const queryResult = useMemo(() => {
    let qb = objectBoxStore.queryStaff();
    if (queryCategory !== 'all') {
      qb = qb.where((s) => s.category === queryCategory);
    }
    if (queryOrderField === 'name') {
      qb = qb.orderBy((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (queryOrderField === 'portraitOrder') {
      qb = qb.orderBy((a, b) => a.portraitOrder - b.portraitOrder);
    } else {
      qb = qb.orderBy((a, b) => a.id - b.id);
    }
    return qb.find({ offset: queryOffset, limit: queryLimit });
  }, [staffList, queryCategory, queryOffset, queryLimit, queryOrderField]);

  // Handle Add Staff Form submit
  const handleCreateStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    let defaultActivity: Record<number, string>;
    if (newStaffCategory === 'paramedical_guard') {
      defaultActivity = buildGuard16hActivity(newStaffTeam || 'A');
    } else if (newStaffCategory === 'hygiene') {
      defaultActivity = buildHygiene12hActivity(true);
    } else {
      defaultActivity = buildStandard08h16hActivity();
    }

    const emptyWeekly: DoctorWeeklySchedule = {
      dimanche: 'SERVICE',
      lundi: 'SERVICE',
      mardi: 'SERVICE',
      mercredi: 'SERVICE',
      jeudi: 'SERVICE',
    };

    handleAddStaff({
      fullName: newStaffName.trim(),
      category: newStaffCategory,
      rolePortrait: newStaffRole.trim() || 'Agent',
      gradeLandscape: newStaffGrade.trim() || 'Agent',
      obsPortrait: '',
      horaireBlock: newStaffHoraire,
      teamGroup: newStaffTeam.toUpperCase(),
      portraitOrder: staffList.length + 1,
      landscapeOrder: staffList.length + 1,
      weeklySchedule: emptyWeekly,
      dailyActivity: defaultActivity,
    });

    setIsAddStaffModalOpen(false);
    setNewStaffName('');
  };

  // Flutter / Dart Code String
  const flutterDartCode = useMemo(() => {
    return `// ==============================================================================
// Flutter + ObjectBox Engine: Production Architecture for Hospital Planning
// Ã‰tablissement Hospitalier d'AÃ¯n El TÃ¼rck - Dr. Medjber Tami (Service Rhumatologie)
// ==============================================================================

import 'package:flutter/material.dart';
import 'package:objectbox/objectbox.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

/// ObjectBox Entity: Staff member
@Entity()
class StaffEntity {
  @Id()
  int id = 0;

  @Index()
  String fullName;

  @Index()
  String category; // 'medical', 'paramedical_day', 'paramedical_guard', 'hygiene'

  String rolePortrait;
  String gradeLandscape;
  String obsPortrait;
  String horaireBlock;
  String teamGroup; // '', 'A', 'B', 'C', 'D', 'E'

  @Index()
  int portraitOrder;

  @Index()
  int landscapeOrder;

  // JSON serialized map of days 1..31 -> "N", "RE", "Jour", "Nuit", "C", "CM", "M", "F"
  String dailyActivityJson;

  StaffEntity({
    this.id = 0,
    required this.fullName,
    required this.category,
    required this.rolePortrait,
    required this.gradeLandscape,
    this.obsPortrait = '',
    required this.horaireBlock,
    this.teamGroup = '',
    this.portraitOrder = 0,
    this.landscapeOrder = 0,
    this.dailyActivityJson = '{}',
  });
}

/// ObjectBox Local Store Manager with Reactive Query Streams
class HospitalObjectBoxStore {
  late final Store store;
  late final Box<StaffEntity> staffBox;

  Future<void> init() async {
    // Generated ObjectBox model
    // store = await openStore();
    staffBox = store.box<StaffEntity>();
  }

  /// Paginated query with offset & limit
  List<StaffEntity> queryStaff({
    String? category,
    int offset = 0,
    int limit = 20,
  }) {
    final queryBuilder = staffBox.query();
    if (category != null && category.isNotEmpty) {
      // queryBuilder.staffCategory.equals(category);
    }
    final query = queryBuilder.build()
      ..offset = offset
      ..limit = limit;
    final results = query.find();
    query.close();
    return results;
  }

  /// Direct persistence
  int saveStaff(StaffEntity entity) => staffBox.put(entity);
  bool deleteStaff(int id) => staffBox.remove(id);
}

/// Official PDF A4 Generator (Portrait & Landscape Fidelity)
class HospitalPdfGenerator {
  static Future<void> printDocument({
    required BuildContext context,
    required List<StaffEntity> staff,
    required bool isLandscape,
  }) async {
    final doc = pw.Document();
    final pageFormat = isLandscape ? PdfPageFormat.a4.landscape : PdfPageFormat.a4;

    doc.addPage(
      pw.Page(
        pageFormat: pageFormat,
        margin: const pw.EdgeInsets.all(28.0),
        build: (pw.Context ctx) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.center,
            children: [
              pw.Text(
                'RÃ‰PUBLIQUE ALGÃ‰RIENNE DÃ‰MOCRATIQUE ET POPULAIRE',
                style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 13),
              ),
              pw.Text(
                'MINISTÃˆRE DE LA SANTÃ‰, DE LA POPULATION ET DE LA RÃ‰FORME HOSPITALIÃˆRE',
                style: const pw.TextStyle(fontSize: 10),
              ),
              pw.Text(
                "Ã‰tablissement Hospitalier d'AÃ¯n El TÃ¼rck - Dr. Medjber Tami",
                style: const pw.TextStyle(fontSize: 10),
              ),
              pw.SizedBox(height: 12),
              pw.Align(
                alignment: pw.Alignment.centerLeft,
                child: pw.Text("UnitÃ© : Service de Rhumatologie", style: const pw.TextStyle(fontSize: 10)),
              ),
              pw.SizedBox(height: 16),
              pw.Text(
                "TABLEAU D'ACTIVITÃ‰ DU MOIS D'OCTOBRE 2026",
                style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 14),
              ),
              pw.SizedBox(height: 12),
              // Activity table rendering with exact 31 days columns
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey700),
                children: [
                  pw.TableRow(
                    decoration: const pw.BoxDecoration(color: PdfColors.grey300),
                    children: [
                      pw.Padding(padding: const pw.EdgeInsets.all(3), child: pw.Text('Nom et PrÃ©nom', style: const pw.TextStyle(fontSize: 9))),
                      pw.Padding(padding: const pw.EdgeInsets.all(3), child: pw.Text('Grade', style: const pw.TextStyle(fontSize: 9))),
                      for (int day = 1; day <= 31; day++)
                        pw.Padding(
                          padding: const pw.EdgeInsets.all(2),
                          child: pw.Text('$day', textAlign: pw.TextAlign.center, style: const pw.TextStyle(fontSize: 8)),
                        ),
                    ],
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => doc.save(),
      name: 'EH_Ain_El_Turck_Planning_Oct2026.pdf',
    );
  }
}
`;
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(flutterDartCode);
    setCodeCopied(true);
    showToast(t.copiedBadge);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleDownloadDart = () => {
    const blob = new Blob([flutterDartCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hospital_planning_objectbox.dart';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(t.downloadDartFile + ' âœ“');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 border border-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HOSPITAL BRANDING & NAVIGATION BAR */}
      <header className="no-print bg-slate-950/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 w-full max-w-full">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-4 w-full min-w-0">
            {/* Hospital Logo & Identity */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-900/30 shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 truncate">
                <h1 className="text-xs sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
                  <span className="truncate">{t.appTitle}</span>
                  <button
                    type="button"
                    onClick={() => setIsCreateMonthModalOpen(true)}
                    title="Changer de mois ou crÃ©er un nouveau mois en continuitÃ© perpÃ©tuelle"
                    className="hidden xs:inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 hover:border-sky-600 transition-colors shrink-0 cursor-pointer shadow-xs"
                  >
                    <Calendar className="w-3 h-3 text-sky-400 shrink-0" />
                    <span>{config.guardMonthName || 'Octobre 2026'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsServiceModalOpen(true)}
                    title="Modifier le service ou Ã©tablissement"
                    className="p-0.5 text-slate-400 hover:text-sky-300 rounded transition-colors shrink-0"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-400 truncate hidden sm:block">
                  {config.unitTitle || t.appSubtitle}
                </p>
              </div>
            </div>

            {/* Main Tabs Navigation (Desktop) */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-sm">
              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'documents'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{t.navDocuments}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('staff')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'staff'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{t.navStaffManager}</span>
                <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {staffList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('objectbox')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'objectbox'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>{t.navObjectBoxStudio}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('supabase')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'supabase'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span>{t.navSupabaseSync}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('flutter')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'flutter'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>{t.navFlutterExport}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('privacy')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'privacy'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>{t.navLegalPrivacy}</span>
              </button>
            </nav>

            {/* Quick Actions & Language Selector */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Mobile Compact Language Selector */}
              <div className="sm:hidden flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px] font-bold">
                <Globe className="w-3.5 h-3.5 text-sky-400 ml-1 mr-0.5 shrink-0" />
                <select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value as SupportedLocale)}
                  aria-label="SÃ©lectionner la langue"
                  className="bg-transparent text-sky-300 font-bold text-[11px] px-1 py-1 focus:outline-none cursor-pointer"
                >
                  <option value="fr" className="bg-slate-900 text-white">FR</option>
                  <option value="ar" className="bg-slate-900 text-white">Ø¹Ø±Ø¨ÙŠ</option>
                  <option value="en" className="bg-slate-900 text-white">EN</option>
                </select>
              </div>

              {/* Desktop Language Selector Pills */}
              <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-semibold">
                {(['fr', 'en', 'ar'] as SupportedLocale[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLocale(l)}
                    className={`px-2 py-1 rounded transition-colors ${
                      locale === l
                        ? 'bg-slate-800 text-sky-400 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Print Button */}
              <button
                type="button"
                onClick={() => window.print()}
                title={t.printCurrentView}
                className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-colors shrink-0"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">{t.printCurrentView}</span>
              </button>

              {/* Restore Seed */}
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                title={t.resetDefaultData}
                className="p-2 sm:p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <nav className="md:hidden flex items-center justify-between overflow-x-auto bg-slate-950 border-t border-slate-800 px-1 py-1 text-xs w-full max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`p-1 flex flex-col items-center justify-center min-w-[50px] shrink-0 truncate ${
              activeTab === 'documents' ? 'text-sky-400 font-bold' : 'text-slate-400'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span className="text-[9px] mt-0.5 truncate max-w-full">{t.navDocuments}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`p-1 flex flex-col items-center justify-center min-w-[50px] shrink-0 truncate ${
              activeTab === 'staff' ? 'text-sky-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="text-[9px] mt-0.5 truncate max-w-full">{t.navStaffManager}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('objectbox')}
            className={`p-1 flex flex-col items-center justify-center min-w-[50px] shrink-0 truncate ${
              activeTab === 'objectbox' ? 'text-sky-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span className="text-[9px] mt-0.5 truncate max-w-full">{t.navObjectBoxStudio}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`p-1 flex flex-col items-center justify-center min-w-[50px] shrink-0 truncate ${
              activeTab === 'supabase' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Cloud className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="text-[9px] mt-0.5 truncate max-w-full">Supabase</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('flutter')}
            className={`p-1 flex flex-col items-center justify-center min-w-[50px] shrink-0 truncate ${
              activeTab === 'flutter' ? 'text-sky-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Code2 className="w-4 h-4 shrink-0" />
            <span className="text-[9px] mt-0.5 truncate max-w-full">{t.navFlutterExport}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`p-1 flex flex-col items-center justify-center min-w-[50px] shrink-0 truncate ${
              activeTab === 'privacy' ? 'text-sky-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span className="text-[9px] mt-0.5 truncate max-w-full">{t.navLegalPrivacy}</span>
          </button>
        </nav>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {/* ====================================================================
            TAB 1: DOCUMENTS & PDF (A4) VIEW
           ==================================================================== */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Toolbar Controls */}
            <div className="no-print bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-4 shadow-lg max-w-full overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
                {/* Orientation Selector */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => handleChangeOrientation('portrait')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                      orientation === 'portrait'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>{t.orientationPortrait}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeOrientation('landscape')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                      orientation === 'landscape'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>{t.orientationLandscape}</span>
                  </button>
                </div>

                {/* Sub-Pages Selector */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {orientation === 'portrait' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setPortraitSubPage('all')}
                        className={`px-2.5 py-1.5 rounded-lg border transition-colors ${
                          portraitSubPage === 'all'
                            ? 'bg-sky-600 border-sky-500 text-white font-medium'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {t.viewAllInGroup} (1â€“3)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPortraitSubPage('p1')}
                        className={`px-2.5 py-1.5 rounded-lg border transition-colors ${
                          portraitSubPage === 'p1'
                            ? 'bg-sky-600 border-sky-500 text-white font-medium'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {t.page1DoctorsPlanning}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPortraitSubPage('p2')}
                        className={`px-2.5 py-1.5 rounded-lg border transition-colors ${
                          portraitSubPage === 'p2'
                            ? 'bg-sky-600 border-sky-500 text-white font-medium'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {t.page2DoctorsList}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPortraitSubPage('p3')}
                        className={`px-2.5 py-1.5 rounded-lg border transition-colors ${
                          portraitSubPage === 'p3'
                            ? 'bg-sky-600 border-sky-500 text-white font-medium'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {t.page3ParamedicalPlanning}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setLandscapeSubPage('all')}
                        className={`px-2.5 py-1.5 rounded-lg border transition-colors ${
                          landscapeSubPage === 'all'
                            ? 'bg-sky-600 border-sky-500 text-white font-medium'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {t.viewAllInGroup} (1â€“4)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLandscapeSubPage('p1')}
                        className={`px-2.5 py-1.5 rounded-lg border transition-colors ${
                          landscapeSubPage === 'p1'
                            ? 'bg-sky-600 border-sky-500 text-white font-medium'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {t.actPage1Medical}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLandscapeSubPage('p2')}
                        className={`px-2.5 py-1.5 rounded-lg border transition-colors ${
                          landscapeSubPage === 'p2'
                            ? 'bg-sky-600 border-sky-500 text-white font-medium'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {t.actPage2ParamedicalDay}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLandscapeSubPage('p3')}
                        className={`px-2.5 py-1.5 rounded-lg border transition-colors ${
                          landscapeSubPage === 'p3'
                            ? 'bg-sky-600 border-sky-500 text-white font-medium'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {t.actPage3ParamedicalGuard}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLandscapeSubPage('p4')}
                        className={`px-2.5 py-1.5 rounded-lg border transition-colors ${
                          landscapeSubPage === 'p4' || landscapeSubPage === 'p5'
                            ? 'bg-sky-600 border-sky-500 text-white font-medium'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {t.actPage5Hygiene}
                      </button>
                    </>
                  )}
                </div>

                {/* Modificatif Toggle & Modal Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleToggleModificatif}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      config.isModificatif
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm ring-2 ring-amber-300'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
                    }`}
                    title="Activer ou dÃ©sactiver (Modificatif) globalement"
                  >
                    <span>(Modificatif)</span>
                    <span
                      className={`text-[9.5px] px-1 py-0.2 rounded font-mono font-extrabold ${
                        config.isModificatif
                          ? 'bg-slate-950 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {config.isModificatif ? 'GLOBAL' : 'OFF'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsModificatifModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-700/80 bg-amber-950/70 hover:bg-amber-900 text-amber-200 text-xs font-bold transition-colors shadow-xs"
                    title="GÃ©rer la mention (Modificatif) par tableau individuel au choix"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                    <span>Au Choix</span>
                  </button>
                </div>

                {/* Maternity Quick Tool Button */}
                <button
                  type="button"
                  onClick={() => handleOpenMaternityModal()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-800/80 bg-rose-950/60 hover:bg-rose-900 text-rose-200 text-xs font-bold transition-colors shadow-sm"
                  title="GÃ©rer le congÃ© de maternitÃ© avec cellule fusionnÃ©e (Bakhouche Sarra)"
                >
                  <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
                  <span>CongÃ© MaternitÃ©</span>
                </button>

                {/* Service & Hospital Settings Button */}
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-800/80 bg-sky-950/60 hover:bg-sky-900 text-sky-200 text-xs font-bold transition-colors shadow-sm"
                  title="Modifier l'en-tÃªte, le nom de l'Ã©tablissement ou le service"
                >
                  <Building2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Service & HÃ´pital</span>
                </button>

                {/* Quick Presets (Octobre 2026, Avril 2026 & Janvier 2026) */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={handleLoadOctober2026}
                    className="px-2 py-1 rounded bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 hover:text-white transition-colors text-[11px] font-bold border border-indigo-700/60"
                    title="Recharger le planning officiel d'Octobre 2026"
                  >
                    ðŸ Octobre 2026
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={handleLoadApril2026}
                    className="px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-[11px] font-medium"
                    title="Charger le planning officiel d'Avril 2026 avec congÃ© de maternitÃ© Bakhouche Sarra"
                  >
                    Avril 2026
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={handleLoadJanuary2026}
                    className="px-2 py-1 rounded hover:bg-slate-800 text-amber-300 hover:text-amber-200 transition-colors text-[11px] font-medium"
                    title="Charger le planning Janvier 2026 avec mention (Modificatif)"
                  >
                    Janvier (Modif)
                  </button>
                </div>

                {/* Mode Selector (Lecture Seule vs Ã‰dition) */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleReadOnly(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                      isReadOnly
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Activer la protection en lecture seule"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{t.modeReadOnly}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleReadOnly(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                      !isReadOnly
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Activer l'Ã©dition directe des textes et cellules"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t.modeEdit}</span>
                  </button>
                </div>

                {/* Zoom Controller */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs text-slate-300 max-w-full">
                  {/* Primary Zoom +/- & Percentage */}
                  <div className="flex items-center gap-0.5 shrink-0 bg-slate-950/70 px-1 py-0.5 rounded border border-slate-800">
                    <button
                      type="button"
                      onClick={() => applyManualZoom((z) => Math.max(30, z - 10))}
                      title="Zoom -"
                      className="p-1 hover:text-white rounded transition-colors"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[11px] px-1 font-bold text-white shrink-0 min-w-[34px] text-center">{zoomLevel}%</span>
                    <button
                      type="button"
                      onClick={() => applyManualZoom((z) => Math.min(200, z + 10))}
                      title="Zoom +"
                      className="p-1 hover:text-white rounded transition-colors"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Preset & Fit Buttons */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => applyManualZoom(50)}
                      title="Zoom 50%"
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${zoomLevel === 50 ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyManualZoom(75)}
                      title="Zoom 75%"
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${zoomLevel === 75 ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      75%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyManualZoom(100)}
                      title="Reset 100%"
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${zoomLevel === 100 ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      100%
                    </button>
                    <button
                      type="button"
                      onClick={handleFitPageComplete}
                      title="Afficher la page complÃ¨te (A4 vertical entier visible)"
                      className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[10px] font-bold transition-colors"
                    >
                      <Eye className="w-3 h-3 shrink-0" />
                      <span>Page</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleFitWidth}
                      title="Ajuster la largeur pour voir les 30/31 jours sans coupure"
                      className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 text-[10px] font-bold transition-colors"
                    >
                      <Maximize2 className="w-3 h-3 shrink-0" />
                      <span>Largeur</span>
                    </button>
                  </div>
                </div>

                {/* PDF Print Margins Selector */}
                <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
                  <span className="text-slate-400 font-medium">Marges PDF :</span>
                  <select
                    value={printMarginMm}
                    onChange={(e) => setPrintMarginMm(Number(e.target.value))}
                    className="bg-slate-950 text-white font-semibold text-xs border border-slate-700 rounded px-1.5 py-0.5 focus:outline-none focus:border-sky-500"
                    title="Marges d'impression physiques pour l'export PDF (1.27 cm / 12.7 mm strict A4 standard)"
                  >
                    <option value={12.7}>Strictes A4 (1.27 cm / 12.7 mm)</option>
                    <option value={10}>Confort (10 mm)</option>
                    <option value={8}>Standard (8 mm)</option>
                    <option value={5}>Fines (5 mm)</option>
                  </select>
                </div>
              </div>

              {/* Landscape Paint Brush Mode */}
              {orientation === 'landscape' && (
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {isReadOnly ? (
                    <div className="flex items-center gap-2 text-emerald-400/90 font-medium py-1">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span>
                        Pinceau dÃ©sactivÃ© en mode Lecture seule. Activez le mode Ã‰dition pour peindre les roulements.
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                        <PaintBucket className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t.paintModeLabel}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => setActivePaintCode(null)}
                        className={`px-2.5 py-1 rounded border transition-colors ${
                          activePaintCode === null
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {t.paintBrushOff}
                      </button>

                      {['N', 'RE', 'Jour', 'Nuit', 'C', 'CM', 'M', 'F'].map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setActivePaintCode(code)}
                          className={`px-2.5 py-1 rounded font-bold transition-transform active:scale-95 ${
                            activePaintCode === code
                              ? 'bg-sky-500 text-white ring-2 ring-sky-300 shadow'
                              : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                          }`}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  )}

                  {!isReadOnly && activePaintCode && (
                    <div className="text-[11px] text-amber-300 font-medium bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                      Pinceau actif : Glissez ou cliquez sur n'importe quel jour (1..31)
                    </div>
                  )}
                </div>
              )}

              {/* Informative Hint Banner with Mode Status */}
              <div
                className={`text-[12px] flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-colors ${
                  isReadOnly
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isReadOnly ? (
                    <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Edit3 className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="font-medium">
                    {isReadOnly ? t.modeReadOnlyDesc : t.modeEditDesc}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleReadOnly()}
                  className="underline hover:text-white font-semibold text-[11px] shrink-0"
                >
                  {isReadOnly ? 'Basculer en mode Ã‰dition' : 'Verrouiller en Lecture seule'}
                </button>
              </div>
            </div>

            {/* Visual Staff Presence & Distribution Widget (Recharts) */}
            <StaffDistributionChartWidget staffList={staffList} config={config} />

            {/* Document Sheets Render Stage */}
            <div
              ref={stageRef}
              className="w-full overflow-x-auto overflow-y-visible py-4 sm:py-6 px-1 sm:px-4 flex justify-start lg:justify-center"
            >
              <div
                className="shrink-0 transition-all duration-150 mx-auto"
                style={{
                  width: `${(orientation === 'portrait' ? 210 : 297) * (zoomLevel / 100)}mm`,
                  minWidth: `${(orientation === 'portrait' ? 210 : 297) * (zoomLevel / 100)}mm`,
                }}
              >
                <div
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top left',
                    width: `${orientation === 'portrait' ? 210 : 297}mm`,
                    minWidth: `${orientation === 'portrait' ? 210 : 297}mm`,
                  }}
                >
                  {orientation === 'portrait' ? (
                    <PortraitPdfSheets
                      activeSubPage={portraitSubPage}
                      config={config}
                      staffList={staffList}
                      readOnly={isReadOnly}
                      onUpdateConfig={handleUpdateConfig}
                      onUpdateStaffField={handleUpdateStaffField}
                      onUpdateDoctorWeekly={handleUpdateDoctorWeekly}
                      onAddStaff={handleAddStaff}
                      onDeleteStaff={handleDeleteStaff}
                      onOpenGuardRotationModal={() => setIsGuardRotationModalOpen(true)}
                      onOpenLeaveTypesModal={() => setIsLeaveTypesModalOpen(true)}
                      onOpenMaternityModal={handleOpenMaternityModal}
                      onToggleTableModificatif={handleToggleTableModificatif}
                    />
                  ) : (
                    <LandscapePdfSheets
                      activeSubPage={landscapeSubPage}
                      config={config}
                      staffList={staffList}
                      readOnly={isReadOnly}
                      activePaintCode={isReadOnly ? null : activePaintCode}
                      onUpdateConfig={handleUpdateConfig}
                      onUpdateStaffField={handleUpdateStaffField}
                      onUpdateStaffDayCell={handleUpdateStaffDayCell}
                      onAddStaff={handleAddStaff}
                      onDeleteStaff={handleDeleteStaff}
                      onOpenGuardRotationModal={() => setIsGuardRotationModalOpen(true)}
                      onOpenLeaveTypesModal={() => setIsLeaveTypesModalOpen(true)}
                      onOpenMaternityModal={handleOpenMaternityModal}
                      onToggleTableModificatif={handleToggleTableModificatif}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Floating Zoom Control (responsive document preview) */}
            {activeTab === 'documents' && (
              <div className="no-print fixed right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1 bg-slate-950/95 backdrop-blur-xl border border-slate-700/80 p-1.5 rounded-2xl shadow-2xl ring-1 ring-white/10 select-none">
                <button
                  type="button"
                  onClick={() => applyManualZoom((z) => Math.min(200, z + 10))}
                  title="Zoom avant (+10%)"
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <span className="font-mono text-[10px] font-bold text-white min-w-[40px] text-center bg-slate-900 border border-slate-800 rounded-lg px-1 py-1">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => applyManualZoom((z) => Math.max(30, z - 10))}
                  title="Zoom arrière (-10%)"
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <div className="w-full h-px bg-slate-700 my-0.5" />
                <button
                  type="button"
                  onClick={handleFitWidth}
                  title="Remplir toute la largeur de l'écran"
                  className={`p-2 rounded-xl transition-colors ${
                    autoFitWidth
                      ? 'text-sky-300 bg-sky-950 border border-sky-800'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleFitPageComplete}
                  title="Afficher la page complète (A4 entier visible)"
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Floating Quick Actions Menu */}
            <QuickActionsFloatingMenu
              isReadOnly={isReadOnly}
              onToggleReadOnly={toggleReadOnly}
              orientation={orientation}
              onChangeOrientation={handleChangeOrientation}
              zoomLevel={zoomLevel}
              onChangeZoom={applyManualZoom}
              onResetZoom={() => applyManualZoom(100)}
              onFitWidth={handleFitWidth}
              onFitPageComplete={handleFitPageComplete}
              onPrint={() => window.print()}
              onOpenGuardRotationModal={() => setIsGuardRotationModalOpen(true)}
              onOpenLeaveTypesModal={() => setIsLeaveTypesModalOpen(true)}
              onOpenHolidayModal={() => setIsHolidayModalOpen(true)}
              onOpenMaternityModal={() => handleOpenMaternityModal()}
              isModificatif={config.isModificatif}
              onToggleModificatif={handleToggleModificatif}
              onOpenModificatifModal={() => setIsModificatifModalOpen(true)}
              onLoadOctoberPreset={handleLoadOctober2026}
              onLoadAprilPreset={handleLoadApril2026}
              onLoadJanuaryPreset={handleLoadJanuary2026}
              onOpenSupabaseSync={() => setActiveTab('supabase')}
              locale={locale}
              t={t}
            />
          </div>
        )}

        {/* ====================================================================
            TAB 2: PERSONNEL & Ã‰QUIPES MANAGER VIEW
           ==================================================================== */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-sky-400" />
                    <span>{t.navStaffManager}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Gestion centralisÃ©e du personnel mÃ©dical, paramÃ©dical et des Ã©quipes de garde
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsServiceModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700 rounded-lg text-xs font-semibold shadow transition-colors"
                    title="Modifier l'intitulÃ© du service ou de l'Ã©tablissement hospitalier"
                  >
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Service & HÃ´pital</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsGuardRotationModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700 rounded-lg text-xs font-semibold shadow transition-colors"
                    title="GÃ©rer la rotation des Ã©quipes (PÃ©riode ou PerpÃ©tuelle)"
                  >
                    <Repeat className="w-3.5 h-3.5 text-sky-400" />
                    <span>Rotation des gardes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLeaveTypesModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold shadow transition-colors"
                    title="Ajouter, modifier ou supprimer des types de congÃ©s"
                  >
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Types de congÃ©s</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddStaffModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.addStaffMember}</span>
                  </button>
                </div>
              </div>

              {/* Filter Pills & Search */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {[
                    { id: 'all', label: 'Tous (' + staffList.length + ')' },
                    { id: 'medical', label: t.catMedical },
                    { id: 'paramedical_day', label: t.catParamedicalDay },
                    { id: 'paramedical_guard', label: t.catParamedicalGuard },
                    { id: 'hygiene', label: t.catHygiene },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedStaffCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg border transition-colors ${
                        selectedStaffCategory === cat.id
                          ? 'bg-sky-600 border-sky-500 text-white font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={staffSearch}
                    onChange={(e) => setStaffSearch(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  {staffSearch && (
                    <button
                      type="button"
                      onClick={() => setStaffSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Staff Table */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">{t.staffFullName}</th>
                      <th className="py-3 px-4">{t.staffCategory}</th>
                      <th className="py-3 px-4">{t.staffFunctionTitle}</th>
                      <th className="py-3 px-4">{t.staffGradeShort}</th>
                      <th className="py-3 px-4 text-center">{t.staffScheduleBlock}</th>
                      <th className="py-3 px-4 text-center">{t.staffTeamGroup}</th>
                      <th className="py-3 px-4 text-center">{t.applyCycleBtn}</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500 text-sm">
                          {t.emptySearchState}
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((staff) => (
                        <tr key={staff.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-4 text-center font-mono text-slate-500">
                            {staff.id}
                          </td>
                          <td className="py-3 px-4 font-semibold text-white">
                            <input
                              type="text"
                              value={staff.fullName}
                              onChange={(e) =>
                                handleUpdateStaffField(staff.id, 'fullName', e.target.value)
                              }
                              className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-sky-500 focus:bg-slate-900 rounded px-1 py-0.5 outline-none font-medium w-full"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                staff.category === 'medical'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : staff.category === 'paramedical_day'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : staff.category === 'paramedical_guard'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {staff.category === 'medical'
                                ? 'MÃ©dical'
                                : staff.category === 'paramedical_day'
                                ? 'ParamÃ©dical Jour'
                                : staff.category === 'paramedical_guard'
                                ? 'Garde 16h'
                                : "HygiÃ¨ne"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <input
                              type="text"
                              value={staff.rolePortrait}
                              onChange={(e) =>
                                handleUpdateStaffField(staff.id, 'rolePortrait', e.target.value)
                              }
                              className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-sky-500 focus:bg-slate-900 rounded px-1 py-0.5 outline-none w-full"
                            />
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <input
                              type="text"
                              value={staff.gradeLandscape}
                              onChange={(e) =>
                                handleUpdateStaffField(staff.id, 'gradeLandscape', e.target.value)
                              }
                              className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-sky-500 focus:bg-slate-900 rounded px-1 py-0.5 outline-none w-full"
                            />
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-400">
                            <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {staff.horaireBlock || '08h-16h'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono">
                            {staff.teamGroup ? (
                              <span className="font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                                {staff.teamGroup}
                              </span>
                            ) : (
                              <span className="text-slate-600">â€”</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {staff.category === 'paramedical_guard' ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleApplyCycle(staff.id, 'guard16h', staff.teamGroup || 'A')
                                  }
                                  title="Appliquer cycle 5j (Jour/Nuit/RE/RE/RE)"
                                  className="px-2 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 rounded text-[10px] font-medium transition-colors"
                                >
                                  Cycle 16h ({staff.teamGroup || 'A'})
                                </button>
                              ) : staff.category === 'hygiene' ? (
                                <button
                                  type="button"
                                  onClick={() => handleApplyCycle(staff.id, 'hygiene12h', '')}
                                  title="Appliquer alternance (N / RE)"
                                  className="px-2 py-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700 rounded text-[10px] font-medium transition-colors"
                                >
                                  Alternance 12h
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleApplyCycle(staff.id, 'workday', '')}
                                  title="Appliquer standard (Semaine N / Ven-Sam RE)"
                                  className="px-2 py-1 bg-sky-900/60 hover:bg-sky-800 text-sky-200 border border-sky-700 rounded text-[10px] font-medium transition-colors"
                                >
                                  Semaine standard
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(staff.id)}
                              title={t.deleteRow}
                              className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 3: OBJECTBOX STUDIO & DATABASE INSPECTOR
           ==================================================================== */}
        {activeTab === 'objectbox' && (
          <div className="space-y-6">
            {/* ObjectBox Status & Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-sky-950 border border-sky-800 text-sky-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">ObjectBox Local Engine</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>IndexedDB + Reactive Cache</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Storage: eh_ain_el_turck_objectbox_store_v1
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-950 border border-purple-800 text-purple-400">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">{t.objectBoxEntitiesCount}</div>
                  <div className="text-2xl font-bold font-mono text-white mt-0.5">
                    {staffList.length}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    CatÃ©gories: MÃ©dical, ParamÃ©dical, HygiÃ¨ne
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Backup & Persistance</div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 rounded text-xs font-medium transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      <span>{t.exportJsonBtn}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 rounded text-xs font-medium transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t.importJsonBtn}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportJsonFile}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-emerald-800/60 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-400">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-medium">Remote Cloud Sync</div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('supabase')}
                    className="mt-1.5 flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors shadow-sm"
                  >
                    <span>Ouvrir Supabase â†’</span>
                  </button>
                  <div className="text-[10.5px] text-emerald-400/80 font-mono mt-1">
                    PostgreSQL / Cloud DB
                  </div>
                </div>
              </div>
            </div>

            {/* ObjectBox QueryBuilder Interactive Sandbox */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>ObjectBox QueryBuilder Sandbox (Offset & Limit Pagination)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simule l'exÃ©cution de requÃªtes indexÃ©es ObjectBox en Dart/C++ avec pagination
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">{t.staffCategory}</label>
                  <select
                    value={queryCategory}
                    onChange={(e) => setQueryCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="all">Toutes les catÃ©gories</option>
                    <option value="medical">medical (MÃ©decins)</option>
                    <option value="paramedical_day">paramedical_day (Jour 8h-16h)</option>
                    <option value="paramedical_guard">paramedical_guard (Garde 16h)</option>
                    <option value="hygiene">hygiene (Agents 12h)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Trier par (Index)</label>
                  <select
                    value={queryOrderField}
                    onChange={(e) => setQueryOrderField(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="id">@Id() (Identifiant croissant)</option>
                    <option value="name">@Index() fullName (AlphabÃ©tique)</option>
                    <option value="portraitOrder">@Index() portraitOrder</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    {t.objectBoxQueryOffset} ({queryOffset})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={staffList.length}
                    value={queryOffset}
                    onChange={(e) => setQueryOffset(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    {t.objectBoxQueryLimit} ({queryLimit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={queryLimit}
                    onChange={(e) => setQueryLimit(Math.max(1, parseInt(e.target.value) || 10))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* Query Summary & Results */}
              <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <div className="text-sky-300">
                    staffBox.query().where(...) .offset({queryOffset}).limit({queryLimit}).find()
                  </div>
                  <div>
                    RÃ©sultats : <span className="text-white font-bold">{queryResult.results.length}</span> sur{' '}
                    <span className="text-white font-bold">{queryResult.totalCount}</span> total
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 max-h-60 overflow-y-auto">
                  {queryResult.results.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sky-400 font-bold">#{item.id} {item.fullName}</span>
                        <span className="text-slate-500">{item.teamGroup ? `Grp ${item.teamGroup}` : ''}</span>
                      </div>
                      <div className="text-slate-400 truncate">{item.rolePortrait}</div>
                      <div className="text-slate-500 text-[10px] truncate">{item.category} Â· {item.horaireBlock}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB: REMOTE DB & SUPABASE PASSAGEWAY
           ==================================================================== */}
        {activeTab === 'supabase' && (
          <SupabaseSyncPanel onShowToast={showToast} />
        )}

        {/* ====================================================================
            TAB 4: FLUTTER & DART ARCHITECTURE VIEW
           ==================================================================== */}
        {activeTab === 'flutter' && (
          <div className="space-y-6">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-sky-400" />
                    <span>{t.flutterCodeTitle}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t.flutterCodeDesc}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 rounded-lg text-xs font-semibold shadow transition-colors"
                  >
                    {codeCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{codeCopied ? t.copiedBadge : t.copyCodeBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadDart}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.downloadDartFile}</span>
                  </button>
                </div>
              </div>

              {/* Code Viewer */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[600px] overflow-y-auto leading-relaxed">
                <pre>{flutterDartCode}</pre>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 5: PRIVACY & LEGAL GOVERNANCE VIEW
           ==================================================================== */}
        {activeTab === 'privacy' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-sky-400" />
                <span>{t.privacyPolicyTitle}</span>
              </h2>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <p>
                  <strong>1. HÃ©bergement et DonnÃ©es Locales :</strong> Ce systÃ¨me hospitalier fonctionne selon le principe <em>Local-First</em>. Toutes les modifications apportÃ©es aux plannings, listes de garde et tableaux d'activitÃ© sont conservÃ©es localement dans le moteur ObjectBox de votre navigateur (IndexedDB / LocalStorage). Aucune donnÃ©e nominative de santÃ© ou du personnel n'est transmise Ã  des tiers ou des serveurs publicitaires.
                </p>
                <p>
                  <strong>2. Respect du Secret Professionnel & Hospitalier :</strong> Conforme aux exigences administratives de l'Ã‰tablissement Hospitalier d'AÃ¯n El TÃ¼rck (Dr. Medjber Tami - Service de Rhumatologie), les tableaux Ã©ditÃ©s respectent strictement la chaÃ®ne de validation hiÃ©rarchique : MÃ©decin Chef, Surveillant MÃ©dical, Direction des ActivitÃ©s ParamÃ©dicales (DAPM) et Direction GÃ©nÃ©rale.
                </p>
                <p>
                  <strong>3. Exportation et Sauvegarde :</strong> Vous pouvez Ã  tout moment exporter une copie intÃ©grale sous format JSON ou gÃ©nÃ©rer des impressions physiques et PDF A4 certifiÃ©es.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{t.deleteAccountTitle}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Si vous souhaitez rÃ©initialiser complÃ¨tement le cache de ce poste ou effacer toutes les donnÃ©es locales ObjectBox :
                </p>
                <button
                  type="button"
                  onClick={() => setShowWipeConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.deleteLocalDataNow}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ADD STAFF MEMBER */}
      {isAddStaffModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto font-sans">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl space-y-4 my-auto overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-sky-400" />
                <span>{t.addStaffMember}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddStaffModalOpen(false)}
                aria-label="Fermer"
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaffSubmit} className="space-y-3.5 text-xs overflow-y-auto flex-1 pr-1">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {t.staffFullName} *
                </label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Ex. Dr. Benali Omar ou Mansour Samia"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 min-h-[38px] text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  {t.staffCategory}
                </label>
                <select
                  value={newStaffCategory}
                  onChange={(e) => {
                    const cat = e.target.value as StaffCategory;
                    setNewStaffCategory(cat);
                    if (cat === 'medical') {
                      setNewStaffHoraire('08h-16h');
                      setNewStaffRole('MÃ©decin GÃ©nÃ©raliste');
                      setNewStaffGrade('MÃ©decin');
                    } else if (cat === 'paramedical_guard') {
                      setNewStaffHoraire('16h');
                      setNewStaffRole('ATS');
                      setNewStaffGrade('ATS');
                      setNewStaffTeam('A');
                    } else if (cat === 'hygiene') {
                      setNewStaffHoraire('12h');
                      setNewStaffRole("Agent d'hygiÃ¨ne");
                      setNewStaffGrade("Agent d'hygiÃ¨ne");
                    } else {
                      setNewStaffHoraire('08h-16h');
                      setNewStaffRole('ATS');
                      setNewStaffGrade('ATS');
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 min-h-[38px] text-xs sm:text-sm"
                >
                  <option value="medical">Personnel MÃ©dical (08h-16h)</option>
                  <option value="paramedical_day">ParamÃ©dical Jour (08h-16h)</option>
                  <option value="paramedical_guard">ParamÃ©dical Garde (16h Â· Groupes A-E)</option>
                  <option value="hygiene">Agents d'HygiÃ¨ne (12h)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {t.staffFunctionTitle}
                  </label>
                  <input
                    type="text"
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    placeholder="Fonction complÃ¨te"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 min-h-[38px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {t.staffGradeShort}
                  </label>
                  <input
                    type="text"
                    value={newStaffGrade}
                    onChange={(e) => setNewStaffGrade(e.target.value)}
                    placeholder="Grade court"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 min-h-[38px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {t.staffScheduleBlock}
                  </label>
                  <select
                    value={newStaffHoraire}
                    onChange={(e) => setNewStaffHoraire(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 min-h-[38px]"
                  >
                    <option value="08h-16h">08h-16h</option>
                    <option value="16h">16h</option>
                    <option value="12h">12h</option>
                  </select>
                </div>

                {newStaffCategory === 'paramedical_guard' && (
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      {t.staffTeamGroup} (A, B, C, D, E)
                    </label>
                    <select
                      value={newStaffTeam}
                      onChange={(e) => setNewStaffTeam(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 min-h-[38px]"
                    >
                      <option value="A">Groupe A</option>
                      <option value="B">Groupe B</option>
                      <option value="C">Groupe C</option>
                      <option value="D">Groupe D</option>
                      <option value="E">Groupe E</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 min-h-[38px] flex items-center justify-center"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow min-h-[38px] flex items-center justify-center"
                >
                  {t.confirmBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM RESET TO DEFAULT SEED */}
      {showResetConfirm && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto font-sans">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 sm:p-6 max-w-md w-full shadow-2xl space-y-4 my-auto">
            <h3 className="text-sm sm:text-base font-bold text-amber-400 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <span>{t.resetConfirmTitle}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t.resetConfirmDesc}
            </p>
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs min-h-[38px] flex items-center justify-center"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow min-h-[38px] flex items-center justify-center"
              >
                {t.confirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM WIPE STORAGE */}
      {showWipeConfirm && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto font-sans">
          <div className="bg-slate-950 border border-red-900 rounded-xl p-4 sm:p-6 max-w-md w-full shadow-2xl space-y-4 my-auto">
            <h3 className="text-sm sm:text-base font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{t.deleteAccountTitle}</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              ÃŠtes-vous sÃ»r de vouloir effacer le stockage local ObjectBox et rÃ©initialiser tous les plannings ?
            </p>
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWipeConfirm(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs min-h-[38px] flex items-center justify-center"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleWipeData}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow min-h-[38px] flex items-center justify-center"
              >
                {t.deleteLocalDataNow}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GUARD ROTATION (PERIOD OR PERPETUAL CONTINUOUS) */}
      <GuardRotationModal
        isOpen={isGuardRotationModalOpen}
        onClose={() => setIsGuardRotationModalOpen(false)}
        currentRotationOrder={config.guardRotationOrder || DEFAULT_GUARD_ROTATION_ORDER}
        currentMonthOffsetDays={config.guardMonthOffsetDays || 0}
        onApplyRotation={handleApplyGuardRotation}
      />

      {/* MODAL: LEAVE TYPES MANAGEMENT (ADD, EDIT, DELETE) */}
      <LeaveTypesModal
        isOpen={isLeaveTypesModalOpen}
        onClose={() => setIsLeaveTypesModalOpen(false)}
        leaveTypes={config.leaveTypes || DEFAULT_LEAVE_TYPES}
        onAddLeaveType={handleAddLeaveType}
        onUpdateLeaveType={handleUpdateLeaveType}
        onDeleteLeaveType={handleDeleteLeaveType}
      />

      {/* MODAL: HOLIDAY DAYS (JOURS FÉRIÉS) */}
      <HolidayModal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        daysColumns={config.daysColumns}
        onSetHolidays={handleSetHolidays}
        onClearHolidays={handleClearHolidays}
      />

      {/* MODAL: MATERNITY LEAVE (MERGED CELL & OFFICIAL OBS) */}
      <MaternityModal
        isOpen={isMaternityModalOpen}
        onClose={() => setIsMaternityModalOpen(false)}
        staffList={staffList}
        daysColumns={config.daysColumns}
        targetStaff={maternityTargetStaff}
        onApplyMaternityLeave={handleApplyMaternityLeave}
        onRemoveMaternityLeave={handleRemoveMaternityLeave}
      />

      {/* MODAL: SERVICE & HOSPITAL CONFIGURATION */}
      <ServiceSettingsModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        config={config}
        onUpdateConfig={handleUpdateConfig}
      />

      {/* MODAL: MENTIONS MODIFICATIF AU CHOIX (TABLE PAR TABLE) */}
      <ModificatifModal
        isOpen={isModificatifModalOpen}
        onClose={() => setIsModificatifModalOpen(false)}
        config={config}
        onToggleTable={handleToggleTableModificatif}
        onSetAll={handleSetAllTablesModificatif}
      />

      {/* FOOTER */}
      <footer className="no-print bg-slate-950 border-t border-slate-900 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Ã‰tablissement Hospitalier d'AÃ¯n El TÃ¼rck â€” Dr. Medjber Tami Â· Service de Rhumatologie
          </div>
          <div className="flex items-center gap-4">
            <span>Moteur ObjectBox Reactive v1.0.0</span>
            <span>Mois d'Octobre 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
