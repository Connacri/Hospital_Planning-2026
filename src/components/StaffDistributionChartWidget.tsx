import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  Sparkles,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { StaffEntity, HospitalDocumentConfig } from '../db/objectboxEngine';

interface StaffDistributionChartWidgetProps {
  staffList: StaffEntity[];
  config: HospitalDocumentConfig;
}

const CATEGORY_COLORS = {
  medical: '#0284c7', // Sky blue
  paramedical_day: '#0ea5e9', // Light cyan/sky
  paramedical_guard: '#6366f1', // Indigo
  hygiene: '#10b981', // Emerald
};

const CATEGORY_LABELS: Record<string, string> = {
  medical: 'Médecins (Médical)',
  paramedical_day: 'Paramédical Jour (08h–16h)',
  paramedical_guard: 'Paramédical Garde (16h)',
  hygiene: "Agents d'Hygiène (12h)",
};

export const StaffDistributionChartWidget: React.FC<StaffDistributionChartWidgetProps> = ({
  staffList,
  config,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'area' | 'bar' | 'pie'>('area');
  const [activeFilterCategory, setActiveFilterCategory] = useState<string>('all');

  const daysInMonth = useMemo(() => {
    const month = (config.guardMonthName || '').toLowerCase();
    if (month.includes('février') || month.includes('fevrier')) return 28;
    if (
      month.includes('avril') ||
      month.includes('juin') ||
      month.includes('septembre') ||
      month.includes('novembre')
    ) {
      return 30;
    }
    return 31;
  }, [config.guardMonthName]);

  // Compute daily presence breakdown for each day (1..daysInMonth)
  const dailyData = useMemo(() => {
    const list: Array<{
      day: number;
      dayLabel: string;
      medical: number;
      paramedical_day: number;
      paramedical_guard: number;
      hygiene: number;
      totalPresent: number;
      onLeave: number;
      recovery: number;
    }> = [];

    for (let d = 1; d <= daysInMonth; d++) {
      let medical = 0;
      let paramedical_day = 0;
      let paramedical_guard = 0;
      let hygiene = 0;
      let onLeave = 0;
      let recovery = 0;

      staffList.forEach((s) => {
        const code = (s.dailyActivity?.[d] || '').trim();
        const codeUpper = code.toUpperCase();

        const isLeave =
          codeUpper === 'C' ||
          codeUpper === 'CM' ||
          codeUpper === 'M' ||
          codeUpper.includes('CONGÉ') ||
          Boolean(s.maternityLeave && d >= s.maternityLeave.startDay && d <= s.maternityLeave.endDay);

        const isRecovery = codeUpper === 'RE' || codeUpper === 'R';

        if (isLeave) {
          onLeave++;
          return;
        }
        if (isRecovery) {
          recovery++;
          return;
        }

        // Check active / present
        const isPresent =
          codeUpper === 'JOUR' ||
          codeUpper === 'NUIT' ||
          codeUpper === 'G' ||
          codeUpper === 'N' ||
          codeUpper === 'CS' ||
          codeUpper === 'SERVICE' ||
          codeUpper === '16H' ||
          codeUpper === '12H' ||
          code === 'Jour' ||
          code === 'Nuit' ||
          (!code && s.category === 'medical'); // default medical working week

        if (isPresent) {
          if (s.category === 'medical') medical++;
          else if (s.category === 'paramedical_day') paramedical_day++;
          else if (s.category === 'paramedical_guard') paramedical_guard++;
          else if (s.category === 'hygiene') hygiene++;
        }
      });

      const totalPresent = medical + paramedical_day + paramedical_guard + hygiene;

      list.push({
        day: d,
        dayLabel: `J${d}`,
        medical,
        paramedical_day,
        paramedical_guard,
        hygiene,
        totalPresent,
        onLeave,
        recovery,
      });
    }
    return list;
  }, [staffList, daysInMonth]);

  // Global department aggregate
  const categorySummary = useMemo(() => {
    let medicalCount = 0;
    let paramedicalDayCount = 0;
    let paramedicalGuardCount = 0;
    let hygieneCount = 0;

    staffList.forEach((s) => {
      if (s.category === 'medical') medicalCount++;
      else if (s.category === 'paramedical_day') paramedicalDayCount++;
      else if (s.category === 'paramedical_guard') paramedicalGuardCount++;
      else if (s.category === 'hygiene') hygieneCount++;
    });

    const pieData = [
      { name: 'Médical', value: medicalCount, color: CATEGORY_COLORS.medical, category: 'medical' },
      { name: 'Paramédical Jour', value: paramedicalDayCount, color: CATEGORY_COLORS.paramedical_day, category: 'paramedical_day' },
      { name: 'Paramédical Garde', value: paramedicalGuardCount, color: CATEGORY_COLORS.paramedical_guard, category: 'paramedical_guard' },
      { name: "Agents d'Hygiène", value: hygieneCount, color: CATEGORY_COLORS.hygiene, category: 'hygiene' },
    ].filter((item) => item.value > 0);

    const totalStaff = staffList.length;

    // Average daily presence
    const avgPresence =
      dailyData.length > 0
        ? Math.round(
            (dailyData.reduce((acc, curr) => acc + curr.totalPresent, 0) / dailyData.length) * 10
          ) / 10
        : 0;

    const presenceRate =
      totalStaff > 0 ? Math.round((avgPresence / totalStaff) * 100) : 0;

    return {
      medicalCount,
      paramedicalDayCount,
      paramedicalGuardCount,
      hygieneCount,
      pieData,
      totalStaff,
      avgPresence,
      presenceRate,
    };
  }, [staffList, dailyData]);

  const monthDisplay = config.guardMonthName || 'Mois en cours';

  return (
    <div className="no-print bg-slate-950 border border-slate-800 rounded-xl shadow-xl overflow-hidden transition-all duration-200">
      {/* Header bar */}
      <div className="px-3 sm:px-5 py-3 sm:py-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
            <Activity className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 sm:gap-2 flex-wrap truncate">
              <span>Répartition des Effectifs & Présence</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800">
                {monthDisplay}
              </span>
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              Nombre de présents par type de service sur l'ensemble du mois ({categorySummary.totalStaff} effectifs)
            </p>
          </div>
        </div>

        {/* View toggles & collapse button */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setChartType('area')}
              title="Graphique en aires empilées"
              className={`p-1.5 rounded transition-colors ${
                chartType === 'area'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              title="Graphique en barres"
              className={`p-1.5 rounded transition-colors ${
                chartType === 'bar'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('pie')}
              title="Répartition globale en anneau"
              className={`p-1.5 rounded transition-colors ${
                chartType === 'pie'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Réduire le widget' : 'Développer le widget'}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 sm:p-5 space-y-4">
          {/* Top KPI Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-medium block">Total Effectif</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-base sm:text-xl font-bold font-mono text-white">
                  {categorySummary.totalStaff}
                </span>
                <span className="text-[10px] text-slate-400">agents</span>
              </div>
              <span className="text-[9.5px] text-sky-400 mt-0.5 block truncate">
                {config.unitTitle || 'Service Hospitalier'}
              </span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-medium block">Moyenne Présents / Jour</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-base sm:text-xl font-bold font-mono text-emerald-400">
                  {categorySummary.avgPresence}
                </span>
                <span className="text-[10px] text-emerald-300 font-semibold">
                  ({categorySummary.presenceRate}%)
                </span>
              </div>
              <span className="text-[9.5px] text-slate-400 mt-0.5 block">Sur les 30/31 jours</span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-medium block">Corps Médical</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-base sm:text-xl font-bold font-mono text-sky-400">
                  {categorySummary.medicalCount}
                </span>
                <span className="text-[10px] text-slate-400">médecins</span>
              </div>
              <span className="text-[9.5px] text-slate-400 mt-0.5 block truncate">
                08h–16h & Spécialistes
              </span>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-medium block">Paramédical & Garde</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-base sm:text-xl font-bold font-mono text-indigo-400">
                  {categorySummary.paramedicalDayCount + categorySummary.paramedicalGuardCount}
                </span>
                <span className="text-[10px] text-slate-400">agents</span>
              </div>
              <span className="text-[9.5px] text-slate-400 mt-0.5 block truncate">
                {categorySummary.paramedicalGuardCount} en garde 16h
              </span>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-2.5 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-200 font-bold min-w-0">
                <Layers className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="truncate">
                  {chartType === 'pie'
                    ? 'Répartition globale des effectifs'
                    : `Évolution quotidienne des présences (${monthDisplay})`}
                </span>
              </div>

              {/* Service filter badges */}
              <div className="flex flex-wrap items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setActiveFilterCategory('all')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    activeFilterCategory === 'all'
                      ? 'bg-slate-700 text-white font-bold ring-1 ring-slate-500'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  Tous
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterCategory('medical')}
                  className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                    activeFilterCategory === 'medical'
                      ? 'bg-sky-900/80 text-sky-300 border border-sky-700 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  Médical
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterCategory('paramedical_day')}
                  className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                    activeFilterCategory === 'paramedical_day'
                      ? 'bg-sky-900/80 text-sky-300 border border-sky-700 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Jour 08h-16h
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterCategory('paramedical_guard')}
                  className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                    activeFilterCategory === 'paramedical_guard'
                      ? 'bg-indigo-900/80 text-indigo-300 border border-indigo-700 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Garde 16h
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterCategory('hygiene')}
                  className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
                    activeFilterCategory === 'hygiene'
                      ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Hygiène 12h
                </button>
              </div>
            </div>

            {/* Custom Responsive Legend that never overlaps or clips */}
            {chartType !== 'pie' && (
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 py-1.5 px-2 bg-slate-950/70 rounded-lg border border-slate-800/80 mb-3 text-[10.5px]">
                {(activeFilterCategory === 'all' || activeFilterCategory === 'medical') && (
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: CATEGORY_COLORS.medical }} />
                    <span>Médecins</span>
                  </span>
                )}
                {(activeFilterCategory === 'all' || activeFilterCategory === 'paramedical_day') && (
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: CATEGORY_COLORS.paramedical_day }} />
                    <span>Paramédical Jour</span>
                  </span>
                )}
                {(activeFilterCategory === 'all' || activeFilterCategory === 'paramedical_guard') && (
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: CATEGORY_COLORS.paramedical_guard }} />
                    <span>Garde 16h</span>
                  </span>
                )}
                {(activeFilterCategory === 'all' || activeFilterCategory === 'hygiene') && (
                  <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: CATEGORY_COLORS.hygiene }} />
                    <span>Hygiène 12h</span>
                  </span>
                )}
              </div>
            )}

            {/* Recharts Component Container */}
            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'pie' ? (
                  <PieChart>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const percent = Math.round(
                            (data.value / (categorySummary.totalStaff || 1)) * 100
                          );
                          return (
                            <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-sans">
                              <p className="font-bold text-white flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: data.color }}
                                />
                                {data.name}
                              </p>
                              <p className="text-slate-300 mt-1">
                                Effectif : <span className="font-mono font-bold text-white">{data.value}</span> agents
                              </p>
                              <p className="text-sky-400 font-mono text-[11px]">
                                Part du service : {percent}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(val) => <span className="text-slate-300 text-xs font-medium">{val}</span>}
                    />
                    <Pie
                      data={categorySummary.pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="46%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      stroke="#0f172a"
                      strokeWidth={2}
                    >
                      {categorySummary.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                ) : chartType === 'bar' ? (
                  <BarChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      stroke="#64748b"
                      fontSize={10}
                      interval="preserveStartEnd"
                      minTickGap={8}
                      tickFormatter={(v) => `${v}`}
                    />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-sans space-y-1">
                              <p className="font-bold text-white border-b border-slate-800 pb-1">
                                Jour {label} {monthDisplay}
                              </p>
                              {payload.map((p: any) => (
                                <p key={p.dataKey} className="flex items-center justify-between gap-3 text-[11px]">
                                  <span style={{ color: p.color }} className="font-medium">
                                    {CATEGORY_LABELS[p.dataKey] || p.name} :
                                  </span>
                                  <span className="font-mono font-bold text-white">{p.value}</span>
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {(activeFilterCategory === 'all' || activeFilterCategory === 'medical') && (
                      <Bar dataKey="medical" name="medical" fill={CATEGORY_COLORS.medical} stackId="a" radius={[0, 0, 0, 0]} />
                    )}
                    {(activeFilterCategory === 'all' || activeFilterCategory === 'paramedical_day') && (
                      <Bar dataKey="paramedical_day" name="paramedical_day" fill={CATEGORY_COLORS.paramedical_day} stackId="a" />
                    )}
                    {(activeFilterCategory === 'all' || activeFilterCategory === 'paramedical_guard') && (
                      <Bar dataKey="paramedical_guard" name="paramedical_guard" fill={CATEGORY_COLORS.paramedical_guard} stackId="a" />
                    )}
                    {(activeFilterCategory === 'all' || activeFilterCategory === 'hygiene') && (
                      <Bar dataKey="hygiene" name="hygiene" fill={CATEGORY_COLORS.hygiene} stackId="a" radius={[3, 3, 0, 0]} />
                    )}
                  </BarChart>
                ) : (
                  <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMedical" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CATEGORY_COLORS.medical} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={CATEGORY_COLORS.medical} stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorDay" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CATEGORY_COLORS.paramedical_day} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={CATEGORY_COLORS.paramedical_day} stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorGuard" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CATEGORY_COLORS.paramedical_guard} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={CATEGORY_COLORS.paramedical_guard} stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorHygiene" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CATEGORY_COLORS.hygiene} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={CATEGORY_COLORS.hygiene} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="day"
                      tickLine={false}
                      stroke="#64748b"
                      fontSize={10}
                      interval="preserveStartEnd"
                      minTickGap={8}
                      tickFormatter={(v) => `${v}`}
                    />
                    <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const current = dailyData.find((d) => d.day === label);
                          return (
                            <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-sans space-y-1">
                              <p className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                                <span>Jour {label} ({monthDisplay})</span>
                                <span className="font-mono text-emerald-400">
                                  {current?.totalPresent || 0} présents
                                </span>
                              </p>
                              {payload.map((p: any) => (
                                <p key={p.dataKey} className="flex items-center justify-between gap-3 text-[11px]">
                                  <span style={{ color: p.color }} className="font-medium">
                                    {CATEGORY_LABELS[p.dataKey] || p.name} :
                                  </span>
                                  <span className="font-mono font-bold text-white">{p.value}</span>
                                </p>
                              ))}
                              {current && (current.onLeave > 0 || current.recovery > 0) && (
                                <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between gap-2">
                                  <span>Congés : {current.onLeave}</span>
                                  <span>Récupération : {current.recovery}</span>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {(activeFilterCategory === 'all' || activeFilterCategory === 'medical') && (
                      <Area
                        type="monotone"
                        dataKey="medical"
                        name="medical"
                        stroke={CATEGORY_COLORS.medical}
                        fillOpacity={1}
                        fill="url(#colorMedical)"
                        stackId="1"
                      />
                    )}
                    {(activeFilterCategory === 'all' || activeFilterCategory === 'paramedical_day') && (
                      <Area
                        type="monotone"
                        dataKey="paramedical_day"
                        name="paramedical_day"
                        stroke={CATEGORY_COLORS.paramedical_day}
                        fillOpacity={1}
                        fill="url(#colorDay)"
                        stackId="1"
                      />
                    )}
                    {(activeFilterCategory === 'all' || activeFilterCategory === 'paramedical_guard') && (
                      <Area
                        type="monotone"
                        dataKey="paramedical_guard"
                        name="paramedical_guard"
                        stroke={CATEGORY_COLORS.paramedical_guard}
                        fillOpacity={1}
                        fill="url(#colorGuard)"
                        stackId="1"
                      />
                    )}
                    {(activeFilterCategory === 'all' || activeFilterCategory === 'hygiene') && (
                      <Area
                        type="monotone"
                        dataKey="hygiene"
                        name="hygiene"
                        stroke={CATEGORY_COLORS.hygiene}
                        fillOpacity={1}
                        fill="url(#colorHygiene)"
                        stackId="1"
                      />
                    )}
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
