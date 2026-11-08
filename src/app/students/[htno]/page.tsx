"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  User, GraduationCap, Download, ArrowLeft, 
  TrendingUp, Award, CheckCircle2, AlertCircle, 
  GitCompare, Layers, Calendar, Sparkles, Bot, RefreshCw
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid 
} from "recharts";

export default function StudentProfilePage() {
  const params = useParams();
  const htno = params.htno as string;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // AI Academic Advisor State
  const [aiReport, setAiReport] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);

  useEffect(() => {
    if (!htno) return;
    setLoading(true);
    fetch(`/api/students/${htno}`)
      .then((res) => res.json())
      .then((data) => setProfile(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [htno]);

  const generateAiAdvisory = async () => {
    if (!htno) return;
    setAiLoading(true);
    try {
      const res = await fetch(`/api/students/${htno}/ai-advisory`);
      const data = await res.json();
      setAiReport(data.advisory);
      setShowAi(true);
    } catch (err) {
      console.error("AI Advisory Error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 text-sm">
        Retrieving candidate academic ledger...
      </div>
    );
  }

  if (!profile?.student) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Student Not Found</h2>
        <Link href="/students" className="text-sm text-blue-400 hover:underline">
          Return to Student Directory
        </Link>
      </div>
    );
  }

  const { student, academic_history, revaluation_history } = profile;

  // Format progression chart data
  const chartData = academic_history
    .filter((h: any) => h.sgpa !== null)
    .map((h: any) => ({
      sem: `Sem ${h.semester || "?"}`,
      sgpa: h.sgpa,
      title: h.exam_title
    }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/students"
          className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Student Database</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={generateAiAdvisory}
            disabled={aiLoading}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${aiLoading ? "animate-spin" : ""}`} />
            <span>{aiLoading ? "Synthesizing AI Guidance..." : "Generate AI Academic Guidance"}</span>
          </button>
          <a
            href={`/api/exports/pdf/student/${student.hall_ticket}`}
            download
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-surface hover:bg-slate-800 border border-border text-slate-300 hover:text-white text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Grade Memo PDF</span>
          </a>
        </div>
      </div>

      {/* AI Academic Counselor Dossier */}
      {showAi && aiReport && (
        <div className="rounded-2xl bg-gradient-to-br from-surface-card via-surface-card to-blue-950/20 border border-blue-500/30 p-6 space-y-4 shadow-xl shadow-blue-950/30 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>AI Academic Counselor & Trajectory Roadmap</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Customized guidance for {student.hall_ticket} based on cumulative examination history.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                aiReport.is_live_gemini 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                  : "bg-blue-500/10 border-blue-500/30 text-blue-400"
              }`}>
                {aiReport.is_live_gemini ? "✨ Live Gemini 1.5 Flash" : "🤖 Academic Heuristic Engine"}
              </span>
              <button
                onClick={() => setShowAi(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-xs text-slate-300 space-y-2 whitespace-pre-line leading-relaxed font-sans">
            {aiReport.advisory_markdown}
          </div>
        </div>
      )}

      {/* Candidate Personal Information Card */}
      <div className="rounded-2xl bg-surface-card border border-border p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <User className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {student.hall_ticket}
                </span>
                <span className="text-xs text-slate-400 font-medium">Batch {student.batch_year || "2024"}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                {student.name || "Student Candidate"}
              </h1>
              <p className="text-xs text-slate-400">
                Father: <span className="text-slate-200">{student.father_name || "N/A"}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">College</span>
              <span className="font-semibold text-white">{student.college_name}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">Branch</span>
              <span className="font-semibold text-white">{student.branch_name}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">Course & Medium</span>
              <span className="font-semibold text-white">{student.course} ({student.medium})</span>
            </div>
          </div>
        </div>

        {/* Academic Performance Trajectory Graph */}
        {chartData.length > 0 && (
          <div className="pt-6 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Semester-wise SGPA Performance Trajectory</span>
            </h3>

            <div className="h-48 w-full bg-surface/40 p-4 rounded-xl border border-border">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="sem" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0F172A", borderColor: "#1E293B", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(val: any) => [`${val} SGPA`, "Grade Point Average"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sgpa" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#3B82F6", strokeWidth: 2, stroke: "#1E293B" }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Revaluation History Card if applicable */}
      {revaluation_history.length > 0 && (
        <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
          <div className="p-5 bg-[#050811] border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GitCompare className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Revaluation Scrutiny Trajectory</h3>
            </div>
            <span className="text-xs text-cyan-400 font-mono">
              {revaluation_history.length} Subject(s) Evaluated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080D1A] text-slate-400 text-[10px] uppercase font-semibold border-b border-border">
                <tr>
                  <th className="py-2.5 px-4">Subject</th>
                  <th className="py-2.5 px-4 text-center">Original Grade</th>
                  <th className="py-2.5 px-4 text-center">Revised Grade</th>
                  <th className="py-2.5 px-4 text-center">Grade Point Delta</th>
                  <th className="py-2.5 px-4 text-right">Transition Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {revaluation_history.map((rev: any, idx: number) => (
                  <tr key={idx} className="hover:bg-surface/50">
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-blue-400 mr-2">{rev.subject_code}</span>
                      <span className="text-white font-medium">{rev.subject_name}</span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-400">{rev.original_grade}</td>
                    <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-400">{rev.revaluation_grade}</td>
                    <td className="py-2.5 px-4 text-center font-mono">
                      {rev.points_difference > 0 ? (
                        <span className="text-emerald-400 font-bold">+{rev.points_difference}</span>
                      ) : rev.points_difference < 0 ? (
                        <span className="text-red-400">{rev.points_difference}</span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rev.backlog_cleared ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                        rev.status_change === "GRADE_IMPROVED" ? "bg-blue-500/20 text-blue-400" :
                        "bg-slate-800 text-slate-400"
                      }`}>
                        {rev.status_change}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Examination History Detailed Ledger */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <span>Detailed Examination Ledger & Marks Memos</span>
        </h2>

        {academic_history.map((examRecord: any, eIdx: number) => (
          <div key={eIdx} className="rounded-2xl bg-surface-card border border-border overflow-hidden">
            
            {/* Exam Banner */}
            <div className="p-5 bg-[#050811] border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    examRecord.exam_type === "REVALUATION" ? "bg-cyan-500/15 text-cyan-400" : "bg-blue-500/15 text-blue-400"
                  }`}>
                    {examRecord.exam_type}
                  </span>
                  <span className="text-xs text-slate-400">Semester {examRecord.semester || "-"}</span>
                </div>
                <h3 className="font-bold text-white text-sm">{examRecord.exam_title}</h3>
              </div>

              <div className="flex items-center space-x-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">SGPA</span>
                  <span className="font-bold text-blue-400 text-sm">{examRecord.sgpa ?? "-"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Backlogs</span>
                  <span className={`font-bold text-sm ${examRecord.backlog_count === 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {examRecord.backlog_count}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Status</span>
                  <span className="font-bold text-white text-sm">{examRecord.result_status}</span>
                </div>
              </div>
            </div>

            {/* Subject Marks Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#080D1A] text-slate-400 text-[10px] uppercase font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-4">Subject Code</th>
                    <th className="py-2.5 px-4">Subject Title</th>
                    <th className="py-2.5 px-4 text-center">Credits</th>
                    <th className="py-2.5 px-4 text-center">Grade Secured</th>
                    <th className="py-2.5 px-4 text-center">Grade Points</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {examRecord.subjects?.map((s: any, sIdx: number) => (
                    <tr key={sIdx} className="hover:bg-surface/50">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-400">{s.subject_code}</td>
                      <td className="py-2.5 px-4 font-medium text-white">{s.subject_name}</td>
                      <td className="py-2.5 px-4 text-center font-mono">{s.credits}</td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-blue-400">{s.grade}</td>
                      <td className="py-2.5 px-4 text-center font-mono">{s.grade_points}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.status === "PASSED" ? "bg-emerald-500/15 text-emerald-400" :
                          s.status === "ABSENT" ? "bg-slate-700 text-slate-400" :
                          "bg-red-500/15 text-red-400"
                        }`}>
                          {s.status}
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
  );
}
