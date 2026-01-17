import { useState, useEffect } from 'react';
import axios from 'axios';
import { getSessionId } from '../utils/sessionId';

export interface Player {
    id: string;
    name: string;
    rating: number; // 0 a 5
}

// Detectar se está em produção pela URL
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

const API_BASE_URL = isProduction
    ? 'https://backend-arena-fc.vercel.app/api' // Backend na Vercel
    : 'http://localhost:3001/api'; // Desenvolvimento local

// Chaves para localStorage
const STORAGE_KEYS = {
    PLAYERS: 'sempanelafc_players',
    LAST_SYNC: 'sempanelafc_last_sync',
    OFFLINE_MODE: 'sempanelafc_offline_mode'
};

export const usePlayers = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const [sessionId] = useState(() => getSessionId()); // ID único por navegador

    // Salvar no localStorage
    const saveToLocalStorage = (playersData: Player[]) => {
        try {
            localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify({
                sessionId,
                players: playersData,
                timestamp: Date.now()
            }));
        } catch (err) {
            console.error('Erro ao salvar no localStorage:', err);
        }
    };

    // Carregar do localStorage
    const loadFromLocalStorage = (): Player[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.PLAYERS);
            if (stored) {
                const data = JSON.parse(stored);
                // Verificar se é da mesma sessão
                if (data.sessionId === sessionId && data.players) {
                    return data.players;
                }
            }
        } catch (err) {
            console.error('Erro ao carregar do localStorage:', err);
        }
        return [];
    };

    // Gerar ID único para novos jogadores
    const generateId = () => {
        return `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    };

    // Buscar jogadores (com fallback para localStorage)
    const fetchPlayers = async () => {
        try {
            setLoading(true);

            // Tentar carregar do backend primeiro
            const response = await axios.get(`${API_BASE_URL}/players`, {
                params: { sessionId },
                timeout: 10000 // 10 segundos timeout
            });

            const backendPlayers = response.data;
            setPlayers(backendPlayers);
            setError(null);
            setIsOffline(false);

            // Salvar no localStorage como backup
            saveToLocalStorage(backendPlayers);

        } catch (err) {
            console.error('Erro ao buscar jogadores do backend:', err);

            // Fallback: carregar do localStorage
            const localPlayers = loadFromLocalStorage();
            setPlayers(localPlayers);
            setIsOffline(true);

            if (localPlayers.length > 0) {
                setError('Modo offline - usando dados salvos localmente');
            } else {
                setError('Sem conexão com servidor. Dados serão salvos localmente.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Adicionar novo jogador (com fallback)
    const addPlayer = async (name: string, rating: number) => {
        const newPlayer: Player = {
            id: generateId(),
            name,
            rating
        };

        try {
            // Tentar salvar no backend
            const response = await axios.post(`${API_BASE_URL}/players`, {
                name,
                rating,
                sessionId
            }, { timeout: 5000 });

            const serverPlayer = response.data;
            setPlayers(prev => {
                const updated = [...prev, serverPlayer];
                saveToLocalStorage(updated);
                return updated;
            });
            setError(null);
            setIsOffline(false);
            return serverPlayer;

        } catch (err) {
            console.error('Erro ao adicionar no backend, salvando localmente:', err);

            // Fallback: salvar apenas localmente
            setPlayers(prev => {
                const updated = [...prev, newPlayer];
                saveToLocalStorage(updated);
                return updated;
            });
            setIsOffline(true);
            setError('Modo offline - jogador salvo localmente');
            return newPlayer;
        }
    };

    // Atualizar jogador (com fallback)
    const updatePlayer = async (id: string, name: string, rating: number) => {
        const updatedPlayer: Player = { id, name, rating };

        try {
            // Tentar atualizar no backend
            const response = await axios.put(`${API_BASE_URL}/players/${id}`, {
                name,
                rating,
                sessionId
            }, { timeout: 5000 });

            const serverPlayer = response.data;
            setPlayers(prev => {
                const updated = prev.map(p => p.id === id ? serverPlayer : p);
                saveToLocalStorage(updated);
                return updated;
            });
            setError(null);
            setIsOffline(false);
            return serverPlayer;

        } catch (err) {
            console.error('Erro ao atualizar no backend, salvando localmente:', err);

            // Fallback: atualizar apenas localmente
            setPlayers(prev => {
                const updated = prev.map(p => p.id === id ? updatedPlayer : p);
                saveToLocalStorage(updated);
                return updated;
            });
            setIsOffline(true);
            setError('Modo offline - alteração salva localmente');
            return updatedPlayer;
        }
    };

    // Remover jogador (com fallback)
    const removePlayer = async (id: string) => {
        try {
            // Tentar remover do backend
            await axios.delete(`${API_BASE_URL}/players/${id}`, {
                params: { sessionId },
                timeout: 5000
            });

            setPlayers(prev => {
                const updated = prev.filter(p => p.id !== id);
                saveToLocalStorage(updated);
                return updated;
            });
            setError(null);
            setIsOffline(false);

        } catch (err) {
            console.error('Erro ao remover do backend, removendo localmente:', err);

            // Fallback: remover apenas localmente
            setPlayers(prev => {
                const updated = prev.filter(p => p.id !== id);
                saveToLocalStorage(updated);
                return updated;
            });
            setIsOffline(true);
            setError('Modo offline - jogador removido localmente');
        }
    };

    // Tentar sincronizar dados locais com o backend
    const syncWithBackend = async () => {
        if (!isOffline) return;

        try {
            setLoading(true);

            // Tentar reconectar
            await axios.get(`${API_BASE_URL}/players`, {
                params: { sessionId },
                timeout: 10000
            });

            // Se conseguiu conectar, recarregar dados
            await fetchPlayers();
            setError('Reconectado com sucesso!');

            // Limpar mensagem após 3 segundos
            setTimeout(() => {
                if (!isOffline) setError(null);
            }, 3000);

        } catch (err) {
            console.error('Ainda sem conexão:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlayers();
    }, [sessionId]);

    // Tentar reconectar a cada 30 segundos se estiver offline
    useEffect(() => {
        if (!isOffline) return;

        const interval = setInterval(() => {
            syncWithBackend();
        }, 30000); // 30 segundos

        return () => clearInterval(interval);
    }, [isOffline]);

    return {
        players,
        loading,
        error,
        isOffline,
        addPlayer,
        updatePlayer,
        removePlayer,
        refetch: fetchPlayers,
        syncWithBackend,
        sessionId // Expor sessionId para debug se necessário
    };
};