"use client";

import { useState, useEffect } from "react";
import { 
  FileSpreadsheet, Download, FileText, CheckCircle2, 
  Layers, GraduationCap, ShieldCheck, Database
} from "lucide-react";

export default function ReportsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [htnoInput, setHtnoInput] = useState("");

  useEffect(() => {
    fetch("/api/examinations")
      .then((res) => res.json())
      .then((data) => {
        setExams(data);
        if (data.length > 0) {
          setSelectedExamId(data[0].id.toString());
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <FileSpreadsheet className="w-7 h-7 text-emerald-500" />
          <span>Export Center & Analytical Reports</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Generate production-grade multi-sheet Excel workbooks, raw CSV datasets, executive ReportLab PDF analytics dossiers, and individual student grade memos.
        </p>
      </div>

      {/* Mandatory Regulatory Notice */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-center space-x-3">
        <ShieldCheck className="w-5 h-5 shrink-0 text-blue-400" />
        <span>
          <strong>Notice:</strong> All generated reports are platform-generated analytical evaluation summaries produced by OU Results Intelligence. They are not official marks memos issued by Osmania University.
        </span>
      </div>

      {/* Target Examination Selection */}
      <div className="p-6 rounded-2xl bg-surface-card border border-border space-y-3">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Select Examination for Bulk Export
        </label>
        <select
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-surface text-sm text-white border border-border focus:border-blue-500 focus:outline-none"
        >
          {exams.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.title} — {ex.total_candidates} candidates ({ex.pass_percentage}% Pass)
            </option>
          ))}
        </select>
      </div>

      {/* Download Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Multi-sheet Excel */}
        <div className="p-6 rounded-2xl bg-surface-card border border-border flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Full Examination Excel Workbook</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Multi-sheet formatted .xlsx workbook with Executive Summary, Complete Student Results, Subject Marks Breakdown, Toppers Leaderboard, and Backlog Student Roster.
            </p>
          </div>

          <a
            href={selectedExamId ? `/api/exports/excel/${selectedExamId}` : "#"}
            download
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              selectedExamId 
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30" 
                : "bg-surface text-slate-600 cursor-not-allowed"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download Excel (.xlsx)</span>
          </a>
        </div>

        {/* Card 2: Executive PDF Analytics */}
        <div className="p-6 rounded-2xl bg-surface-card border border-border flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Academic Analytics Dossier PDF</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ReportLab-compiled executive dossier with pass percentage comparisons, branch-wise tables, subject difficulty metrics, and top student merit rolls.
            </p>
          </div>

          <a
            href={selectedExamId ? `/api/exports/pdf/analytics/${selectedExamId}` : "#"}
            download
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              selectedExamId 
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30" 
                : "bg-surface text-slate-600 cursor-not-allowed"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Dossier (.pdf)</span>
          </a>
        </div>

        {/* Card 3: Raw CSV Dataset */}
        <div className="p-6 rounded-2xl bg-surface-card border border-border flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all group">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Clean CSV Results Dataset</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standard RFC-4180 compliant CSV export containing all normalized candidate fields: Hall Ticket, Name, College, Branch, SGPA, CGPA, and Backlogs.
            </p>
          </div>

          <a
            href={selectedExamId ? `/api/exports/csv/${selectedExamId}` : "#"}
            download
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all ${
              selectedExamId 
                ? "bg-slate-800 hover:bg-slate-700 text-white border border-border" 
                : "bg-surface text-slate-600 cursor-not-allowed"
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download CSV Dataset (.csv)</span>
          </a>
        </div>

      </div>

      {/* Individual Student Report Generator Card */}
      <div className="rounded-2xl bg-surface-card border border-border p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <GraduationCap className="w-5 h-5 text-blue-400" />
          <span>Individual Student Grade Memo PDF Generator</span>
        </h3>
        <p className="text-xs text-slate-400">
          Enter a 12-digit Osmania University hall ticket number to instantly download their comprehensive academic report PDF.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <input
            type="text"
            value={htnoInput}
            onChange={(e) => setHtnoInput(e.target.value.trim())}
            placeholder="e.g. 160324732301"
            className="flex-1 px-4 py-2.5 rounded-xl bg-surface text-sm text-white font-mono border border-border focus:border-blue-500 focus:outline-none"
          />
          <a
            href={htnoInput ? `/api/exports/pdf/student/${htnoInput}` : "#"}
            download
            onClick={(e) => {
              if (!htnoInput) {
                e.preventDefault();
                alert("Please enter a valid hall ticket number.");
              }
            }}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Generate Student PDF</span>
          </a>
        </div>
      </div>

    </div>
  );
}
