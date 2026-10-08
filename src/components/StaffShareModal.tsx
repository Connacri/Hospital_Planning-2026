import React, { useState, useMemo } from 'react';
import { StaffEntity, DayColumnMeta } from '../db/objectboxEngine';
import {
  X,
  Share2,
  Copy,
  Check,
  Calendar,
  MessageCircle,
  Mail,
  User,
  Shield,
  Printer,
} from 'lucide-react';

interface StaffShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffEntity[];
  daysColumns: DayColumnMeta[];
  monthName: string;
}

export const StaffShareModal: React.FC<StaffShareModalProps> = ({
  isOpen,
  onClose,
  staffList,
  daysColumns,
  monthName,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<number>(
    staffList[0]?.id || 0
  );
  const [copied, setCopied] = useState(false);

  const selectedStaff = useMemo(() => {
    return staffList.find((s) => s.id === selectedStaffId) || staffList[0];
  }, [staffList, selectedStaffId]);

  // Récapitulatif textuel de l'agent
  const agentSummary = useMemo(() => {
    if (!selectedStaff) return { guards: [], rests: [], days: [], conges: [], text: '' };

    const guards: number[] = [];
    const rests: number[] = [];
    const days: number[] = [];
    const conges: number[] = [];

    daysColumns.forEach((col) => {
      const d = col.day;
      const code = (selectedStaff.dailyActivity[d] || '').trim().toUpperCase();
      if (code === 'N' || code === 'NUIT' || code === 'G') {
        guards.push(d);
      } else if (code === 'RE' || code === 'R') {
        rests.push(d);
      } else if (code === 'JOUR' || code === 'J' || code === '12H') {
        days.push(d);
      } else if (code === 'C' || code === 'CM' || code.includes('CONGÉ')) {
        conges.push(d);
      }
    });

    const lines = [
      `🏥 *E.H. Aïn El Türck — Service de Rhumatologie*`,
      `👨‍⚕️ *Planning Individuel — ${selectedStaff.fullName}*`,
      `📅 *Mois :* ${monthName}`,
      `📌 *Fonction / Grade :* ${selectedStaff.rolePortrait || selectedStaff.gradeLandscape} ${selectedStaff.teamGroup ? `(Groupe ${selectedStaff.teamGroup})` : ''}`,
      ``,
      `🌙 *Gardes de Nuit (${guards.length}) :* ${guards.length > 0 ? guards.map((g) => `J${g}`).join(', ') : 'Aucune'}`,
      `🛌 *Repos Compensateurs (${rests.length}) :* ${rests.length > 0 ? rests.map((r) => `J${r}`).join(', ') : 'Aucun'}`,
      `☀️ *Services de Jour (${days.length}) :* ${days.length > 0 ? days.map((d) => `J${d}`).join(', ') : 'Horaires normaux'}`,
      conges.length > 0 ? `🏖️ *Congés (${conges.length}) :* ${conges.map((c) => `J${c}`).join(', ')}` : '',
      ``,
      `_Chef de Service : Dr. Medjber Tami_`,
    ].filter(Boolean);

    return {
      guards,
      rests,
      days,
      conges,
      text: lines.join('\n'),
    };
  }, [selectedStaff, daysColumns, monthName]);

  const handleCopy = () => {
    navigator.clipboard.writeText(agentSummary.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(agentSummary.text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(
      `Planning de Garde ${monthName} — ${selectedStaff?.fullName || 'Personnel'}`
    );
    const body = encodeURIComponent(agentSummary.text);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Fiche Individuelle & Envoi aux Équipes</span>
              </h2>
              <p className="text-xs text-slate-400">
                Transmission directe par WhatsApp, Email ou copie rapide ({monthName})
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
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Agent Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Sélectionner l'agent :
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-sky-500"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} — {s.rolePortrait || s.gradeLandscape} {s.teamGroup ? `(Groupe ${s.teamGroup})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedStaff && (
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {selectedStaff.fullName}
                  </h3>
                  <div className="text-xs text-slate-400">
                    {selectedStaff.rolePortrait || selectedStaff.gradeLandscape}
                    {selectedStaff.teamGroup && ` • Groupe de garde ${selectedStaff.teamGroup}`}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                    {agentSummary.guards.length} Nuits
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {agentSummary.rests.length} Repos
                  </span>
                </div>
              </div>

              {/* Monthly calendar visual pill list */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                  Affectations jour par jour ({monthName}) :
                </span>
                <div className="grid grid-cols-7 sm:grid-cols-10 gap-1 text-center">
                  {daysColumns.map((col) => {
                    const d = col.day;
                    const code = (selectedStaff.dailyActivity[d] || '').trim();
                    const isNight = code.toUpperCase() === 'N' || code.toUpperCase() === 'NUIT';
                    const isRest = code.toUpperCase() === 'RE';
                    const isConge = code.toUpperCase() === 'C' || code.toUpperCase() === 'CM';

                    return (
                      <div
                        key={d}
                        className={`p-1 rounded border text-[10px] ${
                          isNight
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                            : isRest
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800 font-semibold'
                            : isConge
                            ? 'bg-purple-950 text-purple-300 border-purple-800 font-semibold'
                            : col.isBlackColumn
                            ? 'bg-black text-white border-slate-700'
                            : 'bg-slate-900 text-slate-300 border-slate-800'
                        }`}
                      >
                        <div className="text-[9px] opacity-75">{d}</div>
                        <div className="font-bold leading-tight">{code || '-'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Message preview */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 mb-1 block">
                  Aperçu du message formaté :
                </span>
                <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-all">
                  {agentSummary.text}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Envoyer sur WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleShareEmail}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Envoyer par Email</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copié !' : 'Copier texte'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
