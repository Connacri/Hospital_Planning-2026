/**
 * ObjectBox Local Reactive Database Engine (Web IndexedDB/LocalStorage + Dart ObjectBox Parity)
 * Supports @Entity, @Id, @Index, Box<T>, QueryBuilder with .offset() and .limit() pagination,
 * and instant persistence for all PDF tables, headers, staff members, and 30/31-day schedules.
 */

export type StaffCategory = 'medical' | 'paramedical_day' | 'paramedical_guard' | 'hygiene';

export interface DayColumnMeta {
  day: number; // 1..31
  dow: string; // JEU, VEN, SAM, DIM, LUN, MAR, MER
  isBlackColumn: boolean; // True for VEN & SAM in PDF 2
}

export interface DoctorWeeklySchedule {
  dimanche: string;
  lundi: string;
  mardi: string;
  mercredi: string;
  jeudi: string;
}

export interface MaternityLeaveConfig {
  startDay: number;
  endDay: number;
  label?: string; // e.g. "Congé de Maternité"
  datesText?: string; // e.g. "25/11/2025 au 26/04/2026"
}

export interface StaffEntity {
  id: number; // @Id() in ObjectBox
  fullName: string; // @Index()
  category: StaffCategory; // @Index()
  rolePortrait: string; // Fonction in PDF 1 (e.g. "Médecin Chef Rhumatologue")
  gradeLandscape: string; // Grade in PDF 2 (e.g. "Médecin Chef")
  obsPortrait: string; // O.B.S in PDF 1 Page 2 (e.g. "08h-16h", "CONGÉ de MATERNITÉ. 25/11/2025 au 26/04/2026")
  horaireBlock: string; // "08h-16h" | "16h" | "24h" | "12h"
  teamGroup: string; // "" | "A" | "B" | "C" | "D" | "E"
  portraitOrder: number; // @Index()
  landscapeOrder: number; // @Index()
  weeklySchedule: DoctorWeeklySchedule; // Used on PDF 1 Page 1 for doctors
  dailyActivity: Record<number, string>; // Days 1..31 -> "N" | "RE" | "G" | "Jour" | "Nuit" | "C" | "CM" | "Congé de Maternité"
  maternityLeave?: MaternityLeaveConfig; // Merged horizontal span in activity grid
}

export interface LeaveTypeItem {
  id: string;
  code: string;
  label: string;
  description?: string;
  color?: string;
  isSystem?: boolean;
}

export type TableModificatifKey =
  | 'pdf1Page1'
  | 'pdf1Page2'
  | 'pdf1Page3'
  | 'pdf2Page1'
  | 'pdf2Page2'
  | 'pdf2Page3'
  | 'pdf2Page5';

export const TABLE_MODIFICATIF_LABELS: Record<TableModificatifKey, string> = {
  pdf1Page1: 'Planning des Médecins (Portrait Page 1)',
  pdf1Page2: 'Liste du personnel médical (Portrait Page 2)',
  pdf1Page3: 'Planning du personnel paramédical (Portrait Page 3)',
  pdf2Page1: 'Tableau Activité Médical 08h-16h (Paysage Page 1)',
  pdf2Page2: 'Tableau Activité Paramédical 08h-16h (Paysage Page 2)',
  pdf2Page3: 'Tableau Activité Paramédical Garde 16h (Paysage Page 3)',
  pdf2Page5: "Tableau Activité Agents d'Hygiène 12h (Paysage Page 4/5)",
};

export function isTableModificatif(
  config: HospitalDocumentConfig,
  tableKey: TableModificatifKey
): boolean {
  if (config.modificatifOverrides && typeof config.modificatifOverrides[tableKey] === 'boolean') {
    return !!config.modificatifOverrides[tableKey];
  }
  return !!config.isModificatif;
}

export interface HospitalDocumentConfig {
  id: number; // @Id() singleton = 1
  republicHeader: string;
  ministryHeader: string;
  hospitalHeader: string;
  unitTitle: string;
  isModificatif?: boolean; // Toggles "(Modificatif)" in bold in document titles
  modificatifOverrides?: {
    pdf1Page1?: boolean;
    pdf1Page2?: boolean;
    pdf1Page3?: boolean;
    pdf2Page1?: boolean;
    pdf2Page2?: boolean;
    pdf2Page3?: boolean;
    pdf2Page5?: boolean;
  };
  currentPreset?: 'april_2026' | 'january_2026' | 'october_2026' | 'custom';
  // PDF 1 (Portrait) titles & metadata
  pdf1Page1Title: string;
  pdf1Page1Subtitle: string;
  pdf1Page1Columns: [string, string, string, string, string, string];
  pdf1Page1Obs: string;
  pdf1Page2Title: string;
  pdf1Page2Subtitle: string;
  pdf1Page2Columns: [string, string, string];
  pdf1Page3Title: string;
  pdf1Page3Columns: [string, string, string, string];
  pdf1Page3Obs08h16h: string;
  pdf1Page3Obs16h: string;
  pdf1Page3Obs12h: string;
  // PDF 2 (Landscape) titles & metadata
  pdf2Page1Title: string;
  pdf2Page2Title: string;
  pdf2Page3Title: string;
  pdf2Page5Title: string;
  pdf2NameColHeader: string;
  pdf2GradeColHeader: string;
  pdf2TeamColHeader: string;
  // Footers & Signatures
  cityDatePortrait: string;
  cityDateLandscape: string;
  legendItems: string[];
  leaveTypes?: LeaveTypeItem[];
  nbNotice: string;
  signaturesPortrait: [string, string, string, string];
  signaturesLandscape: [string, string, string, string];
  daysColumns: DayColumnMeta[];
  guardRotationOrder?: string[];
  guardMonthName?: string;
  guardMonthOffsetDays?: number;
}

export interface ObjectBoxDatabaseSnapshot {
  version: number;
  updatedAt: string;
  config: HospitalDocumentConfig;
  staffBox: StaffEntity[];
}

const STORAGE_KEY = 'eh_ain_el_turck_objectbox_store_v7';

const FRENCH_DOW_OCT_2026: string[] = [
  'JEU', 'VEN', 'SAM', 'DIM', 'LUN', 'MAR', 'MER'
];

