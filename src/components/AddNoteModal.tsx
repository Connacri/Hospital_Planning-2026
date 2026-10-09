import React, { useState } from 'react';
import {
  X,
  FileText,
  Plus,
  Trash2,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  Info,
  AlertTriangle,
  Layers,
  Edit2,
  Save,
  CheckCircle2,
} from 'lucide-react';
import {
  DocumentNoteItem,
  TableTargetKey,
  TABLE_TARGET_LABELS,
  objectBoxStore,
  HospitalDocumentConfig,
  cleanNoteText,
} from '../db/objectboxEngine';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: HospitalDocumentConfig;
  initialTarget?: TableTargetKey;
  onSaveNoteSuccess?: (message: string) => void;
}

const PRESET_NOTES = [
  "Toutes modifications de programme ne doivent se faire qu'après accord de la direction.",
  "Toute absence non justifiée sous 48h sera considérée comme irrégulière conformément aux règlements de l'établissement.",
  "Les permutations de gardes doivent être signées par les deux intéressés et validées par le Médecin Chef.",
  "Les congés de récupération doivent être pris dans un délai maximum de 30 jours.",
  "Présence obligatoire aux staffs matinaux de 08h00 à 08h30.",
  "La passation des consignes entre équipes de garde s'effectue obligatoirement à 16h00 précises.",
];

const PREFIX_OPTIONS = ['N.B. :', 'NOTE :', 'OBSERVATION :', 'AVIS :', 'RAPPEL :'];

