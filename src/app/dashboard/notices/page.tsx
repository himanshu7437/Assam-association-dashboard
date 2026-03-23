"use client";

import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Pin, 
  Search, 
  FileText, 
  Calendar,
  X,
  Check
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Notice {
  id: string;
  title: string;
  category: string;
  date: string;
  pinned: boolean;
  hasPdf: boolean;
}

const initialNotices: Notice[] = [
  { id: "1", title: "Annual General Meeting 2024 - Notice and Agenda", category: "Meeting", date: "2024-03-15", pinned: true, hasPdf: true },
  { id: "2", title: "Bihu Celebration - Event Guidelines and Participation", category: "Event", date: "2024-03-10", pinned: true, hasPdf: true },
  { id: "3", title: "New Membership Fee Structure from April 2024", category: "Announcement", date: "2024-03-05", pinned: false, hasPdf: false },
  { id: "4", title: "Guest House Maintenance Work Schedule", category: "Maintenance", date: "2024-03-01", pinned: false, hasPdf: false },
];

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>(initialNotices);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNotice, setCurrentNotice] = useState<Partial<Notice> | null>(null);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this notice?")) {
      setNotices(notices.filter(n => n.id !== id));
    }
  };

  const togglePin = (id: string) => {
    setNotices(notices.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const openModal = (notice: Notice | null = null) => {
    setCurrentNotice(notice || { title: "", category: "Announcement", date: new Date().toISOString().split('T')[0], pinned: false, hasPdf: false });
    setIsModalOpen(true);
  };

  const handleInputChange = (field: keyof Notice, value: string | boolean) => {
    if (currentNotice) {
      setCurrentNotice({ ...currentNotice, [field]: value });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notices & Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage public notices displayed on the association website.</p>
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
            onChange={(e) => setSearchTerm(e.target.value)}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {notices.map((notice) => (
          <div key={notice.id} className={cn(
            "group bg-white rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg relative overflow-hidden",
            notice.pinned ? "border-indigo-100 bg-indigo-50/10" : "border-gray-100"
          )}>
            {notice.pinned && (
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                <div className="absolute transform rotate-45 bg-indigo-600 text-white text-[10px] font-bold py-1 px-8 right-[-24px] top-[12px] shadow-sm">
                  PINNED
                </div>
              </div>
            )}
            
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
                  onClick={() => togglePin(notice.id)}
                  className={cn(
                    "p-1.5 rounded-lg shadow-sm border border-gray-100 transition-all",
                    notice.pinned ? "text-indigo-600 bg-indigo-50" : "text-gray-400 hover:text-indigo-600 hover:bg-white"
                  )}
                >
                  <Pin size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(notice.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg shadow-sm border border-gray-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug group-hover:text-indigo-600 transition-colors">
              {notice.title}
            </h3>

            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center text-xs text-gray-400 font-medium">
                <Calendar size={14} className="mr-1.5" />
                {notice.date}
              </div>
              {notice.hasPdf && (
                <div className="flex items-center text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">
                  <FileText size={14} className="mr-1" />
                  PDF Attachment
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

      {/* Modal - Basic Implementation */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
              <h2 className="text-xl font-bold">{currentNotice?.id ? "Edit Notice" : "Create Notice"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
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
              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                    currentNotice?.pinned ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-300 group-hover:border-indigo-400"
                  )} onClick={() => handleInputChange("pinned", !currentNotice?.pinned)}>
                    {currentNotice?.pinned && <Check size={14} className="text-white" />}
                  </div>
                  <span className="text-sm font-bold text-gray-700">Pin to Top</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <div className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                    currentNotice?.hasPdf ? "bg-red-500 border-red-500" : "bg-white border-gray-300 group-hover:border-red-400"
                  )} onClick={() => handleInputChange("hasPdf", !currentNotice?.hasPdf)}>
                    {currentNotice?.hasPdf && <Check size={14} className="text-white" />}
                  </div>
                  <span className="text-sm font-bold text-gray-700">Attach PDF</span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all active:scale-[0.98]">
                {currentNotice?.id ? "Save Changes" : "Post Notice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
