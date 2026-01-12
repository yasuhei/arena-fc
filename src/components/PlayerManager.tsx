import { useState } from 'react';
import { Player } from '../hooks/usePlayers';

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
  
  // Meia estrela
  if (hasHalfStar) {
    stars.push(
      <span key="half" className={`${size} text-yellow-500 relative`}>
        <span className="absolute inset-0 overflow-hidden w-1/2">⭐</span>
        <span className="text-gray-300">⭐</span>
      </span>
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
    <div className="bg-white rounded-lg shadow-xl p-3 md:p-6 mb-4 md:mb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 md:mb-4 space-y-2 sm:space-y-0">
        <h2 className="text-lg md:text-2xl font-semibold text-green-800">Gerenciar Jogadores</h2>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingPlayer(null);
            setNewPlayerName('');
            setNewPlayerRating(3);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold text-sm md:text-base"
        >
          {showAddForm ? 'Cancelar' : '+ Adicionar Jogador'}
        </button>
      </div>

      {/* Formulário de adicionar/editar */}
      {(showAddForm || editingPlayer) && (
        <form onSubmit={editingPlayer ? handleUpdatePlayer : handleAddPlayer} className="bg-green-50 p-3 md:p-4 rounded-lg mb-3 md:mb-4">
          <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3 text-green-800">
            {editingPlayer ? 'Editar Jogador' : 'Novo Jogador'}
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
                placeholder="Nome do jogador"
                required
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nota (0-5)</label>
              <select
                value={newPlayerRating}
                onChange={(e) => setNewPlayerRating(parseFloat(e.target.value))}
                className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
              >
                <option value={0}>0.0 - Muito Baixa</option>
                <option value={0.5}>0.5 - Muito Baixa+</option>
                <option value={1}>1.0 - Baixa</option>
                <option value={1.5}>1.5 - Baixa+</option>
                <option value={2}>2.0 - Regular</option>
                <option value={2.5}>2.5 - Regular+</option>
                <option value={3}>3.0 - Boa</option>
                <option value={3.5}>3.5 - Boa+</option>
                <option value={4}>4.0 - Muito Boa</option>
                <option value={4.5}>4.5 - Muito Boa+</option>
                <option value={5}>5.0 - Excelente</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                {editingPlayer ? 'Atualizar' : 'Adicionar'}
              </button>
              {editingPlayer && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Lista de jogadores com opções de editar/remover */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map(player => (
          <div key={player.id} className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">{player.name}</p>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-600">Nota:</p>
                <div className="flex items-center space-x-1">
                  <div className="flex items-center">
                    {renderStars(player.rating, 'text-lg')}
                  </div>
                  <span className="text-sm font-bold text-gray-700">({player.rating})</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(player)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                title="Editar"
              >
                ✏️
              </button>
              <button
                onClick={() => handleRemove(player)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
                title="Remover"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {players.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">⚽</div>
          <div className="text-xl font-semibold mb-2">Nenhum jogador cadastrado</div>
          <div className="text-sm">Clique em "Gerenciar Jogadores" para adicionar o primeiro jogador!</div>
        </div>
      )}
    </div>
  );
};