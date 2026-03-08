import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformOwner } from "@/hooks/usePlatformOwner";

interface PlatformProtectedRouteProps {
  children: ReactNode;
}

export const PlatformProtectedRoute = ({ children }: PlatformProtectedRouteProps) => {
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { isPlatformOwner, isCheckingPlatformOwner } = usePlatformOwner();

  useEffect(() => {
    if (authLoading || isCheckingPlatformOwner) return;
    if (user && !isPlatformOwner) {
      toast.error("Only platform owners can access this console.");
    }
  }, [authLoading, isCheckingPlatformOwner, isPlatformOwner, user]);

  if (authLoading || isCheckingPlatformOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-400" />
          <p className="mt-4 text-sm text-slate-400">Loading platform access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/platform/auth" replace state={{ from: location.pathname }} />;
  }

  if (!isPlatformOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
