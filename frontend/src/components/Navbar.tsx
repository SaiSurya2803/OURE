"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Search, BarChart3, Database, FileSpreadsheet, 
  GitCompare, Activity, Layers, Settings, Home,
  Cpu, GraduationCap
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: Activity },
    { href: "/analyze", label: "Analyze Results", icon: Search, highlight: true },
    { href: "/scans", label: "Scan Monitor", icon: Cpu },
    { href: "/results", label: "Results Explorer", icon: Layers },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/revaluation", label: "Revaluation", icon: GitCompare },
    { href: "/students", label: "Student Database", icon: Database },
    { href: "/reports", label: "Reports & Downloads", icon: FileSpreadsheet },
    { href: "/examinations", label: "Examinations", icon: GraduationCap },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#080D1A]/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-blue-400 transition-colors">
                  OU RESULTS <span className="text-blue-500">INTELLIGENCE</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Automated Osmania University Results & Analytics
              </p>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    item.highlight
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30"
                      : isActive
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* System status pill */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium hidden sm:inline">Engine Online</span>
            </div>
          </div>
        </div>

        {/* Mobile secondary navigation */}
        <div className="lg:hidden flex items-center space-x-1 overflow-x-auto py-2 border-t border-border/50 text-xs scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md whitespace-nowrap text-xs ${
                  item.highlight
                    ? "bg-blue-600 text-white font-medium"
                    : isActive
                    ? "bg-blue-500/15 text-blue-400"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

      </div>
    </header>
  );
}