const ALL_TARGET_KEYS: TableTargetKey[] = [
  'pdf1Page1',
  'pdf1Page2',
  'pdf1Page3',
  'pdf2Page1',
  'pdf2Page2',
  'pdf2Page3',
  'pdf2Page5',
];

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  config,
  initialTarget,
  onSaveNoteSuccess,
}) => {
  const [selectedPrefix, setSelectedPrefix] = useState<string>('N.B. :');
  const [noteText, setNoteText] = useState<string>('');
  const [selectedTargets, setSelectedTargets] = useState<TableTargetKey[]>(() => {
    if (initialTarget && initialTarget !== 'all') {
      return [initialTarget];
    }
    return ['all'];
  });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      if (initialTarget && initialTarget !== 'all') {
        setSelectedTargets([initialTarget]);
      } else {
        setSelectedTargets(['all']);
      }
      setNoteText('');
      setEditingNoteId(null);
    }
  }, [isOpen, initialTarget]);

  if (!isOpen) return null;

  const notesList: DocumentNoteItem[] = config.documentNotes || [];

  const handleToggleTarget = (key: TableTargetKey) => {
    if (key === 'all') {
      if (selectedTargets.includes('all')) {
        setSelectedTargets([]);
      } else {
        setSelectedTargets(['all']);
      }
      return;
    }

    // Toggle specific table
    let next = selectedTargets.filter((t) => t !== 'all');
    if (next.includes(key)) {
      next = next.filter((t) => t !== key);
    } else {
      next = [...next, key];
    }
    if (next.length === ALL_TARGET_KEYS.length) {
      setSelectedTargets(['all']);
    } else {
      setSelectedTargets(next);
    }
  };

  const handleSelectAll = () => {
    setSelectedTargets(['all']);
  };

  const handleClearTargets = () => {
    setSelectedTargets([]);
  };

  const handleCreateNote = () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;

    const cleaned = cleanNoteText(trimmed, selectedPrefix);
    if (!cleaned) return;

    const targets: TableTargetKey[] = selectedTargets.length === 0 ? ['all'] : selectedTargets;

    objectBoxStore.addDocumentNote({
      prefix: selectedPrefix,
      text: cleaned,
      targetTables: targets,
      enabled: true,
    });

    setNoteText('');
    if (onSaveNoteSuccess) {
      onSaveNoteSuccess('Note N.B. ajoutée et enregistrée avec succès !');
    }
  };

  const handleToggleNote = (id: string) => {
    objectBoxStore.toggleDocumentNote(id);
  };

  const handleDeleteNote = (id: string) => {
    objectBoxStore.deleteDocumentNote(id);
    if (editingNoteId === id) {
      setEditingNoteId(null);
    }
  };

  const handleStartEdit = (note: DocumentNoteItem) => {
    setEditingNoteId(note.id);
    setEditingText(note.text);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingText.trim()) return;
    const note = notesList.find((n) => n.id === id);
    const cleaned = cleanNoteText(editingText, note?.prefix);
    if (!cleaned) return;
    objectBoxStore.updateDocumentNote(id, { text: cleaned });
    setEditingNoteId(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-0 sm:my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-400/30">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Ajouter une Mention N.B. ou Note</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Ajustement 1 Page Garanti
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Attribuez une note à un tableau précis, plusieurs tableaux ou à l'ensemble des plannings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-sm">
          {/* Target Table Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>1. Choisir le ou les tableaux cibles :</span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Tous les tableaux
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClearTargets}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Désélectionner tout
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {/* Option: Tous les tableaux */}
              <button
                type="button"
                onClick={() => handleToggleTarget('all')}
                className={`flex items-center gap-2.5 p-2 rounded-lg text-left transition-colors border sm:col-span-2 ${
                  selectedTargets.includes('all')
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold'
                    : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {selectedTargets.includes('all') ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                )}
                <span>🌟 Tous les tableaux (Global — sur l'ensemble des pages)</span>
              </button>

              {/* Specific tables */}
              {ALL_TARGET_KEYS.map((key) => {
                const isChecked = selectedTargets.includes('all') || selectedTargets.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleToggleTarget(key)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left transition-colors border text-xs ${
                      isChecked
                        ? 'bg-indigo-50/70 border-indigo-300 text-indigo-900 font-semibold'
                        : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{TABLE_TARGET_LABELS[key]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note Input & Prefix */}
          <div>
            <label className="block font-bold text-slate-900 mb-2">
              2. Rédiger le texte de la mention N.B. :
            </label>
            <div className="flex gap-2 mb-2">
              {PREFIX_OPTIONS.map((prefix) => (
                <button
                  key={prefix}
                  type="button"
                  onClick={() => setSelectedPrefix(prefix)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors ${
                    selectedPrefix === prefix
                      ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-2xs'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {prefix}
                </button>
              ))}
            </div>

            <div className="relative">
              <textarea
                rows={3}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Écrivez votre mention N.B. ou note officielle ici..."
                className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-sm"
              />
            </div>

            {/* Quick Presets */}
            <div className="mt-2.5">
              <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Suggestions hospitalières rapides (cliquez pour insérer) :</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_NOTES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNoteText(preset)}
                    className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors text-left"
                  >
                    {preset.length > 55 ? `${preset.substring(0, 52)}...` : preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={handleCreateNote}
                disabled={!noteText.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter cette note aux tableaux</span>
              </button>
            </div>
          </div>

          {/* Safe Page Guarantee Note */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Garantie d'impression sur la même page (A4) : </span>
              Le système ajuste automatiquement les espacements verticaux, la taille de police et la disposition des tableaux pour s'assurer que la note s'insère parfaitement sur la même page sans générer de page supplémentaire.
            </div>
          </div>

          {/* List of Active Notes */}
          <div>
            <h3 className="font-bold text-slate-900 mb-2 flex items-center justify-between">
              <span>3. Notes et N.B. enregistrées ({notesList.length}) :</span>
            </h3>

            {notesList.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Aucune note enregistrée. Utilisez le formulaire ci-dessus pour en ajouter une.
              </div>
            ) : (
              <div className="space-y-2">
                {notesList.map((note) => {
                  const isEditing = editingNoteId === note.id;
                  const isGlobal = note.targetTables.includes('all');

                  return (
                    <div
                      key={note.id}
                      className={`p-3 rounded-xl border transition-all ${
                        note.enabled
                          ? 'bg-white border-slate-300 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[11px] rounded border border-amber-300">
                              {note.prefix}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              Cible :{' '}
                              <strong className="text-slate-700">
                                {isGlobal
                                  ? 'Tous les tableaux'
                                  : note.targetTables.map((t) => TABLE_TARGET_LABELS[t]).join(', ')}
                              </strong>
                            </span>
                          </div>

                          {isEditing ? (
                            <div className="flex gap-2 mt-2">
                              <input
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="flex-1 p-1.5 text-xs border border-indigo-400 rounded focus:ring-1 focus:ring-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(note.id)}
                                className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                <span>Sauver</span>
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-800 leading-relaxed font-medium">
                              {cleanNoteText(note.text, note.prefix)}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleNote(note.id)}
                            className={`p-1.5 rounded-lg border text-xs font-semibold ${
                              note.enabled
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                            title={note.enabled ? 'Désactiver cette note' : 'Activer cette note'}
                          >
                            {note.enabled ? 'Actif' : 'Masqué'}
                          </button>
                          {!isEditing && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(note)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition-colors shadow-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
