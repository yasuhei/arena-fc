import { useState } from 'react';
import { Player } from '../hooks/usePlayers';

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

interface PlayerManagerProps {
  players: Player[];
  onAddPlayer: (name: string, rating: number) => Promise<void>;
  onUpdatePlayer: (id: string, name: string, rating: number) => Promise<void>;
  onRemovePlayer: (id: string) => Promise<void>;
}

export const PlayerManager = ({ players, onAddPlayer, onUpdatePlayer, onRemovePlayer }: PlayerManagerProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerRating, setNewPlayerRating] = useState<number>(3);

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

  return (
    <div className="bg-black bg-opacity-60 backdrop-blur-lg border border-gray-800 rounded-none shadow-2xl p-4 md:p-8 mb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-3 sm:space-y-0">
        <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-wider" style={{ letterSpacing: '0.1em' }}>
          MANAGE PLAYERS
        </h2>
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
                <option value={0}>0.0 - BEGINNER</option>
                <option value={0.5}>0.5 - BEGINNER+</option>
                <option value={1}>1.0 - LOW</option>
                <option value={1.5}>1.5 - LOW+</option>
                <option value={2}>2.0 - REGULAR</option>
                <option value={2.5}>2.5 - REGULAR+</option>
                <option value={3}>3.0 - GOOD</option>
                <option value={3.5}>3.5 - GOOD+</option>
                <option value={4}>4.0 - VERY GOOD</option>
                <option value={4.5}>4.5 - VERY GOOD+</option>
                <option value={5}>5.0 - EXCELLENT</option>
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
        {players.map(player => (
          <div key={player.id} className="bg-gradient-to-br from-gray-900 to-black border-2 border-gray-700 hover:border-white rounded-none p-4 flex items-center justify-between transition-all group">
            <div>
              <p className="font-black text-white text-base md:text-lg uppercase tracking-wide">{player.name}</p>
              <div className="flex items-center space-x-2 mt-2">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Rating:</p>
                <div className="flex items-center space-x-1">
                  <div className="flex items-center">
                    {renderStars(player.rating, 'text-base')}
                  </div>
                  <span className="text-sm font-black text-white">({player.rating})</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => startEdit(player)}
                className="bg-white hover:bg-gray-200 text-black w-7 h-7 rounded-none text-sm font-black transition-all flex items-center justify-center"
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
        ))}
      </div>

      {players.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-6xl mb-6">⚡</div>
          <div className="text-xl md:text-2xl font-black mb-3 text-white uppercase tracking-wider">NO PLAYERS YET</div>
          <div className="text-sm uppercase tracking-wide">Click "ADD PLAYER" to create your first player!</div>
        </div>
      )}
    </div>
  );
};