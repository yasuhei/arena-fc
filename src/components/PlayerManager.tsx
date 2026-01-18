import { useState } from 'react';
import { Player } from '../hooks/usePlayers';
import { extractPlayersFromWhatsAppList, getImportStats } from '../utils/whatsappParser';

// Função para renderizar rating com barra de progresso colorida
const renderRatingBar = (rating: number, size: string = 'w-24') => {
  if (rating === 0) {
    return (
      <div className="flex items-center space-x-2">
        <div className={`${size} h-4 bg-gray-700 rounded-sm border border-gray-600 overflow-hidden`}>
          <div className="h-full bg-gray-500 rounded-sm" style={{ width: '0%' }}></div>
        </div>
        <span className="text-xs font-black text-gray-500 uppercase min-w-[60px]">NO RATING</span>
      </div>
    );
  }

  const percentage = (rating / 5) * 100;
  
  const getColorAndLabel = (rating: number) => {
    if (rating >= 0.1 && rating <= 0.9) return { color: 'bg-red-500', label: 'BEGINNER' };
    if (rating >= 1.0 && rating <= 1.9) return { color: 'bg-orange-500', label: 'LOW' };
    if (rating >= 2.0 && rating <= 2.9) return { color: 'bg-yellow-500', label: 'REGULAR' };
    if (rating >= 3.0 && rating <= 3.9) return { color: 'bg-blue-500', label: 'GOOD' };
    if (rating >= 4.0 && rating <= 5.0) return { color: 'bg-green-500', label: 'EXCELLENT' };
    return { color: 'bg-gray-500', label: 'UNKNOWN' };
  };

  const { color, label } = getColorAndLabel(rating);

  return (
    <div className="flex items-center space-x-2">
      <div className={`${size} h-4 bg-gray-700 rounded-sm border border-gray-600 overflow-hidden`}>
        <div 
          className={`h-full ${color} rounded-sm transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="flex flex-col items-start min-w-[60px]">
        <span className="text-xs font-black text-white leading-none">{rating.toFixed(1)}</span>
        <span className="text-xs font-bold text-gray-400 uppercase leading-none">{label}</span>
      </div>
    </div>
  );
};

interface PlayerManagerProps {
  players: Player[];
  onAddPlayer: (name: string, rating: number) => Promise<Player>;
  onUpdatePlayer: (id: string, name: string, rating: number) => Promise<Player>;
  onRemovePlayer: (id: string) => Promise<void>;
}

export const PlayerManager = ({ players, onAddPlayer, onUpdatePlayer, onRemovePlayer }: PlayerManagerProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRating, setNewPlayerRating] = useState<number>(3);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [extractedPlayers, setExtractedPlayers] = useState<string[]>([]);
  const [importStats, setImportStats] = useState<any>(null);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    try {
      await onAddPlayer(newPlayerName.trim(), newPlayerRating);
      setNewPlayerName('');
      setNewPlayerRating(3);
      setShowAddForm(false);
    } catch (error) {
      alert('Erro ao adicionar jogador');
    }
  };

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer || !newPlayerName.trim()) return;

    try {
      await onUpdatePlayer(editingPlayer.id, newPlayerName.trim(), newPlayerRating);
      setEditingPlayer(null);
      setNewPlayerName('');
      setNewPlayerRating(3);
    } catch (error) {
      alert('Erro ao atualizar jogador');
    }
  };

  const startEdit = (player: Player) => {
    setEditingPlayer(player);
    setNewPlayerName(player.name);
    setNewPlayerRating(player.rating);
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingPlayer(null);
    setNewPlayerName('');
    setNewPlayerRating(3);
  };

  const handleRemove = async (player: Player) => {
    if (confirm(`Tem certeza que deseja remover ${player.name}?`)) {
      try {
        await onRemovePlayer(player.id);
      } catch (error) {
        alert('Erro ao remover jogador');
      }
    }
  };

  // Função para extrair nomes da lista do WhatsApp
  const handleImportText = () => {
    const extracted = extractPlayersFromWhatsAppList(importText);
    const playerNames = extracted.map(p => p.name);
    const existingNames = players.map(p => p.name);
    const stats = getImportStats(extracted, existingNames);
    
    setExtractedPlayers(playerNames);
    setImportStats(stats);
  };

  const handleImportPlayers = async () => {
    if (!importStats || importStats.new === 0) {
      alert('Nenhum jogador novo para importar!');
      return;
    }

    try {
      // Importar apenas jogadores novos com rating 0 (sem avaliação)
      for (const playerData of importStats.newPlayers) {
        await onAddPlayer(playerData.name, 0);
      }
      
      // Limpar e fechar modal
      setImportText('');
      setExtractedPlayers([]);
      setImportStats(null);
      setShowImportModal(false);
      
      alert(`${importStats.new} jogadores importados com sucesso!${importStats.duplicates > 0 ? ` (${importStats.duplicates} duplicados ignorados)` : ''}`);
    } catch (error) {
      alert('Erro ao importar jogadores');
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportText('');
    setExtractedPlayers([]);
    setImportStats(null);
  };

  return (
    <div className="bg-black bg-opacity-60 backdrop-blur-lg border border-gray-800 rounded-none shadow-2xl p-4 md:p-8 mb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-3 sm:space-y-0">
        <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-wider" style={{ letterSpacing: '0.1em' }}>
          MANAGE PLAYERS
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 md:px-6 md:py-3 rounded-none font-bold text-sm md:text-base uppercase tracking-wider transition-all"
          >
            📋 IMPORT LIST
          </button>
          {players.length > 0 && (
            <button
              onClick={async () => {
                if (confirm(`Tem certeza que deseja remover TODOS os ${players.length} jogadores?`)) {
                  try {
                    for (const player of players) {
                      await onRemovePlayer(player.id);
                    }
                    alert('Todos os jogadores foram removidos!');
                  } catch (error) {
                    alert('Erro ao remover jogadores');
                  }
                }
              }}
              className="bg-red-700 hover:bg-red-600 text-white px-4 py-3 md:px-6 md:py-3 rounded-none font-bold text-sm md:text-base uppercase tracking-wider transition-all"
            >
              🗑️ CLEAR ALL
            </button>
          )}
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingPlayer(null);
              setNewPlayerName('');
              setNewPlayerRating(3);
            }}
            className="bg-white hover:bg-gray-200 text-black px-4 py-3 md:px-6 md:py-3 rounded-none font-bold text-sm md:text-base uppercase tracking-wider transition-all"
          >
            {showAddForm ? '✕ CANCEL' : '+ ADD PLAYER'}
          </button>
        </div>
      </div>

      {/* Formulário de adicionar/editar */}
      {(showAddForm || editingPlayer) && (
        <form onSubmit={editingPlayer ? handleUpdatePlayer : handleAddPlayer} className="bg-gray-900 border border-gray-700 p-4 md:p-6 rounded-none mb-6">
          <h3 className="text-base md:text-lg font-black mb-4 text-white uppercase tracking-wider">
            {editingPlayer ? 'EDIT PLAYER' : 'NEW PLAYER'}
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Name</label>
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full border-2 border-gray-700 bg-black text-white rounded-none px-4 py-3 focus:ring-2 focus:ring-white focus:border-white text-sm md:text-base font-bold uppercase"
                placeholder="PLAYER NAME"
                required
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Rating (0-5)</label>
              <select
                value={newPlayerRating}
                onChange={(e) => setNewPlayerRating(parseFloat(e.target.value))}
                className="w-full sm:w-auto border-2 border-gray-700 bg-black text-white rounded-none px-4 py-3 focus:ring-2 focus:ring-white focus:border-white text-sm md:text-base font-bold"
              >
                <option value={0}>0.0 - NO RATING</option>
                {Array.from({ length: 51 }, (_, i) => {
                  const rating = (i / 10);
                  const labels = [
                    'BEGINNER', 'BEGINNER', 'BEGINNER', 'BEGINNER', 'BEGINNER',
                    'BEGINNER', 'BEGINNER', 'BEGINNER', 'BEGINNER', 'BEGINNER',
                    'LOW', 'LOW', 'LOW', 'LOW', 'LOW',
                    'LOW', 'LOW', 'LOW', 'LOW', 'LOW',
                    'REGULAR', 'REGULAR', 'REGULAR', 'REGULAR', 'REGULAR',
                    'REGULAR', 'REGULAR', 'REGULAR', 'REGULAR', 'REGULAR',
                    'GOOD', 'GOOD', 'GOOD', 'GOOD', 'GOOD',
                    'GOOD', 'GOOD', 'GOOD', 'GOOD', 'GOOD',
                    'VERY GOOD', 'VERY GOOD', 'VERY GOOD', 'VERY GOOD', 'VERY GOOD',
                    'VERY GOOD', 'VERY GOOD', 'VERY GOOD', 'VERY GOOD', 'VERY GOOD',
                    'EXCELLENT'
                  ];
                  
                  if (rating === 0) return null; // Já temos o 0.0 acima
                  
                  return (
                    <option key={rating} value={rating}>
                      {rating.toFixed(1)} - {labels[i]}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-none font-black uppercase tracking-wider transition-all"
              >
                {editingPlayer ? 'UPDATE' : 'ADD'}
              </button>
              {editingPlayer && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-none font-black uppercase tracking-wider transition-all"
                >
                  CANCEL
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Lista de jogadores com opções de editar/remover */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map(player => {
          const hasNoRating = player.rating === 0;
          const cardClasses = hasNoRating 
            ? "bg-gradient-to-br from-red-900 to-red-800 border-2 border-red-600 hover:border-red-400" 
            : "bg-gradient-to-br from-gray-900 to-black border-2 border-gray-700 hover:border-white";
          
          return (
            <div key={player.id} className={`${cardClasses} rounded-none p-4 flex items-center justify-between transition-all group`}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-black text-white text-base md:text-lg uppercase tracking-wide">{player.name}</p>
                  
                </div>
                <div className="mt-3">
                  {renderRatingBar(player.rating, 'w-32')}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(player)}
                  className={`${hasNoRating ? 'bg-red-600 hover:bg-red-500' : 'bg-white hover:bg-gray-200'} ${hasNoRating ? 'text-white' : 'text-black'} w-7 h-7 rounded-none text-sm font-black transition-all flex items-center justify-center`}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleRemove(player)}
                  className="bg-gray-700 hover:bg-gray-600 text-white w-7 h-7 rounded-none text-sm font-black transition-all flex items-center justify-center"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {players.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-6xl mb-6">⚡</div>
          <div className="text-xl md:text-2xl font-black mb-3 text-white uppercase tracking-wider">NO PLAYERS YET</div>
          <div className="text-sm uppercase tracking-wide">Click "ADD PLAYER" to create your first player!</div>
        </div>
      )}

      {/* Modal de Importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-2 border-gray-700 rounded-none p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">
                📋 IMPORT WHATSAPP LIST
              </h3>
              <button
                onClick={closeImportModal}
                className="bg-gray-700 hover:bg-gray-600 text-white w-10 h-10 rounded-none font-black text-lg transition-all"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
                Cole a lista do WhatsApp aqui:
              </label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full h-64 border-2 border-gray-700 bg-black text-white rounded-none px-4 py-3 focus:ring-2 focus:ring-white focus:border-white text-sm font-mono resize-none"
                placeholder="Cole aqui a lista do WhatsApp...&#10;Exemplo:&#10;01 - Miguel&#10;02 - Diego&#10;03 - Robson...&#10;04 - Renato tiozinho&#10;05 - Bruno"
              />
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={handleImportText}
                className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-none font-black uppercase tracking-wider transition-all"
                disabled={!importText.trim()}
              >
                🔍 EXTRACT NAMES
              </button>
              {importStats && importStats.new > 0 && (
                <button
                  onClick={handleImportPlayers}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-none font-black uppercase tracking-wider transition-all"
                >
                  ✅ IMPORT {importStats.new} NEW PLAYERS
                </button>
              )}
            </div>

            {/* Estatísticas da importação */}
            {importStats && (
              <div className="bg-gray-800 border border-gray-600 rounded-none p-4 mb-4">
                <h4 className="text-sm font-black text-white mb-3 uppercase tracking-wider">
                  📊 IMPORT STATISTICS:
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-black rounded-none p-3">
                    <div className="text-2xl font-black text-white">{importStats.total}</div>
                    <div className="text-xs text-gray-400 uppercase">Total Found</div>
                  </div>
                  <div className="bg-black rounded-none p-3">
                    <div className="text-2xl font-black text-green-400">{importStats.new}</div>
                    <div className="text-xs text-gray-400 uppercase">New Players</div>
                  </div>
                  <div className="bg-black rounded-none p-3">
                    <div className="text-2xl font-black text-yellow-400">{importStats.duplicates}</div>
                    <div className="text-xs text-gray-400 uppercase">Duplicates</div>
                  </div>
                </div>
              </div>
            )}

            {/* Preview dos jogadores extraídos */}
            {extractedPlayers.length > 0 && (
              <div className="bg-black border border-gray-700 rounded-none p-4">
                <h4 className="text-lg font-black text-white mb-4 uppercase tracking-wider">
                  📋 EXTRACTED PLAYERS ({extractedPlayers.length}):
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {extractedPlayers.map((name, idx) => {
                    const exists = players.find(p => 
                      p.name.toLowerCase().trim() === name.toLowerCase().trim()
                    );
                    
                    return (
                      <div 
                        key={idx} 
                        className={`p-2 rounded-none text-sm font-bold uppercase ${
                          exists 
                            ? 'bg-yellow-600 text-black' 
                            : 'bg-gray-800 text-white'
                        }`}
                      >
                        {exists ? '⚠️' : '✅'} {name}
                      </div>
                    );
                  })}
                </div>
                {extractedPlayers.some(name => 
                  players.find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim())
                ) && (
                  <p className="text-yellow-400 text-xs mt-3 uppercase tracking-wide">
                    ⚠️ Jogadores em amarelo já existem e serão ignorados
                  </p>
                )}
              </div>
            )}

            {/* Instruções */}
            <div className="mt-6 bg-gray-800 border border-gray-600 rounded-none p-4">
              <h4 className="text-sm font-black text-white mb-2 uppercase tracking-wider">
                📖 INSTRUCTIONS:
              </h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Cole a lista completa do WhatsApp no campo acima</li>
                <li>• O sistema vai extrair automaticamente os nomes após os números</li>
                <li>• Todos os jogadores serão importados SEM RATING (você deve avaliar depois)</li>
                <li>• Jogadores sem rating aparecem com cards vermelhos</li>
                <li>• Jogadores que já existem serão ignorados</li>
                <li>• Funciona com formatos: "01 - Nome", "2 - Nome", "15 - Nome (info extra)"</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};