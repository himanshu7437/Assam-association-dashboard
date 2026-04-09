"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronLeft, Calendar, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Booking {
  id: string;
  date?: string;
  checkIn: string;
  checkOut: string;
  status: string;
  facility: string;
}

interface CalendarModalProps {
  bookings: Booking[];
  onClose: () => void;
}

export default function CalendarModal({ bookings, onClose }: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [facilityFilter, setFacilityFilter] = useState<string>("all");

  const facilities = Array.from(new Set(bookings.map(b => b.facility))).filter(Boolean);

  const getCalendarDays = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay(); // 0 is Sunday
    const daysInMonth = lastDay.getDate();

    // Filter bookings by facility if applicable
    const relevantBookings = bookings.filter(b => 
      (facilityFilter === "all" || b.facility === facilityFilter) &&
      (b.status === "approved" || b.status === "pending")
    );
    
    const days = [];
    // Padding from previous month
    for (let i = 0; i < startPadding; i++) {
      days.push({ day: null, booked: [] });
    }
    // Days of the current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const dayBookings = relevantBookings
        .filter(b => {
          if (!b.checkIn || !b.checkOut) return false;
          return dateStr >= b.checkIn && dateStr <= b.checkOut;
        })
        .map(b => ({
          id: b.id,
          facility: b.facility,
          status: b.status,
          checkIn: b.checkIn,
          checkOut: b.checkOut
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between bg-white gap-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
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
            <select 
              value={facilityFilter}
              onChange={(e) => setFacilityFilter(e.target.value)}
              className="text-xs font-bold text-gray-600 border border-gray-100 px-3 py-1.5 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Facilities</option>
              {facilities.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors ml-auto"
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
              
              const hasApproved = item.booked.some(b => b.status === "approved");
              const hasPending = item.booked.some(b => b.status === "pending");
              
              return (
                <div 
                  key={i} 
                  onClick={() => item.day && setSelectedDate(dateStr)}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center sm:items-start justify-center sm:justify-start text-sm border transition-all p-1 sm:p-1.5 overflow-hidden cursor-pointer",
                    !item.day ? "border-transparent bg-transparent cursor-default" :
                    item.booked.length > 0 
                      ? cn(
                          hasApproved ? "bg-indigo-50 border-indigo-200 font-bold text-indigo-900" : "bg-amber-50 border-amber-200 font-bold text-amber-900",
                          "shadow-sm hover:scale-[1.02]",
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
                          {item.booked.slice(0, 3).map((b, idx) => (
                            <div key={idx} className={cn("w-1.5 h-1.5 rounded-full", b.status === 'approved' ? "bg-indigo-500" : "bg-amber-500")} />
                          ))}
                          {item.booked.length > 3 && <div className="text-[6px] text-indigo-500 font-bold">+</div>}
                        </div>
                      )}

                      {/* Detail View for Desktop */}
                      {item.booked.length > 0 && (
                        <div className="hidden sm:flex flex-col gap-0.5 w-full overflow-y-auto no-scrollbar">
                          {item.booked.slice(0, 2).map((booking, idx) => (
                            <div 
                              key={idx} 
                              title={booking.facility}
                              className={cn(
                                "text-[8px] leading-tight px-1 py-0.5 rounded truncate w-full border",
                                booking.status === 'approved' 
                                  ? "bg-indigo-100 text-indigo-700 border-indigo-200" 
                                  : "bg-amber-100 text-amber-700 border-amber-200"
                              )}
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

          {/* Selected Day Details */}
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
                    <div key={i} className={cn(
                      "flex items-center p-3 bg-white rounded-xl shadow-sm border text-sm",
                      bk.status === 'approved' ? "border-indigo-100" : "border-amber-100"
                    )}>
                      <div className={cn("w-2 h-2 rounded-full mr-3 animate-pulse", bk.status === 'approved' ? "bg-indigo-600" : "bg-amber-500")} />
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800">{bk.facility}</span>
                        <span className="text-[10px] text-gray-400 capitalize">{bk.status} • {bk.checkIn} to {bk.checkOut}</span>
                      </div>
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
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-bold text-gray-500">
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div> Approved</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div> Pending</div>
            <div className="flex items-center"><div className="w-3 h-3 rounded-full border border-gray-200 mr-2"></div> Available</div>
          </div>
        </div>
      </div>
    </div>
  );
}
