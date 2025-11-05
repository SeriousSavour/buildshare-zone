import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SiteSetting {
  setting_key: string;
  setting_value: string;
  setting_type: string;
}

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");
      
      if (error) throw error;
      
      // Convert to object for easy access
      const settingsObj: Record<string, string> = {};
      data?.forEach((setting: SiteSetting) => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });
      
      return settingsObj;
    },
  });
};
