import BrowserFrame from "@/components/browser/BrowserFrame";
import QuickLinks from "@/components/browser/QuickLinks";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Index = () => {
  const { data: settings } = useSiteSettings();

  return (
    <BrowserFrame 
      currentUrl="shadow://home" 
      showTabs={true}
      customBackground={settings?.login_background}
    >
      <div className="w-full max-w-4xl">
        <QuickLinks />
      </div>
    </BrowserFrame>
  );
};

export default Index;
