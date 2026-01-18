import { useState, useEffect } from 'react';
import { getSessionId } from '../utils/sessionId';

export interface Player {
    id: string;
    name: string;
    rating: number; // 0 a 5
}

// Chaves para localStorage
const STORAGE_KEYS = {
    PLAYERS: 'sempanelafc_players'
};

export const usePlayers = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
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

    // Carregar jogadores do localStorage
    const loadPlayers = () => {
        setLoading(true);
        const localPlayers = loadFromLocalStorage();
        setPlayers(localPlayers);
        setLoading(false);
    };

    // Adicionar novo jogador
    const addPlayer = async (name: string, rating: number) => {
        const newPlayer: Player = {
            id: generateId(),
            name,
            rating
        };

        setPlayers(prev => {
            const updated = [...prev, newPlayer];
            saveToLocalStorage(updated);
            return updated;
        });

        return newPlayer;
    };

    // Atualizar jogador
    const updatePlayer = async (id: string, name: string, rating: number) => {
        const updatedPlayer: Player = { id, name, rating };

        setPlayers(prev => {
            const updated = prev.map(p => p.id === id ? updatedPlayer : p);
            saveToLocalStorage(updated);
            return updated;
        });

        return updatedPlayer;
    };

    // Remover jogador
    const removePlayer = async (id: string) => {
        setPlayers(prev => {
            const updated = prev.filter(p => p.id !== id);
            saveToLocalStorage(updated);
            return updated;
        });
    };

    // Carregar dados na inicialização
    useEffect(() => {
        loadPlayers();
    }, [sessionId]);

    return {
        players,
        loading,
        error: null, // Sem erros de conexão
        isOffline: false, // Sempre "online" (localStorage)
        addPlayer,
        updatePlayer,
        removePlayer,
        refetch: loadPlayers,
        syncWithBackend: () => { }, // Função vazia para compatibilidade
        sessionId
    };
};