export function buildOctober2026Days(): DayColumnMeta[] {
  const cols: DayColumnMeta[] = [];
  for (let d = 1; d <= 31; d++) {
    const dow = FRENCH_DOW_OCT_2026[(d - 1) % 7];
    const isBlackColumn = dow === 'VEN' || dow === 'SAM';
    cols.push({ day: d, dow, isBlackColumn });
  }
  return cols;
}

/**
 * Helper to retrieve maternity leave span for a staff entity
 */
export function getStaffMaternitySpan(
  staff: StaffEntity,
  daysColumns: DayColumnMeta[]
): { startDay: number; endDay: number; label: string } | null {
  // 1. Explicit configuration on the staff entity
  if (staff.maternityLeave && staff.maternityLeave.startDay > 0 && staff.maternityLeave.endDay >= staff.maternityLeave.startDay) {
    return {
      startDay: staff.maternityLeave.startDay,
      endDay: staff.maternityLeave.endDay,
      label: staff.maternityLeave.label || 'Congé de Maternité',
    };
  }

  // 2. Detection based on explicit maternity text in OBS
  const obsLower = (staff.obsPortrait || '').toLowerCase();
  if (obsLower.includes('maternité') || obsLower.includes('maternite')) {
    let endDay = 31;
    const match = staff.obsPortrait.match(/au\s*(\d{1,2})\//i);
    if (match) {
      endDay = parseInt(match[1], 10);
    }
    const maxDay = daysColumns.length > 0 ? daysColumns[daysColumns.length - 1].day : 31;
    return {
      startDay: 1,
      endDay: Math.min(endDay, maxDay),
      label: 'Congé de Maternité',
    };
  }

  // 3. Check for consecutive days marked with 'Congé de Maternité' or 'Maternité'
  let firstDay: number | null = null;
  let lastDay: number | null = null;
  for (const col of daysColumns) {
    const val = (staff.dailyActivity[col.day] || '').toLowerCase();
    if (val.includes('maternité') || val.includes('maternite')) {
      if (firstDay === null) firstDay = col.day;
      lastDay = col.day;
    } else if (firstDay !== null && lastDay !== null) {
      break;
    }
  }

  if (firstDay !== null && lastDay !== null && lastDay > firstDay) {
    return {
      startDay: firstDay,
      endDay: lastDay,
      label: 'Congé de Maternité',
    };
  }

  return null;
}

export const FRENCH_MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export function buildDaysColumnsForMonth(year: number, monthIndex: number): DayColumnMeta[] {
  const daysCount = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const DOW_SHORT = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
  const cols: DayColumnMeta[] = [];
  for (let d = 1; d <= daysCount; d++) {
    const date = new Date(Date.UTC(year, monthIndex, d));
    const dow = DOW_SHORT[date.getUTCDay()];
    const isBlackColumn = dow === 'VEN' || dow === 'SAM';
    cols.push({ day: d, dow, isBlackColumn });
  }
  return cols;
}

/**
 * Standard 08h-16h schedule: N on Dim-Jeu, RE on Ven-Sam
 */
export function buildStandard08h16hActivity(daysInMonth = 31, daysColumns = buildOctober2026Days()): Record<number, string> {
  const map: Record<number, string> = {};
  for (const col of daysColumns) {
    map[col.day] = col.isBlackColumn ? 'RE' : 'N';
  }
  return map;
}

/**
 * Ordre de rotation des équipes de garde (16h / 24h) :
 * Cycle de 5 jours (Jour, Nuit, RE, RE, RE)
 */
export const DEFAULT_GUARD_ROTATION_ORDER = ['A', 'D', 'B', 'E', 'C'];

export interface TeamThemeConfig {
  letter: string;
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  fullBadge: string;
  glow: string;
  pillColor: string;
  dotBg: string;
}

export const GUARD_TEAM_THEMES: Record<string, TeamThemeConfig> = {
  A: {
    letter: 'A',
    name: 'Équipe A',
    badgeBg: 'bg-emerald-950/80',
    badgeText: 'text-emerald-300',
    badgeBorder: 'border-emerald-600/80',
    fullBadge: 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/80 shadow-sm shadow-emerald-950/50',
    glow: 'rgba(16, 185, 129, 0.25)',
    pillColor: '#10b981',
    dotBg: 'bg-emerald-400',
  },
  B: {
    letter: 'B',
    name: 'Équipe B',
    badgeBg: 'bg-sky-950/80',
    badgeText: 'text-sky-300',
    badgeBorder: 'border-sky-600/80',
    fullBadge: 'bg-sky-950/80 text-sky-300 border border-sky-600/80 shadow-sm shadow-sky-950/50',
    glow: 'rgba(14, 165, 233, 0.25)',
    pillColor: '#0ea5e9',
    dotBg: 'bg-sky-400',
  },
  C: {
    letter: 'C',
    name: 'Équipe C',
    badgeBg: 'bg-purple-950/80',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-600/80',
    fullBadge: 'bg-purple-950/80 text-purple-300 border border-purple-600/80 shadow-sm shadow-purple-950/50',
    glow: 'rgba(168, 85, 247, 0.25)',
    pillColor: '#a855f7',
    dotBg: 'bg-purple-400',
  },
  D: {
    letter: 'D',
    name: 'Équipe D',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-300',
    badgeBorder: 'border-amber-600/80',
    fullBadge: 'bg-amber-950/80 text-amber-300 border border-amber-600/80 shadow-sm shadow-amber-950/50',
    glow: 'rgba(245, 158, 11, 0.25)',
    pillColor: '#f59e0b',
    dotBg: 'bg-amber-400',
  },
  E: {
    letter: 'E',
    name: 'Équipe E',
    badgeBg: 'bg-rose-950/80',
    badgeText: 'text-rose-300',
    badgeBorder: 'border-rose-600/80',
    fullBadge: 'bg-rose-950/80 text-rose-300 border border-rose-600/80 shadow-sm shadow-rose-950/50',
    glow: 'rgba(244, 63, 94, 0.25)',
    pillColor: '#f43f5e',
    dotBg: 'bg-rose-400',
  },
};

export function getTeamBadgeClass(team: string): string {
  const t = team.trim().toUpperCase();
  return GUARD_TEAM_THEMES[t]?.fullBadge || 'bg-slate-800 text-slate-300 border border-slate-700';
}

export function getTeamTheme(team: string): TeamThemeConfig {
  const t = team.trim().toUpperCase();
  return (
    GUARD_TEAM_THEMES[t] || {
      letter: t,
      name: `Équipe ${t}`,
      badgeBg: 'bg-slate-800',
      badgeText: 'text-slate-200',
      badgeBorder: 'border-slate-700',
      fullBadge: 'bg-slate-800 text-slate-200 border border-slate-700',
      glow: 'rgba(148, 163, 184, 0.2)',
      pillColor: '#94a3b8',
      dotBg: 'bg-slate-400',
    }
  );
}

export interface GuardMonthPreset {
  name: string;
  daysCount: number;
  cumulativeOffsetDays: number;
}

export const GUARD_MONTHS_PRESETS: GuardMonthPreset[] = [
  { name: 'Octobre 2026', daysCount: 31, cumulativeOffsetDays: 0 },
  { name: 'Novembre 2026', daysCount: 30, cumulativeOffsetDays: 31 },
  { name: 'Décembre 2026', daysCount: 31, cumulativeOffsetDays: 61 },
  { name: 'Janvier 2027', daysCount: 31, cumulativeOffsetDays: 92 },
  { name: 'Février 2027', daysCount: 28, cumulativeOffsetDays: 123 },
  { name: 'Mars 2027', daysCount: 31, cumulativeOffsetDays: 151 },
  { name: 'Avril 2027', daysCount: 30, cumulativeOffsetDays: 182 },
  { name: 'Mai 2027', daysCount: 31, cumulativeOffsetDays: 212 },
  { name: 'Juin 2027', daysCount: 30, cumulativeOffsetDays: 243 },
  { name: 'Juillet 2027', daysCount: 31, cumulativeOffsetDays: 273 },
  { name: 'Août 2027', daysCount: 31, cumulativeOffsetDays: 304 },
  { name: 'Septembre 2027', daysCount: 30, cumulativeOffsetDays: 335 },
  { name: 'Octobre 2027', daysCount: 31, cumulativeOffsetDays: 365 },
];

export function buildContinuousGuard16hActivity(
  team: string,
  rotationOrder: string[] = DEFAULT_GUARD_ROTATION_ORDER,
  cumulativeOffsetDays = 0,
  daysInMonth = 31,
  specialBouazizOverride = false
): Record<number, string> {
  const teamIndex = rotationOrder.indexOf(team);
  if (teamIndex === -1) {
    return buildGuard16hActivity(team, specialBouazizOverride);
  }

  const cycle = ['Jour', 'Nuit', 'RE', 'RE', 'RE'];
  const map: Record<number, string> = {};

  for (let d = 1; d <= daysInMonth; d++) {
    const absoluteDay = d - 1 + cumulativeOffsetDays;
    const phase = ((absoluteDay - teamIndex) % 5 + 5) % 5;
    map[d] = cycle[phase];
  }

  if (specialBouazizOverride && cumulativeOffsetDays === 0) {
    map[9] = 'RE';
    map[10] = 'RE';
    map[11] = 'RE';
    map[12] = 'RE';
    map[13] = 'RE';
  }

  return map;
}

export function buildGuard16hActivity(team: string, specialBouazizOverride = false): Record<number, string> {
  return buildContinuousGuard16hActivity(
    team,
    DEFAULT_GUARD_ROTATION_ORDER,
    0,
    30,
    specialBouazizOverride
  );
}

/**
 * 12h Hygiene Agents alternating schedule:
 * - startWithRE = true (Mohand Fatiha): Odd days = N, Even days = RE in April
 */
export function buildHygiene12hActivity(startWithN: boolean, daysCount = 30): Record<number, string> {
  const map: Record<number, string> = {};
  for (let d = 1; d <= daysCount; d++) {
    const isOdd = d % 2 === 1;
    if (startWithN) {
      map[d] = isOdd ? 'N' : 'RE';
    } else {
      map[d] = isOdd ? 'RE' : 'N';
    }
  }
  return map;
}

export const DEFAULT_LEAVE_TYPES: LeaveTypeItem[] = [
  { id: 'g', code: 'G', label: 'Garde', isSystem: true, color: '#0284c7' },
  { id: 're', code: 'RE', label: 'Récupération', isSystem: true, color: '#059669' },
  { id: 'c', code: 'C', label: 'Congé', isSystem: false, color: '#d97706' },
  { id: 'cm', code: 'CM', label: 'Congé Maladie', isSystem: false, color: '#e11d48' },
  { id: 'm', code: 'Congé de Maternité', label: 'Congé de Maternité (fusionné)', isSystem: false, color: '#ec4899' },
  { id: 'n', code: 'N', label: 'Normal', isSystem: true, color: '#475569' },
];

export function buildLegendFromLeaveTypes(leaveTypes: LeaveTypeItem[]): string[] {
  return leaveTypes.map((item) => {
    if (item.code === 'G' || item.code === 'RE' || item.code === 'N') return `${item.code} : ${item.label}`;
    if (item.code === 'Congé de Maternité') return item.label;
    return `${item.code} : ${item.label}`;
  });
}

/**
 * Create official October 2026 snapshot matching the user's provided PDF documents
 */
export function createOctober2026Snapshot(): ObjectBoxDatabaseSnapshot {
  const daysColumns = buildOctober2026Days();

  const config: HospitalDocumentConfig = {
    id: 1,
    republicHeader: 'RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE',
    ministryHeader: 'MINISTÈRE DE LA SANTÉ, DE LA POPULATION ET DE LA RÉFORME HOSPITALIÈRE',
    hospitalHeader: "Établissement Hospitalier d'Aïn El Türck - Dr. Medjber Tami",
    unitTitle: 'Unité : Service de Rhumatologie',
    isModificatif: false,
    modificatifOverrides: {
      pdf1Page1: false,
      pdf1Page2: false,
      pdf1Page3: false,
      pdf2Page1: false,
      pdf2Page2: false,
      pdf2Page3: false,
      pdf2Page5: false,
    },
    currentPreset: 'october_2026',
    // PDF 1 (Portrait)
    pdf1Page1Title: "Planning des Médecins « Mois d'Octobre 2026 »",
    pdf1Page1Subtitle: 'DE 8H À 16H',
    pdf1Page1Columns: ['Nom et Prénom', 'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'],
    pdf1Page1Obs: 'OBS : Journée de RCP tous les Mardis à 11 h',
    pdf1Page2Title: "La liste du personnel médical du mois d'Octobre 2026",
    pdf1Page2Subtitle: 'DE 8H À 16H',
    pdf1Page2Columns: ['Nom et Prénom', 'Fonction', 'O.B.S'],
    pdf1Page3Title: "Planning du Personnel Paramédical du Mois d'Octobre 2026",
    pdf1Page3Columns: ['Horaire', 'Nom et Prénom', 'Fonction', 'OBS'],
    pdf1Page3Obs08h16h: '',
    pdf1Page3Obs16h: '',
    pdf1Page3Obs12h: '',
    // PDF 2 (Landscape)
    pdf2Page1Title: "TABLEAU D'ACTIVITÉ DU MOIS D'OCTOBRE 2026 | 08h–16h — Personnel Médical",
    pdf2Page2Title: "TABLEAU D'ACTIVITÉ DU MOIS D'OCTOBRE 2026 | 08h–16h",
    pdf2Page3Title: "TABLEAU D'ACTIVITÉ DU MOIS D'OCTOBRE 2026 | 16h",
    pdf2Page5Title: "TABLEAU D'ACTIVITÉ DU MOIS D'OCTOBRE 2026 | Agents d'Hygiène — 12h",
    pdf2NameColHeader: 'Nom et Prénom',
    pdf2GradeColHeader: 'Grade',
    pdf2TeamColHeader: 'Équipe',
    cityDatePortrait: 'fait à Aïn el Türck le : 26/09/2026',
    cityDateLandscape: 'Fait à Aïn el Türck le : 26/09/2026',
    legendItems: [
      'Jour',
      'Nuit',
      'RE : Récupération',
      'C : Congé',
      'CM : Congé Maladie',
      'M : Maternité',
      'N : Normal',
      'F : Jour Férié',
    ],
    leaveTypes: [...DEFAULT_LEAVE_TYPES],
    guardRotationOrder: ['A', 'D', 'B', 'E', 'C'],
    guardMonthName: 'Octobre 2026',
    guardMonthOffsetDays: 0,
    nbNotice: "N.B : Toutes modifications de programme ne doivent se faire qu'après accord de la direction",
    signaturesPortrait: ['Le Médecin chef', 'Le Surveillant Médical', 'DAPM', 'Le Directeur Général'],
    signaturesLandscape: ['Le Médecin Chef', 'Le Surveillant Médical', 'DAPM', 'Le Directeur Général'],
    daysColumns,
  };

  const emptyWeekly: DoctorWeeklySchedule = {
    dimanche: 'SERVICE',
    lundi: 'SERVICE',
    mardi: 'SERVICE',
    mercredi: 'SERVICE',
    jeudi: 'SERVICE',
  };

  const octNormal = buildStandard08h16hActivity(31, daysColumns);

  const staffBox: StaffEntity[] = [
    // 1. PERSONNEL MÉDICAL (6 Médecins)
    {
      id: 1,
      fullName: 'Medjadi Mohsine',
      category: 'medical',
      rolePortrait: 'Médecin Chef Rhumatologue',
      gradeLandscape: 'Médecin Chef\nRhumatologue',
      obsPortrait: '08h-16h',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 1,
      landscapeOrder: 1,
      weeklySchedule: {
        dimanche: 'Service Biothérapie',
        lundi: 'DMO',
        mardi: 'Visite Générale',
        mercredi: 'ConsultationE.P.S.P\nBenSmir',
        jeudi: 'Journée\nPédagogique',
      },
      dailyActivity: { ...octNormal },
    },
    {
      id: 2,
      fullName: 'Ouadah Souad',
      category: 'medical',
      rolePortrait: 'Médecin Principal en Rhumatologie',
      gradeLandscape: 'Médecin Principal\nen Rhumatologie',
      obsPortrait: '08h-16h',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 2,
      landscapeOrder: 2,
      weeklySchedule: {
        dimanche: 'Journée\nPédagogique',
        lundi: 'Consultation E.P.S.P\nMers El Kebir',
        mardi: 'Visite Générale',
        mercredi: 'DMO',
        jeudi: 'Service Biothérapie',
      },
      dailyActivity: { ...octNormal },
    },
    {
      id: 3,
      fullName: 'Tlemsani Naziha',
      category: 'medical',
      rolePortrait: 'Médecin Généraliste Principal',
      gradeLandscape: 'Médecin\nGénéraliste',
      obsPortrait: '08h-16h',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 3,
      landscapeOrder: 3,
      weeklySchedule: {
        dimanche: 'SERVICE',
        lundi: 'SERVICE',
        mardi: 'ConsultationE.P.S.P\nBenSmir',
        mercredi: 'SERVICE',
        jeudi: 'SERVICE',
      },
      dailyActivity: { ...octNormal },
    },
    {
      id: 4,
      fullName: 'Boumazouzi Hind',
      category: 'medical',
      rolePortrait: 'Médecin Généraliste Principal',
      gradeLandscape: 'Médecin\nGénéraliste',
      obsPortrait: '08h-16h',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 4,
      landscapeOrder: 4,
      weeklySchedule: {
        dimanche: 'SERVICE',
        lundi: 'SERVICE',
        mardi: 'Visite Générale',
        mercredi: 'SERVICE',
        jeudi: 'SERVICE',
      },
      dailyActivity: { ...octNormal },
    },
    {
      id: 5,
      fullName: 'Benrahal Yasmina',
      category: 'medical',
      rolePortrait: 'Médecin Généraliste',
      gradeLandscape: 'Médecin\nGénéraliste',
      obsPortrait: '08h-16h',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 5,
      landscapeOrder: 5,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: { ...octNormal },
    },
    {
      id: 6,
      fullName: 'Chouchelamane Soumia',
      category: 'medical',
      rolePortrait: 'Médecin Généraliste',
      gradeLandscape: 'Médecin\nGénéraliste',
      obsPortrait: '08h-16h',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 6,
      landscapeOrder: 6,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: { ...octNormal },
    },

    // 2. PERSONNEL PARAMÉDICAL 08h-16h (10 Agents)
    {
      id: 7,
      fullName: 'Kerarma Djelloul',
      category: 'paramedical_day',
      rolePortrait: 'I.SSP Surveillant Médical',
      gradeLandscape: 'I.SSP Surveillant\nMédical',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 1,
      landscapeOrder: 1,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: { ...octNormal },
    },
    {
      id: 8,
      fullName: 'Meddah Fadela',
      category: 'paramedical_day',
      rolePortrait: 'Psychologue',
      gradeLandscape: 'Psychologue',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 2,
      landscapeOrder: 2,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: { ...octNormal },
    },
    {
      id: 9,
      fullName: 'Behloul Zahra',
      category: 'paramedical_day',
      rolePortrait: 'Administrateur',
      gradeLandscape: 'Administrateur',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 3,
      landscapeOrder: 3,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: { ...octNormal },
    },
    {
      id: 10,
      fullName: 'Baoud Kholoud',
      category: 'paramedical_day',
      rolePortrait: 'Agent de bureau',
      gradeLandscape: 'Agent de bureau',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 5,
      landscapeOrder: 4,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: { ...octNormal },
    },
    {
      id: 11,
      fullName: 'Zalegh Fatima',
      category: 'paramedical_day',
      rolePortrait: 'Agent de bureau',
      gradeLandscape: 'Agent de bureau',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 4,
      landscapeOrder: 5,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: { ...octNormal },
    },
    {
      id: 12,
      fullName: 'Naamoun Sarra',
      category: 'paramedical_day',
      rolePortrait: 'Chargée de pharmacie',
      gradeLandscape: 'Chargée de\npharmacie',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 6,
      landscapeOrder: 6,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: { ...octNormal },
    },
    {
      id: 13,
      fullName: 'Djaziri Cherifa',
      category: 'paramedical_day',
      rolePortrait: 'Chargé de pharmacie',
      gradeLandscape: 'Chargé de\npharmacie',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 9,
      landscapeOrder: 7,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: { ...octNormal },
    },
    {
      id: 14,
      fullName: 'Rahmani Ibtissem',
      category: 'paramedical_day',
      rolePortrait: 'ATS principal',
      gradeLandscape: 'ATS principal',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 7,
      landscapeOrder: 8,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: { ...octNormal },
    },
    {
      id: 15,
      fullName: 'Kassab Hichem',
      category: 'paramedical_day',
      rolePortrait: 'ATS principal',
      gradeLandscape: 'ATS principal',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 8,
      landscapeOrder: 9,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: { ...octNormal },
    },
    {
      id: 16,
      fullName: 'Hellal Merouane',
      category: 'paramedical_day',
      rolePortrait: 'ATS',
      gradeLandscape: 'ATS',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 10,
      landscapeOrder: 10,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: { ...octNormal },
    },

    // 3. PARAMÉDICAL GARDE 16h (16 Agents, Groupes A, B, C, D, E)
    // Groupe A
    {
      id: 17,
      fullName: 'Bakhouche Sarra',
      category: 'paramedical_guard',
      rolePortrait: 'ATS',
      gradeLandscape: 'ATS',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'A',
      portraitOrder: 1,
      landscapeOrder: 1,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildContinuousGuard16hActivity('A', ['A', 'D', 'B', 'E', 'C'], 0, 31),
    },
    {
      id: 18,
      fullName: 'Behloul Sihem',
      category: 'paramedical_guard',
      rolePortrait: 'ATS',
      gradeLandscape: 'ATS',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'A',
      portraitOrder: 2,
      landscapeOrder: 2,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildContinuousGuard16hActivity('A', ['A', 'D', 'B', 'E', 'C'], 0, 31),
    },
    {
      id: 19,
      fullName: 'Bouabida Ikram',
      category: 'paramedical_guard',
      rolePortrait: 'ATS principal',
      gradeLandscape: 'ATS principal',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'A',
      portraitOrder: 3,
      landscapeOrder: 3,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildContinuousGuard16hActivity('A', ['A', 'D', 'B', 'E', 'C'], 0, 31),
    },
    {
      id: 20,
      fullName: 'Ben Kara Ahmed',
      category: 'paramedical_guard',
      rolePortrait: 'ATS',
      gradeLandscape: 'ATS',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'A',
      portraitOrder: 4,
      landscapeOrder: 4,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildContinuousGuard16hActivity('A', ['A', 'D', 'B', 'E', 'C'], 0, 31),
    },

    // Groupe B
    {
      id: 21,
      fullName: 'Kadri Karima',
      category: 'paramedical_guard',
      rolePortrait: 'ATS principal',
      gradeLandscape: 'ATS principal',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'B',
      portraitOrder: 5,
      landscapeOrder: 5,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildContinuousGuard16hActivity('B', ['A', 'D', 'B', 'E', 'C'], 0, 31),
    },
    {
      id: 22,
      fullName: 'Hiadsi Souad',
      category: 'paramedical_guard',
      rolePortrait: 'ATS principal',
      gradeLandscape: 'ATS principal',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'B',
      portraitOrder: 6,
      landscapeOrder: 6,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildContinuousGuard16hActivity('B', ['A', 'D', 'B', 'E', 'C'], 0, 31),
    },
    {
      id: 23,
      fullName: 'Belhadj kacem fatima',
      category: 'paramedical_guard',
      rolePortrait: 'ATS',
      gradeLandscape: 'ATS',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'B',
      portraitOrder: 7,
      landscapeOrder: 7,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildContinuousGuard16hActivity('B', ['A', 'D', 'B', 'E', 'C'], 0, 31),
    },

    // Groupe C
    {
      id: 24,
      fullName: 'Chaabane Abdelhamid',
      category: 'paramedical_guard',
      rolePortrait: 'infirmier major',
      gradeLandscape: 'infirmier major',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'C',
      portraitOrder: 8,
      landscapeOrder: 8,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildContinuousGuard16hActivity('C', ['A', 'D', 'B', 'E', 'C'], 0, 31),
    },
    {
      id: 25,
      fullName: 'Mahdjoubi Sami',
      category: 'paramedical_guard',
      rolePortrait: 'ATS',
      gradeLandscape: 'ATS',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'C',
      portraitOrder: 9,
      landscapeOrder: 9,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildContinuousGuard16hActivity('C', ['A', 'D', 'B', 'E', 'C'], 0, 31),
    },
    {
      id: 26,
      fullName: 'Belarbi Mohamed',
      category: 'paramedical_guard',
      rolePortrait: 'ATS',
      gradeLandscape: 'ATS',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'C',
      portraitOrder: 10,
      landscapeOrder: 10,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildContinuousGuard16hActivity('C', ['A', 'D', 'B', 'E', 'C'], 0, 31),
    },
    {
      id: 27,
      fullName: 'Bouderouez Fatiha',
      category: 'paramedical_guard',
      rolePortrait: 'IDE',
      gradeLandscape: 'IDE',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'C',
      portraitOrder: 11,
      landscapeOrder: 11,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildContinuousGuard16hActivity('C', ['A', 'D', 'B', 'E', 'C'], 0, 31),
    },

    // Groupe D
    {
      id: 28,
      fullName: 'Hamdi Souad',
      category: 'paramedical_guard',
      rolePortrait: 'IDE',
      gradeLandscape: 'IDE',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'D',
      portraitOrder: 12,
      landscapeOrder: 12,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildContinuousGuard16hActivity('D', ['A', 'D', 'B', 'E', 'C'], 0, 31),
    },
    {
      id: 29,
      fullName: 'Moussa Hadjar',
      category: 'paramedical_guard',
      rolePortrait: 'ATS principal',
      gradeLandscape: 'ATS principal',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'D',
      portraitOrder: 13,
      landscapeOrder: 13,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildContinuousGuard16hActivity('D', ['A', 'D', 'B', 'E', 'C'], 0, 31),
    },

    // Groupe E
    {
      id: 30,
      fullName: 'Guerle Mohamed Yacine',
      category: 'paramedical_guard',
      rolePortrait: 'ATS',
      gradeLandscape: 'ATS',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'E',
      portraitOrder: 16,
      landscapeOrder: 14,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildContinuousGuard16hActivity('E', ['A', 'D', 'B', 'E', 'C'], 0, 31, false),
    },
    {
      id: 31,
      fullName: 'Isselma Mohamed Nabi',
      category: 'paramedical_guard',
      rolePortrait: 'ATS',
      gradeLandscape: 'ATS',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'E',
      portraitOrder: 15,
      landscapeOrder: 15,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildContinuousGuard16hActivity('E', ['A', 'D', 'B', 'E', 'C'], 0, 31, false),
    },
    {
      id: 32,
      fullName: 'Bouaziz Nacer',
      category: 'paramedical_guard',
      rolePortrait: 'ATS principal',
      gradeLandscape: 'ATS principal',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'E',
      portraitOrder: 14,
      landscapeOrder: 16,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildContinuousGuard16hActivity('E', ['A', 'D', 'B', 'E', 'C'], 0, 31, true),
    },

    // 4. AGENTS D'HYGIÈNE 12h (2 Agents)
    {
      id: 33,
      fullName: 'Mohand Fatiha',
      category: 'hygiene',
      rolePortrait: "Agent d'hygiène",
      gradeLandscape: "Agent d'hygiène",
      obsPortrait: '',
      horaireBlock: '12h',
      teamGroup: '',
      portraitOrder: 1,
      landscapeOrder: 1,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildHygiene12hActivity(false, 31),
    },
    {
      id: 34,
      fullName: 'Touati Fatima',
      category: 'hygiene',
      rolePortrait: "Agent d'hygiène",
      gradeLandscape: "Agent d'hygiène",
      obsPortrait: '',
      horaireBlock: '12h',
      teamGroup: '',
      portraitOrder: 2,
      landscapeOrder: 2,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildHygiene12hActivity(true, 31),
    },
  ];

  return {
    version: 6,
    updatedAt: new Date().toISOString(),
    config,
    staffBox,
  };
}

export function createInitialSeedSnapshot(): ObjectBoxDatabaseSnapshot {
  return createOctober2026Snapshot();
}

/**
 * Paginated Query Builder matching ObjectBox best practices:
 * Uses lazy filter evaluation with .offset() and .limit() and indexed property sorting.
 */
export class ObjectBoxQueryBuilder<T> {
  private items: T[];
  private predicate?: (item: T) => boolean;
  private comparator?: (a: T, b: T) => number;

  constructor(items: T[]) {
    this.items = items;
  }

  where(predicate: (item: T) => boolean): this {
    this.predicate = predicate;
    return this;
  }

  orderBy(comparator: (a: T, b: T) => number): this {
    this.comparator = comparator;
    return this;
  }

  find(options?: { offset?: number; limit?: number }): { results: T[]; totalCount: number } {
    let filtered = this.predicate ? this.items.filter(this.predicate) : [...this.items];
    if (this.comparator) {
      filtered.sort(this.comparator);
    }
    const totalCount = filtered.length;
    const offset = Math.max(0, options?.offset ?? 0);
    const limit = options?.limit !== undefined ? Math.max(1, options.limit) : totalCount;
    return {
      results: filtered.slice(offset, offset + limit),
      totalCount,
    };
  }
}

export class ObjectBoxLocalStore {
  private snapshot: ObjectBoxDatabaseSnapshot;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.snapshot = this.loadFromStorage();
  }

  private loadFromStorage(): ObjectBoxDatabaseSnapshot {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ObjectBoxDatabaseSnapshot;
        if (parsed && parsed.config && Array.isArray(parsed.staffBox)) {
          // Normalize Ben Smir in weekly schedules
          parsed.staffBox.forEach((staff) => {
            if (staff.weeklySchedule) {
              const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi'] as const;
              days.forEach((d) => {
                if (typeof staff.weeklySchedule[d] === 'string') {
                  staff.weeklySchedule[d] = staff.weeklySchedule[d]
                    .replace(/Ben\s*\n\s*Smir/gi, 'Ben Smir')
                    .replace(/Consultation\s+E\.P\.S\.P\s+Ben\s+Smir/gi, 'Consultation E.P.S.P\nBen Smir');
                }
              });
            }
          });
          return parsed;
        }
      }
    } catch {
      // Fallback to seed snapshot
    }
    const seed = createInitialSeedSnapshot();
    this.persistAsync(seed);
    return seed;
  }

  private persistAsync(snap: ObjectBoxDatabaseSnapshot): void {
    queueMicrotask(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
      } catch {
        // Ignore quota errors in sandboxes
      }
    });
  }

  private notify(): void {
    this.snapshot = {
      ...this.snapshot,
      updatedAt: new Date().toISOString(),
    };
    this.persistAsync(this.snapshot);
    this.listeners.forEach((fn) => fn());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): ObjectBoxDatabaseSnapshot {
    return this.snapshot;
  }

  getConfig(): HospitalDocumentConfig {
    return this.snapshot.config;
  }

  updateConfig(partial: Partial<HospitalDocumentConfig>): void {
    this.snapshot.config = {
      ...this.snapshot.config,
      ...partial,
    };
    this.notify();
  }

  toggleModificatif(enable?: boolean): void {
    const nextVal = enable !== undefined ? enable : !this.snapshot.config.isModificatif;
    this.updateConfig({ isModificatif: nextVal });
  }

  queryStaff(): ObjectBoxQueryBuilder<StaffEntity> {
    return new ObjectBoxQueryBuilder<StaffEntity>(this.snapshot.staffBox);
  }

  putStaff(entity: Omit<StaffEntity, 'id'> & { id?: number }): StaffEntity {
    if (entity.id && entity.id > 0) {
      const idx = this.snapshot.staffBox.findIndex((s) => s.id === entity.id);
      if (idx !== -1) {
        const updated: StaffEntity = { ...(entity as StaffEntity) };
        const nextBox = [...this.snapshot.staffBox];
        nextBox[idx] = updated;
        this.snapshot.staffBox = nextBox;
        this.notify();
        return updated;
      }
    }
    const maxId = this.snapshot.staffBox.reduce((max, item) => Math.max(max, item.id), 0);
    const created: StaffEntity = {
      ...(entity as Omit<StaffEntity, 'id'>),
      id: maxId + 1,
    };
    this.snapshot.staffBox = [...this.snapshot.staffBox, created];
    this.notify();
    return created;
  }

  restoreStaffList(staffList: StaffEntity[]): void {
    this.snapshot = {
      ...this.snapshot,
      staffBox: staffList.map((s) => ({ ...s })),
    };
    this.notify();
  }

  updateStaffField<K extends keyof StaffEntity>(id: number, field: K, value: StaffEntity[K]): void {
    const idx = this.snapshot.staffBox.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const nextBox = [...this.snapshot.staffBox];
    nextBox[idx] = {
      ...nextBox[idx],
      [field]: value,
    };
    this.snapshot.staffBox = nextBox;
    this.notify();
  }

  updateStaffDayCell(id: number, day: number, code: string): void {
    const idx = this.snapshot.staffBox.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const nextBox = [...this.snapshot.staffBox];
    nextBox[idx] = {
      ...nextBox[idx],
      dailyActivity: {
        ...nextBox[idx].dailyActivity,
        [day]: code,
      },
    };
    this.snapshot.staffBox = nextBox;
    this.notify();
  }

  setMaternityLeave(
    staffId: number,
    startDay: number,
    endDay: number,
    datesText: string,
    label = 'Congé de Maternité'
  ): void {
    const idx = this.snapshot.staffBox.findIndex((s) => s.id === staffId);
    if (idx === -1) return;
    const staff = this.snapshot.staffBox[idx];

    const nextActivity = { ...staff.dailyActivity };
    for (let d = startDay; d <= endDay; d++) {
      nextActivity[d] = label;
    }

    const obsString = `CONGÉ de MATERNITÉ. ${datesText}`;

    const updated: StaffEntity = {
      ...staff,
      obsPortrait: obsString,
      maternityLeave: {
        startDay,
        endDay,
        label,
        datesText,
      },
      dailyActivity: nextActivity,
    };

    const nextBox = [...this.snapshot.staffBox];
    nextBox[idx] = updated;
    this.snapshot.staffBox = nextBox;
    this.notify();
  }

  removeMaternityLeave(staffId: number): void {
    const idx = this.snapshot.staffBox.findIndex((s) => s.id === staffId);
    if (idx === -1) return;
    const staff = this.snapshot.staffBox[idx];

    const nextActivity = { ...staff.dailyActivity };
    if (staff.maternityLeave) {
      for (let d = staff.maternityLeave.startDay; d <= staff.maternityLeave.endDay; d++) {
        nextActivity[d] = staff.horaireBlock === '08h-16h' ? 'N' : 'RE';
      }
    }

    const updated: StaffEntity = {
      ...staff,
      obsPortrait: '',
      maternityLeave: undefined,
      dailyActivity: nextActivity,
    };

    const nextBox = [...this.snapshot.staffBox];
    nextBox[idx] = updated;
    this.snapshot.staffBox = nextBox;
    this.notify();
  }

  updateDoctorWeeklyCell(id: number, dayKey: keyof DoctorWeeklySchedule, value: string): void {
    const idx = this.snapshot.staffBox.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const nextBox = [...this.snapshot.staffBox];
    nextBox[idx] = {
      ...nextBox[idx],
      weeklySchedule: {
        ...nextBox[idx].weeklySchedule,
        [dayKey]: value,
      },
    };
    this.snapshot.staffBox = nextBox;
    this.notify();
  }

  removeStaff(id: number): void {
    this.snapshot.staffBox = this.snapshot.staffBox.filter((s) => s.id !== id);
    this.notify();
  }

  addLeaveType(item: Omit<LeaveTypeItem, 'id'>): void {
    const existing = this.snapshot.config.leaveTypes ?? [...DEFAULT_LEAVE_TYPES];
    const newId = item.code.toLowerCase().replace(/[^a-z0-9]/g, '') || `leave_${Date.now()}`;
    const newItem: LeaveTypeItem = {
      ...item,
      id: newId,
    };
    const nextList = [...existing, newItem];
    this.snapshot.config = {
      ...this.snapshot.config,
      leaveTypes: nextList,
      legendItems: buildLegendFromLeaveTypes(nextList),
    };
    this.notify();
  }

  updateLeaveType(id: string, updates: Partial<LeaveTypeItem>): void {
    const existing = this.snapshot.config.leaveTypes ?? [...DEFAULT_LEAVE_TYPES];
    const nextList = existing.map((lt) => (lt.id === id ? { ...lt, ...updates } : lt));
    this.snapshot.config = {
      ...this.snapshot.config,
      leaveTypes: nextList,
      legendItems: buildLegendFromLeaveTypes(nextList),
    };
    this.notify();
  }

  deleteLeaveType(id: string): void {
    const existing = this.snapshot.config.leaveTypes ?? [...DEFAULT_LEAVE_TYPES];
    const nextList = existing.filter((lt) => lt.id !== id);
    this.snapshot.config = {
      ...this.snapshot.config,
      leaveTypes: nextList,
      legendItems: buildLegendFromLeaveTypes(nextList),
    };
    this.notify();
  }

  toggleTableModificatif(tableKey: TableModificatifKey): void {
    const current = isTableModificatif(this.snapshot.config, tableKey);
    this.updateConfig({
      modificatifOverrides: {
        ...(this.snapshot.config.modificatifOverrides || {}),
        [tableKey]: !current,
      },
    });
  }

  setAllTablesModificatif(enabled: boolean): void {
    this.updateConfig({
      isModificatif: enabled,
      modificatifOverrides: {
        pdf1Page1: enabled,
        pdf1Page2: enabled,
        pdf1Page3: enabled,
        pdf2Page1: enabled,
        pdf2Page2: enabled,
        pdf2Page3: enabled,
        pdf2Page5: enabled,
      },
    });
  }

  applyContinuousGuardRotation(
    rotationOrder: string[] = DEFAULT_GUARD_ROTATION_ORDER,
    cumulativeOffsetDays = 0,
    daysInMonth = 31,
    includeBouazizOverride = true,
    periodRange?: { startDay: number; endDay: number } | null
  ): void {
    const nextStaff = this.snapshot.staffBox.map((staff) => {
      if (staff.category !== 'paramedical_guard' || !staff.teamGroup) {
        return staff;
      }

      // If staff has active maternity leave, preserve maternity leave days
      const matSpan = getStaffMaternitySpan(staff, this.snapshot.config.daysColumns);

      const isBouaziz = staff.fullName.toLowerCase().includes('bouaziz');
      const shouldApplyBouazizOverride = includeBouazizOverride && isBouaziz;

      const teamActivity = buildContinuousGuard16hActivity(
        staff.teamGroup,
        rotationOrder,
        cumulativeOffsetDays,
        daysInMonth,
        shouldApplyBouazizOverride
      );

      const newActivity = { ...staff.dailyActivity };
      const start = periodRange ? periodRange.startDay : 1;
      const end = periodRange ? periodRange.endDay : daysInMonth;

      for (let d = start; d <= end; d++) {
        if (matSpan && d >= matSpan.startDay && d <= matSpan.endDay) {
          newActivity[d] = matSpan.label || 'Congé de Maternité';
          continue;
        }
        if (teamActivity[d]) {
          newActivity[d] = teamActivity[d];
        }
      }

      return {
        ...staff,
        dailyActivity: newActivity,
      };
    });

    this.snapshot.config = {
      ...this.snapshot.config,
      guardRotationOrder: rotationOrder,
      guardMonthOffsetDays: cumulativeOffsetDays,
    };
    this.snapshot.staffBox = nextStaff;
    this.notify();
  }

  resetToOriginalPdfs(): void {
    this.snapshot = createOctober2026Snapshot();
    this.notify();
  }

  loadOctoberPreset(): void {
    this.snapshot = createOctober2026Snapshot();
    this.notify();
  }

  /**
   * Crée un mois donné (ex: Novembre 2026, Décembre 2026, Janvier 2027...) en préservant
   * la continuité mathématique parfaite des gardes et du personnel à partir d'Octobre 2026.
   */
  createNewMonth(year: number, monthIndex: number): void {
    const monthName = `${FRENCH_MONTH_NAMES[monthIndex]} ${year}`;
    const daysColumns = buildDaysColumnsForMonth(year, monthIndex);
    const daysInMonth = daysColumns.length;

    // Calcul de la continuité à partir de la référence 1er Octobre 2026 (base offset 0)
    const baseTime = Date.UTC(2026, 9, 1);
    const targetFirstDayTime = Date.UTC(year, monthIndex, 1);
    const daysDiffFromBase = Math.round((targetFirstDayTime - baseTime) / 86400000);
    const cumulativeOffsetDays = daysDiffFromBase;

    const order = this.snapshot.config.guardRotationOrder || DEFAULT_GUARD_ROTATION_ORDER;

    const updatedConfig: HospitalDocumentConfig = {
      ...this.snapshot.config,
      guardMonthName: monthName,
      guardMonthOffsetDays: ((cumulativeOffsetDays % 5) + 5) % 5,
      daysColumns,
      pdf1Page1Title: `Planning des Médecins « Mois de ${monthName} »`,
      pdf1Page2Title: `La liste du personnel médical du mois de ${monthName}`,
      pdf1Page3Title: `Planning du Personnel Paramédical du Mois de ${monthName}`,
      pdf2Page1Title: `TABLEAU D'ACTIVITÉ DU MOIS DE ${monthName.toUpperCase()} | 08h–16h — Personnel Médical`,
      pdf2Page2Title: `TABLEAU D'ACTIVITÉ DU MOIS DE ${monthName.toUpperCase()} | 08h–16h`,
      pdf2Page3Title: `TABLEAU D'ACTIVITÉ DU MOIS DE ${monthName.toUpperCase()} 16h`,
      pdf2Page5Title: `TABLEAU D'ACTIVITÉ DU MOIS DE ${monthName.toUpperCase()} Agents d'Hygiène — 12h`,
      cityDateLandscape: `Fait à Aïn el Türck le : 01/${String(monthIndex + 1).padStart(2, '0')}/${year}`,
      cityDatePortrait: `fait à Aïn el Türck le : 01/${String(monthIndex + 1).padStart(2, '0')}/${year}`,
      isModificatif: false,
    };

    const nextStaff = this.snapshot.staffBox.map((staff) => {
      // Paramedical Guard: rotation continue 16h
      if (staff.category === 'paramedical_guard' && staff.teamGroup) {
        const teamAct = buildContinuousGuard16hActivity(
          staff.teamGroup,
          order,
          cumulativeOffsetDays,
          daysInMonth,
          false
        );
        return {
          ...staff,
          dailyActivity: teamAct,
        };
      }
      // Medical & Paramedical Day (08h-16h)
      if (staff.category === 'medical' || staff.category === 'paramedical_day') {
        return {
          ...staff,
          dailyActivity: buildStandard08h16hActivity(daysInMonth, daysColumns),
        };
      }
      // Hygiene (12h)
      if (staff.category === 'hygiene') {
        const isOdd = (staff.landscapeOrder || 1) % 2 === 1;
        return {
          ...staff,
          dailyActivity: buildHygiene12hActivity(isOdd, daysInMonth),
        };
      }
      return staff;
    });

    this.snapshot = {
      ...this.snapshot,
      updatedAt: new Date().toISOString(),
      config: updatedConfig,
      staffBox: nextStaff,
    };
    this.notify();
  }

  importJsonSnapshot(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString) as ObjectBoxDatabaseSnapshot;
      if (parsed && parsed.config && Array.isArray(parsed.staffBox)) {
        this.snapshot = parsed;
        this.notify();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const objectBoxStore = new ObjectBoxLocalStore();
