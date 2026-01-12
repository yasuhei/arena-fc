// Banco de dados em memória simples (sem imports externos)
let players = [];

export default function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Calcular estatísticas
      const total = players.length;
      const byRating = { 5: 0, 4.5: 0, 4: 0, 3.5: 0, 3: 0, 2.5: 0, 2: 0, 1.5: 0, 1: 0, 0.5: 0, 0: 0 };
      
      let totalRating = 0;
      players.forEach(player => {
        byRating[player.rating] = (byRating[player.rating] || 0) + 1;
        totalRating += player.rating;
      });

      const averageRating = total > 0 ? Math.round((totalRating / total) * 100) / 100 : 0;
      
      const stats = { 
        total, 
        byRating,
        averageRating
      };

      res.status(200).json(stats);
    } else {
      res.status(405).json({ error: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message,
      stack: error.stack 
    });
  }
}