"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Fallback client-side redirect if middleware misses or auth state is explicitly lost
  useEffect(() => {
    if (!loading && !user) {
      // Clear cookie just in case
      document.cookie = "admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/login");
    }
  }, [user, loading, router]);

  // Optimistically render children since Middleware protects the route
  // The UI will fill in the 'user' details asynchronously
  return <>{children}</>;
}
