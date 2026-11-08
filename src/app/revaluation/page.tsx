"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  GitCompare, ArrowRight, CheckCircle2, TrendingUp, 
  TrendingDown, Minus, Award, RefreshCw, AlertCircle,
  Sparkles, Bot
} from "lucide-react";

export default function RevaluationPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [originalExamId, setOriginalExamId] = useState<string>("");
  const [revalExamId, setRevalExamId] = useState<string>("");
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Scrutiny Audit State
  const [aiAudit, setAiAudit] = useState<any>(null);
  const [aiAuditLoading, setAiAuditLoading] = useState(false);
  const [showAiAudit, setShowAiAudit] = useState(false);

  useEffect(() => {
    fetch("/api/examinations")
      .then((res) => res.json())
      .then((data) => {
        setExams(data);
        if (data.length >= 2) {
          const reval = data.find((e: any) => e.exam_type === "REVALUATION");
          const orig = data.find((e: any) => e.exam_type !== "REVALUATION");
          if (reval && orig) {
            setRevalExamId(reval.id.toString());
            setOriginalExamId(orig.id.toString());
          } else {
            setOriginalExamId(data[1].id.toString());
            setRevalExamId(data[0].id.toString());
          }
        } else if (data.length === 1) {
          setOriginalExamId(data[0].id.toString());
          setRevalExamId(data[0].id.toString());
        }
      })
      .catch(console.error);
  }, []);

  const handleRunComparison = async () => {
    if (!originalExamId || !revalExamId) return;
    setError(null);
    setLoading(true);
    setAiAudit(null);
    setShowAiAudit(false);

    try {
      const res = await fetch("/api/revaluation/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_exam_id: parseInt(originalExamId),
          revaluation_exam_id: parseInt(revalExamId)
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || "Comparison failed");
      }
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Unable to compute comparison.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunAiAudit = async () => {
    if (!originalExamId || !revalExamId) return;
    setAiAuditLoading(true);
    try {
      const res = await fetch("/api/revaluation/ai-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_exam_id: parseInt(originalExamId),
          revaluation_exam_id: parseInt(revalExamId)
        })
      });
      const data = await res.json();
      setAiAudit(data.audit);
      setShowAiAudit(true);
    } catch (err) {
      console.error("AI Audit Error:", err);
    } finally {
      setAiAuditLoading(false);
    }
  };

  useEffect(() => {
    if (originalExamId && revalExamId) {
      handleRunComparison();
    }
  }, [originalExamId, revalExamId]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <GitCompare className="w-7 h-7 text-cyan-400" />
          <span>Revaluation & Updated Results Intelligence</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-4xl">
          Automated student and subject code matching across original and revised examination datasets. Tracks grade point changes, backlog clearances, and overall shift in university pass percentages.
        </p>
      </div>

      {/* Exam Pair Selector */}
      <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              1. Original Baseline Examination
            </label>
            <select
              value={originalExamId}
              onChange={(e) => setOriginalExamId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface text-sm text-white border border-border focus:border-blue-500 focus:outline-none"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.exam_type}) — {ex.total_candidates} students
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              2. Revaluation / Revised Examination
            </label>
            <select
              value={revalExamId}
              onChange={(e) => setRevalExamId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface text-sm text-white border border-border focus:border-blue-500 focus:outline-none"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.exam_type}) — {ex.total_candidates} students
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border">
          <span className="text-xs text-slate-400">
            Historical versions are preserved. Original records are never overwritten.
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleRunAiAudit}
              disabled={aiAuditLoading || !originalExamId || !revalExamId}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-600/30 flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${aiAuditLoading ? "animate-spin" : ""}`} />
              <span>{aiAuditLoading ? "Auditing Discrepancies..." : "AI Scrutiny Audit"}</span>
            </button>
            <button
              type="button"
              onClick={handleRunComparison}
              disabled={loading || !originalExamId || !revalExamId}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-600/30 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>MATCHING COHORTS...</span>
                </>
              ) : (
                <>
                  <GitCompare className="w-4 h-4" />
                  <span>COMPUTE REVALUATION DIFF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Scrutiny Audit Dossier */}
      {showAiAudit && aiAudit && (
        <div className="rounded-2xl bg-gradient-to-br from-surface-card via-surface-card to-blue-950/20 border border-blue-500/30 p-6 space-y-4 shadow-xl shadow-blue-950/30 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>AI Revaluation Scrutiny Audit</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Autonomous qualitative assessment of evaluation discrepancies and backlog clearance velocities.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                aiAudit.is_live_gemini 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-blue-500/10 border-blue-500/30 text-blue-400"
              }`}>
                {aiAudit.is_live_gemini ? "✨ Live Gemini 1.5 Flash" : "🤖 Academic Heuristic Engine"}
              </span>
              <button
                onClick={() => setShowAiAudit(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-xs text-slate-300 space-y-2 whitespace-pre-line leading-relaxed font-sans">
            {aiAudit.audit_markdown}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Comparison Results */}
      {report?.summary && (
        <div className="space-y-6">
          
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            
            <div className="p-4 rounded-xl bg-surface-card border border-border">
              <span className="text-[11px] text-slate-400 block mb-1">Revaluation Cohort</span>
              <span className="text-2xl font-extrabold text-white">
                {report.summary.total_revaluation_candidates}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-card border border-border">
              <span className="text-[11px] text-slate-400 block mb-1">Students Improved</span>
              <span className="text-2xl font-extrabold text-emerald-400">
                {report.summary.improved_students}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono block mt-1">
                +{report.summary.improvement_percentage}% of cohort
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-card border border-border">
              <span className="text-[11px] text-slate-400 block mb-1">Fail → Pass Cleared</span>
              <span className="text-2xl font-extrabold text-cyan-400">
                {report.summary.backlogs_cleared_fail_to_pass}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono block mt-1">
                Active backlogs cleared
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-card border border-border">
              <span className="text-[11px] text-slate-400 block mb-1">Unchanged</span>
              <span className="text-2xl font-extrabold text-slate-300">
                {report.summary.unchanged_students}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-card border border-border">
              <span className="text-[11px] text-slate-400 block mb-1">Pass % Shift</span>
              <span className="text-2xl font-extrabold text-emerald-400">
                +{report.summary.overall_pass_difference}%
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-card border border-border">
              <span className="text-[11px] text-slate-400 block mb-1">Avg Marks Delta</span>
              <span className="text-2xl font-extrabold text-blue-400 font-mono">
                +{report.summary.average_marks_improvement}
              </span>
            </div>

          </div>

          {/* Subject-Wise Improvement Breakdown */}
          {report.subject_breakdown?.length > 0 && (
            <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
              <div className="p-5 border-b border-border bg-[#050811] flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Subject-wise Revaluation Variations</h3>
                <span className="text-xs text-slate-500 font-mono">
                  {report.subject_breakdown.length} Subjects Evaluated
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#080D1A] text-slate-400 uppercase text-[11px] font-semibold border-b border-border">
                    <tr>
                      <th className="py-3 px-4">Subject Code</th>
                      <th className="py-3 px-4">Subject Title</th>
                      <th className="py-3 px-4 text-center">Appeared in RV</th>
                      <th className="py-3 px-4 text-center">Grades Improved</th>
                      <th className="py-3 px-4 text-center">Backlogs Cleared</th>
                      <th className="py-3 px-4 text-center">Unchanged</th>
                      <th className="py-3 px-4 text-center">Decreased</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {report.subject_breakdown.map((s: any) => (
                      <tr key={s.subject_code} className="hover:bg-surface/50">
                        <td className="py-3 px-4 font-mono font-bold text-cyan-400">{s.subject_code}</td>
                        <td className="py-3 px-4 font-medium text-white">{s.subject_name}</td>
                        <td className="py-3 px-4 text-center font-mono">{s.reval_appeared}</td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold">{s.improved}</td>
                        <td className="py-3 px-4 text-center font-mono text-cyan-400 font-bold">{s.backlogs_cleared}</td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{s.unchanged}</td>
                        <td className="py-3 px-4 text-center font-mono text-red-400">{s.decreased}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Student-by-Student Differential Table */}
          <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
            <div className="p-5 border-b border-border bg-[#050811] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Student Differential Comparison Matrix</h3>
              <span className="text-xs text-slate-500 font-mono">
                {report.student_comparisons?.length || 0} Candidates Analyzed
              </span>
            </div>

            <div className="divide-y divide-border">
              {report.student_comparisons?.map((stud: any) => (
                <div key={stud.hall_ticket} className="p-5 hover:bg-surface/40 transition-colors space-y-3">
                  
                  {/* Candidate Summary Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sm font-bold text-blue-400">
                        <Link href={`/students/${stud.hall_ticket}`} className="hover:underline">
                          {stud.hall_ticket}
                        </Link>
                      </span>
                      <span className="font-bold text-white text-sm">{stud.student_name}</span>
                      <span className="text-xs text-slate-400">({stud.branch_name})</span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <div className="font-mono text-slate-300">
                        SGPA: <span className="text-slate-400">{stud.original_sgpa ?? "-"}</span> → <span className="text-white font-bold">{stud.revaluation_sgpa ?? "-"}</span>
                        {stud.sgpa_diff !== null && stud.sgpa_diff !== 0 && (
                          <span className={`ml-1 font-bold ${stud.sgpa_diff > 0 ? "text-emerald-400" : "text-red-400"}`}>
                            ({stud.sgpa_diff > 0 ? `+${stud.sgpa_diff}` : stud.sgpa_diff})
                          </span>
                        )}
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        stud.student_overall_change === "IMPROVED" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                        stud.student_overall_change === "DECREASED" ? "bg-red-500/15 text-red-400 border border-red-500/30" :
                        "bg-slate-700 text-slate-300"
                      }`}>
                        {stud.student_overall_change}
                      </span>
                    </div>
                  </div>

                  {/* Subject Diff Table */}
                  <div className="overflow-x-auto bg-[#080D1A] rounded-xl border border-border/60">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[10px] text-slate-400 uppercase font-mono border-b border-border/60">
                        <tr>
                          <th className="py-2 px-3">Subject</th>
                          <th className="py-2 px-3 text-center">Original Grade</th>
                          <th className="py-2 px-3 text-center">Revaluation Grade</th>
                          <th className="py-2 px-3 text-center">Grade Point Delta</th>
                          <th className="py-2 px-3 text-right">Status Transition</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                        {stud.subjects?.map((sub: any, sIdx: number) => (
                          <tr key={sIdx} className="hover:bg-surface/30">
                            <td className="py-2 px-3 font-sans text-white">
                              <span className="font-mono text-blue-400 mr-2 font-bold">{sub.subject_code}</span>
                              {sub.subject_name}
                            </td>
                            <td className="py-2 px-3 text-center text-slate-400 font-bold">{sub.original_grade}</td>
                            <td className="py-2 px-3 text-center text-emerald-400 font-bold">{sub.revaluation_grade}</td>
                            <td className="py-2 px-3 text-center">
                              {sub.points_difference > 0 ? (
                                <span className="text-emerald-400 font-bold">+{sub.points_difference}</span>
                              ) : sub.points_difference < 0 ? (
                                <span className="text-red-400 font-bold">{sub.points_difference}</span>
                              ) : (
                                <span className="text-slate-500">0</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right font-sans">
                              {sub.backlog_cleared ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                  ✓ FAIL TO PASS (CLEARED)
                                </span>
                              ) : sub.status_change === "GRADE_IMPROVED" ? (
                                <span className="text-emerald-400 text-[10px] font-bold">Grade Improved</span>
                              ) : sub.status_change === "GRADE_DECREASED" ? (
                                <span className="text-red-400 text-[10px] font-bold">Grade Decreased</span>
                              ) : (
                                <span className="text-slate-500 text-[10px]">Unchanged</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              ))}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
