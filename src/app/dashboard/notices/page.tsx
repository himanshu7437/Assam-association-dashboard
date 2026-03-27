"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Pin, 
  Search, 
  FileText, 
  Calendar,
  X,
  Check,
  Loader2,
  Upload,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "react-hot-toast";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Notice {
  id?: string;
  title: string;
  description?: string;
  category: string;
  date: string;
  pinned: boolean;
  hasPdf: boolean;
  pdfUrl?: string;
}

const ITEMS_PER_PAGE = 5;

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNotice, setCurrentNotice] = useState<Partial<Notice> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const noticesCol = collection(db, "notices");
      // Use client-side sorting since we may not have a composite index set up yet
      const noticeSnapshot = await getDocs(noticesCol);
      const noticesList = noticeSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notice[];
      
      // Sort: pinned first, then by date descending
      noticesList.sort((a, b) => {
        if (a.pinned === b.pinned) {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return a.pinned ? -1 : 1;
      });

      setNotices(noticesList);
    } catch (error) {
      console.error("Error fetching notices:", error);
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this notice?")) {
      try {
        await deleteDoc(doc(db, "notices", id));
        setNotices(notices.filter(n => n.id !== id));
        toast.success("Notice deleted successfully");
      } catch (error) {
        console.error("Error deleting notice:", error);
        toast.error("Failed to delete notice");
      }
    }
  };

  const togglePin = async (notice: Notice) => {
    if (!notice.id) return;
    try {
      const noticeRef = doc(db, "notices", notice.id);
      await updateDoc(noticeRef, { pinned: !notice.pinned });
      setNotices(notices.map(n => n.id === notice.id ? { ...n, pinned: !n.pinned } : n));
      toast.success(notice.pinned ? "Notice unpinned" : "Notice pinned");
    } catch (error) {
      console.error("Error pinning notice:", error);
      toast.error("Failed to pin notice");
    }
  };

  const openModal = (notice: Notice | null = null) => {
    setCurrentNotice(notice || { 
      title: "", 
      description: "",
      category: "Announcement", 
      date: new Date().toISOString().split('T')[0], 
      pinned: false, 
      hasPdf: false,
      pdfUrl: ""
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (field: keyof Notice, value: any) => {
    if (currentNotice) {
      setCurrentNotice({ ...currentNotice, [field]: value });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    try {
      setIsUploading(true);
      const toastId = toast.loading("Uploading PDF...");
      
      const pdfUrl = await uploadToCloudinary(file);
      
      if (currentNotice) {
        setCurrentNotice({ ...currentNotice, hasPdf: true, pdfUrl });
      }
      
      toast.success("PDF uploaded successfully!", { id: toastId });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload PDF");
    } finally {
      setIsUploading(false);
    }
  };

  const saveNotice = async () => {
    if (!currentNotice?.title || !currentNotice?.category) {
      toast.error("Title and Category are required");
      return;
    }

    try {
      if (currentNotice.id) {
        // Update
        const noticeRef = doc(db, "notices", currentNotice.id);
        const { id, ...updateData } = currentNotice as Notice;
        await updateDoc(noticeRef, updateData as any);
        toast.success("Notice updated");
      } else {
        // Create
        await addDoc(collection(db, "notices"), currentNotice);
        toast.success("Notice created");
      }
      setIsModalOpen(false);
      fetchNotices();
    } catch (error) {
      console.error("Error saving notice:", error);
      toast.error("Failed to save notice");
    }
  };

  const filteredNotices = notices.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredNotices.length / ITEMS_PER_PAGE);
  const paginatedNotices = filteredNotices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notices & Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage public notices displayed on the website.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Notice
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search notices..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort by:</span>
          <select className="text-sm border-none bg-transparent font-semibold text-gray-700 focus:ring-0 outline-none">
            <option>Recent First</option>
            <option>Oldest First</option>
          </select>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="application/pdf"
        onChange={handleFileUpload}
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedNotices.map((notice) => (
            <div key={notice.id} className={cn(
              "group bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg relative overflow-hidden flex flex-col justify-between",
              notice.pinned ? "border-indigo-100 bg-indigo-50/10" : "border-gray-100"
            )}>
              {notice.pinned && (
                <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                  <div className="absolute transform rotate-45 bg-indigo-600 text-white text-[10px] font-bold py-1 px-8 right-[-24px] top-[12px] shadow-sm">
                    PINNED
                  </div>
                </div>
              )}
              
              <div>
                <div className="flex items-start justify-between mb-4">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    notice.category === 'Meeting' ? "bg-amber-100 text-amber-700" : 
                    notice.category === 'Event' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {notice.category}
                  </span>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openModal(notice)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg shadow-sm border border-gray-100 transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => togglePin(notice)}
                      className={cn(
                        "p-1.5 rounded-lg shadow-sm border border-gray-100 transition-all",
                        notice.pinned ? "text-indigo-600 bg-indigo-50" : "text-gray-400 hover:text-indigo-600 hover:bg-white"
                      )}
                    >
                      <Pin size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(notice.id!)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg shadow-sm border border-gray-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug group-hover:text-indigo-600 transition-colors">
                  {notice.title}
                </h3>
                {notice.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {notice.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center text-xs text-gray-400 font-medium">
                  <Calendar size={14} className="mr-1.5" />
                  {notice.date}
                </div>
                {notice.hasPdf && notice.pdfUrl && (
                  <a href={notice.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors px-2 py-1 rounded-md">
                    <FileText size={14} className="mr-1" />
                    View PDF
                  </a>
                )}
                {notice.hasPdf && !notice.pdfUrl && (
                  <div className="flex items-center text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">
                    <FileText size={14} className="mr-1" />
                    PDF Att.
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Create Card */}
          <button 
            onClick={() => openModal()}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:bg-gray-100 hover:border-indigo-300 transition-all duration-300 group min-h-[180px]"
          >
            <div className="p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300 mb-4">
              <Plus className="h-6 w-6 text-indigo-600" />
            </div>
            <span className="text-sm font-bold text-gray-500 group-hover:text-indigo-600">Post New Notice</span>
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-gray-100 shadow-sm mt-8">
          <p className="text-sm text-gray-500 font-medium">
            Showing <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredNotices.length)}</span> of <span className="font-bold text-gray-900">{filteredNotices.length}</span> notices
          </p>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center border rounded-lg text-sm font-bold transition-colors",
                  currentPage === i + 1 
                    ? "border-indigo-200 bg-indigo-50 text-indigo-600" 
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                )}
              >
                {i + 1}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 rounded-lg bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
              <h2 className="text-xl font-bold">{currentNotice?.id ? "Edit Notice" : "Create Notice"}</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                disabled={isUploading}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Notice Title</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Enter notice title"
                  value={currentNotice?.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Description</label>
                <textarea 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none min-h-[100px]"
                  placeholder="Enter notice description..."
                  value={currentNotice?.description || ""}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Category</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={currentNotice?.category || "Announcement"}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                  >
                    <option>Announcement</option>
                    <option>Meeting</option>
                    <option>Event</option>
                    <option>Maintenance</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Date</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={currentNotice?.date || ""}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-100 flex flex-col space-y-4">
                <label className="flex items-center space-x-2 cursor-pointer group w-fit">
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                    currentNotice?.pinned ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-300 group-hover:border-indigo-400"
                  )} onClick={() => handleInputChange("pinned", !currentNotice?.pinned)}>
                    {currentNotice?.pinned && <Check size={14} className="text-white" />}
                  </div>
                  <span className="text-sm font-bold text-gray-700">Pin to Top</span>
                </label>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">PDF Attachment</p>
                      <p className="text-xs text-gray-500">
                        {currentNotice?.hasPdf ? (currentNotice.pdfUrl ? "Document uploaded" : "Existing document attached") : "No document attached"}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {currentNotice?.hasPdf && currentNotice.pdfUrl && (
                      <button 
                        onClick={() => handleInputChange("hasPdf", false)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Upload size={14} className="mr-1" />}
                      {currentNotice?.hasPdf ? "Replace PDF" : "Upload PDF"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button 
                onClick={saveNotice}
                disabled={isUploading}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {currentNotice?.id ? "Save Changes" : "Post Notice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
