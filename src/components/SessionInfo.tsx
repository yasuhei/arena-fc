import { getSessionId } from '../utils/sessionId';

const SessionInfo = () => {
  const sessionId = getSessionId();
  
  // Só mostrar em desenvolvimento
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white text-xs p-2 rounded opacity-50 hover:opacity-100 transition-opacity">
      <div>Sessão: {sessionId.slice(-8)}</div>
      <div className="text-gray-400">Seus dados são privados</div>
    </div>
  );
};

export default SessionInfo;