"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Calendar, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  X,
  Loader2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

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

interface Activity {
  id: string;
  type: 'booking' | 'notice' | 'document' | 'message' | 'system';
  user: string;
  action: string;
  createdAt: { toDate: () => Date } | any;
  status?: 'success' | 'warning' | 'info' | 'error';
}

interface Booking {
  id: string;
  date: string;
  status: string;
  facility: string;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({ bookings: 0, notices: 0, members: 0 });
  const [loading, setLoading] = useState(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Calendar Navigation State
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch Recent Activities
      const activitiesSnap = await getDocs(query(collection(db, "activities"), orderBy("createdAt", "desc"), limit(6)));
      const acts = activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Activity[];
      setActivities(acts);

      // Fetch Bookings for Calendar & Stats
      const bookingsSnap = await getDocs(collection(db, "bookings"));
      const bks = bookingsSnap.docs.map(doc => {
        const data = doc.data();
        let dateStr = "";
        if (data.date) {
            if (typeof data.date.toDate === 'function') {
                const theDate = data.date.toDate();
                dateStr = `${theDate.getFullYear()}-${String(theDate.getMonth() + 1).padStart(2, '0')}-${String(theDate.getDate()).padStart(2, '0')}`;
            } else {
                dateStr = String(data.date);
            }
        }
        return { 
          id: doc.id, 
          ...data,
          date: dateStr 
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

  const getRelativeTime = (timestamp: { toDate: () => Date } | null | undefined) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') return "Just now";
    const now = new Date();
    const past = timestamp.toDate();
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getCalendarDays = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay(); // 0 is Sunday
    const daysInMonth = lastDay.getDate();

    const approvedBookings = bookings.filter(b => b.status === "approved");
    
    const days = [];
    // Padding from previous month
    for (let i = 0; i < startPadding; i++) {
      days.push({ day: null, booked: [] });
    }
    // Days of the current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      // Extract simplified information for multiple bookings on the same day
      const dayBookings = approvedBookings
        .filter(b => {
          // Robust date comparison
          if (!b.date) return false;
          // Standardize date format for comparison (YYYY-MM-DD)
          let bDate = b.date;
          if (b.date.includes(',')) {
            // Handle "Mar 27, 2026" format from localized strings
            const parsedDate = new Date(b.date);
            bDate = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;
          }
          return bDate === dateStr;
        })
        .map(b => ({
          id: b.id,
          facility: b.facility
        }));
      days.push({ day: d, booked: dayBookings });
    }
    
    return { year, month, days };
  };

  const calendarData = getCalendarDays(currentMonth, currentYear);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDate(null);
  };

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
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center">
              <TrendingUp className="mr-2 text-indigo-600 h-5 w-5" />
              Recent System Activity
            </h3>
          </div>
          
          {loading ? (
             <div className="flex items-center justify-center p-12">
               <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
             </div>
          ) : activities.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="font-bold">No recent activities</p>
              <p className="text-sm">System actions will appear here automatically.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activities.map((activity) => (
                <div key={activity.id} className="px-6 py-4 flex items-center hover:bg-gray-50/50 transition-colors">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center mr-4 shrink-0",
                    activity.type === 'booking' ? "bg-blue-50 text-blue-600" :
                    activity.type === 'notice' ? "bg-amber-50 text-amber-600" :
                    activity.type === 'document' ? "bg-purple-50 text-purple-600" : 
                    activity.type === 'system' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {activity.type === 'booking' ? <Calendar size={18} /> :
                     activity.type === 'notice' ? <Bell size={18} /> :
                     activity.type === 'document' ? <FileText size={18} /> :
                     activity.type === 'system' ? <TrendingUp size={18} /> : <MessageSquare size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-bold text-gray-900">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{getRelativeTime(activity.createdAt)}</p>
                  </div>
                  <ChevronRight className="text-gray-300 h-4 w-4 shrink-0 hidden sm:block" />
                </div>
              ))}
            </div>
          )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors border border-gray-100"
                >
                  <ChevronLeft size={18} />
                </button>
                <h2 className="text-xl font-bold flex items-center text-gray-900 min-w-[150px] justify-center">
                  {monthNames[calendarData.month]} {calendarData.year}
                </h2>
                <button 
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors border border-gray-100"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <button 
                onClick={() => setIsCalendarOpen(false)} 
                className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarData.days.map((item, i) => {
                  const dateStr = item.day ? `${calendarData.year}-${String(calendarData.month + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}` : null;
                  const isSelected = selectedDate === dateStr;
                  
                  return (
                    <div 
                      key={i} 
                      onClick={() => item.day && setSelectedDate(dateStr)}
                      className={cn(
                        "aspect-square rounded-xl flex flex-col items-center sm:items-start justify-center sm:justify-start text-sm border transition-all p-1 sm:p-1.5 overflow-hidden cursor-pointer",
                        !item.day ? "border-transparent bg-transparent cursor-default" :
                        item.booked.length > 0 
                          ? cn(
                              "bg-indigo-50 border-indigo-200 font-bold text-indigo-900 shadow-sm hover:scale-[1.02]",
                              isSelected && "ring-2 ring-indigo-500 border-transparent shadow-md bg-indigo-100"
                            )
                          : cn(
                              "bg-white border-gray-100 text-gray-600 hover:border-indigo-200 hover:bg-gray-50",
                              isSelected && "ring-2 ring-indigo-500 border-transparent shadow-md"
                            )
                      )}
                    >
                      {item.day && (
                        <>
                          <span className={cn(
                            "text-[10px] sm:text-xs mb-0.5",
                            isSelected && "text-indigo-600"
                          )}>{item.day}</span>
                          
                          {/* Indicator for Mobile */}
                          {item.booked.length > 0 && (
                            <div className="sm:hidden flex space-x-0.5 mt-auto">
                              {item.booked.slice(0, 3).map((_, idx) => (
                                <div key={idx} className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              ))}
                              {item.booked.length > 3 && <div className="text-[6px] text-indigo-500">+</div>}
                            </div>
                          )}

                          {/* Detail View for Desktop */}
                          {item.booked.length > 0 && (
                            <div className="hidden sm:flex flex-col gap-0.5 w-full overflow-y-auto no-scrollbar">
                              {item.booked.slice(0, 2).map((booking, idx) => (
                                <div 
                                  key={idx} 
                                  title={booking.facility}
                                  className="text-[8px] leading-tight px-1 py-0.5 rounded bg-indigo-100 text-indigo-700 truncate w-full border border-indigo-200"
                                >
                                  {booking.facility}
                                </div>
                              ))}
                              {item.booked.length > 2 && (
                                <div className="text-[7px] text-indigo-500 font-bold pl-1">
                                  +{item.booked.length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected Day Details (Visible when something is selected) */}
              {selectedDate && (
                <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-900 border-l-4 border-indigo-600 pl-3">
                      Bookings on {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </h4>
                    <button 
                      onClick={() => setSelectedDate(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 font-bold"
                    >
                      Clear
                    </button>
                  </div>
                  
                  {calendarData.days.find(d => d.day && `${calendarData.year}-${String(calendarData.month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` === selectedDate)?.booked.length! > 0 ? (
                    <div className="space-y-2">
                      {calendarData.days.find(d => d.day && `${calendarData.year}-${String(calendarData.month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}` === selectedDate)?.booked.map((bk, i) => (
                        <div key={i} className="flex items-center p-3 bg-white rounded-xl shadow-sm border border-indigo-100 text-sm">
                          <div className="w-2 h-2 rounded-full bg-indigo-600 mr-3 animate-pulse" />
                          <span className="font-bold text-gray-800">{bk.facility}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400 italic text-xs">
                      No bookings for this day.
                    </div>
                  )}
                </div>
              )}
              <div className="mt-6 flex items-center justify-center space-x-4 text-xs font-bold text-gray-500">
                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div> Booked Facility</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded-full border border-gray-200 mr-2"></div> Available</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
