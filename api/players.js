// Banco de dados em memória simples
let players = [];

// Função para gerar UUID simples
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Função para validar rating
function isValidRating(rating) {
  return typeof rating === 'number' && 
         rating >= 0 && 
         rating <= 5 && 
         (rating * 2) % 1 === 0;
}

module.exports = function handler(req, res) {
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
      const sortedPlayers = [...players].sort((a, b) => a.name.localeCompare(b.name));
      res.status(200).json(sortedPlayers);
      
    } else if (req.method === 'POST') {
      // Criar novo jogador
      const { name, rating } = req.body || {};
      
      if (!name || rating === undefined || !isValidRating(rating)) {
        return res.status(400).json({ 
          error: 'Nome é obrigatório e nota deve ser um número entre 0 e 5 com incrementos de 0.5' 
        });
      }

      const newPlayer = {
        id: generateId(),
        name: name.trim(),
        rating: rating,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      players.push(newPlayer);
      res.status(201).json(newPlayer);
      
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
};