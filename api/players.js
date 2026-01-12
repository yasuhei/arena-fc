import { playerOperations } from '../backend/database-simple.js';

// Função para validar rating
const isValidRating = (rating) => {
  return typeof rating === 'number' && 
         rating >= 0 && 
         rating <= 5 && 
         (rating * 2) % 1 === 0;
};

export default function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Listar todos os jogadores
      const players = playerOperations.getAll();
      res.status(200).json(players);
      
    } else if (req.method === 'POST') {
      // Criar novo jogador
      const { name, rating } = req.body;
      
      if (!name || rating === undefined || !isValidRating(rating)) {
        return res.status(400).json({ 
          error: 'Nome é obrigatório e nota deve ser um número entre 0 e 5 com incrementos de 0.5' 
        });
      }

      const newPlayer = playerOperations.create(name.trim(), rating);
      if (newPlayer) {
        res.status(201).json(newPlayer);
      } else {
        res.status(500).json({ error: 'Erro ao criar jogador' });
      }
      
    } else {
      res.status(405).json({ error: 'Método não permitido' });
    }
    
  } catch (error) {
    console.error('Erro na API:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
}