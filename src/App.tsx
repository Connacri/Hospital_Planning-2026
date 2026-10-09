/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  LayoutGrid,
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
import { MonthHistoryModal } from './components/MonthHistoryModal';
import { SupabaseSyncPanel } from './components/SupabaseSyncPanel';
import { TableManagementModal, TableModalTab } from './components/TableManagementModal';
import { ColumnWidthsFloatingModal } from './components/ColumnWidthsFloatingModal';
import { exportDirectPdf } from './utils/pdfExportHelper';
import { translations, SupportedLocale } from './i18n/translations';
import { ModernMedicalDashboard } from './components/ModernMedicalDashboard';
import { ModernAppSidebar, ActiveTab } from './components/ModernAppSidebar';

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
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

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

  // Nouvelles fonctionnalités avancées
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
  const [isMonthHistoryModalOpen, setIsMonthHistoryModalOpen] = useState(false);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [showDistributionChart, setShowDistributionChart] = useState(false);
  const [isTableManagementModalOpen, setIsTableManagementModalOpen] = useState(false);
  const [tableManagementTab, setTableManagementTab] = useState<TableModalTab>('table1');
  const [isColumnWidthsModalOpen, setIsColumnWidthsModalOpen] = useState(false);

  const handleOpenTableManagement = (tab: TableModalTab = 'table1') => {
    setTableManagementTab(tab);
    setIsTableManagementModalOpen(true);
  };

  // Synchronise les marges d'impression physiques strictes (1.27cm des 4 côtés) pour l'export PDF
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
          size: A4 ${orientation} !important;
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
  }, [printMarginMm, orientation]);

  const applyManualZoom = (z: number | ((prev: number) => number)) => {
    setAutoFitWidth(false);
    setZoomLevel((prev) => (typeof z === 'function' ? z(prev) : z));
  };

  // Affiche la page A4 verticale complètement de haut en bas sans coupure
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

  // Responsive : ajuste automatiquement la largeur à l'ouverture,
  // au changement d'orientation et au redimensionnement de la fenêtre
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
    showToast("Génération du document PDF direct en cours...");
    try {
      const monthSlug = (config.guardMonthName || 'Planning_2026').replace(/\s+/g, '_');
      const filename = `EH_Ain_El_Turck_${orientation.toUpperCase()}_${monthSlug}.pdf`;
      await exportDirectPdf({
        orientation,
        filename,
        onProgress: (current, total) => setExportProgress({ current, total }),
      });
      showToast("Fichier PDF téléchargé avec succès !");
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la génération du fichier PDF. Réessayez.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDuplicateNextMonth = (nextMonthName: string) => {
    const nextOffset = ((config.guardMonthOffsetDays || 0) + 1) % 5;
    const partial: Partial<HospitalDocumentConfig> = {
      guardMonthName: nextMonthName,
      guardMonthOffsetDays: nextOffset,
      pdf1Page1Title: `Planning des Médecins « ${nextMonthName} »`,
      pdf1Page2Title: `La liste du personnel médical du ${nextMonthName}`,
      pdf1Page3Title: `Planning du Personnel Paramédical du ${nextMonthName}`,
      pdf2Page1Title: `TABLEAU D'ACTIVITÉ DU ${nextMonthName.toUpperCase()} — 08h à 16h`,
      pdf2Page2Title: `TABLEAU D'ACTIVITÉ DU ${nextMonthName.toUpperCase()} — 08h à 16h`,
      pdf2Page3Title: `TABLEAU D'ACTIVITÉ DU ${nextMonthName.toUpperCase()} — 16h`,
      pdf2Page5Title: `TABLEAU D'ACTIVITÉ DU ${nextMonthName.toUpperCase()} — Agents d'hygiène 12h`,
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
    showToast(`Planning dupliqué et mis à jour pour ${nextMonthName} !`);
  };

  const handleLoadArchive = (archive: MonthlyArchiveRecord) => {
    handleUpdateConfig(archive.config);
    objectBoxStore.restoreStaffList(archive.staffList);
    setSnapshot(objectBoxStore.getSnapshot());
    showToast(`Archive "${archive.name}" restaurée avec succès !`);
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
        ? `Mention (Modificatif) ACTIVÉE sur : ${TABLE_MODIFICATIF_LABELS[tableKey]}`
        : `Mention (Modificatif) DÉSACTIVÉE sur : ${TABLE_MODIFICATIF_LABELS[tableKey]}`
    );
  };

  const handleSetAllTablesModificatif = (enabled: boolean) => {
    objectBoxStore.setAllTablesModificatif(enabled);
    showToast(
      enabled
        ? 'Mention (Modificatif) ACTIVÉE sur TOUS les 7 tableaux !'
        : 'Mention (Modificatif) désactivée sur tous les tableaux.'
    );
  };

  const handleLoadOctober2026 = () => {
    objectBoxStore.loadOctoberPreset();
    showToast("Planning officiel d'Octobre 2026 (Base) rechargé avec succès !");
  };

  const handleCreateNextMonth = (isModificatif = false) => {
    const next = objectBoxStore.createNextMonth(isModificatif);
    showToast(`Planning du mois de ${next.monthName} créé avec succès en continuité perpétuelle des équipes !`);
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
    showToast('Congé de maternité configuré avec cellule fusionnée et mention officielle !');
  };

  const handleRemoveMaternityLeave = (staffId: number) => {
    objectBoxStore.removeMaternityLeave(staffId);
    showToast('Congé de maternité retiré.');
  };

  const handleToggleModificatif = () => {
    const nextVal = !config.isModificatif;
    objectBoxStore.updateConfig({ isModificatif: nextVal });
    showToast(
      nextVal
        ? "Mode Modificatif activé : « (Modificatif) » s'affiche en gras sur les plannings."
        : 'Mode Modificatif désactivé.'
    );
  };

  const handleSelectMonth = (year: number, monthIndex: number) => {
    objectBoxStore.createNewMonth(year, monthIndex);
    const monthName = objectBoxStore.getConfig().guardMonthName;
    showToast(`Mois de « ${monthName} » activé avec continuité perpétuelle des gardes !`);
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
        ? `Rotation appliquée pour la période du jour ${periodRange.startDay} au ${periodRange.endDay} !`
        : 'Rotation continue et perpétuelle des équipes de garde appliquée !'
    );
  };

  const handleAddLeaveType = (item: Omit<LeaveTypeItem, 'id'>) => {
    objectBoxStore.addLeaveType(item);
    showToast(`Type de congé « ${item.code} » ajouté !`);
  };

  const handleUpdateLeaveType = (id: string, updates: Partial<LeaveTypeItem>) => {
    objectBoxStore.updateLeaveType(id, updates);
    showToast('Type de congé mis à jour !');
  };

  const handleDeleteLeaveType = (id: string) => {
    objectBoxStore.deleteLeaveType(id);
    showToast('Type de congé supprimé !');
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
    showToast('JSON Exporté avec succès !');
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
        showToast('JSON importé et synchronisé dans ObjectBox !');
      } else {
        alert('Erreur: Fichier JSON invalide pour le schéma ObjectBox.');
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
// Établissement Hospitalier d'Aïn El Türck - Dr. Medjber Tami (Service Rhumatologie)
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
                'RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE',
                style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 13),
              ),
              pw.Text(
                'MINISTÈRE DE LA SANTÉ, DE LA POPULATION ET DE LA RÉFORME HOSPITALIÈRE',
                style: const pw.TextStyle(fontSize: 10),
              ),
              pw.Text(
                "Établissement Hospitalier d'Aïn El Türck - Dr. Medjber Tami",
                style: const pw.TextStyle(fontSize: 10),
              ),
              pw.SizedBox(height: 12),
              pw.Align(
                alignment: pw.Alignment.centerLeft,
                child: pw.Text("Unité : Service de Rhumatologie", style: const pw.TextStyle(fontSize: 10)),
              ),
              pw.SizedBox(height: 16),
              pw.Text(
                "TABLEAU D'ACTIVITÉ DU MOIS D'OCTOBRE 2026",
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
                      pw.Padding(padding: const pw.EdgeInsets.all(3), child: pw.Text('Nom et Prénom', style: const pw.TextStyle(fontSize: 9))),
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
    <div className="min-h-screen medical-dashboard-bg text-slate-900 p-2 sm:p-3.5 lg:p-5 flex flex-col justify-start font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 border border-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PROTOTYPE-INSPIRED CURVED CONTAINER FRAME */}
      <div className="w-full max-w-[1720px] mx-auto bg-[#F7F8FC] rounded-[28px] sm:rounded-[36px] shadow-[0_30px_90px_rgba(0,0,0,0.65)] border border-slate-700/30 flex flex-col lg:flex-row min-h-[94vh] overflow-hidden">
        
        {/* Left Vertical Dark Pill Sidebar */}
        <ModernAppSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenColumnWidths={() => setIsColumnWidthsModalOpen(true)}
          onOpenCreateMonth={() => setIsCreateMonthModalOpen(true)}
          onOpenServiceSettings={() => setIsServiceModalOpen(true)}
          onOpenRegulatoryAlerts={() => setIsRegulatoryAlertsModalOpen(true)}
          onOpenGuardStats={() => setIsGuardStatsModalOpen(true)}
          locale={locale}
          onToggleLocale={() => setLocale(locale === 'fr' ? 'ar' : locale === 'ar' ? 'en' : 'fr')}
          staffCount={staffList.length}
        />

        {/* Right Main Content Stage */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-[calc(100vh-2rem)] p-3 sm:p-5 lg:p-6 text-slate-900">
          
          {/* Top Bar within the frame */}
          <header className="no-print bg-white/80 backdrop-blur-md rounded-2xl border border-slate-100 p-3 sm:p-4 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            {/* Title & Month Button */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 truncate">
                <div className="flex items-center gap-2">
                  <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                    {t.appTitle}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setIsCreateMonthModalOpen(true)}
                    title="Changer de mois ou créer un nouveau mois"
                    className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shrink-0 shadow-xs"
                  >
                    <Calendar className="w-3 h-3 text-rose-500" />
                    <span>{config.guardMonthName || 'Octobre 2026'}</span>
                  </button>
                </div>
                <p className="text-[10.5px] text-slate-400 truncate">
                  {config.unitTitle || t.appSubtitle} · Dr. Medjber Tami
                </p>
              </div>
            </div>

            {/* Quick Actions & Navigation tabs */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Tab Pills */}
              <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'dashboard'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-rose-500" />
                  <span>Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'documents'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Tableaux PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('staff')}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === 'staff'
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Personnel</span>
                  <span className="text-[10px] px-1.5 rounded-full bg-slate-200 text-slate-700">
                    {staffList.length}
                  </span>
                </button>
              </div>

              {/* Direct Print Button */}
              <button
                type="button"
                onClick={() => window.print()}
                title={t.printCurrentView}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <Printer className="w-3.5 h-3.5 text-rose-300" />
                <span className="hidden sm:inline">Imprimer</span>
              </button>

              {/* Direct PDF Export */}
              <button
                type="button"
                onClick={handleDirectPdfDownload}
                disabled={isExportingPdf}
                title={t.exportPdfOnly}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isExportingPdf
                    ? `${exportProgress.current}/${exportProgress.total}…`
                    : 'Export PDF'}
                </span>
              </button>

              {/* Restore Seed */}
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                title={t.resetDefaultData}
                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 w-full">
            {/* TAB 0: MODERN MEDICAL DASHBOARD VIEW */}
            {activeTab === 'dashboard' && (
              <ModernMedicalDashboard
                config={config}
                staffList={staffList}
                onOpenDocuments={(o) => {
                  if (o) handleChangeOrientation(o);
                  setActiveTab('documents');
                }}
                onOpenStaff={() => setActiveTab('staff')}
                onOpenColumnWidths={() => setIsColumnWidthsModalOpen(true)}
                onOpenTableManagement={handleOpenTableManagement}
                onOpenServiceSettings={() => setIsServiceModalOpen(true)}
                onOpenLeaveTypes={() => setIsLeaveTypesModalOpen(true)}
                onOpenMonthHistory={() => setIsMonthHistoryModalOpen(true)}
                onOpenRegulatoryAlerts={() => setIsRegulatoryAlertsModalOpen(true)}
                onOpenGuardStats={() => setIsGuardStatsModalOpen(true)}
                onOpenDocumentValidation={() => setIsDocumentValidationModalOpen(true)}
                onOpenCreateMonth={() => setIsCreateMonthModalOpen(true)}
                onQuickPrint={() => window.print()}
              />
            )}
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
                        {t.viewAllInGroup} (1–3)
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
                        {t.viewAllInGroup} (1–4)
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
                    title="Activer ou désactiver (Modificatif) globalement"
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
                    title="Gérer la mention (Modificatif) par tableau individuel au choix"
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
                  title="Gérer le congé de maternité avec cellule fusionnée (Bakhouche Sarra)"
                >
                  <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
                  <span>Congé Maternité</span>
                </button>

                {/* Service & Hospital Settings Button */}
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-800/80 bg-sky-950/60 hover:bg-sky-900 text-sky-200 text-xs font-bold transition-colors shadow-sm"
                  title="Modifier l'en-tête, le nom de l'établissement ou le service"
                >
                  <Building2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Service & Hôpital</span>
                </button>

                {/* Mois & Continuité des Rotations */}
                <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={handleLoadOctober2026}
                    className="px-2 py-1 rounded bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 hover:text-white transition-colors text-[11px] font-bold border border-indigo-700/60"
                    title="Recharger le planning officiel d'Octobre 2026 (Base)"
                  >
                    Octobre 2026
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateNextMonth(false)}
                    className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-white transition-colors text-[11px] font-bold border border-emerald-700/70 flex items-center gap-1"
                    title="Créer le mois suivant en appliquant la continuité de rotation des équipes (+1 mois)"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span>Mois Suivant (+1)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMonthHistoryModalOpen(true)}
                    className="px-2.5 py-1 rounded bg-amber-950/60 hover:bg-amber-900 text-amber-300 hover:text-white transition-colors text-[11px] font-bold border border-amber-700/60 flex items-center gap-1"
                    title="Ouvrir la liste d'historique des mois créés (filtrable par Modificatif ou Standard)"
                  >
                    <Calendar className="w-3 h-3 text-amber-400" />
                    <span>Historique Mois</span>
                  </button>
                </div>

                {/* Mode Selector (Lecture Seule vs Édition) */}
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
                    title="Activer l'édition directe des textes et cellules"
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
                      title="Afficher la page complète (A4 vertical entier visible)"
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
                        Pinceau désactivé en mode Lecture seule. Activez le mode Édition pour peindre les roulements.
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
                  {isReadOnly ? 'Basculer en mode Édition' : 'Verrouiller en Lecture seule'}
                </button>
              </div>
            </div>

            {/* Visual Staff Presence & Distribution Widget (Recharts) */}
            <StaffDistributionChartWidget staffList={staffList} config={config} />

            {/* Document Sheets Render Stage */}
            <div
              ref={stageRef}
              className="pdf-print-stage w-full overflow-x-auto overflow-y-visible py-4 sm:py-6 px-1 sm:px-4 flex justify-start lg:justify-center"
            >
              <div
                className="pdf-print-zoom shrink-0 transition-all duration-150 mx-auto"
                style={{
                  width: `${(orientation === 'portrait' ? 210 : 297) * (zoomLevel / 100)}mm`,
                  minWidth: `${(orientation === 'portrait' ? 210 : 297) * (zoomLevel / 100)}mm`,
                }}
              >
                <div
                  className="pdf-print-zoom"
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
                      onOpenTableManagementModal={handleOpenTableManagement}
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
              onDirectPdfDownload={handleDirectPdfDownload}
              onOpenGuardRotationModal={() => setIsGuardRotationModalOpen(true)}
              onOpenLeaveTypesModal={() => setIsLeaveTypesModalOpen(true)}
              onOpenHolidayModal={() => setIsHolidayModalOpen(true)}
              onOpenMaternityModal={() => handleOpenMaternityModal()}
              isModificatif={config.isModificatif}
              onToggleModificatif={handleToggleModificatif}
              onOpenModificatifModal={() => setIsModificatifModalOpen(true)}
              onLoadOctoberPreset={handleLoadOctober2026}
              onCreateNextMonth={() => handleCreateNextMonth(false)}
              onOpenMonthHistory={() => setIsMonthHistoryModalOpen(true)}
              onOpenCreateMonthModal={() => setIsCreateMonthModalOpen(true)}
              onOpenSupabaseSync={() => setActiveTab('supabase')}
              onOpenTableManagementModal={handleOpenTableManagement}
              onOpenColumnWidths={() => setIsColumnWidthsModalOpen(true)}
              locale={locale}
              t={t}
            />

            {/* Floating button for quick access to Column Widths Adjuster */}
            {!isColumnWidthsModalOpen && (
              <div className="no-print fixed bottom-4 left-4 z-40">
                <button
                  type="button"
                  onClick={() => setIsColumnWidthsModalOpen(true)}
                  className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800 text-amber-300 hover:text-white border border-amber-500/40 hover:border-amber-400 shadow-2xl backdrop-blur-md text-xs font-bold transition-all hover:scale-105 active:scale-95"
                  title="Ouvrir le panneau flottant pour régler les largeurs des colonnes (Nom, Grade, Équipe, etc.)"
                >
                  <SlidersHorizontal className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
                  <span>Régler Largeurs Colonnes</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            TAB 2: PERSONNEL & ÉQUIPES MANAGER VIEW
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
                    Gestion centralisée du personnel médical, paramédical et des équipes de garde
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsServiceModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700 rounded-lg text-xs font-semibold shadow transition-colors"
                    title="Modifier l'intitulé du service ou de l'établissement hospitalier"
                  >
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Service & Hôpital</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsGuardRotationModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-sky-300 border border-slate-700 rounded-lg text-xs font-semibold shadow transition-colors"
                    title="Gérer la rotation des équipes (Période ou Perpétuelle)"
                  >
                    <Repeat className="w-3.5 h-3.5 text-sky-400" />
                    <span>Rotation des gardes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLeaveTypesModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold shadow transition-colors"
                    title="Ajouter, modifier ou supprimer des types de congés"
                  >
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Types de congés</span>
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

              {/* Team Filter Pills with Distinct Colors */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-900">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Équipes de Garde :
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTeamFilter('all')}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                    selectedTeamFilter === 'all'
                      ? 'bg-sky-600 border-sky-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Toutes les équipes
                </button>
                {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => {
                  const tTheme = getTeamTheme(letter);
                  const isSelected = selectedTeamFilter.toUpperCase() === letter;
                  const memberCount = staffList.filter(
                    (s) => s.category === 'paramedical_guard' && s.teamGroup.toUpperCase() === letter
                  ).length;

                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() =>
                        setSelectedTeamFilter(isSelected ? 'all' : letter)
                      }
                      className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? `${tTheme.fullBadge} ring-2 ring-white/30 scale-105 shadow-md`
                          : `${tTheme.badgeBg} ${tTheme.badgeText} ${tTheme.badgeBorder} hover:brightness-125`
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${tTheme.dotBg}`} />
                      <span>{tTheme.name}</span>
                      <span className="text-[10px] opacity-75 font-mono">({memberCount})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team Showcase Cards with Distinct Team Colors */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => {
                const tTheme = getTeamTheme(letter);
                const teamMembers = staffList.filter(
                  (s) => s.category === 'paramedical_guard' && s.teamGroup.toUpperCase() === letter
                );
                const isSelected = selectedTeamFilter.toUpperCase() === letter;

                return (
                  <div
                    key={letter}
                    onClick={() =>
                      setSelectedTeamFilter(isSelected ? 'all' : letter)
                    }
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      tTheme.cardBg
                    } ${
                      isSelected
                        ? `${tTheme.cardBorder} ring-2 ring-indigo-500/50 shadow-md`
                        : `${tTheme.cardBorder}`
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${tTheme.dotBg}`} />
                        <span className={`text-xs font-bold ${tTheme.badgeText}`}>
                          {tTheme.name}
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${tTheme.tagBg}`}>
                        {teamMembers.length} agents
                      </span>
                    </div>

                    <div className="mt-2 space-y-1">
                      {teamMembers.slice(0, 2).map((m) => (
                        <div key={m.id} className="text-[11px] text-slate-300 truncate font-medium">
                          • {m.fullName}
                        </div>
                      ))}
                      {teamMembers.length === 0 && (
                        <div className="text-[10px] text-slate-500 italic">Aucun agent</div>
                      )}
                      {teamMembers.length > 2 && (
                        <div className="text-[10px] text-slate-400">
                          +{teamMembers.length - 2} autre(s)
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-medium">
                        {isSelected ? '✓ Sélectionné' : 'Cliquer pour filtrer'}
                      </span>
                      <span className={`font-bold ${isSelected ? 'text-white underline' : tTheme.badgeText}`}>
                        {isSelected ? 'Tous' : 'Filtrer'}
                      </span>
                    </div>
                  </div>
                );
              })}
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
                      filteredStaff.map((staff) => {
                        const sTheme = getTeamTheme(staff.teamGroup);
                        return (
                          <tr
                            key={staff.id}
                            className={`hover:bg-slate-900/40 transition-colors ${
                              staff.category === 'paramedical_guard' && staff.teamGroup ? sTheme.rowBorder : ''
                            }`}
                          >
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
                                  ? 'Médical'
                                  : staff.category === 'paramedical_day'
                                  ? 'Paramédical Jour'
                                  : staff.category === 'paramedical_guard'
                                  ? 'Garde 16h'
                                  : "Hygiène"}
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
                            <td className="py-3 px-4 text-center">
                              {staff.category === 'paramedical_guard' ? (
                                <div className="inline-flex items-center gap-1.5 justify-center">
                                  <select
                                    value={staff.teamGroup}
                                    onChange={(e) =>
                                      handleUpdateStaffField(staff.id, 'teamGroup', e.target.value)
                                    }
                                    className={`font-bold px-2 py-1 rounded-md text-xs border outline-none cursor-pointer ${sTheme.fullBadge}`}
                                  >
                                    {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                                      <option
                                        key={letter}
                                        value={letter}
                                        className="bg-slate-950 text-white font-bold"
                                      >
                                        Équipe {letter}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ) : staff.teamGroup ? (
                                <span
                                  className={`font-bold px-2 py-0.5 rounded text-xs border inline-flex items-center gap-1.5 ${sTheme.fullBadge}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${sTheme.dotBg}`} />
                                  <span>{staff.teamGroup}</span>
                                </span>
                              ) : (
                                <span className="text-slate-600">—</span>
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
                                    className={`px-2.5 py-1 rounded text-[10.5px] font-bold border transition-colors ${sTheme.cycleButton}`}
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
                        );
                      })
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
                    Catégories: Médical, Paramédical, Hygiène
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
                  Simule l'exécution de requêtes indexées ObjectBox en Dart/C++ avec pagination
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
                    <option value="all">Toutes les catégories</option>
                    <option value="medical">medical (Médecins)</option>
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
                    <option value="name">@Index() fullName (Alphabétique)</option>
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
                    Résultats : <span className="text-white font-bold">{queryResult.results.length}</span> sur{' '}
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
                      <div className="text-slate-500 text-[10px] truncate">{item.category} · {item.horaireBlock}</div>
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
                  <strong>1. Hébergement et Données Locales :</strong> Ce système hospitalier fonctionne selon le principe <em>Local-First</em>. Toutes les modifications apportées aux plannings, listes de garde et tableaux d'activité sont conservées localement dans le moteur ObjectBox de votre navigateur (IndexedDB / LocalStorage). Aucune donnée nominative de santé ou du personnel n'est transmise à des tiers ou des serveurs publicitaires.
                </p>
                <p>
                  <strong>2. Respect du Secret Professionnel & Hospitalier :</strong> Conforme aux exigences administratives de l'Établissement Hospitalier d'Aïn El Türck (Dr. Medjber Tami - Service de Rhumatologie), les tableaux édités respectent strictement la chaîne de validation hiérarchique : Médecin Chef, Surveillant Médical, Direction des Activités Paramédicales (DAPM) et Direction Générale.
                </p>
                <p>
                  <strong>3. Exportation et Sauvegarde :</strong> Vous pouvez à tout moment exporter une copie intégrale sous format JSON ou générer des impressions physiques et PDF A4 certifiées.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{t.deleteAccountTitle}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Si vous souhaitez réinitialiser complètement le cache de ce poste ou effacer toutes les données locales ObjectBox :
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
        </div>
      </div>

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
                      setNewStaffRole('Médecin Généraliste');
                      setNewStaffGrade('Médecin');
                    } else if (cat === 'paramedical_guard') {
                      setNewStaffHoraire('16h');
                      setNewStaffRole('ATS');
                      setNewStaffGrade('ATS');
                      setNewStaffTeam('A');
                    } else if (cat === 'hygiene') {
                      setNewStaffHoraire('12h');
                      setNewStaffRole("Agent d'hygiène");
                      setNewStaffGrade("Agent d'hygiène");
                    } else {
                      setNewStaffHoraire('08h-16h');
                      setNewStaffRole('ATS');
                      setNewStaffGrade('ATS');
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 min-h-[38px] text-xs sm:text-sm"
                >
                  <option value="medical">Personnel Médical (08h-16h)</option>
                  <option value="paramedical_day">Paramédical Jour (08h-16h)</option>
                  <option value="paramedical_guard">Paramédical Garde (16h · Groupes A-E)</option>
                  <option value="hygiene">Agents d'Hygiène (12h)</option>
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
                    placeholder="Fonction complète"
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
              Êtes-vous sûr de vouloir effacer le stockage local ObjectBox et réinitialiser tous les plannings ?
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

      {/* MODAL: GESTION & FORMULAIRES DES TABLEAUX (REORGANISER & AFFECTER) */}
      <TableManagementModal
        isOpen={isTableManagementModalOpen}
        initialTab={tableManagementTab}
        staffList={staffList}
        onClose={() => setIsTableManagementModalOpen(false)}
        onUpdateStaffField={handleUpdateStaffField}
        onUpdateDoctorWeekly={handleUpdateDoctorWeekly}
        onAddStaff={handleAddStaff}
        onDeleteStaff={handleDeleteStaff}
      />

      {/* MODAL: HISTORIQUE DES MOIS (FILTRAGE PAR MODIFICATIF / NON-MODIFICATIF) */}
      <MonthHistoryModal
        isOpen={isMonthHistoryModalOpen}
        onClose={() => setIsMonthHistoryModalOpen(false)}
        currentConfig={config}
        onMonthChanged={(name) => showToast(`Planning du mois de ${name} activé avec succès !`)}
        onOpenCreateCustomMonth={() => setIsCreateMonthModalOpen(true)}
      />

      {/* MODAL: CRÉER UN MOIS PERSONNALISÉ (CONTINUITÉ PERPÉTUELLE) */}
      <CreateMonthModal
        isOpen={isCreateMonthModalOpen}
        onClose={() => setIsCreateMonthModalOpen(false)}
        currentMonthName={config.guardMonthName || 'Octobre 2026'}
        onSelectMonth={(year, monthIndex, isModif) => {
          objectBoxStore.createNewMonth(year, monthIndex, !!isModif);
          showToast(`Nouveau mois créé avec succès en continuité perpétuelle !`);
        }}
      />

      {/* FLOATING MODAL: RÉGLAGE EN DIRECT DES LARGEURS DE COLONNES */}
      <ColumnWidthsFloatingModal
        config={config}
        isOpen={isColumnWidthsModalOpen}
        onClose={() => setIsColumnWidthsModalOpen(false)}
        orientation={orientation}
      />

      {/* FOOTER */}
      <footer className="no-print bg-slate-950 border-t border-slate-900 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Établissement Hospitalier d'Aïn El Türck — Dr. Medjber Tami · Service de Rhumatologie
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
