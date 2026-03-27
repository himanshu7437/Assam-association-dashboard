"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
        <div className="flex-1 flex flex-col min-w-0 md:pl-64 transition-all pb-10">
          <Header onOpenSidebar={() => setIsMobileMenuOpen(true)} />
          <main className="p-4 md:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
