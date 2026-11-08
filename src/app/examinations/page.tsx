"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  GraduationCap, Search, ArrowRight, BarChart3, 
  Layers, Download, Sparkles, RefreshCw
} from "lucide-react";

export default function ExaminationsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/examinations");
      if (res.ok) {
        setExams(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const filtered = exams.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.url.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <GraduationCap className="w-7 h-7 text-blue-500" />
            <span>Monitored Examination Repository</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Universal archive of all Osmania University examinations analyzed and archived in the intelligence platform.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchExams}
            className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-surface border border-border text-slate-300 hover:text-white text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/analyze"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyze New Exam</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-surface-card border border-border">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by exam title or official URL..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface text-xs text-white placeholder-slate-500 border border-border focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Examinations List */}
      <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Querying examination repository...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <GraduationCap className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">No examinations found.</p>
            <Link
              href="/analyze"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              <span>Analyze an OU Results URL</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((exam) => (
              <div key={exam.id} className="p-5 hover:bg-surface/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      exam.exam_type === "REVALUATION" ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                    }`}>
                      {exam.exam_type}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                      {exam.regulation} Regulation
                    </span>
                    <span className="text-xs text-slate-400">Date: {exam.exam_date_str || "Current"}</span>
                  </div>

                  <h3 className="font-bold text-white text-base leading-snug">{exam.title}</h3>
                  <p className="text-xs text-slate-400 font-mono truncate max-w-2xl">{exam.url}</p>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right shrink-0">
                    <div className="text-base font-extrabold text-white">{exam.total_candidates} results</div>
                    <div className="text-xs text-emerald-400 font-bold">{exam.pass_percentage}% Pass Rate</div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <Link
                      href={`/analytics?exam_id=${exam.id}`}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center space-x-1"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Analytics</span>
                    </Link>
                    <Link
                      href={`/results?exam_id=${exam.id}`}
                      className="px-3 py-1.5 rounded-xl bg-surface hover:bg-slate-800 text-slate-300 hover:text-white border border-border text-xs font-medium flex items-center space-x-1"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Results</span>
                    </Link>
                    <a
                      href={`/api/exports/excel/${exam.id}`}
                      download
                      className="p-1.5 rounded-xl bg-surface hover:bg-slate-800 text-slate-300 hover:text-white border border-border"
                      title="Download Excel"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
