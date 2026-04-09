"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, change, trend, icon, color }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-xl", color)}>
          {icon}
        </div>
        {trend !== "neutral" && (
          <div className={cn(
            "flex items-center text-sm font-bold",
            trend === "up" ? "text-green-600" : "text-red-600"
          )}>
            {trend === "up" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="ml-1">{change}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
      </div>
    </div>
  );
}

// Lazy load the heavy calendar modal
const CalendarModal = dynamic(() => import("@/components/dashboard/CalendarModal"), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10"><Loader2 className="animate-spin text-indigo-600" /></div>
});

interface Booking {
  id: string;
  date?: string;
  checkIn: string;
  checkOut: string;
  status: string;
  facility: string;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({ bookings: 0, notices: 0, members: 0 });
  const [loading, setLoading] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch Bookings for Calendar & Stats
      const bookingsSnap = await getDocs(collection(db, "bookings"));
      const bks = bookingsSnap.docs.map(doc => {
        const data = doc.data();
        
        // Helper to format date for comparison (YYYY-MM-DD)
        const formatToISODate = (dateVal: any) => {
          if (!dateVal) return "";
          let d: Date;
          if (typeof dateVal.toDate === 'function') {
            d = dateVal.toDate();
          } else {
            d = new Date(dateVal);
          }
          if (isNaN(d.getTime())) return "";
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };

        const checkIn = data.checkIn ? formatToISODate(data.checkIn) : formatToISODate(data.date);
        const checkOut = data.checkOut ? formatToISODate(data.checkOut) : formatToISODate(data.date);

        return { 
          id: doc.id, 
          ...data,
          checkIn,
          checkOut
        };
      }) as Booking[];
      setBookings(bks);

      // Fetch Notices Stats
      const noticesSnap = await getDocs(collection(db, "notices"));
      
      // Fetch Committee Stats
      const committeeSnap = await getDocs(collection(db, "committee"));

      setStats({
        bookings: bks.length,
        notices: noticesSnap.size,
        members: committeeSnap.size
      });
      
    } catch {
      // Data loading failed silently
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const pendingBookings = bookings
    .filter(b => b.status === "pending")
    .slice(0, 5);

  const upcomingBookings = bookings
    .filter(b => b.checkIn >= todayStr)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))
    .slice(0, 5);



  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.email?.split('@')[0] || "Admin"}!</h1>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s what&apos;s happening with the Assam Association today.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <Clock className="text-indigo-600 h-4 w-4" />
          <span className="text-sm font-bold text-gray-600">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Bookings" 
          value={loading ? "..." : stats.bookings} 
          change="Live" 
          trend="neutral" 
          icon={<Calendar className="text-white h-6 w-6" />}
          color="bg-indigo-600"
        />
        <StatCard 
          title="Active Notices" 
          value={loading ? "..." : stats.notices} 
          change="Live" 
          trend="neutral" 
          icon={<Bell className="text-white h-6 w-6" />}
          color="bg-amber-500"
        />
        <StatCard 
          title="Total Members" 
          value={loading ? "..." : stats.members} 
          change="Live" 
          trend="neutral" 
          icon={<Users className="text-white h-6 w-6" />}
          color="bg-blue-600"
        />
        <StatCard 
          title="System Health" 
          value="100%" 
          change="Online" 
          trend="neutral" 
          icon={<TrendingUp className="text-white h-6 w-6" />}
          color="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Dashboard Panels */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Pending Approvals Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center">
                <Clock className="mr-2 text-amber-500 h-5 w-5" />
                Pending Approvals
              </h3>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              </div>
            ) : pendingBookings.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="font-bold">No pending approvals</p>
                <p className="text-sm">You are all caught up.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pendingBookings.map((booking) => (
                  <div key={booking.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50/50 transition-colors gap-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mr-4 shrink-0">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{booking.facility || 'Unknown Facility'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{booking.checkIn} to {booking.checkOut}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Bookings Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center">
                <Calendar className="mr-2 text-indigo-600 h-5 w-5" />
                Upcoming Bookings
              </h3>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p className="font-bold">No upcoming bookings</p>
                <p className="text-sm">There are no upcoming bookings yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50/50 transition-colors gap-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mr-4 shrink-0">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{booking.facility || 'Unknown Facility'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Check-in: {booking.checkIn}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      Upcoming
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Quick Actions / Summary */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Calendar size={160} />
            </div>
            <h3 className="text-lg font-bold mb-2">Hall Availability</h3>
            <p className="text-indigo-100 text-sm mb-4">You have {bookings.filter(b => b.status === "approved").length} approved bookings inside the database.</p>
            <button 
              onClick={() => setIsCalendarOpen(true)}
              className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all w-full text-center relative z-10"
            >
              Check Calendar
            </button>
          </div>

        </div>
      </div>

      {/* Calendar Modal */}
      {isCalendarOpen && (
        <CalendarModal bookings={bookings} onClose={() => setIsCalendarOpen(false)} />
      )}

    </div>
  );
}
