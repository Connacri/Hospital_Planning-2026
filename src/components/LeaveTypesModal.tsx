import React, { useState } from 'react';
import { Tag, Plus, Trash2, Edit2, Check, X, HelpCircle, Sparkles, AlertTriangle } from 'lucide-react';
import { LeaveTypeItem } from '../db/objectboxEngine';

interface LeaveTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveTypes: LeaveTypeItem[];
  onAddLeaveType: (item: Omit<LeaveTypeItem, 'id'>) => void;
  onUpdateLeaveType: (id: string, updates: Partial<LeaveTypeItem>) => void;
  onDeleteLeaveType: (id: string) => void;
}

const PRESET_SUGGESTIONS = [
  { code: 'CA', label: 'Congé Annuel', color: '#16a34a' },
  { code: 'CM', label: 'Congé Maladie', color: '#dc2626' },
  { code: 'MAT', label: 'Congé Maternité', color: '#db2777' },
  { code: 'REC', label: 'Récupération', color: '#ca8a04' },
  { code: 'CSS', label: 'Congé Sans Solde', color: '#475569' },
  { code: 'AT', label: 'Accident Travail', color: '#e11d48' },
  { code: 'MIS', label: 'Mission / Stage', color: '#2563eb' },
  { code: 'CP', label: 'Congé Paternité', color: '#0d9488' },
];

const COLOR_OPTIONS = [
  '#dc2626',
  '#ea580c',
  '#d97706',
  '#16a34a',
  '#0d9488',
  '#0284c7',
  '#2563eb',
  '#7c3aed',
  '#c026d3',
  '#db2777',
  '#475569',
  '#111827',
];

