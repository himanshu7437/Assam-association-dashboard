"use client";

import { User, Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

interface HeaderProps {
  onOpenSidebar: () => void;
}

export default function Header({ onOpenSidebar }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center space-x-4">
        <button 
          onClick={onOpenSidebar}
          className="md:hidden p-2 text-gray-500 hover:text-indigo-600 focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3 pl-4 md:border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 leading-none">{user?.email?.split('@')[0] || "Admin"}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase font-semibold tracking-wider">Super Admin</p>
          </div>
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-100 ring-2 ring-white shadow-sm overflow-hidden relative">
            {user?.photoURL ? (
              <Image 
                src={user.photoURL} 
                alt="Profile" 
                fill
                sizes="40px" 
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
