"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Download
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { logActivity } from "@/lib/activity";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Booking {
  id: string;
  user: string;
  userEmail?: string;
  phone?: string;
  message?: string;
  facility: string;
  date?: string; // Legacy fallback
  checkIn: string;
  checkOut: string;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled';
  createdAt?: { toDate: () => Date } | null;
}

const ITEMS_PER_PAGE = 5;

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [facilityFilter, setFacilityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Derived unique facilities for the filter dropdown
  const facilities = Array.from(new Set(bookings.map(b => b.facility))).filter(Boolean);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "bookings"));
      const docsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Helper to format date strings consistently
        const formatDate = (dateVal: any) => {
          if (!dateVal) return "";
          if (typeof dateVal.toDate === 'function') {
            return dateVal.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
          }
          return String(dateVal);
        };

        // Handle Legacy fallback
        let checkIn = data.checkIn ? formatDate(data.checkIn) : formatDate(data.date);
        let checkOut = data.checkOut ? formatDate(data.checkOut) : formatDate(data.date);

        return {
          id: doc.id,
          user: data.name || data.user || "Unknown Requestor",
          userEmail: data.email || data.userEmail || "",
          phone: data.phone || "",
          message: data.message || "",
          facility: data.facility || "Unknown",
          date: formatDate(data.date), // Keep for legacy
          checkIn,
          checkOut,
          status: data.status || "pending",
          createdAt: data.createdAt
        };
      }) as Booking[];
      
      // Sort by latest created or check-in date
      docsList.sort((a, b) => {
        const timeA = a.createdAt && typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate().getTime() : (a.checkIn ? new Date(a.checkIn).getTime() : 0);
        const timeB = b.createdAt && typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate().getTime() : (b.checkIn ? new Date(b.checkIn).getTime() : 0);
        return timeB - timeA;
      });      
      setBookings(docsList);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-700 border-green-200";
      case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      case "cancelled": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const handleStatusChange = async (booking: Booking, newStatus: Booking['status']) => {
    try {
      setIsUpdating(booking.id);
      const toastId = toast.loading(`Updating booking status...`);
      
      // 1. Update Firestore Document
      const docRef = doc(db, "bookings", booking.id);
      await updateDoc(docRef, { status: newStatus });
      
      // 2. Update UI State Locally
      setBookings(bookings.map(b => b.id === booking.id ? { ...b, status: newStatus } : b));
      
      // 3. Log the Activity locally for Dashboard feed
      const adminName = user?.email?.split('@')[0] || "Admin";
      await logActivity(
        "booking", 
        adminName, 
        `${newStatus === 'approved' ? 'approved' : 'rejected'} booking for ${booking.facility} by ${booking.user}`, 
        newStatus === 'approved' ? "success" : "warning"
      );

      // 4. Trigger Email Dispatch
      if (newStatus === 'approved' || newStatus === 'rejected') {
        fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: booking.userEmail || "test@example.com",
            userName: booking.user,
            facility: booking.facility,
            date: booking.checkIn === booking.checkOut ? booking.checkIn : `${booking.checkIn} - ${booking.checkOut}`,
            status: newStatus
          })
        }).catch(() => {});
      }

      toast.success(`Booking ${newStatus} successfully`, { id: toastId });
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDelete = async (id: string, facility: string, requestor: string) => {
    if (!window.confirm(`Are you sure you want to delete the booking for "${facility}" by "${requestor}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsUpdating(id);
      const toastId = toast.loading("Deleting booking...");
      await deleteDoc(doc(db, "bookings", id));
      
      const adminName = user?.email?.split('@')[0] || "Admin";
      await logActivity("booking", adminName, `deleted booking for ${facility} by ${requestor}`, "error");

      setBookings(bookings.filter(b => b.id !== id));
      toast.success("Booking deleted successfully", { id: toastId });
    } catch {
      toast.error("Failed to delete booking");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleExport = () => {
    if (filteredBookings.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Define CSV headers
    const headers = ["S.No", "Requestor", "Email", "Phone", "Facility", "Check-in", "Check-out", "Status", "Message"];
    
    // Convert data to CSV rows
    const rows = filteredBookings.map((b, index) => [
      index + 1,
      `"${(b.user || "").toString().replace(/"/g, '""')}"`,
      `"${(b.userEmail || "").toString().replace(/"/g, '""')}"`,
      `"${(b.phone || "").toString().replace(/"/g, '""')}"`,
      `"${(b.facility || "").toString().replace(/"/g, '""')}"`,
      `"${(b.checkIn || "").toString().replace(/"/g, '""')}"`,
      `"${(b.checkOut || "").toString().replace(/"/g, '""')}"`,
      `"${(b.status || "").toString().replace(/"/g, '""')}"`,
      `"${(b.message || "").toString().replace(/"/g, '""').replace(/\r?\n|\r/g, " ")}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Exported successfully");
  };

  const filteredBookings = bookings.filter(b => {
    const searchTermLower = searchTerm.toLowerCase();
    const userMatch = b.user ? String(b.user).toLowerCase().includes(searchTermLower) : false;
    const facilityMatch = b.facility ? String(b.facility).toLowerCase().includes(searchTermLower) : false;
    
    const statusMatch = statusFilter === "all" || b.status === statusFilter;
    const facilityFilterMatch = facilityFilter === "all" || b.facility === facilityFilter;

    return (userMatch || facilityMatch) && statusMatch && facilityFilterMatch;
  });

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-500 text-sm mt-1">Review and manage facility booking requests from the public.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm shadow-indigo-100"
        >
          <Download size={18} className="mr-2" />
          Export Data
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
            placeholder="Search by user or facility..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // reset to page 1 on search
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-sm font-bold text-gray-600 border border-gray-200 px-3 py-2 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select 
            value={facilityFilter}
            onChange={(e) => {
              setFacilityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-sm font-bold text-gray-600 border border-gray-200 px-3 py-2 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Facilities</option>
            {facilities.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {loading ? (
          <div className="flex-1 flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[150px]">Requester / Contact</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[150px]">Facility / Message</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-in</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-out</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mr-3 shrink-0">
                          <User size={16} />
                        </div>
                        <div className="flex flex-col truncate max-w-[150px]">
                          <span className="text-sm font-bold text-gray-900 truncate" title={booking.user}>{booking.user}</span>
                          {booking.userEmail ? (
                            <span className="text-[10px] text-gray-500 truncate" title={booking.userEmail}>{booking.userEmail}</span>
                          ) : null}
                          {booking.phone ? (
                            <span className="text-[10px] text-gray-500 truncate" title={booking.phone}>{booking.phone}</span>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-600 truncate" title={booking.facility}>{booking.facility}</span>
                        {booking.message ? (
                          <span className="text-[10px] text-gray-400 mt-0.5 truncate" title={booking.message}>{booking.message}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600 font-medium">
                        <Calendar size={14} className="mr-2 text-gray-400" />
                        {booking.checkIn}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600 font-medium">
                        <Calendar size={14} className="mr-2 text-gray-400" />
                        {booking.checkOut}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                        getStatusColor(booking.status)
                      )}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {booking.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(booking, 'approved')}
                              disabled={isUpdating === booking.id}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100 disabled:opacity-50"
                              title="Approve"
                            >
                              {isUpdating === booking.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                            </button>
                            <button 
                              onClick={() => handleStatusChange(booking, 'rejected')}
                              disabled={isUpdating === booking.id}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 disabled:opacity-50"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleDelete(booking.id, booking.facility, booking.user)}
                          disabled={isUpdating === booking.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && paginatedBookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <p className="font-bold">No bookings found</p>
                      <p className="text-sm">Wait for public users to submit booking requests.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Section */}
        {totalPages > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between mt-auto">
            <p className="text-xs text-gray-500 font-medium tracking-wide">
              Showing <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + (filteredBookings.length > 0 ? 1 : 0)}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)}</span> of <span className="font-bold text-gray-900">{filteredBookings.length}</span> bookings
            </p>
            {totalPages > 1 && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
