"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }

    if (!loading && isAuthenticated && allowedRoles && user) {
      if (!allowedRoles.includes(user.role_name)) {
        router.push("/dashboard");
      }
    }
  }, [loading, isAuthenticated, user, allowedRoles, router]);

  // Always show loading on first render to avoid hydration mismatch
  if (!isClient || loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <LoadingSpinner fullScreen />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role_name)) {
    return <LoadingSpinner fullScreen />;
  }

  return <>{children}</>;
}
