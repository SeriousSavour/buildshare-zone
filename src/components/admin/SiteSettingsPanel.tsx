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
    discord_invite: ""
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");

      if (error) throw error;

      const settingsObj: any = {};
      data?.forEach((setting) => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });

      setSettings({
        login_background: settingsObj.login_background || "",
        site_name: settingsObj.site_name || "",
        discord_invite: settingsObj.discord_invite || ""
      });
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
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

      // Set session context
      await supabase.rpc("set_session_context", { _session_token: sessionToken });

      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from("site_settings")
          .update({ setting_value: value, updated_at: new Date().toISOString() })
          .eq("setting_key", key);

        if (error) throw error;
      }

      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
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
          <label className="text-sm font-medium">Discord Invite</label>
          <Input
            value={settings.discord_invite}
            onChange={(e) => setSettings({ ...settings, discord_invite: e.target.value })}
            placeholder="discord.gg/goshadow"
          />
          <p className="text-xs text-muted-foreground">
            Discord invite link shown on login/register
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
