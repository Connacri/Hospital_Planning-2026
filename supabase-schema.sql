-- =====================================================================
-- ÉTABLISSEMENT HOSPITALIER D'AÏN EL TÜRCK — DR. MEDJBER TAMI
-- SERVICE DE RHUMATOLOGIE — SCRIPT COMPLET SUPABASE (POSTGRESQL)
-- Tables, Index, Sécurité RLS, Déclencheurs, Realtime et Données initiales
-- =====================================================================

-- 0. Extensions recommandées
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Fonction automatique pour actualiser updated_at
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 1. TABLE : hospital_config (Configuration singleton des plannings)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.hospital_config (
    id BIGINT PRIMARY KEY DEFAULT 1,
    republic_header TEXT NOT NULL DEFAULT 'RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE',
    ministry_header TEXT NOT NULL DEFAULT 'MINISTÈRE DE LA SANTÉ, DE LA POPULATION ET DE LA RÉFORME HOSPITALIÈRE',
    hospital_header TEXT NOT NULL DEFAULT 'Établissement Hospitalier d''Aïn El Türck - Dr. Medjber Tami',
    unit_title TEXT NOT NULL DEFAULT 'Unité : Service de Rhumatologie',
    guard_month_name TEXT NOT NULL DEFAULT 'Octobre 2026',
    guard_month_offset_days INT NOT NULL DEFAULT 0,
    is_modificatif BOOLEAN NOT NULL DEFAULT false,
    city_date_portrait TEXT NOT NULL DEFAULT 'fait à Aïn el Türck le : 26/09/2026',
    city_date_landscape TEXT NOT NULL DEFAULT 'Fait à Aïn el Türck le : 26/09/2026',
    signatures_portrait JSONB NOT NULL DEFAULT '["Le Médecin chef", "Le Surveillant Médical", "DAPM", "Le Directeur Général"]'::jsonb,
    signatures_landscape JSONB NOT NULL DEFAULT '["Le Médecin Chef", "Le Surveillant Médical", "DAPM", "Le Directeur Général"]'::jsonb,
    legend_items JSONB NOT NULL DEFAULT '["Jour", "Nuit", "RE : Récupération", "C : Congé Annuel", "CM : Congé Maladie", "M : Maternité", "N : Normal", "F : Jour Férié"]'::jsonb,
    leave_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    days_columns JSONB NOT NULL DEFAULT '[]'::jsonb,
    modificatif_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
    table_notes JSONB NOT NULL DEFAULT '{}'::jsonb,
    document_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
    column_widths JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =====================================================================
-- 2. TABLE : staff_members (Personnel médical, paramédical et hygiène)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.staff_members (
    id BIGINT PRIMARY KEY,
    full_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('medical', 'paramedical_day', 'paramedical_guard', 'hygiene')),
    role_portrait TEXT NOT NULL,
    grade_landscape TEXT NOT NULL,
    obs_portrait TEXT DEFAULT '',
    horaire_block TEXT NOT NULL DEFAULT '08h-16h',
    team_group TEXT DEFAULT '',
    portrait_order INT NOT NULL DEFAULT 0,
    landscape_order INT NOT NULL DEFAULT 0,
    weekly_schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
    daily_activity JSONB NOT NULL DEFAULT '{}'::jsonb,
    maternity_leave JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index pour requêtes et tris rapides
CREATE INDEX IF NOT EXISTS idx_staff_category ON public.staff_members (category);
CREATE INDEX IF NOT EXISTS idx_staff_team_group ON public.staff_members (team_group);
CREATE INDEX IF NOT EXISTS idx_staff_portrait_order ON public.staff_members (portrait_order);
CREATE INDEX IF NOT EXISTS idx_staff_landscape_order ON public.staff_members (landscape_order);

-- =====================================================================
-- 3. TABLE : objectbox_sync_snapshots (Archives & Instantanés mensuels)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.objectbox_sync_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_name TEXT NOT NULL,
    version INT NOT NULL DEFAULT 7,
    staff_count INT NOT NULL DEFAULT 0,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_snapshots_month_name ON public.objectbox_sync_snapshots (month_name);
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON public.objectbox_sync_snapshots (created_at DESC);

-- =====================================================================
-- 4. TABLE : staff_leaves (Registre des congés posés)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.staff_leaves (
    id TEXT PRIMARY KEY,
    staff_id BIGINT REFERENCES public.staff_members(id) ON DELETE CASCADE,
    staff_name TEXT NOT NULL,
    category TEXT,
    leave_code TEXT NOT NULL,
    leave_label TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INT NOT NULL DEFAULT 1,
    is_merged_span BOOLEAN NOT NULL DEFAULT false,
    dates_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_leaves_staff_id ON public.staff_leaves (staff_id);
CREATE INDEX IF NOT EXISTS idx_leaves_dates ON public.staff_leaves (start_date, end_date);

-- =====================================================================
-- 5. SÉCURITÉ AU NIVEAU DES LIGNES (ROW LEVEL SECURITY - RLS)
-- Permet l'accès complet en lecture et écriture via la clé publique anon
-- =====================================================================
ALTER TABLE public.hospital_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectbox_sync_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_leaves ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Politiques pour hospital_config
    DROP POLICY IF EXISTS "Public access on hospital_config" ON public.hospital_config;
    CREATE POLICY "Public access on hospital_config" ON public.hospital_config FOR ALL USING (true) WITH CHECK (true);

    -- Politiques pour staff_members
    DROP POLICY IF EXISTS "Public access on staff_members" ON public.staff_members;
    CREATE POLICY "Public access on staff_members" ON public.staff_members FOR ALL USING (true) WITH CHECK (true);

    -- Politiques pour objectbox_sync_snapshots
    DROP POLICY IF EXISTS "Public access on objectbox_sync_snapshots" ON public.objectbox_sync_snapshots;
    CREATE POLICY "Public access on objectbox_sync_snapshots" ON public.objectbox_sync_snapshots FOR ALL USING (true) WITH CHECK (true);

    -- Politiques pour staff_leaves
    DROP POLICY IF EXISTS "Public access on staff_leaves" ON public.staff_leaves;
    CREATE POLICY "Public access on staff_leaves" ON public.staff_leaves FOR ALL USING (true) WITH CHECK (true);
END $$;

-- =====================================================================
-- 6. DÉCLENCHEURS AUTOMATIQUES (AUTO UPDATE TIMESTAMP)
-- =====================================================================
DROP TRIGGER IF EXISTS trigger_update_hospital_config ON public.hospital_config;
CREATE TRIGGER trigger_update_hospital_config
    BEFORE UPDATE ON public.hospital_config
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trigger_update_staff_members ON public.staff_members;
CREATE TRIGGER trigger_update_staff_members
    BEFORE UPDATE ON public.staff_members
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- =====================================================================
-- 7. ACTIVATION TEMPS RÉEL (SUPABASE REALTIME)
-- Permet la synchronisation en direct entre plusieurs écrans de l'hôpital
-- =====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.objectbox_sync_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_leaves;

-- =====================================================================
-- 8. DONNÉES INITIALES (SEED DE DÉMARRAGE — OCTOBRE 2026)
-- Établissement Hospitalier d'Aïn El Türck — Dr. Medjber Tami
-- =====================================================================

INSERT INTO public.hospital_config (
    id, republic_header, ministry_header, hospital_header, unit_title,
    guard_month_name, guard_month_offset_days, is_modificatif,
    city_date_portrait, city_date_landscape
) VALUES (
    1,
    'RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE',
    'MINISTÈRE DE LA SANTÉ, DE LA POPULATION ET DE LA RÉFORME HOSPITALIÈRE',
    'Établissement Hospitalier d''Aïn El Türck - Dr. Medjber Tami',
    'Unité : Service de Rhumatologie',
    'Octobre 2026',
    0,
    false,
    'fait à Aïn el Türck le : 26/09/2026',
    'Fait à Aïn el Türck le : 26/09/2026'
) ON CONFLICT (id) DO UPDATE SET
    guard_month_name = EXCLUDED.guard_month_name,
    updated_at = timezone('utc'::text, now());

-- Insertion des 6 Médecins du Service
INSERT INTO public.staff_members (id, full_name, category, role_portrait, grade_landscape, obs_portrait, horaire_block, team_group, portrait_order, landscape_order, weekly_schedule)
VALUES
(1, 'Medjadi Mohsine', 'medical', 'Médecin Chef Rhumatologue', 'Médecin Chef Rhumatologue', '08h-16h', '08h-16h', '', 1, 1, '{"dimanche":"Service Biothérapie","lundi":"DMO","mardi":"Visite Générale","mercredi":"Consultation\nE.P.S.P BenSmir","jeudi":"Journée\nPédagogique"}'::jsonb),
(2, 'Ouadah Souad', 'medical', 'Médecin Principal en Rhumatologie', 'Médecin Principal en Rhumatologie', '08h-16h', '08h-16h', '', 2, 2, '{"dimanche":"Journée\nPédagogique","lundi":"Consultation\nE.P.S.P Mers El Kebir","mardi":"Visite Générale","mercredi":"DMO","jeudi":"Service Biothérapie"}'::jsonb),
(3, 'Tlemsani Naziha', 'medical', 'Médecin Généraliste Principal', 'Médecin Généraliste', '08h-16h', '08h-16h', '', 3, 3, '{"dimanche":"SERVICE","lundi":"SERVICE","mardi":"Consultation\nE.P.S.P BenSmir","mercredi":"SERVICE","jeudi":"SERVICE"}'::jsonb),
(4, 'Boumazouzi Hind', 'medical', 'Médecin Généraliste Principal', 'Médecin Généraliste', '08h-16h', '08h-16h', '', 4, 4, '{"dimanche":"SERVICE","lundi":"SERVICE","mardi":"Visite Générale","mercredi":"SERVICE","jeudi":"SERVICE"}'::jsonb),
(5, 'Benrahal Yasmina', 'medical', 'Médecin Généraliste', 'Médecin Généraliste', '08h-16h', '08h-16h', '', 5, 5, '{"dimanche":"SERVICE","lundi":"SERVICE","mardi":"SERVICE","mercredi":"SERVICE","jeudi":"SERVICE"}'::jsonb),
(6, 'Chouchelamane Soumia', 'medical', 'Médecin Généraliste', 'Médecin Généraliste', '08h-16h', '08h-16h', '', 6, 6, '{"dimanche":"SERVICE","lundi":"SERVICE","mardi":"SERVICE","mercredi":"SERVICE","jeudi":"SERVICE"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Insertion du Personnel Paramédical Jour (08h-16h)
INSERT INTO public.staff_members (id, full_name, category, role_portrait, grade_landscape, obs_portrait, horaire_block, team_group, portrait_order, landscape_order)
VALUES
(7, 'Kerarma Djelloul', 'paramedical_day', 'I.SSP Surveillant Médical', 'I.SSP Surveillant Médical', '', '08h-16h', '', 1, 1),
(8, 'Meddah Fadela', 'paramedical_day', 'Psychologue', 'Psychologue', '', '08h-16h', '', 2, 2),
(9, 'Behloul Zahra', 'paramedical_day', 'Administrateur', 'Administrateur', '', '08h-16h', '', 3, 3),
(10, 'Baoud Kholoud', 'paramedical_day', 'Agent de bureau', 'Agent de bureau', '', '08h-16h', '', 5, 4),
(11, 'Zalegh Fatima', 'paramedical_day', 'Agent de bureau', 'Agent de bureau', '', '08h-16h', '', 4, 5),
(12, 'Naamoun Sarra', 'paramedical_day', 'Chargée de pharmacie', 'Chargée de pharmacie', '', '08h-16h', '', 6, 6),
(13, 'Djaziri Cherifa', 'paramedical_day', 'Chargé de pharmacie', 'Chargé de pharmacie', '', '08h-16h', '', 9, 7),
(14, 'Rahmani Ibtissem', 'paramedical_day', 'ATS principal', 'ATS principal', '', '08h-16h', '', 7, 8),
(15, 'Kassab Hichem', 'paramedical_day', 'ATS principal', 'ATS principal', '', '08h-16h', '', 8, 9),
(16, 'Hellal Merouane', 'paramedical_day', 'ATS', 'ATS', '', '08h-16h', '', 10, 10)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Insertion du Personnel de Garde 16h (Équipes A, B, C, D, E)
INSERT INTO public.staff_members (id, full_name, category, role_portrait, grade_landscape, obs_portrait, horaire_block, team_group, portrait_order, landscape_order)
VALUES
(17, 'Bakhouche Sarra', 'paramedical_guard', 'ATS', 'ATS', '', '16h', 'A', 1, 1),
(18, 'Boukhatem Fatima', 'paramedical_guard', 'ATS', 'ATS', '', '16h', 'A', 2, 2),
(19, 'Berrabah Khadidja', 'paramedical_guard', 'ATS', 'ATS', '', '16h', 'A', 3, 3),
(20, 'Djilali Nadjia', 'paramedical_guard', 'ATS', 'ATS', '', '16h', 'B', 4, 4),
(21, 'Boutiche Somia', 'paramedical_guard', 'ATS', 'ATS', '', '16h', 'B', 5, 5),
(22, 'Hiadsi Souad', 'paramedical_guard', 'ATS principal', 'ATS principal', '', '16h', 'B', 6, 6),
(23, 'Belhadj kacem fatima', 'paramedical_guard', 'ATS', 'ATS', '', '16h', 'B', 7, 7),
(24, 'Chaabane Abdelhamid', 'paramedical_guard', 'infirmier major', 'infirmier major', '', '16h', 'C', 8, 8),
(25, 'Mahdjoubi Sami', 'paramedical_guard', 'ATS', 'ATS', '', '16h', 'C', 9, 9),
(26, 'Belarbi Mohamed', 'paramedical_guard', 'ATS', 'ATS', '', '16h', 'C', 10, 10),
(27, 'Bouderouez Fatiha', 'paramedical_guard', 'IDE', 'IDE', '', '16h', 'C', 11, 11),
(28, 'Hamdi Souad', 'paramedical_guard', 'IDE', 'IDE', '', '16h', 'D', 12, 12),
(29, 'Ghouali Mokhtaria', 'paramedical_guard', 'ATS', 'ATS', '', '16h', 'D', 13, 13),
(30, 'Bouziane Assia', 'paramedical_guard', 'ATS', 'ATS', '', '16h', 'D', 14, 14),
(31, 'Isselma Mohamed Nabi', 'paramedical_guard', 'ATS', 'ATS', '', '16h', 'E', 15, 15),
(32, 'Bouaziz Nacer', 'paramedical_guard', 'ATS principal', 'ATS principal', '', '16h', 'E', 14, 16)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Insertion des Agents d'Hygiène (12h)
INSERT INTO public.staff_members (id, full_name, category, role_portrait, grade_landscape, obs_portrait, horaire_block, team_group, portrait_order, landscape_order)
VALUES
(33, 'Mohand Fatiha', 'hygiene', 'Agent d''hygiène', 'Agent d''hygiène', '', '12h', '', 1, 1),
(34, 'Touati Fatima', 'hygiene', 'Agent d''hygiène', 'Agent d''hygiène', '', '12h', '', 2, 2)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
