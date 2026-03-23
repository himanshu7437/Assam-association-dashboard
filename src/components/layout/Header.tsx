"use client";

import { Bell, Search, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-10 flex items-center justify-between px-8 ml-64">
      <div className="flex items-center space-x-4 flex-1">
        <div className="relative w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm"
            placeholder="Search anything..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-all duration-200">
          <Bell className="h-6 w-6" />
          <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>

        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 leading-none">{user?.email?.split('@')[0] || "Admin"}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase font-semibold tracking-wider">Super Admin</p>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-100 ring-2 ring-white shadow-sm overflow-hidden relative">
            {user?.photoURL ? (
              <Image 
                src={user.photoURL} 
                alt="Profile" 
                fill 
                className="object-cover" 
              />
            ) : (
              <User className="h-6 w-6 text-indigo-600" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
