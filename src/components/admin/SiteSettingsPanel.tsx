import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ChristmasThemeToggle } from "@/components/theme/ChristmasThemeToggle";

const SiteSettingsPanel = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    login_background: "",
    site_name: "",
    site_tagline: "",
    quote_of_the_day: ""
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");

      console.log("Site settings data:", data);
      console.log("Site settings error:", error);

      if (error) {
        console.error("Error loading settings:", error);
        toast.error(`Failed to load settings: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        toast.error("No settings found in database");
        return;
      }

      const settingsObj: any = {};
      data.forEach((setting) => {
        settingsObj[setting.setting_key] = setting.setting_value || "";
      });

      console.log("Processed settings:", settingsObj);

      setSettings({
        login_background: settingsObj.login_background || "",
        site_name: settingsObj.site_name || "",
        site_tagline: settingsObj.site_tagline || "",
        quote_of_the_day: settingsObj.quote_of_the_day || ""
      });
      
      toast.success("Settings loaded successfully");
    } catch (error: any) {
      console.error("Error loading settings:", error);
      toast.error(`Failed to load settings: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const sessionToken = localStorage.getItem("session_token");
      if (!sessionToken) {
        toast.error("Not authenticated");
        return;
      }

      console.log("Saving settings:", settings);

      // Update each setting
      const updates = Object.entries(settings).map(([key, value]) => {
        return supabase
          .from("site_settings")
          .update({ 
            setting_value: value, 
            updated_at: new Date().toISOString() 
          })
          .eq("setting_key", key);
      });

      const results = await Promise.all(updates);
      
      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error("Errors saving settings:", errors);
        toast.error("Some settings failed to save");
        return;
      }

      console.log("Settings saved successfully");
      toast.success("Settings saved successfully!");
      
      // Reload to confirm
      await loadSettings();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(`Failed to save settings: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Settings</CardTitle>
        <CardDescription>
          Customize the appearance and branding of your site
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Site Name</label>
          <Input
            value={settings.site_name}
            onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
            placeholder="shadow"
          />
          <p className="text-xs text-muted-foreground">
            Displayed on login/register pages
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Site Tagline</label>
          <Input
            value={settings.site_tagline}
            onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
            placeholder="Your Gateway to Endless Possibilities"
          />
          <p className="text-xs text-muted-foreground">
            Cool tagline displayed below site name
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Quotes (Rotating)</label>
          <Textarea
            value={settings.quote_of_the_day}
            onChange={(e) => setSettings({ ...settings, quote_of_the_day: e.target.value })}
            placeholder="The only way to do great work is to love what you do. - Steve Jobs&#10;Innovation distinguishes between a leader and a follower. - Steve Jobs&#10;Stay hungry, stay foolish. - Steve Jobs"
            rows={6}
          />
          <p className="text-xs text-muted-foreground">
            Add multiple inspirational quotes (one per line). A random quote will be displayed on each page load.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Login Background (CSS)</label>
          <Textarea
            value={settings.login_background}
            onChange={(e) => setSettings({ ...settings, login_background: e.target.value })}
            placeholder="radial-gradient(ellipse at center, hsl(220 70% 10%) 0%, hsl(220 70% 5%) 50%, hsl(220 70% 2%) 100%)"
            className="font-mono text-xs"
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            CSS background property (gradients, colors, images)
          </p>
        </div>

        <div className="pt-4">
          <ChristmasThemeToggle />
        </div>

        <Button
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SiteSettingsPanel;
