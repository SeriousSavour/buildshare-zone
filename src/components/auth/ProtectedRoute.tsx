import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabaseWithProxy as supabase } from "@/lib/proxyClient";

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
      setIsAuthenticated(false);
      setIsAdmin(false);
      return;
    }

    try {
      // Verify the session is still valid
      const { data, error } = await supabase.rpc("get_user_by_session", {
        _session_token: sessionToken,
      });

      if (error || !data || data.length === 0) {
        // Session is invalid, clear storage
        setIsAuthenticated(false);
        setIsAdmin(false);
        localStorage.removeItem("session_token");
        sessionStorage.removeItem("session_token");
        localStorage.removeItem("auth_initialized");
        return;
      }

      // Check admin role if required
      if (requireAdmin) {
        // Set session context before querying roles
        await supabase.rpc('set_session_context', { _session_token: sessionToken });
        
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data[0].user_id);

        console.log("ProtectedRoute admin check - User ID:", data[0].user_id);
        console.log("ProtectedRoute admin check - Role data:", roleData);
        console.log("ProtectedRoute admin check - Role error:", roleError);

        const hasAdminRole = roleData?.some(r => r.role === "admin") || false;
        console.log("ProtectedRoute admin check - Has admin role:", hasAdminRole);
        setIsAdmin(hasAdminRole);
        setIsAuthenticated(true);
      } else {
        // Not checking admin, so set to false and mark as authenticated
        setIsAdmin(false);
        setIsAuthenticated(true);
      }
      
      // Ensure token is in both storages
      localStorage.setItem("session_token", sessionToken);
      sessionStorage.setItem("session_token", sessionToken);
    } catch (error) {
      console.error("Auth check failed:", error);
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
