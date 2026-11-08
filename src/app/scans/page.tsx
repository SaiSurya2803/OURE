"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Cpu, ArrowRight, RefreshCw, CheckCircle2, 
  Clock, AlertCircle, Sparkles
} from "lucide-react";

export default function ScansListPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/scans");
      if (res.ok) {
        setScans(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScans();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center space-x-3">
            <Cpu className="w-7 h-7 text-blue-500" />
            <span>Scan Monitor & Background Workers</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Asynchronous task queue executing rate-limited candidate queries against Osmania University result servers.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchScans}
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
            <span>Start New Scan</span>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
        {scans.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Cpu className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">No scan jobs registered yet.</p>
            <Link
              href="/analyze"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              <span>Analyze an OU Results URL</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {scans.map((s) => (
              <div key={s.id} className="p-4 sm:p-5 hover:bg-surface transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      s.status === "COMPLETED" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                      s.status === "RUNNING" ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse" :
                      s.status === "PAUSED" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                      "bg-slate-700 text-slate-300"
                    }`}>
                      {s.status}
                    </span>
                    <span className="font-mono text-xs text-slate-400">Job ID: {s.id}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono truncate max-w-xl">{s.url}</p>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">
                      {s.successful} valid / {s.total} candidates
                    </div>
                    <div className="text-xs text-slate-400">{s.progress_percentage}% completed</div>
                  </div>

                  <Link
                    href={`/scans/${s.id}`}
                    className="px-4 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/30 text-xs font-medium flex items-center space-x-1.5 transition-all"
                  >
                    <span>Monitor Telemetry</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
