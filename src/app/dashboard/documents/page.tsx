"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, 
  Search, 
  Download, 
  Trash2, 
  Edit2, 
  Plus, 
  X,
  Upload,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "react-hot-toast";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DocumentItem {
  id?: string;
  name: string;
  category: string;
  year: string;
  size: string;
  date: string;
  url?: string;
}

const CATEGORIES = ["All Documents", "Reports", "Forms", "Legal", "Administrative", "Other"];
const YEARS = ["All Years", "2024-25", "2023-24", "2022-23", "2021-22"];
const ITEMS_PER_PAGE = 5;

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Documents");
  const [activeYear, setActiveYear] = useState("All Years");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDoc, setCurrentDoc] = useState<Partial<DocumentItem> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "documents"));
      const docsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DocumentItem[];
      
      // Sort by date descending
      docsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setDocuments(docsList);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteDoc(doc(db, "documents", id));
        setDocuments(documents.filter(d => d.id !== id));
        toast.success("Document deleted successfully");
      } catch (error) {
        console.error("Error deleting document:", error);
        toast.error("Failed to delete document");
      }
    }
  };

  const openModal = (document: DocumentItem | null = null) => {
    setCurrentDoc(document || { 
      name: "", 
      category: "Reports", 
      year: "2024-25", 
      date: new Date().toISOString().split('T')[0],
      size: "0 MB",
      url: "" 
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (field: keyof DocumentItem, value: string) => {
    if (currentDoc) {
      setCurrentDoc({ ...currentDoc, [field]: value });
    }
  };

  const formatBytes = (bytes: number, decimals = 1) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // We can accept pdf, docx, xlsx, etc. Cloudinary handles all if configured for raw/auto
    try {
      setIsUploading(true);
      const toastId = toast.loading("Uploading document...");
      
      const fileUrl = await uploadToCloudinary(file);
      const fileSizeStr = formatBytes(file.size);
      
      if (currentDoc) {
        setCurrentDoc({ 
          ...currentDoc, 
          url: fileUrl, 
          size: fileSizeStr,
          // auto fill name if currently empty
          name: currentDoc.name || file.name 
        });
      }
      
      toast.success("Document uploaded successfully!", { id: toastId });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const saveDocument = async () => {
    if (!currentDoc?.name || !currentDoc?.url) {
      toast.error("Display name and an uploaded file are required");
      return;
    }

    try {
      if (currentDoc.id) {
        // Update
        const docRef = doc(db, "documents", currentDoc.id);
        const { id, ...updateData } = currentDoc as DocumentItem;
        await updateDoc(docRef, updateData as any);
        toast.success("Document updated successfully");
      } else {
        // Create
        await addDoc(collection(db, "documents"), currentDoc);
        toast.success("Document added successfully");
      }
      setIsModalOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document");
    }
  };

  // Filtering Logic
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "All Documents" || doc.category === activeCategory;
    const matchesYear = activeYear === "All Years" || doc.year === activeYear;
    return matchesSearch && matchesCategory && matchesYear;
  });

  const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);
  const paginatedDocuments = filteredDocuments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-500 text-sm mt-1">Upload and organize important association documents and PDF resources.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-3">Categories</h3>
          {CATEGORIES.map((cat) => (
            <button 
              key={cat} 
              onClick={() => {
                setActiveCategory(cat);
                setCurrentPage(1);
              }}
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                cat === activeCategory ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Documents Table Area */}
        <div className="md:col-span-3 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Year:</span>
              <select 
                value={activeYear}
                onChange={(e) => {
                  setActiveYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-sm bg-gray-50 border-none rounded-lg font-bold text-gray-700 focus:ring-0 outline-none h-9 px-3"
              >
                {YEARS.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Document Name</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden lg:table-cell">Category</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">Year</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedDocuments.map((docItem) => (
                    <tr key={docItem.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform shadow-sm">
                            <FileText size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 truncate max-w-xs" title={docItem.name}>{docItem.name}</div>
                            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{docItem.size} • {docItem.date}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
                          {docItem.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-sm font-bold text-gray-600">{docItem.year}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {docItem.url && (
                            <a 
                              href={docItem.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100"
                              title="Download/View"
                            >
                              <Download size={18} />
                            </a>
                          )}
                          <button 
                            onClick={() => openModal(docItem)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(docItem.id!)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {!loading && filteredDocuments.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                <FileText size={48} className="mb-4 opacity-20" />
                <p className="font-bold">No documents found</p>
                <p className="text-sm">Try searching for something else or upload a new file.</p>
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 mt-auto">
                <p className="text-sm text-gray-500 font-medium">
                  Showing <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredDocuments.length)}</span> of <span className="font-bold text-gray-900">{filteredDocuments.length}</span> documents
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

          </div>
        </div>
      </div>

      <input  
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload}
      />

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
              <h2 className="text-xl font-bold">{currentDoc?.id ? "Edit Document" : "Upload Document"}</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                disabled={isUploading}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-indigo-300 transition-all cursor-pointer relative",
                  isUploading && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
              >
                {isUploading ? (
                  <Loader2 size={40} className="text-indigo-600 mb-4 animate-spin" />
                ) : (
                  <Upload size={40} className="text-indigo-600 mb-4" />
                )}
                <p className="text-sm font-bold text-gray-900 text-center">
                  {currentDoc?.url ? "Document uploaded successfully. Click to replace." : "Click to upload file"}
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, XLSX (max. 10MB)</p>
                {currentDoc?.url && !isUploading && (
                  <div className="absolute top-4 right-4 bg-green-100 text-green-700 p-1.5 rounded-full">
                    <Check size={16} />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Display Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="e.g. Annual Report 2024" 
                  value={currentDoc?.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Category</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={currentDoc?.category || "Reports"}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                  >
                    {CATEGORIES.filter(c => c !== "All Documents").map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Financial Year</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={currentDoc?.year || "2024-25"}
                    onChange={(e) => handleInputChange("year", e.target.value)}
                  >
                    {YEARS.filter(y => y !== "All Years").map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
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
                onClick={saveDocument}
                disabled={isUploading}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {currentDoc?.id ? "Save Changes" : "Finish Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
