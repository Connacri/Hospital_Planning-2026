import React, { useState } from 'react';
import { Plus, Trash2, PaintBucket, Repeat, Tag, HeartHandshake } from 'lucide-react';
import {
  HospitalDocumentConfig,
  StaffEntity,
  buildStandard08h16hActivity,
  buildGuard16hActivity,
  buildHygiene12hActivity,
  getStaffMaternitySpan,
} from '../db/objectboxEngine';
import { EditableText } from './EditableText';
import { OfficialHospitalStamp, OfficialHospitalQrCode } from './OfficialStampAndQr';
import { ValidationStatus } from './DocumentValidationModal';

interface LandscapePdfSheetsProps {
  activeSubPage: 'all' | 'p1' | 'p2' | 'p3' | 'p4' | 'p5';
  config: HospitalDocumentConfig;
  staffList: StaffEntity[];
  activePaintCode: string | null;
  readOnly?: boolean;
  validationStatus?: ValidationStatus;
  showOfficialStamp?: boolean;
  showQrCode?: boolean;
  onUpdateConfig: (partial: Partial<HospitalDocumentConfig>) => void;
  onUpdateStaffField: <K extends keyof StaffEntity>(id: number, field: K, value: StaffEntity[K]) => void;
  onUpdateStaffDayCell: (id: number, day: number, code: string) => void;
  onAddStaff: (entity: Omit<StaffEntity, 'id'>) => void;
  onDeleteStaff: (id: number) => void;
  onOpenGuardRotationModal?: () => void;
  onOpenLeaveTypesModal?: () => void;
  onOpenMaternityModal?: (staff?: StaffEntity) => void;
}

const OfficialLandscapeHeader: React.FC<{
  config: HospitalDocumentConfig;
  onUpdateConfig: (partial: Partial<HospitalDocumentConfig>) => void;
  compact?: boolean;
  readOnly?: boolean;
}> = ({ config, onUpdateConfig, compact = false, readOnly = false }) => (
  <div className="font-pdf text-black">
    <div className="text-center leading-tight">
      <div className={`${compact ? 'text-[17px]' : 'text-[19px]'} font-semibold tracking-tight`}>
        <EditableText
          value={config.republicHeader}
          readOnly={readOnly}
          onChange={(v) => onUpdateConfig({ republicHeader: v })}
        />
      </div>
      <div className={`${compact ? 'text-[13px]' : 'text-[14.5px]'} font-medium tracking-tight mt-0.5`}>
        <EditableText
          value={config.ministryHeader}
          readOnly={readOnly}
          onChange={(v) => onUpdateConfig({ ministryHeader: v })}
        />
      </div>
      <div className={`${compact ? 'text-[13px]' : 'text-[14.5px]'} font-medium mt-0.5`}>
        <EditableText
          value={config.hospitalHeader}
          readOnly={readOnly}
          onChange={(v) => onUpdateConfig({ hospitalHeader: v })}
        />
      </div>
    </div>
    <div className={`${compact ? 'mt-2 text-[14px]' : 'mt-6 text-[15.5px]'} font-medium`}>
      <EditableText
        value={config.unitTitle}
        readOnly={readOnly}
        onChange={(v) => onUpdateConfig({ unitTitle: v })}
      />
    </div>
  </div>
);

