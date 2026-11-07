"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Layers, Search, Filter, Eye, X, GraduationCap, 
  ChevronLeft, ChevronRight, Download, CheckCircle2, 
  AlertCircle, User
} from "lucide-react";

function ResultsContent() {
  const searchParams = useSearchParams();
  const qExamId = searchParams.get("exam_id");

  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(qExamId || "");
  const [resultsData, setResultsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  // Modal Detail State
  const [selectedResult, setSelectedResult] = useState<any>(null);

  // Load exam list on mount
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

  // Fetch results when exam or filters change
  useEffect(() => {
    if (!selectedExamId) return;
    setLoading(true);
    const params = new URLSearchParams({
      search: search.trim(),
      branch: branch,
      status: status,
      page: page.toString(),
      limit: "50"
    });

    fetch(`/api/examinations/${selectedExamId}/results?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setResultsData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedExamId, search, branch, status, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
            <Layers className="w-7 h-7 text-blue-500" />
            <span>Results Explorer</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Searchable, filterable student records and subject-level marks memos for Osmania University examinations.
          </p>
        </div>

        {selectedExamId && (
          <div className="flex items-center space-x-2">
            <a
              href={`/api/exports/excel/${selectedExamId}`}
              download
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-surface hover:bg-slate-800 border border-border text-slate-300 hover:text-white text-xs font-medium transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </a>
            <Link
              href={`/analytics?exam_id=${selectedExamId}`}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
            >
              <span>View Analytics</span>
            </Link>
          </div>
        )}
      </div>

      {/* Filter Toolbar Card */}
      <div className="p-4 rounded-2xl bg-surface-card border border-border space-y-4">
        
        {/* Exam Select Row */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Select Examination
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface text-sm text-white border border-border focus:border-blue-500 focus:outline-none"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} — {ex.total_candidates} results ({ex.pass_percentage}% Pass)
              </option>
            ))}
          </select>
        </div>

        {/* Search & Sub-filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Hall Ticket or Name..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface text-xs text-white placeholder-slate-500 border border-border focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={branch}
              onChange={(e) => {
                setBranch(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-surface text-xs text-white border border-border focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Branches</option>
              <option value="732">Civil Engineering (732)</option>
              <option value="733">Computer Science & Eng (733)</option>
              <option value="734">Electrical & Electronics (734)</option>
              <option value="735">Electronics & Comm (735)</option>
              <option value="736">Mechanical Engineering (736)</option>
              <option value="737">Information Technology (737)</option>
              <option value="748">AI & Machine Learning (748)</option>
              <option value="749">AI & Data Science (749)</option>
            </select>
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-surface text-xs text-white border border-border focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Result Statuses</option>
              <option value="PASSED">Passed Only</option>
              <option value="PROMOTED">Promoted (With Backlogs)</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Querying examination database records...
          </div>
        ) : !resultsData?.items || resultsData.items.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Layers className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">No records found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#050811] text-slate-400 uppercase tracking-wider font-semibold border-b border-border text-[11px]">
                <tr>
                  <th className="py-3 px-4">Hall Ticket</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Sem</th>
                  <th className="py-3 px-4 text-right">SGPA</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Backlogs</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resultsData.items.map((row: any) => (
                  <tr
                    key={row.id}
                    className="hover:bg-surface/70 transition-colors cursor-pointer"
                    onClick={() => setSelectedResult(row)}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-blue-400">
                      {row.hall_ticket}
                    </td>
                    <td className="py-3 px-4 font-medium text-white max-w-[200px] truncate">
                      {row.student_name || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-[180px] truncate">
                      {row.branch_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {row.semester || "-"}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white text-right">
                      {row.sgpa !== null ? row.sgpa.toFixed(2) : "-"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.result_status === "PASSED" ? "bg-emerald-500/15 text-emerald-400" :
                        row.result_status === "PROMOTED" ? "bg-amber-500/15 text-amber-400" :
                        "bg-red-500/15 text-red-400"
                      }`}>
                        {row.result_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {row.backlog_count === 0 ? (
                        <span className="text-emerald-400 font-bold">0</span>
                      ) : (
                        <span className="text-red-400 font-bold">{row.backlog_count}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedResult(row);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-surface hover:bg-slate-700 text-slate-300 hover:text-white border border-border text-[11px] font-medium inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Memo</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {resultsData && resultsData.total_pages > 1 && (
          <div className="p-4 bg-[#050811] border-t border-border flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, resultsData.total)} of {resultsData.total} candidates
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg bg-surface hover:bg-slate-800 disabled:opacity-40 border border-border"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-white">
                Page {page} of {resultsData.total_pages}
              </span>
              <button
                disabled={page >= resultsData.total_pages}
                onClick={() => setPage(p => Math.min(p + 1, resultsData.total_pages))}
                className="p-1.5 rounded-lg bg-surface hover:bg-slate-800 disabled:opacity-40 border border-border"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Marks Memo Drawer */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-5 bg-[#050811] border-b border-border flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-blue-400 font-bold">
                  {selectedResult.hall_ticket}
                </span>
                <h3 className="text-base font-bold text-white">
                  {selectedResult.student_name || "Student Marks Memo"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="p-1.5 rounded-xl bg-surface hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-surface border border-border">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">College</span>
                  <span className="font-medium text-white truncate block">{selectedResult.college_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Branch</span>
                  <span className="font-medium text-white truncate block">{selectedResult.branch_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">SGPA</span>
                  <span className="font-mono font-bold text-blue-400 block">{selectedResult.sgpa ?? "-"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Backlogs</span>
                  <span className={`font-mono font-bold block ${selectedResult.backlog_count === 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {selectedResult.backlog_count}
                  </span>
                </div>
              </div>

              {/* Subjects Table */}
              <div>
                <h4 className="font-bold text-slate-300 mb-2">Subject Performance Details</h4>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#050811] text-slate-400 font-semibold border-b border-border text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Subject Title</th>
                        <th className="py-2.5 px-3 text-center">Credits</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedResult.subjects?.map((s: any, idx: number) => (
                        <tr key={idx} className="hover:bg-surface/50">
                          <td className="py-2 px-3 font-mono text-slate-400">{s.code}</td>
                          <td className="py-2 px-3 text-white">{s.name}</td>
                          <td className="py-2 px-3 text-center font-mono">{s.credits}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-blue-400">{s.grade}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              s.status === "PASSED" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
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

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#050811] border-t border-border flex items-center justify-between">
              <Link
                href={`/students/${selectedResult.hall_ticket}`}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <User className="w-3.5 h-3.5" />
                <span>Open Full Student Academic Profile</span>
              </Link>
              <button
                onClick={() => setSelectedResult(null)}
                className="px-4 py-1.5 rounded-lg bg-surface hover:bg-slate-800 text-xs text-slate-300"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function ResultsExplorerPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 text-sm">Loading examination results...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
