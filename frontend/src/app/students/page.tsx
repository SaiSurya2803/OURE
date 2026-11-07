"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Database, Search, Filter, ArrowRight, User, 
  GraduationCap, ChevronLeft, ChevronRight
} from "lucide-react";

export default function StudentDatabasePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("ALL");
  const [page, setPage] = useState(1);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: search.trim(),
        branch: branch,
        page: page.toString(),
        limit: "50"
      });
      const res = await fetch(`/api/students?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, branch, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
            <Database className="w-7 h-7 text-blue-500" />
            <span>Osmania University Student Directory</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Universal academic repository indexing engineering students across Osmania University affiliated colleges.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-surface-card border border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by Hall Ticket (12 digits) or Student Name..."
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
            <option value="ALL">All Engineering Branches</option>
            <option value="732">Civil Engineering (732)</option>
            <option value="733">Computer Science & Engineering (733)</option>
            <option value="734">Electrical & Electronics (734)</option>
            <option value="735">Electronics & Communication (735)</option>
            <option value="736">Mechanical Engineering (736)</option>
            <option value="737">Information Technology (737)</option>
            <option value="748">AI & Machine Learning (748)</option>
            <option value="749">AI & Data Science (749)</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Querying student repository...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <User className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">No students found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#050811] text-slate-400 uppercase text-[11px] font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Hall Ticket</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">College</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4 text-center">Batch</th>
                  <th className="py-3 px-4 text-center">Exams Evaluated</th>
                  <th className="py-3 px-4 text-right">Latest SGPA</th>
                  <th className="py-3 px-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((stud) => (
                  <tr key={stud.id} className="hover:bg-surface/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">
                      <Link href={`/students/${stud.hall_ticket}`} className="hover:underline">
                        {stud.hall_ticket}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{stud.name || "N/A"}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-[200px] truncate">{stud.college_name}</td>
                    <td className="py-3 px-4 text-slate-300">{stud.branch_name}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">{stud.batch_year || "-"}</td>
                    <td className="py-3 px-4 text-center font-mono">{stud.exams_count}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {stud.latest_sgpa !== null ? stud.latest_sgpa.toFixed(2) : "-"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/students/${stud.hall_ticket}`}
                        className="px-2.5 py-1 rounded-lg bg-surface hover:bg-slate-700 text-slate-300 hover:text-white border border-border text-[11px] inline-flex items-center space-x-1"
                      >
                        <span>Profile</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {total > 50 && (
          <div className="p-4 bg-[#050811] border-t border-border flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {(page - 1) * 50 + 1} to {Math.min(page * 50, total)} of {total} students
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg bg-surface hover:bg-slate-800 disabled:opacity-40 border border-border"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-white">Page {page}</span>
              <button
                disabled={page * 50 >= total}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg bg-surface hover:bg-slate-800 disabled:opacity-40 border border-border"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
