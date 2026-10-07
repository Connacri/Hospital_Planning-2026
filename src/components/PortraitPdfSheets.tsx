import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  HospitalDocumentConfig,
  StaffEntity,
  DoctorWeeklySchedule,
  buildStandard08h16hActivity,
  buildGuard16hActivity,
  buildHygiene12hActivity,
} from '../db/objectboxEngine';
import { EditableText } from './EditableText';

interface PortraitPdfSheetsProps {
  activeSubPage: 'all' | 'p1' | 'p2' | 'p3';
  config: HospitalDocumentConfig;
  staffList: StaffEntity[];
  onUpdateConfig: (partial: Partial<HospitalDocumentConfig>) => void;
  onUpdateStaffField: <K extends keyof StaffEntity>(id: number, field: K, value: StaffEntity[K]) => void;
  onUpdateDoctorWeekly: (id: number, dayKey: keyof DoctorWeeklySchedule, value: string) => void;
  onAddStaff: (entity: Omit<StaffEntity, 'id'>) => void;
  onDeleteStaff: (id: number) => void;
}

const OfficialPortraitHeader: React.FC<{
  config: HospitalDocumentConfig;
  onUpdateConfig: (partial: Partial<HospitalDocumentConfig>) => void;
}> = ({ config, onUpdateConfig }) => (
  <div className="font-pdf text-black">
    <div className="text-center leading-tight">
      <div className="text-[15px] font-semibold tracking-tight">
        <EditableText
          value={config.republicHeader}
          onChange={(v) => onUpdateConfig({ republicHeader: v })}
        />
      </div>
      <div className="text-[13px] font-medium tracking-tight mt-0.5">
        <EditableText
          value={config.ministryHeader}
          onChange={(v) => onUpdateConfig({ ministryHeader: v })}
        />
      </div>
      <div className="text-[13px] font-medium mt-1">
        <EditableText
          value={config.hospitalHeader}
          onChange={(v) => onUpdateConfig({ hospitalHeader: v })}
        />
      </div>
    </div>
    <div className="mt-10 text-[13px] font-medium">
      <EditableText
        value={config.unitTitle}
        onChange={(v) => onUpdateConfig({ unitTitle: v })}
      />
    </div>
  </div>
);

const OfficialPortraitFooter: React.FC<{
  config: HospitalDocumentConfig;
  onUpdateConfig: (partial: Partial<HospitalDocumentConfig>) => void;
}> = ({ config, onUpdateConfig }) => {
  const sigs = config.signaturesPortrait;
  const updateSig = (idx: 0 | 1 | 2 | 3, val: string) => {
    const next: [string, string, string, string] = [...sigs] as [string, string, string, string];
    next[idx] = val;
    onUpdateConfig({ signaturesPortrait: next });
  };

  return (
    <div className="font-pdf text-black mt-auto pt-6">
      <div className="text-right text-[13px] font-medium pr-2 mb-5">
        <EditableText
          value={config.cityDatePortrait}
          onChange={(v) => onUpdateConfig({ cityDatePortrait: v })}
        />
      </div>
      <div className="grid grid-cols-4 text-center text-[13px] font-medium pb-4">
        <div>
          <EditableText value={sigs[0]} onChange={(v) => updateSig(0, v)} />
        </div>
        <div>
          <EditableText value={sigs[1]} onChange={(v) => updateSig(1, v)} />
        </div>
        <div>
          <EditableText value={sigs[2]} onChange={(v) => updateSig(2, v)} />
        </div>
        <div>
          <EditableText value={sigs[3]} onChange={(v) => updateSig(3, v)} />
        </div>
      </div>
    </div>
  );
};

