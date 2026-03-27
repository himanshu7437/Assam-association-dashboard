"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Bell, 
  FileText, 
  Image as ImageIcon, 
  Users, 
  UserCheck,
  Wrench, 
  MessageSquare,
  LogOut,
  X
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/context/AuthContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck },
  { name: "Memberships", href: "/dashboard/memberships", icon: UserCheck },
  { name: "Notices", href: "/dashboard/notices", icon: Bell },
  { name: "Documents", href: "/dashboard/documents", icon: FileText },
  { name: "Gallery", href: "/dashboard/gallery", icon: ImageIcon },
  { name: "Committee", href: "/dashboard/committee", icon: Users },
  { name: "Services", href: "/dashboard/services", icon: Wrench },
  { name: "Contact", href: "/dashboard/contact", icon: MessageSquare },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <div 
        className={cn(
          "flex flex-col h-full bg-white border-r border-gray-200 w-64 fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between h-16 border-b border-gray-200 px-6">
          <h1 className="text-xl font-bold text-indigo-600 truncate">AAD Admin</h1>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-500 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group",
                pathname === item.href
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 transition-colors duration-200",
                  pathname === item.href
                    ? "text-indigo-600"
                    : "text-gray-400 group-hover:text-gray-500"
                )}
              />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 group"
          >
            <LogOut className="mr-3 h-5 w-5 text-red-500 group-hover:text-red-600" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
