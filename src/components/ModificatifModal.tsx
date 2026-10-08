import React from 'react';
import {
  X,
  FileCheck2,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  HospitalDocumentConfig,
  TableModificatifKey,
  TABLE_MODIFICATIF_LABELS,
  isTableModificatif,
} from '../db/objectboxEngine';

interface ModificatifModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: HospitalDocumentConfig;
  onToggleTable: (key: TableModificatifKey) => void;
  onSetAll: (enabled: boolean) => void;
}

const TABLE_KEYS: { key: TableModificatifKey; category: 'Portrait (A4 Vertical)' | 'Paysage (A4 Horizontal)' }[] = [
  { key: 'pdf1Page1', category: 'Portrait (A4 Vertical)' },
  { key: 'pdf1Page2', category: 'Portrait (A4 Vertical)' },
  { key: 'pdf1Page3', category: 'Portrait (A4 Vertical)' },
  { key: 'pdf2Page1', category: 'Paysage (A4 Horizontal)' },
  { key: 'pdf2Page2', category: 'Paysage (A4 Horizontal)' },
  { key: 'pdf2Page3', category: 'Paysage (A4 Horizontal)' },
  { key: 'pdf2Page5', category: 'Paysage (A4 Horizontal)' },
];

export const ModificatifModal: React.FC<ModificatifModalProps> = ({
  isOpen,
  onClose,
  config,
  onToggleTable,
  onSetAll,
}) => {
  if (!isOpen) return null;

  const countActive = TABLE_KEYS.filter(({ key }) => isTableModificatif(config, key)).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-amber-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-400/30">
              <FileCheck2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  Mention « (Modificatif) » au Choix
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 font-semibold">
                  {countActive} / 7 actifs
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Appliquez la mention réglementaire <strong className="text-white">(Modificatif)</strong> aux tableaux de votre choix.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-amber-200/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Quick Actions (Tous / Aucun) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-slate-700">
              <Layers className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-xs">Actions globales rapides :</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSetAll(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Activer pour TOUS</span>
              </button>
              <button
                type="button"
                onClick={() => onSetAll(false)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tout Désactiver</span>
              </button>
            </div>
          </div>

          {/* List of 7 Tables */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Tableaux Individuels (cliquez pour basculer) :
            </span>

            <div className="grid grid-cols-1 gap-2">
              {TABLE_KEYS.map(({ key, category }) => {
                const isActive = isTableModificatif(config, key);
                const label = TABLE_MODIFICATIF_LABELS[key];

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onToggleTable(key)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-300 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isActive
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-400 border border-slate-300'
                        }`}
                      >
                        {isActive ? <Check className="w-4 h-4" /> : null}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {label}
                          </span>
                          {isActive && (
                            <span className="font-bold text-[10.5px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              (Modificatif)
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Format : {category}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                          isActive
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info note */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-950 text-[11px] leading-relaxed">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Réglementation hospitalière :</strong> L'ajout de la mention <em>(Modificatif)</em> permet de signaler aux instances administratives (DAPM, Direction Générale) qu'un ajustement ou un changement de roulement / congés a été effectué par rapport au planning initial.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-5 sm:px-6 py-3.5 flex items-center justify-between border-t border-slate-200 shrink-0">
          <span className="text-xs text-slate-500">
            {countActive === 0
              ? 'Aucun modificatif actif (Planning normal)'
              : `${countActive} tableau(x) avec mention (Modificatif)`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
          >
            Terminé
          </button>
        </div>
      </div>
    </div>
  );
};