const OfficialLandscapeLegendAndFooter: React.FC<{
  config: HospitalDocumentConfig;
  onUpdateConfig: (partial: Partial<HospitalDocumentConfig>) => void;
  showNb?: boolean;
  showSignatures?: boolean;
  readOnly?: boolean;
  showOfficialStamp?: boolean;
  showQrCode?: boolean;
  validationStatus?: ValidationStatus;
  onOpenLeaveTypesModal?: () => void;
}> = ({
  config,
  onUpdateConfig,
  showNb = true,
  showSignatures = true,
  readOnly = false,
  showOfficialStamp = false,
  showQrCode = false,
  validationStatus = 'draft',
  onOpenLeaveTypesModal,
}) => {
  const sigs = config.signaturesLandscape;
  const updateSig = (idx: 0 | 1 | 2 | 3, val: string) => {
    const next: [string, string, string, string] = [...sigs] as [string, string, string, string];
    next[idx] = val;
    onUpdateConfig({ signaturesLandscape: next });
  };

  const updateLegendItem = (idx: number, val: string) => {
    const next = [...config.legendItems];
    next[idx] = val;
    onUpdateConfig({ legendItems: next });
  };

  return (
    <div className="font-pdf text-black mt-2">
      {/* Legend Row + QR Code + Fait à Aïn el Türck */}
      <div className="flex items-center justify-between text-[13.5px] font-medium">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {showQrCode && (
            <div className="mr-2">
              <OfficialHospitalQrCode
                status={validationStatus}
                monthName={config.guardMonthName || "Mois d'Octobre 2026"}
              />
            </div>
          )}
          {config.legendItems.map((item, idx) => (
            <EditableText
              key={idx}
              value={item}
              readOnly={readOnly}
              onChange={(v) => updateLegendItem(idx, v)}
            />
          ))}
          {!readOnly && onOpenLeaveTypesModal && (
            <button
              type="button"
              onClick={onOpenLeaveTypesModal}
              title="Ajouter, modifier ou supprimer des types de congés"
              className="no-print inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-sans font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors"
            >
              <Tag className="w-3 h-3 text-amber-700" />
              <span>Gérer les congés</span>
            </button>
          )}
        </div>
        <div className="shrink-0 pl-4">
          <EditableText
            value={config.cityDateLandscape}
            readOnly={readOnly}
            onChange={(v) => onUpdateConfig({ cityDateLandscape: v })}
          />
        </div>
      </div>

      {/* N.B Notice placed directly under the table */}
      {showNb && (
        <div className="mt-1 text-[11.5px] font-medium">
          <EditableText
            value={config.nbNotice}
            readOnly={readOnly}
            onChange={(v) => onUpdateConfig({ nbNotice: v })}
          />
        </div>
      )}

      {/* Signatures Row */}
      {showSignatures && (
        <div className="grid grid-cols-4 text-center text-[13px] font-medium mt-2 pb-0.5">
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
      )}
    </div>
  );
};

interface ActivityGridTableProps {
  rows: StaffEntity[];
  showTeamColumn: boolean;
  config: HospitalDocumentConfig;
  activePaintCode: string | null;
  compactRows?: boolean;
  readOnly?: boolean;
  onUpdateConfig: (partial: Partial<HospitalDocumentConfig>) => void;
  onUpdateStaffField: <K extends keyof StaffEntity>(id: number, field: K, value: StaffEntity[K]) => void;
  onUpdateStaffDayCell: (id: number, day: number, code: string) => void;
  onDeleteStaff: (id: number) => void;
  onOpenMaternityModal?: (staff?: StaffEntity) => void;
}

