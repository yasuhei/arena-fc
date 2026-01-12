import { useState } from 'react';
import { usePlayers, Player } from './hooks/usePlayers';
import { PlayerManager } from './components/PlayerManager';
import AdBanner from './components/AdBanner';
import AdSenseScript from './components/AdSenseScript';
import SessionInfo from './components/SessionInfo';
import { ADSENSE_CONFIG } from './config/adsense';

// Função para renderizar estrelas com meio ponto
const renderStars = (rating: number, size: string = 'text-lg') => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  // Estrelas cheias
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span key={`full-${i}`} className={`${size} text-yellow-500`}>⭐</span>
    );
  }
  
  // Meia estrela (representada visualmente como estrela cheia, mas com valor decimal)
  if (hasHalfStar) {
    stars.push(
      <span key="half" className={`${size} text-yellow-400`}>⭐</span>
    );
  }
  
  // Estrelas vazias
  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <span key={`empty-${i}`} className={`${size} text-gray-300`}>⭐</span>
    );
  }
  
  return stars;
};

function createBalancedTeams(selected: Set<string>, players: Player[]): Player[][] {
  const available = players.filter(p => selected.has(p.id));
  const total = available.length;
  if (total < 6) return [];

  let teamSize = 6;
  let numTeams = 2;

  // Lógica baseada no total de jogadores
  if (total === 12) {
    numTeams = 2;
    teamSize = 6;
  } else if (total >= 13 && total <= 14) {
    numTeams = 3;
    teamSize = 6;
  } else if (total === 15) {
    numTeams = 3;
    teamSize = 5;
  } else if (total > 15) {
    numTeams = 3;
    teamSize = Math.ceil(total / 3);
  } else if (total >= 6 && total <= 11) {
    numTeams = 2;
    teamSize = Math.ceil(total / 2);
  }

  const teams: Player[][] = Array.from({ length: numTeams }, () => []);

  // Ordenar jogadores por nota (do maior para o menor)
  const sortedPlayers = [...available].sort((a, b) => b.rating - a.rating);

  // Distribuir jogadores de forma balanceada
  // Algoritmo: sempre adicionar ao time com menor soma de notas
  for (const player of sortedPlayers) {
    // Calcular soma das notas de cada time
    const teamSums = teams.map(team => 
      team.reduce((sum, p) => sum + p.rating, 0)
    );
    
    // Encontrar o time com menor soma que ainda tem espaço
    let targetTeamIndex = -1;
    let minSum = Infinity;
    
    for (let i = 0; i < numTeams; i++) {
      if (teams[i].length < teamSize && teamSums[i] < minSum) {
        minSum = teamSums[i];
        targetTeamIndex = i;
      }
    }
    
    // Se todos os times estão cheios, adicionar ao primeiro disponível
    if (targetTeamIndex === -1) {
      for (let i = 0; i < numTeams; i++) {
        if (teams[i].length < teamSize) {
          targetTeamIndex = i;
          break;
        }
      }
    }
    
    if (targetTeamIndex !== -1) {
      teams[targetTeamIndex].push(player);
    }
  }

  return teams.filter(team => team.length > 0);
}

