// Banco de dados em memória simples (sem imports externos)
let players = [];

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
      const { name, rating } = req.body || {};
      
      if (!name || rating === undefined || !isValidRating(rating)) {
        return res.status(400).json({ 
          error: 'Nome é obrigatório e nota deve ser um número entre 0 e 5 com incrementos de 0.5' 
        });
      }

      const playerIndex = players.findIndex(p => p.id === id);
      if (playerIndex === -1) {
        return res.status(404).json({ error: 'Jogador não encontrado' });
      }

      players[playerIndex] = {
        ...players[playerIndex],
        name: name.trim(),
        rating: rating,
        updated_at: new Date().toISOString()
      };

      res.status(200).json(players[playerIndex]);
      
    } else if (req.method === 'DELETE') {
      // Remover jogador
      const playerIndex = players.findIndex(p => p.id === id);
      if (playerIndex === -1) {
        return res.status(404).json({ error: 'Jogador não encontrado' });
      }

      const deletedPlayer = players.splice(playerIndex, 1)[0];
      res.status(200).json({ message: 'Jogador removido com sucesso', player: deletedPlayer });
      
    } else {
      res.status(405).json({ error: 'Método não permitido' });
    }
    
  } catch (error) {
    console.error('Erro na API:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message,
      stack: error.stack 
    });
  }
}