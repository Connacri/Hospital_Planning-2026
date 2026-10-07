export type SupportedLocale = 'fr' | 'en' | 'ar';

export interface TranslationDictionary {
  appTitle: string;
  appSubtitle: string;
  navDocuments: string;
  navStaffManager: string;
  navObjectBoxStudio: string;
  navFlutterExport: string;
  navLegalPrivacy: string;
  orientationPortrait: string;
  orientationLandscape: string;
  pdf1GroupTitle: string;
  pdf2GroupTitle: string;
  page1DoctorsPlanning: string;
  page2DoctorsList: string;
  page3ParamedicalPlanning: string;
  actPage1Medical: string;
  actPage2ParamedicalDay: string;
  actPage3ParamedicalGuard: string;
  actPage4GuardSignatures: string;
  actPage5Hygiene: string;
  viewAllInGroup: string;
  viewSinglePage: string;
  editModeHint: string;
  paintModeLabel: string;
  paintBrushOff: string;
  printCurrentView: string;
  resetDefaultData: string;
  resetConfirmTitle: string;
  resetConfirmDesc: string;
  confirmBtn: string;
  cancelBtn: string;
  exportJsonBtn: string;
  importJsonBtn: string;
  addStaffMember: string;
  addDoctorRow: string;
  deleteRow: string;
  staffFullName: string;
  staffFunctionTitle: string;
  staffGradeShort: string;
  staffCategory: string;
  staffScheduleBlock: string;
  staffTeamGroup: string;
  staffObs: string;
  catMedical: string;
  catParamedicalDay: string;
  catParamedicalGuard: string;
  catHygiene: string;
  applyCycleBtn: string;
  cycleWorkdayNormal: string;
  cycleGuard5Days: string;
  cycleHygiene12h: string;
  objectBoxStoreStatus: string;
  objectBoxEntitiesCount: string;
  objectBoxQueryOffset: string;
  objectBoxQueryLimit: string;
  objectBoxRunQuery: string;
  flutterCodeTitle: string;
  flutterCodeDesc: string;
  copyCodeBtn: string;
  copiedBadge: string;
  downloadDartFile: string;
  zoomLabel: string;
  fitWidthBtn: string;
  headerConfigTitle: string;
  republicLine: string;
  ministryLine: string;
  hospitalLine: string;
  unitLine: string;
  monthLabel: string;
  cityDateLine: string;
  nbNoticeLine: string;
  sig1Label: string;
  sig2Label: string;
  sig3Label: string;
  sig4Label: string;
  searchPlaceholder: string;
  emptySearchState: string;
  clearSearchBtn: string;
  privacyPolicyTitle: string;
  deleteAccountTitle: string;
  deleteLocalDataNow: string;
  localDataDeletedNotice: string;
  themeLight: string;
  themeDark: string;
  versionLabel: string;
  quickActionsTitle: string;
  modeEdit: string;
  modeReadOnly: string;
  modeReadOnlyDesc: string;
  modeEditDesc: string;
  toastReadOnlyActive: string;
  toastEditActive: string;
}

