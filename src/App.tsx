import { useState } from 'react';

interface Player {
  name: string;
  level: 'A' | 'B' | 'C';
}

const players: Player[] = [
  { name: 'João Silva', level: 'A' },
  { name: 'Maria Santos', level: 'B' },
  { name: 'Pedro Oliveira', level: 'C' },
  { name: 'Ana Costa', level: 'A' },
  { name: 'Carlos Pereira', level: 'B' },
  { name: 'Beatriz Lima', level: 'C' },
  { name: 'Lucas Rocha', level: 'A' },
  { name: 'Fernanda Alves', level: 'B' },
  { name: 'Rafael Gomes', level: 'C' },
  { name: 'Juliana Ferreira', level: 'A' },
  { name: 'Thiago Martins', level: 'B' },
  { name: 'Camila Souza', level: 'C' },
  { name: 'Bruno Carvalho', level: 'A' },
  { name: 'Patrícia Rodrigues', level: 'B' },
  { name: 'Gustavo Mendes', level: 'C' },
  { name: 'Isabela Barbosa', level: 'A' },
  { name: 'Felipe Dias', level: 'B' },
  { name: 'Larissa Nunes', level: 'C' },
  { name: 'Diego Ribeiro', level: 'A' },
  { name: 'Vanessa Cardoso', level: 'B' },
  { name: 'Roberto Pinto', level: 'C' },
  { name: 'Sofia Moreira', level: 'A' },
  { name: 'Leonardo Castro', level: 'B' },
  { name: 'Amanda Vieira', level: 'C' },
];

function createBalancedTeams(selected: Set<string>): Player[][] {
  const available = players.filter(p => selected.has(p.name));
  const total = available.length;
  if (total < 6) return [];

  let teamSize = 6;
  let numTeams = Math.min(4, Math.floor(total / teamSize));

  if (total < 18) {
    teamSize = 5;
    if (total === 15) {
      numTeams = 3;
    } else if (total >= 13 && total <= 17) {
      numTeams = 3; // 2 times de 5 + 1 com resto
    } else {
      numTeams = Math.floor(total / 5);
    }
  } else if (total > 18) {
    teamSize = 6;
    numTeams = Math.floor(total / 6);
    if (total % 6 !== 0) numTeams += 1; // time com resto
  } else {
    // 18: 3 times de 6
    numTeams = 3;
    teamSize = 6;
  }

  const teams: Player[][] = Array.from({ length: numTeams }, () => []);

  // Separar por nível
  const aPlayers = available.filter(p => p.level === 'A');
  const otherPlayers = available.filter(p => p.level !== 'A');

  // Distribuir A's: máximo 2 por time
  let teamIndex = 0;
  for (const player of aPlayers) {
    if (teams[teamIndex].filter(p => p.level === 'A').length < 2) {
      teams[teamIndex].push(player);
    }
    teamIndex = (teamIndex + 1) % numTeams;
  }

  // Embaralhar outros jogadores
  const shuffledOthers = [...otherPlayers];
  for (let i = shuffledOthers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOthers[i], shuffledOthers[j]] = [shuffledOthers[j], shuffledOthers[i]];
  }

  // Distribuir restantes
  let currentTeam = 0;
  for (const player of shuffledOthers) {
    if (currentTeam < numTeams - 1 && teams[currentTeam].length < teamSize) {
      teams[currentTeam].push(player);
    } else if (currentTeam === numTeams - 1) {
      teams[currentTeam].push(player);
    } else {
      currentTeam++;
      if (currentTeam < numTeams) {
        teams[currentTeam].push(player);
      }
    }
  }

  return teams.filter(team => team.length > 0);
}

