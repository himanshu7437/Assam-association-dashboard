"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Calendar,
  User,
  Phone,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Trash2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Booking {
  id: string;
  user: string;
  facility: string;
  date: string;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled';
  amount: string;
}

const initialBookings: Booking[] = [
  { id: "1", user: "Rahul Sharma", facility: "Main Hall", date: "2024-04-10", status: "pending", amount: "₹15,000" },
  { id: "2", user: "Sunita Gogoi", facility: "Guest Room 102", date: "2024-03-25", status: "approved", amount: "₹2,500" },
  { id: "3", user: "Bikash Das", facility: "Conference Room", date: "2024-03-22", status: "rejected", amount: "₹5,000" },
  { id: "4", user: "Meenakshi Baruah", facility: "Main Hall", date: "2024-04-15", status: "approved", amount: "₹15,000" },
  { id: "5", user: "Diganta Bora", facility: "Guest Room 105", date: "2024-03-28", status: "cancelled", amount: "₹2,500" },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [searchTerm, setSearchTerm] = useState("");

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-700 border-green-200";
      case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      case "cancelled": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const handleStatusChange = (id: string, newStatus: Booking['status']) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-500 text-sm mt-1">Review and manage facility booking requests from the public.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-sm">
            <Calendar className="h-4 w-4 mr-2" />
            Check Availability
          </button>
        </div>
      </div>

      {/* Filters Bar */}
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
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center text-sm font-bold text-gray-600 hover:text-indigo-600 border border-gray-200 px-3 py-2 rounded-lg bg-gray-50/50 hover:bg-white transition-all">
            <Filter size={16} className="mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requester</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Facility</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mr-3">
                        <User size={16} />
                      </div>
                      <span className="text-sm font-bold text-gray-900">{booking.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-600">{booking.facility}</span>
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
                    <div className="flex items-center justify-end space-x-2">
                      <button 
                        onClick={() => handleStatusChange(booking.id, 'approved')}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                        title="Approve"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleStatusChange(booking.id, 'rejected')}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Reject"
                      >
                        <XCircle size={18} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Showing 5 of 128 bookings</p>
          <div className="flex items-center space-x-2">
            <button className="p-2 border border-gray-200 rounded-lg bg-white text-gray-400 disabled:opacity-50"><ChevronLeft size={16} /></button>
            <button className="p-2 border border-indigo-200 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs px-4">1</button>
            <button className="p-2 border border-gray-200 rounded-lg bg-white text-gray-600 font-bold text-xs px-4">2</button>
            <button className="p-2 border border-gray-200 rounded-lg bg-white text-gray-600 font-bold text-xs px-4">3</button>
            <button className="p-2 border border-gray-200 rounded-lg bg-white text-gray-400"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
