"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Trash2, 
  User, 
  Calendar, 
  Mail, 
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Download,
  ExternalLink
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { 
  getMemberships, 
  deleteDashboardItem, 
  MembershipSubmission 
} from "@/lib/api/dashboard";
import { optimizeCloudinaryUrl, getDownloadUrl } from "@/lib/cloudinary";
import { toast } from "react-hot-toast";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ensureAbsoluteUrl = (url?: string) => {
  if (!url) return "#";
  const trimmedUrl = url.trim();
  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) return trimmedUrl;
  if (trimmedUrl.startsWith("//")) return `https:${trimmedUrl}`;
  return `https://${trimmedUrl}`;
};

const ITEMS_PER_PAGE = 8;

export default function MembershipsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [memberships, setMemberships] = useState<MembershipSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const data = await getMemberships();
      setMemberships(data);
    } catch {
      toast.error("Failed to load memberships");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this submission?")) {
      try {
        await deleteDashboardItem("membership_applications", id);
        setMemberships(memberships.filter(m => m.id !== id));
        toast.success("Submission deleted");
      } catch {
        toast.error("Failed to delete submission");
      }
    }
  };

  const formatDate = (timestamp: { toDate: () => Date }) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const filteredMemberships = memberships.filter(m => {
    const searchTermLower = searchTerm.toLowerCase();
    const searchMatch = (m.fullName?.toLowerCase() || "").includes(searchTermLower) || 
                       (m.email?.toLowerCase() || "").includes(searchTermLower) ||
                       (m.phone?.toLowerCase() || "").includes(searchTermLower) ||
                       (m.occupation?.toLowerCase() || "").includes(searchTermLower);
    
    return searchMatch;
  });

  const totalPages = Math.ceil(filteredMemberships.length / ITEMS_PER_PAGE);
  const paginatedMemberships = filteredMemberships.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Management</h1>
          <p className="text-gray-500 text-sm mt-1">Review and manage membership applications from the website.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex items-center space-x-3">
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col font-sans">
        {loading ? (
          <div className="flex-1 flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type / Address</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Submitted At</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedMemberships.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mr-3">
                          <User size={16} />
                        </div>
                        <span className="text-sm font-bold text-gray-900">{member.fullName || "Unnamed"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-600 flex items-center mb-1"><Mail size={12} className="mr-1.5 text-gray-400" /> {member.email || "No Email"}</span>
                        <span className="text-xs text-gray-600 flex items-center"><Phone size={12} className="mr-1.5 text-gray-400" /> {member.phone || "No Phone"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">{member.occupation || "Member"}</span>
                        <span className="text-[10px] text-gray-400 line-clamp-1 flex items-center"><MapPin size={10} className="mr-1" /> {member.address || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <Calendar size={12} className="mr-1.5 opacity-50" />
                        {formatDate(member.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {member.membershipFormUrl ? (
                          <>
                            <a
                              href={optimizeCloudinaryUrl(ensureAbsoluteUrl(member.membershipFormUrl))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100 flex items-center gap-1 group/btn"
                              title="View Membership Form"
                            >
                              <FileText size={18} />
                              <span className="text-[10px] font-bold uppercase hidden group-hover/btn:block">View Form</span>
                            </a>
                            <a
                              href={getDownloadUrl(ensureAbsoluteUrl(member.membershipFormUrl))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100 flex items-center gap-1 group/btn"
                              title="Download Membership Form"
                            >
                              <Download size={18} />
                              <span className="text-[10px] font-bold uppercase hidden group-hover/btn:block">Download</span>
                            </a>
                          </>
                        ) : (
                          <button
                            disabled
                            className="p-1.5 text-gray-300 cursor-not-allowed flex items-center gap-1"
                            title="No Form Uploaded"
                          >
                            <FileText size={18} />
                            <span className="text-[10px] font-bold uppercase">No Form</span>
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(member.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {paginatedMemberships.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center">
                        <Users size={48} className="text-gray-200 mb-4" />
                        <p className="font-bold">No submissions found</p>
                        <p className="text-sm mt-1">Wait for public users to submit membership forms.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between mt-auto">
            <p className="text-xs text-gray-500 font-medium tracking-wide">
              Showing <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredMemberships.length)}</span> of <span className="font-bold text-gray-900">{filteredMemberships.length}</span> members
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
                    "w-8 h-8 flex items-center justify-center border rounded-lg text-xs font-bold transition-colors",
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
  );
}
