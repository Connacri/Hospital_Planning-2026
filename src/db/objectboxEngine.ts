/**
 * ObjectBox Local Reactive Database Engine (Web IndexedDB/LocalStorage + Dart ObjectBox Parity)
 * Supports @Entity, @Id, @Index, Box<T>, QueryBuilder with .offset() and .limit() pagination,
 * and instant persistence for all PDF tables, headers, staff members, and 31-day schedules.
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

export interface StaffEntity {
  id: number; // @Id() in ObjectBox
  fullName: string; // @Index()
  category: StaffCategory; // @Index()
  rolePortrait: string; // Fonction in PDF 1 (e.g. "Médecin Chef Rhumatologue")
  gradeLandscape: string; // Grade in PDF 2 (e.g. "Médecin Chef")
  obsPortrait: string; // O.B.S in PDF 1 Page 2 (e.g. "08h-16h")
  horaireBlock: string; // "08h-16h" | "16h" | "12h"
  teamGroup: string; // "" | "A" | "B" | "C" | "D" | "E"
  portraitOrder: number; // @Index()
  landscapeOrder: number; // @Index()
  weeklySchedule: DoctorWeeklySchedule; // Used on PDF 1 Page 1 for doctors
  dailyActivity: Record<number, string>; // Days 1..31 -> "N" | "RE" | "Jour" | "Nuit" | "C" | "CM" | "M" | "F"
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

const STORAGE_KEY = 'eh_ain_el_turck_objectbox_store_v2';

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
 * Standard 08h-16h schedule: N on Dim-Jeu, RE on Ven-Sam (days 2,3, 9,10, 16,17, 23,24, 30,31)
 */
export function buildStandard08h16hActivity(): Record<number, string> {
  const map: Record<number, string> = {};
  for (let d = 1; d <= 31; d++) {
    const dow = FRENCH_DOW_OCT_2026[(d - 1) % 7];
    map[d] = dow === 'VEN' || dow === 'SAM' ? 'RE' : 'N';
  }
  return map;
}

/**
 * Ordre officiel de rotation des équipes de garde (16h) prenant le poste de « Jour » :
 * - Jour 1 : Équipe A
 * - Jour 2 : Équipe D
 * - Jour 3 : Équipe B
 * - Jour 4 : Équipe E
 * - Jour 5 : Équipe C
 * Puis la boucle continue indéfiniment : A ➔ D ➔ B ➔ E ➔ C ➔ A ➔ D ...
 */
export const DEFAULT_GUARD_ROTATION_ORDER = ['A', 'D', 'B', 'E', 'C'];

export interface GuardMonthInfo {
  name: string;
  daysCount: number;
  cumulativeOffsetDays: number;
}

export const GUARD_MONTHS_PRESETS: GuardMonthInfo[] = [
  { name: 'Octobre 2026', daysCount: 31, cumulativeOffsetDays: 0 },
  { name: 'Novembre 2026', daysCount: 30, cumulativeOffsetDays: 31 },
  { name: 'Décembre 2026', daysCount: 31, cumulativeOffsetDays: 61 },
  { name: 'Janvier 2027', daysCount: 31, cumulativeOffsetDays: 92 },
  { name: 'Février 2027', daysCount: 28, cumulativeOffsetDays: 123 },
  { name: 'Mars 2027', daysCount: 31, cumulativeOffsetDays: 151 },
];

/**
 * Calcul de la rotation continue des équipes de garde (16h) :
 * - Garde continue sans rupture dans les mois suivants
 * - Ne modifie pas l'ordre des agents ni des équipes dans la liste du personnel
 * - L'utilisateur peut modifier l'ordre de passage (rotationOrder) à tout moment
 */
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
    // Index continu de jour : (d - 1 + cumulativeOffsetDays)
    const absoluteDay = d - 1 + cumulativeOffsetDays;
    // Quand absoluteDay % 5 === teamIndex, l'équipe est de Jour (phase 0), le lendemain Nuit (phase 1), puis 3x RE
    const phase = ((absoluteDay - teamIndex) % 5 + 5) % 5;
    map[d] = cycle[phase];
  }

  // Fidélité exacte au tableau officiel d'octobre 2026 : Bouaziz Nacer a RE les 9 et 10 oct
  if (specialBouazizOverride && cumulativeOffsetDays === 0) {
    map[9] = 'RE';
    map[10] = 'RE';
  }

  return map;
}

/**
 * 5-day Guard Team Rotation (16h) for Teams A, B, C, D, E (Mois de base Octobre 2026):
 * Cycle of 5 states: ['Jour', 'Nuit', 'RE', 'RE', 'RE']
 */
