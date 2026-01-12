// Utilitário para gerenciar ID de sessão único por navegador
export const getSessionId = (): string => {
    // Verificar se já existe um sessionId no localStorage
    let sessionId = localStorage.getItem('arena-fc-session-id');

    if (!sessionId) {
        // Gerar um ID único baseado em timestamp + random
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('arena-fc-session-id', sessionId);
    }

    return sessionId;
};

// Função para resetar sessão (se necessário)
export const resetSession = (): string => {
    localStorage.removeItem('arena-fc-session-id');
    return getSessionId();
};