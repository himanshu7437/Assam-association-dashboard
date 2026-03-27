"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
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
  date: string;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled';
  amount: string;
  createdAt?: any;
}

const ITEMS_PER_PAGE = 5;

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "bookings"));
      const docsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        let dateStr = "N/A";
        if (data.date) {
          if (typeof data.date.toDate === 'function') {
            dateStr = data.date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
          } else {
            dateStr = String(data.date);
          }
        }
        return {
          id: doc.id,
          user: data.name || data.user || "Unknown Requestor",
          userEmail: data.email || data.userEmail || "",
          phone: data.phone || "",
          message: data.message || "",
          facility: data.facility || "Unknown",
          date: dateStr,
          status: data.status || "pending",
          amount: data.amount || "N/A",
          createdAt: data.createdAt
        };
      }) as Booking[];
      
      // Sort by latest created or date
      docsList.sort((a, b) => {
        const timeA = a.createdAt && typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate().getTime() : (a.date ? new Date(a.date).getTime() : 0);
        const timeB = b.createdAt && typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate().getTime() : (b.date ? new Date(b.date).getTime() : 0);
        return timeB - timeA;
      });      
      setBookings(docsList);
    } catch (error) {
      console.error("Error fetching bookings:", error);
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
            date: booking.date,
            status: newStatus
          })
        }).catch(err => console.error("Email API failed:", err));
      }

      toast.success(`Booking ${newStatus} successfully`, { id: toastId });
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update status");
    }
  };

  const filteredBookings = bookings.filter(b => {
    const searchTermLower = searchTerm.toLowerCase();
    const userMatch = b.user ? String(b.user).toLowerCase().includes(searchTermLower) : false;
    const facilityMatch = b.facility ? String(b.facility).toLowerCase().includes(searchTermLower) : false;
    return userMatch || facilityMatch;
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
        <div className="flex items-center space-x-4">
          <button className="flex items-center text-sm font-bold text-gray-600 hover:text-indigo-600 border border-gray-200 px-3 py-2 rounded-lg bg-gray-50/50 hover:bg-white transition-all">
            <Filter size={16} className="mr-2" />
            More Filters
          </button>
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
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
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
                        {booking.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">{booking.amount}</span>
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
                      {booking.status === 'pending' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleStatusChange(booking, 'approved')}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                            title="Approve"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleStatusChange(booking, 'rejected')}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium italic pr-2">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}

                {!loading && paginatedBookings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
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