export const translations: Record<SupportedLocale, TranslationDictionary> = {
  fr: {
    appTitle: "E.H. Aïn El Türck",
    appSubtitle: "Service de Rhumatologie · Plannings & Tableaux d'Activité",
    navDocuments: "Tableaux & PDF (A4)",
    navStaffManager: "Personnel & Équipes",
    navObjectBoxStudio: "Base ObjectBox",
    navFlutterExport: "Architecture Flutter",
    navLegalPrivacy: "Confidentialité & Données",
    orientationPortrait: "Portrait (210 × 297 mm)",
    orientationLandscape: "Paysage (297 × 210 mm)",
    pdf1GroupTitle: "PDF 1 — Plannings & Listes (Portrait)",
    pdf2GroupTitle: "PDF 2 — Tableaux d'Activité 31 Jours (Paysage)",
    page1DoctorsPlanning: "P.1 · Planning des Médecins (8h–16h)",
    page2DoctorsList: "P.2 · Liste du Personnel Médical",
    page3ParamedicalPlanning: "P.3 · Planning Paramédical (Groupes A–E)",
    actPage1Medical: "P.1 · Activité Personnel Médical (08h–16h)",
    actPage2ParamedicalDay: "P.2 · Activité Paramédical Jour (08h–16h)",
    actPage3ParamedicalGuard: "P.3 · Activité Équipes de Garde 16h (A–E)",
    actPage4GuardSignatures: "P.4 · Suite & Signatures (Tableau 16h)",
    actPage5Hygiene: "P.5 · Activité Agents d'Hygiène (12h)",
    viewAllInGroup: "Afficher tout le PDF",
    viewSinglePage: "Page par page",
    editModeHint: "Cliquez sur n'importe quel texte, en-tête, nom ou cellule du tableau pour le modifier directement (sauvegarde instantanée ObjectBox).",
    paintModeLabel: "Pinceau rapide (31 jours) :",
    paintBrushOff: "Édition texte libre",
    printCurrentView: "Imprimer / Exporter PDF",
    resetDefaultData: "Restaurer les PDF originaux",
    resetConfirmTitle: "Restaurer les données initiales d'Octobre 2026 ?",
    resetConfirmDesc: "Toutes vos modifications locales dans ObjectBox seront remplacées par les tableaux exacts des 2 PDF originaux.",
    confirmBtn: "Confirmer la restauration",
    cancelBtn: "Annuler",
    exportJsonBtn: "Exporter JSON",
    importJsonBtn: "Importer JSON",
    addStaffMember: "Ajouter un agent / médecin",
    addDoctorRow: "Ajouter une ligne",
    deleteRow: "Supprimer",
    staffFullName: "Nom et Prénom",
    staffFunctionTitle: "Fonction complète (Portrait)",
    staffGradeShort: "Grade court (Paysage)",
    staffCategory: "Catégorie de tableau",
    staffScheduleBlock: "Horaire",
    staffTeamGroup: "Équipe / Groupe",
    staffObs: "Observation",
    catMedical: "Personnel Médical (08h–16h)",
    catParamedicalDay: "Paramédical Jour (08h–16h)",
    catParamedicalGuard: "Paramédical Garde (16h · Groupes A–E)",
    catHygiene: "Agents d'Hygiène (12h)",
    applyCycleBtn: "Appliquer roulement auto",
    cycleWorkdayNormal: "Semaine N / Ven-Sam RE",
    cycleGuard5Days: "Cycle Garde 16h (J/N/RE/RE/RE)",
    cycleHygiene12h: "Alternance 12h (N / RE)",
    objectBoxStoreStatus: "Moteur ObjectBox Local Actif (IndexedDB + Cache Réactif)",
    objectBoxEntitiesCount: "Entités indexées",
    objectBoxQueryOffset: "Offset (Pagination)",
    objectBoxQueryLimit: "Limit (Taille page)",
    objectBoxRunQuery: "Exécuter requête ObjectBox",
    flutterCodeTitle: "Code Source Complet Flutter + ObjectBox",
    flutterCodeDesc: "Architecture prête pour production avec modèles annotés @Entity(), store ObjectBox paginé, et rendu PDF A4 Portrait/Paysage.",
    copyCodeBtn: "Copier le code Dart",
    copiedBadge: "Copié !",
    downloadDartFile: "Télécharger .dart",
    zoomLabel: "Zoom feuille A4",
    fitWidthBtn: "Ajuster",
    headerConfigTitle: "En-têtes Officiels, Dates & Signataires",
    republicLine: "Ligne République",
    ministryLine: "Ligne Ministère",
    hospitalLine: "Établissement Hospitalier",
    unitLine: "Unité / Service",
    monthLabel: "Mois & Année",
    cityDateLine: "Lieu et date (Fait à...)",
    nbNoticeLine: "Note N.B. de bas de page",
    sig1Label: "Signataire 1",
    sig2Label: "Signataire 2",
    sig3Label: "Signataire 3",
    sig4Label: "Signataire 4",
    searchPlaceholder: "Rechercher un nom, grade, équipe (A–E)...",
    emptySearchState: "Aucun membre du personnel ne correspond à votre recherche.",
    clearSearchBtn: "Réinitialiser le filtre",
    privacyPolicyTitle: "Politique de Confidentialité",
    deleteAccountTitle: "Suppression des Données & Compte",
    deleteLocalDataNow: "Effacer toutes les données locales ObjectBox",
    localDataDeletedNotice: "Les données locales ont été effacées et réinitialisées.",
    themeLight: "Clair",
    themeDark: "Sombre",
    versionLabel: "v1.0.0",
    quickActionsTitle: "Actions Rapides",
    modeEdit: "Mode Édition",
    modeReadOnly: "Lecture seule",
    modeReadOnlyDesc: "Plannings protégés contre les modifications accidentelles",
    modeEditDesc: "Modification directe des textes et cellules autorisée",
    toastReadOnlyActive: "Mode Lecture seule activé — Plannings verrouillés",
    toastEditActive: "Mode Édition activé — Vous pouvez modifier les tableaux"
  },
  en: {
    appTitle: "E.H. Aïn El Türck",
    appSubtitle: "Rheumatology Department · Schedules & Activity Tables",
    navDocuments: "Tables & PDFs (A4)",
    navStaffManager: "Staff & Teams",
    navObjectBoxStudio: "ObjectBox Store",
    navFlutterExport: "Flutter Architecture",
    navLegalPrivacy: "Privacy & Data",
    orientationPortrait: "Portrait (210 × 297 mm)",
    orientationLandscape: "Landscape (297 × 210 mm)",
    pdf1GroupTitle: "PDF 1 — Schedules & Rosters (Portrait)",
    pdf2GroupTitle: "PDF 2 — 31-Day Activity Tables (Landscape)",
    page1DoctorsPlanning: "P.1 · Doctors Schedule (8h–16h)",
    page2DoctorsList: "P.2 · Medical Staff Roster",
    page3ParamedicalPlanning: "P.3 · Paramedical Schedule (Groups A–E)",
    actPage1Medical: "P.1 · Medical Staff Activity (08h–16h)",
    actPage2ParamedicalDay: "P.2 · Day Paramedical Activity (08h–16h)",
    actPage3ParamedicalGuard: "P.3 · 16h Shift Teams Activity (A–E)",
    actPage4GuardSignatures: "P.4 · Overflow & Signatures (16h Table)",
    actPage5Hygiene: "P.5 · Hygiene Agents Activity (12h)",
    viewAllInGroup: "Show All Pages in PDF",
    viewSinglePage: "Single Page View",
    editModeHint: "Click any text, header, staff name, or table cell to edit directly in-place (instant ObjectBox persistence).",
    paintModeLabel: "Quick Paint (31 days):",
    paintBrushOff: "Free text edit",
    printCurrentView: "Print / Export PDF",
    resetDefaultData: "Restore Original PDFs",
    resetConfirmTitle: "Restore October 2026 Original PDF Data?",
    resetConfirmDesc: "All local customizations in ObjectBox will be replaced with the exact tables from the 2 original PDFs.",
    confirmBtn: "Confirm Restore",
    cancelBtn: "Cancel",
    exportJsonBtn: "Export JSON",
    importJsonBtn: "Import JSON",
    addStaffMember: "Add Staff / Doctor",
    addDoctorRow: "Add Row",
    deleteRow: "Delete",
    staffFullName: "Full Name",
    staffFunctionTitle: "Full Role Title (Portrait)",
    staffGradeShort: "Short Grade (Landscape)",
    staffCategory: "Table Category",
    staffScheduleBlock: "Shift Hours",
    staffTeamGroup: "Team / Group",
    staffObs: "Observation",
    catMedical: "Medical Staff (08h–16h)",
    catParamedicalDay: "Day Paramedical (08h–16h)",
    catParamedicalGuard: "Shift Paramedical (16h · Groups A–E)",
    catHygiene: "Hygiene Agents (12h)",
    applyCycleBtn: "Auto-Fill Rotation",
    cycleWorkdayNormal: "Weekday N / Fri-Sat RE",
    cycleGuard5Days: "16h Shift Cycle (Jour/Nuit/RE/RE/RE)",
    cycleHygiene12h: "12h Alternating (N / RE)",
    objectBoxStoreStatus: "Local ObjectBox Engine Active (IndexedDB + Reactive Cache)",
    objectBoxEntitiesCount: "Indexed Entities",
    objectBoxQueryOffset: "Offset (Pagination)",
    objectBoxQueryLimit: "Limit (Page Size)",
    objectBoxRunQuery: "Execute ObjectBox Query",
    flutterCodeTitle: "Complete Flutter + ObjectBox Source Code",
    flutterCodeDesc: "Production-ready architecture with @Entity() models, paginated ObjectBox store, and A4 Portrait/Landscape rendering.",
    copyCodeBtn: "Copy Dart Code",
    copiedBadge: "Copied!",
    downloadDartFile: "Download .dart",
    zoomLabel: "A4 Sheet Zoom",
    fitWidthBtn: "Fit",
    headerConfigTitle: "Official Headers, Dates & Signatories",
    republicLine: "Republic Header",
    ministryLine: "Ministry Header",
    hospitalLine: "Hospital Name",
    unitLine: "Unit / Department",
    monthLabel: "Month & Year",
    cityDateLine: "Location & Date Line",
    nbNoticeLine: "Footer N.B. Notice",
    sig1Label: "Signatory 1",
    sig2Label: "Signatory 2",
    sig3Label: "Signatory 3",
    sig4Label: "Signatory 4",
    searchPlaceholder: "Search by name, grade, team (A–E)...",
    emptySearchState: "No staff members match your search criteria.",
    clearSearchBtn: "Reset Filter",
    privacyPolicyTitle: "Privacy Policy",
    deleteAccountTitle: "Account & Data Deletion",
    deleteLocalDataNow: "Wipe All Local ObjectBox Data",
    localDataDeletedNotice: "All local ObjectBox data has been wiped and reset.",
    themeLight: "Light",
    themeDark: "Dark",
    versionLabel: "v1.0.0",
    quickActionsTitle: "Quick Actions",
    modeEdit: "Edit Mode",
    modeReadOnly: "Read-Only",
    modeReadOnlyDesc: "Schedules protected from accidental changes",
    modeEditDesc: "Direct text and cell editing enabled",
    toastReadOnlyActive: "Read-Only mode enabled — Schedules locked",
    toastEditActive: "Edit mode enabled — You can modify tables"
  },
  ar: {
    appTitle: "المؤسسة الاستشفائية عين الترك",
    appSubtitle: "مصلحة أمراض الروماتيزم · الجداول والتخطيط الشهري",
    navDocuments: "الجداول و PDF (A4)",
    navStaffManager: "الموظفون والفرق",
    navObjectBoxStudio: "قاعدة ObjectBox",
    navFlutterExport: "هندسة Flutter",
    navLegalPrivacy: "الخصوصية والبيانات",
    orientationPortrait: "عمودي (210 × 297 مم)",
    orientationLandscape: "أفقي (297 × 210 مم)",
    pdf1GroupTitle: "ملف PDF 1 — التخطيط والقوائم (عمودي)",
    pdf2GroupTitle: "ملف PDF 2 — جداول النشاط 31 يوماً (أفقي)",
    page1DoctorsPlanning: "ص.1 · تخطيط الأطباء (8سا–16سا)",
    page2DoctorsList: "ص.2 · قائمة السلك الطبي",
    page3ParamedicalPlanning: "ص.3 · تخطيط الشبه الطبي (المجموعات A–E)",
    actPage1Medical: "ص.1 · نشاط السلك الطبي (08سا–16سا)",
    actPage2ParamedicalDay: "ص.2 · نشاط الشبه الطبي النهاري (08سا–16سا)",
    actPage3ParamedicalGuard: "ص.3 · نشاط فرق المناوبة 16سا (A–E)",
    actPage4GuardSignatures: "ص.4 · تتمة وتوقيعات (جدول 16سا)",
    actPage5Hygiene: "ص.5 · نشاط أعوان النظافة (12سا)",
    viewAllInGroup: "عرض كل صفحات PDF",
    viewSinglePage: "صفحة بصفحة",
    editModeHint: "انقر فوق أي نص أو عنوان أو اسم أو خلية في الجدول لتعديلها مباشرة (حفظ فوري في ObjectBox).",
    paintModeLabel: "فرشاة التعديل السريع (31 يوماً):",
    paintBrushOff: "تعديل نصي حر",
    printCurrentView: "طباعة / تصدير PDF",
    resetDefaultData: "استعادة جداول PDF الأصلية",
    resetConfirmTitle: "هل تريد استعادة البيانات الأصلية لشهر أكتوبر 2026؟",
    resetConfirmDesc: "سيتم استبدال جميع التعديلات المحلية بالجداول المطابقة تماماً لملفي PDF الأصليين.",
    confirmBtn: "تأكيد الاستعادة",
    cancelBtn: "إلغاء",
    exportJsonBtn: "تصدير JSON",
    importJsonBtn: "استيراد JSON",
    addStaffMember: "إضافة موظف / طبيب",
    addDoctorRow: "إضافة سطر",
    deleteRow: "حذف",
    staffFullName: "الاسم واللقب",
    staffFunctionTitle: "الوظيفة الكاملة (عمودي)",
    staffGradeShort: "الرتبة المختصرة (أفقي)",
    staffCategory: "فئة الجدول",
    staffScheduleBlock: "التوقيت",
    staffTeamGroup: "الفريق / المجموعة",
    staffObs: "ملاحظات",
    catMedical: "السلك الطبي (08سا–16سا)",
    catParamedicalDay: "الشبه الطبي النهاري (08سا–16سا)",
    catParamedicalGuard: "الشبه الطبي المناوب (16سا · A–E)",
    catHygiene: "أعوان النظافة (12سا)",
    applyCycleBtn: "تطبيق التناوب الآلي",
    cycleWorkdayNormal: "أيام العمل N / جمعة-سبت RE",
    cycleGuard5Days: "دورة المناوبة 16سا (Jour/Nuit/RE/RE/RE)",
    cycleHygiene12h: "تناوب 12سا (N / RE)",
    objectBoxStoreStatus: "محرك ObjectBox المحلي نشط (IndexedDB + ذاكرة تفاعلية)",
    objectBoxEntitiesCount: "الكيانات المفهرسة",
    objectBoxQueryOffset: "البداية (Offset)",
    objectBoxQueryLimit: "الحد الأقصى (Limit)",
    objectBoxRunQuery: "تنفيذ استعلام ObjectBox",
    flutterCodeTitle: "الكود المصدري الكامل لـ Flutter + ObjectBox",
    flutterCodeDesc: "هندسة برمجية متكاملة مع نماذج @Entity() واستعلامات ObjectBox المفهرسة وتوليد ملفات PDF عمودية وأفقية.",
    copyCodeBtn: "نسخ كود Dart",
    copiedBadge: "تم النسخ!",
    downloadDartFile: "تحميل ملف .dart",
    zoomLabel: "تكبير ورقة A4",
    fitWidthBtn: "ملاءمة",
    headerConfigTitle: "الترويسة الرسمية والتواريخ والموقعون",
    republicLine: "سطر الجمهورية",
    ministryLine: "سطر الوزارة",
    hospitalLine: "المؤسسة الاستشفائية",
    unitLine: "الوحدة / المصلحة",
    monthLabel: "الشهر والسنة",
    cityDateLine: "المكان والتاريخ",
    nbNoticeLine: "ملاحظة أسفل الصفحة (N.B.)",
    sig1Label: "الموقع 1",
    sig2Label: "الموقع 2",
    sig3Label: "الموقع 3",
    sig4Label: "الموقع 4",
    searchPlaceholder: "ابحث بالاسم أو الرتبة أو الفريق (A–E)...",
    emptySearchState: "لا يوجد موظف يطابق معايير البحث.",
    clearSearchBtn: "إعادة ضبط الفلتر",
    privacyPolicyTitle: "سياسة الخصوصية",
    deleteAccountTitle: "حذف الحساب والبيانات",
    deleteLocalDataNow: "مسح جميع بيانات ObjectBox المحلية",
    localDataDeletedNotice: "تم مسح جميع البيانات المحلية وإعادة ضبطها.",
    themeLight: "فاتح",
    themeDark: "داكن",
    versionLabel: "v1.0.0",
    quickActionsTitle: "إجراءات سريعة",
    modeEdit: "وضع التعديل",
    modeReadOnly: "قراءة فقط",
    modeReadOnlyDesc: "الجداول محمية من أي تعديل عرضي",
    modeEditDesc: "تعديل مباشر للنصوص والخلايا متاح",
    toastReadOnlyActive: "تم تفعيل وضع القراءة فقط — الجداول مقفلة",
    toastEditActive: "تم تفعيل وضع التعديل — يمكنك تعديل الجداول"
  }
};
