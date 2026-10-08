import React, { useState, useEffect } from 'react';
import {
  Building2,
  X,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Stethoscope,
  Info,
} from 'lucide-react';
import { HospitalDocumentConfig } from '../db/objectboxEngine';

interface ServiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: HospitalDocumentConfig;
  onUpdateConfig: (partial: Partial<HospitalDocumentConfig>) => void;
}

const COMMON_SERVICES = [
  'Unité : Service de Rhumatologie',
  'Unité : Service de Cardiologie',
  'Unité : Service de Médecine Interne',
  'Unité : Service des Urgences Médico-Chirurgicales',
  'Unité : Service de Pédiatrie',
  'Unité : Service de Chirurgie Générale',
  'Unité : Service de Gynécologie-Obstétrique',
  'Unité : Service d\'Anesthésie-Réanimation',
  'Unité : Service d\'Orthopédie-Traumatologie',
  'Unité : Service de Neurologie',
];

export const ServiceSettingsModal: React.FC<ServiceSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [unitTitle, setUnitTitle] = useState(config.unitTitle);
  const [hospitalHeader, setHospitalHeader] = useState(config.hospitalHeader);
  const [ministryHeader, setMinistryHeader] = useState(config.ministryHeader);
  const [republicHeader, setRepublicHeader] = useState(config.republicHeader);

  const [showConfirmApply, setShowConfirmApply] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUnitTitle(config.unitTitle);
      setHospitalHeader(config.hospitalHeader);
      setMinistryHeader(config.ministryHeader);
      setRepublicHeader(config.republicHeader);
      setShowConfirmApply(false);
      setShowConfirmCancel(false);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const isDirty =
    unitTitle !== config.unitTitle ||
    hospitalHeader !== config.hospitalHeader ||
    ministryHeader !== config.ministryHeader ||
    republicHeader !== config.republicHeader;

  const handleApply = () => {
    onUpdateConfig({
      unitTitle: unitTitle.trim() || 'Unité : Service Hospitalier',
      hospitalHeader: hospitalHeader.trim() || config.hospitalHeader,
      ministryHeader: ministryHeader.trim() || config.ministryHeader,
      republicHeader: republicHeader.trim() || config.republicHeader,
    });
    setShowConfirmApply(false);
    onClose();
  };

  const handleRequestClose = () => {
    if (isDirty) {
      setShowConfirmCancel(true);
    } else {
      onClose();
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-slate-950 border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Configuration du Service & Hôpital</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Adaptez l'application à n'importe quel service médical ou établissement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            aria-label="Fermer"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto text-xs">
          <div className="p-3 bg-sky-950/40 border border-sky-800/80 rounded-xl flex items-start gap-2.5 text-sky-200">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-[11.5px] leading-relaxed">
              Ces informations apparaissent sur l'en-tête officiel de l'ensemble des plannings (A4 portrait et paysage) et documents officiels.
            </p>
          </div>

          {/* Unit / Service field */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold text-xs flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-sky-400" />
              <span>Intitulé du Service / Unité :</span>
            </label>
            <input
              type="text"
              value={unitTitle}
              onChange={(e) => setUnitTitle(e.target.value)}
              placeholder="Ex: Unité : Service de Rhumatologie"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-sky-500"
            />

            {/* Quick service presets */}
            <div className="pt-1.5">
              <span className="text-[10px] text-slate-400 font-medium block mb-1">
                Suggestions rapides de services :
              </span>
              <div className="flex flex-wrap gap-1">
                {COMMON_SERVICES.slice(0, 5).map((srv) => (
                  <button
                    key={srv}
                    type="button"
                    onClick={() => setUnitTitle(srv)}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10.5px] transition-colors truncate max-w-[220px]"
                  >
                    {srv.replace('Unité : ', '')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hospital Name field */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold text-xs flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Établissement Hospitalier :</span>
            </label>
            <input
              type="text"
              value={hospitalHeader}
              onChange={(e) => setHospitalHeader(e.target.value)}
              placeholder="Ex: Établissement Hospitalier d'Aïn El Türck - Dr. Medjber Tami"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Ministry Header field */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold text-xs">
              Ministère de tutelle :
            </label>
            <input
              type="text"
              value={ministryHeader}
              onChange={(e) => setMinistryHeader(e.target.value)}
              placeholder="MINISTÈRE DE LA SANTÉ..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Republic Header field */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold text-xs">
              En-tête de la République :
            </label>
            <input
              type="text"
              value={republicHeader}
              onChange={(e) => setRepublicHeader(e.target.value)}
              placeholder="RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-900 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRequestClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl font-semibold transition-colors text-xs"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={() => setShowConfirmApply(true)}
            disabled={!isDirty}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white font-bold transition-colors shadow-lg flex items-center justify-center gap-1.5 text-xs"
          >
            <Check className="w-4 h-4" />
            <span>Enregistrer les modifications</span>
          </button>
        </div>
      </div>

      {/* MANDATORY CONFIRMATION DIALOG FOR SAVING CHANGES */}
      {showConfirmApply && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-slate-950 border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-sky-400">
              <div className="p-2.5 rounded-full bg-sky-500/10 border border-sky-500/20">
                <AlertTriangle className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Confirmer le changement de service
                </h3>
                <p className="text-xs text-slate-400">
                  Mise à jour des en-têtes officiels
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Voulez-vous enregistrer « <strong>{unitTitle}</strong> » pour l'ensemble des plannings et documents du service ?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmApply(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg"
              >
                Oui, confirmer et appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY CONFIRMATION DIALOG FOR CANCEL */}
      {showConfirmCancel && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-slate-950 border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Fermer sans enregistrer ?
                </h3>
                <p className="text-xs text-slate-400">
                  Modifications de service non sauvegardées
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Vous avez modifié les paramètres de l'en-tête du service. Si vous quittez maintenant, vos modifications seront perdues.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmCancel(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Continuer l'édition
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmCancel(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg"
              >
                Oui, quitter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
