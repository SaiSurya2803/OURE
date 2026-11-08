"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  BarChart3, Award, CheckCircle2, TrendingUp, Download, 
  Layers, Users, ShieldAlert, ChevronRight, FileSpreadsheet
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";

const GRADE_COLORS: Record<string, string> = {
  "O": "#10B981",
  "A+": "#059669",
  "A": "#3B82F6",
  "B+": "#60A5FA",
  "B": "#818CF8",
  "C": "#F59E0B",
  "D": "#F97316",
  "F": "#EF4444",
  "Ab": "#64748B"
};

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const qExamId = searchParams.get("exam_id");

  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(qExamId || "");
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [topperTab, setTopperTab] = useState<"top10" | "top20" | "top50">("top10");

  useEffect(() => {
    fetch("/api/examinations")
      .then((res) => res.json())
      .then((data) => {
        setExams(data);
        if (!selectedExamId && data.length > 0) {
          setSelectedExamId(data[0].id.toString());
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    setLoading(true);
    fetch(`/api/examinations/${selectedExamId}/analytics`)
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedExamId]);

  // Format grade data for Recharts
  const gradeChartData = analytics?.grade_distribution
    ? Object.entries(analytics.grade_distribution).map(([grade, count]) => ({
        grade,
        count: count as number,
        fill: GRADE_COLORS[grade] || "#3B82F6"
      }))
    : [];

  const backlogPieData = analytics?.backlog_breakdown
    ? [
        { name: "0 Backlogs (Cleared)", value: analytics.backlog_breakdown["0"], color: "#10B981" },
        { name: "1 Backlog", value: analytics.backlog_breakdown["1"], color: "#F59E0B" },
        { name: "2 Backlogs", value: analytics.backlog_breakdown["2"], color: "#F97316" },
        { name: "3+ Backlogs", value: analytics.backlog_breakdown["3+"], color: "#EF4444" },
      ].filter(d => d.value > 0)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <BarChart3 className="w-7 h-7 text-blue-500" />
            <span>Complete Academic Results Analytics</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Statistical distribution, subject breakdown, pass percentages, and topper leaderboards for Osmania University.
          </p>
        </div>

        {selectedExamId && (
          <div className="flex items-center space-x-2">
            <a
              href={`/api/exports/pdf/analytics/${selectedExamId}`}
              download
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Dossier</span>
            </a>
            <a
              href={`/api/exports/excel/${selectedExamId}`}
              download
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-surface hover:bg-slate-800 border border-border text-slate-300 hover:text-white text-xs font-medium transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </a>
          </div>
        )}
      </div>

      {/* Examination Selector */}
      <div className="p-4 rounded-2xl bg-surface-card border border-border">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Select Examination Target
        </label>
        <select
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-surface text-sm text-white border border-border focus:border-blue-500 focus:outline-none"
        >
          {exams.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.title} — {ex.total_candidates} candidates ({ex.pass_percentage}% Pass)
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 text-sm">
          Computing high-precision examination analytics...
        </div>
      ) : !analytics ? (
        <div className="p-16 text-center text-slate-400 text-sm">
          No analytics data available for this examination.
        </div>
      ) : (
        <>
          {/* Executive KPI Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <div className="p-4 rounded-xl bg-surface-card border border-border">
              <span className="text-[11px] text-slate-400 block mb-1">Total Evaluated</span>
              <span className="text-2xl font-extrabold text-white">{analytics.total_students}</span>
            </div>

            <div className="p-4 rounded-xl bg-surface-card border border-border">
              <span className="text-[11px] text-slate-400 block mb-1">Overall Pass %</span>
              <span className="text-2xl font-extrabold text-emerald-400">{analytics.pass_percentage}%</span>
            </div>

            <div className="p-4 rounded-xl bg-surface-card border border-border">
              <span className="text-[11px] text-slate-400 block mb-1">Zero Backlogs</span>
              <span className="text-2xl font-extrabold text-blue-400">
                {analytics.zero_backlogs_count} <span className="text-xs text-slate-400 font-normal">({analytics.zero_backlogs_pct}%)</span>
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-card border border-border">
              <span className="text-[11px] text-slate-400 block mb-1">Average SGPA</span>
              <span className="text-2xl font-extrabold text-cyan-400">
                {analytics.sgpa_stats?.average || "0.0"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-card border border-border">
              <span className="text-[11px] text-slate-400 block mb-1">Highest SGPA</span>
              <span className="text-2xl font-extrabold text-indigo-400">
                {analytics.sgpa_stats?.highest || "0.0"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-card border border-border">
              <span className="text-[11px] text-slate-400 block mb-1">Std Deviation</span>
              <span className="text-2xl font-extrabold text-slate-300">
                {analytics.sgpa_stats?.std_dev || "0.0"}
              </span>
            </div>

          </div>

          {/* Charts Row: Branch Performance & Backlog Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Branch Pass % Bar Chart */}
            <div className="lg:col-span-2 rounded-2xl bg-surface-card border border-border p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>Branch-wise Pass Percentage Comparison</span>
              </h3>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.branch_performance} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis 
                      dataKey="branch_name" 
                      stroke="#64748B" 
                      fontSize={11}
                      tickFormatter={(val) => val.split(" ")[0]}
                    />
                    <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(value: any) => [`${value}%`, "Pass Percentage"]}
                    />
                    <Bar dataKey="pass_percentage" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right 1 Col: Backlog Breakdown Pie Chart */}
            <div className="rounded-2xl bg-surface-card border border-border p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Backlog Clearance Breakdown</span>
              </h3>

              <div className="h-72 w-full flex items-center justify-center">
                {backlogPieData.length === 0 ? (
                  <p className="text-xs text-slate-500">No backlog data recorded</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={backlogPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {backlogPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B", borderRadius: "8px", fontSize: "12px" }} />
                      <Legend wrapperStyle={{ fontSize: "11px", color: "#94A3B8" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* Grade Distribution Bar Chart */}
          <div className="rounded-2xl bg-surface-card border border-border p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Overall Letter Grade Distribution (OU CBCS System)</span>
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="grade" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {gradeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject-Wise Performance Table */}
          <div className="rounded-2xl bg-surface-card border border-border overflow-hidden space-y-0">
            <div className="p-5 border-b border-border bg-[#050811] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Subject-wise Performance & Pass Percentages</h3>
              <span className="text-xs text-slate-500 font-mono">
                {analytics.subject_analytics?.length || 0} Subjects Evaluated
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#080D1A] text-slate-400 uppercase text-[11px] font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Sub Code</th>
                    <th className="py-3 px-4">Subject Title</th>
                    <th className="py-3 px-4 text-center">Credits</th>
                    <th className="py-3 px-4 text-center">Appeared</th>
                    <th className="py-3 px-4 text-center">Passed</th>
                    <th className="py-3 px-4 text-center">Failed</th>
                    <th className="py-3 px-4 text-right">Pass %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analytics.subject_analytics?.map((s: any) => (
                    <tr key={s.subject_code} className="hover:bg-surface/50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">{s.subject_code}</td>
                      <td className="py-3 px-4 font-medium text-white">{s.subject_name}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{s.credits}</td>
                      <td className="py-3 px-4 text-center font-mono">{s.total_appeared}</td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-400">{s.passed}</td>
                      <td className="py-3 px-4 text-center font-mono text-red-400">{s.failed}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        {s.pass_percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Merit Toppers Leaderboard */}
          <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
            <div className="p-5 border-b border-border bg-[#050811] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Merit Leaderboard & Academic Toppers</h3>
              </div>

              {/* Top 10, Top 20, Top 50 tabs */}
              <div className="flex items-center space-x-1 p-1 bg-surface rounded-xl border border-border text-xs">
                {(["top10", "top20", "top50"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTopperTab(tab)}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      topperTab === tab ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#080D1A] text-slate-400 uppercase text-[11px] font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4 text-center">Rank</th>
                    <th className="py-3 px-4">Hall Ticket</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4 text-right">SGPA</th>
                    <th className="py-3 px-4 text-center">Backlogs</th>
                    <th className="py-3 px-4 text-center">Result Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analytics.toppers?.[topperTab]?.map((cand: any) => (
                    <tr key={cand.hall_ticket} className="hover:bg-surface/50">
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                          cand.rank === 1 ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" :
                          cand.rank === 2 ? "bg-slate-300/20 text-slate-300 border border-slate-300/40" :
                          cand.rank === 3 ? "bg-amber-700/20 text-amber-600 border border-amber-700/40" :
                          "text-slate-400"
                        }`}>
                          #{cand.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">
                        <Link href={`/students/${cand.hall_ticket}`} className="hover:underline">
                          {cand.hall_ticket}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">{cand.student_name}</td>
                      <td className="py-3 px-4 text-slate-300">{cand.branch_name}</td>
                      <td className="py-3 px-4 font-mono font-extrabold text-emerald-400 text-right">
                        {cand.sgpa}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold">
                        {cand.backlog_count}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                          {cand.result_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 text-sm">Loading analytics intelligence...</div>}>
      <AnalyticsContent />
    </Suspense>
  );
}
