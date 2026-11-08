"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  BarChart3, Award, CheckCircle2, TrendingUp, Download, 
  Layers, Users, ShieldAlert, ChevronRight, FileSpreadsheet,
  Sparkles, Bot, RefreshCw, ChevronDown, ChevronUp
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

  // Gemini AI Executive Dossier State
  const [aiReport, setAiReport] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiDossier, setShowAiDossier] = useState(false);

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
    setAiReport(null);
    setShowAiDossier(false);
    fetch(`/api/examinations/${selectedExamId}/analytics`)
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedExamId]);

  const generateAiDossier = async () => {
    if (!selectedExamId) return;
    setAiLoading(true);
    try {
      const res = await fetch(`/api/examinations/${selectedExamId}/ai-insights`);
      const data = await res.json();
      setAiReport(data.ai_report);
      setShowAiDossier(true);
    } catch (err) {
      console.error("AI Insight Error:", err);
    } finally {
      setAiLoading(false);
    }
  };

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
            <button
              onClick={generateAiDossier}
              disabled={aiLoading}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? "animate-spin" : ""}`} />
              <span>{aiLoading ? "Synthesizing AI Dossier..." : "Generate AI Executive Report"}</span>
            </button>
            <a
              href={`/api/exports/pdf/analytics/${selectedExamId}`}
              download
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
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

      {/* AI Academic Executive Dossier (Gemini / Heuristic Engine) */}
      {showAiDossier && aiReport && (
        <div className="rounded-2xl bg-gradient-to-br from-surface-card via-surface-card to-blue-950/20 border border-blue-500/30 p-6 space-y-4 shadow-xl shadow-blue-950/30 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Executive Academic Intelligence Dossier</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Autonomous qualitative insights synthesized from live Osmania University examination data.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                aiReport.is_live_gemini 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-blue-500/10 border-blue-500/30 text-blue-400"
              }`}>
                {aiReport.is_live_gemini ? `✨ ${aiReport.model}` : "🤖 Academic Heuristic Engine"}
              </span>
              <button
                onClick={() => setShowAiDossier(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-xs text-slate-300 space-y-2 whitespace-pre-line leading-relaxed font-sans">
            {aiReport.markdown_report}
          </div>

          {!aiReport.is_live_gemini && (
            <div className="pt-2 text-[11px] text-slate-500 border-t border-border flex items-center justify-between">
              <span>Running built-in heuristic AI analyzer (zero setup).</span>
              <Link href="/settings" className="text-blue-400 hover:underline">
                Add free Gemini API Key in Settings for live Generative AI &rarr;
              </Link>
            </div>
          )}
        </div>
      )}

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
                      angle={-15} 
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(val: any) => [`${val}% Pass`, "Rate"]}
                    />
                    <Bar dataKey="pass_percentage" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Col: Backlog Breakdown Pie Chart */}
            <div className="rounded-2xl bg-surface-card border border-border p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Backlog Status Distribution</span>
              </h3>

              <div className="h-72 w-full flex items-center justify-center">
                {backlogPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={backlogPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={4}
                      >
                        {backlogPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B", borderRadius: "8px", fontSize: "12px" }}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-slate-500 text-xs">No backlog data</div>
                )}
              </div>
            </div>

          </div>

          {/* Letter Grade Distribution Bar Chart */}
          <div className="rounded-2xl bg-surface-card border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Subject Letter Grade Distribution (O to F / Ab)</span>
              </h3>
              <span className="text-xs text-slate-500">Across all registered course credits</span>
            </div>

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
                      topperTab === tab
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white"
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
                    <th className="py-3 px-4 text-center w-12">Rank</th>
                    <th className="py-3 px-4">Hall Ticket</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">College</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4 text-center">Backlogs</th>
                    <th className="py-3 px-4 text-right">SGPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {analytics[topperTab]?.map((t: any) => (
                    <tr key={t.hall_ticket} className="hover:bg-surface/50">
                      <td className="py-3 px-4 text-center font-bold">
                        {t.rank === 1 ? (
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-flex items-center justify-center text-xs">
                            1
                          </span>
                        ) : t.rank === 2 ? (
                          <span className="w-5 h-5 rounded-full bg-slate-300/20 text-slate-300 border border-slate-300/40 inline-flex items-center justify-center text-xs">
                            2
                          </span>
                        ) : t.rank === 3 ? (
                          <span className="w-5 h-5 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 inline-flex items-center justify-center text-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-500">#{t.rank}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">
                        <Link href={`/students/${t.hall_ticket}`} className="hover:underline">
                          {t.hall_ticket}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">{t.name || "N/A"}</td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-[140px]">{t.college_name || t.college_code}</td>
                      <td className="py-3 px-4 text-slate-400">{t.branch_name || t.branch_code}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                          0 Backlogs
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-white text-sm">
                        {t.sgpa}
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
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 text-sm">
        Loading analytics engine...
      </div>
    }>
      <AnalyticsContent />
    </Suspense>
  );
}
