import { useState, useEffect } from 'react';

interface TimerProps {
  onTimeEnd?: () => void;
}

export const Timer = ({ onTimeEnd }: TimerProps) => {
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [timerPreset, setTimerPreset] = useState<number | null>(null);

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

  // Efeito para verificar se atingiu o preset
  useEffect(() => {
    if (timerPreset && timerSeconds >= timerPreset && timerRunning) {
      playWhistle();
      pauseTimer();
      if (onTimeEnd) onTimeEnd();
    }
  }, [timerSeconds, timerPreset, timerRunning, onTimeEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-gray-700 rounded-none p-6">
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
  );
};
