import React, { useState } from 'react';
import { Plus, Trash2, Tag, Repeat, Check, HeartHandshake } from 'lucide-react';
import {
  HospitalDocumentConfig,
  StaffEntity,
  DoctorWeeklySchedule,
  buildStandard08h16hActivity,
  buildGuard16hActivity,
  buildHygiene12hActivity,
  DEFAULT_LEAVE_TYPES,
  LeaveTypeItem,
  TableModificatifKey,
  isTableModificatif,
} from '../db/objectboxEngine';
import { EditableText } from './EditableText';
import { OfficialHospitalStamp, OfficialHospitalQrCode } from './OfficialStampAndQr';
import { ValidationStatus } from './DocumentValidationModal';

interface PortraitPdfSheetsProps {
  activeSubPage: 'all' | 'p1' | 'p2' | 'p3';
  config: HospitalDocumentConfig;
  staffList: StaffEntity[];
  readOnly?: boolean;
  validationStatus?: ValidationStatus;
  showOfficialStamp?: boolean;
  showQrCode?: boolean;
  onUpdateConfig: (partial: Partial<HospitalDocumentConfig>) => void;
  onUpdateStaffField: <K extends keyof StaffEntity>(id: number, field: K, value: StaffEntity[K]) => void;
  onUpdateDoctorWeekly: (id: number, dayKey: keyof DoctorWeeklySchedule, value: string) => void;
  onAddStaff: (entity: Omit<StaffEntity, 'id'>) => void;
  onDeleteStaff: (id: number) => void;
  onOpenGuardRotationModal?: () => void;
  onOpenLeaveTypesModal?: () => void;
  onOpenMaternityModal?: (staff?: StaffEntity) => void;
  onToggleTableModificatif?: (key: TableModificatifKey) => void;
}

