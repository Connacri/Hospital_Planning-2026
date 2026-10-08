# E.H. Aïn El Türck — Gestion des Plannings & Tableaux d'Activité

> **Établissement Hospitalier d'Aïn El Türck (Wilaya d'Oran)**  
> **Service de Rhumatologie — Chef de Service : Dr. Medjber Tami**  
> Système complet d'édition, gestion, persistance locale (ObjectBox Store v4) et impression officielle des plannings médicaux, paramédicaux et tableaux d'activité mensuels.

---

## 📋 Fonctionnalités Principales

1. **Formats A4 Physiques Stricts (21 cm × 29.7 cm)** :
   - Marges de **1.27 cm (12.7 mm)** strictement appliquées des 4 côtés (Gauche, Droite, Haut, Bas) dans toutes les orientations.
   - Respect absolu de la mise en page d'impression officielle sans décalage.
   - Prise en charge des orientations **Portrait (A4 Vertical)** et **Paysage (A4 Horizontal)**.

2. **Affichage Écran Pleine Page & Zoom Interactif** :
   - Bouton **Page Entière** : ajuste automatiquement la vue pour afficher 100% de la feuille A4 verticale de haut en bas sans coupure.
   - Bouton **Largeur** : affiche instantanément les 30 ou 31 jours du tableau d'activité sans tronquer les colonnes.
   - Contrôles de zoom réactifs : `50%`, `60%`, `75%`, `100%`, `125%`, `150%` ou incréments personnalisés.
   - Compatible smartphones, tablettes et ordinateurs de bureau.

3. **Plannings & Tableaux Médicaux / Paramédicaux** :
   - **PDF 1 (Portrait)** :
     - Page 1 : Planning des Médecins (Horaires hebdomadaires dimanche–jeudi).
     - Page 2 : Liste nominative du personnel médical avec fonctions et observations.
     - Page 3 : Planning du Personnel Paramédical (08h–16h, Gardes 24h/16h Groupes A–E, Agents d'hygiène 12h) avec gestion directe de la colonne OBS sans ligne parasite et note N.B. intégrée sous le tableau.
   - **PDF 2 (Paysage)** :
     - Page 1 : Tableau d'activité 08h–16h Personnel Médical (Jours 1..31).
     - Page 2 : Tableau d'activité 08h–16h Personnel Paramédical.
     - Page 3 : Tableau d'activité 16h / 24h Équipes A–E (Garde paramédicale).
     - Page 4 : Tableau d'activité 12h Agents d'hygiène.

4. **Gestion Avancée des Équipes & Congés** :
   - Modal de congé de maternité avec cellule fusionnée (ex. Bakhouche Sarra, J1–J26).
   - Gestionnaire complet des types de congés et observations (C, CM, M, F, RC, etc.).
   - Moteur de rotation automatique des équipes (mensuel ou perpétuel).
   - Sélecteur de pinceau de couleur pour colorier rapidement les cellules de garde.

---

## 🚀 GitHub Actions CI/CD Pipeline

Ce dépôt contient un pipeline d'automatisation complet `.github/workflows/ci-cd-build-and-release.yml` qui produit automatiquement :

1. **Android Signed APK & AAB** :
   - Compilation avec le SDK Android et Gradle.
   - Signature numérique automatique avec les variables secrètes GitHub (`ANDROID_KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`).
   - Génération de `EH_AinElTurck_Plannings_v1.0.0_signed.apk` et `EH_AinElTurck_Plannings_v1.0.0_signed.aab`.

2. **Windows Installer EXE (Inno Setup)** :
   - Compilation sous environnement Windows natif GitHub Actions.
   - Génération de l'exécutable d'installation autonome `EH_AinElTurck_Plannings_Setup_v1.0.0.exe` via Inno Setup 6.

3. **Déploiement Web Automatique** :
   - Déploiement direct de l'application web responsive sur GitHub Pages.

4. **Publication GitHub Release** :
   - Regroupement des artefacts (APK, AAB, EXE), calcul des sommes de contrôle SHA256 (`SHA256SUMS.txt`), et publication automatique de la Release.

---

## 🛠️ Instructions pour les Secrets GitHub

Dans les paramètres de votre dépôt GitHub (**Settings** > **Secrets and variables** > **Actions**) :

| Variable Secrète | Description |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Votre fichier Keystore encodé en base64 (`base64 -w 0 release.jks`) |
| `KEYSTORE_PASSWORD` | Mot de passe de votre Keystore de production |
| `KEY_ALIAS` | Alias de la clé de signature (ex: `hospital_key`) |
| `KEY_PASSWORD` | Mot de passe de la clé de signature |

---

## 💻 Développement & Utilisation Locale

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement local
npm run dev

# Tester la compilation TypeScript et le build de production
npm run lint
npm run build
```

---

## 🏥 Direction & Validation
- **Établissement** : Établissement Hospitalier d'Aïn El Türck (Wilaya d'Oran)
- **Service** : Rhumatologie
- **Chef de Service** : Dr. Medjber Tami
- **Année de référence** : 2026
