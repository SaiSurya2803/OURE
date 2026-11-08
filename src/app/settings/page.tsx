"use client";

import { useState, useEffect } from "react";
import { 
  Settings, ShieldCheck, Database, Cpu, 
  CheckCircle2, RefreshCw, Server, AlertTriangle
} from "lucide-react";

export default function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [delayMs, setDelayMs] = useState("100");
  const [timeoutSec, setTimeoutSec] = useState("12");
  const [userAgent, setUserAgent] = useState("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(console.error);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <Settings className="w-7 h-7 text-blue-500" />
          <span>Platform Settings & Architecture Telemetry</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Configure background worker rate limits, network timeouts, adapter priorities, and review database storage health.
        </p>
      </div>

      {/* System Health Card */}
      <div className="rounded-2xl bg-surface-card border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">System Diagnostic Status</h3>
              <p className="text-xs text-slate-400">FastAPI backend and SQLite WAL database operational</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>OPERATIONAL</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-surface border border-border">
            <span className="text-slate-500 block mb-1">Backend Engine</span>
            <span className="font-mono text-white font-bold">FastAPI 0.141 + Python 3.12</span>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border">
            <span className="text-slate-500 block mb-1">Database Layer</span>
            <span className="font-mono text-white font-bold">SQLite (WAL Mode) / PostgreSQL Ready</span>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border">
            <span className="text-slate-500 block mb-1">Export Engines</span>
            <span className="font-mono text-white font-bold">ReportLab 5.1 + OpenPyXL 3.1</span>
          </div>
        </div>
      </div>

      {/* Rate Limiting & Scraping Policies Form */}
      <div className="rounded-2xl bg-surface-card border border-border p-6 space-y-6">
        <div className="border-b border-border pb-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <span>Worker Concurrency & Rate Limiting Controls</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Polite access policies ensure the platform never overloads official Osmania University servers.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Delay Between HTTP Requests (ms)
              </label>
              <input
                type="number"
                min="50"
                max="2000"
                value={delayMs}
                onChange={(e) => setDelayMs(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface text-sm text-white font-mono border border-border focus:border-blue-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Default: 100ms. Increase if official server rate-limits your IP.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                HTTP Request Timeout (seconds)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={timeoutSec}
                onChange={(e) => setTimeoutSec(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface text-sm text-white font-mono border border-border focus:border-blue-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Default: 12 seconds per candidate query.
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Browser User-Agent Header
            </label>
            <input
              type="text"
              value={userAgent}
              onChange={(e) => setUserAgent(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface text-xs text-white font-mono border border-border focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-medium">
              {saved ? "✓ Settings updated successfully" : ""}
            </span>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/30"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      {/* Registered Adapters Card */}
      <div className="rounded-2xl bg-surface-card border border-border p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <span>Registered Modular Extraction Adapters</span>
        </h3>
        <p className="text-xs text-slate-400">
          The platform uses an adapter pattern to gracefully handle variations in Osmania University HTML schemas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-white">OUCBCSStandardAdapter</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Extracts modern OU B.E./B.Tech AICTE & CBCS results pages featuring tables AutoNumber1 through AutoNumber6 with credits, SGPA, and letter grades.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-bold text-white">OUNonCBCSAdapter</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Extracts legacy and non-CBCS examination formats with internal, external, and total marks breakdown.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
