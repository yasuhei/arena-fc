import { useEffect } from 'react';
import { ADSENSE_CONFIG, isProduction, getAdSenseScriptUrl } from '../config/adsense';

const AdSenseScript = () => {
  useEffect(() => {
    // Só carrega em produção e se configurado para carregar
    if (isProduction() && !ADSENSE_CONFIG.DEVELOPMENT.LOAD_SCRIPTS) {
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