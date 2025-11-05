import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
}

const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetchActiveAnnouncement();
  }, []);

  const fetchActiveAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.log("No active announcement found");
        return;
      }

      if (data) {
        setAnnouncement(data);
      }
    } catch (error) {
      console.error("Error fetching announcement:", error);
    }
  };

  if (!announcement || !isVisible) {
    return null;
  }

  const getTypeStyles = () => {
    switch (announcement.type) {
      case "warning":
        return "from-blue-400/15 via-primary/10 to-blue-400/15 border-blue-400/30";
      case "error":
        return "from-red-500/15 via-destructive/10 to-red-500/15 border-destructive/30";
      case "success":
        return "from-green-500/15 via-green-500/10 to-green-500/15 border-green-500/30";
      default:
        return "from-primary/15 via-accent/10 to-primary/15 border-primary/30";
    }
  };

  const getTypeIcon = () => {
    switch (announcement.type) {
      case "warning":
        return "⚠️";
      case "error":
        return "🚨";
      case "success":
        return "✅";
      default:
        return "📢";
    }
  };

  return (
    <div className={`bg-gradient-to-r ${getTypeStyles()} border-b-2 backdrop-blur-sm relative overflow-hidden`}>
      {/* Animated background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-float-delayed pointer-events-none" />
      
      <div className="container mx-auto px-4 py-4 relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center animate-bounce-slow">
              <span className="text-2xl">{getTypeIcon()}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/90 bg-clip-text">
                {announcement.title}
              </span>
              <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-primary/50" />
              <span className="text-base text-muted-foreground/90">
                {announcement.message}
              </span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsVisible(false)}
            className="hover:bg-primary/10 hover:text-primary transition-all duration-300 hover-scale rounded-full h-10 w-10 p-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
