import { Player } from '../hooks/usePlayers';

function normalizeName(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

export function createBalancedTeams(
    selected: Set<string>,
    players: Player[]
): Player[][] {
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

    const teams: Player[][] = Array.from(
        { length: numTeams },
        () => []
    );

    // =====================================================
    // IDENTIFICA JOGADORES ESPECÍFICOS
    // =====================================================

    const getPlayer = (name: string): Player | undefined => {
        const normalizedName = normalizeName(name);

        return available.find(
            player => normalizeName(player.name) === normalizedName
        );
    };

    const fernando = getPlayer('Fernando');
    const fabiano = getPlayer('Fabiano');
    const guilherme = getPlayer('Guilherme');

    const restrictedPlayers = [
        fernando,
        fabiano,
        guilherme
    ].filter((player): player is Player => !!player);

    // =====================================================
    // DISTRIBUIÇÃO DOS JOGADORES ESPECIAIS
    // =====================================================

    if (numTeams === 3) {
        /*
         * Com 3 times:
        
         *
         * Time 1 → Fernando
         * Time 2 → Fabiano
         * Time 3 → Guilherme
         */

        if (fernando) {
            teams[0].push(fernando);
        }

        if (fabiano) {
            teams[1].push(fabiano);
        }

        if (guilherme) {
            teams[2].push(guilherme);
        }
    } else {
        /*
         * Com 2 times:
         *
         * Time 1 → Fernando + Guilherme
         * Time 2 → Fabiano
         */

        if (fernando) {
            teams[0].push(fernando);
        }

        if (guilherme) {
            teams[0].push(guilherme);
        }

        if (fabiano) {
            teams[1].push(fabiano);
        }
    }

    // =====================================================
    // REMOVE OS JOGADORES ESPECIAIS DA LISTA
    // =====================================================

    const restrictedIds = new Set(
        restrictedPlayers.map(player => player.id)
    );

    // Ordenar jogadores restantes por rating
    const normalPlayers = available
        .filter(player => !restrictedIds.has(player.id))
        .sort((a, b) => b.rating - a.rating);

    // =====================================================
    // DISTRIBUIÇÃO BALANCEADA DOS DEMAIS JOGADORES
    // =====================================================

    for (const player of normalPlayers) {
        const teamSums = teams.map(team =>
            team.reduce((sum, p) => sum + p.rating, 0)
        );

        let targetTeamIndex = -1;
        let minSum = Infinity;

        // Procurar o time com menor rating acumulado
        for (let i = 0; i < numTeams; i++) {
            if (
                teams[i].length < teamSize &&
                teamSums[i] < minSum
            ) {
                minSum = teamSums[i];
                targetTeamIndex = i;
            }
        }

        // Fallback caso necessário
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
