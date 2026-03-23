"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Search, 
  Download, 
  Trash2, 
  Edit2, 
  Plus, 
  X,
  Upload
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Document {
  id: string;
  name: string;
  category: string;
  year: string;
  size: string;
  date: string;
}

const initialDocuments: Document[] = [
  { id: "1", name: "Annual Report 2023-24.pdf", category: "Reports", year: "2023-24", size: "2.4 MB", date: "2024-03-10" },
  { id: "2", name: "Association Bylaws Revised.pdf", category: "Legal", year: "2023", size: "1.1 MB", date: "2023-11-20" },
  { id: "3", name: "Membership Form New.pdf", category: "Forms", year: "2024", size: "0.5 MB", date: "2024-01-05" },
  { id: "4", name: "Executive Committee List.pdf", category: "Administrative", year: "2023-24", size: "0.8 MB", date: "2023-08-15" },
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      setDocuments(documents.filter(d => d.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-500 text-sm mt-1">Upload and organize important association documents and PDF resources.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-sm"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 mb-3">Categories</h3>
          {["All Documents", "Reports", "Forms", "Legal", "Administrative", "Other"].map((cat) => (
            <button 
              key={cat} 
              className={cn(
                "w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                cat === "All Documents" ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
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
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Year:</span>
              <select className="text-sm bg-gray-50 border-none rounded-lg font-bold text-gray-700 focus:ring-0 outline-none h-9 px-3">
                <option>2023-24</option>
                <option>2022-23</option>
                <option>All Years</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform shadow-sm">
                          <FileText size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 truncate max-w-xs">{doc.name}</div>
                          <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{doc.size} • {doc.date}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-sm font-bold text-gray-600">{doc.year}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100">
                          <Download size={18} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-gray-100">
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id)}
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
            {documents.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                <FileText size={48} className="mb-4 opacity-20" />
                <p className="font-bold">No documents found</p>
                <p className="text-sm">Try searching for something else or upload a new file.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal - Basic Implementation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
              <h2 className="text-xl font-bold">Upload Document</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-indigo-300 transition-all cursor-pointer">
                <Upload size={40} className="text-indigo-600 mb-4" />
                <p className="text-sm font-bold text-gray-900">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, XLSX (max. 10MB)</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Display Name</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Annual Report 2024" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Category</label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>Reports</option>
                    <option>Forms</option>
                    <option>Legal</option>
                    <option>Administrative</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-gray-700">Financial Year</label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>2023-24</option>
                    <option>2022-23</option>
                    <option>2024-25</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
              <button className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-[0.98]">Finish Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
