"use client";

import { useRef, useState } from "react";
import { Check, FileText, Loader2, UploadCloud, X } from "lucide-react";

type ImportState = "queued" | "parsing" | "parsed" | "error";
type ImportItem = { id: string; file: File; state: ImportState; message?: string };

export function BulkResumeImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files)
      .filter((file) => file.type === "application/pdf" && file.size <= 5 * 1024 * 1024)
      .map((file) => ({ id: `${file.name}-${file.lastModified}`, file, state: "queued" as const }));
    setItems((current) => [...current, ...next.filter((item) => !current.some((existing) => existing.id === item.id))]);
    setIsOpen(true);
  };

  const processFiles = async () => {
    const queuedItems = items.filter((entry) => entry.state === "queued");
    if (queuedItems.length === 0) return;

    setIsProcessing(true);
    setItems((current) => current.map((entry) => entry.state === "queued" ? { ...entry, state: "parsing" } : entry));

    try {
      const body = new FormData();
      queuedItems.forEach(item => {
        body.append("files", item.file);
      });

      const response = await fetch("/api/recruiter/resume/batch-upload", { method: "POST", body });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Batch upload failed.");

      setItems((current) => {
        const newItems = [...current];
        data.results.forEach((res: any) => {
          const idx = newItems.findIndex(i => i.file.name === res.fileName && i.state === "parsing");
          if (idx >= 0) {
            newItems[idx] = { 
              ...newItems[idx], 
              state: res.success ? "parsed" : "error", 
              message: res.success ? `${res.skillsExtracted} skills extracted` : res.error 
            };
          }
        });
        return newItems;
      });
    } catch (error) {
      setItems((current) => current.map((entry) => entry.state === "parsing" ? { ...entry, state: "error", message: error instanceof Error ? error.message : "Upload failed." } : entry));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="border border-zinc-800/80 bg-zinc-900/60 rounded-xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-emerald-400">Resume intake</p>
          <h2 className="font-heading text-xl font-bold mt-1 text-zinc-100">Import resumes for review</h2>
          <p className="text-sm text-zinc-400 mt-1">Upload multiple PDF resumes (up to 50). Each file is parsed and matched independently.</p>
        </div>
        <div className="flex gap-2">
          <button 
            type="button" 
            onClick={() => inputRef.current?.click()} 
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 px-4 py-2.5 text-sm font-bold transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4" /> Choose PDFs
          </button>
          <input 
            ref={inputRef} 
            type="file" 
            accept="application/pdf" 
            multiple 
            className="hidden" 
            onChange={(event) => addFiles(event.target.files)} 
          />
        </div>
      </div>

      {isOpen && (
        <div className="mt-6 border-t border-zinc-800 pt-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">{items.length} file{items.length === 1 ? "" : "s"} selected</p>
            <button 
              type="button" 
              onClick={processFiles} 
              disabled={!items.some((item) => item.state === "queued") || isProcessing} 
              className="text-sm font-bold text-emerald-400 disabled:text-zinc-600 hover:text-emerald-300 transition-colors"
            >
              {items.some((item) => item.state === "queued") ? (isProcessing ? "Parsing..." : "Parse selected") : "Parsing complete"}
            </button>
          </div>
          <div className="divide-y divide-zinc-800/50 border border-zinc-800/50 rounded-lg bg-zinc-950 overflow-hidden">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 sm:p-4 hover:bg-zinc-900/50 transition-colors">
                <FileText className="w-4 h-4 text-zinc-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-zinc-200 truncate">{item.file.name}</p>
                  {item.message && (
                    <p className={`text-xs mt-0.5 font-mono ${item.state === "error" ? "text-red-400" : "text-zinc-500"}`}>
                      {item.message}
                    </p>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                  item.state === "parsed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                  item.state === "error" ? "bg-red-500/10 text-red-400 border border-red-500/20" : 
                  item.state === "parsing" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30" : 
                  "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}>
                  {item.state === "parsing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 
                   item.state === "parsed" ? <Check className="w-3.5 h-3.5" /> : 
                   item.state === "error" ? <X className="w-3.5 h-3.5" /> : null}
                  {item.state === "queued" ? "Queued" : 
                   item.state === "parsing" ? "Parsing" : 
                   item.state === "parsed" ? "Parsed" : "Error"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
