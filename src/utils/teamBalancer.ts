import { Player } from '../hooks/usePlayers';

export function createBalancedTeams(selected: Set<string>, players: Player[]): Player[][] {
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
    for (const player of sortedPlayers) {
        const teamSums = teams.map(team =>
            team.reduce((sum, p) => sum + p.rating, 0)
        );

        let targetTeamIndex = -1;
        let minSum = Infinity;

        for (let i = 0; i < numTeams; i++) {
            if (teams[i].length < teamSize && teamSums[i] < minSum) {
                minSum = teamSums[i];
                targetTeamIndex = i;
            }
        }

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
