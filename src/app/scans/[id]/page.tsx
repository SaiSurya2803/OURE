"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Cpu, Play, Pause, XCircle, RotateCcw, 
  BarChart3, Layers, CheckCircle2, AlertTriangle, 
  Terminal, Clock, Gauge, ArrowLeft
} from "lucide-react";

export default function ScanMonitorPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/scans/${jobId}/status`);
      if (res.ok) {
        const data = await res.json();
        setJob(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Poll status every 1 second when active
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, 1200);

    return () => clearInterval(interval);
  }, [jobId]);

  // Auto-scroll terminal log to bottom
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [job?.recent_logs]);

  const handlePause = async () => {
    setActionLoading(true);
    await fetch(`/api/scans/${jobId}/pause`, { method: "POST" });
    await fetchStatus();
    setActionLoading(false);
  };

  const handleResume = async () => {
    setActionLoading(true);
    await fetch(`/api/scans/${jobId}/resume`, { method: "POST" });
    await fetchStatus();
    setActionLoading(false);
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this background scan job?")) return;
    setActionLoading(true);
    await fetch(`/api/scans/${jobId}/cancel`, { method: "POST" });
    await fetchStatus();
    setActionLoading(false);
  };

  const handleRetry = async () => {
    setActionLoading(true);
    const res = await fetch(`/api/scans/${jobId}/retry`, { method: "POST" });
    const data = await res.json();
    if (data.new_job_id) {
      router.push(`/scans/${data.new_job_id}`);
    } else {
      alert("No failed attempts to retry.");
    }
    setActionLoading(false);
  };

  if (loading && !job) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Cpu className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Connecting to background worker telemetry...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Scan Job Not Found</h2>
        <Link href="/scans" className="text-sm text-blue-400 hover:underline">
          Return to Scan Monitor Directory
        </Link>
      </div>
    );
  }

  const isRunning = job.status === "RUNNING";
  const isPaused = job.status === "PAUSED";
  const isCompleted = job.status === "COMPLETED";

  const formatEta = (seconds: number) => {
    if (!seconds || seconds <= 0) return "Calculating...";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/scans"
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Scan Jobs</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Scan Monitor: <span className="font-mono text-blue-400 text-base">{job.id.slice(0, 12)}...</span>
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              isRunning ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse" :
              isCompleted ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
              isPaused ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
              "bg-red-500/15 text-red-400 border border-red-500/30"
            }`}>
              {job.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono truncate max-w-2xl">
            Target URL: {job.url}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {isRunning && (
            <button
              onClick={handlePause}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-medium flex items-center space-x-1.5 transition-all"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause Scan</span>
            </button>
          )}

          {isPaused && (
            <button
              onClick={handleResume}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center space-x-1.5 shadow-md shadow-blue-600/30 transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume Scan</span>
            </button>
          )}

          {(isRunning || isPaused) && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-medium flex items-center space-x-1.5 transition-all"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}

          {job.failed > 0 && !isRunning && (
            <button
              onClick={handleRetry}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 text-xs font-medium flex items-center space-x-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry {job.failed} Failed</span>
            </button>
          )}

          {job.exam_id && (
            <>
              <Link
                href={`/analytics?exam_id=${job.exam_id}`}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center space-x-1.5 shadow-md shadow-blue-600/30 transition-all"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>View Analytics</span>
              </Link>
              <Link
                href={`/results?exam_id=${job.exam_id}`}
                className="px-3.5 py-2 rounded-xl bg-surface hover:bg-slate-800 text-slate-300 hover:text-white border border-border text-xs font-medium flex items-center space-x-1.5 transition-all"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Explore Results</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="rounded-2xl bg-surface-card border border-border p-6 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white text-base">Progress</span>
            <span className="text-xs text-slate-400">
              ({job.processed} of {job.total} candidates completed)
            </span>
          </div>
          <div className="text-xl font-mono font-bold text-blue-400">
            {job.progress_percentage}%
          </div>
        </div>

        {/* Outer bar */}
        <div className="w-full bg-surface h-3.5 rounded-full overflow-hidden border border-border relative">
          <div
            className={`h-full transition-all duration-300 ${
              isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-blue-600 to-cyan-400"
            }`}
            style={{ width: `${job.progress_percentage}%` }}
          />
        </div>

        {/* Telemetry metrics strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-400 border-t border-border/50">
          <div className="flex items-center space-x-2">
            <Gauge className="w-4 h-4 text-blue-400" />
            <span>Processing Speed:</span>
            <span className="font-mono text-white font-semibold">{job.speed_per_sec} items/sec</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Estimated Completion:</span>
            <span className="font-mono text-white font-semibold">
              {isCompleted ? "Completed" : formatEta(job.eta_seconds)}
            </span>
          </div>
        </div>
      </div>

      {/* 5 KPI Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        <div className="p-4 rounded-xl bg-surface-card border border-border">
          <div className="text-xs text-slate-400 mb-1">Total Queue</div>
          <div className="text-2xl font-bold text-white tracking-tight">{job.total}</div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border">
          <div className="text-xs text-slate-400 mb-1">Processed</div>
          <div className="text-2xl font-bold text-blue-400 tracking-tight">{job.processed}</div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border">
          <div className="text-xs text-slate-400 mb-1">Valid Results Found</div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{job.successful}</div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border">
          <div className="text-xs text-slate-400 mb-1">Not Found / Attempts</div>
          <div className="text-2xl font-bold text-slate-400 tracking-tight">{job.failed}</div>
        </div>

        <div className="p-4 rounded-xl bg-surface-card border border-border col-span-2 sm:col-span-1">
          <div className="text-xs text-slate-400 mb-1">Pending</div>
          <div className="text-2xl font-bold text-indigo-400 tracking-tight">{job.pending}</div>
        </div>

      </div>

      {/* Real-Time Processing Terminal Log */}
      <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
        <div className="bg-[#050811] px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-slate-300">
              Live Asynchronous Worker Logs
            </span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Streaming</span>
          </div>
        </div>

        <div
          ref={logTerminalRef}
          className="h-80 overflow-y-auto p-4 bg-[#070B16] font-mono text-xs space-y-1.5 scrollbar-thin select-text"
        >
          {(!job.recent_logs || job.recent_logs.length === 0) ? (
            <div className="text-slate-600 italic">Awaiting worker telemetry events...</div>
          ) : (
            job.recent_logs.map((log: any, idx: number) => {
              const timeStr = log.timestamp ? log.timestamp.slice(11, 19) : "";
              const isSuccess = log.level === "SUCCESS";
              const isWarning = log.level === "WARNING";
              const isError = log.level === "ERROR";

              return (
                <div key={idx} className="flex items-start space-x-2 leading-relaxed">
                  <span className="text-slate-600 shrink-0 select-none">[{timeStr}]</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                    isSuccess ? "bg-emerald-500/20 text-emerald-400" :
                    isWarning ? "bg-amber-500/20 text-amber-400" :
                    isError ? "bg-red-500/20 text-red-400" :
                    "bg-blue-500/20 text-blue-400"
                  }`}>
                    {log.level}
                  </span>
                  <span className={
                    isSuccess ? "text-slate-200" :
                    isWarning ? "text-amber-300" :
                    isError ? "text-red-300" :
                    "text-slate-400"
                  }>
                    {log.message}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
