"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowRight, Search, Sparkles, CheckCircle2, ShieldCheck, 
  BarChart3, GitCompare, FileSpreadsheet, Database, Cpu, 
  Layers, ArrowUpRight
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("https://www.osmania.ac.in/res07/20260921.jsp");

  const handleQuickAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      router.push(`/analyze?url=${encodeURIComponent(url.trim())}`);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-gradient-to-tr from-blue-600/15 via-cyan-500/10 to-indigo-600/15 blur-[120px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        
        {/* Banner Pill */}
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Osmania University Results Automation Platform</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-tight">
          Paste an OU results URL. <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            Discover results. Understand performance. Track every change.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto">
          The automated examination intelligence platform built specifically for Osmania University B.E. & B.Tech engineering results. Inspects official web forms, discovers hall tickets, computes deep analytics, and diffs revaluation updates automatically.
        </p>

        {/* Quick URL Input Bar */}
        <form onSubmit={handleQuickAnalyze} className="mt-10 max-w-3xl mx-auto">
          <div className="relative flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-surface-card border border-border-light shadow-2xl shadow-blue-900/20">
            <div className="relative flex-1 w-full flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.osmania.ac.in/res07/20260921.jsp"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface text-sm text-white placeholder-slate-500 border border-border focus:outline-none focus:border-blue-500 font-mono transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              <span>ANALYZE RESULTS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Quick presets */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span className="text-slate-500">Official Examples:</span>
            <button
              type="button"
              onClick={() => setUrl("https://www.osmania.ac.in/res07/20260921.jsp")}
              className="px-2.5 py-1 rounded-md bg-surface border border-border hover:border-blue-500/50 hover:text-blue-400 font-mono transition-colors"
            >
              20260921.jsp (Revaluation)
            </button>
            <button
              type="button"
              onClick={() => setUrl("https://www.osmania.ac.in/res07/20260655.jsp")}
              className="px-2.5 py-1 rounded-md bg-surface border border-border hover:border-blue-500/50 hover:text-blue-400 font-mono transition-colors"
            >
              20260655.jsp (Main/Backlog)
            </button>
          </div>
        </form>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          
          <div className="p-6 rounded-2xl bg-surface-card border border-border/80 hover:border-blue-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:scale-105 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Automated Discovery & Inspection</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Modular adapter engine inspects official OU ASP/JSP result forms, discovers candidate patterns across colleges, and extracts results in controlled concurrent batches.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-card border border-border/80 hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-105 transition-transform">
              <GitCompare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Revaluation Intelligence</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Match revised results against original marks per student and subject code. Detect marks improved, backlogs cleared, and SGPA shifts with zero manual matching.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-card border border-border/80 hover:border-indigo-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Deep Academic Analytics</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Instant pass percentage, branch comparisons, grade distributions, standard deviations, and downloadable multi-sheet Excel workbooks and ReportLab PDF dossiers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface-card border border-border/80 hover:border-purple-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Gemini AI Intelligence</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Synthesize Dean executive briefings, failure bottlenecks, and student counseling roadmaps powered by Gemini 1.5 Flash (with zero-setup built-in AI fallback).
            </p>
          </div>

        </div>

      </section>

      {/* Step-by-Step Pipeline Section */}
      <section className="border-t border-border bg-[#060A14] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How OU Results Intelligence Works</h2>
            <p className="mt-3 text-sm text-slate-400">
              End-to-end automated architecture designed for Osmania University examination systems.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-5 rounded-xl bg-surface border border-border">
              <div className="text-xs font-mono text-blue-400 font-semibold mb-2">STEP 01</div>
              <h4 className="font-semibold text-white mb-1">Paste Official URL</h4>
              <p className="text-xs text-slate-400">
                Submit any official OU result link. The engine inspects form fields, hidden tokens, and examination titles.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-surface border border-border">
              <div className="text-xs font-mono text-cyan-400 font-semibold mb-2">STEP 02</div>
              <h4 className="font-semibold text-white mb-1">Pattern Discovery</h4>
              <p className="text-xs text-slate-400">
                Automatically determines college codes, branches, batches, and candidate ranges for automated collection.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-surface border border-border">
              <div className="text-xs font-mono text-indigo-400 font-semibold mb-2">STEP 03</div>
              <h4 className="font-semibold text-white mb-1">Background Worker</h4>
              <p className="text-xs text-slate-400">
                Rate-limited asynchronous worker processes candidates, extracts subjects, credits, SGPA, and saves to database.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-surface border border-border">
              <div className="text-xs font-mono text-emerald-400 font-semibold mb-2">STEP 04</div>
              <h4 className="font-semibold text-white mb-1">Instant Intelligence</h4>
              <p className="text-xs text-slate-400">
                View interactive analytics dashboards, export multi-sheet Excel files, or generate analytical PDF memos.
              </p>
            </div>

          </div>

          <div className="mt-12 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all border border-border"
            >
              <span>Explore Dashboard</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