export const PortraitPdfSheets: React.FC<PortraitPdfSheetsProps> = ({
  activeSubPage,
  config,
  staffList,
  onUpdateConfig,
  onUpdateStaffField,
  onUpdateDoctorWeekly,
  onAddStaff,
  onDeleteStaff,
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
      fullName: 'Nouveau Médecin',
      category: 'medical',
      rolePortrait: 'Médecin Généraliste',
      gradeLandscape: 'Médecin',
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
      fullName: "Nouvel Agent d'Hygiène",
      category: 'hygiene',
      rolePortrait: "Agent d'hygiène",
      gradeLandscape: "Agent d'hygiène",
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

  return (
    <div className="flex flex-col items-center gap-8 print-only-container">
      {/* =====================================================================
          PDF 1 — PAGE 1: Planning des Médecins « Mois d'Octobre 2026 »
         ===================================================================== */}
      {(activeSubPage === 'all' || activeSubPage === 'p1') && (
        <section
          aria-label="PDF 1 Page 1 - Planning des Médecins"
          className="a4-portrait-sheet shadow-xl border border-slate-300 px-[14mm] py-[14mm] flex flex-col justify-between font-pdf"
        >
          <div>
            <OfficialPortraitHeader config={config} onUpdateConfig={onUpdateConfig} />

            {/* Title Block */}
            <div className="mt-20 mb-4 text-center">
              <h2 className="text-[18px] font-semibold tracking-tight text-black">
                <EditableText
                  value={config.pdf1Page1Title}
                  onChange={(v) => onUpdateConfig({ pdf1Page1Title: v })}
                />
              </h2>
              <div className="text-[15px] font-medium text-black mt-1">
                <EditableText
                  value={config.pdf1Page1Subtitle}
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
                      className={`border border-[#666666] px-2 py-1.5 font-medium ${
                        idx === 0 ? 'w-[23.5%]' : 'w-[15.3%]'
                      }`}
                    >
                      <EditableText
                        value={col}
                        darkSurface
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
                {doctors.map((doc) => (
                  <tr
                    key={doc.id}
                    className="group bg-[#F2F2F2] hover:bg-[#EAEAEA] text-black h-[54px] transition-colors"
                  >
                    <td className="border border-[#7F7F7F] px-2 py-1.5 text-[16px] font-medium relative">
                      <EditableText
                        value={doc.fullName}
                        onChange={(v) => onUpdateStaffField(doc.id, 'fullName', v)}
                      />
                      <button
                        type="button"
                        onClick={() => onDeleteStaff(doc.id)}
                        title="Supprimer cette ligne"
                        className="no-print opacity-0 group-hover:opacity-100 focus:opacity-100 absolute left-1 top-1/2 -translate-y-1/2 p-1 text-red-600 hover:bg-red-100 rounded transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
                          onChange={(v) => onUpdateDoctorWeekly(doc.id, dayKey, v)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add Doctor Row Button (No-Print) */}
            <div className="no-print mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleAddDoctor}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-sans font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un médecin</span>
              </button>
            </div>

            {/* Observation Line */}
            <div className="mt-3 text-[13.5px] font-medium text-black">
              <EditableText
                value={config.pdf1Page1Obs}
                onChange={(v) => onUpdateConfig({ pdf1Page1Obs: v })}
              />
            </div>
          </div>

          <OfficialPortraitFooter config={config} onUpdateConfig={onUpdateConfig} />
        </section>
      )}

      {/* =====================================================================
          PDF 1 — PAGE 2: La liste du personnel médical du mois d'Octobre 2026
         ===================================================================== */}
      {(activeSubPage === 'all' || activeSubPage === 'p2') && (
        <section
          aria-label="PDF 1 Page 2 - Liste du personnel médical"
          className="a4-portrait-sheet shadow-xl border border-slate-300 px-[14mm] py-[14mm] flex flex-col justify-between font-pdf"
        >
          <div>
            <OfficialPortraitHeader config={config} onUpdateConfig={onUpdateConfig} />

            {/* Title Block */}
            <div className="mt-28 mb-4 text-center">
              <h2 className="text-[16.5px] font-semibold tracking-tight text-black">
                <EditableText
                  value={config.pdf1Page2Title}
                  onChange={(v) => onUpdateConfig({ pdf1Page2Title: v })}
                />
              </h2>
              <div className="text-[14px] font-medium text-black mt-1.5">
                <EditableText
                  value={config.pdf1Page2Subtitle}
                  onChange={(v) => onUpdateConfig({ pdf1Page2Subtitle: v })}
                />
              </div>
            </div>

            {/* Medical Staff List Table */}
            <table className="w-full border-collapse border border-[#7F7F7F] text-center">
              <thead>
                <tr className="bg-[#D9D9D9] text-black text-[14px] font-medium h-[36px]">
                  {config.pdf1Page2Columns.map((col, idx) => (
                    <th
                      key={idx}
                      className={`border border-[#7F7F7F] px-2 py-1 font-medium ${
                        idx === 0 ? 'w-[25%]' : idx === 1 ? 'w-[25%]' : 'w-[50%]'
                      }`}
                    >
                      <EditableText
                        value={col}
                        onChange={(v) => {
                          const next = [...config.pdf1Page2Columns] as [string, string, string];
                          next[idx] = v;
                          onUpdateConfig({ pdf1Page2Columns: next });
                        }}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => (
                  <tr
                    key={doc.id}
                    className="group bg-[#F9F9F9] hover:bg-[#F0F0F0] text-black h-[36px] text-[14px] font-medium transition-colors"
                  >
                    <td className="border border-[#7F7F7F] px-2 py-1 relative">
                      <EditableText
                        value={doc.fullName}
                        onChange={(v) => onUpdateStaffField(doc.id, 'fullName', v)}
                      />
                      <button
                        type="button"
                        onClick={() => onDeleteStaff(doc.id)}
                        title="Supprimer cette ligne"
                        className="no-print opacity-0 group-hover:opacity-100 focus:opacity-100 absolute left-1 top-1/2 -translate-y-1/2 p-1 text-red-600 hover:bg-red-100 rounded transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="border border-[#7F7F7F] px-2 py-1">
                      <EditableText
                        value={doc.rolePortrait}
                        onChange={(v) => onUpdateStaffField(doc.id, 'rolePortrait', v)}
                      />
                    </td>
                    <td className="border border-[#7F7F7F] px-2 py-1">
                      <EditableText
                        value={doc.obsPortrait}
                        onChange={(v) => onUpdateStaffField(doc.id, 'obsPortrait', v)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="no-print mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleAddDoctor}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-sans font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un médecin</span>
              </button>
            </div>
          </div>

          <OfficialPortraitFooter config={config} onUpdateConfig={onUpdateConfig} />
        </section>
      )}

      {/* =====================================================================
          PDF 1 — PAGE 3: Planning du Personnel Paramédical du Mois d'Octobre 2026
         ===================================================================== */}
      {(activeSubPage === 'all' || activeSubPage === 'p3') && (
        <section
          aria-label="PDF 1 Page 3 - Planning du Personnel Paramédical"
          className="a4-portrait-sheet shadow-xl border border-slate-300 px-[14mm] py-[12mm] flex flex-col justify-between font-pdf"
        >
          <div>
            <OfficialPortraitHeader config={config} onUpdateConfig={onUpdateConfig} />

            {/* Title Block */}
            <div className="mt-6 mb-2.5 text-center">
              <h2 className="text-[16.5px] font-semibold tracking-tight text-black">
                <EditableText
                  value={config.pdf1Page3Title}
                  onChange={(v) => onUpdateConfig({ pdf1Page3Title: v })}
                />
              </h2>
            </div>

            {/* Paramedical Complete Table (08h-16h, 16h Groupes A-E, 12h) */}
            <table className="w-full border-collapse border-[1.5px] border-black text-black text-[13.5px]">
              <thead>
                <tr className="h-[26px] text-center font-medium border-b-[1.5px] border-black">
                  <th className="border border-black w-[11%] px-1">
                    <EditableText
                      value={config.pdf1Page3Columns[0]}
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
                  <th className="border border-black w-[22.5%] px-2">
                    <EditableText
                      value={config.pdf1Page3Columns[1]}
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
                  <th className="border border-black w-[22.5%] px-2">
                    <EditableText
                      value={config.pdf1Page3Columns[2]}
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
                  <th className="border border-black w-[44%] px-2">
                    <EditableText
                      value={config.pdf1Page3Columns[3]}
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
                        <button
                          type="button"
                          onClick={handleAddParamedicalDay}
                          title="Ajouter un agent 08h-16h"
                          className="no-print block mx-auto mt-1 p-0.5 text-slate-600 hover:text-black hover:bg-slate-200 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </td>
                    )}
                    <td className="border-r border-black px-1.5 py-[1px] font-medium relative">
                      <EditableText
                        value={staff.fullName}
                        onChange={(v) => onUpdateStaffField(staff.id, 'fullName', v)}
                      />
                      <button
                        type="button"
                        onClick={() => onDeleteStaff(staff.id)}
                        title="Supprimer"
                        className="no-print opacity-0 group-hover:opacity-100 absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="border-r border-black px-1.5 py-[1px] font-medium">
                      <EditableText
                        value={staff.rolePortrait}
                        onChange={(v) => onUpdateStaffField(staff.id, 'rolePortrait', v)}
                      />
                    </td>
                    {idx === 0 && (
                      <td
                        rowSpan={Math.max(1, paramedicalDay.length)}
                        className="border border-black px-2 align-middle text-center"
                      >
                        <EditableText
                          value={config.pdf1Page3Obs08h16h}
                          placeholder="OBS..."
                          multiline
                          onChange={(v) => onUpdateConfig({ pdf1Page3Obs08h16h: v })}
                        />
                      </td>
                    )}
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
                            16h
                          </td>
                        )}
                        <td className="bg-black text-white text-center font-medium py-[1px] px-1.5 border-r border-black relative">
                          <span>Groupe {groupLetter}</span>
                          <button
                            type="button"
                            onClick={() => handleAddGuardMember(groupLetter)}
                            title={`Ajouter dans Groupe ${groupLetter}`}
                            className="no-print absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-white/80 hover:text-white hover:bg-white/20 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </td>
                        <td className="border-r border-black px-1.5 py-[1px]"></td>
                        {isFirst16hRow && (
                          <td
                            rowSpan={Math.max(1, total16hRows)}
                            className="border border-black px-2 align-middle text-center"
                          >
                            <EditableText
                              value={config.pdf1Page3Obs16h}
                              placeholder="OBS..."
                              multiline
                              onChange={(v) => onUpdateConfig({ pdf1Page3Obs16h: v })}
                            />
                          </td>
                        )}
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
                          <td className="border-r border-black px-1.5 py-[1px] font-medium relative">
                            <EditableText
                              value={member.fullName}
                              onChange={(v) => onUpdateStaffField(member.id, 'fullName', v)}
                            />
                            <button
                              type="button"
                              onClick={() => onDeleteStaff(member.id)}
                              title="Supprimer"
                              className="no-print opacity-0 group-hover:opacity-100 absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-red-600 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </td>
                          <td className="border-r border-black px-1.5 py-[1px] font-medium">
                            <EditableText
                              value={member.rolePortrait}
                              onChange={(v) => onUpdateStaffField(member.id, 'rolePortrait', v)}
                            />
                          </td>
                        </tr>
                      );
                    });
                  });

                  return rows;
                })()}

                {/* ---------------- BLOCK 3: 12h (Agents d'hygiène) ---------------- */}
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
                        <button
                          type="button"
                          onClick={handleAddHygieneMember}
                          title="Ajouter un agent 12h"
                          className="no-print block mx-auto mt-0.5 p-0.5 text-slate-600 hover:text-black hover:bg-slate-200 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </td>
                    )}
                    <td className="border-r border-black px-1.5 py-[1px] font-medium relative">
                      <EditableText
                        value={staff.fullName}
                        onChange={(v) => onUpdateStaffField(staff.id, 'fullName', v)}
                      />
                      <button
                        type="button"
                        onClick={() => onDeleteStaff(staff.id)}
                        title="Supprimer"
                        className="no-print opacity-0 group-hover:opacity-100 absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="border-r border-black px-1.5 py-[1px] font-medium">
                      <EditableText
                        value={staff.rolePortrait}
                        onChange={(v) => onUpdateStaffField(staff.id, 'rolePortrait', v)}
                      />
                    </td>
                    {idx === 0 && (
                      <td
                        rowSpan={Math.max(1, hygieneStaff.length)}
                        className="border border-black px-2 align-middle text-center"
                      >
                        <EditableText
                          value={config.pdf1Page3Obs12h}
                          placeholder="OBS..."
                          multiline
                          onChange={(v) => onUpdateConfig({ pdf1Page3Obs12h: v })}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <OfficialPortraitFooter config={config} onUpdateConfig={onUpdateConfig} />
        </section>
      )}
    </div>
  );
};
