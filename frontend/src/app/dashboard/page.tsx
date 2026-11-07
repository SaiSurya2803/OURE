"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Activity, GraduationCap, Users, CheckCircle2, 
  ArrowRight, Sparkles, BarChart3, GitCompare, 
  FileSpreadsheet, RefreshCw, Layers
} from "lucide-react";

export default function DashboardPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examsRes, scansRes] = await Promise.all([
        fetch("/api/examinations"),
        fetch("/api/scans")
      ]);
      if (examsRes.ok) setExams(await examsRes.json());
      if (scansRes.ok) setScans(await scansRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalCandidates = exams.reduce((acc, curr) => acc + (curr.total_candidates || 0), 0);
  const avgPassRate = exams.length > 0 
    ? (exams.reduce((acc, curr) => acc + (curr.pass_percentage || 0), 0) / exams.length).toFixed(1)
    : "0.0";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Executive Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time examination telemetry, scan job orchestration, and academic metrics across Osmania University.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-surface border border-border text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/analyze"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyze New Results URL</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="p-5 rounded-2xl bg-surface-card border border-border relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Total Scanned Exams</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{exams.length}</div>
          <p className="text-xs text-slate-500 mt-2">Active in platform database</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Extracted Student Results</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{totalCandidates}</div>
          <p className="text-xs text-slate-500 mt-2">Verified official records</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Average Pass Percentage</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{avgPassRate}%</div>
          <p className="text-xs text-slate-500 mt-2">Across evaluated sessions</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Background Worker Jobs</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white tracking-tight">{scans.length}</div>
          <p className="text-xs text-slate-500 mt-2">Scan runs logged</p>
        </div>

      </div>

      {/* Main Grid: Recent Examinations & Active Scans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Recent Examinations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-blue-400" />
              <span>Monitored Osmania University Examinations</span>
            </h2>
            <Link href="/examinations" className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
            {exams.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <GraduationCap className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">No examinations collected yet.</p>
                <Link
                  href="/analyze"
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-500"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Your First OU Result URL</span>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {exams.slice(0, 5).map((exam) => (
                  <div key={exam.id} className="p-4 sm:p-5 hover:bg-surface transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          exam.exam_type === "REVALUATION" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          {exam.exam_type}
                        </span>
                        <span className="text-xs text-slate-500">{exam.exam_date_str || "Recently Inspected"}</span>
                      </div>
                      <h3 className="font-semibold text-white text-sm line-clamp-1">{exam.title}</h3>
                      <p className="text-xs text-slate-400 font-mono line-clamp-1">{exam.url}</p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">{exam.total_candidates} results</div>
                        <div className="text-xs text-emerald-400 font-medium">{exam.pass_percentage}% Pass</div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/analytics?exam_id=${exam.id}`}
                          className="px-3 py-1.5 rounded-lg bg-surface hover:bg-slate-800 text-slate-300 hover:text-white border border-border text-xs font-medium flex items-center space-x-1"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>Analytics</span>
                        </Link>
                        <Link
                          href={`/results?exam_id=${exam.id}`}
                          className="px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-medium flex items-center space-x-1"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Results</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Actions & Recent Scans */}
        <div className="space-y-6">
          
          {/* Quick Action Cards */}
          <div className="rounded-2xl bg-surface-card border border-border p-5 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
              Intelligence Actions
            </h3>
            
            <div className="space-y-2">
              <Link
                href="/analyze"
                className="p-3 rounded-xl bg-surface hover:bg-slate-800 border border-border hover:border-blue-500/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-blue-400">Analyze New URL</div>
                    <div className="text-[11px] text-slate-500">Inspect & start automated collection</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
              </Link>

              <Link
                href="/revaluation"
                className="p-3 rounded-xl bg-surface hover:bg-slate-800 border border-border hover:border-cyan-500/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                    <GitCompare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-400">Revaluation Diffing</div>
                    <div className="text-[11px] text-slate-500">Compare original vs revised results</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
              </Link>

              <Link
                href="/reports"
                className="p-3 rounded-xl bg-surface hover:bg-slate-800 border border-border hover:border-indigo-500/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-indigo-400">Download Reports</div>
                    <div className="text-[11px] text-slate-500">Export Excel, CSV & ReportLab PDFs</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
              </Link>
            </div>
          </div>

          {/* Recent Scans Widget */}
          <div className="rounded-2xl bg-surface-card border border-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span>Recent Scan Jobs</span>
              </h3>
              <Link href="/scans" className="text-xs text-blue-400 hover:text-blue-300">
                Monitor
              </Link>
            </div>

            {scans.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No background scans launched yet.</p>
            ) : (
              <div className="space-y-2">
                {scans.slice(0, 4).map((scan) => (
                  <Link
                    key={scan.id}
                    href={`/scans/${scan.id}`}
                    className="p-2.5 rounded-xl bg-surface hover:bg-slate-800 border border-border block transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400 truncate max-w-[140px]">
                        Job {scan.id.slice(0, 8)}...
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        scan.status === "COMPLETED" ? "bg-emerald-500/15 text-emerald-400" :
                        scan.status === "RUNNING" ? "bg-blue-500/15 text-blue-400 animate-pulse" :
                        scan.status === "PAUSED" ? "bg-amber-500/15 text-amber-400" :
                        "bg-slate-700 text-slate-300"
                      }`}>
                        {scan.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{scan.successful} valid / {scan.total} total</span>
                      <span className="font-mono">{scan.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${scan.progress_percentage}%` }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
