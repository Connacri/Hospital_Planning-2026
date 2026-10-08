import React from 'react';
import {
  X,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  QrCode,
  Stamp,
  Award,
} from 'lucide-react';

export type ValidationStatus =
  | 'draft'
  | 'reviewed'
  | 'approved_service'
  | 'approved_direction';

interface DocumentValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ValidationStatus;
  onChangeStatus: (s: ValidationStatus) => void;
  showOfficialStamp: boolean;
  onToggleOfficialStamp: (show: boolean) => void;
  showQrCode: boolean;
  onToggleQrCode: (show: boolean) => void;
  monthName: string;
}

export const DocumentValidationModal: React.FC<DocumentValidationModalProps> = ({
  isOpen,
  onClose,
  status,
  onChangeStatus,
  showOfficialStamp,
  onToggleOfficialStamp,
  showQrCode,
  onToggleQrCode,
  monthName,
}) => {
  if (!isOpen) return null;

  const statuses: Array<{
    id: ValidationStatus;
    label: string;
    subtitle: string;
    color: string;
  }> = [
    {
      id: 'draft',
      label: 'Brouillon (Travail en cours)',
      subtitle: 'Modifications autorisées, non visé par la hiérarchie',
      color: 'border-slate-700 bg-slate-900 text-slate-300',
    },
    {
      id: 'reviewed',
      label: 'Vérifié par la Surveillance Médicale',
      subtitle: 'Contrôle des repos compensateurs et roulements effectué',
      color: 'border-sky-800 bg-sky-950/40 text-sky-300',
    },
    {
      id: 'approved_service',
      label: 'Validé par le Chef de Service (Dr. Medjber Tami)',
      subtitle: 'Planning officiel prêt pour affichage et transmission',
      color: 'border-emerald-800 bg-emerald-950/40 text-emerald-300',
    },
    {
      id: 'approved_direction',
      label: 'Approuvé par la Direction Générale (E.H. Aïn El Türck)',
      subtitle: 'Archivé au Bureau du Personnel et validé pour paie/indemnités',
      color: 'border-purple-800 bg-purple-950/40 text-purple-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Validation Officielle & Certification</span>
              </h2>
              <p className="text-xs text-slate-400">
                Cachet du Service, Signature numérique & Code QR ({monthName})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Statut officiel du document :
            </label>
            <div className="space-y-2">
              {statuses.map((item) => {
                const isSelected = status === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChangeStatus(item.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? `${item.color} ring-2 ring-sky-500 font-semibold shadow-md`
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-sky-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options Toggles */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Éléments graphiques sur le document imprimé A4 :
            </label>

            {/* Official Stamp Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Stamp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Cachet officiel du Service de Rhumatologie
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Affiche le tampon circulaire et la mention "Dr. Medjber Tami" sous les signatures
                  </div>
                </div>
              </div>

              <input
                type="checkbox"
                checked={showOfficialStamp}
                onChange={(e) => onToggleOfficialStamp(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
            </div>

            {/* QR Code Verification Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    Code QR d'Authentification Hospitalière
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Génère un QR code scannable certifiant l'authenticité et la date d'émission
                  </div>
                </div>
              </div>

              <input
                type="checkbox"
                checked={showQrCode}
                onChange={(e) => onToggleQrCode(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow transition-colors"
          >
            Enregistrer & Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
