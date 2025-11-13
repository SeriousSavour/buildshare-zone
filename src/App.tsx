import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { SnowEffect } from "@/components/winter/SnowEffect";
import { WalkingSnowman } from "@/components/winter/WalkingSnowman";
import { useChristmasTheme } from "@/hooks/useChristmasTheme";
import { api } from "@/lib/api";

import LoadingScreen from "@/components/LoadingScreen";
import WindowsLogin from "@/components/WindowsLogin";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Browser from "./pages/Browser";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Games from "./pages/Games";
import GameDetail from "./pages/GameDetail";
import Tools from "./pages/Tools";
import ToolDetail from "./pages/ToolDetail";
import Create from "./pages/Create";
import Friends from "./pages/Friends";
import Chat from "./pages/Chat";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import Philosophy from "./pages/Philosophy";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminAuth from "./components/admin/AdminAuth";

const queryClient = new QueryClient();

const App = () => {
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  console.log("App state:", { loading, showLogin, showContent, checkingSession });
  
  // Initialize Christmas theme
  useChristmasTheme();
  
  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await api.getCurrentUser();
        if (user) {
          // User has valid session, skip login
          console.log("Valid session found, skipping login");
          setCheckingSession(false);
          setShowLogin(false);
          setShowContent(true);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log("No valid session found");
      }
      setCheckingSession(false);
    };
    
    checkSession();
  }, []);
  
  // Add beforeunload event listener to warn users before closing tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Chrome requires returnValue to be set
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (!loading && !showLogin) {
      setTimeout(() => setShowContent(true), 300);
    }
  }, [loading, showLogin]);

  return (
    <div className="relative">
      {loading && !checkingSession && <LoadingScreen onLoadComplete={() => {
        console.log("onLoadComplete called");
        setLoading(false);
        setShowLogin(true);
      }} />}
      {showLogin && !loading && !checkingSession && <WindowsLogin onLoginComplete={() => {
        console.log("onLoginComplete called");
        setShowLogin(false);
        setTimeout(() => setShowContent(true), 300);
      }} />}
    <div className={`transition-opacity duration-500 ${showContent && !loading && !showLogin && !checkingSession ? 'opacity-100' : 'opacity-0'}`}>
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <TooltipProvider>
          <SnowEffect />
          <WalkingSnowman />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/browser" replace />} />
              <Route path="/browser" element={<Browser />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
              <Route path="/games/:id" element={<ProtectedRoute><GameDetail /></ProtectedRoute>} />
              <Route path="/tools" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
              <Route path="/tools/:id" element={<ProtectedRoute><ToolDetail /></ProtectedRoute>} />
              <Route path="/create" element={<ProtectedRoute><Create /></ProtectedRoute>} />
              <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminAuth><Admin /></AdminAuth>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/help" element={<Help />} />
              <Route path="/philosophy" element={<Philosophy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="*" element={<Navigate to="/browser" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </ErrorBoundary>
    </div>
    </div>
  );
};

export default App;
