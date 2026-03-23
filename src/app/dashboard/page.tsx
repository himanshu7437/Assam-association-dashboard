"use client";

import React, { useState } from "react";
import { 
  Users, 
  Calendar, 
  FileText, 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Bell
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
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
        <div className={cn(
          "flex items-center text-sm font-bold",
          trend === "up" ? "text-green-600" : "text-red-600"
        )}>
          {trend === "up" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          <span className="ml-1">{change}</span>
        </div>
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
  type: 'booking' | 'notice' | 'document' | 'message';
  user: string;
  action: string;
  time: string;
  status?: 'success' | 'warning' | 'info';
}

const recentActivities: Activity[] = [
  { id: "1", type: "booking", user: "Rahul Sharma", action: "requested a new Bhawan booking", time: "2 hours ago", status: "info" },
  { id: "2", type: "notice", user: "Admin", action: "published Annual Meeting notice", time: "5 hours ago", status: "success" },
  { id: "3", type: "document", user: "Admin", action: "uploaded 2023 financial report", time: "Yesterday", status: "success" },
  { id: "4", type: "message", user: "Sunita Gogoi", action: "sent a membership query", time: "2 days ago", status: "warning" },
  { id: "5", type: "booking", user: "Bikash Das", action: "cancelled Guest House booking", time: "3 days ago", status: "warning" },
];

export default function DashboardOverview() {
  const { user } = useAuth();

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
          <span className="text-sm font-bold text-gray-600">March 20, 2024</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Bookings" 
          value="128" 
          change="+12%" 
          trend="up" 
          icon={<Calendar className="text-white h-6 w-6" />}
          color="bg-indigo-600"
        />
        <StatCard 
          title="Active Notices" 
          value="12" 
          change="+2" 
          trend="up" 
          icon={<Bell className="text-white h-6 w-6" />}
          color="bg-amber-500"
        />
        <StatCard 
          title="New Messages" 
          value="45" 
          change="-5%" 
          trend="down" 
          icon={<MessageSquare className="text-white h-6 w-6" />}
          color="bg-emerald-500"
        />
        <StatCard 
          title="Total Members" 
          value="1.2k" 
          change="+4%" 
          trend="up" 
          icon={<Users className="text-white h-6 w-6" />}
          color="bg-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center">
              <TrendingUp className="mr-2 text-indigo-600 h-5 w-5" />
              Recent Activity
            </h3>
            <button className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4 flex items-center hover:bg-gray-50/50 transition-colors">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center mr-4",
                  activity.type === 'booking' ? "bg-blue-50 text-blue-600" :
                  activity.type === 'notice' ? "bg-amber-50 text-amber-600" :
                  activity.type === 'document' ? "bg-purple-50 text-purple-600" : "bg-emerald-50 text-emerald-600"
                )}>
                  {activity.type === 'booking' ? <Calendar size={18} /> :
                   activity.type === 'notice' ? <Bell size={18} /> :
                   activity.type === 'document' ? <FileText size={18} /> : <MessageSquare size={18} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-bold text-gray-900">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                </div>
                <ChevronRight className="text-gray-300 h-4 w-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Summary */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Calendar size={160} />
            </div>
            <h3 className="text-lg font-bold mb-2">Hall Availability</h3>
            <p className="text-indigo-100 text-sm mb-4">Srimanta Sankaradeva Bhawan is 85% booked for April 2024.</p>
            <button className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all">Check Calendar</button>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Support & Feedback</h3>
            <div className="space-y-4">
              <div className="flex items-center p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-indigo-100 transition-colors cursor-pointer group">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">IT Support</p>
                  <p className="text-xs text-gray-400">Request technical help</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
