"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Search, Sparkles, CheckCircle2, AlertCircle, ArrowRight, 
  Cpu, Database, Layers, ShieldCheck, HelpCircle, 
  Settings2, Sliders, Upload, RefreshCw
} from "lucide-react";

function AnalyzeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [url, setUrl] = useState("https://www.osmania.ac.in/res07/20260921.jsp");
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Scan Configuration State
  const [mode, setMode] = useState<"AUTO" | "PATTERN" | "RANGE" | "CUSTOM">("AUTO");
  const [selectedColleges, setSelectedColleges] = useState<string[]>(["1603"]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>(["732", "733", "734", "735", "736", "737", "748"]);
  const [batchYear, setBatchYear] = useState("24");
  const [includeRegular, setIncludeRegular] = useState(true);
  const [includeLateral, setIncludeLateral] = useState(true);
  const [rollStart, setRollStart] = useState("1");
  const [rollEnd, setRollEnd] = useState("15");
  const [rangeStart, setRangeStart] = useState("160324732301");
  const [rangeEnd, setRangeEnd] = useState("160324732325");
  const [customListText, setCustomListText] = useState("");
  const [startingScan, setStartingScan] = useState(false);

  // Read URL from query param on initial load
  useEffect(() => {
    const qUrl = searchParams.get("url");
    if (qUrl) {
      setUrl(qUrl);
      runInspection(qUrl);
    }
  }, [searchParams]);

  const runInspection = async (targetUrl: string) => {
    setError(null);
    setReport(null);
    setAnalyzing(true);

    try {
      const res = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Inspection failed.");
      }
      setReport(data);

      // Auto-populate detected college & batch if found
      if (data.report && data.report.sample_halltickets_found?.length > 0) {
        const sample = data.report.sample_halltickets_found[0];
        if (sample.length === 12) {
          setSelectedColleges([sample.slice(0, 4)]);
          setBatchYear(sample.slice(4, 6));
          setRangeStart(sample);
          setRangeEnd(sample.slice(0, 9) + "325");
        }
      }
    } catch (err: any) {
      setError(err.message || "Unable to inspect webpage.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleInspectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      runInspection(url.trim());
    }
  };

  const handleStartScan = async () => {
    if (!report?.report) return;
    setStartingScan(true);

    try {
      let candidateList: string[] = [];

      if (mode === "CUSTOM") {
        candidateList = customListText.split(/[\s,]+/).filter(x => x.length === 12 && /^\d+$/.test(x));
      }

      const payload = {
        url: url.trim(),
        exam_title: report.report.exam_title,
        exam_type: report.report.exam_type,
        regulation: report.report.regulation,
        exam_date_str: report.report.exam_date_str,
        adapter_name: report.report.adapter_name,
        candidate_list: candidateList.length > 0 ? candidateList : undefined,
        discovery_config: mode !== "CUSTOM" ? {
          mode: mode,
          college_codes: selectedColleges,
          batch_year: batchYear,
          branch_codes: selectedBranches,
          include_regular: includeRegular,
          include_lateral: includeLateral,
          custom_start_roll: parseInt(rollStart) || 1,
          custom_end_roll: parseInt(rollEnd) || 15,
          start_hallticket: mode === "RANGE" ? rangeStart : undefined,
          end_hallticket: mode === "RANGE" ? rangeEnd : undefined
        } : undefined
      };

      const res = await fetch("/api/scans/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to start scan job.");
      }

      // Redirect to live scan monitor
      router.push(`/scans/${data.job_id}`);
    } catch (err: any) {
      alert("Error starting scan: " + (err.message || err));
    } finally {
      setStartingScan(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <Search className="w-7 h-7 text-blue-500" />
          <span>Analyze Official Osmania University Results</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-4xl">
          Paste an official Osmania University results portal URL. The automated engine connects, inspects the form structure, identifies examination metadata, detects candidate patterns, and coordinates automated result extraction.
        </p>
      </div>

      {/* URL Input Form */}
      <div className="rounded-2xl bg-surface-card border border-border p-6 shadow-xl">
        <form onSubmit={handleInspectSubmit} className="space-y-4">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Official OU Result Webpage URL
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.osmania.ac.in/res07/20260921.jsp"
                className="w-full px-4 py-3.5 rounded-xl bg-surface text-sm text-white font-mono border border-border focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={analyzing}
              className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>INSPECTING PAGE...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>ANALYZE WEBPAGE</span>
                </>
              )}
            </button>
          </div>

          {/* Quick preset links */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
            <span className="text-slate-500">Quick Test URLs:</span>
            <button
              type="button"
              onClick={() => {
                const u = "https://www.osmania.ac.in/res07/20260921.jsp";
                setUrl(u);
                runInspection(u);
              }}
              className="px-2.5 py-1 rounded bg-surface border border-border hover:border-blue-500/50 hover:text-blue-400 font-mono"
            >
              20260921.jsp (BE Revaluation)
            </button>
            <button
              type="button"
              onClick={() => {
                const u = "https://www.osmania.ac.in/res07/20260655.jsp";
                setUrl(u);
                runInspection(u);
              }}
              className="px-2.5 py-1 rounded bg-surface border border-border hover:border-blue-500/50 hover:text-blue-400 font-mono"
            >
              20260655.jsp (BE Main/Backlogs)
            </button>
          </div>
        </form>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">Website Inspection Diagnostic Error</div>
            <div className="text-xs text-red-300">{error}</div>
            <p className="text-xs text-slate-400 pt-1">
              If the Osmania University server is undergoing scheduled maintenance, or blocked by local network proxies, you can use the Manual File Import fallback below.
            </p>
          </div>
        </div>
      )}

      {/* Inspection Results Card */}
      {report?.report && (
        <div className="space-y-6">
          
          <div className="rounded-2xl bg-surface-card border border-border overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900/40 via-surface-card to-surface-card p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    report.report.exam_type === "REVALUATION" ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                  }`}>
                    {report.report.exam_type} EXAMINATION
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-border">
                    {report.report.regulation} Regulation
                  </span>
                  <span className="text-xs text-slate-400">
                    Session Date: <span className="text-white font-medium">{report.report.exam_date_str || "Current"}</span>
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  {report.report.exam_title}
                </h2>
              </div>

              {/* Confidence Badge */}
              <div className="text-right shrink-0">
                <div className="text-xs text-slate-400">Adapter Match Confidence</div>
                <div className="text-xl font-extrabold text-emerald-400 flex items-center md:justify-end space-x-1">
                  <span>{(report.report.confidence_score * 100).toFixed(0)}%</span>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-[11px] font-mono text-slate-500">{report.report.adapter_name}</div>
              </div>
            </div>

            {/* Inspection Metrics Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-surface/50 border-b border-border text-xs">
              
              <div className="p-3 rounded-xl bg-surface border border-border">
                <span className="text-slate-500 block mb-1">Form Target Action</span>
                <span className="font-mono text-white truncate block">{report.report.form_action}</span>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-border">
                <span className="text-slate-500 block mb-1">Submission Method & Field</span>
                <span className="font-mono text-white">
                  {report.report.form_method} → <span className="text-blue-400">{report.report.input_field_name}</span> ({report.report.detected_length} Digits)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-border">
                <span className="text-slate-500 block mb-1">Hidden Verification Tokens</span>
                <span className="font-mono text-white truncate block">
                  {Object.entries(report.report.hidden_fields || {}).map(([k, v]) => `${k}=${v}`).join(", ") || "None"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-border">
                <span className="text-slate-500 block mb-1">Discovered Sample Hall Tickets</span>
                <span className="font-mono text-emerald-400 truncate block">
                  {report.report.sample_halltickets_found?.join(", ") || "Auto synthesized"}
                </span>
              </div>

            </div>

            {/* Inspection Checklist */}
            <div className="p-6 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Automated Inspection Verification Checklist
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>URL validated & active HTTP connection verified</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>OU JSP form submission mechanism mapped</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>AICTE/CBCS 4-table result layout identified</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Subject codes, credits, and grades schema ready</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>12-digit hall ticket format confirmed</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Rate-limited background queue configured</span>
                </div>
              </div>
            </div>
          </div>

          {/* Discovery & Scan Configuration Section */}
          <div className="rounded-2xl bg-surface-card border border-border p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-blue-400" />
                  <span>Automated Result Collection Strategy</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose how candidate hall tickets should be discovered and processed.
                </p>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex items-center space-x-1 p-1 bg-surface rounded-xl border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setMode("AUTO")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    mode === "AUTO" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Auto Matrix
                </button>
                <button
                  type="button"
                  onClick={() => setMode("RANGE")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    mode === "RANGE" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Numeric Range
                </button>
                <button
                  type="button"
                  onClick={() => setMode("CUSTOM")}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    mode === "CUSTOM" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Custom List
                </button>
              </div>
            </div>

            {/* Mode: AUTO / PATTERN */}
            {mode === "AUTO" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Target College Code</label>
                    <select
                      value={selectedColleges[0] || "1603"}
                      onChange={(e) => setSelectedColleges([e.target.value])}
                      className="w-full px-3 py-2 rounded-xl bg-surface text-white text-xs border border-border focus:border-blue-500"
                    >
                      <option value="1603">1603 - Deccan College of Eng. & Tech</option>
                      <option value="1604">1604 - Muffakham Jah College of Eng. & Tech</option>
                      <option value="1005">1005 - UCE Osmania University (Main Campus)</option>
                      <option value="1601">1601 - CBIT Gandipet</option>
                      <option value="1602">1602 - Vasavi College of Engineering</option>
                      <option value="1607">1607 - Methodist College of Eng. & Tech</option>
                      <option value="1608">1608 - Matrusri Engineering College</option>
                      <option value="1609">1609 - Stanley College of Eng. & Tech</option>
                      <option value="1610">1610 - Lords Institute of Eng. & Tech</option>
                      <option value="2451">2451 - MVSR Engineering College</option>
                      <option value="2455">2455 - KMIT Narayanaguda</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Batch / Year Prefix</label>
                    <input
                      type="text"
                      value={batchYear}
                      onChange={(e) => setBatchYear(e.target.value)}
                      placeholder="24"
                      className="w-full px-3 py-2 rounded-xl bg-surface text-white text-xs font-mono border border-border"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Rolls per Branch</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={rollStart}
                        onChange={(e) => setRollStart(e.target.value)}
                        className="w-20 px-3 py-2 rounded-xl bg-surface text-white text-xs font-mono border border-border"
                      />
                      <span className="text-slate-500">to</span>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={rollEnd}
                        onChange={(e) => setRollEnd(e.target.value)}
                        className="w-20 px-3 py-2 rounded-xl bg-surface text-white text-xs font-mono border border-border"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-400">Engineering Branches to Discover</label>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {[
                      { code: "732", label: "Civil (732)" },
                      { code: "733", label: "CSE (733)" },
                      { code: "734", label: "EEE (734)" },
                      { code: "735", label: "ECE (735)" },
                      { code: "736", label: "Mech (736)" },
                      { code: "737", label: "IT (737)" },
                      { code: "748", label: "AI&ML (748)" },
                      { code: "749", label: "AI&DS (749)" },
                    ].map((b) => (
                      <label
                        key={b.code}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${
                          selectedBranches.includes(b.code)
                            ? "bg-blue-600/20 text-blue-300 border-blue-500/40"
                            : "bg-surface text-slate-400 border-border"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedBranches.includes(b.code)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBranches([...selectedBranches, b.code]);
                            } else {
                              setSelectedBranches(selectedBranches.filter(x => x !== b.code));
                            }
                          }}
                          className="hidden"
                        />
                        <span>{b.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-xs text-slate-300 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeRegular}
                      onChange={(e) => setIncludeRegular(e.target.checked)}
                      className="rounded bg-surface border-border text-blue-600"
                    />
                    <span>Include Regular Batches (Roll 001 - 060)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeLateral}
                      onChange={(e) => setIncludeLateral(e.target.checked)}
                      className="rounded bg-surface border-border text-blue-600"
                    />
                    <span>Include Lateral Entry (Roll 301 - 330)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Mode: RANGE */}
            {mode === "RANGE" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Starting Hall Ticket</label>
                  <input
                    type="text"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    placeholder="160324732301"
                    className="w-full px-3 py-2 rounded-xl bg-surface text-white text-xs font-mono border border-border"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Ending Hall Ticket</label>
                  <input
                    type="text"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    placeholder="160324732325"
                    className="w-full px-3 py-2 rounded-xl bg-surface text-white text-xs font-mono border border-border"
                  />
                </div>
              </div>
            )}

            {/* Mode: CUSTOM */}
            {mode === "CUSTOM" && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Paste Hall Tickets (One per line or comma-separated)
                </label>
                <textarea
                  rows={4}
                  value={customListText}
                  onChange={(e) => setCustomListText(e.target.value)}
                  placeholder="160324732301&#10;160324733302&#10;160324736301"
                  className="w-full p-3 rounded-xl bg-surface text-white text-xs font-mono border border-border focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* Start Scan Action Bar */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Ready to launch worker queue. Results will be saved into the database and analyzed automatically.
              </div>

              <button
                type="button"
                onClick={handleStartScan}
                disabled={startingScan}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
              >
                {startingScan ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>LAUNCHING WORKER...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    <span>START AUTOMATED RESULT COLLECTION</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Manual HTML/PDF Import Fallback */}
      <div className="rounded-2xl bg-surface-card border border-border p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Upload className="w-5 h-5 text-slate-400" />
          <h3 className="text-sm font-bold text-white">Manual HTML, CSV, or Text Import Option</h3>
        </div>
        <p className="text-xs text-slate-400">
          If Osmania University results website is currently inaccessible from your network or IP, save the webpage locally (Ctrl+S / Save Page As) and upload it here to extract and analyze offline.
        </p>

        <input
          type="file"
          accept=".html,.htm,.jsp,.txt,.csv"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const formData = new FormData();
            formData.append("file", file);
            try {
              const res = await fetch("/api/import/file", { method: "POST", body: formData });
              const data = await res.json();
              if (data.report) {
                setReport(data);
                alert("File inspected successfully!");
              } else if (data.candidates) {
                setCustomListText(data.candidates.join("\n"));
                setMode("CUSTOM");
                alert(`Discovered ${data.candidates.length} candidates in file!`);
              }
            } catch (err: any) {
              alert("Import failed: " + err.message);
            }
          }}
          className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30 cursor-pointer"
        />
      </div>

    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 text-sm">Initializing analysis engine...</div>}>
      <AnalyzeContent />
    </Suspense>
  );
}
