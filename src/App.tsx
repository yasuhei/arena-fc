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
  
  // Estrelas cheias (baseado na parte inteira da nota)
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span key={`full-${i}`} className={`${size} text-yellow-500`}>⭐</span>
    );
  }
  
  // Meia estrela se tiver decimal (ex: 2.5 = 2 cheias + 1 meia)
  if (hasHalfStar) {
    stars.push(
      <span key="half" className={`${size} text-yellow-400`}>⭐</span>
    );
  }
  
  // Estrelas vazias para completar até 5
  const usedStars = fullStars + (hasHalfStar ? 1 : 0);
  const emptyStars = 5 - usedStars;
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <span key={`empty-${i}`} className={`${size} text-gray-300`}>☆</span>
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
    <div 
      className="min-h-screen relative bg-black"
      style={{
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif"
      }}
    >
      {/* Background com gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-95"></div>
      
      {/* Padrão geométrico sutil */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 35px,
            rgba(255,255,255,0.03) 35px,
            rgba(255,255,255,0.03) 70px
          )`
        }}
      ></div>
      
      <AdSenseScript />
      
      <header className="relative z-10 bg-black bg-opacity-80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 md:px-8 py-4 md:py-6">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center justify-center space-x-3"
              style={{ letterSpacing: '-0.02em' }}>
            <span className="text-3xl md:text-5xl">⚡</span>
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              SEM PANELA FC
            </span>
            <span className="text-3xl md:text-5xl">⚡</span>
          </h1>
          <p className="text-center text-gray-400 text-xs md:text-sm mt-2 tracking-wide uppercase">
            Performance • Balance • Victory
          </p>
        </div>
      </header>

      {/* Banner superior */}
      <div className="container mx-auto px-2 md:px-4 pt-1 md:pt-3">
        <AdBanner 
          adSlot={ADSENSE_CONFIG.AD_SLOTS.HEADER_BANNER}
          adFormat="horizontal"
          className="mb-1 md:mb-3"
          style={{ minHeight: '90px' }}
        />
      </div>
      
      <div className="container mx-auto p-3 md:p-6 max-w-7xl relative z-10">
        {/* Botão para alternar entre gerenciar e selecionar jogadores */}
        <div className="text-center mb-4 md:mb-6">
          <button
            onClick={() => setShowManager(!showManager)}
            className="bg-white hover:bg-gray-100 text-black font-bold py-3 px-8 md:py-4 md:px-12 rounded-none text-sm md:text-base tracking-wider uppercase transition-all transform hover:scale-105 shadow-2xl"
            style={{ letterSpacing: '0.1em' }}
          >
            {showManager ? '← BACK TO SELECTION' : '⚙ MANAGE PLAYERS'}
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
            <div className="bg-black bg-opacity-60 backdrop-blur-lg border border-gray-800 rounded-none shadow-2xl p-4 md:p-6 mb-4 md:mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 md:mb-6 space-y-2 sm:space-y-0">
                <h2 className="text-lg md:text-2xl font-black tracking-tight text-white uppercase" style={{ letterSpacing: '0.05em' }}>
                  SELECT PLAYERS
                </h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      if (selected.size === players.length) {
                        setSelected(new Set());
                      } else {
                        setSelected(new Set(players.map(p => p.id)));
                      }
                    }}
                    className="bg-white hover:bg-gray-200 text-black px-3 py-2 md:px-4 md:py-2 rounded-none text-xs md:text-sm font-bold uppercase tracking-wider transition-all"
                  >
                    {selected.size === players.length ? 'CLEAR ALL' : 'SELECT ALL'}
                  </button>
                  <div className="bg-white text-black px-3 py-2 md:px-4 md:py-2 rounded-none flex items-center space-x-2">
                    <span className="text-sm md:text-base">👥</span>
                    <span className="font-black text-sm md:text-lg">{selected.size}</span>
                    <span className="text-xs uppercase tracking-wider">Selected</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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
                      className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 hover:border-white rounded-none p-3 md:p-4 flex items-center space-x-3 hover:bg-gray-800 transition-all cursor-pointer group"
                      onClick={() => handleCheck(player.id, !selected.has(player.id))}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(player.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleCheck(player.id, e.target.checked);
                        }}
                        className="form-checkbox h-5 w-5 text-white bg-black border-2 border-gray-600 rounded-none focus:ring-white flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm md:text-base text-white truncate uppercase tracking-wide">{player.name}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <p className="text-xs text-gray-400 uppercase tracking-wider">Rating:</p>
                          <div className="flex items-center">
                            {renderStars(player.rating, 'text-xs')}
                            <span className="text-xs font-black text-white ml-1">({player.rating})</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">⚡</span>
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
                className="bg-white hover:bg-gray-100 text-black font-black py-4 px-10 md:py-5 md:px-16 rounded-none text-base md:text-lg shadow-2xl transform hover:scale-105 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selected.size < 6}
                style={{ letterSpacing: '0.15em' }}
              >
                ⚡ CREATE TEAMS ⚡
              </button>
              {selected.size < 6 && <p className="text-gray-400 mt-3 font-medium text-xs md:text-sm uppercase tracking-wide">Select at least 6 players to create teams</p>}
            </div>

            {/* Banner no meio do conteúdo */}
            <div className="mb-2 md:mb-4">
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
          <div className="bg-black bg-opacity-60 backdrop-blur-lg border border-gray-800 rounded-none shadow-2xl p-4 md:p-8">
            <h2 className="text-2xl md:text-3xl font-black mb-8 text-white text-center uppercase tracking-wider" style={{ letterSpacing: '0.1em' }}>
              ⚡ BALANCED TEAMS ⚡
            </h2>
            {selectedExample === null ? (
              <div className="grid gap-6">
                {teams.map((example, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-gray-900 to-black border-2 border-gray-700 hover:border-white rounded-none p-6 cursor-pointer hover:bg-gray-800 transition-all group" onClick={() => setSelectedExample(idx)}>
                    <h3 className="text-lg md:text-xl font-black mb-4 text-center text-white uppercase tracking-wide">
                      OPTION {idx + 1} • BALANCED DISTRIBUTION
                    </h3>
                    <div className="flex space-x-2 overflow-x-auto pb-2 justify-center">
                      {example.map((team, tIdx) => {
                        const teamRatingSum = team.reduce((sum, player) => sum + player.rating, 0);
                        const teamAverage = team.length > 0 ? (teamRatingSum / team.length).toFixed(1) : '0.0';
                        
                        return (
                          <div key={tIdx} className="bg-black border-2 border-gray-600 rounded-none p-3 shadow-xl flex-shrink-0 w-28 md:w-36">
                            <h4 className="font-black text-xs mb-2 text-center text-white bg-gray-800 py-1 uppercase tracking-wider">
                              TEAM {tIdx + 1}
                            </h4>
                            <div className="text-center bg-gray-900 p-2 mt-2">
                              <div className="text-xs text-gray-400 space-y-1">
                                <div className="uppercase tracking-wide">{team.length} Players</div>
                                <div className="text-white font-bold text-sm">Total: {teamRatingSum}</div>
                                <div className="text-white font-bold text-sm">Avg: {teamAverage}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-center text-sm text-gray-400 mt-4 uppercase tracking-wide group-hover:text-white transition-colors">Click to view details and scores</p>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <button 
                  onClick={() => setSelectedExample(null)} 
                  className="mb-6 bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-none font-bold uppercase tracking-wider transition-all"
                >
                  ← BACK TO OPTIONS
                </button>
                {(() => {
                  const example = teams[selectedExample];
                  return (
                    <div>
                      <h3 className="text-xl font-black mb-6 text-center text-white bg-gray-900 py-3 rounded-none uppercase tracking-wide">
                        OPTION {selectedExample + 1} • BALANCED DISTRIBUTION
                      </h3>
                      <div className="flex space-x-1 overflow-x-auto pb-2 justify-center mb-6">
                        {example.map((team, tIdx) => {
                          const teamRatingSum = team.reduce((sum, player) => sum + player.rating, 0);
                          const teamAverage = team.length > 0 ? (teamRatingSum / team.length).toFixed(1) : '0.0';
                          
                          return (
                            <div key={tIdx} className="bg-black border-2 border-gray-600 rounded-none p-2 shadow-2xl hover:border-white transition-all flex-shrink-0 w-28 md:w-40">
                              <h4 className="font-black text-xs mb-2 text-center text-white bg-gray-800 py-1 uppercase tracking-wider">
                                TEAM {tIdx + 1}
                              </h4>
                              <ul className="space-y-1">
                                {team.map(player => (
                                  <li key={player.id} className="bg-gray-900 rounded-none px-2 py-1 text-xs shadow-sm">
                                    <span className="font-bold truncate block text-xs text-white uppercase">{player.name}</span>
                                    <div className="flex items-center justify-center mt-0.5">
                                      {renderStars(player.rating, 'text-xs')}
                                    </div>
                                    <span className="text-xs font-black text-center block text-gray-400">({player.rating})</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-2 text-center bg-gray-900 p-2">
                                <div className="text-xs text-gray-400 space-y-1">
                                  <div className="uppercase tracking-wide">Total: <span className="font-black text-white">{teamRatingSum}</span></div>
                                  <div className="uppercase tracking-wide">Avg: <span className="font-black text-white">{teamAverage}</span></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="bg-gray-900 rounded-none p-6 border border-gray-800">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-wider">📊 MATCH SCORES</h4>
                          <button 
                            onClick={() => addCustomGame(selectedExample)} 
                            className="bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-none text-xs md:text-sm font-bold uppercase tracking-wider transition-all"
                          >
                            + ADD MATCH
                          </button>
                        </div>
                        <div className="space-y-3">
                          {(customGames[selectedExample] || []).map((game, gameIdx) => {
                            const result = game.score1 > game.score2 ? `TEAM ${game.team1 + 1} WINS` : 
                                          game.score1 < game.score2 ? `TEAM ${game.team2 + 1} WINS` : 
                                          'DRAW';
                            return (
                              <div key={gameIdx} className="bg-black border border-gray-700 p-3 rounded-none">
                                <div className="flex items-center justify-center space-x-2 md:space-x-3 mb-3">
                                  <select 
                                    className="border border-gray-600 bg-gray-900 text-white rounded-none px-2 py-2 text-xs md:text-sm font-bold uppercase"
                                    value={game.team1}
                                    onChange={(e) => updateCustomGame(selectedExample, gameIdx, 'team1', parseInt(e.target.value))}
                                    disabled={game.confirmed}
                                  >
                                    {example.map((_, tIdx) => (
                                      <option key={tIdx} value={tIdx}>TEAM {tIdx + 1}</option>
                                    ))}
                                  </select>
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-10 md:w-14 text-center border-2 border-gray-600 bg-black text-white rounded-none px-2 py-2 text-sm md:text-base font-black"
                                    value={game.score1}
                                    onChange={(e) => updateCustomGame(selectedExample, gameIdx, 'score1', parseInt(e.target.value) || 0)}
                                    disabled={game.confirmed}
                                  />
                                  <span className="text-sm md:text-lg text-white font-black">×</span>
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-10 md:w-14 text-center border-2 border-gray-600 bg-black text-white rounded-none px-2 py-2 text-sm md:text-base font-black"
                                    value={game.score2}
                                    onChange={(e) => updateCustomGame(selectedExample, gameIdx, 'score2', parseInt(e.target.value) || 0)}
                                    disabled={game.confirmed}
                                  />
                                  <select 
                                    className="border border-gray-600 bg-gray-900 text-white rounded-none px-2 py-2 text-xs md:text-sm font-bold uppercase"
                                    value={game.team2}
                                    onChange={(e) => updateCustomGame(selectedExample, gameIdx, 'team2', parseInt(e.target.value))}
                                    disabled={game.confirmed}
                                  >
                                    {example.map((_, tIdx) => (
                                      <option key={tIdx} value={tIdx}>TEAM {tIdx + 1}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                {!game.confirmed ? (
                                  <div className="flex justify-center">
                                    <button 
                                      onClick={() => confirmGame(selectedExample, gameIdx)}
                                      className="bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-none text-xs font-black uppercase tracking-wider transition-all"
                                    >
                                      ✓ CONFIRM RESULT
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                                      game.score1 > game.score2 ? 'bg-white text-black' :
                                      game.score1 < game.score2 ? 'bg-gray-800 text-white' :
                                      'bg-gray-600 text-white'
                                    }`}>
                                      {result}
                                    </span>
                                    <div className="text-xs text-gray-400 flex space-x-4 uppercase tracking-wider">
                                      <span className="text-white font-black">W: {
                                        game.score1 > game.score2 ? '1' : game.score1 < game.score2 ? '0' : '0'
                                      }</span>
                                      <span className="text-gray-400 font-black">D: {
                                        game.score1 === game.score2 ? '1' : '0'
                                      }</span>
                                      <span className="text-gray-600 font-black">L: {
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
        <div className="mt-3 md:mt-6 mb-2 md:mb-3">
          <AdBanner 
            adSlot={ADSENSE_CONFIG.AD_SLOTS.FOOTER_BANNER}
            adFormat="horizontal"
            className="mx-auto"
            style={{ minHeight: '90px' }}
          />
        </div>

        {/* Rodapé com links importantes */}
        <footer className="text-center text-gray-400 text-xs py-4 md:py-6 border-t border-gray-800 bg-black bg-opacity-80 backdrop-blur-md relative z-10">
          <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-6 space-y-2 sm:space-y-0 mb-3 uppercase tracking-wider">
            <a 
              href="/sobre.html" 
              target="_blank"
              className="hover:text-white transition-colors font-medium"
            >
              About
            </a>
            <span className="hidden sm:inline text-gray-700">|</span>
            <a 
              href="/como-usar.html" 
              target="_blank"
              className="hover:text-white transition-colors font-medium"
            >
              How to Use
            </a>
            <span className="hidden sm:inline text-gray-700">|</span>
            <a 
              href="/privacy-policy.html" 
              target="_blank"
              className="hover:text-white transition-colors font-medium"
            >
              Privacy Policy
            </a>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-1 sm:space-y-0 text-gray-600">
            <span className="font-black tracking-wider">© 2026 SEM PANELA FC</span>
            <span className="hidden sm:inline">•</span>
            <span className="uppercase tracking-wide">Performance Driven</span>
          </div>
        </footer>
      </div>
      
      {/* Informações da sessão (só em desenvolvimento) */}
      <SessionInfo />
    </div>
  );
}

export default App;