const LeavePickerButton: React.FC<{
  leaveTypes: LeaveTypeItem[];
  onSelect: (val: string) => void;
  onOpenLeaveTypesModal?: () => void;
  onOpenMaternityModal?: () => void;
}> = ({ leaveTypes, onSelect, onOpenLeaveTypesModal, onOpenMaternityModal }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="no-print absolute right-0.5 top-1/2 -translate-y-1/2 z-20">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title="Choisir un type de congÃ© ou observation"
        className="opacity-0 group-hover/obs:opacity-100 p-0.5 text-slate-500 hover:text-black hover:bg-slate-200 rounded transition-opacity"
      >
        <Tag className="w-2.5 h-2.5 text-amber-700" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-full mt-1 w-64 bg-slate-950 text-white border border-slate-700 rounded-lg shadow-2xl p-1.5 z-40 text-left text-[11px] font-sans divide-y divide-slate-800"
          >
            <div className="px-2 py-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Types de CongÃ©s & OBS</span>
              <span className="text-[9px] text-amber-400 font-normal">Clic = insÃ©rer</span>
            </div>

            {/* Quick official maternity option */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  onSelect('CONGÃ‰ de MATERNITÃ‰. 25/11/2025 au 26/04/2026');
                  setOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-800/80 text-rose-200 text-[10.5px] font-medium transition-colors flex items-center gap-1.5"
                title="InsÃ©rer la mention exacte du PDF pour Bakhouche Sarra"
              >
                <HeartHandshake className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="truncate">CONGÃ‰ de MATERNITÃ‰. 25/11/2025 au 26/04/2026</span>
              </button>
            </div>

            <div className="py-1 max-h-48 overflow-y-auto space-y-0.5">
              {leaveTypes.map((lt) => (
                <div
                  key={lt.id}
                  className="w-full px-2 py-1 rounded hover:bg-slate-800 flex items-center justify-between gap-1 group/lt transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(lt.code === 'C' ? 'CongÃ© (C)' : `${lt.code} : ${lt.label}`);
                      setOpen(false);
                    }}
                    className="flex items-center gap-1.5 text-left flex-1 min-w-0"
                    title={`InsÃ©rer complet : ${lt.code} : ${lt.label}`}
                  >
                    <span
                      className="font-bold font-mono px-1 py-0.2 rounded text-[10.5px]"
                      style={{
                        backgroundColor: lt.color ? `${lt.color}25` : '#ca8a0425',
                        color: lt.color || '#ca8a04',
                      }}
                    >
                      {lt.code}
                    </span>
                    <span className="text-[10px] text-slate-300 truncate group-hover/lt:text-white">
                      {lt.label}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelect(lt.code);
                      setOpen(false);
                    }}
                    title={`InsÃ©rer uniquement le code "${lt.code}"`}
                    className="px-1 text-[9px] font-mono text-slate-400 hover:text-amber-300 hover:bg-slate-700 rounded transition-colors"
                  >
                    code
                  </button>
                </div>
              ))}
            </div>
            <div className="pt-1 space-y-0.5">
              <div className="px-2 py-0.5 text-[9px] text-slate-500 uppercase font-semibold">
                Observations frÃ©quentes
              </div>
              <div className="grid grid-cols-2 gap-1 px-1">
                {[
                  'En congÃ©',
                  'RemplaÃ§ant',
                  '08h-16h',
                  'Garde',
                  'Surveillant MÃ©dical',
                  'ChargÃ©e de DMO',
                  'Effacer',
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onSelect(opt === 'Effacer' ? '' : opt);
                      setOpen(false);
                    }}
                    className={`text-left px-1.5 py-0.5 rounded text-[10px] truncate transition-colors ${
                      opt === 'Effacer'
                        ? 'text-red-400 hover:bg-red-950/60 col-span-2 text-center font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div className="pt-1.5 mt-1 space-y-1">
              {onOpenMaternityModal && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onOpenMaternityModal();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-200 text-[10px] font-bold transition-colors"
                >
                  <HeartHandshake className="w-3 h-3 text-rose-400" />
                  <span>GÃ©rer CongÃ© MaternitÃ© (Fusion)</span>
                </button>
              )}
              {onOpenLeaveTypesModal && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onOpenLeaveTypesModal();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-800/80 text-amber-200 text-[10px] font-bold transition-colors"
                >
                  <Tag className="w-3 h-3 text-amber-400" />
                  <span>GÃ©rer / Ajouter des congÃ©s</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const OfficialPortraitHeader: React.FC<{
  config: HospitalDocumentConfig;
  onUpdateConfig: (partial: Partial<HospitalDocumentConfig>) => void;
  readOnly?: boolean;
  compact?: boolean;
}> = ({ config, onUpdateConfig, readOnly = false, compact = false }) => (
  <div className="font-pdf text-black">
    <div className="text-center leading-tight">
      <div className="text-[15px] font-semibold tracking-tight">
        <EditableText
          value={config.republicHeader}
          readOnly={readOnly}
          onChange={(v) => onUpdateConfig({ republicHeader: v })}
        />
      </div>
      <div className="text-[13px] font-medium tracking-tight mt-0.5">
        <EditableText
          value={config.ministryHeader}
          readOnly={readOnly}
          onChange={(v) => onUpdateConfig({ ministryHeader: v })}
        />
      </div>
      <div className="text-[13px] font-medium mt-1">
        <EditableText
          value={config.hospitalHeader}
          readOnly={readOnly}
          onChange={(v) => onUpdateConfig({ hospitalHeader: v })}
        />
      </div>
    </div>
    <div className={`${compact ? 'mt-3' : 'mt-6'} text-[13px] font-medium`}>
      <EditableText
        value={config.unitTitle}
        readOnly={readOnly}
        onChange={(v) => onUpdateConfig({ unitTitle: v })}
      />
    </div>
  </div>
);

const OfficialPortraitFooter: React.FC<{
  config: HospitalDocumentConfig;
  onUpdateConfig: (partial: Partial<HospitalDocumentConfig>) => void;
  readOnly?: boolean;
  compact?: boolean;
  showNb?: boolean;
  showOfficialStamp?: boolean;
  showQrCode?: boolean;
  validationStatus?: ValidationStatus;
}> = ({
  config,
  onUpdateConfig,
  readOnly = false,
  compact = false,
  showNb = false,
  showOfficialStamp = false,
  showQrCode = false,
  validationStatus = 'draft',
}) => {
  const sigs = config.signaturesPortrait;
  const updateSig = (idx: 0 | 1 | 2 | 3, val: string) => {
    const next: [string, string, string, string] = [...sigs] as [string, string, string, string];
    next[idx] = val;
    onUpdateConfig({ signaturesPortrait: next });
  };

  return (
    <div className={`font-pdf text-black mt-auto ${compact ? 'pt-1' : 'pt-2'}`}>
      {/* N.B Notice placed directly under the table if enabled */}
      {showNb && config.nbNotice && (
        <div className="mb-1 text-[11.5px] font-medium text-left">
          <EditableText
            value={config.nbNotice}
            readOnly={readOnly}
            onChange={(v) => onUpdateConfig({ nbNotice: v })}
          />
        </div>
      )}

      {/* Date row with QR Code */}
      <div className={`flex items-end justify-between ${compact ? 'mb-1' : 'mb-2'}`}>
        <div>
          {showQrCode && (
            <OfficialHospitalQrCode
              status={validationStatus}
              monthName={config.guardMonthName || "Mois d'Octobre 2026"}
            />
          )}
        </div>
        <div className="text-right text-[12.5px] font-medium pr-2">
          <EditableText
            value={config.cityDatePortrait}
            readOnly={readOnly}
            onChange={(v) => onUpdateConfig({ cityDatePortrait: v })}
          />
        </div>
      </div>

      {/* Signatures Row */}
      <div className={`grid grid-cols-4 text-center text-[12.5px] font-medium ${compact ? 'pb-0.5' : 'pb-1'}`}>
        <div>
          <EditableText value={sigs[0]} readOnly={readOnly} onChange={(v) => updateSig(0, v)} />
        </div>
        <div>
          <EditableText value={sigs[1]} readOnly={readOnly} onChange={(v) => updateSig(1, v)} />
        </div>
        <div>
          <EditableText value={sigs[2]} readOnly={readOnly} onChange={(v) => updateSig(2, v)} />
        </div>
        <div className="relative flex flex-col items-center">
          <EditableText value={sigs[3]} readOnly={readOnly} onChange={(v) => updateSig(3, v)} />
          {showOfficialStamp && (
            <div className="absolute top-2 right-1 z-10 pointer-events-none">
              <OfficialHospitalStamp />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PortraitPdfSheets: React.FC<PortraitPdfSheetsProps> = ({
  activeSubPage,
  config,
  staffList,
  readOnly = false,
  validationStatus = 'draft',
  showOfficialStamp = false,
  showQrCode = false,
  onUpdateConfig,
  onUpdateStaffField,
  onUpdateDoctorWeekly,
  onAddStaff,
  onDeleteStaff,
  onOpenGuardRotationModal,
  onOpenLeaveTypesModal,
  onOpenMaternityModal,
  onToggleTableModificatif,
}) => {
  const doctors = staffList
    .filter((s) => s.category === 'medical')
    .sort((a, b) => a.portraitOrder - b.portraitOrder || a.id - b.id);

  const paramedicalDay = staffList
    .filter((s) => s.category === 'paramedical_day')
    .sort((a, b) => a.portraitOrder - b.portraitOrder || a.id - b.id);

  const paramedicalGuard = staffList
    .filter((s) => s.category === 'paramedical_guard')
    .sort((a, b) => a.portraitOrder - b.portraitOrder || a.id - b.id);

  const hygieneStaff = staffList
    .filter((s) => s.category === 'hygiene')
    .sort((a, b) => a.portraitOrder - b.portraitOrder || a.id - b.id);

  const guardGroups = ['A', 'B', 'C', 'D', 'E'];

  const handleAddDoctor = () => {
    onAddStaff({
      fullName: 'Nouveau MÃ©decin',
      category: 'medical',
      rolePortrait: 'MÃ©decin GÃ©nÃ©raliste',
      gradeLandscape: 'MÃ©decin',
      obsPortrait: '08h-16h',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: doctors.length + 1,
      landscapeOrder: doctors.length + 1,
      weeklySchedule: {
        dimanche: 'SERVICE',
        lundi: 'SERVICE',
        mardi: 'SERVICE',
        mercredi: 'SERVICE',
        jeudi: 'SERVICE',
      },
      dailyActivity: buildStandard08h16hActivity(),
    });
  };

  const handleAddParamedicalDay = () => {
    onAddStaff({
      fullName: 'Nouvel Agent',
      category: 'paramedical_day',
      rolePortrait: 'ATS',
      gradeLandscape: 'ATS',
      obsPortrait: '',
      horaireBlock: '08h-16h',
      teamGroup: '',
      portraitOrder: paramedicalDay.length + 1,
      landscapeOrder: paramedicalDay.length + 1,
      weeklySchedule: {
        dimanche: 'SERVICE',
        lundi: 'SERVICE',
        mardi: 'SERVICE',
        mercredi: 'SERVICE',
        jeudi: 'SERVICE',
      },
      dailyActivity: buildStandard08h16hActivity(),
    });
  };

  const handleAddGuardMember = (groupLetter: string) => {
    onAddStaff({
      fullName: `Agent Groupe ${groupLetter}`,
      category: 'paramedical_guard',
      rolePortrait: 'ATS',
      gradeLandscape: 'ATS',
      obsPortrait: '',
      horaireBlock: '16h',
      teamGroup: groupLetter,
      portraitOrder: paramedicalGuard.length + 1,
      landscapeOrder: paramedicalGuard.length + 1,
      weeklySchedule: {
        dimanche: 'SERVICE',
        lundi: 'SERVICE',
        mardi: 'SERVICE',
        mercredi: 'SERVICE',
        jeudi: 'SERVICE',
      },
      dailyActivity: buildGuard16hActivity(groupLetter),
    });
  };

  const handleAddHygieneMember = () => {
    onAddStaff({
      fullName: "Nouvel Agent d'HygiÃ¨ne",
      category: 'hygiene',
      rolePortrait: "Agent d'hygiÃ¨ne",
      gradeLandscape: "Agent d'hygiÃ¨ne",
      obsPortrait: '',
      horaireBlock: '12h',
      teamGroup: '',
      portraitOrder: hygieneStaff.length + 1,
      landscapeOrder: hygieneStaff.length + 1,
      weeklySchedule: {
        dimanche: 'SERVICE',
        lundi: 'SERVICE',
        mardi: 'SERVICE',
        mercredi: 'SERVICE',
        jeudi: 'SERVICE',
      },
      dailyActivity: buildHygiene12hActivity(hygieneStaff.length % 2 === 0),
    });
  };

  // Total rows in 16h block on Page 3 = 5 group header rows + sum of members in groups A..E
  const total16hRows =
    guardGroups.length +
    guardGroups.reduce(
      (acc, g) => acc + paramedicalGuard.filter((s) => s.teamGroup === g).length,
      0
    );

  const chunkArray = <T,>(items: T[], size: number): T[][] => {
    if (items.length === 0) return [[]];
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  };

  const doctorChunksP1 = chunkArray(doctors, 7);
  const doctorChunksP2 = chunkArray(doctors, 12);

  return (
    <div className="flex flex-col items-center gap-8 print-only-container">
      {/* =====================================================================
          PDF 1 â€” PAGE 1: Planning des MÃ©decins Â« Mois d'Octobre 2026 Â»
         ===================================================================== */}
      {(activeSubPage === 'all' || activeSubPage === 'p1') &&
        doctorChunksP1.map((chunk, chunkIdx) => (
          <section
            key={`doc-p1-${chunkIdx}`}
            id={`doc-sheet-p1-${chunkIdx}`}
            aria-label={`PDF 1 Page 1 - Planning des MÃ©decins ${
              chunkIdx > 0 ? `(Suite ${chunkIdx + 1})` : ''
            }`}
            className="a4-portrait-sheet shadow-xl border border-slate-300 p-[1.27cm] flex flex-col justify-between font-pdf scroll-mt-20"
          >
            <div>
              <OfficialPortraitHeader
                config={config}
                onUpdateConfig={onUpdateConfig}
                readOnly={readOnly}
              />

              {/* Title Block */}
              <div className="mt-8 mb-4 text-center">
                <h2 className="text-[18px] font-semibold tracking-tight text-black inline-flex items-center justify-center flex-wrap gap-1.5">
                  <EditableText
                    value={
                      chunkIdx === 0
                        ? config.pdf1Page1Title
                        : `${config.pdf1Page1Title} (Suite)`
                    }
                    readOnly={readOnly}
                    onChange={(v) => {
                      if (chunkIdx === 0) {
                        onUpdateConfig({ pdf1Page1Title: v });
                      }
                    }}
                  />
                  {isTableModificatif(config, 'pdf1Page1') && !/\(Modificatif\)/i.test(config.pdf1Page1Title) && (
                    <strong className="font-bold text-black font-pdf">
                      (Modificatif)
                    </strong>
                  )}
                  {chunkIdx > 0 && (
                    <span className="text-xs font-semibold text-slate-700 font-sans ml-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      Suite {chunkIdx + 1}/{doctorChunksP1.length} â€” MÃ©decins {chunkIdx * 7 + 1} Ã {' '}
                      {Math.min((chunkIdx + 1) * 7, doctors.length)}
                    </span>
                  )}
                </h2>
                {!readOnly && onToggleTableModificatif && chunkIdx === 0 && (
                  <div className="no-print mt-1.5 flex justify-center">
                    <button
                      type="button"
                      onClick={() => onToggleTableModificatif('pdf1Page1')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-bold transition-all border shadow-2xs ${
                        isTableModificatif(config, 'pdf1Page1')
                          ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                      }`}
                      title="Activer ou dÃ©sactiver (Modificatif) sur ce tableau"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isTableModificatif(config, 'pdf1Page1') ? 'bg-amber-600' : 'bg-slate-400'}`} />
                      <span>Modificatif : {isTableModificatif(config, 'pdf1Page1') ? 'Oui' : 'Non'}</span>
                    </button>
                  </div>
                )}
                <div className="text-[15px] font-medium text-black mt-1">
                  <EditableText
                    value={config.pdf1Page1Subtitle}
                    readOnly={readOnly}
                    onChange={(v) => onUpdateConfig({ pdf1Page1Subtitle: v })}
                  />
                </div>
              </div>

              {/* Doctors Weekly Table */}
              <table className="w-full border-collapse border border-[#666666] text-center">
                <thead>
                  <tr className="bg-[#3D3D3D] text-white text-[15px] font-medium h-[42px]">
                    {config.pdf1Page1Columns.map((col, idx) => (
                      <th
                        key={idx}
                        className={`border border-[#666666] px-2 py-1.5 font-medium whitespace-nowrap ${
                          idx === 0 ? 'w-[26%]' : 'w-[14.8%]'
                        }`}
                      >
                        <EditableText
                          value={col}
                          darkSurface
                          readOnly={readOnly}
                          className="whitespace-nowrap"
                          onChange={(v) => {
                            const next = [...config.pdf1Page1Columns] as [
                              string,
                              string,
                              string,
                              string,
                              string,
                              string
                            ];
                            next[idx] = v;
                            onUpdateConfig({ pdf1Page1Columns: next });
                          }}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((doc) => (
                    <tr
                      key={doc.id}
                      className="group bg-[#F2F2F2] hover:bg-[#EAEAEA] text-black h-[54px] transition-colors"
                    >
                      <td className="border border-[#7F7F7F] px-2 py-1.5 text-[15.5px] font-medium relative whitespace-nowrap overflow-hidden text-ellipsis">
                        <EditableText
                          value={doc.fullName}
                          readOnly={readOnly}
                          className="whitespace-nowrap"
                          onChange={(v) => onUpdateStaffField(doc.id, 'fullName', v)}
                        />
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => onDeleteStaff(doc.id)}
                            title="Supprimer cette ligne"
                            className="no-print opacity-0 group-hover:opacity-100 focus:opacity-100 absolute left-1 top-1/2 -translate-y-1/2 p-1 text-red-600 hover:bg-red-100 rounded transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                      {(
                        ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi'] as Array<
                          keyof DoctorWeeklySchedule
                        >
                      ).map((dayKey) => (
                        <td
                          key={dayKey}
                          className="border border-[#7F7F7F] px-1.5 py-1 text-[13.5px] leading-[1.25] font-medium align-middle"
                        >
                          <EditableText
                            value={doc.weeklySchedule[dayKey]}
                            multiline
                            readOnly={readOnly}
                            onChange={(v) => onUpdateDoctorWeekly(doc.id, dayKey, v)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Add Doctor Row Button (No-Print) */}
              {!readOnly && chunkIdx === doctorChunksP1.length - 1 && (
                <div className="no-print mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddDoctor}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-sans font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un mÃ©decin</span>
                  </button>
                </div>
              )}

              {/* Observation Box â€” Exact PDF reproduction */}
              <div className="mt-4 border border-black rounded-[4px] px-3.5 py-1.5 text-[14px] font-medium text-black bg-white flex items-center justify-between">
                <div className="flex-1">
                  <EditableText
                    value={config.pdf1Page1Obs || 'OBS : JournÃ©e de RCP tous les Mardis Ã  11 h'}
                    readOnly={readOnly}
                    onChange={(v) => onUpdateConfig({ pdf1Page1Obs: v })}
                  />
                </div>
              </div>
            </div>

            <OfficialPortraitFooter
              config={config}
              onUpdateConfig={onUpdateConfig}
              readOnly={readOnly}
              showOfficialStamp={showOfficialStamp}
              showQrCode={showQrCode}
              validationStatus={validationStatus}
            />
          </section>
        ))}

      {/* =====================================================================
          PDF 1 â€” PAGE 2: La liste du personnel mÃ©dical du mois d'Octobre 2026
         ===================================================================== */}
      {(activeSubPage === 'all' || activeSubPage === 'p2') &&
        doctorChunksP2.map((chunk, chunkIdx) => (
          <section
            key={`doc-p2-${chunkIdx}`}
            id={`doc-sheet-p2-${chunkIdx}`}
            aria-label={`PDF 1 Page 2 - Liste du personnel mÃ©dical ${
              chunkIdx > 0 ? `(Suite ${chunkIdx + 1})` : ''
            }`}
            className="a4-portrait-sheet shadow-xl border border-slate-300 p-[1.27cm] flex flex-col justify-between font-pdf scroll-mt-20"
          >
            <div>
              <OfficialPortraitHeader
                config={config}
                onUpdateConfig={onUpdateConfig}
                readOnly={readOnly}
              />

              {/* Title Block */}
              <div className="mt-12 mb-4 text-center">
                <h2 className="text-[16.5px] font-semibold tracking-tight text-black inline-flex items-center justify-center flex-wrap gap-1.5">
                  <EditableText
                    value={
                      chunkIdx === 0
                        ? config.pdf1Page2Title
                        : `${config.pdf1Page2Title} (Suite)`
                    }
                    readOnly={readOnly}
                    onChange={(v) => {
                      if (chunkIdx === 0) {
                        onUpdateConfig({ pdf1Page2Title: v });
                      }
                    }}
                  />
                  {isTableModificatif(config, 'pdf1Page2') && !/\(Modificatif\)/i.test(config.pdf1Page2Title) && (
                    <strong className="font-bold text-black font-pdf">
                      (Modificatif)
                    </strong>
                  )}
                  {chunkIdx > 0 && (
                    <span className="text-xs font-semibold text-slate-700 font-sans ml-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      Suite {chunkIdx + 1}/{doctorChunksP2.length} â€” MÃ©decins {chunkIdx * 12 + 1} Ã {' '}
                      {Math.min((chunkIdx + 1) * 12, doctors.length)}
                    </span>
                  )}
                </h2>
                {!readOnly && onToggleTableModificatif && chunkIdx === 0 && (
                  <div className="no-print mt-1.5 flex justify-center">
                    <button
                      type="button"
                      onClick={() => onToggleTableModificatif('pdf1Page2')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-bold transition-all border shadow-2xs ${
                        isTableModificatif(config, 'pdf1Page2')
                          ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                      }`}
                      title="Activer ou dÃ©sactiver (Modificatif) sur ce tableau"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isTableModificatif(config, 'pdf1Page2') ? 'bg-amber-600' : 'bg-slate-400'}`} />
                      <span>Modificatif : {isTableModificatif(config, 'pdf1Page2') ? 'Oui' : 'Non'}</span>
                    </button>
                  </div>
                )}
                <div className="text-[14px] font-medium text-black mt-1.5">
                  <EditableText
                    value={config.pdf1Page2Subtitle}
                    readOnly={readOnly}
                    onChange={(v) => onUpdateConfig({ pdf1Page2Subtitle: v })}
                  />
                </div>
              </div>

              {/* Medical Staff List Table */}
              <table className="w-full border-collapse border border-[#7F7F7F] text-center table-fixed">
                <thead>
                  <tr className="bg-[#D9D9D9] text-black text-[14px] font-medium h-[36px]">
                    {config.pdf1Page2Columns.map((col, idx) => (
                      <th
                        key={idx}
                        className={`border border-[#7F7F7F] px-2 py-1 font-medium whitespace-nowrap overflow-hidden text-ellipsis ${
                          idx === 0 ? 'w-[30%]' : idx === 1 ? 'w-[48%]' : 'w-[22%]'
                        }`}
                      >
                        <EditableText
                          value={col}
                          readOnly={readOnly}
                          className="whitespace-nowrap"
                          onChange={(v) => {
                            const next = [...config.pdf1Page2Columns] as [
                              string,
                              string,
                              string
                            ];
                            next[idx] = v;
                            onUpdateConfig({ pdf1Page2Columns: next });
                          }}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((doc) => (
                    <tr
                      key={doc.id}
                      className="group bg-[#F9F9F9] hover:bg-[#F0F0F0] text-black h-[36px] text-[13.5px] font-medium transition-colors"
                    >
                      <td className="border border-[#7F7F7F] px-2 py-1 relative whitespace-nowrap overflow-hidden text-ellipsis align-middle">
                        <EditableText
                          value={doc.fullName}
                          readOnly={readOnly}
                          className="whitespace-nowrap"
                          onChange={(v) => onUpdateStaffField(doc.id, 'fullName', v)}
                        />
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => onDeleteStaff(doc.id)}
                            title="Supprimer cette ligne"
                            className="no-print opacity-0 group-hover:opacity-100 focus:opacity-100 absolute left-1 top-1/2 -translate-y-1/2 p-1 text-red-600 hover:bg-red-100 rounded transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                      <td className="border border-[#7F7F7F] px-2 py-1 whitespace-nowrap overflow-hidden text-ellipsis align-middle">
                        <EditableText
                          value={doc.rolePortrait}
                          readOnly={readOnly}
                          className="whitespace-nowrap"
                          onChange={(v) => onUpdateStaffField(doc.id, 'rolePortrait', v)}
                        />
                      </td>
                      <td className="border border-[#7F7F7F] px-2 py-1 whitespace-nowrap overflow-hidden text-ellipsis align-middle">
                        <EditableText
                          value={doc.obsPortrait}
                          readOnly={readOnly}
                          className="whitespace-nowrap"
                          onChange={(v) => onUpdateStaffField(doc.id, 'obsPortrait', v)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!readOnly && chunkIdx === doctorChunksP2.length - 1 && (
                <div className="no-print mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddDoctor}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-sans font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter un mÃ©decin</span>
                  </button>
                </div>
              )}
            </div>

            <OfficialPortraitFooter
              config={config}
              onUpdateConfig={onUpdateConfig}
              readOnly={readOnly}
              showOfficialStamp={showOfficialStamp}
              showQrCode={showQrCode}
              validationStatus={validationStatus}
            />
          </section>
        ))}

      {/* =====================================================================
          PDF 1 â€” PAGE 3: Planning du Personnel ParamÃ©dical du Mois
         ===================================================================== */}
      {(activeSubPage === 'all' || activeSubPage === 'p3') && (
        <section
          id="doc-sheet-p3"
          aria-label="PDF 1 Page 3 - Planning du Personnel ParamÃ©dical"
          className="a4-portrait-sheet shadow-xl border border-slate-300 p-[1.27cm] flex flex-col justify-between font-pdf scroll-mt-20"
        >
          <div>
            <OfficialPortraitHeader config={config} onUpdateConfig={onUpdateConfig} readOnly={readOnly} compact={true} />

            {/* Title Block */}
            <div className="mt-3 mb-2 text-center">
              <h2 className="text-[16.5px] font-semibold tracking-tight text-black inline-flex items-center justify-center flex-wrap gap-1.5">
                <EditableText
                  value={config.pdf1Page3Title}
                  readOnly={readOnly}
                  onChange={(v) => onUpdateConfig({ pdf1Page3Title: v })}
                />
                {isTableModificatif(config, 'pdf1Page3') && !/\(Modificatif\)/i.test(config.pdf1Page3Title) && (
                  <strong className="font-bold text-black font-pdf">
                    (Modificatif)
                  </strong>
                )}
              </h2>
              {!readOnly && onToggleTableModificatif && (
                <div className="no-print mt-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => onToggleTableModificatif('pdf1Page3')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-bold transition-all border shadow-2xs ${
                      isTableModificatif(config, 'pdf1Page3')
                        ? 'bg-amber-100 text-amber-900 border-amber-400 hover:bg-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                    }`}
                    title="Activer ou dÃ©sactiver (Modificatif) sur ce tableau"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isTableModificatif(config, 'pdf1Page3') ? 'bg-amber-600' : 'bg-slate-400'}`} />
                    <span>Modificatif : {isTableModificatif(config, 'pdf1Page3') ? 'Oui' : 'Non'}</span>
                  </button>
                </div>
              )}
            </div>

            {!readOnly && (onOpenLeaveTypesModal || onOpenGuardRotationModal || onOpenMaternityModal) && (
              <div className="no-print mb-2 flex items-center justify-end gap-2 text-xs flex-wrap">
                {onOpenMaternityModal && (
                  <button
                    type="button"
                    onClick={() => {
                      const bakhouche = staffList.find((s) => s.fullName.toLowerCase().includes('bakhouche'));
                      onOpenMaternityModal(bakhouche || undefined);
                    }}
                    title="GÃ©rer le congÃ© de maternitÃ© (cellule fusionnÃ©e et OBS)"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 shadow-xs transition-colors"
                  >
                    <HeartHandshake className="w-3 h-3 text-rose-700" />
                    <span>CongÃ© MaternitÃ© (Fusion)</span>
                  </button>
                )}
                {onOpenLeaveTypesModal && (
                  <button
                    type="button"
                    onClick={onOpenLeaveTypesModal}
                    title="GÃ©rer, ajouter, modifier ou supprimer des types de congÃ©s"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-xs transition-colors"
                  >
                    <Tag className="w-3 h-3 text-amber-700" />
                    <span>GÃ©rer types congÃ©s / OBS</span>
                  </button>
                )}
                {onOpenGuardRotationModal && (
                  <button
                    type="button"
                    onClick={onOpenGuardRotationModal}
                    title="GÃ©rer la rotation des Ã©quipes (pÃ©riode ou perpÃ©tuelle)"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 shadow-xs transition-colors"
                  >
                    <Repeat className="w-3 h-3 text-sky-700" />
                    <span>Rotation des gardes</span>
                  </button>
                )}
              </div>
            )}

            {/* Paramedical Complete Table (08h-16h, 16h Groupes A-E, 12h) */}
            <table className="w-full border-collapse border border-black text-black text-[13.5px] table-fixed">
              <thead>
                <tr className="h-[26px] text-center font-medium border-b border-black">
                  <th className="border border-black w-[10%] px-1 whitespace-nowrap">
                    <EditableText
                      value={config.pdf1Page3Columns[0]}
                      readOnly={readOnly}
                      className="whitespace-nowrap"
                      onChange={(v) => {
                        const next = [...config.pdf1Page3Columns] as [
                          string,
                          string,
                          string,
                          string
                        ];
                        next[0] = v;
                        onUpdateConfig({ pdf1Page3Columns: next });
                      }}
                    />
                  </th>
                  <th className="border border-black w-[24%] px-2 whitespace-nowrap">
                    <EditableText
                      value={config.pdf1Page3Columns[1]}
                      readOnly={readOnly}
                      className="whitespace-nowrap"
                      onChange={(v) => {
                        const next = [...config.pdf1Page3Columns] as [
                          string,
                          string,
                          string,
                          string
                        ];
                        next[1] = v;
                        onUpdateConfig({ pdf1Page3Columns: next });
                      }}
                    />
                  </th>
                  <th className="border border-black w-[30%] px-2 whitespace-nowrap">
                    <EditableText
                      value={config.pdf1Page3Columns[2]}
                      readOnly={readOnly}
                      className="whitespace-nowrap"
                      onChange={(v) => {
                        const next = [...config.pdf1Page3Columns] as [
                          string,
                          string,
                          string,
                          string
                        ];
                        next[2] = v;
                        onUpdateConfig({ pdf1Page3Columns: next });
                      }}
                    />
                  </th>
                  <th className="border border-black w-[36%] px-2 whitespace-nowrap">
                    <EditableText
                      value={config.pdf1Page3Columns[3]}
                      readOnly={readOnly}
                      className="whitespace-nowrap"
                      onChange={(v) => {
                        const next = [...config.pdf1Page3Columns] as [
                          string,
                          string,
                          string,
                          string
                        ];
                        next[3] = v;
                        onUpdateConfig({ pdf1Page3Columns: next });
                      }}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* ---------------- BLOCK 1: 08h-16h ---------------- */}
                {paramedicalDay.map((staff, idx) => (
                  <tr
                    key={staff.id}
                    className={`group h-[19px] leading-tight hover:bg-amber-50/40 ${
                      idx === paramedicalDay.length - 1 ? 'border-b border-black' : ''
                    }`}
                  >
                    {idx === 0 && (
                      <td
                        rowSpan={Math.max(1, paramedicalDay.length)}
                        className="border border-black text-center align-middle font-medium text-[14px] relative"
                      >
                        <span>08h-16h</span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={handleAddParamedicalDay}
                            title="Ajouter un agent 08h-16h"
                            className="no-print block mx-auto mt-1 p-0.5 text-slate-600 hover:text-black hover:bg-slate-200 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    )}
                    <td className="border border-black px-1.5 py-[1px] font-medium relative whitespace-nowrap overflow-hidden text-ellipsis max-w-0">
                      <EditableText
                        value={staff.fullName}
                        readOnly={readOnly}
                        className="whitespace-nowrap"
                        onChange={(v) => onUpdateStaffField(staff.id, 'fullName', v)}
                      />
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => onDeleteStaff(staff.id)}
                          title="Supprimer"
                          className="no-print opacity-0 group-hover:opacity-100 absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                    <td className="border border-black px-1.5 py-[1px] font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-0">
                      <EditableText
                        value={staff.rolePortrait}
                        readOnly={readOnly}
                        className="whitespace-nowrap"
                        onChange={(v) => onUpdateStaffField(staff.id, 'rolePortrait', v)}
                      />
                    </td>
                    <td className="border border-black px-1.5 py-[1px] text-center font-medium relative group/obs">
                      <EditableText
                        value={staff.obsPortrait}
                        readOnly={readOnly}
                        onChange={(v) => onUpdateStaffField(staff.id, 'obsPortrait', v)}
                      />
                      {!readOnly && (
                        <LeavePickerButton
                          leaveTypes={config.leaveTypes ?? DEFAULT_LEAVE_TYPES}
                          onSelect={(leaveText) => onUpdateStaffField(staff.id, 'obsPortrait', leaveText)}
                          onOpenLeaveTypesModal={onOpenLeaveTypesModal}
                          onOpenMaternityModal={() => onOpenMaternityModal && onOpenMaternityModal(staff)}
                        />
                      )}
                    </td>
                  </tr>
                ))}

                {/* ---------------- BLOCK 2: 16h (Groupes A, B, C, D, E) ---------------- */}
                {(() => {
                  let renderedFirstRowOf16h = false;
                  const rows: React.ReactNode[] = [];

                  guardGroups.forEach((groupLetter, gIdx) => {
                    const groupMembers = paramedicalGuard.filter(
                      (s) => s.teamGroup === groupLetter
                    );
                    const isFirst16hRow = !renderedFirstRowOf16h;
                    renderedFirstRowOf16h = true;

                    // Black Group Header Row ("Groupe A", "Groupe B", etc.)
                    rows.push(
                      <tr key={`group-header-${groupLetter}`} className="h-[19px] leading-tight">
                        {isFirst16hRow && (
                          <td
                            rowSpan={Math.max(1, total16hRows)}
                            className="border border-black text-center align-middle font-medium text-[14px]"
                          >
                            <span>16h</span>
                            {!readOnly && onOpenGuardRotationModal && (
                              <button
                                type="button"
                                onClick={onOpenGuardRotationModal}
                                title="GÃ©rer la rotation des Ã©quipes de garde (pÃ©riode ou perpÃ©tuelle)"
                                className="no-print block mx-auto mt-1 p-0.5 text-sky-800 hover:text-black hover:bg-sky-100 rounded"
                              >
                                <Repeat className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        )}
                        <td className="bg-black text-white text-center font-medium py-[1px] px-1.5 border border-black relative">
                          <span>Groupe {groupLetter}</span>
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() => handleAddGuardMember(groupLetter)}
                              title={`Ajouter dans Groupe ${groupLetter}`}
                              className="no-print absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-white/80 hover:text-white hover:bg-white/20 rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                        <td className="border border-black px-1.5 py-[1px]"></td>
                        <td className="border border-black px-1.5 py-[1px] text-center font-medium text-[11px] text-neutral-500">
                          {isFirst16hRow && config.pdf1Page3Obs16h ? (
                            <EditableText
                              value={config.pdf1Page3Obs16h}
                              readOnly={readOnly}
                              onChange={(v) => onUpdateConfig({ pdf1Page3Obs16h: v })}
                            />
                          ) : (
                            <span></span>
                          )}
                        </td>
                      </tr>
                    );

                    // Group Member Rows
                    groupMembers.forEach((member, mIdx) => {
                      const isVeryLast16hRow =
                        gIdx === guardGroups.length - 1 && mIdx === groupMembers.length - 1;
                      rows.push(
                        <tr
                          key={member.id}
                          className={`group h-[19px] leading-tight hover:bg-amber-50/40 ${
                            isVeryLast16hRow ? 'border-b border-black' : ''
                          }`}
                        >
                          <td className="border border-black px-1.5 py-[1px] font-medium relative whitespace-nowrap overflow-hidden text-ellipsis max-w-0">
                            <EditableText
                              value={member.fullName}
                              readOnly={readOnly}
                              className="whitespace-nowrap"
                              onChange={(v) => onUpdateStaffField(member.id, 'fullName', v)}
                            />
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => onDeleteStaff(member.id)}
                                title="Supprimer"
                                className="no-print opacity-0 group-hover:opacity-100 absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-red-600 hover:bg-red-100 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                          <td className="border border-black px-1.5 py-[1px] font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-0">
                            <EditableText
                              value={member.rolePortrait}
                              readOnly={readOnly}
                              className="whitespace-nowrap"
                              onChange={(v) => onUpdateStaffField(member.id, 'rolePortrait', v)}
                            />
                          </td>
                          <td className="border border-black px-1.5 py-[1px] text-center font-medium relative group/obs">
                            <EditableText
                              value={member.obsPortrait}
                              readOnly={readOnly}
                              onChange={(v) => onUpdateStaffField(member.id, 'obsPortrait', v)}
                            />
                            {!readOnly && (
                              <LeavePickerButton
                                leaveTypes={config.leaveTypes ?? DEFAULT_LEAVE_TYPES}
                                onSelect={(leaveText) => onUpdateStaffField(member.id, 'obsPortrait', leaveText)}
                                onOpenLeaveTypesModal={onOpenLeaveTypesModal}
                                onOpenMaternityModal={() => onOpenMaternityModal && onOpenMaternityModal(member)}
                              />
                            )}
                          </td>
                        </tr>
                      );
                    });
                  });

                  return rows;
                })()}

                {/* ---------------- BLOCK 3: 12h (Agents d'hygiÃ¨ne) ---------------- */}
                {hygieneStaff.map((staff, idx) => (
                  <tr
                    key={staff.id}
                    className="group h-[19px] leading-tight hover:bg-amber-50/40"
                  >
                    {idx === 0 && (
                      <td
                        rowSpan={Math.max(1, hygieneStaff.length)}
                        className="border border-black text-center align-middle font-medium text-[14px]"
                      >
                        <span>12h</span>
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={handleAddHygieneMember}
                            title="Ajouter un agent 12h"
                            className="no-print block mx-auto mt-0.5 p-0.5 text-slate-600 hover:text-black hover:bg-slate-200 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    )}
                    <td className="border border-black px-1.5 py-[1px] font-medium relative whitespace-nowrap overflow-hidden text-ellipsis max-w-0">
                      <EditableText
                        value={staff.fullName}
                        readOnly={readOnly}
                        className="whitespace-nowrap"
                        onChange={(v) => onUpdateStaffField(staff.id, 'fullName', v)}
                      />
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => onDeleteStaff(staff.id)}
                          title="Supprimer"
                          className="no-print opacity-0 group-hover:opacity-100 absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                    <td className="border border-black px-1.5 py-[1px] font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-0">
                      <EditableText
                        value={staff.rolePortrait}
                        readOnly={readOnly}
                        className="whitespace-nowrap"
                        onChange={(v) => onUpdateStaffField(staff.id, 'rolePortrait', v)}
                      />
                    </td>
                    <td className="border border-black px-1.5 py-[1px] text-center font-medium relative group/obs">
                      <EditableText
                        value={staff.obsPortrait}
                        readOnly={readOnly}
                        onChange={(v) => onUpdateStaffField(staff.id, 'obsPortrait', v)}
                      />
                      {!readOnly && (
                        <LeavePickerButton
                          leaveTypes={config.leaveTypes ?? DEFAULT_LEAVE_TYPES}
                          onSelect={(leaveText) => onUpdateStaffField(staff.id, 'obsPortrait', leaveText)}
                          onOpenLeaveTypesModal={onOpenLeaveTypesModal}
                          onOpenMaternityModal={() => onOpenMaternityModal && onOpenMaternityModal(staff)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Note N.B. placÃ©e directement avec et sous le tableau comme les autres tableaux */}
            {config.nbNotice && (
              <div className="mt-2 text-[11.5px] font-medium text-left leading-normal text-black">
                <EditableText
                  value={config.nbNotice}
                  readOnly={readOnly}
                  onChange={(v) => onUpdateConfig({ nbNotice: v })}
                />
              </div>
            )}
          </div>

          <OfficialPortraitFooter
            config={config}
            onUpdateConfig={onUpdateConfig}
            readOnly={readOnly}
            compact={true}
            showNb={false}
            showOfficialStamp={showOfficialStamp}
            showQrCode={showQrCode}
            validationStatus={validationStatus}
          />
        </section>
      )}
    </div>
  );
};
