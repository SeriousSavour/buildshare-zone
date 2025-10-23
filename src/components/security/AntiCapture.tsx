import { useEffect } from 'react';

const AntiCapture = () => {
  useEffect(() => {
    // Block Chrome extension capture APIs
    const blockCaptureAPIs = () => {
      try {
        // Check if chrome API exists and block capture functions
        if (typeof window !== 'undefined' && (window as any).chrome) {
          const chromeObj = (window as any).chrome;
          // Block tabCapture API
          if (chromeObj.tabCapture) {
            Object.defineProperty(chromeObj, 'tabCapture', {
              get: () => {
                console.warn('⚠️ Unauthorized tab capture attempt blocked');
                return undefined;
              },
              configurable: false
            });
          }

          // Block desktopCapture API
          if (chromeObj.desktopCapture) {
            Object.defineProperty(chromeObj, 'desktopCapture', {
              get: () => {
                console.warn('⚠️ Unauthorized desktop capture attempt blocked');
                return undefined;
              },
              configurable: false
            });
          }
        }

        // Block getDisplayMedia (used by screen recording)
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
          
          navigator.mediaDevices.getDisplayMedia = function() {
            console.warn('⚠️ Screen capture attempt blocked');
            return Promise.reject(new DOMException('Screen capture is disabled on this site', 'NotAllowedError'));
          };
        }

        // Detect if extensions are injecting scripts
        const meta = document.createElement('meta');
        meta.name = 'capture-disabled';
        meta.content = 'true';
        document.head.appendChild(meta);

      } catch (error) {
        console.error('Error setting up capture protection:', error);
      }
    };

    blockCaptureAPIs();

    // Also block on visibility change (in case extension tries to re-enable)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        blockCaptureAPIs();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
};

export default AntiCapture;
