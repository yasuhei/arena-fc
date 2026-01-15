import { Player } from '../hooks/usePlayers';

export function shareTeamsOnWhatsApp(teams: Player[][]) {
    // Formata a mensagem
    let message = '⚽ *SEM PANELA FC* ⚽\n\n';
    message += '🏆 *TEAMS FORMED* 🏆\n\n';

    teams.forEach((team, idx) => {
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
}
