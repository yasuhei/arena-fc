const CACHE_NAME = 'sem-panela-fc-v2.1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sem-panela-fc-icon.png',
  '/icon.svg'
];

console.log('🔧 Service Worker: Iniciando v2.1.0...');

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Instalando v2.1.0...');
  // FORÇAR ATIVAÇÃO IMEDIATA
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('❌ Service Worker: Erro ao cachear:', error);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('🔧 Service Worker: Ativando v2.1.0...');
  // TOMAR CONTROLE IMEDIATO
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      ).then(() => {
        // Notificar todos os clientes para recarregar
        return self.clients.claim().then(() => {
          return self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({ type: 'RELOAD_PAGE' });
            });
          });
        });
      });
    })
  );
});

// Escutar mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Interceptar requisições - ESTRATÉGIA NETWORK FIRST para arquivos JS/CSS
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Para arquivos JS/CSS/HTML, sempre buscar na rede primeiro
  if (url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css') || 
      url.pathname.endsWith('.html') ||
      url.pathname === '/') {
    
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Se conseguiu buscar na rede, atualizar cache
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Se falhou na rede, usar cache como fallback
          return caches.match(event.request).then((response) => {
            if (response) {
              return response;
            }
            // Se não tem nem cache, retornar página principal
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
        })
    );
  } else {
    // Para outros arquivos (imagens, etc), usar cache first
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
        .catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        })
    );
  }
});