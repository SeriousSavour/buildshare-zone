import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log("🔒 ProtectedRoute checkAuth - Starting, requireAdmin:", requireAdmin);
    
    // Try localStorage first, then sessionStorage as fallback
    let sessionToken = localStorage.getItem("session_token");
    
    if (!sessionToken) {
      sessionToken = sessionStorage.getItem("session_token");
      // If found in sessionStorage, restore to localStorage
      if (sessionToken) {
        localStorage.setItem("session_token", sessionToken);
      }
    }
    
    if (!sessionToken) {
      console.log("🔒 ProtectedRoute - No session token found");
      setIsAuthenticated(false);
      setIsAdmin(false);
      return;
    }

    try {
      // Verify the session is still valid
      console.log("🔒 ProtectedRoute - Verifying session");
      const { data, error } = await supabase.rpc("get_user_by_session", {
        _session_token: sessionToken,
      });

      console.log("🔒 ProtectedRoute - User data:", data);
      console.log("🔒 ProtectedRoute - User error:", error);

      if (error || !data || data.length === 0) {
        console.log("🔒 ProtectedRoute - Session invalid, clearing storage");
        setIsAuthenticated(false);
        setIsAdmin(false);
        localStorage.removeItem("session_token");
        sessionStorage.removeItem("session_token");
        localStorage.removeItem("auth_initialized");
        return;
      }

      // Check admin role if required
      if (requireAdmin) {
        console.log("🔒 ProtectedRoute - Admin required, checking roles for user:", data[0].user_id);
        
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data[0].user_id);

        console.log("🔒 ProtectedRoute admin check - Role data:", roleData);
        console.log("🔒 ProtectedRoute admin check - Role error:", roleError);

        const hasAdminRole = roleData?.some(r => r.role === "admin") || false;
        console.log("🔒 ProtectedRoute admin check - Has admin role:", hasAdminRole);
        
        setIsAdmin(hasAdminRole);
        setIsAuthenticated(true);
        
        console.log("🔒 ProtectedRoute - Set isAdmin to:", hasAdminRole);
      } else {
        console.log("🔒 ProtectedRoute - Admin not required, setting authenticated");
        setIsAdmin(false);
        setIsAuthenticated(true);
      }
      
      // Ensure token is in both storages
      localStorage.setItem("session_token", sessionToken);
      sessionStorage.setItem("session_token", sessionToken);
    } catch (error) {
      console.error("🔒 ProtectedRoute - Auth check failed:", error);
      setIsAuthenticated(false);
      setIsAdmin(false);
      localStorage.removeItem("session_token");
      sessionStorage.removeItem("session_token");
      localStorage.removeItem("auth_initialized");
    }
  };

  // Show loading while checking auth or admin status
  if (isAuthenticated === null || (requireAdmin && isAdmin === null)) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/games" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