function App() {
  const { players, loading, error, addPlayer, updatePlayer, removePlayer } = usePlayers();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [teams, setTeams] = useState<Player[][][]>([]);
  const [selectedExample, setSelectedExample] = useState<number | null>(null);
  const [customGames, setCustomGames] = useState<{[key: number]: Array<{team1: number, team2: number, score1: number, score2: number, confirmed: boolean}>}>({});
  const [showManager, setShowManager] = useState(false);

  const handleCheck = (playerId: string, checked: boolean) => {
    const newSelected = new Set(selected);
    if (checked) newSelected.add(playerId);
    else newSelected.delete(playerId);
    setSelected(newSelected);
  };

  const createTeams = () => {
    const examples: Player[][][] = [];
    for (let i = 0; i < 3; i++) {
      const teamExample = createBalancedTeams(selected, players);
      examples.push(teamExample);
    }
    setTeams(examples);
    setSelectedExample(null);
    setCustomGames({});
  };

  const addCustomGame = (exampleIdx: number) => {
    setCustomGames(prev => ({
      ...prev,
      [exampleIdx]: [...(prev[exampleIdx] || []), { team1: 0, team2: 1, score1: 0, score2: 0, confirmed: false }]
    }));
  };

  const updateCustomGame = (exampleIdx: number, gameIdx: number, field: string, value: number) => {
    setCustomGames(prev => ({
      ...prev,
      [exampleIdx]: prev[exampleIdx].map((game, idx) => 
        idx === gameIdx ? { ...game, [field]: value } : game
      )
    }));
  };

  const confirmGame = (exampleIdx: number, gameIdx: number) => {
    setCustomGames(prev => ({
      ...prev,
      [exampleIdx]: prev[exampleIdx].map((game, idx) => 
        idx === gameIdx ? { ...game, confirmed: true } : game
      )
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-500 to-green-700 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Carregando jogadores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-500 to-red-700 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-2xl font-bold mb-4">Erro ao conectar com o servidor</div>
          <div className="text-lg">{error}</div>
          <div className="text-sm mt-4">Certifique-se de que o backend está rodando na porta 3001</div>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-b from-green-500 to-green-700">
      <AdSenseScript />
      
      <header className="bg-green-800 text-white p-3 md:p-6 text-center shadow-lg">
        <h1 className="text-2xl md:text-4xl font-bold flex items-center justify-center space-x-2">
          <span>🏆</span>
          <span>Sem panela FC</span>
          <span>⚽</span>
        </h1>
      </header>

      {/* Banner superior */}
      <div className="container mx-auto px-3 md:px-6 pt-2 md:pt-4">
        <AdBanner 
          adSlot={ADSENSE_CONFIG.AD_SLOTS.HEADER_BANNER}
          adFormat="horizontal"
          className="mb-2 md:mb-4"
          style={{ minHeight: '90px' }}
        />
      </div>
      
      <div className="container mx-auto p-3 md:p-6 max-w-6xl">
        {/* Botão para alternar entre gerenciar e selecionar jogadores */}
        <div className="text-center mb-4 md:mb-6">
          <button
            onClick={() => setShowManager(!showManager)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 md:py-3 md:px-8 rounded-full text-base md:text-lg shadow-lg transform hover:scale-105 transition-all"
          >
            {showManager ? '⚽ Voltar para Seleção' : '⚙️ Gerenciar Jogadores'}
          </button>
        </div>

        {/* Banner lateral esquerdo */}
        <div className="hidden lg:block fixed left-4 top-1/2 transform -translate-y-1/2 z-10">
          <AdBanner 
            adSlot={ADSENSE_CONFIG.AD_SLOTS.LEFT_SIDEBAR}
            adFormat="vertical"
            style={{ width: '160px', minHeight: '600px' }}
          />
        </div>

        {/* Banner lateral direito */}
        <div className="hidden lg:block fixed right-4 top-1/2 transform -translate-y-1/2 z-10">
          <AdBanner 
            adSlot={ADSENSE_CONFIG.AD_SLOTS.RIGHT_SIDEBAR}
            adFormat="vertical"
            style={{ width: '160px', minHeight: '600px' }}
          />
        </div>

        {showManager ? (
          <PlayerManager
            players={players}
            onAddPlayer={addPlayer}
            onUpdatePlayer={updatePlayer}
            onRemovePlayer={removePlayer}
          />
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-xl p-3 md:p-6 mb-4 md:mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 md:mb-4 space-y-2 sm:space-y-0">
                <h2 className="text-lg md:text-2xl font-semibold text-green-800">Selecione os Jogadores</h2>
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 md:px-4 md:py-2 rounded-full shadow-lg flex items-center space-x-2 self-start sm:self-auto">
                  <span className="text-lg md:text-2xl">👥</span>
                  <span className="font-bold text-base md:text-lg">{selected.size}</span>
                  <span className="text-xs md:text-sm">selecionados</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                {players.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">⚽</div>
                    <div className="text-xl font-semibold mb-2">Nenhum jogador cadastrado</div>
                    <div className="text-sm mb-4">Você precisa adicionar jogadores primeiro!</div>
                    <button
                      onClick={() => setShowManager(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                      ⚙️ Gerenciar Jogadores
                    </button>
                  </div>
                ) : (
                  players.map(player => (
                    <div 
                      key={player.id} 
                      className="bg-green-50 border border-green-200 rounded-lg p-2 md:p-3 flex items-center space-x-2 hover:bg-green-100 transition-colors cursor-pointer"
                      onClick={() => handleCheck(player.id, !selected.has(player.id))}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(player.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleCheck(player.id, e.target.checked);
                        }}
                        className="form-checkbox h-4 w-4 text-green-600 focus:ring-green-500 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm md:text-base text-gray-800 truncate">{player.name}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <p className="text-xs text-gray-600">Nota:</p>
                          <div className="flex items-center">
                            {renderStars(player.rating, 'text-xs')}
                            <span className="text-xs font-bold text-gray-700 ml-1">({player.rating})</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-lg flex-shrink-0">⚽</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {!showManager && (
          <>
            <div className="text-center mb-4 md:mb-6">
              <button 
                onClick={createTeams} 
                className="bg-yellow-400 hover:bg-yellow-500 text-green-800 font-bold py-2 px-6 md:py-3 md:px-8 rounded-full text-base md:text-lg shadow-lg transform hover:scale-105 transition-all"
                disabled={selected.size < 6}
              >
                ⚽ Montar Times Balanceados ⚽
              </button>
              {selected.size < 6 && <p className="text-yellow-300 mt-2 font-semibold text-sm md:text-base">Selecione pelo menos 5 jogadores para montar times!</p>}
            </div>

            {/* Banner no meio do conteúdo */}
            <div className="mb-4 md:mb-6">
              <AdBanner 
                adSlot={ADSENSE_CONFIG.AD_SLOTS.CONTENT_RECTANGLE}
                adFormat="rectangle"
                className="mx-auto"
                style={{ maxWidth: '336px', minHeight: '280px' }}
              />
            </div>
          </>
        )}

        {!showManager && teams.length > 0 && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            <h2 className="text-2xl font-semibold mb-6 text-green-800 text-center">🏆 Exemplos de Times Balanceados 🏆</h2>
            {selectedExample === null ? (
              <div className="grid gap-4">
                {teams.map((example, idx) => (
                  <div key={idx} className="bg-green-50 border-2 border-green-300 rounded-lg p-4 cursor-pointer hover:bg-green-100 transition-colors" onClick={() => setSelectedExample(idx)}>
                    <h3 className="text-xl font-medium mb-2 text-center text-green-700">
                      Exemplo {idx + 1} - Distribuição Equilibrada
                    </h3>
                    <div className="flex space-x-1 overflow-x-auto pb-2 justify-center">
                      {example.map((team, tIdx) => {
                        const teamRatingSum = team.reduce((sum, player) => sum + player.rating, 0);
                        const teamAverage = team.length > 0 ? (teamRatingSum / team.length).toFixed(1) : '0.0';
                        
                        return (
                          <div key={tIdx} className="bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-500 rounded-lg p-1 shadow-lg flex-shrink-0 w-24 md:w-32">
                            <h4 className="font-bold text-xs mb-1 text-center text-green-800 bg-white py-0.5 rounded">
                              Time {tIdx + 1} ⚽
                            </h4>
                            <div className="text-center bg-white rounded p-1 mt-1">
                              <div className="text-xs text-gray-600">
                                <div>{team.length} jogadores</div>
                                <div>Total: <span className="font-bold text-green-700">{teamRatingSum}</span></div>
                                <div>Média: <span className="font-bold text-green-700">{teamAverage}</span></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-center text-sm text-gray-600 mt-2">Clique para ver detalhes e placar</p>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <button 
                  onClick={() => setSelectedExample(null)} 
                  className="mb-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                  ← Voltar aos Exemplos
                </button>
                {(() => {
                  const example = teams[selectedExample];
                  return (
                    <div>
                      <h3 className="text-xl font-medium mb-4 text-center text-green-700 bg-green-100 py-2 rounded-lg">
                        Exemplo {selectedExample + 1} - Distribuição Equilibrada
                      </h3>
                      <div className="flex space-x-1 overflow-x-auto pb-2 justify-center mb-6">
                        {example.map((team, tIdx) => {
                          const teamRatingSum = team.reduce((sum, player) => sum + player.rating, 0);
                          const teamAverage = team.length > 0 ? (teamRatingSum / team.length).toFixed(1) : '0.0';
                          
                          return (
                            <div key={tIdx} className="bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-500 rounded-lg p-0.5 shadow-lg hover:shadow-xl transition-shadow flex-shrink-0 w-24 md:w-32">
                              <h4 className="font-bold text-xs mb-1 text-center text-green-800 bg-white py-0.5 rounded">
                                Time {tIdx + 1} ⚽
                              </h4>
                              <ul className="space-y-0.5">
                                {team.map(player => (
                                  <li key={player.id} className="bg-white rounded px-1 py-0.5 text-xs shadow-sm truncate">
                                    <span className="font-medium truncate block text-xs">{player.name}</span>
                                    <div className="flex items-center justify-center">
                                      {renderStars(player.rating, 'text-xs')}
                                    </div>
                                    <span className="text-xs font-bold text-center block">({player.rating})</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-1 text-center bg-white rounded p-1">
                                <div className="text-xs text-gray-600">
                                  <div>Total: <span className="font-bold text-green-700">{teamRatingSum}</span></div>
                                  <div>Média: <span className="font-bold text-green-700">{teamAverage}</span></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-lg font-semibold text-gray-700">📊 Placar dos Jogos</h4>
                          <button 
                            onClick={() => addCustomGame(selectedExample)} 
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          >
                            + Adicionar Jogo
                          </button>
                        </div>
                        <div className="space-y-2">
                          {(customGames[selectedExample] || []).map((game, gameIdx) => {
                            const result = game.score1 > game.score2 ? `Vitória Time ${game.team1 + 1}` : 
                                          game.score1 < game.score2 ? `Vitória Time ${game.team2 + 1}` : 
                                          'Empate';
                            return (
                              <div key={gameIdx} className="bg-white p-2 rounded">
                                <div className="flex items-center justify-center space-x-1 md:space-x-2 mb-2">
                                  <select 
                                    className="border rounded px-1 md:px-2 py-1 text-xs md:text-sm"
                                    value={game.team1}
                                    onChange={(e) => updateCustomGame(selectedExample, gameIdx, 'team1', parseInt(e.target.value))}
                                    disabled={game.confirmed}
                                  >
                                    {example.map((_, tIdx) => (
                                      <option key={tIdx} value={tIdx}>Time {tIdx + 1}</option>
                                    ))}
                                  </select>
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-8 md:w-12 text-center border rounded px-1 py-1 text-xs md:text-sm"
                                    value={game.score1}
                                    onChange={(e) => updateCustomGame(selectedExample, gameIdx, 'score1', parseInt(e.target.value) || 0)}
                                    disabled={game.confirmed}
                                  />
                                  <span className="text-xs md:text-sm">x</span>
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-8 md:w-12 text-center border rounded px-1 py-1 text-xs md:text-sm"
                                    value={game.score2}
                                    onChange={(e) => updateCustomGame(selectedExample, gameIdx, 'score2', parseInt(e.target.value) || 0)}
                                    disabled={game.confirmed}
                                  />
                                  <select 
                                    className="border rounded px-1 md:px-2 py-1 text-xs md:text-sm"
                                    value={game.team2}
                                    onChange={(e) => updateCustomGame(selectedExample, gameIdx, 'team2', parseInt(e.target.value))}
                                    disabled={game.confirmed}
                                  >
                                    {example.map((_, tIdx) => (
                                      <option key={tIdx} value={tIdx}>Time {tIdx + 1}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                {!game.confirmed ? (
                                  <div className="flex justify-center">
                                    <button 
                                      onClick={() => confirmGame(selectedExample, gameIdx)}
                                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold"
                                    >
                                      ✓ Confirmar Resultado
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                                      game.score1 > game.score2 ? 'bg-green-100 text-green-800' :
                                      game.score1 < game.score2 ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {result}
                                    </span>
                                    <div className="text-xs text-gray-600 flex space-x-3">
                                      <span className="text-green-600 font-semibold">V: {
                                        game.score1 > game.score2 ? '1' : game.score1 < game.score2 ? '0' : '0'
                                      }</span>
                                      <span className="text-yellow-600 font-semibold">E: {
                                        game.score1 === game.score2 ? '1' : '0'
                                      }</span>
                                      <span className="text-red-600 font-semibold">D: {
                                        game.score1 < game.score2 ? '1' : game.score1 > game.score2 ? '0' : '0'
                                      }</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Banner inferior */}
        <div className="mt-6 md:mt-8 mb-3 md:mb-4">
          <AdBanner 
            adSlot={ADSENSE_CONFIG.AD_SLOTS.FOOTER_BANNER}
            adFormat="horizontal"
            className="mx-auto"
            style={{ minHeight: '90px' }}
          />
        </div>

        {/* Rodapé com links importantes */}
        <footer className="text-center text-white text-xs md:text-sm py-3 md:py-4 border-t border-green-600">
          <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-1 sm:space-y-0">
            <a 
              href="/privacy-policy.html" 
              target="_blank"
              className="hover:text-yellow-300 underline"
            >
              Política de Privacidade
            </a>
            <span className="hidden sm:inline">•</span>
            <span>© 2026 Sem panela FC</span>
            <span className="hidden sm:inline">•</span>
            <span>Feito com ⚽ para amantes do futebol</span>
          </div>
        </footer>
      </div>
      
      {/* Informações da sessão (só em desenvolvimento) */}
      <SessionInfo />
    </div>
  );
}

export default App;