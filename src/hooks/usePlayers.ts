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

export const usePlayers = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sessionId] = useState(() => getSessionId()); // ID único por navegador

    // Buscar jogadores da sessão atual
    const fetchPlayers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/players`, {
                params: { sessionId }
            });
            setPlayers(response.data);
            setError(null);
        } catch (err) {
            setError('Erro ao carregar jogadores');
            console.error('Erro ao buscar jogadores:', err);
        } finally {
            setLoading(false);
        }
    };

    // Adicionar novo jogador à sessão atual
    const addPlayer = async (name: string, rating: number) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/players`, {
                name,
                rating,
                sessionId
            });
            setPlayers(prev => [...prev, response.data]);
            return response.data;
        } catch (err) {
            setError('Erro ao adicionar jogador');
            console.error('Erro ao adicionar jogador:', err);
            throw err;
        }
    };

    // Atualizar jogador da sessão atual
    const updatePlayer = async (id: string, name: string, rating: number) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/players/${id}`, {
                name,
                rating,
                sessionId
            });
            setPlayers(prev => prev.map(p => p.id === id ? response.data : p));
            return response.data;
        } catch (err) {
            setError('Erro ao atualizar jogador');
            console.error('Erro ao atualizar jogador:', err);
            throw err;
        }
    };

    // Remover jogador da sessão atual
    const removePlayer = async (id: string) => {
        try {
            await axios.delete(`${API_BASE_URL}/players/${id}`, {
                params: { sessionId }
            });
            setPlayers(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            setError('Erro ao remover jogador');
            console.error('Erro ao remover jogador:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchPlayers();
    }, [sessionId]);

    return {
        players,
        loading,
        error,
        addPlayer,
        updatePlayer,
        removePlayer,
        refetch: fetchPlayers,
        sessionId // Expor sessionId para debug se necessário
    };
};