import { playerOperations } from '../../backend/database-simple.js';

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

  const { id } = req.query;

  try {
    if (req.method === 'PUT') {
      // Atualizar jogador
      const { name, rating } = req.body;
      
      if (!name || rating === undefined || !isValidRating(rating)) {
        return res.status(400).json({ 
          error: 'Nome é obrigatório e nota deve ser um número entre 0 e 5 com incrementos de 0.5' 
        });
      }

      const updatedPlayer = playerOperations.update(id, name.trim(), rating);
      if (updatedPlayer) {
        res.status(200).json(updatedPlayer);
      } else {
        res.status(404).json({ error: 'Jogador não encontrado' });
      }
      
    } else if (req.method === 'DELETE') {
      // Remover jogador
      const deletedPlayer = playerOperations.delete(id);
      if (deletedPlayer) {
        res.status(200).json({ message: 'Jogador removido com sucesso', player: deletedPlayer });
      } else {
        res.status(404).json({ error: 'Jogador não encontrado' });
      }
      
    } else {
      res.status(405).json({ error: 'Método não permitido' });
    }
    
  } catch (error) {
    console.error('Erro na API:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
}