export function buildGuard16hActivity(team: string, specialBouazizOverride = false): Record<number, string> {
  return buildContinuousGuard16hActivity(
    team,
    DEFAULT_GUARD_ROTATION_ORDER,
    0,
    31,
    specialBouazizOverride
  );
}

/**
 * 12h Hygiene Agents alternating schedule:
 * - startWithRE = true (Mohand Fatiha): Odd days = RE, Even days = N
 * - startWithRE = false (Touati Fatima): Odd days = N, Even days = RE
 */
export function buildHygiene12hActivity(startWithRE: boolean): Record<number, string> {
  const map: Record<number, string> = {};
  for (let d = 1; d <= 31; d++) {
    const isOdd = d % 2 === 1;
    if (startWithRE) {
      map[d] = isOdd ? 'RE' : 'N';
    } else {
      map[d] = isOdd ? 'N' : 'RE';
    }
  }
  return map;
}

export const DEFAULT_LEAVE_TYPES: LeaveTypeItem[] = [
  { id: 'jour', code: 'Jour', label: 'Garde de Jour (16h)', isSystem: true, color: '#0284c7' },
  { id: 'nuit', code: 'Nuit', label: 'Garde de Nuit (16h)', isSystem: true, color: '#4338ca' },
  { id: 're', code: 'RE', label: 'Récupération', isSystem: true, color: '#059669' },
  { id: 'c', code: 'C', label: 'Congé', isSystem: false, color: '#d97706' },
  { id: 'cm', code: 'CM', label: 'Congé Maladie', isSystem: false, color: '#e11d48' },
  { id: 'm', code: 'M', label: 'Maternité', isSystem: false, color: '#9333ea' },
  { id: 'n', code: 'N', label: 'Normal', isSystem: true, color: '#475569' },
  { id: 'f', code: 'F', label: 'Jour Férié', isSystem: false, color: '#0d9488' },
];

export function buildLegendFromLeaveTypes(leaveTypes: LeaveTypeItem[]): string[] {
  return leaveTypes.map((item) => {
    if (item.code === 'Jour' || item.code === 'Nuit') return item.code;
    return `${item.code} : ${item.label}`;
  });
}

