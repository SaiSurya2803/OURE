import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "OU Results Intelligence — Automated Osmania University Examination Analytics",
  description: "Automated Osmania University Examination Results Inspection, Extraction, Analytics, and Revaluation Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 pb-16">{children}</main>
        <footer className="border-t border-border bg-[#050811] py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>
              © 2026 OU RESULTS INTELLIGENCE — Automated Examination Analytics & Revaluation Engine.
            </p>
            <p className="text-[11px] text-slate-600">
              Platform-generated analytical system. Not an official marks memo issued by Osmania University.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
