import React, { useMemo } from 'react';
import { StaffEntity, DayColumnMeta } from '../db/objectboxEngine';
import {
  AlertTriangle,
  X,
  CheckCircle,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';

interface RegulatoryAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffEntity[];
  daysColumns: DayColumnMeta[];
  monthName: string;
  onNavigateToStaff?: (staffId: number) => void;
}

export interface ScheduleAnomaly {
  id: string;
  type: 'double_guard' | 'missing_rest' | 'understaffed' | 'leave_conflict';
  severity: 'high' | 'medium' | 'info';
  title: string;
  description: string;
  staffId?: number;
  staffName?: string;
  day?: number;
}

export const RegulatoryAlertsModal: React.FC<RegulatoryAlertsModalProps> = ({
  isOpen,
  onClose,
  staffList,
  daysColumns,
  monthName,
  onNavigateToStaff,
}) => {
  const anomalies: ScheduleAnomaly[] = useMemo(() => {
    const list: ScheduleAnomaly[] = [];

    // 1. Analyse par agent : double garde consécutive ou manque de repos
    staffList.forEach((staff) => {
      const days = Object.keys(staff.dailyActivity || {})
        .map(Number)
        .sort((a, b) => a - b);

      for (let i = 0; i < days.length; i++) {
        const d = days[i];
        const codeCurrent = (staff.dailyActivity[d] || '').trim().toUpperCase();
        const nextDay = d + 1;
        const codeNext = (staff.dailyActivity[nextDay] || '').trim().toUpperCase();

        // Si l'agent fait une garde de nuit (uniquement pour le personnel de garde)
        const isNightGuard = (staff.category === 'paramedical_guard' && (codeCurrent === 'NUIT' || codeCurrent === 'G')) || (codeCurrent === 'NUIT');
        if (isNightGuard) {
          // Double garde consécutive : NUIT suivi de NUIT
          const isNextNight = (staff.category === 'paramedical_guard' && (codeNext === 'NUIT' || codeNext === 'G')) || (codeNext === 'NUIT');
          if (isNextNight) {
            list.push({
              id: `double-${staff.id}-${d}`,
              type: 'double_guard',
              severity: 'high',
              title: `Double garde de nuit consécutive`,
              description: `${staff.fullName} a une garde de nuit le J${d} et enchaîne une 2ème garde de nuit le J${nextDay} sans repos compensateur.`,
              staffId: staff.id,
              staffName: staff.fullName,
              day: d,
            });
          }
          // Garde de nuit suivie de service jour sans repos (devrait être RE)
          else if (
            codeNext &&
            codeNext !== 'RE' &&
            codeNext !== 'R' &&
            codeNext !== 'C' &&
            codeNext !== 'CM'
          ) {
            list.push({
              id: `no-re-${staff.id}-${d}`,
              type: 'missing_rest',
              severity: 'medium',
              title: `Repos compensateur non attribué`,
              description: `${staff.fullName} est en garde de nuit le J${d}, mais a "${codeNext}" au lieu de "RE" le lendemain (J${nextDay}).`,
              staffId: staff.id,
              staffName: staff.fullName,
              day: nextDay,
            });
          }
        }

        // Conflit congé de maternité / maladie
        if (staff.maternityLeave) {
          const { startDay, endDay } = staff.maternityLeave;
          if (d >= startDay && d <= endDay) {
            if (codeCurrent === 'N' || codeCurrent === 'JOUR') {
              list.push({
                id: `leave-conflict-${staff.id}-${d}`,
                type: 'leave_conflict',
                severity: 'high',
                title: `Activité programmée pendant un congé maternité`,
                description: `${staff.fullName} a une affectation "${codeCurrent}" le J${d} alors qu'elle est en congé maternité (J${startDay}–J${endDay}).`,
                staffId: staff.id,
                staffName: staff.fullName,
                day: d,
              });
            }
          }
        }
      }
    });

    // 2. Analyse quotidienne : sous-effectif de garde paramédicale de nuit
    const paramedicalGuards = staffList.filter(
      (s) => s.category === 'paramedical_guard'
    );

    daysColumns.forEach((col) => {
      const d = col.day;
      const countNight = paramedicalGuards.filter((s) => {
        const c = (s.dailyActivity[d] || '').trim().toUpperCase();
        return c === 'N' || c === 'NUIT';
      }).length;

      if (countNight > 0 && countNight < 2) {
        list.push({
          id: `understaffed-${d}`,
          type: 'understaffed',
          severity: 'medium',
          title: `Sous-effectif paramédical en garde de nuit`,
          description: `Seulement ${countNight} agent paramédical programmé en garde de nuit le J${d} (${col.dow}). Un minimum de 2 agents est recommandé.`,
          day: d,
        });
      }
    });

    return list;
  }, [staffList, daysColumns]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                anomalies.length > 0
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              }`}
            >
              {anomalies.length > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Contrôle & Alertes Réglementaires</span>
                {anomalies.length > 0 ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                    {anomalies.length} anomalie{anomalies.length > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Conforme à 100%
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Vérification du repos compensateur, continuité de service et absence de conflits ({monthName})
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
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {anomalies.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-950/50">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">
                Aucune anomalie réglementaire détectée
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Toutes les gardes de nuit sont immédiatement suivies de leur repos compensateur (RE), aucun conflit de congé n'est présent, et les effectifs minimaux sont respectés.
              </p>
            </div>
          ) : (
            anomalies.map((a) => (
              <div
                key={a.id}
                className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                  a.severity === 'high'
                    ? 'bg-rose-950/20 border-rose-900/60 hover:border-rose-700'
                    : 'bg-amber-950/20 border-amber-900/60 hover:border-amber-700'
                }`}
              >
                <div
                  className={`mt-0.5 shrink-0 ${
                    a.severity === 'high' ? 'text-rose-400' : 'text-amber-400'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white">{a.title}</h4>
                    {a.day && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Jour {a.day}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {a.description}
                  </p>
                </div>

                {a.staffId && onNavigateToStaff && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToStaff(a.staffId!);
                    }}
                    title="Voir l'agent dans la gestion d'équipe"
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors"
                  >
                    <span>Vérifier</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-400" />
            <span>
              Règle hospitalière : Toute nuit de garde (N) donne droit obligatoire à un repos (RE).
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
