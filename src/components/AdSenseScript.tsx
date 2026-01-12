import { useEffect } from 'react';
import { isProduction, getAdSenseScriptUrl } from '../config/adsense';

const AdSenseScript = () => {
  useEffect(() => {
    // Carrega em produção
    if (isProduction()) {
      const script = document.createElement('script');
      script.src = getAdSenseScriptUrl();
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);

      return () => {
        // Cleanup se necessário
        const existingScript = document.querySelector('script[src*="adsbygoogle"]');
        if (existingScript) {
          document.head.removeChild(existingScript);
        }
      };
    }
  }, []);

  return null;
};

export default AdSenseScript;