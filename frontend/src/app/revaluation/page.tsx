"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  GitCompare, ArrowRight, CheckCircle2, TrendingUp, 
  TrendingDown, Minus, Award, RefreshCw, AlertCircle
} from "lucide-react";

export default function RevaluationPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [originalExamId, setOriginalExamId] = useState<string>("");
  const [revalExamId, setRevalExamId] = useState<string>("");
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/examinations")
      .then((res) => res.json())
      .then((data) => {
        setExams(data);
        if (data.length >= 2) {
          // Find if there is a revaluation exam
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

  // Auto trigger if both are set on initial load
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
                  [{ex.exam_type}] {ex.title} ({ex.total_candidates} candidates)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              2. Revaluation / Revised Examination Run
            </label>
            <select
              value={revalExamId}
              onChange={(e) => setRevalExamId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface text-sm text-white border border-border focus:border-cyan-500 focus:outline-none"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  [{ex.exam_type}] {ex.title} ({ex.total_candidates} candidates)
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Historical versions are preserved. Original records are never overwritten.
          </span>
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
                {report.summary.improvement_rate_pct}% of applicants
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-card border border-border">
              <span className="text-[11px] text-slate-400 block mb-1">Backlogs Cleared</span>
              <span className="text-2xl font-extrabold text-cyan-400">
                {report.summary.backlogs_cleared}
              </span>
              <span className="text-[10px] text-cyan-400 block mt-1">Fail to Pass</span>
            </div>

            <div className="p-4 rounded-xl bg-surface-card border border-border">
              <span className="text-[11px] text-slate-400 block mb-1">Unchanged</span>
              <span className="text-2xl font-extrabold text-slate-300">
                {report.summary.unchanged_students}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-card border border-border">
              <span className="text-[11px] text-slate-400 block mb-1">Decreased</span>
              <span className="text-2xl font-extrabold text-red-400">
                {report.summary.decreased_students}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-card border border-border">
              <span className="text-[11px] text-slate-400 block mb-1">Pass % Shift</span>
              <span className={`text-2xl font-extrabold ${report.summary.pass_percentage_shift >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {report.summary.pass_percentage_shift > 0 ? `+${report.summary.pass_percentage_shift}` : report.summary.pass_percentage_shift}%
              </span>
            </div>

          </div>

          {/* Subject-Wise Improvement Table */}
          {report.subject_breakdown?.length > 0 && (
            <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
              <div className="p-5 border-b border-border bg-[#050811] flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Subject-wise Revaluation Impact Breakdown</h3>
                <span className="text-xs text-slate-500 font-mono">
                  {report.subject_breakdown.length} Subjects Affected
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

                  {/* Subject Comparison Sub-Table */}
                  <div className="rounded-xl border border-border/70 overflow-hidden bg-surface/30">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#050811] text-slate-400 text-[10px] uppercase font-semibold">
                        <tr>
                          <th className="py-2 px-3">Subject</th>
                          <th className="py-2 px-3 text-center">Original</th>
                          <th className="py-2 px-3 text-center">Revised</th>
                          <th className="py-2 px-3 text-center">Point Diff</th>
                          <th className="py-2 px-3 text-right">Transition Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {stud.subjects?.map((sub: any, sIdx: number) => (
                          <tr key={sIdx} className="hover:bg-surface/50">
                            <td className="py-2 px-3 font-medium text-slate-200">
                              <span className="font-mono text-slate-400 mr-2">{sub.subject_code}</span>
                              {sub.subject_name}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">{sub.original_grade}</td>
                            <td className="py-2 px-3 text-center font-mono text-white font-extrabold">{sub.revaluation_grade}</td>
                            <td className="py-2 px-3 text-center font-mono font-bold">
                              {sub.points_difference > 0 ? (
                                <span className="text-emerald-400">+{sub.points_difference}</span>
                              ) : sub.points_difference < 0 ? (
                                <span className="text-red-400">{sub.points_difference}</span>
                              ) : (
                                <span className="text-slate-500">0</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sub.status_change === "FAILED_TO_PASSED" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" :
                                sub.status_change === "GRADE_IMPROVED" ? "bg-emerald-500/15 text-emerald-400" :
                                sub.status_change === "GRADE_DECREASED" ? "bg-red-500/15 text-red-400" :
                                "bg-slate-800 text-slate-400"
                              }`}>
                                {sub.status_change === "FAILED_TO_PASSED" ? "Backlog Cleared (Fail → Pass)" : sub.status_change}
                              </span>
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
