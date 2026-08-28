import { useEffect, useState } from 'react';
import { getSessionId } from '../utils/sessionId';

export type PlayerPosition = 'ZAG' | 'MEI' | 'ATA';

export interface Player {
    id: string;
    name: string;
    rating: number;
    habilidade: number;
    posicao: PlayerPosition;
    isKeyPlayer: boolean;
}

const STORAGE_KEYS = {
    PLAYERS: 'sempanelafc_players'
};

export const usePlayers = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [sessionId] = useState(() => getSessionId());

    const saveToLocalStorage = (playersData: Player[]) => {
        try {
            localStorage.setItem(
                STORAGE_KEYS.PLAYERS,
                JSON.stringify({
                    sessionId,
                    players: playersData,
                    timestamp: Date.now()
                })
            );
        } catch (err) {
            console.error('Erro ao salvar no localStorage:', err);
        }
    };

    const loadFromLocalStorage = (): Player[] => {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.PLAYERS);

            if (stored) {
                const data = JSON.parse(stored);

                if (data.sessionId === sessionId && data.players) {
                    return data.players.map((p: any) => ({
                        ...p,

                        // Compatibilidade com jogadores antigos
                        isKeyPlayer: p.isKeyPlayer ?? false,
                        habilidade: p.habilidade ?? p.rating ?? 0,
                        posicao: p.posicao ?? 'MEI'
                    }));
                }
            }
        } catch (err) {
            console.error('Erro ao carregar no localStorage:', err);
        }

        return [];
    };

    const generateId = () => {
        return `player_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 11)}`;
    };

    const loadPlayers = () => {
        setLoading(true);

        const localPlayers = loadFromLocalStorage();

        setPlayers(localPlayers);

        setLoading(false);
    };

    const addPlayer = async (
        name: string,
        rating: number,
        habilidade: number,
        posicao: PlayerPosition,
        isKeyPlayer: boolean = false
    ) => {

        const newPlayer: Player = {
            id: generateId(),
            name,
            rating,
            habilidade,
            posicao,
            isKeyPlayer
        };

        setPlayers(prev => {
            const updated = [...prev, newPlayer];

            saveToLocalStorage(updated);

            return updated;
        });

        return newPlayer;
    };

    const updatePlayer = async (
        id: string,
        name: string,
        rating: number,
        habilidade: number,
        posicao: PlayerPosition,
        isKeyPlayer: boolean = false
    ) => {

        const updatedPlayer: Player = {
            id,
            name,
            rating,
            habilidade,
            posicao,
            isKeyPlayer
        };

        setPlayers(prev => {
            const updated = prev.map(p =>
                p.id === id ? updatedPlayer : p
            );

            saveToLocalStorage(updated);

            return updated;
        });

        return updatedPlayer;
    };

    const removePlayer = async (id: string) => {
        setPlayers(prev => {
            const updated = prev.filter(p => p.id !== id);

            saveToLocalStorage(updated);

            return updated;
        });
    };

    useEffect(() => {
        loadPlayers();
    }, [sessionId]);

    return {
        players,
        loading,
        error: null,
        isOffline: false,
        addPlayer,
        updatePlayer,
        removePlayer,
        refetch: loadPlayers,
        syncWithBackend: () => { },
        sessionId
    };
};