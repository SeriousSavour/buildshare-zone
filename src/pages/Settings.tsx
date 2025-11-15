import Navigation from "@/components/layout/Navigation";
import AnnouncementBanner from "@/components/layout/AnnouncementBanner";
import { ChristmasThemeToggle } from "@/components/theme/ChristmasThemeToggle";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    try {
      const sessionToken = localStorage.getItem('sessionToken') || sessionStorage.getItem('sessionToken');
      
      if (!sessionToken) {
        toast.error("Session expired. Please log in again.");
        navigate('/login');
        return;
      }

      const { data, error } = await supabase.rpc('delete_user_account', {
        _session_token: sessionToken
      });

      if (error) throw error;

      if (data?.success) {
        // Clear all local storage and session data
        localStorage.clear();
        sessionStorage.clear();
        
        toast.success("Your account has been permanently deleted.");
        navigate('/login');
      } else {
        toast.error(data?.error || "Failed to delete account");
      }
    } catch (error: any) {
      console.error('Account deletion error:', error);
      toast.error(error.message || "An error occurred while deleting your account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <Navigation />
      <AnnouncementBanner />
      <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 gradient-text">Settings</h1>
        
        <div className="space-y-8">
          {/* Profile Settings */}
          <div className="glass-card p-6 rounded-lg border border-white/10">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Profile Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Username</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 bg-background/50 border border-white/10 rounded-lg text-foreground" 
                  placeholder="Your username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 bg-background/50 border border-white/10 rounded-lg text-foreground" 
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="glass-card p-6 rounded-lg border border-white/10">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Appearance</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Theme</label>
                <select className="w-full px-4 py-2 bg-background/50 border border-white/10 rounded-lg text-foreground">
                  <option>Dark Mode</option>
                  <option>Light Mode</option>
                  <option>System</option>
                </select>
              </div>
              
              <ChristmasThemeToggle />
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="glass-card p-6 rounded-lg border border-white/10">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Privacy</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-foreground">Show online status</span>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-foreground">Allow friend requests</span>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </label>
            </div>
          </div>

          {/* Notifications */}
          <div className="glass-card p-6 rounded-lg border border-white/10">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Notifications</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-foreground">Email notifications</span>
                <input type="checkbox" className="w-5 h-5" defaultChecked />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-foreground">Push notifications</span>
                <input type="checkbox" className="w-5 h-5" />
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass-card p-6 rounded-lg border border-red-500/30 bg-red-500/5">
            <h2 className="text-2xl font-semibold mb-4 text-red-400">Danger Zone</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">Delete Account</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button 
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete My Account"}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Your profile and personal information</li>
                          <li>All games you've created</li>
                          <li>Game progress and favorites</li>
                          <li>Quest progress and achievements</li>
                          <li>Messages and friendships</li>
                          <li>All other account data</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-500 hover:bg-red-600"
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Yes, delete my account"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
