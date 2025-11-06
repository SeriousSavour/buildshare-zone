import { useEffect, useState } from "react";
import { Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const SecurityStatus = () => {
  const [swActive, setSwActive] = useState(false);
  const [blockedAttempts, setBlockedAttempts] = useState(0);

  useEffect(() => {
    // Check if Service Worker is active
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setSwActive(true);
      });

      // Listen for blocked redirects
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'REDIRECT_BLOCKED') {
          setBlockedAttempts(prev => prev + 1);
          toast.error('Security Alert', {
            description: `Blocked unauthorized redirect to: ${new URL(event.data.blockedUrl).hostname}`,
            icon: <Shield className="h-4 w-4" />,
          });
        }
      });
    }

    // Check for extension detection
    const checkExtensions = setInterval(() => {
      if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ || 
          (window as any).chrome?.webRequest) {
        console.warn('🛡️ Browser extension with elevated permissions detected');
      }
    }, 5000);

    return () => clearInterval(checkExtensions);
  }, []);

  if (!swActive && blockedAttempts === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-green-500/10 border border-green-500/30 rounded-lg p-3 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        {swActive ? (
          <Shield className="h-4 w-4 text-green-400" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
        )}
        <div className="text-xs">
          <div className="font-medium text-green-400">
            Security: {swActive ? 'Active' : 'Partial'}
          </div>
          {blockedAttempts > 0 && (
            <div className="text-green-300/70">
              {blockedAttempts} threat{blockedAttempts > 1 ? 's' : ''} blocked
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
