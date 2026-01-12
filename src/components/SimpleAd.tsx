import { useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const SimpleAd = () => {
  useEffect(() => {
    try {
      // Inicializar AdSense
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className="text-center my-4">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-6004139707069726"
        data-ad-slot="1234567890"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default SimpleAd;