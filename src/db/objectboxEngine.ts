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

export interface HospitalDocumentConfig {
  id: number; // @Id() singleton = 1
  republicHeader: string;
  ministryHeader: string;
  hospitalHeader: string;
  unitTitle: string;
  isModificatif?: boolean; // Toggles "(Modificatif)" in bold in document titles
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

const STORAGE_KEY = 'eh_ain_el_turck_objectbox_store_v4';

const FRENCH_DOW_APRIL_2026: string[] = [
  'MER', 'JEU', 'VEN', 'SAM', 'DIM', 'LUN', 'MAR'
];

export function buildApril2026Days(): DayColumnMeta[] {
  const cols: DayColumnMeta[] = [];
  for (let d = 1; d <= 30; d++) {
    const dow = FRENCH_DOW_APRIL_2026[(d - 1) % 7];
    const isBlackColumn = dow === 'VEN' || dow === 'SAM';
    cols.push({ day: d, dow, isBlackColumn });
  }
  return cols;
}

const FRENCH_DOW_JANUARY_2026: string[] = [
  'JEU', 'VEN', 'SAM', 'DIM', 'LUN', 'MAR', 'MER'
];

export function buildJanuary2026Days(): DayColumnMeta[] {
  const cols: DayColumnMeta[] = [];
  for (let d = 1; d <= 31; d++) {
    const dow = FRENCH_DOW_JANUARY_2026[(d - 1) % 7];
    const isBlackColumn = dow === 'VEN' || dow === 'SAM';
    cols.push({ day: d, dow, isBlackColumn });
  }
  return cols;
}

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

