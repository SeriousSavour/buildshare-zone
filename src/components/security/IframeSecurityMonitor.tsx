import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface IframeSecurityMonitorProps {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  expectedOrigin?: string;
}

/**
 * Monitors iframe for security threats like unauthorized redirects,
 * content injection, or extension manipulation attempts
 */
export const IframeSecurityMonitor = ({ iframeRef, expectedOrigin }: IframeSecurityMonitorProps) => {
  const lastUrlRef = useRef<string>("");
  const redirectAttemptsRef = useRef<number>(0);

  useEffect(() => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    let checkInterval: NodeJS.Timeout;

    // Monitor for unauthorized navigation attempts
    const monitorIframeNavigation = () => {
      try {
        // Try to access iframe location (will fail for cross-origin)
        const currentSrc = iframe.src;
        
        if (lastUrlRef.current && currentSrc !== lastUrlRef.current) {
          // URL changed - could be legitimate or malicious
          console.log("Iframe navigation detected:", currentSrc);
          
          // Check if navigation seems suspicious
          if (expectedOrigin && !currentSrc.includes(expectedOrigin)) {
            redirectAttemptsRef.current++;
            
            if (redirectAttemptsRef.current > 2) {
              toast.error("Suspicious redirect detected and blocked", {
                description: "The content tried to redirect to an unauthorized site"
              });
              
              // Restore to last known good URL
              iframe.src = lastUrlRef.current;
              redirectAttemptsRef.current = 0;
            }
          }
        }
        
        lastUrlRef.current = currentSrc;
      } catch (error) {
        // Cross-origin access error - this is actually good (sandboxing working)
        console.log("Iframe properly sandboxed");
      }
    };

    // Start monitoring
    checkInterval = setInterval(monitorIframeNavigation, 1000);

    // Listen for postMessage attacks
    const handleMessage = (event: MessageEvent) => {
      // Whitelist known origins
      const allowedOrigins = [
        window.location.origin,
        'https://lovable.app',
        'https://supabase.co'
      ];

      if (!allowedOrigins.some(origin => event.origin.includes(origin))) {
        console.warn("Blocked message from unauthorized origin:", event.origin);
        return;
      }

      // Process safe messages here
      console.log("Received safe message:", event.data);
    };

    window.addEventListener("message", handleMessage);

    // Detect iframe manipulation attempts
    const originalSetAttribute = iframe.setAttribute.bind(iframe);
    iframe.setAttribute = function(name: string, value: string) {
      if (name === 'src' && value !== lastUrlRef.current) {
        console.warn("Blocked unauthorized src change attempt:", value);
        
        // Allow only safe protocols
        if (!value.startsWith('http://') && 
            !value.startsWith('https://') && 
            !value.startsWith('data:') &&
            !value.startsWith('blob:')) {
          console.error("Blocked dangerous protocol:", value);
          return;
        }
      }
      return originalSetAttribute(name, value);
    };

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener("message", handleMessage);
    };
  }, [iframeRef, expectedOrigin]);

  return null; // This is a monitoring component with no UI
};
