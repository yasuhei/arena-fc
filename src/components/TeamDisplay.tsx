import { Player } from '../hooks/usePlayers';
import { StarRating } from './StarRating';

interface TeamDisplayProps {
  teams: Player[][];
  showRatings?: boolean;
  showSwapButtons?: boolean;
  onSwapPlayer?: (player: Player, fromTeam: number, toTeam: number) => void;
  compact?: boolean;
}

export const TeamDisplay = ({ 
  teams, 
  showRatings = true, 
  showSwapButtons = false,
  onSwapPlayer,
  compact = false
}: TeamDisplayProps) => {
  return (
    <div className="flex space-x-2 overflow-x-auto pb-2 justify-center">
      {teams.map((team, tIdx) => {
        const teamRatingSum = team.reduce((sum, player) => sum + player.rating, 0);
        const teamAverage = team.length > 0 ? (teamRatingSum / team.length).toFixed(1) : '0.0';
        
        return (
          <div 
            key={tIdx} 
            className={`bg-black border-2 border-gray-600 rounded-none p-${compact ? '2' : '3'} shadow-2xl hover:border-white transition-all flex-shrink-0 ${compact ? 'w-32 md:w-40' : 'w-32 md:w-48'}`}
          >
            <h4 className="font-black text-xs mb-2 text-center text-white bg-gray-800 py-1 uppercase tracking-wider">
              TEAM {tIdx + 1}
            </h4>
            <ul className="space-y-1">
              {team.map(player => (
                <li key={player.id} className="bg-gray-900 rounded-none px-2 py-1 text-xs shadow-sm">
                  <div className={showSwapButtons ? "flex items-center justify-between gap-1" : ""}>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold truncate block text-xs text-white uppercase">{player.name}</span>
                      {showRatings && (
                        <>
                          <div className="flex items-center justify-center mt-0.5">
                            <StarRating rating={player.rating} size="text-xs" />
                          </div>
                          <span className="text-xs font-black text-center block text-gray-400">({player.rating})</span>
                        </>
                      )}
                    </div>
                    {showSwapButtons && onSwapPlayer && (
                      <div className="flex flex-col gap-0.5">
                        {teams.map((_, targetIdx) => targetIdx !== tIdx && (
                          <button
                            key={targetIdx}
                            onClick={() => onSwapPlayer(player, tIdx, targetIdx)}
                            className="bg-gray-700 hover:bg-gray-600 text-white w-6 h-6 rounded-none text-xs font-black transition-all flex items-center justify-center"
                            title={`Move to Team ${targetIdx + 1}`}
                          >
                            {targetIdx + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {showRatings && (
              <div className="mt-2 text-center bg-gray-900 p-2">
                <div className="text-xs text-gray-400 space-y-1">
                  <div className="uppercase tracking-wide">Total: <span className="font-black text-white">{teamRatingSum}</span></div>
                  <div className="uppercase tracking-wide">Avg: <span className="font-black text-white">{teamAverage}</span></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
