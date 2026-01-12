// Configurações do Google AdSense
export const ADSENSE_CONFIG = {
    // Substitua pelo seu Publisher ID do Google AdSense
    // Formato: ca-pub-XXXXXXXXXXXXXXXXX
    PUBLISHER_ID: 'ca-pub-XXXXXXXXXXXXXXXXX',

    // IDs dos slots de anúncio (você receberá estes do Google AdSense)
    AD_SLOTS: {
        HEADER_BANNER: '1234567890',      // Banner superior
        LEFT_SIDEBAR: '2345678901',       // Sidebar esquerda
        RIGHT_SIDEBAR: '3456789012',      // Sidebar direita
        CONTENT_RECTANGLE: '4567890123',  // Retângulo no meio do conteúdo
        FOOTER_BANNER: '5678901234',      // Banner inferior
    },

    // Configurações de desenvolvimento
    DEVELOPMENT: {
        SHOW_PLACEHOLDERS: true,  // Mostrar placeholders em desenvolvimento
        LOAD_SCRIPTS: false,      // Não carregar scripts do AdSense em desenvolvimento
    }
};

// Função para verificar se está em produção
export const isProduction = () => import.meta.env.PROD;

// Função para obter a URL do script do AdSense
export const getAdSenseScriptUrl = () =>
    `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.PUBLISHER_ID}`;