"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen, Plus, X, Loader2, Trash2, Edit2,
  Upload, Link as LinkIcon, Check, Search, ExternalLink
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "react-hot-toast";
import { Timestamp } from "firebase/firestore";
import {
  getPublications, createPublication, updatePublication, deletePublication,
  Publication, PublicationCategory
} from "@/lib/api/publications";
import { uploadToCloudinary } from "@/lib/cloudinary";

function cn(...i: ClassValue[]) { return twMerge(clsx(i)); }

// ── constants ──────────────────────────────────────────────────────────────────
const CATEGORIES: { value: PublicationCategory; label: string }[] = [
  { value: "samayik", label: "Samayik" },
  { value: "magazine", label: "Magazine" },
  { value: "other", label: "Other" },
];

const CATEGORY_COLORS: Record<PublicationCategory, string> = {
  samayik: "bg-indigo-100 text-indigo-700",
  magazine: "bg-emerald-100 text-emerald-700",
  other:    "bg-gray-100   text-gray-600",
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2009 }, (_, i) =>
  String(currentYear - i)
);

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

// ── form state type ────────────────────────────────────────────────────────────
interface FormState {
  id?: string;
  name: string;
  category: PublicationCategory;
  year: string;
  uploadType: "pdf" | "link";
  fileUrl: string;
  // transient — not saved to Firestore
  pendingFile: File | null;
}

const blankForm = (): FormState => ({
  name: "",
  category: "samayik",
  year: String(currentYear),
  uploadType: "pdf",
  fileUrl: "",
  pendingFile: null,
});

