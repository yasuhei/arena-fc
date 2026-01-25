import { useState, useEffect } from 'react';
import { usePlayers, Player } from './hooks/usePlayers';
import { PlayerManager } from './components/PlayerManager';

// Função para renderizar rating com barra de progresso compacta
const renderRatingBarCompact = (rating: number) => {
  if (rating === 0) {
    return (
      <div className="flex items-center space-x-1">
        <div className="w-16 h-2 bg-gray-700 rounded-sm border border-gray-600 overflow-hidden">
          <div className="h-full bg-gray-500 rounded-sm" style={{ width: '0%' }}></div>
        </div>
        <span className="text-xs font-black text-gray-500">--</span>
      </div>
    );
  }

  const percentage = (rating / 5) * 100;
  
  const getColor = (rating: number) => {
    if (rating >= 0.1 && rating <= 0.9) return 'bg-red-500';
    if (rating >= 1.0 && rating <= 1.9) return 'bg-orange-500';
    if (rating >= 2.0 && rating <= 2.9) return 'bg-yellow-500';
    if (rating >= 3.0 && rating <= 3.9) return 'bg-blue-500';
    if (rating >= 4.0 && rating <= 5.0) return 'bg-green-500';
    return 'bg-gray-500';
  };

  return (
    <div className="flex items-center space-x-1">
      <div className="w-16 h-2 bg-gray-700 rounded-sm border border-gray-600 overflow-hidden">
        <div 
          className={`h-full ${getColor(rating)} rounded-sm transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <span className="text-xs font-black text-white">{rating.toFixed(1)}</span>
    </div>
  );
};

function createBalancedTeams(selected: Set<string>, players: Player[], variation: number = 0): Player[][] {
  const available = players.filter(p => selected.has(p.id));
  const total = available.length;
  if (total < 6) return [];

  let numTeams = 2;

  // Lógica otimizada para futebol society (6 jogadores por time)
  if (total >= 6 && total <= 12) {
    numTeams = 2;
  } else if (total >= 13 && total <= 21) {
    numTeams = 3;
  } else if (total >= 22 && total <= 32) {
    numTeams = 4;
  } else if (total > 32) {
    numTeams = Math.ceil(total / 6);
  }

  const teams: Player[][] = Array.from({ length: numTeams }, () => []);

  // Função para embaralhar array
  const shuffleArray = (array: Player[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  let sortedPlayers: Player[];
  
  if (variation === 0) {
    // OPTION 1: Rating Priority - Ordenação por rating + balanceamento inteligente
    sortedPlayers = [...available].sort((a, b) => b.rating - a.rating);
    
    // Distribuir usando algoritmo de menor soma
    for (const player of sortedPlayers) {
      // Encontrar o time com menor soma de ratings
      const teamSums = teams.map(team => 
        team.reduce((sum, p) => sum + p.rating, 0)
      );
      
      let minSumIndex = 0;
      let minSum = teamSums[0];
      
      for (let i = 1; i < teamSums.length; i++) {
        if (teamSums[i] < minSum) {
          minSum = teamSums[i];
          minSumIndex = i;
        }
      }
      
      teams[minSumIndex].push(player);
    }
    
  } else if (variation === 1) {
    // OPTION 2: Mixed Shuffle - Embaralhar por níveis
    const highRated = available.filter(p => p.rating >= 3.5);
    const midRated = available.filter(p => p.rating >= 2.0 && p.rating < 3.5);
    const lowRated = available.filter(p => p.rating < 2.0);
    
    // Embaralhar cada grupo separadamente
    const shuffledHigh = shuffleArray(highRated);
    const shuffledMid = shuffleArray(midRated);
    const shuffledLow = shuffleArray(lowRated);
    
    // Combinar os grupos embaralhados
    sortedPlayers = [...shuffledHigh, ...shuffledMid, ...shuffledLow];
    
    // Distribuir round-robin
    let currentTeamIndex = 0;
    for (const player of sortedPlayers) {
      teams[currentTeamIndex].push(player);
      currentTeamIndex = (currentTeamIndex + 1) % numTeams;
    }
    
  } else {
    // OPTION 3: Serpentine Draft - Padrão serpentina
    sortedPlayers = [...available].sort((a, b) => b.rating - a.rating);
    
    let currentTeam = 0;
    let direction = 1; // 1 para frente, -1 para trás
    
    for (const player of sortedPlayers) {
      teams[currentTeam].push(player);
      
      // Mover para próximo time
      currentTeam += direction;
      
      // Inverter direção quando chegar no fim
      if (currentTeam >= numTeams) {
        currentTeam = numTeams - 1;
        direction = -1;
      } else if (currentTeam < 0) {
        currentTeam = 0;
        direction = 1;
      }
    }
  }

  return teams.filter(team => team.length > 0);
}

function App() {
  const { players, loading, addPlayer, updatePlayer, removePlayer } = usePlayers();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [teams, setTeams] = useState<Player[][][]>([]);
  const [selectedExample, setSelectedExample] = useState<number | null>(null);
  const [customGames, setCustomGames] = useState<{[key: number]: Array<{team1: number, team2: number, score1: number, score2: number, confirmed: boolean}>}>({});
  const [showManager, setShowManager] = useState(false);
  const [view, setView] = useState<'selection' | 'teams' | 'match'>('selection'); // Adicionado 'match'
  const [manualTeams, setManualTeams] = useState<Player[][]>([[], []]); // Times manuais
  const [creationMode, setCreationMode] = useState<'auto' | 'manual'>('auto'); // Modo de criação
  const [confirmedTeams, setConfirmedTeams] = useState<Player[][] | null>(null); // Times confirmados
  
  // Estados do timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [timerPreset, setTimerPreset] = useState<number | null>(null); // 5 ou 10 minutos (em segundos: 300 ou 600)

  const handleCheck = (playerId: string, checked: boolean) => {
    const newSelected = new Set(selected);
    if (checked) newSelected.add(playerId);
    else newSelected.delete(playerId);
    setSelected(newSelected);
  };

  const createTeams = () => {
    if (creationMode === 'auto') {
      const examples: Player[][][] = [];
      for (let i = 0; i < 3; i++) {
        const teamExample = createBalancedTeams(selected, players, i);
        examples.push(teamExample);
      }
      setTeams(examples);
      setSelectedExample(null);
      setCustomGames({});
      setView('teams'); // Muda para view de times
    } else {
      // Modo manual: inicializa times vazios
      const numTeams = 2; // Pode ser configurável
      setManualTeams(Array.from({ length: numTeams }, () => []));
      setView('teams');
    }
  };

  const addPlayerToManualTeam = (player: Player, teamIndex: number) => {
    setManualTeams(prev => {
      const newTeams = [...prev];
      // Remove o jogador de qualquer time que ele esteja
      newTeams.forEach(team => {
        const idx = team.findIndex(p => p.id === player.id);
        if (idx !== -1) team.splice(idx, 1);
      });
      // Adiciona ao time selecionado
      newTeams[teamIndex] = [...newTeams[teamIndex], player];
      return newTeams;
    });
  };

  const removePlayerFromManualTeam = (playerId: string, teamIndex: number) => {
    setManualTeams(prev => {
      const newTeams = [...prev];
      newTeams[teamIndex] = newTeams[teamIndex].filter(p => p.id !== playerId);
      return newTeams;
    });
  };

  const movePlayerBetweenTeams = (player: Player, fromTeam: number, toTeam: number) => {
    setManualTeams(prev => {
      const newTeams = [...prev];
      // Remove do time atual
      newTeams[fromTeam] = newTeams[fromTeam].filter(p => p.id !== player.id);
      // Adiciona ao novo time
      newTeams[toTeam] = [...newTeams[toTeam], player];
      return newTeams;
    });
  };

  const movePlayerInAutoTeams = (player: Player, fromTeam: number, toTeam: number, exampleIdx: number) => {
    setTeams(prev => {
      const newTeams = [...prev];
      const example = [...newTeams[exampleIdx]];
      // Remove do time atual
      example[fromTeam] = example[fromTeam].filter(p => p.id !== player.id);
      // Adiciona ao novo time
      example[toTeam] = [...example[toTeam], player];
      newTeams[exampleIdx] = example;
      return newTeams;
    });
  };

  const addManualTeam = () => {
    setManualTeams(prev => [...prev, []]);
  };

  const backToSelection = () => {
    setView('selection');
    setTeams([]);
    setManualTeams([[], []]);
    setSelectedExample(null);
    setConfirmedTeams(null);
    stopTimer();
  };

  const confirmTeams = () => {
    if (creationMode === 'auto' && selectedExample !== null) {
      setConfirmedTeams(teams[selectedExample]);
    } else if (creationMode === 'manual') {
      setConfirmedTeams(manualTeams);
    }
    setView('match');
    setCustomGames({ 0: [] }); // Reset games
  };

  // Funções do Timer
  const playWhistle = () => {
    const audio = new Audio('/src/img/the-sound-where-the-physical-education-teacher-blows-the-whistle.mp3');
    audio.volume = 0.5; // Volume a 50%
    audio.play().catch(err => console.error('Error playing whistle:', err));
  };

  const startTimer = () => {
    if (!timerRunning) {
      setTimerRunning(true);
      const interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000) as unknown as number;
      setTimerInterval(interval);
    }
  };

  const pauseTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setTimerRunning(false);
  };

  const resetTimer = () => {
    pauseTimer();
    setTimerSeconds(0);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setTimerRunning(false);
    setTimerSeconds(0);
    setTimerPreset(null);
  };

  useEffect(() => {
    // Comprehensive AdSense cleanup on app load
    const cleanupAdSense = () => {
      try {
        // Remove any existing AdSense elements
        const adsElements = document.querySelectorAll('.adsbygoogle, ins[data-ad-client], ins[class*="adsbygoogle"]');
        adsElements.forEach(el => el.remove());

        // Remove AdSense scripts
        const scripts = document.querySelectorAll('script[src*="googlesyndication"], script[src*="adsbygoogle"], script[src*="googleads"]');
        scripts.forEach(script => script.remove());

        // Remove AdSense iframes
        const iframes = document.querySelectorAll('iframe[src*="googleads"], iframe[src*="googlesyndication"]');
        iframes.forEach(iframe => iframe.remove());

        // Clear AdSense global variables
        if (window.adsbygoogle) {
          delete window.adsbygoogle;
        }

        // Clear any AdSense related localStorage
        Object.keys(localStorage).forEach(key => {
          if (key.includes('google') && (key.includes('ads') || key.includes('adsense'))) {
            localStorage.removeItem(key);
          }
        });

        // Clear any AdSense related sessionStorage
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('google') && (key.includes('ads') || key.includes('adsense'))) {
            sessionStorage.removeItem(key);
          }
        });

        console.log('✅ AdSense cleanup completed');
      } catch (error) {
        console.log('⚠️ AdSense cleanup error:', error);
      }
    };

    // Run cleanup immediately
    cleanupAdSense();

    // Run cleanup again after a short delay to catch any delayed elements
    setTimeout(cleanupAdSense, 2000);

    // Set up a periodic cleanup to remove any new AdSense elements
    const cleanupInterval = setInterval(cleanupAdSense, 5000);

    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  // Efeito para verificar se atingiu o preset
  useEffect(() => {
    if (timerPreset && timerSeconds >= timerPreset && timerRunning) {
      playWhistle();
      pauseTimer();
    }
  }, [timerSeconds, timerPreset, timerRunning]);

  const setPresetTime = (minutes: number) => {
    const seconds = minutes * 60;
    setTimerPreset(seconds);
    setTimerSeconds(0);
    pauseTimer();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  const shareTeamsOnWhatsApp = () => {
    let teamsToShare: Player[][] = [];
    
    if (creationMode === 'auto' && selectedExample !== null) {
      teamsToShare = teams[selectedExample];
    } else if (creationMode === 'manual') {
      teamsToShare = manualTeams;
    }
    
    // Formata a mensagem
    let message = '⚽ *SEM PANELA FC* ⚽\n\n';
    message += '🏆 *TEAMS FORMED* 🏆\n\n';
    
    teamsToShare.forEach((team, idx) => {
      message += `*TEAM ${idx + 1}*\n`;
      team.forEach((player, pIdx) => {
        message += `${pIdx + 1}. ${player.name}\n`;
      });
      message += '\n';
    });
    
    message += '---\n';
    message += 'Created with Sem Panela FC\n';
    message += 'https://sem-panela-fc.vercel.app/';
    
    // Codifica a mensagem para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Abre o WhatsApp
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl font-black uppercase tracking-wider">LOADING PLAYERS...</div>
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
      
      <header className="relative z-10 bg-black bg-opacity-80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 md:px-8 py-4 md:py-6">
          <div className="flex justify-between items-center">
            <div className="flex-1"></div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center justify-center space-x-3"
                style={{ letterSpacing: '-0.02em' }}>
              <span className="text-3xl md:text-5xl">⚡</span>
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                SEM PANELA FC
              </span>
              <span className="text-3xl md:text-5xl">⚡</span>
            </h1>
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => {
                  // Manual AdSense cleanup
                  const adsElements = document.querySelectorAll('.adsbygoogle, ins[data-ad-client], ins[class*="adsbygoogle"]');
                  adsElements.forEach(el => el.remove());
                  const scripts = document.querySelectorAll('script[src*="googlesyndication"], script[src*="adsbygoogle"]');
                  scripts.forEach(script => script.remove());
                  const iframes = document.querySelectorAll('iframe[src*="googleads"], iframe[src*="googlesyndication"]');
                  iframes.forEach(iframe => iframe.remove());
                  if (window.adsbygoogle) delete window.adsbygoogle;
                  alert('🚫 Anúncios removidos! Se ainda aparecerem, limpe o cache do navegador (Ctrl+Shift+Delete)');
                }}
                className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-none text-xs font-bold uppercase tracking-wider transition-all"
                title="Remover anúncios persistentes"
              >
                🚫 NO ADS
              </button>
            </div>
          </div>
          <p className="text-center text-gray-400 text-xs md:text-sm mt-2 tracking-wide uppercase">
            Performance • Balance • Victory
          </p>
        </div>
      </header>
      
      <div className="container mx-auto p-3 md:p-6 max-w-7xl relative z-10">
        {/* Botão para alternar entre gerenciar e selecionar jogadores */}
        <div className="text-center mb-4 md:mb-6">
          <button
            onClick={() => setShowManager(!showManager)}
            className="bg-white hover:bg-gray-100 text-black font-black py-3 px-8 md:py-4 md:px-12 rounded-none text-sm md:text-base uppercase transition-all transform hover:scale-105 shadow-2xl"
            style={{ letterSpacing: '0.1em' }}
          >
            {showManager ? '← BACK TO SELECTION' : '⚙ MANAGE PLAYERS'}
          </button>
        </div>

        {showManager && (
          <PlayerManager
            players={players}
            onAddPlayer={addPlayer}
            onUpdatePlayer={updatePlayer}
            onRemovePlayer={removePlayer}
          />
        )}

        {!showManager && view === 'selection' && (
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
                    <div className="text-6xl mb-4">⚡</div>
                    <div className="text-xl md:text-2xl font-black mb-3 text-white uppercase tracking-wider">NO PLAYERS REGISTERED</div>
                    <div className="text-sm uppercase tracking-wide mb-4">You need to add players first!</div>
                    <button
                      onClick={() => setShowManager(true)}
                      className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-none font-black uppercase tracking-wider transition-all"
                    >
                      ⚙ MANAGE PLAYERS
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
                          <div className="flex items-center justify-center mt-1">
                            {renderRatingBarCompact(player.rating)}
                          </div>
                        </div>
                      </div>
                      <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">⚡</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Seletor de modo e botão de criar times */}
            <div className="text-center mb-4 md:mb-6 space-y-4">
              {/* Seletor de modo */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setCreationMode('auto')}
                  className={`px-6 py-3 rounded-none font-black uppercase tracking-wider transition-all ${
                    creationMode === 'auto'
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  ⚡ AUTO BALANCE
                </button>
                <button
                  onClick={() => setCreationMode('manual')}
                  className={`px-6 py-3 rounded-none font-black uppercase tracking-wider transition-all ${
                    creationMode === 'manual'
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  ✋ MANUAL SETUP
                </button>
              </div>

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
          </>
        )}

        {!showManager && view === 'teams' && (
          <div className="bg-black bg-opacity-60 backdrop-blur-lg border border-gray-800 rounded-none shadow-2xl p-3 md:p-8 landscape:p-3 min-h-0">
            {/* Botão de navegação */}
            <div className="mb-3 md:mb-4 landscape:mb-2">
              <button 
                onClick={backToSelection} 
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 md:px-6 md:py-3 landscape:px-4 landscape:py-2 rounded-none font-black text-sm md:text-base landscape:text-sm uppercase tracking-wider transition-all"
              >
                ← BACK TO SELECTION
              </button>
            </div>

            {creationMode === 'manual' ? (
              // VIEW DE TIMES MANUAIS
              <>
                <h2 className="text-2xl md:text-3xl font-black mb-8 text-white text-center uppercase tracking-wider" style={{ letterSpacing: '0.1em' }}>
                  ✋ MANUAL TEAM SETUP
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Jogadores disponíveis */}
                  <div className="bg-gray-900 border border-gray-700 rounded-none p-4">
                    <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4">
                      📋 AVAILABLE PLAYERS
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {players.filter(p => selected.has(p.id) && !manualTeams.some(team => team.find(tp => tp.id === p.id))).map(player => (
                        <div key={player.id} className="bg-black border border-gray-600 rounded-none p-3 flex items-center justify-between">
                          <div>
                            <p className="font-black text-white text-sm uppercase">{player.name}</p>
                            <div className="flex items-center justify-center mt-1">
                              {renderRatingBarCompact(player.rating)}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {manualTeams.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => addPlayerToManualTeam(player, idx)}
                                className="bg-white hover:bg-gray-200 text-black w-8 h-8 rounded-none text-xs font-black transition-all"
                                title={`Add to Team ${idx + 1}`}
                              >
                                {idx + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Times */}
                  <div className="space-y-4">
                    {manualTeams.map((team, teamIdx) => {
                      const teamRatingSum = team.reduce((sum, player) => sum + player.rating, 0);
                      const teamAverage = team.length > 0 ? (teamRatingSum / team.length).toFixed(1) : '0.0';
                      
                      return (
                        <div key={teamIdx} className="bg-black border-2 border-gray-600 rounded-none p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-black text-white uppercase tracking-wider">
                              TEAM {teamIdx + 1}
                            </h4>
                            <div className="text-xs text-gray-400 space-x-3">
                              <span className="text-white font-black">Total: {teamRatingSum.toFixed(2)}</span>
                              <span className="text-white font-black">Avg: {teamAverage}</span>
                            </div>
                          </div>
                          <div className="space-y-2 min-h-[100px]">
                            {team.map(player => (
                              <div key={player.id} className="bg-gray-900 border border-gray-700 rounded-none p-2 flex items-center justify-between">
                                <div>
                                  <p className="font-black text-white text-sm uppercase">{player.name}</p>
                                  <div className="flex items-center justify-center mt-1">
                                    {renderRatingBarCompact(player.rating)}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  {/* Botões para mover para outros times */}
                                  {manualTeams.map((_, idx) => idx !== teamIdx && (
                                    <button
                                      key={idx}
                                      onClick={() => movePlayerBetweenTeams(player, teamIdx, idx)}
                                      className="bg-gray-700 hover:bg-gray-600 text-white w-7 h-7 rounded-none text-xs font-black transition-all"
                                      title={`Move to Team ${idx + 1}`}
                                    >
                                      →{idx + 1}
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => removePlayerFromManualTeam(player.id, teamIdx)}
                                    className="bg-gray-700 hover:bg-gray-600 text-white w-7 h-7 rounded-none text-xs font-black transition-all"
                                    title="Remove"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))}
                            {team.length === 0 && (
                              <div className="text-center text-gray-500 py-8 text-xs uppercase tracking-wide">
                                Empty team - Add players
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <button
                      onClick={addManualTeam}
                      className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-none font-black uppercase tracking-wider transition-all"
                    >
                      + ADD TEAM
                    </button>
                  </div>
                </div>
                
                {/* Botões Confirmar e Compartilhar - Manual Mode */}
                <div className="text-center mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                  <button 
                    onClick={shareTeamsOnWhatsApp}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 md:px-12 md:py-5 rounded-none font-black text-lg uppercase tracking-wider transition-all shadow-2xl transform hover:scale-105 flex items-center gap-2"
                    style={{ letterSpacing: '0.15em' }}
                  >
                    <span className="text-2xl">📱</span>
                    SHARE ON WHATSAPP
                  </button>
                  <button 
                    onClick={confirmTeams}
                    className="bg-white hover:bg-gray-100 text-black px-10 py-4 md:px-16 md:py-5 rounded-none font-black text-lg uppercase tracking-wider transition-all shadow-2xl transform hover:scale-105"
                    style={{ letterSpacing: '0.15em' }}
                  >
                    ✓ CONFIRM TEAMS
                  </button>
                </div>
              </>
            ) : (
              // VIEW DE TIMES AUTOMÁTICOS (código existente)
              <>
                <h2 className="text-xl md:text-3xl landscape:text-lg font-black mb-4 md:mb-8 landscape:mb-3 text-white text-center uppercase tracking-wider" style={{ letterSpacing: '0.1em' }}>
                  ⚡ BALANCED TEAMS ⚡
                </h2>
            {selectedExample === null ? (
              <div className="grid gap-4 md:gap-6">
                {teams.map((example, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-gray-900 to-black border-2 border-gray-700 hover:border-white rounded-none p-3 md:p-6 landscape:p-3 cursor-pointer hover:bg-gray-800 transition-all group" onClick={() => setSelectedExample(idx)}>
                    <h3 className="text-base md:text-xl landscape:text-sm font-black mb-3 md:mb-4 landscape:mb-2 text-center text-white uppercase tracking-wide">
                      {idx === 0 && 'OPTION 1 • RATING PRIORITY'}
                      {idx === 1 && 'OPTION 2 • MIXED SHUFFLE'}
                      {idx === 2 && 'OPTION 3 • SERPENTINE DRAFT'}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 landscape:grid-cols-3 gap-2 md:gap-4 landscape:gap-2 justify-items-center">
                      {example.map((team, tIdx) => {
                        const teamRatingSum = team.reduce((sum, player) => sum + player.rating, 0);
                        const teamAverage = team.length > 0 ? (teamRatingSum / team.length).toFixed(1) : '0.0';
                        
                        return (
                          <div key={tIdx} className="bg-black border-2 border-gray-600 rounded-none p-2 md:p-3 landscape:p-1 shadow-xl w-full max-w-28 md:max-w-36 landscape:max-w-24">
                            <h4 className="font-black text-xs mb-1 md:mb-2 landscape:mb-1 text-center text-white bg-gray-800 py-1 uppercase tracking-wider">
                              TEAM {tIdx + 1}
                            </h4>
                            <div className="text-center bg-gray-900 p-1 md:p-2 landscape:p-1 mt-1 md:mt-2 landscape:mt-1">
                              <div className="text-xs text-gray-400 space-y-0.5 landscape:space-y-0">
                                <div className="uppercase tracking-wide text-xs landscape:text-xs">{team.length} Players</div>
                                <div className="text-white font-bold text-xs landscape:text-xs">Total: {teamRatingSum.toFixed(2)}</div>
                                <div className="text-white font-bold text-xs landscape:text-xs">Avg: {teamAverage}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-center text-xs md:text-sm landscape:text-xs text-gray-400 mt-3 md:mt-4 landscape:mt-2 uppercase tracking-wide group-hover:text-white transition-colors">Click to view details and scores</p>
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
                        {selectedExample === 0 && 'OPTION 1 • RATING PRIORITY'}
                        {selectedExample === 1 && 'OPTION 2 • MIXED SHUFFLE'}
                        {selectedExample === 2 && 'OPTION 3 • SERPENTINE DRAFT'}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6">
                        {example.map((team, tIdx) => {
                          const teamRatingSum = team.reduce((sum, player) => sum + player.rating, 0);
                          const teamAverage = team.length > 0 ? (teamRatingSum / team.length).toFixed(1) : '0.0';
                          
                          return (
                            <div key={tIdx} className="bg-black border-2 border-gray-600 rounded-none p-2 md:p-3 shadow-2xl hover:border-white transition-all w-full">
                              <h4 className="font-black text-xs md:text-sm mb-2 text-center text-white bg-gray-800 py-1 uppercase tracking-wider">
                                TEAM {tIdx + 1}
                              </h4>
                              <ul className="space-y-1">
                                {team.map(player => (
                                  <li key={player.id} className="bg-gray-900 rounded-none px-2 py-1 text-xs shadow-sm">
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="flex-1 min-w-0">
                                        <span className="font-bold truncate block text-xs text-white uppercase">{player.name}</span>
                                        <div className="flex items-center justify-center mt-1">
                                          {renderRatingBarCompact(player.rating)}
                                        </div>
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        {example.map((_, targetIdx) => targetIdx !== tIdx && (
                                          <button
                                            key={targetIdx}
                                            onClick={() => movePlayerInAutoTeams(player, tIdx, targetIdx, selectedExample)}
                                            className="bg-gray-700 hover:bg-gray-600 text-white w-5 h-5 md:w-6 md:h-6 rounded-none text-xs font-black transition-all flex items-center justify-center"
                                            title={`Move to Team ${targetIdx + 1}`}
                                          >
                                            {targetIdx + 1}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-2 text-center bg-gray-900 p-1 md:p-2">
                                <div className="text-xs text-gray-400 space-y-1">
                                  <div className="uppercase tracking-wide">Total: <span className="font-black text-white">{teamRatingSum.toFixed(2)}</span></div>
                                  <div className="uppercase tracking-wide">Avg: <span className="font-black text-white">{teamAverage}</span></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Botões Confirmar e Compartilhar */}
                      <div className="text-center mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                        <button 
                          onClick={shareTeamsOnWhatsApp}
                          className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 md:px-12 md:py-5 rounded-none font-black text-lg uppercase tracking-wider transition-all shadow-2xl transform hover:scale-105 flex items-center gap-2"
                          style={{ letterSpacing: '0.15em' }}
                        >
                          <span className="text-2xl">📱</span>
                          SHARE ON WHATSAPP
                        </button>
                        <button 
                          onClick={confirmTeams}
                          className="bg-white hover:bg-gray-100 text-black px-10 py-4 md:px-16 md:py-5 rounded-none font-black text-lg uppercase tracking-wider transition-all shadow-2xl transform hover:scale-105"
                          style={{ letterSpacing: '0.15em' }}
                        >
                          ✓ CONFIRM TEAMS
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
              </>
            )}
          </div>
        )}

        {/* VIEW DE MATCH - Timer e Placares */}
        {!showManager && view === 'match' && confirmedTeams && (
          <div className="bg-black bg-opacity-60 backdrop-blur-lg border border-gray-800 rounded-none shadow-2xl p-4 md:p-8">
            {/* Header com botão voltar */}
            <div className="mb-6 flex justify-between items-center">
              <button 
                onClick={() => setView('teams')} 
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-none font-black uppercase tracking-wider transition-all"
              >
                ← BACK TO TEAMS
              </button>
            </div>

            <h2 className="text-2xl md:text-3xl font-black mb-8 text-white text-center uppercase tracking-wider" style={{ letterSpacing: '0.1em' }}>
              ⚽ MATCH CONTROL
            </h2>

            {/* Timer com Preset */}
            <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-gray-700 rounded-none p-6 mb-8">
              <h3 className="text-xl font-black text-white text-center uppercase tracking-wider mb-4">
                ⏱️ TIMER
              </h3>
              
              {/* Seletor de Tempo */}
              <div className="flex justify-center gap-3 mb-6">
                <button
                  onClick={() => setPresetTime(5)}
                  className={`px-6 py-3 rounded-none font-black uppercase tracking-wider transition-all ${
                    timerPreset === 300
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  5 MIN
                </button>
                <button
                  onClick={() => setPresetTime(10)}
                  className={`px-6 py-3 rounded-none font-black uppercase tracking-wider transition-all ${
                    timerPreset === 600
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  10 MIN
                </button>
                <button
                  onClick={() => setTimerPreset(null)}
                  className={`px-6 py-3 rounded-none font-black uppercase tracking-wider transition-all ${
                    timerPreset === null
                      ? 'bg-white text-black'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  FREE
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="text-6xl md:text-8xl font-black text-white mb-2" style={{ fontFamily: 'monospace' }}>
                  {formatTime(timerSeconds)}
                </div>
                {timerPreset && (
                  <div className="text-sm text-gray-400 uppercase tracking-wider">
                    / {formatTime(timerPreset)}
                  </div>
                )}
                <div className="flex justify-center gap-3 mt-4">
                  {!timerRunning ? (
                    <button
                      onClick={startTimer}
                      className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-none font-black uppercase tracking-wider transition-all"
                    >
                      ▶ START
                    </button>
                  ) : (
                    <button
                      onClick={pauseTimer}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-none font-black uppercase tracking-wider transition-all"
                    >
                      ⏸ PAUSE
                    </button>
                  )}
                  <button
                    onClick={resetTimer}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-none font-black uppercase tracking-wider transition-all"
                  >
                    ↻ RESET
                  </button>
                </div>
              </div>
            </div>

            {/* Match Scores */}
            <div className="bg-gray-900 rounded-none p-6 border border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-wider">📊 MATCH SCORES</h4>
                <button 
                  onClick={() => addCustomGame(0)} 
                  className="bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-none text-xs md:text-sm font-bold uppercase tracking-wider transition-all"
                >
                  + ADD MATCH
                </button>
              </div>
              <div className="space-y-3">
                {(customGames[0] || []).map((game, gameIdx) => {
                  const result = game.score1 > game.score2 ? `TEAM ${game.team1 + 1} WINS` : 
                                game.score1 < game.score2 ? `TEAM ${game.team2 + 1} WINS` : 
                                'DRAW';
                  return (
                    <div key={gameIdx} className="bg-black border border-gray-700 p-3 rounded-none">
                      <div className="flex items-center justify-center space-x-2 md:space-x-3 mb-3">
                        <select 
                          className="border border-gray-600 bg-gray-900 text-white rounded-none px-2 py-2 text-xs md:text-sm font-bold uppercase"
                          value={game.team1}
                          onChange={(e) => updateCustomGame(0, gameIdx, 'team1', parseInt(e.target.value))}
                          disabled={game.confirmed}
                        >
                          {confirmedTeams.map((_, tIdx) => (
                            <option key={tIdx} value={tIdx}>TEAM {tIdx + 1}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          className="w-10 md:w-14 text-center border-2 border-gray-600 bg-black text-white rounded-none px-2 py-2 text-sm md:text-base font-black"
                          value={game.score1}
                          onChange={(e) => updateCustomGame(0, gameIdx, 'score1', parseInt(e.target.value) || 0)}
                          disabled={game.confirmed}
                        />
                        <span className="text-sm md:text-lg text-white font-black">×</span>
                        <input
                          type="number"
                          min="0"
                          className="w-10 md:w-14 text-center border-2 border-gray-600 bg-black text-white rounded-none px-2 py-2 text-sm md:text-base font-black"
                          value={game.score2}
                          onChange={(e) => updateCustomGame(0, gameIdx, 'score2', parseInt(e.target.value) || 0)}
                          disabled={game.confirmed}
                        />
                        <select 
                          className="border border-gray-600 bg-gray-900 text-white rounded-none px-2 py-2 text-xs md:text-sm font-bold uppercase"
                          value={game.team2}
                          onChange={(e) => updateCustomGame(0, gameIdx, 'team2', parseInt(e.target.value))}
                          disabled={game.confirmed}
                        >
                          {confirmedTeams.map((_, tIdx) => (
                            <option key={tIdx} value={tIdx}>TEAM {tIdx + 1}</option>
                          ))}
                        </select>
                      </div>
                      
                      {!game.confirmed ? (
                        <div className="flex justify-center">
                          <button 
                            onClick={() => confirmGame(0, gameIdx)}
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
        )}

        {/* Rodapé com links importantes */}
        <footer className="text-center text-gray-400 text-xs py-4 md:py-6 border-t border-gray-800 bg-black bg-opacity-80 backdrop-blur-md relative z-10">
          <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-6 space-y-2 sm:space-y-0 mb-3 uppercase tracking-wider">
            <a 
              href="/landing-sem-panela-fc.html" 
              target="_blank"
              className="hover:text-white transition-colors font-bold text-yellow-400"
            >
              🚀 Sem Panela FC
            </a>
            <span className="hidden sm:inline text-gray-700">|</span>
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
              href="/faq-sem-panela-fc.html" 
              target="_blank"
              className="hover:text-white transition-colors font-medium"
            >
              FAQ
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
            <span className="uppercase tracking-wide">Desenvolvido por Yasuhei Cristiano Nakamura</span>
          </div>
          
          {/* Developer Credit */}
          <div className="mt-2 text-gray-500 text-xs">
            <span className="uppercase tracking-wide">
              Desenvolvedor Full Stack • React + TypeScript • Algoritmos avançados de balanceamento
            </span>
          </div>
          
          {/* SEO Content - Hidden but crawlable */}
          <div className="sr-only">
            <h2>Sem Panela FC - Sistema para Montar Times de Futebol</h2>
            <p>
              O Sem Panela FC é o melhor sistema para organizar peladas e montar times de futebol balanceados. 
              Nossa plataforma elimina as panelinhas e garante que todos tenham oportunidade igual de jogar em times equilibrados.
              Com algoritmos inteligentes, importação de listas do WhatsApp e sistema de avaliação preciso, 
              o Sem Panela FC revoluciona a forma como você organiza suas peladas.
            </p>
            <h3>Funcionalidades do Sem Panela FC</h3>
            <ul>
              <li>Montador de times inteligente com 3 estratégias diferentes</li>
              <li>Sistema de avaliação de jogadores de 0.0 a 5.0</li>
              <li>Importação automática de listas do WhatsApp</li>
              <li>Timer integrado com apito automático</li>
              <li>Compartilhamento direto para WhatsApp</li>
              <li>Interface responsiva para mobile e desktop</li>
            </ul>
            <h3>Tecnologia e Desenvolvimento</h3>
            <p>
              Sistema desenvolvido por Yasuhei Cristiano Nakamura, desenvolvedor Full Stack com expertise em React, TypeScript e algoritmos complexos.
              Arquitetura moderna, código limpo e performance otimizada garantem a melhor experiência para organizar peladas.
              Desenvolvido com foco em UX/UI profissional e escalabilidade.
            </p>
            <p>
              Organize suas peladas sem conflito, crie times balanceados e garanta diversão para todos com o Sem Panela FC.
              O sistema mais completo para futebol amador do Brasil, criado por Yasuhei Cristiano Nakamura.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;