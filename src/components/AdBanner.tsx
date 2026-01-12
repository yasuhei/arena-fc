import React, { useEffect } from 'react';
import { ADSENSE_CONFIG, isProduction } from '../config/adsense';

interface AdBannerProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AdBanner: React.FC<AdBannerProps> = ({ 
  adSlot, 
  adFormat = 'auto', 
  style = {},
  className = ''
}) => {
  useEffect(() => {
    try {
      if (isProduction() && window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  // Mostrar placeholders em desenvolvimento
  if (!isProduction() && ADSENSE_CONFIG.DEVELOPMENT.SHOW_PLACEHOLDERS) {
    return (
      <div 
        className={`bg-gray-200 border-2 border-dashed border-gray-400 p-4 text-center text-gray-600 ${className}`}
        style={{ minHeight: '100px', ...style }}
      >
        <p>📢 Anúncio AdSense</p>
        <p className="text-sm">Slot: {adSlot}</p>
        <p className="text-xs">Formato: {adFormat}</p>
      </div>
    );
  }

  // Em produção, renderizar o anúncio real
  return (
    <div className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CONFIG.PUBLISHER_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdBanner;