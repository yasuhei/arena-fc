
import { Player } from '../hooks/usePlayers';

type Position = 'ZAG' | 'MEI' | 'ATA';

interface TeamStats {
    rating: number;
    habilidade: number;
    positions: Record<Position, number>;
}

/**
 * Calcula as estatísticas de um time
 */
function getTeamStats(team: Player[]): TeamStats {
    return {
        rating: team.reduce(
            (sum, player) => sum + (player.rating || 0),
            0
        ),

        habilidade: team.reduce(
            (sum, player) => sum + (player.habilidade || 0),
            0
        ),

        positions: {
            ZAG: team.filter(
                player => player.posicao === 'ZAG'
            ).length,

            MEI: team.filter(
                player => player.posicao === 'MEI'
            ).length,

            ATA: team.filter(
                player => player.posicao === 'ATA'
            ).length
        }
    };
}

/**
 * Calcula o quanto dois times estão diferentes.
 *
 * Quanto MENOR o valor, mais equilibrados estão.
 */
function calculateDifference(
    teamA: Player[],
    teamB: Player[]
): number {

    const statsA = getTeamStats(teamA);
    const statsB = getTeamStats(teamB);

    // Diferença de nota
    const ratingDifference = Math.abs(
        statsA.rating - statsB.rating
    );

    // Diferença de habilidade
    const habilidadeDifference = Math.abs(
        statsA.habilidade - statsB.habilidade
    );

    // Diferença de ZAG
    const zagDifference = Math.abs(
        statsA.positions.ZAG -
        statsB.positions.ZAG
    );

    // Diferença de MEI
    const meiDifference = Math.abs(
        statsA.positions.MEI -
        statsB.positions.MEI
    );

    // Diferença de ATA
    const ataDifference = Math.abs(
        statsA.positions.ATA -
        statsB.positions.ATA
    );

    /*
     * PESOS
     *
     * Habilidade = 4
     * Nota       = 3
     * Posição    = 8
     *
     * Posição recebe peso alto porque não adianta
     * um time ter 3 atacantes e o outro nenhum.
     */
    return (
        ratingDifference * 3 +
        habilidadeDifference * 4 +
        zagDifference * 8 +
        meiDifference * 8 +
        ataDifference * 8
    );
}

/**
 * Melhora os times tentando trocar jogadores.
 *
 * Depois da primeira distribuição,
 * testa trocas entre jogadores de times diferentes.
 */
function improveTeams(
    teams: Player[][]
): void {

    if (teams.length < 2) {
        return;
    }

    let improved = true;
    let iterations = 0;

    while (improved && iterations < 100) {

        improved = false;
        iterations++;

        for (
            let teamAIndex = 0;
            teamAIndex < teams.length;
            teamAIndex++
        ) {

            for (
                let teamBIndex = teamAIndex + 1;
                teamBIndex < teams.length;
                teamBIndex++
            ) {

                const teamA = teams[teamAIndex];
                const teamB = teams[teamBIndex];

                const currentDifference =
                    calculateDifference(
                        teamA,
                        teamB
                    );

                for (
                    let playerAIndex = 0;
                    playerAIndex < teamA.length;
                    playerAIndex++
                ) {

                    for (
                        let playerBIndex = 0;
                        playerBIndex < teamB.length;
                        playerBIndex++
                    ) {

                        const playerA =
                            teamA[playerAIndex];

                        const playerB =
                            teamB[playerBIndex];

                        /*
                         * Troca temporariamente
                         */
                        teamA[playerAIndex] = playerB;
                        teamB[playerBIndex] = playerA;

                        const newDifference =
                            calculateDifference(
                                teamA,
                                teamB
                            );

                        /*
                         * Se ficou melhor,
                         * mantém a troca.
                         */
                        if (
                            newDifference <
                            currentDifference
                        ) {

                            improved = true;

                        } else {

                            /*
                             * Se piorou,
                             * desfaz.
                             */
                            teamA[playerAIndex] = playerA;
                            teamB[playerBIndex] = playerB;
                        }
                    }
                }
            }
        }
    }
}

/**
 * Cria os times balanceados.
 *
 * Critérios:
 *
 * 1. Habilidade
 * 2. Nota
 * 3. Posição
 */
export function createBalancedTeams(
    selected: Set<string>,
    players: Player[]
): Player[][] {

    const available = players.filter(
        player => selected.has(player.id)
    );

    const total = available.length;

    /*
     * Menos de 6 jogadores não permite
     * montar um time.
     */
    if (total < 6) {
        return [];
    }

    let teamSize = 6;
    let numTeams = 2;

    /*
     * Regras atuais do aplicativo
     */
    if (total === 12) {

        numTeams = 2;
        teamSize = 6;

    } else if (
        total >= 13 &&
        total <= 14
    ) {

        numTeams = 3;
        teamSize = 6;

    } else if (total === 15) {

        numTeams = 3;
        teamSize = 5;

    } else if (total > 15) {

        numTeams = 3;
        teamSize = Math.ceil(total / 3);

    } else if (
        total >= 6 &&
        total <= 11
    ) {

        numTeams = 2;
        teamSize = Math.ceil(total / 2);
    }

    const teams: Player[][] =
        Array.from(
            { length: numTeams },
            () => []
        );

    /**
     * Calcula a força geral do jogador.
     *
     * Habilidade tem peso maior que nota.
     */
    const getPlayerStrength = (
        player: Player
    ) => {

        return (
            (player.habilidade || 0) * 0.6 +
            (player.rating || 0) * 0.4
        );
    };

    /**
     * Jogadores mais fortes primeiro.
     */
    const sortedPlayers = [...available].sort(
        (a, b) =>
            getPlayerStrength(b) -
            getPlayerStrength(a)
    );

    /**
     * Distribuição inicial
     */
    for (const player of sortedPlayers) {

        let bestTeamIndex = -1;
        let bestScore = Infinity;

        for (
            let teamIndex = 0;
            teamIndex < numTeams;
            teamIndex++
        ) {

            const team = teams[teamIndex];

            /*
             * Não ultrapassar o tamanho máximo
             */
            if (team.length >= teamSize) {
                continue;
            }

            const stats =
                getTeamStats(team);

            /*
             * Quantidade atual da posição
             */
            const positionCount =
                stats.positions[
                player.posicao
                ];

            /*
             * Força atual do time
             */
            const currentStrength =
                stats.habilidade * 0.6 +
                stats.rating * 0.4;

            /*
             * Penalização por concentração
             * de jogadores da mesma posição.
             */
            const positionPenalty =
                positionCount * 12;

            /*
             * Penalização por força.
             *
             * Times que já estão fortes
             * recebem uma penalização maior.
             */
            const strengthPenalty =
                currentStrength * 4;

            /*
             * Penalização por quantidade
             * de jogadores.
             */
            const sizePenalty =
                team.length * 3;

            const score =
                strengthPenalty +
                positionPenalty +
                sizePenalty;

            if (score < bestScore) {

                bestScore = score;
                bestTeamIndex = teamIndex;
            }
        }

        if (bestTeamIndex !== -1) {

            teams[bestTeamIndex].push(
                player
            );
        }
    }

    /*
     * Agora que todos os jogadores foram
     * distribuídos, fazemos uma segunda
     * rodada procurando trocas melhores.
     */
    improveTeams(teams);

    return teams.filter(
        team => team.length > 0
    );
}