  // 2. Bakhouche Sarra special handling / automatic detection based on OBS
  const obsLower = (staff.obsPortrait || '').toLowerCase();
  if (obsLower.includes('maternité') || obsLower.includes('maternite') || staff.fullName.toLowerCase().includes('bakhouche')) {
    // If dates mention "au 26/04/2026", end day is 26
    let endDay = 26;
    const match = staff.obsPortrait.match(/au\s*(\d{1,2})\//i);
    if (match) {
      endDay = parseInt(match[1], 10);
    }
    const maxDay = daysColumns.length > 0 ? daysColumns[daysColumns.length - 1].day : 30;
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

/**
 * Standard 08h-16h schedule: N on Dim-Jeu, RE on Ven-Sam
 */
export function buildStandard08h16hActivity(daysInMonth = 30, daysColumns = buildApril2026Days()): Record<number, string> {
  const map: Record<number, string> = {};
  for (const col of daysColumns) {
    map[col.day] = col.isBlackColumn ? 'RE' : 'N';
  }
  return map;
}

/**
 * Ordre de rotation des équipes de garde (16h / 24h) :
 * Cycle de 4 jours (G, RE, RE, RE)
 */
export const DEFAULT_GUARD_ROTATION_ORDER = ['A', 'D', 'B', 'E', 'C'];

export interface GuardMonthPreset {
  name: string;
  daysCount: number;
  cumulativeOffsetDays: number;
}

export const GUARD_MONTHS_PRESETS: GuardMonthPreset[] = [
  { name: 'Avril 2026', daysCount: 30, cumulativeOffsetDays: 0 },
  { name: 'Mai 2026', daysCount: 31, cumulativeOffsetDays: 30 },
  { name: 'Juin 2026', daysCount: 30, cumulativeOffsetDays: 61 },
  { name: 'Juillet 2026', daysCount: 31, cumulativeOffsetDays: 91 },
  { name: 'Août 2026', daysCount: 31, cumulativeOffsetDays: 122 },
  { name: 'Septembre 2026', daysCount: 30, cumulativeOffsetDays: 153 },
  { name: 'Octobre 2026', daysCount: 31, cumulativeOffsetDays: 183 },
  { name: 'Janvier 2026', daysCount: 31, cumulativeOffsetDays: 0 },
  { name: 'Février 2026', daysCount: 28, cumulativeOffsetDays: 31 },
  { name: 'Mars 2026', daysCount: 31, cumulativeOffsetDays: 59 },
];

export function buildContinuousGuard16hActivity(
  team: string,
  rotationOrder: string[] = DEFAULT_GUARD_ROTATION_ORDER,
  cumulativeOffsetDays = 0,
  daysInMonth = 30,
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
 * Create official April 2026 snapshot matching the user's provided PDF documents
 */
export function createApril2026Snapshot(): ObjectBoxDatabaseSnapshot {
  const daysColumns = buildApril2026Days();

  const config: HospitalDocumentConfig = {
    id: 1,
    republicHeader: 'RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE',
    ministryHeader: 'MINISTÈRE DE LA SANTÉ, DE LA POPULATION ET DE LA RÉFORME HOSPITALIÈRE',
    hospitalHeader: "Établissement Hospitalier d'Aïn El Türck - Dr. Medjber Tami",
    unitTitle: 'Unité : Service de Rhumatologie',
    isModificatif: false,
    currentPreset: 'april_2026',
    // PDF 1 (Portrait)
    pdf1Page1Title: "Planning des Médecins « Mois d'Avril 2026 »",
    pdf1Page1Subtitle: 'DE 8H À 16H',
    pdf1Page1Columns: ['Nom et Prénom', 'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'],
    pdf1Page1Obs: 'OBS : Journée de RCP tous les Mardis à 11 h',
    pdf1Page2Title: "La liste du personnel médical du mois d'Avril 2026",
    pdf1Page2Subtitle: 'DE 8H À 16H',
    pdf1Page2Columns: ['Nom et Prénom', 'Fonction', 'O.B.S'],
    pdf1Page3Title: "Planning du Personnel Paramédical du Mois d'Avril 2026",
    pdf1Page3Columns: ['Horaire', 'Nom et Prénom', 'Fonction', 'OBS'],
    pdf1Page3Obs08h16h: '',
    pdf1Page3Obs16h: '',
    pdf1Page3Obs12h: '',
    // PDF 2 (Landscape)
    pdf2Page1Title: "TABLEAU D'ACTIVITÉ DU MOIS D'AVRIL 2026 | 08h–16h — Personnel Médical",
    pdf2Page2Title: "TABLEAU D'ACTIVITÉ DU MOIS D'AVRIL 2026 | 08h–16h",
    pdf2Page3Title: "TABLEAU D'ACTIVITÉ DU MOIS D'AVRIL 2026 | 16h",
    pdf2Page5Title: "TABLEAU D'ACTIVITÉ DU MOIS D'AVRIL 2026 | Agents d'Hygiène — 12h",
    pdf2NameColHeader: 'Nom et Prénom',
    pdf2GradeColHeader: 'Grade',
    pdf2TeamColHeader: 'Équipe',
    cityDatePortrait: 'fait à Aïn el Türck le : 24/03/2026',
    cityDateLandscape: 'Fait à Aïn el Türck le : 24/03/2026',
    legendItems: [
      'G : Garde',
      'RE : Récupération',
      'C : Congé',
      'CM : Congé Maladie',
      'N : Normal',
    ],
    leaveTypes: [...DEFAULT_LEAVE_TYPES],
    guardRotationOrder: ['A', 'B', 'C', 'D'],
    guardMonthName: 'Avril 2026',
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

  // Helper for normal 08h-16h schedule in April 2026 (days 3,4, 10,11, 17,18, 24,25 are VEN/SAM RE)
  const buildAprilNormal = (): Record<number, string> => {
    const act: Record<number, string> = {};
    for (let d = 1; d <= 30; d++) {
      act[d] = d === 3 || d === 4 || d === 10 || d === 11 || d === 17 || d === 18 || d === 24 || d === 25 ? 'RE' : 'N';
    }
    return act;
  };

  const staffBox: StaffEntity[] = [
    // ======================== 1. PERSONNEL MÉDICAL (6 Doctors) ========================
    {
      id: 1,
      fullName: 'Medjadi Mohsine',
      category: 'medical',
      rolePortrait: 'Médecin Chef Rhumatologue',
      gradeLandscape: 'Médecin Chef Rhumatologue',
      obsPortrait: 'Médecin Chef',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 1,
      landscapeOrder: 1,
      weeklySchedule: {
        dimanche: 'Service Biothérapie',
        lundi: 'DMO',
        mardi: 'Visite Générale',
        mercredi: 'Consultation E.P.S.P\nBen Smir',
        jeudi: 'Journée Pédagogique',
      },
      dailyActivity: buildAprilNormal(),
    },
    {
      id: 2,
      fullName: 'Ouadah Souad',
      category: 'medical',
      rolePortrait: 'Médecin Principal en Rhumatologie',
      gradeLandscape: 'Médecin Principal en Rhumatologie',
      obsPortrait: '08h-16h',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 2,
      landscapeOrder: 2,
      weeklySchedule: {
        dimanche: 'Journée Pédagogique',
        lundi: 'Consultation E.P.S.P\nMers El Kebir',
        mardi: 'Visite Générale',
        mercredi: 'DMO',
        jeudi: 'Service Biothérapie',
      },
      dailyActivity: buildAprilNormal(),
    },
    {
      id: 3,
      fullName: 'Bouziane Kheira',
      category: 'medical',
      rolePortrait: 'Médecin Principal en Rhumatologie',
      gradeLandscape: 'Médecin Principal en Rhumatologie',
      obsPortrait: 'Congé (29/03 - 22/04)',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 3,
      landscapeOrder: 3,
      weeklySchedule: {
        dimanche: 'Consultation E.P.S.P\nBen Smir',
        lundi: 'Journée Pédagogique',
        mardi: 'Visite Générale',
        mercredi: 'Service',
        jeudi: 'DMO',
      },
      dailyActivity: (() => {
        const act = buildAprilNormal();
        for (let d = 1; d <= 22; d++) act[d] = 'C';
        return act;
      })(),
    },
    {
      id: 4,
      fullName: 'Tlemsani Naziha',
      category: 'medical',
      rolePortrait: 'Médecin Généraliste Principale',
      gradeLandscape: 'Médecin Généraliste Principale',
      obsPortrait: 'Congé (24/03 - 07/04)',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 4,
      landscapeOrder: 4,
      weeklySchedule: {
        dimanche: 'Service',
        lundi: 'Service',
        mardi: 'Consultation E.P.S.P\nBen Smir',
        mercredi: 'Service',
        jeudi: 'Service',
      },
      dailyActivity: (() => {
        const act = buildAprilNormal();
        for (let d = 1; d <= 7; d++) act[d] = 'C';
        return act;
      })(),
    },
    {
      id: 5,
      fullName: 'Boumazouzi Hind',
      category: 'medical',
      rolePortrait: 'Médecin Généraliste Principale',
      gradeLandscape: 'Médecin Généraliste Principale',
      obsPortrait: 'Congé (26/03 - 05/04)',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 5,
      landscapeOrder: 5,
      weeklySchedule: {
        dimanche: 'Service',
        lundi: 'Service',
        mardi: 'Visite Générale',
        mercredi: 'Service',
        jeudi: 'Consultation E.P.S.P\nBen Smir',
      },
      dailyActivity: (() => {
        const act = buildAprilNormal();
        for (let d = 1; d <= 5; d++) act[d] = 'C';
        return act;
      })(),
    },
    {
      id: 6,
      fullName: 'Benrahal Yasmina',
      category: 'medical',
      rolePortrait: 'Médecin Généraliste',
      gradeLandscape: 'Médecin Généraliste',
      obsPortrait: 'Congé (06/04 - 12/04)',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 6,
      landscapeOrder: 6,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: (() => {
        const act = buildAprilNormal();
        for (let d = 6; d <= 12; d++) act[d] = 'C';
        return act;
      })(),
    },

    // ======================== 2. PARAMÉDICAL 08h-16h (9 Staff) ========================
    {
      id: 7,
      fullName: 'Kerarma Djelloul',
      category: 'paramedical_day',
      rolePortrait: 'I.SSP Surveillant Médical',
      gradeLandscape: 'I.SSP Surveillant Médical',
      obsPortrait: 'Surveillant Médical',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 1,
      landscapeOrder: 1,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildAprilNormal(),
    },
    {
      id: 8,
      fullName: 'Meddah Fadela',
      category: 'paramedical_day',
      rolePortrait: 'Psychologue',
      gradeLandscape: 'Psychologue',
      obsPortrait: 'Congé (24/03 - 02/04)',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 2,
      landscapeOrder: 2,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: (() => {
        const act = buildAprilNormal();
        act[1] = 'C';
        act[2] = 'C';
        return act;
      })(),
    },
    {
      id: 9,
      fullName: 'Bouaziz Nacer',
      category: 'paramedical_day',
      rolePortrait: 'ATS principal',
      gradeLandscape: 'ATS principal',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 3,
      landscapeOrder: 7,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildAprilNormal(),
    },
    {
      id: 10,
      fullName: 'Rahmani Ibtissem',
      category: 'paramedical_day',
      rolePortrait: 'ATS principal',
      gradeLandscape: 'ATS principal',
      obsPortrait: 'Congé (23/03 - 06/04)',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 4,
      landscapeOrder: 8,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: (() => {
        const act = buildAprilNormal();
        for (let d = 1; d <= 6; d++) act[d] = 'C';
        return act;
      })(),
    },
    {
      id: 11,
      fullName: 'Kassab Hichem',
      category: 'paramedical_day',
      rolePortrait: 'ATS principal',
      gradeLandscape: 'ATS principal',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 5,
      landscapeOrder: 9,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildAprilNormal(),
    },
    {
      id: 12,
      fullName: 'Behloul Zahra',
      category: 'paramedical_day',
      rolePortrait: 'Administrateur',
      gradeLandscape: 'Administrateur',
      obsPortrait: 'Chargée de DMO',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 6,
      landscapeOrder: 3,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildAprilNormal(),
    },
    {
      id: 13,
      fullName: 'Naamoun Sarra',
      category: 'paramedical_day',
      rolePortrait: 'Chargée de pharmacie',
      gradeLandscape: 'Chargée de pharmacie',
      obsPortrait: 'Congé (15/03 - 02/04)',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 7,
      landscapeOrder: 6,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: (() => {
        const act = buildAprilNormal();
        act[1] = 'C';
        act[2] = 'C';
        return act;
      })(),
    },
    {
      id: 14,
      fullName: 'Zalegh Fatima',
      category: 'paramedical_day',
      rolePortrait: 'Agent de bureau',
      gradeLandscape: 'Agent de bureau',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 8,
      landscapeOrder: 4,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildAprilNormal(),
    },
    {
      id: 15,
      fullName: 'Baoud Kholoud',
      category: 'paramedical_day',
      rolePortrait: 'Agent de bureau',
      gradeLandscape: 'Agent de bureau',
      obsPortrait: 'Congé (23/03 - 11/04)',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 9,
      landscapeOrder: 5,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: (() => {
        const act = buildAprilNormal();
        for (let d = 1; d <= 11; d++) act[d] = 'C';
        return act;
      })(),
    },

    // ======================== 3. PARAMÉDICAL GARDE 16h (15 Staff · Groupes A-D) ========================
    // Groupe A
    {
      id: 16,
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
      dailyActivity: (() => {
        // Team A: Garde on 1, 5, 9, 13, 17, 21, 25, 29; else RE
        const act: Record<number, string> = {};
        for (let d = 1; d <= 30; d++) {
          act[d] = (d - 1) % 4 === 0 ? 'G' : 'RE';
        }
        return act;
      })(),
    },
    {
      id: 17,
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
      dailyActivity: (() => {
        // Team A: Garde on 1, 5, 9, 13, 17, 21, 25, 29; else RE
        const act: Record<number, string> = {};
        for (let d = 1; d <= 30; d++) {
          act[d] = (d - 1) % 4 === 0 ? 'G' : 'RE';
        }
        return act;
      })(),
    },
    {
      id: 18,
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
      dailyActivity: (() => {
        const act: Record<number, string> = {};
        for (let d = 1; d <= 30; d++) {
          act[d] = (d - 1) % 4 === 0 ? 'G' : 'RE';
        }
        return act;
      })(),
    },
    {
      id: 19,
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
      dailyActivity: (() => {
        const act: Record<number, string> = {};
        for (let d = 1; d <= 30; d++) {
          act[d] = (d - 1) % 4 === 0 ? 'G' : 'RE';
        }
        act[29] = 'C';
        act[30] = 'C';
        return act;
      })(),
    },

    // Groupe B
    {
      id: 20,
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
      dailyActivity: (() => {
        const act: Record<number, string> = {};
        // Team B: Garde on 2, 6, 10, 14, 18, 22, 26, 30
        for (let d = 1; d <= 30; d++) {
          act[d] = (d - 2) % 4 === 0 ? 'G' : 'RE';
        }
        for (let d = 1; d <= 10; d++) act[d] = 'C';
        return act;
      })(),
    },
    {
      id: 21,
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
      dailyActivity: (() => {
        const act: Record<number, string> = {};
        for (let d = 1; d <= 30; d++) {
          act[d] = (d - 2) % 4 === 0 ? 'G' : 'RE';
        }
        return act;
      })(),
    },
    {
      id: 22,
      fullName: 'Ait Menguellat Lilia',
      category: 'paramedical_guard',
      rolePortrait: 'ATS principal',
      gradeLandscape: 'ATS principal',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'B',
      portraitOrder: 7,
      landscapeOrder: 7,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: (() => {
        const act: Record<number, string> = {};
        for (let d = 1; d <= 30; d++) {
          act[d] = (d - 2) % 4 === 0 ? 'G' : 'RE';
        }
        return act;
      })(),
    },

    // Groupe C
    {
      id: 23,
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
      dailyActivity: (() => {
        const act: Record<number, string> = {};
        // Team C: Garde on 3, 7, 11, 15, 19, 23, 27
        for (let d = 1; d <= 30; d++) {
          act[d] = (d - 3) % 4 === 0 ? 'G' : 'RE';
        }
        for (let d = 1; d <= 20; d++) act[d] = 'C';
        return act;
      })(),
    },
    {
      id: 24,
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
      dailyActivity: (() => {
        const act: Record<number, string> = {};
        for (let d = 1; d <= 30; d++) {
          act[d] = (d - 3) % 4 === 0 ? 'G' : 'RE';
        }
        return act;
      })(),
    },
    {
      id: 25,
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
      dailyActivity: (() => {
        const act: Record<number, string> = {};
        for (let d = 1; d <= 30; d++) {
          act[d] = (d - 3) % 4 === 0 ? 'G' : 'RE';
        }
        return act;
      })(),
    },
    {
      id: 26,
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
      dailyActivity: (() => {
        const act: Record<number, string> = {};
        for (let d = 1; d <= 30; d++) {
          act[d] = (d - 3) % 4 === 0 ? 'G' : 'RE';
        }
        return act;
      })(),
    },

    // Groupe D
    {
      id: 27,
      fullName: 'Hamdi Souad',
      category: 'paramedical_guard',
      rolePortrait: 'IDE',
      gradeLandscape: 'IDE',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'D',
      portraitOrder: 12,
      landscapeOrder: 13,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: (() => {
        const act: Record<number, string> = {};
        // Team D: Garde on 4, 8, 12, 16, 20, 24, 28
        for (let d = 1; d <= 30; d++) {
          act[d] = (d - 4) % 4 === 0 ? 'G' : 'RE';
        }
        return act;
      })(),
    },
    {
      id: 28,
      fullName: 'Guerle Mohamed Yacine',
      category: 'paramedical_guard',
      rolePortrait: 'ATS',
      gradeLandscape: 'ATS',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: 'D',
      portraitOrder: 13,
      landscapeOrder: 14,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: (() => {
        const act: Record<number, string> = {};
        for (let d = 1; d <= 30; d++) {
          act[d] = (d - 4) % 4 === 0 ? 'G' : 'RE';
        }
        return act;
      })(),
    },
    {
      id: 29,
      fullName: 'Moussa Hadjar',
      category: 'paramedical_guard',
      rolePortrait: 'ATS principal',
      gradeLandscape: 'ATS principal',
      obsPortrait: 'Congé (25/03 - 10/04)',
      horaireBlock: '16h',
      teamGroup: 'D',
      portraitOrder: 14,
      landscapeOrder: 12,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: (() => {
        const act: Record<number, string> = {};
        for (let d = 1; d <= 30; d++) {
          act[d] = (d - 4) % 4 === 0 ? 'G' : 'RE';
        }
        for (let d = 1; d <= 10; d++) act[d] = 'C';
        return act;
      })(),
    },
    {
      id: 30,
      fullName: 'Isselma Mohamed Nabi',
      category: 'paramedical_guard',
      rolePortrait: 'ATS',
      gradeLandscape: 'ATS',
      obsPortrait: 'Congé (24/03 - 17/04)',
      horaireBlock: '16h',
      teamGroup: 'D',
      portraitOrder: 15,
      landscapeOrder: 15,
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: (() => {
        const act: Record<number, string> = {};
        for (let d = 1; d <= 30; d++) {
          act[d] = (d - 4) % 4 === 0 ? 'G' : 'RE';
        }
        for (let d = 1; d <= 17; d++) act[d] = 'C';
        return act;
      })(),
    },

    // ======================== 4. AGENTS D'HYGIÈNE 12h (2 Staff) ========================
    {
      id: 31,
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
      dailyActivity: buildHygiene12hActivity(true, 30),
    },
    {
      id: 32,
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
      dailyActivity: buildHygiene12hActivity(false, 30),
    },
  ];

  return {
    version: 4,
    updatedAt: new Date().toISOString(),
    config,
    staffBox,
  };
}

/**
 * Create January 2026 (Modificatif) snapshot matching Planning_janvier_2026_11h52m21s465.pdf
 */
export function createJanuary2026Snapshot(): ObjectBoxDatabaseSnapshot {
  const base = createApril2026Snapshot();
  const daysColumns = buildJanuary2026Days();

  base.config.guardMonthName = 'Janvier 2026';
  base.config.isModificatif = true;
  base.config.currentPreset = 'january_2026';
  base.config.daysColumns = daysColumns;
  base.config.cityDateLandscape = 'Fait à Aïn el Türck le : 15/01/2026';
  base.config.cityDatePortrait = 'fait à Aïn el Türck le : 15/01/2026';
  base.config.pdf1Page1Title = 'Planning des Médecins « Mois de Janvier 2026 » (Modificatif)';
  base.config.pdf1Page2Title = 'La liste du personnel médical du mois de Janvier 2026 (Modificatif)';
  base.config.pdf1Page3Title = 'Planning du Personnel Paramédical du Mois de Janvier 2026 (Modificatif)';
  base.config.pdf2Page1Title = "TABLEAU D'ACTIVITÉ DU MOIS DE JANVIER 2026 (Modificatif) | 08h–16h — Personnel Médical";
  base.config.pdf2Page2Title = "TABLEAU D'ACTIVITÉ DU MOIS DE JANVIER 2026 (Modificatif) | 08h–16h";
  base.config.pdf2Page3Title = "TABLEAU D'ACTIVITÉ DU MOIS DE JANVIER 2026 (Modificatif) 16h";
  base.config.pdf2Page5Title = "TABLEAU D'ACTIVITÉ DU MOIS DE JANVIER 2026 (Modificatif) Agents d'Hygiène — 12h";

  // In January 2026, Bakhouche Sarra has maternity leave for all 31 days (since 25/11/2025 to 26/04/2026 covers all January)
  base.staffBox = base.staffBox.map((s) => {
    if (s.fullName.toLowerCase().includes('bakhouche')) {
      const act: Record<number, string> = {};
      for (let d = 1; d <= 31; d++) act[d] = 'Congé de Maternité';
      return {
        ...s,
        maternityLeave: {
          startDay: 1,
          endDay: 31,
          label: 'Congé de Maternité',
          datesText: '25/11/2025 au 26/04/2026',
        },
        dailyActivity: act,
      };
    }
    return s;
  });

  return base;
}

export function createInitialSeedSnapshot(): ObjectBoxDatabaseSnapshot {
  return createApril2026Snapshot();
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

  applyContinuousGuardRotation(
    rotationOrder: string[] = ['A', 'B', 'C', 'D'],
    cumulativeOffsetDays = 0,
    daysInMonth = 30,
    includeBouazizOverride = false,
    periodRange?: { startDay: number; endDay: number } | null
  ): void {
    const nextStaff = this.snapshot.staffBox.map((staff) => {
      if (staff.category !== 'paramedical_guard' || !staff.teamGroup) {
        return staff;
      }

      // If staff has active maternity leave, preserve maternity leave days
      const matSpan = getStaffMaternitySpan(staff, this.snapshot.config.daysColumns);

      const teamIdx = rotationOrder.indexOf(staff.teamGroup);
      const newActivity = { ...staff.dailyActivity };

      const start = periodRange ? periodRange.startDay : 1;
      const end = periodRange ? periodRange.endDay : daysInMonth;

      for (let d = start; d <= end; d++) {
        if (matSpan && d >= matSpan.startDay && d <= matSpan.endDay) {
          newActivity[d] = matSpan.label || 'Congé de Maternité';
          continue;
        }
        if (teamIdx !== -1) {
          const isGuard = (d - 1 + cumulativeOffsetDays - teamIdx) % rotationOrder.length === 0;
          newActivity[d] = isGuard ? 'G' : 'RE';
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
    this.snapshot = createApril2026Snapshot();
    this.notify();
  }

  loadAprilPreset(): void {
    this.snapshot = createApril2026Snapshot();
    this.notify();
  }

  loadJanuaryPreset(): void {
    this.snapshot = createJanuary2026Snapshot();
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
