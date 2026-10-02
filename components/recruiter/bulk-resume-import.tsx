"use client";

import { useRef, useState } from "react";
import { Check, FileText, Loader2, UploadCloud, X } from "lucide-react";

type ImportState = "queued" | "parsing" | "parsed" | "error";
type ImportItem = { id: string; file: File; state: ImportState; message?: string };

export function BulkResumeImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).filter((file) => file.type === "application/pdf" && file.size <= 5 * 1024 * 1024).map((file) => ({ id: `${file.name}-${file.lastModified}`, file, state: "queued" as const }));
    setItems((current) => [...current, ...next.filter((item) => !current.some((existing) => existing.id === item.id))]);
    setIsOpen(true);
  };

  const processFiles = async () => {
    for (const item of items.filter((entry) => entry.state === "queued")) {
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, state: "parsing" } : entry));
      try {
        const body = new FormData();
        body.append("file", item.file);
        const response = await fetch("/api/resume/upload", { method: "POST", body });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not parse this PDF.");
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, state: "parsed", message: `${data.charactersExtracted || 0} characters extracted` } : entry));
      } catch (error) {
        setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, state: "error", message: error instanceof Error ? error.message : "Could not parse this PDF." } : entry));
      }
    }
  };

  return <section className="border border-border bg-paper p-5 sm:p-6"><div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><p className="text-sm font-semibold text-deep-green">Resume intake</p><h2 className="font-heading text-xl font-bold mt-1">Import resumes for review</h2><p className="text-sm text-muted-text mt-1">Upload multiple PDF resumes. Each file is parsed independently and keeps its own status.</p></div><div className="flex gap-2"><button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-[9px] bg-deep-green text-white px-3.5 py-2.5 text-sm font-semibold hover:bg-ink"><UploadCloud className="w-4 h-4" />Choose PDFs</button><input ref={inputRef} type="file" accept="application/pdf" multiple className="hidden" onChange={(event) => addFiles(event.target.files)} /></div></div>{isOpen && <div className="mt-5 border-t border-border pt-4"><div className="flex items-center justify-between mb-3"><p className="text-xs text-muted-text">{items.length} file{items.length === 1 ? "" : "s"} selected</p><button type="button" onClick={processFiles} disabled={!items.some((item) => item.state === "queued")} className="text-sm font-semibold text-deep-green disabled:text-muted-text">{items.some((item) => item.state === "queued") ? "Parse selected" : "Parsing complete"}</button></div><div className="divide-y divide-border">{items.map((item) => <div key={item.id} className="flex items-center gap-3 py-3"><FileText className="w-4 h-4 text-muted-text shrink-0" /><div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{item.file.name}</p>{item.message && <p className={`text-xs mt-1 ${item.state === "error" ? "text-status-error" : "text-muted-text"}`}>{item.message}</p>}</div><span className={`inline-flex items-center gap-1 text-xs font-semibold ${item.state === "parsed" ? "text-status-proven" : item.state === "error" ? "text-status-error" : item.state === "parsing" ? "text-deep-green" : "text-muted-text"}`}>{item.state === "parsing" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : item.state === "parsed" ? <Check className="w-3.5 h-3.5" /> : item.state === "error" ? <X className="w-3.5 h-3.5" /> : null}{item.state === "queued" ? "Queued" : item.state === "parsing" ? "Parsing" : item.state === "parsed" ? "Parsed" : "Error"}</span></div>)}</div></div>}</section>;
}