const ActivityGridTable: React.FC<ActivityGridTableProps> = ({
  rows,
  showTeamColumn,
  config,
  activePaintCode,
  compactRows = false,
  readOnly = false,
  onUpdateConfig,
  onUpdateStaffField,
  onUpdateStaffDayCell,
  onDeleteStaff,
  onOpenMaternityModal,
}) => {
  const [isMouseDown, setIsMouseDown] = useState(false);

  const toggleDayBlackColumn = (dayNumber: number) => {
    const nextCols = config.daysColumns.map((col) =>
      col.day === dayNumber ? { ...col, isBlackColumn: !col.isBlackColumn } : col
    );
    onUpdateConfig({ daysColumns: nextCols });
  };

  const updateDayDowLabel = (dayNumber: number, newDow: string) => {
    const nextCols = config.daysColumns.map((col) =>
      col.day === dayNumber ? { ...col, dow: newDow } : col
    );
    onUpdateConfig({ daysColumns: nextCols });
  };

  const rowHeightClass = compactRows ? 'h-[17px] text-[11px] leading-tight' : 'h-[25px] text-[12.5px]';

  return (
    <div
      onMouseLeave={() => setIsMouseDown(false)}
      onMouseUp={() => setIsMouseDown(false)}
      className="w-full select-none"
    >
      <table className="w-full border-collapse border border-[#B5B5B5] text-center font-pdf">
        <thead>
          <tr className={`${compactRows ? 'h-[24px]' : 'h-[32px]'} text-[11.5px] leading-[1.1]`}>
            <th className={`border border-[#B5B5B5] bg-gradient-to-b from-[#F5F5F5] via-[#E2E2E2] to-[#D4D4D4] text-black font-medium ${showTeamColumn ? 'w-[15%]' : 'w-[16.5%]'} px-1 whitespace-nowrap`}>
              <EditableText
                value={config.pdf2NameColHeader}
                readOnly={readOnly}
                className="whitespace-nowrap"
                onChange={(v) => onUpdateConfig({ pdf2NameColHeader: v })}
              />
            </th>
            <th className={`border border-[#B5B5B5] bg-gradient-to-b from-[#F5F5F5] via-[#E2E2E2] to-[#D4D4D4] text-black font-medium ${showTeamColumn ? 'w-[11.5%]' : 'w-[12.5%]'} px-1 whitespace-nowrap`}>
              <EditableText
                value={config.pdf2GradeColHeader}
                readOnly={readOnly}
                className="whitespace-nowrap"
                onChange={(v) => onUpdateConfig({ pdf2GradeColHeader: v })}
              />
            </th>
            {showTeamColumn && (
              <th className="border border-[#B5B5B5] bg-gradient-to-b from-[#F5F5F5] via-[#E2E2E2] to-[#D4D4D4] text-black font-medium w-[3.5%] px-0.5 whitespace-nowrap">
                <EditableText
                  value={config.pdf2TeamColHeader}
                  readOnly={readOnly}
                  className="whitespace-nowrap"
                  onChange={(v) => onUpdateConfig({ pdf2TeamColHeader: v })}
                />
              </th>
            )}
            {config.daysColumns.map((col) => (
              <th
                key={col.day}
                className={`group/th border border-[#B5B5B5] font-medium px-0.5 relative ${
                  col.isBlackColumn
                    ? 'bg-black text-white border-black'
                    : 'bg-gradient-to-b from-[#F5F5F5] via-[#E2E2E2] to-[#D4D4D4] text-black'
                }`}
              >
                <div className="tabular-nums text-[11.5px] font-semibold leading-none">
                  {col.day}
                </div>
                <div className="text-[10.5px] leading-none mt-0.5">
                  <EditableText
                    value={col.dow}
                    darkSurface={col.isBlackColumn}
                    readOnly={readOnly}
                    onChange={(v) => updateDayDowLabel(col.day, v)}
                  />
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => toggleDayBlackColumn(col.day)}
                    title="Basculer colonne noire (Week-end)"
                    className="no-print opacity-0 group-hover/th:opacity-100 absolute -top-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white rounded-full p-0.5 shadow"
                  >
                    <PaintBucket className="w-2.5 h-2.5" />
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((staff) => (
            <tr
              key={staff.id}
              className={`group ${rowHeightClass} font-medium transition-colors`}
            >
              {/* Nom et Prénom */}
              <td className="border border-[#CCCCCC] bg-white text-black px-1.5 relative whitespace-nowrap overflow-hidden text-ellipsis max-w-0">
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
                    title="Supprimer cette ligne"
                    className="no-print opacity-0 group-hover:opacity-100 absolute left-0.5 top-1/2 -translate-y-1/2 p-0.5 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </td>

              {/* Grade */}
              <td className="border border-[#CCCCCC] bg-white text-black px-1 leading-[1.1] text-[11px] align-middle whitespace-nowrap overflow-hidden text-ellipsis max-w-0">
                <EditableText
                  value={staff.gradeLandscape}
                  readOnly={readOnly}
                  className="whitespace-nowrap"
                  onChange={(v) => onUpdateStaffField(staff.id, 'gradeLandscape', v)}
                />
              </td>

              {/* Équipe (only on Page 3 - 16h) */}
              {showTeamColumn && (
                <td className="border border-[#CCCCCC] bg-white text-black px-0.5 font-semibold">
                  <EditableText
                    value={staff.teamGroup}
                    readOnly={readOnly}
                    onChange={(v) => onUpdateStaffField(staff.id, 'teamGroup', v)}
                  />
                </td>
              )}

              {/* 30/31 Days Cells with Horizontally Merged Cells for Maternity Leave */}
              {(() => {
                const matSpan = getStaffMaternitySpan(staff, config.daysColumns);
                const cells: React.ReactNode[] = [];
                let cIdx = 0;

                while (cIdx < config.daysColumns.length) {
                  const col = config.daysColumns[cIdx];

                  // Check if this column starts a maternity leave merged span
                  if (matSpan && col.day === matSpan.startDay) {
                    let spanCount = 0;
                    let walkIdx = cIdx;
                    while (
                      walkIdx < config.daysColumns.length &&
                      config.daysColumns[walkIdx].day <= matSpan.endDay
                    ) {
                      spanCount++;
                      walkIdx++;
                    }

                    cells.push(
                      <td
                        key={`mat-merged-${staff.id}-${col.day}`}
                        colSpan={spanCount}
                        onClick={() => {
                          if (!readOnly && onOpenMaternityModal) {
                            onOpenMaternityModal(staff);
                          }
                        }}
                        className={`border border-[#CCCCCC] bg-white text-black font-semibold text-[13px] text-center align-middle px-2 select-none tracking-normal ${
                          !readOnly ? 'cursor-pointer hover:bg-rose-50' : ''
                        }`}
                        title={`Congé de Maternité (Jours ${matSpan.startDay} à ${matSpan.endDay}) - Cellule fusionnée`}
                      >
                        <div className="flex items-center justify-center gap-1.5 py-0.5">
                          <span className="font-semibold text-black tracking-normal">
                            {matSpan.label || 'Congé de Maternité'}
                          </span>
                          {!readOnly && (
                            <span className="no-print text-[9px] text-rose-700 bg-rose-100 font-normal px-1 py-0.2 rounded border border-rose-200">
                              J{matSpan.startDay}-J{matSpan.endDay}
                            </span>
                          )}
                        </div>
                      </td>
                    );

                    cIdx = walkIdx;
                    continue;
                  }

                  // Standard Day Cell
                  const cellVal = staff.dailyActivity[col.day] ?? 'N';
                  const isBlack = col.isBlackColumn;

                  if (readOnly) {
                    cells.push(
                      <td
                        key={col.day}
                        className={`border px-0.5 select-none ${
                          isBlack
                            ? 'bg-black text-white border-[#222222]'
                            : 'bg-white text-black border-[#CCCCCC]'
                        }`}
                      >
                        <span>{cellVal}</span>
                      </td>
                    );
                  } else if (activePaintCode !== null) {
                    cells.push(
                      <td
                        key={col.day}
                        onMouseDown={() => {
                          setIsMouseDown(true);
                          onUpdateStaffDayCell(staff.id, col.day, activePaintCode);
                        }}
                        onMouseEnter={() => {
                          if (isMouseDown) {
                            onUpdateStaffDayCell(staff.id, col.day, activePaintCode);
                          }
                        }}
                        title={`Peindre "${activePaintCode}" (Jour ${col.day})`}
                        className={`border cursor-crosshair px-0.5 transition-transform active:scale-95 ${
                          isBlack
                            ? 'bg-black text-white border-[#333333] hover:bg-neutral-800'
                            : 'bg-white text-black border-[#CCCCCC] hover:bg-amber-100'
                        }`}
                      >
                        <span>{cellVal}</span>
                      </td>
                    );
                  } else {
                    cells.push(
                      <td
                        key={col.day}
                        className={`border px-0.5 ${
                          isBlack
                            ? 'bg-black text-white border-[#222222]'
                            : 'bg-white text-black border-[#CCCCCC]'
                        }`}
                      >
                        <EditableText
                          value={cellVal}
                          darkSurface={isBlack}
                          readOnly={readOnly}
                          onChange={(v) => onUpdateStaffDayCell(staff.id, col.day, v)}
                        />
                      </td>
                    );
                  }

                  cIdx++;
                }

                return cells;
              })()}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const LandscapePdfSheets: React.FC<LandscapePdfSheetsProps> = ({
  activeSubPage,
  config,
  staffList,
  activePaintCode,
  readOnly = false,
  validationStatus = 'draft',
  showOfficialStamp = false,
  showQrCode = false,
  onUpdateConfig,
  onUpdateStaffField,
  onUpdateStaffDayCell,
  onAddStaff,
  onDeleteStaff,
  onOpenGuardRotationModal,
  onOpenLeaveTypesModal,
  onOpenMaternityModal,
}) => {
  const medicalRows = staffList
    .filter((s) => s.category === 'medical')
    .sort((a, b) => a.landscapeOrder - b.landscapeOrder || a.id - b.id);

  const paramedicalDayRows = staffList
    .filter((s) => s.category === 'paramedical_day')
    .sort((a, b) => a.landscapeOrder - b.landscapeOrder || a.id - b.id);

  const paramedicalGuardRows = staffList
    .filter((s) => s.category === 'paramedical_guard')
    .sort((a, b) => a.landscapeOrder - b.landscapeOrder || a.id - b.id);

  const hygieneRows = staffList
    .filter((s) => s.category === 'hygiene')
    .sort((a, b) => a.landscapeOrder - b.landscapeOrder || a.id - b.id);

  const emptyWeekly = {
    dimanche: 'SERVICE',
    lundi: 'SERVICE',
    mardi: 'SERVICE',
    mercredi: 'SERVICE',
    jeudi: 'SERVICE',
  };

  const chunkArray = <T,>(items: T[], size: number): T[][] => {
    if (items.length === 0) return [[]];
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  };

  const medicalChunks = chunkArray(medicalRows, 12);
  const paramedicalDayChunks = chunkArray(paramedicalDayRows, 12);
  const paramedicalGuardChunks = chunkArray(paramedicalGuardRows, 14);
  const hygieneChunks = chunkArray(hygieneRows, 12);

  return (
    <div className="flex flex-col items-center gap-8 print-only-container">
      {/* =====================================================================
          PDF 2 — PAGE 1: TABLEAU D'ACTIVITÉ | 08h–16h — Personnel Médical
         ===================================================================== */}
      {(activeSubPage === 'all' || activeSubPage === 'p1') &&
        medicalChunks.map((chunk, chunkIdx) => (
          <section
            key={`med-page-${chunkIdx}`}
            aria-label={`PDF 2 Page 1 - Tableau d'activité Personnel Médical ${
              chunkIdx > 0 ? `(Suite ${chunkIdx + 1})` : ''
            }`}
            className="a4-landscape-sheet shadow-xl border border-slate-300 p-[1.27cm] flex flex-col justify-between font-pdf"
          >
            <div>
              <OfficialLandscapeHeader
                config={config}
                onUpdateConfig={onUpdateConfig}
                readOnly={readOnly}
              />

              <div className="mt-12 mb-2.5 text-center">
                <h2 className="text-[20px] font-semibold tracking-tight text-black inline-flex items-center justify-center flex-wrap gap-1.5">
                  <EditableText
                    value={
                      chunkIdx === 0
                        ? config.pdf2Page1Title
                        : `${config.pdf2Page1Title} (Suite)`
                    }
                    readOnly={readOnly}
                    onChange={(v) => {
                      if (chunkIdx === 0) {
                        onUpdateConfig({ pdf2Page1Title: v });
                      }
                    }}
                  />
                  {config.isModificatif && !/\(Modificatif\)/i.test(config.pdf2Page1Title) && (
                    <strong className="font-bold text-black font-pdf">
                      (Modificatif)
                    </strong>
                  )}
                  {chunkIdx > 0 && (
                    <span className="text-xs font-semibold text-slate-700 font-sans ml-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      Suite {chunkIdx + 1}/{medicalChunks.length} — Lignes {chunkIdx * 12 + 1} à{' '}
                      {Math.min((chunkIdx + 1) * 12, medicalRows.length)}
                    </span>
                  )}
                </h2>
              </div>

              <ActivityGridTable
                rows={chunk}
                showTeamColumn={false}
                config={config}
                activePaintCode={activePaintCode}
                readOnly={readOnly}
                onUpdateConfig={onUpdateConfig}
                onUpdateStaffField={onUpdateStaffField}
                onUpdateStaffDayCell={onUpdateStaffDayCell}
                onDeleteStaff={onDeleteStaff}
                onOpenMaternityModal={onOpenMaternityModal}
              />

              {!readOnly && chunkIdx === medicalChunks.length - 1 && (
                <div className="no-print mt-1.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onAddStaff({
                        fullName: 'Nouveau Médecin',
                        category: 'medical',
                        rolePortrait: 'Médecin Généraliste',
                        gradeLandscape: 'Médecin',
                        obsPortrait: '08h-16h',
                        horaireBlock: '08h-16h',
                        teamGroup: '',
                        portraitOrder: medicalRows.length + 1,
                        landscapeOrder: medicalRows.length + 1,
                        weeklySchedule: { ...emptyWeekly },
                        dailyActivity: buildStandard08h16hActivity(),
                      })
                    }
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-sans font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Ajouter ligne</span>
                  </button>
                </div>
              )}

              <OfficialLandscapeLegendAndFooter
                config={config}
                onUpdateConfig={onUpdateConfig}
                showNb
                showSignatures
                readOnly={readOnly}
                showOfficialStamp={showOfficialStamp}
                showQrCode={showQrCode}
                validationStatus={validationStatus}
                onOpenLeaveTypesModal={onOpenLeaveTypesModal}
              />
            </div>
          </section>
        ))}

      {/* =====================================================================
          PDF 2 — PAGE 2: TABLEAU D'ACTIVITÉ | 08h–16h (Paramédical Jour)
         ===================================================================== */}
      {(activeSubPage === 'all' || activeSubPage === 'p2') &&
        paramedicalDayChunks.map((chunk, chunkIdx) => (
          <section
            key={`pday-page-${chunkIdx}`}
            aria-label={`PDF 2 Page 2 - Tableau d'activité 08h-16h ${
              chunkIdx > 0 ? `(Suite ${chunkIdx + 1})` : ''
            }`}
            className="a4-landscape-sheet shadow-xl border border-slate-300 p-[1.27cm] flex flex-col justify-between font-pdf"
          >
            <div>
              <OfficialLandscapeHeader
                config={config}
                onUpdateConfig={onUpdateConfig}
                readOnly={readOnly}
              />

              <div className="mt-12 mb-2.5 text-center">
                <h2 className="text-[20px] font-semibold tracking-tight text-black inline-flex items-center justify-center flex-wrap gap-1.5">
                  <EditableText
                    value={
                      chunkIdx === 0
                        ? config.pdf2Page2Title
                        : `${config.pdf2Page2Title} (Suite)`
                    }
                    readOnly={readOnly}
                    onChange={(v) => {
                      if (chunkIdx === 0) {
                        onUpdateConfig({ pdf2Page2Title: v });
                      }
                    }}
                  />
                  {config.isModificatif && !/\(Modificatif\)/i.test(config.pdf2Page2Title) && (
                    <strong className="font-bold text-black font-pdf">
                      (Modificatif)
                    </strong>
                  )}
                  {chunkIdx > 0 && (
                    <span className="text-xs font-semibold text-slate-700 font-sans ml-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      Suite {chunkIdx + 1}/{paramedicalDayChunks.length} — Lignes {chunkIdx * 12 + 1} à{' '}
                      {Math.min((chunkIdx + 1) * 12, paramedicalDayRows.length)}
                    </span>
                  )}
                </h2>
              </div>

              <ActivityGridTable
                rows={chunk}
                showTeamColumn={false}
                config={config}
                activePaintCode={activePaintCode}
                readOnly={readOnly}
                onUpdateConfig={onUpdateConfig}
                onUpdateStaffField={onUpdateStaffField}
                onUpdateStaffDayCell={onUpdateStaffDayCell}
                onDeleteStaff={onDeleteStaff}
                onOpenMaternityModal={onOpenMaternityModal}
              />

              {!readOnly && chunkIdx === paramedicalDayChunks.length - 1 && (
                <div className="no-print mt-1.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onAddStaff({
                        fullName: 'Nouvel Agent 08h-16h',
                        category: 'paramedical_day',
                        rolePortrait: 'ATS',
                        gradeLandscape: 'ATS',
                        obsPortrait: '',
                        horaireBlock: '08h-16h',
                        teamGroup: '',
                        portraitOrder: paramedicalDayRows.length + 1,
                        landscapeOrder: paramedicalDayRows.length + 1,
                        weeklySchedule: { ...emptyWeekly },
                        dailyActivity: buildStandard08h16hActivity(),
                      })
                    }
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-sans font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Ajouter ligne</span>
                  </button>
                </div>
              )}

              <OfficialLandscapeLegendAndFooter
                config={config}
                onUpdateConfig={onUpdateConfig}
                showNb
                showSignatures
                readOnly={readOnly}
                showOfficialStamp={showOfficialStamp}
                showQrCode={showQrCode}
                validationStatus={validationStatus}
                onOpenLeaveTypesModal={onOpenLeaveTypesModal}
              />
            </div>
          </section>
        ))}

      {/* =====================================================================
          PDF 2 — PAGE 3: TABLEAU D'ACTIVITÉ | 16h (Équipes A, B, C, D, E)
         ===================================================================== */}
      {(activeSubPage === 'all' || activeSubPage === 'p3') &&
        paramedicalGuardChunks.map((chunk, chunkIdx) => (
          <section
            key={`pguard-page-${chunkIdx}`}
            aria-label={`PDF 2 Page 3 - Tableau d'activité 16h Équipes A-E ${
              chunkIdx > 0 ? `(Suite ${chunkIdx + 1})` : ''
            }`}
            className="a4-landscape-sheet shadow-xl border border-slate-300 p-[1.27cm] flex flex-col justify-between font-pdf"
          >
            <div>
              <OfficialLandscapeHeader
                config={config}
                onUpdateConfig={onUpdateConfig}
                compact
                readOnly={readOnly}
              />

              <div className="mt-1.5 mb-1 text-center">
                <h2 className="text-[17px] font-semibold tracking-tight text-black inline-flex items-center justify-center flex-wrap gap-1.5">
                  <EditableText
                    value={
                      chunkIdx === 0
                        ? config.pdf2Page3Title
                        : `${config.pdf2Page3Title} (Suite)`
                    }
                    readOnly={readOnly}
                    onChange={(v) => {
                      if (chunkIdx === 0) {
                        onUpdateConfig({ pdf2Page3Title: v });
                      }
                    }}
                  />
                  {config.isModificatif && !/\(Modificatif\)/i.test(config.pdf2Page3Title) && (
                    <strong className="font-bold text-black font-pdf">
                      (Modificatif)
                    </strong>
                  )}
                  {chunkIdx > 0 && (
                    <span className="text-xs font-semibold text-slate-700 font-sans ml-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      Suite {chunkIdx + 1}/{paramedicalGuardChunks.length} — Lignes {chunkIdx * 14 + 1} à{' '}
                      {Math.min((chunkIdx + 1) * 14, paramedicalGuardRows.length)}
                    </span>
                  )}
                </h2>
              </div>

              <ActivityGridTable
                rows={chunk}
                showTeamColumn={true}
                compactRows
                config={config}
                activePaintCode={activePaintCode}
                readOnly={readOnly}
                onUpdateConfig={onUpdateConfig}
                onUpdateStaffField={onUpdateStaffField}
                onUpdateStaffDayCell={onUpdateStaffDayCell}
                onDeleteStaff={onDeleteStaff}
                onOpenMaternityModal={onOpenMaternityModal}
              />

              {!readOnly && chunkIdx === paramedicalGuardChunks.length - 1 && (
                <div className="no-print mt-1.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {onOpenMaternityModal && (
                      <button
                        type="button"
                        onClick={() => {
                          const bakhouche = staffList.find((s) =>
                            s.fullName.toLowerCase().includes('bakhouche')
                          );
                          onOpenMaternityModal(bakhouche || undefined);
                        }}
                        title="Gérer le congé de maternité (cellule fusionnée J1-J26)"
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded shadow-xs transition-colors"
                      >
                        <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
                        <span>Congé de Maternité (Cellule Fusionnée)</span>
                      </button>
                    )}
                    {onOpenGuardRotationModal && (
                      <button
                        type="button"
                        onClick={onOpenGuardRotationModal}
                        title="Gérer la rotation des équipes (période ou perpétuelle)"
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-sans font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded shadow-xs transition-colors"
                      >
                        <Repeat className="w-3.5 h-3.5 text-sky-600" />
                        <span>Rotation des Équipes</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onAddStaff({
                        fullName: 'Nouvel Agent 16h',
                        category: 'paramedical_guard',
                        rolePortrait: 'ATS',
                        gradeLandscape: 'ATS',
                        obsPortrait: '',
                        horaireBlock: '16h',
                        teamGroup: 'A',
                        portraitOrder: paramedicalGuardRows.length + 1,
                        landscapeOrder: paramedicalGuardRows.length + 1,
                        weeklySchedule: { ...emptyWeekly },
                        dailyActivity: buildGuard16hActivity('A'),
                      })
                    }
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-sans font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Ajouter ligne</span>
                  </button>
                </div>
              )}

              <OfficialLandscapeLegendAndFooter
                config={config}
                onUpdateConfig={onUpdateConfig}
                showNb={true}
                showSignatures
                readOnly={readOnly}
                showOfficialStamp={showOfficialStamp}
                showQrCode={showQrCode}
                validationStatus={validationStatus}
                onOpenLeaveTypesModal={onOpenLeaveTypesModal}
              />
            </div>
          </section>
        ))}

      {/* =====================================================================
          PDF 2 — PAGE 4: TABLEAU D'ACTIVITÉ | Agents d'Hygiène — 12h
         ===================================================================== */}
      {(activeSubPage === 'all' || activeSubPage === 'p4' || (activeSubPage as string) === 'p5') &&
        hygieneChunks.map((chunk, chunkIdx) => (
          <section
            key={`hyg-page-${chunkIdx}`}
            aria-label={`PDF 2 Page 4 - Tableau d'activité Agents d'Hygiène 12h ${
              chunkIdx > 0 ? `(Suite ${chunkIdx + 1})` : ''
            }`}
            className="a4-landscape-sheet shadow-xl border border-slate-300 p-[1.27cm] flex flex-col justify-between font-pdf"
          >
            <div>
              <OfficialLandscapeHeader
                config={config}
                onUpdateConfig={onUpdateConfig}
                readOnly={readOnly}
              />

              <div className="mt-24 mb-3 text-center">
                <h2 className="text-[20px] font-semibold tracking-tight text-black inline-flex items-center justify-center flex-wrap gap-1.5">
                  <EditableText
                    value={
                      chunkIdx === 0
                        ? config.pdf2Page5Title
                        : `${config.pdf2Page5Title} (Suite)`
                    }
                    readOnly={readOnly}
                    onChange={(v) => {
                      if (chunkIdx === 0) {
                        onUpdateConfig({ pdf2Page5Title: v });
                      }
                    }}
                  />
                  {config.isModificatif && !/\(Modificatif\)/i.test(config.pdf2Page5Title) && (
                    <strong className="font-bold text-black font-pdf">
                      (Modificatif)
                    </strong>
                  )}
                  {chunkIdx > 0 && (
                    <span className="text-xs font-semibold text-slate-700 font-sans ml-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      Suite {chunkIdx + 1}/{hygieneChunks.length} — Lignes {chunkIdx * 12 + 1} à{' '}
                      {Math.min((chunkIdx + 1) * 12, hygieneRows.length)}
                    </span>
                  )}
                </h2>
              </div>

              <ActivityGridTable
                rows={chunk}
                showTeamColumn={false}
                config={config}
                activePaintCode={activePaintCode}
                readOnly={readOnly}
                onUpdateConfig={onUpdateConfig}
                onUpdateStaffField={onUpdateStaffField}
                onUpdateStaffDayCell={onUpdateStaffDayCell}
                onDeleteStaff={onDeleteStaff}
                onOpenMaternityModal={onOpenMaternityModal}
              />

              {!readOnly && chunkIdx === hygieneChunks.length - 1 && (
                <div className="no-print mt-1.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onAddStaff({
                        fullName: "Nouvel Agent d'Hygiène",
                        category: 'hygiene',
                        rolePortrait: "Agent d'hygiène",
                        gradeLandscape: "Agent d'hygiène",
                        obsPortrait: '',
                        horaireBlock: '12h',
                        teamGroup: '',
                        portraitOrder: hygieneRows.length + 1,
                        landscapeOrder: hygieneRows.length + 1,
                        weeklySchedule: { ...emptyWeekly },
                        dailyActivity: buildHygiene12hActivity(hygieneRows.length % 2 === 0),
                      })
                    }
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-sans font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Ajouter ligne</span>
                  </button>
                </div>
              )}

              <OfficialLandscapeLegendAndFooter
                config={config}
                onUpdateConfig={onUpdateConfig}
                showNb
                showSignatures
                readOnly={readOnly}
                showOfficialStamp={showOfficialStamp}
                showQrCode={showQrCode}
                validationStatus={validationStatus}
                onOpenLeaveTypesModal={onOpenLeaveTypesModal}
              />
            </div>
          </section>
        ))}
    </div>
  );
};
