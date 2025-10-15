import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const sessionToken = localStorage.getItem("session_token");
    
    if (!sessionToken) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("get_user_by_session", {
        _session_token: sessionToken,
      });

      if (error || !data || data.length === 0) {
        setIsAuthenticated(false);
        localStorage.removeItem("session_token");
        return;
      }

      setIsAuthenticated(true);

      if (requireAdmin) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data[0].user_id)
          .single();

        setIsAdmin(roleData?.role === "admin");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
    }
  };

  if (isAuthenticated === null) {
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