function App() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [teams, setTeams] = useState<Player[][][]>([]);
  const [scores, setScores] = useState<{[key: string]: {[key: string]: number}}>({});
  const [selectedExample, setSelectedExample] = useState<number | null>(null);
  const [customGames, setCustomGames] = useState<{[key: number]: Array<{team1: number, team2: number, score1: number, score2: number}>}>({});

  const handleCheck = (name: string, checked: boolean) => {
    const newSelected = new Set(selected);
    if (checked) newSelected.add(name);
    else newSelected.delete(name);
    setSelected(newSelected);
  };

  const createTeams = () => {
    const examples: Player[][][] = [];
    for (let i = 0; i < 3; i++) {
      const teamExample = createBalancedTeams(selected);
      examples.push(teamExample);
    }
    setTeams(examples);
    setScores({});
    setSelectedExample(null);
    setCustomGames({});
  };


  const addCustomGame = (exampleIdx: number) => {
    setCustomGames(prev => ({
      ...prev,
      [exampleIdx]: [...(prev[exampleIdx] || []), { team1: 0, team2: 1, score1: 0, score2: 0 }]
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

  const getTeamResult = (exampleIdx: number, teamIdx: number) => {
    const teamGames = Object.entries(scores).filter(([key]) => key.startsWith(`${exampleIdx}-`));
    const customGamesList = customGames[exampleIdx] || [];
    let wins = 0, draws = 0, losses = 0;
    
    teamGames.forEach(([key, scores]) => {
      const [, t1, t2] = key.split('-').map(Number);
      if (t1 === teamIdx || t2 === teamIdx) {
        const isTeam1 = t1 === teamIdx;
        const teamScore = isTeam1 ? scores.score1 : scores.score2;
        const oppScore = isTeam1 ? scores.score2 : scores.score1;
        
        if (teamScore > oppScore) wins++;
        else if (teamScore === oppScore) draws++;
        else losses++;
      }
    });

    customGamesList.forEach(game => {
      if (game.team1 === teamIdx || game.team2 === teamIdx) {
        const isTeam1 = game.team1 === teamIdx;
        const teamScore = isTeam1 ? game.score1 : game.score2;
        const oppScore = isTeam1 ? game.score2 : game.score1;
        
        if (teamScore > oppScore) wins++;
        else if (teamScore === oppScore) draws++;
        else losses++;
      }
    });
    
    return { wins, draws, losses };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-500 to-green-700">
      <header className="bg-green-800 text-white p-6 text-center shadow-lg">
        <h1 className="text-4xl font-bold flex items-center justify-center space-x-2">
          <span>🏆</span>
          <span>Arena FC</span>
          <span>⚽</span>
        </h1>
      </header>
      
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-green-800">Selecione os Jogadores Participantes</h2>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
              <span className="text-2xl">👥</span>
              <span className="font-bold text-lg">{selected.size}</span>
              <span className="text-sm">selecionados</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
            {players.map(player => (
              <div key={player.name} className="bg-green-50 border border-green-200 rounded-lg p-2 md:p-4 flex items-center space-x-2 md:space-x-3 hover:bg-green-100 transition-colors">
                <input
                  type="checkbox"
                  checked={selected.has(player.name)}
                  onChange={(e) => handleCheck(player.name, e.target.checked)}
                  className="form-checkbox h-4 w-4 md:h-5 md:w-5 text-green-600 focus:ring-green-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm md:text-base text-gray-800 truncate">{player.name}</p>
                  <p className="text-xs md:text-sm text-gray-600">
                    Nível <span className={`font-bold ${player.level === 'A' ? 'text-red-600' : player.level === 'B' ? 'text-yellow-600' : 'text-blue-600'}`}>
                      {player.level}
                    </span>
                  </p>
                </div>
                <span className="text-lg md:text-2xl">⚽</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mb-6">
          <button 
            onClick={createTeams} 
            className="bg-yellow-400 hover:bg-yellow-500 text-green-800 font-bold py-3 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all"
            disabled={selected.size < 6}
          >
            ⚽ Montar Times Balanceados ⚽
          </button>
          {selected.size < 6 && <p className="text-yellow-300 mt-2 font-semibold">Selecione pelo menos 5 jogadores para montar times!</p>}
        </div>

        {teams.length > 0 && (
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
                      {example.map((team, tIdx) => (
                       <div key={tIdx} className="bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-500 rounded-lg p-1 shadow-lg flex-shrink-0 w-24 md:w-32">
                          <h4 className="font-bold text-xs mb-1 text-center text-green-800 bg-white py-0.5 rounded">
                            Time {tIdx + 1} ⚽
                          </h4>
                          <div className="text-center">
                            <span className="text-xs text-gray-600">
                              {team.length} jogadores
                            </span>
                          </div>
                        </div>
                      ))}
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
                          const result = getTeamResult(selectedExample, tIdx);
                          return (
                            <div key={tIdx} className="bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-500 rounded-lg p-0.5 shadow-lg hover:shadow-xl transition-shadow flex-shrink-0 w-24 md:w-32">
                              <h4 className="font-bold text-xs mb-1 text-center text-green-800 bg-white py-0.5 rounded">
                                Time {tIdx + 1} ⚽
                              </h4>
                              <ul className="space-y-0.5">
                                {team.map(player => (
                                  <li key={player.name} className="bg-white rounded px-1 py-0.5 text-xs shadow-sm truncate">
                                    <span className="font-medium truncate block text-xs">{player.name}</span>
                                    <span className={`font-bold text-xs ${player.level === 'A' ? 'text-red-600' : player.level === 'B' ? 'text-yellow-600' : 'text-blue-600'}`}>
                                      ({player.level})
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-1 text-center">
                                <span className="text-xs text-gray-600">
                                  {team.length}j | A:{team.filter(p => p.level === 'A').length}
                                </span>
                              </div>
                              {(result.wins + result.draws + result.losses) > 0 && (
                                <div className="mt-1 text-center bg-white rounded px-1 py-0.5">
                                  <span className="text-xs font-bold text-green-600">V:{result.wins}</span>
                                  <span className="text-xs font-bold text-yellow-600 mx-1">E:{result.draws}</span>
                                  <span className="text-xs font-bold text-red-600">D:{result.losses}</span>
                                </div>
                              )}
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
                              <div key={gameIdx} className="flex items-center justify-center space-x-2 bg-white p-2 rounded">
                                <select 
                                  className="border rounded px-2 py-1 text-sm"
                                  value={game.team1}
                                  onChange={(e) => updateCustomGame(selectedExample, gameIdx, 'team1', parseInt(e.target.value))}
                                >
                                  {example.map((_, tIdx) => (
                                    <option key={tIdx} value={tIdx}>Time {tIdx + 1}</option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min="0"
                                  className="w-12 text-center border rounded px-1 py-1 text-sm"
                                  value={game.score1}
                                  onChange={(e) => updateCustomGame(selectedExample, gameIdx, 'score1', parseInt(e.target.value) || 0)}
                                />
                                <span className="text-sm">x</span>
                                <input
                                  type="number"
                                  min="0"
                                  className="w-12 text-center border rounded px-1 py-1 text-sm"
                                  value={game.score2}
                                  onChange={(e) => updateCustomGame(selectedExample, gameIdx, 'score2', parseInt(e.target.value) || 0)}
                                />
                                <select 
                                  className="border rounded px-2 py-1 text-sm"
                                  value={game.team2}
                                  onChange={(e) => updateCustomGame(selectedExample, gameIdx, 'team2', parseInt(e.target.value))}
                                >
                                  {example.map((_, tIdx) => (
                                    <option key={tIdx} value={tIdx}>Time {tIdx + 1}</option>
                                  ))}
                                </select>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${
                                  game.score1 > game.score2 ? 'bg-green-100 text-green-800' :
                                  game.score1 < game.score2 ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {result}
                                </span>
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
      </div>
    </div>
  );
}

export default App;