export function createInitialSeedSnapshot(): ObjectBoxDatabaseSnapshot {
  const config: HospitalDocumentConfig = {
    id: 1,
    republicHeader: 'RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE',
    ministryHeader: 'MINISTÈRE DE LA SANTÉ, DE LA POPULATION ET DE LA RÉFORME HOSPITALIÈRE',
    hospitalHeader: "Établissement Hospitalier d'Aïn El Türck - Dr. Medjber Tami",
    unitTitle: 'Unité : Service de Rhumatologie',
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
    pdf2Page1Title: "TABLEAU D'ACTIVITÉ DU MOIS D'OCTOBRE 2026 | 08h–16h — Personnel Médical",
    pdf2Page2Title: "TABLEAU D'ACTIVITÉ DU MOIS D'OCTOBRE 2026 | 08h–16h",
    pdf2Page3Title: "TABLEAU D'ACTIVITÉ DU MOIS D'OCTOBRE 2026 | 16h",
    pdf2Page5Title: "TABLEAU D'ACTIVITÉ DU MOIS D'OCTOBRE 2026 | Agents d'Hygiène — 12h",
    pdf2NameColHeader: 'Nom et Prénom',
    pdf2GradeColHeader: 'Grade',
    pdf2TeamColHeader: 'Équipe',
    cityDatePortrait: 'fait à Aïn el Türck le : 26/09/2026',
    cityDateLandscape: 'Fait à Aïn el Türck le : 26/09/2026',
    legendItems: buildLegendFromLeaveTypes(DEFAULT_LEAVE_TYPES),
    leaveTypes: [...DEFAULT_LEAVE_TYPES],
    guardRotationOrder: [...DEFAULT_GUARD_ROTATION_ORDER],
    guardMonthName: 'Octobre 2026',
    guardMonthOffsetDays: 0,
    nbNotice: "N.B : Toutes modifications de programme ne doivent se faire qu'après accord de la direction",
    signaturesPortrait: ['Le Médecin chef', 'Le Surveillant Médical', 'DAPM', 'Le Directeur Général'],
    signaturesLandscape: ['Le Médecin Chef', 'Le Surveillant Médical', 'DAPM', 'Le Directeur Général'],
    daysColumns: buildOctober2026Days(),
  };

  const emptyWeekly: DoctorWeeklySchedule = {
    dimanche: 'SERVICE',
    lundi: 'SERVICE',
    mardi: 'SERVICE',
    mercredi: 'SERVICE',
    jeudi: 'SERVICE',
  };

  const staffBox: StaffEntity[] = [
    // ======================== 1. PERSONNEL MÉDICAL (6 Doctors) ========================
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
      dailyActivity: buildStandard08h16hActivity(),
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
      dailyActivity: buildStandard08h16hActivity(),
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
      dailyActivity: buildStandard08h16hActivity(),
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
      dailyActivity: buildStandard08h16hActivity(),
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
      dailyActivity: buildStandard08h16hActivity(),
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
      dailyActivity: buildStandard08h16hActivity(),
    },

    // ======================== 2. PARAMÉDICAL 08h-16h (10 Staff) ========================
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
      dailyActivity: buildStandard08h16hActivity(),
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
      dailyActivity: buildStandard08h16hActivity(),
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
      dailyActivity: buildStandard08h16hActivity(),
    },
    {
      id: 10,
      fullName: 'Zalegh Fatima',
      category: 'paramedical_day',
      rolePortrait: 'Agent de bureau',
      gradeLandscape: 'Agent de bureau',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 4,
      landscapeOrder: 5, // In PDF 2 Page 2, Baoud Kholoud is row 4 and Zalegh Fatima is row 5
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildStandard08h16hActivity(),
    },
    {
      id: 11,
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
      dailyActivity: buildStandard08h16hActivity(),
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
      dailyActivity: buildStandard08h16hActivity(),
    },
    {
      id: 13,
      fullName: 'Rahmani Ibtissem',
      category: 'paramedical_day',
      rolePortrait: 'ATS principal',
      gradeLandscape: 'ATS principal',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: 7,
      landscapeOrder: 8, // In PDF 2 Page 2, Djaziri Cherifa is row 7, Rahmani 8, Kassab 9
      weeklySchedule: { ...emptyWeekly },
      dailyActivity: buildStandard08h16hActivity(),
    },
    {
      id: 14,
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
      dailyActivity: buildStandard08h16hActivity(),
    },
    {
      id: 15,
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
      dailyActivity: buildStandard08h16hActivity(),
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
      dailyActivity: buildStandard08h16hActivity(),
    },

    // ======================== 3. PARAMÉDICAL GARDE 16h (16 Staff · Groupes A-E) ========================
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
      dailyActivity: buildGuard16hActivity('A'),
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
      dailyActivity: buildGuard16hActivity('A'),
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
      dailyActivity: buildGuard16hActivity('A'),
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
      dailyActivity: buildGuard16hActivity('A'),
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
      dailyActivity: buildGuard16hActivity('B'),
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
      dailyActivity: buildGuard16hActivity('B'),
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
      dailyActivity: buildGuard16hActivity('B'),
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
      dailyActivity: buildGuard16hActivity('C'),
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
      dailyActivity: buildGuard16hActivity('C'),
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
      dailyActivity: buildGuard16hActivity('C'),
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
      dailyActivity: buildGuard16hActivity('C'),
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
      dailyActivity: buildGuard16hActivity('D'),
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
      dailyActivity: buildGuard16hActivity('D'),
    },
    // Groupe E (Portrait: Bouaziz Nacer, Isselma Mohamed Nabi, Guerle Mohamed Yacine; Landscape: Guerle, Isselma, Bouaziz)
    {
      id: 30,
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
      dailyActivity: buildGuard16hActivity('E', true),
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
      dailyActivity: buildGuard16hActivity('E'),
    },
    {
      id: 32,
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
      dailyActivity: buildGuard16hActivity('E'),
    },

    // ======================== 4. AGENTS D'HYGIÈNE 12h (2 Staff) ========================
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
      dailyActivity: buildHygiene12hActivity(true),
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
      dailyActivity: buildHygiene12hActivity(false),
    },
  ];

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    config,
    staffBox,
  };
}

/**
 * Paginated Query Builder matching ObjectBox best practices (AGENTS.md §11):
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
    // Run writes asynchronously off the critical UI frame (AGENTS.md §11)
    queueMicrotask(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
      } catch {
        // Ignore quota errors in restricted sandboxes
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
      const isBouaziz = staff.fullName.toLowerCase().includes('bouaziz');
      const newActivity = buildContinuousGuard16hActivity(
        staff.teamGroup,
        rotationOrder,
        cumulativeOffsetDays,
        daysInMonth,
        isBouaziz && includeBouazizOverride
      );

      if (periodRange) {
        // Only update cells within the chosen period range [startDay, endDay]
        const mergedActivity = { ...staff.dailyActivity };
        for (let d = periodRange.startDay; d <= periodRange.endDay; d++) {
          if (newActivity[d]) {
            mergedActivity[d] = newActivity[d];
          }
        }
        return {
          ...staff,
          dailyActivity: mergedActivity,
        };
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
    this.snapshot = createInitialSeedSnapshot();
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