// ── helpers ───────────────────────────────────────────────────────────────────
function formatTs(ts: Timestamp | undefined): string {
  if (!ts?.toDate) return "—";
  return ts.toDate().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ══════════════════════════════════════════════════════════════════════════════
export default function PublicationsPage() {
  const [items, setItems]       = useState<Publication[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterCat, setFilterCat] = useState<PublicationCategory | "all">("all");

  // modal
  const [open, setOpen]           = useState(false);
  const [form, setForm]           = useState<FormState>(blankForm());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetch = async () => {
    setLoading(true);
    try {
      setItems(await getPublications());
    } catch {
      toast.error("Failed to load publications");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetch(); }, []);

  // ── open modal ─────────────────────────────────────────────────────────────
  const openNew  = () => { setForm(blankForm()); setOpen(true); };
  const openEdit = (p: Publication) => {
    setForm({
      id: p.id,
      name: p.name,
      category: p.category,
      year: p.year ?? String(currentYear),
      uploadType: p.fileUrl.startsWith("http") &&
        p.fileUrl.includes("cloudinary") ? "pdf" : "link",
      fileUrl: p.fileUrl,
      pendingFile: null,
    });
    setOpen(true);
  };
  const closeModal = () => { if (!uploading && !saving) setOpen(false); };

  // ── field helpers ─────────────────────────────────────────────────────────
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  // ── file pick ─────────────────────────────────────────────────────────────
  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed"); return;
    }
    if (file.size > MAX_PDF_BYTES) {
      toast.error("File exceeds 10 MB limit"); return;
    }
    setForm(f => ({ ...f, pendingFile: file, fileUrl: "" }));
  };

  // ── validate ──────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (!form.name.trim()) return "Name is required";
    if (form.category === "samayik" && !form.year) return "Year is required for Samayik";
    if (form.uploadType === "link" && !form.fileUrl.trim()) return "Please provide an external link";
    if (form.uploadType === "pdf" && !form.pendingFile && !form.fileUrl)
      return "Please upload a PDF";
    return null;
  };

  // ── save ───────────────────────────────────────────────────────────────────
  const save = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    try {
      setSaving(true);
      let fileUrl = form.fileUrl;

      // Upload PDF to Cloudinary if a new file was picked
      if (form.uploadType === "pdf" && form.pendingFile) {
        setUploading(true);
        const toastId = toast.loading("Uploading PDF…");
        try {
          fileUrl = await uploadToCloudinary(form.pendingFile);
          toast.success("PDF uploaded", { id: toastId });
        } catch {
          toast.error("PDF upload failed", { id: toastId });
          return;
        } finally {
          setUploading(false);
        }
      }

      const payload = {
        name: form.name.trim(),
        category: form.category,
        fileUrl,
        ...(form.category === "samayik" ? { year: form.year } : {}),
      };

      if (form.id) {
        await updatePublication(form.id, payload);
        toast.success("Publication updated");
      } else {
        await createPublication(payload);
        toast.success("Publication created");
      }

      setOpen(false);
      fetch();
    } catch {
      toast.error("Failed to save publication");
    } finally {
      setSaving(false);
    }
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const remove = async (p: Publication) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await deletePublication(p.id);
      setItems(prev => prev.filter(x => x.id !== p.id));
      toast.success("Publication deleted");
    } catch {
      toast.error("Failed to delete publication");
    }
  };

  // ── filtered list ─────────────────────────────────────────────────────────
  const filtered = items.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) ||
      (p.year ?? "").includes(q);
    const matchCat = filterCat === "all" || p.category === filterCat;
    return matchSearch && matchCat;
  });

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Publications</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage Samayik editions, magazines, and other publications.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Publication
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or year…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "samayik", "magazine", "other"] as const).map(c => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold transition-all capitalize",
                filterCat === c
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
            >
              {c === "all" ? "All" : CATEGORIES.find(x => x.value === c)?.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto min-h-[380px]">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center text-gray-400">
            <BookOpen size={48} className="mb-4 opacity-20" />
            <p className="font-bold">No publications found</p>
            <p className="text-sm">Add one or adjust the filters.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {["Name", "Category", "Year", "File", "Created At", "Actions"].map(h => (
                  <th key={h} className="px-5 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                  {/* Name */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <BookOpen size={17} />
                      </div>
                      <span className="text-sm font-bold text-gray-900 max-w-[180px] truncate" title={p.name}>
                        {p.name}
                      </span>
                    </div>
                  </td>
                  {/* Category */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", CATEGORY_COLORS[p.category])}>
                      {CATEGORIES.find(c => c.value === p.category)?.label}
                    </span>
                  </td>
                  {/* Year */}
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-600">
                    {p.category === "samayik" ? (p.year ?? "—") : "—"}
                  </td>
                  {/* File type */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    <a
                      href={p.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                    >
                      <ExternalLink size={13} />
                      {p.fileUrl.includes("cloudinary") ? "PDF" : "Link"}
                    </a>
                  </td>
                  {/* Created */}
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTs(p.createdAt)}
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100 shadow-sm"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => remove(p)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-100 shadow-sm"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Hidden file input ── */}
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={onFilePick}
      />

      {/* ══ Modal ══════════════════════════════════════════════════════════════ */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
              <h2 className="text-xl font-bold">
                {form.id ? "Edit Publication" : "Add Publication"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                disabled={uploading || saving}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="e.g. Samayik 2024 Edition"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={e => set("category", e.target.value as PublicationCategory)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Year — only for samayik */}
              {form.category === "samayik" && (
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.year}
                    onChange={e => set("year", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  >
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}

              {/* Upload type toggle */}
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">File Source</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["pdf", "link"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        set("uploadType", t);
                        setForm(f => ({ ...f, uploadType: t, fileUrl: "", pendingFile: null }));
                      }}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all",
                        form.uploadType === t
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      )}
                    >
                      {t === "pdf" ? <Upload size={15} /> : <LinkIcon size={15} />}
                      {t === "pdf" ? "Upload PDF" : "External Link"}
                    </button>
                  ))}
                </div>
              </div>

              {/* PDF upload zone */}
              {form.uploadType === "pdf" && (
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-7 flex flex-col items-center bg-gray-50 hover:bg-gray-100 hover:border-indigo-300 transition-all cursor-pointer relative",
                    uploading && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                >
                  {uploading
                    ? <Loader2 size={36} className="text-indigo-600 animate-spin mb-3" />
                    : <Upload size={36} className="text-indigo-500 mb-3" />}
                  <p className="text-sm font-bold text-gray-800 text-center">
                    {form.pendingFile
                      ? form.pendingFile.name
                      : form.fileUrl
                        ? "File already uploaded. Click to replace."
                        : "Click to select a PDF"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF only · max 10 MB</p>
                  {(form.pendingFile || form.fileUrl) && !uploading && (
                    <div className="absolute top-3 right-3 bg-green-100 text-green-700 p-1.5 rounded-full">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              )}

              {/* External link input */}
              {form.uploadType === "link" && (
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">
                    URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={form.fileUrl}
                    onChange={e => set("fileUrl", e.target.value)}
                    placeholder="https://example.com/publication.pdf"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={uploading || saving}
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={uploading || saving}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {(uploading || saving) && <Loader2 size={15} className="animate-spin" />}
                {form.id ? "Save Changes" : "Create Publication"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