export const LeaveTypesModal: React.FC<LeaveTypesModalProps> = ({
  isOpen,
  onClose,
  leaveTypes,
  onAddLeaveType,
  onUpdateLeaveType,
  onDeleteLeaveType,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState(COLOR_OPTIONS[0]);

  const [newCode, setNewCode] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[5]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mandatory confirmation state
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'delete' | 'edit' | 'add';
    id?: string;
    targetData?: { code: string; label: string; color: string };
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleStartEdit = (item: LeaveTypeItem) => {
    setEditingId(item.id);
    setEditCode(item.code);
    setEditLabel(item.label);
    setEditColor(item.color || COLOR_OPTIONS[0]);
  };

  const handleRequestSaveEdit = (id: string) => {
    if (!editCode.trim() || !editLabel.trim()) return;
    setConfirmDialog({
      type: 'edit',
      id,
      targetData: { code: editCode.trim(), label: editLabel.trim(), color: editColor },
      message: `Confirmer la modification du motif "${editCode.trim()}" (${editLabel.trim()}) ?`,
    });
  };

  const handleRequestDelete = (item: LeaveTypeItem) => {
    setConfirmDialog({
      type: 'delete',
      id: item.id,
      targetData: { code: item.code, label: item.label, color: item.color || '#0284c7' },
      message: `Confirmer la suppression du motif de congé "${item.code}" (${item.label}) ?`,
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) {
      setErrorMsg('Veuillez renseigner un code ou abréviation (ex: CSS, AT, RC).');
      return;
    }
    if (!newLabel.trim()) {
      setErrorMsg('Veuillez renseigner un libellé (ex: Congé Sans Solde).');
      return;
    }

    const codeUpper = newCode.trim();
    if (leaveTypes.some((lt) => lt.code.toLowerCase() === codeUpper.toLowerCase())) {
      setErrorMsg(`Le code "${codeUpper}" existe déjà.`);
      return;
    }

    setConfirmDialog({
      type: 'add',
      targetData: {
        code: codeUpper,
        label: newLabel.trim(),
        color: newColor,
      },
      message: `Confirmer la création du motif "${codeUpper}" (${newLabel.trim()}) ?`,
    });
  };

  const handleAddPreset = (preset: { code: string; label: string; color: string }) => {
    if (leaveTypes.some((lt) => lt.code.toLowerCase() === preset.code.toLowerCase())) {
      setErrorMsg(`Le type "${preset.code}" est déjà présent dans la liste.`);
      return;
    }
    setConfirmDialog({
      type: 'add',
      targetData: {
        code: preset.code,
        label: preset.label,
        color: preset.color,
      },
      message: `Ajouter le statut prédéfini "${preset.code}" (${preset.label}) ?`,
    });
  };

  const handleConfirmAction = () => {
    if (!confirmDialog) return;

    if (confirmDialog.type === 'delete' && confirmDialog.id) {
      onDeleteLeaveType(confirmDialog.id);
    } else if (confirmDialog.type === 'edit' && confirmDialog.id && confirmDialog.targetData) {
      onUpdateLeaveType(confirmDialog.id, {
        code: confirmDialog.targetData.code,
        label: confirmDialog.targetData.label,
        color: confirmDialog.targetData.color,
      });
      setEditingId(null);
    } else if (confirmDialog.type === 'add' && confirmDialog.targetData) {
      onAddLeaveType({
        code: confirmDialog.targetData.code,
        label: confirmDialog.targetData.label,
        color: confirmDialog.targetData.color,
        isSystem: false,
      });
      setNewCode('');
      setNewLabel('');
      setErrorMsg(null);
    }

    setConfirmDialog(null);
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-slate-950 border border-slate-800 rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 flex-wrap">
                <span>Gestion des Types de Congés &amp; Statuts</span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {leaveTypes.length} types
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Personnalisez les abréviations, couleurs et statuts disponibles dans les plannings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-300">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 rounded-xl text-xs flex items-center justify-between">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-red-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick presets */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Modèles fréquents rapides :</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SUGGESTIONS.map((preset) => {
                const alreadyExists = leaveTypes.some(
                  (lt) => lt.code.toLowerCase() === preset.code.toLowerCase()
                );
                return (
                  <button
                    key={preset.code}
                    type="button"
                    disabled={alreadyExists}
                    onClick={() => handleAddPreset(preset)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 min-h-[32px] ${
                      alreadyExists
                        ? 'opacity-40 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                        : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-850 shadow-xs'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span className="font-bold">{preset.code}</span>
                    <span className="text-[11px] text-slate-400">({preset.label})</span>
                    {!alreadyExists && <Plus className="w-3 h-3 text-sky-400 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add Leave Form */}
          <form
            onSubmit={handleAddSubmit}
            className="p-3.5 sm:p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3"
          >
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Créer un nouveau type de congé ou statut personnalisé</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
              <div className="sm:col-span-3">
                <label className="block text-[11px] text-slate-400 font-medium mb-1">
                  Code / Symbole *
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="ex: CSS, AT, RC"
                  maxLength={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white uppercase font-bold focus:outline-none focus:border-sky-500 font-mono min-h-[38px]"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-[11px] text-slate-400 font-medium mb-1">
                  Libellé complet *
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="ex: Congé Sans Solde, Accident de Travail"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500 min-h-[38px]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] text-slate-400 font-medium mb-1">
                  Couleur &amp; Action
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-slate-700 bg-transparent cursor-pointer shrink-0 p-0.5"
                    title="Choisir une couleur"
                  />
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors min-h-[38px] shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* List of Existing Leave Types */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2">
              Types de congés configurés dans le service :
            </div>
            <div className="divide-y divide-slate-850 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30">
              {leaveTypes.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <div
                    key={item.id}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-900/50 transition-colors"
                  >
                    {isEditing ? (
                      <div className="flex flex-wrap items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editCode}
                          onChange={(e) => setEditCode(e.target.value)}
                          className="w-16 sm:w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs font-bold font-mono text-white min-h-[36px]"
                        />
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="flex-1 min-w-[120px] bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white min-h-[36px]"
                        />
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          aria-label="Modifier la couleur"
                          className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer shrink-0"
                        />
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            type="button"
                            onClick={() => handleRequestSaveEdit(item.id)}
                            className="p-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Sauvegarder"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Annuler"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.color || '#0284c7' }}
                          />
                          <span className="font-mono font-bold text-xs sm:text-sm text-amber-300 min-w-[45px]">
                            {item.code}
                          </span>
                          <span className="text-xs text-slate-200 font-medium">
                            {item.label}
                          </span>
                          {item.isSystem && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              Système
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="p-2 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Modifier ce type de congé"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRequestDelete(item)}
                            className="p-2 text-red-400 hover:text-red-300 rounded hover:bg-red-950/40 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Supprimer ce type de congé"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs shrink-0">
          <div className="text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-[11px] sm:text-xs">Tous les types ajoutés sont disponibles dans le pinceau 31 jours.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg font-semibold transition-colors shadow-sm min-h-[38px] flex items-center justify-center"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Confirmation requise</h4>
                <p className="text-xs text-slate-300 mt-1">{confirmDialog.message}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg min-h-[38px]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm min-h-[38px]"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
