
import { Player } from '../hooks/usePlayers';

type Position = 'ZAG' | 'MEI' | 'ATA';

interface TeamStats {
    rating: number;
    habilidade: number;
    positions: Record<Position, number>;
}

/**
 * Retorna a posição do jogador.
 * Caso não exista, considera MEI para manter compatibilidade
 * com jogadores antigos.
 */
function getPosition(player: Player): Position {
    return player.posicao ?? 'MEI';
}

/**
 * Calcula as estatísticas de um time.
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
                player => getPosition(player) === 'ZAG'
            ).length,

            MEI: team.filter(
                player => getPosition(player) === 'MEI'
            ).length,

            ATA: team.filter(
                player => getPosition(player) === 'ATA'
            ).length
        }
    };
}

/**
 * Força individual do jogador.
 *
 * Habilidade possui peso maior que nota.
 */
function getPlayerStrength(player: Player): number {
    const habilidade = player.habilidade ?? player.rating ?? 0;
    const rating = player.rating ?? 0;

    return (
        habilidade * 0.6 +
        rating * 0.4
    );
}

/**
 * Calcula diferença entre dois times.
 */
function calculateTeamDifference(
    teamA: Player[],
    teamB: Player[]
): number {

    const statsA = getTeamStats(teamA);
    const statsB = getTeamStats(teamB);

    const ratingDifference = Math.abs(
        statsA.rating - statsB.rating
    );

    const habilidadeDifference = Math.abs(
        statsA.habilidade - statsB.habilidade
    );

    const zagDifference = Math.abs(
        statsA.positions.ZAG -
        statsB.positions.ZAG
    );

    const meiDifference = Math.abs(
        statsA.positions.MEI -
        statsB.positions.MEI
    );

    const ataDifference = Math.abs(
        statsA.positions.ATA -
        statsB.positions.ATA
    );

    return (
        ratingDifference * 3 +
        habilidadeDifference * 4 +
        zagDifference * 8 +
        meiDifference * 8 +
        ataDifference * 8
    );
}

/**
 * Calcula a diferença geral entre todos os times.
 */
function calculateGlobalBalance(
    teams: Player[][]
): number {

    let score = 0;

    for (
        let i = 0;
        i < teams.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < teams.length;
            j++
        ) {

            score += calculateTeamDifference(
                teams[i],
                teams[j]
            );
        }
    }

    return score;
}

/**
 * Cria uma chave única para uma dupla.
 *
 * Ex:
 * Miguel + Allan
 *
 * sempre vira:
 * allan|miguel
 */
function getPairKey(
    playerA: Player,
    playerB: Player
): string {

    return [
        playerA.id,
        playerB.id
    ]
        .sort()
        .join('|');
}

/**
 * Conta quantas vezes uma dupla já jogou junta.
 */
function getPairCount(
    playerA: Player,
    playerB: Player,
    pairHistory: Map<string, number>
): number {

    const key = getPairKey(
        playerA,
        playerB
    );

    return pairHistory.get(key) ?? 0;
}

/**
 * Calcula a penalização de repetição
 * de jogadores dentro de um time.
 *
 * Quanto mais pessoas daquele time já
 * jogaram juntas anteriormente,
 * maior a penalização.
 */
function calculateRepetitionPenalty(
    team: Player[],
    pairHistory: Map<string, number>
): number {

    let penalty = 0;

    for (
        let i = 0;
        i < team.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < team.length;
            j++
        ) {

            const repetitions =
                getPairCount(
                    team[i],
                    team[j],
                    pairHistory
                );

            /*
             * 1 repetição = penalização alta
             * 2 repetições = penalização ainda maior
             */
            if (repetitions === 1) {
                penalty += 100;
            }

            if (repetitions >= 2) {
                penalty += 300;
            }
        }
    }

    return penalty;
}

/**
 * Registra todas as duplas dos times
 * no histórico.
 */
function registerTeamsInHistory(
    teams: Player[][],
    pairHistory: Map<string, number>
): void {

    for (const team of teams) {

        for (
            let i = 0;
            i < team.length;
            i++
        ) {

            for (
                let j = i + 1;
                j < team.length;
                j++
            ) {

                const key = getPairKey(
                    team[i],
                    team[j]
                );

                pairHistory.set(
                    key,
                    (pairHistory.get(key) ?? 0) + 1
                );
            }
        }
    }
}

/**
 * Verifica se o time possui posições razoavelmente equilibradas.
 */
function calculatePositionPenalty(
    team: Player[]
): number {

    const stats = getTeamStats(team);

    const counts = [
        stats.positions.ZAG,
        stats.positions.MEI,
        stats.positions.ATA
    ];

    const max = Math.max(...counts);
    const min = Math.min(...counts);

    /*
     * Quanto maior a diferença entre posições,
     * maior a penalização.
     */
    return (max - min) * 15;
}

/**
 * Cria uma opção de times.
 *
 * O pairHistory informa quais jogadores
 * já jogaram juntos nas opções anteriores.
 */
function generateOption(
    players: Player[],
    numTeams: number,
    teamSize: number,
    pairHistory: Map<string, number>
): Player[][] {

    const teams: Player[][] =
        Array.from(
            { length: numTeams },
            () => []
        );

    /**
     * Jogadores mais fortes primeiro.
     *
     * Adicionamos uma pequena variação aleatória
     * para que as opções não sejam idênticas.
     */
    const sortedPlayers = [...players].sort(
        (a, b) => {

            const strengthA =
                getPlayerStrength(a);

            const strengthB =
                getPlayerStrength(b);

            return (
                strengthB -
                strengthA +
                (Math.random() - 0.5) * 0.15
            );
        }
    );

    /**
     * Distribuição jogador por jogador.
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

            if (team.length >= teamSize) {
                continue;
            }

            /*
             * Faz uma simulação adicionando
             * o jogador ao time.
             */
            const simulatedTeam = [
                ...team,
                player
            ];

            /*
             * Força atual do time.
             */
            const stats =
                getTeamStats(
                    simulatedTeam
                );

            const strength =
                stats.rating * 3 +
                stats.habilidade * 4;

            /*
             * Repetição de jogadores.
             */
            const repetitionPenalty =
                calculateRepetitionPenalty(
                    simulatedTeam,
                    pairHistory
                );

            /*
             * Equilíbrio de posições.
             */
            const positionPenalty =
                calculatePositionPenalty(
                    simulatedTeam
                );

            /*
             * Pequena penalização para quantidade
             * de jogadores.
             */
            const sizePenalty =
                simulatedTeam.length * 2;

            const score =
                strength +
                repetitionPenalty +
                positionPenalty +
                sizePenalty;

            /*
             * Pequena aleatoriedade para evitar
             * gerar sempre exatamente os mesmos times.
             */
            const randomFactor =
                Math.random() * 8;

            const finalScore =
                score + randomFactor;

            if (
                finalScore <
                bestScore
            ) {

                bestScore =
                    finalScore;

                bestTeamIndex =
                    teamIndex;
            }
        }

        if (bestTeamIndex !== -1) {

            teams[bestTeamIndex].push(
                player
            );
        }
    }

    return teams;
}

/**
 * Melhora os times através de trocas.
 *
 * O algoritmo tenta trocar jogadores de times
 * diferentes e só mantém a troca quando:
 *
 * 1. melhora o equilíbrio;
 * 2. reduz repetições;
 * 3. mantém posições razoáveis.
 */
function improveTeams(
    teams: Player[][],
    pairHistory: Map<string, number>
): void {

    let improved = true;
    let iterations = 0;

    while (
        improved &&
        iterations < 100
    ) {

        improved = false;
        iterations++;

        let currentScore =
            calculateCompleteScore(
                teams,
                pairHistory
            );

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

                const teamA =
                    teams[teamAIndex];

                const teamB =
                    teams[teamBIndex];

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
                         * Troca.
                         */
                        teamA[playerAIndex] =
                            playerB;

                        teamB[playerBIndex] =
                            playerA;

                        const newScore =
                            calculateCompleteScore(
                                teams,
                                pairHistory
                            );

                        if (
                            newScore <
                            currentScore
                        ) {

                            currentScore =
                                newScore;

                            improved = true;

                        } else {

                            /*
                             * Desfaz.
                             */
                            teamA[playerAIndex] =
                                playerA;

                            teamB[playerBIndex] =
                                playerB;
                        }
                    }
                }
            }
        }
    }
}

/**
 * Score completo.
 *
 * Aqui decidimos o que é importante:
 *
 * - equilíbrio dos times
 * - habilidade
 * - nota
 * - posições
 * - repetição de jogadores
 */
function calculateCompleteScore(
    teams: Player[][],
    pairHistory: Map<string, number>
): number {

    let score =
        calculateGlobalBalance(
            teams
        );

    /*
     * Penalização por repetição.
     */
    for (const team of teams) {

        score +=
            calculateRepetitionPenalty(
                team,
                pairHistory
            );

        score +=
            calculatePositionPenalty(
                team
            );
    }

    return score;
}

/**
 * Cria várias opções de times.
 *
 * IMPORTANTE:
 *
 * Essa é a função que você deve usar
 * para gerar as 3 opções.
 */
export function createMultipleBalancedTeams(
    selected: Set<string>,
    players: Player[],
    numberOfOptions: number = 3
): Player[][][] {

    const available =
        players.filter(
            player =>
                selected.has(player.id)
        );

    const total =
        available.length;

    if (total < 6) {
        return [];
    }

    let teamSize = 6;
    let numTeams = 2;

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
        teamSize =
            Math.ceil(total / 3);

    } else if (
        total >= 6 &&
        total <= 11
    ) {

        numTeams = 2;

        teamSize =
            Math.ceil(total / 2);
    }

    /*
     * Histórico de duplas.
     *
     * Ex:
     *
     * Miguel + Allan = 1
     *
     * significa que eles já jogaram juntos
     * em uma opção.
     */
    const pairHistory =
        new Map<string, number>();

    const options: Player[][][] = [];

    for (
        let optionIndex = 0;
        optionIndex < numberOfOptions;
        optionIndex++
    ) {

        let bestOption: Player[][] | null =
            null;

        let bestScore = Infinity;

        /*
         * Geramos várias possibilidades e
         * pegamos a melhor.
         *
         * Isso evita depender de uma única
         * distribuição aleatória.
         */
        const attempts =
            optionIndex === 0
                ? 150
                : 300;

        for (
            let attempt = 0;
            attempt < attempts;
            attempt++
        ) {

            const candidate =
                generateOption(
                    available,
                    numTeams,
                    teamSize,
                    pairHistory
                );

            /*
             * Garante que todos os jogadores
             * foram distribuídos.
             */
            const valid =
                candidate.every(
                    team =>
                        team.length <=
                        teamSize
                );

            if (!valid) {
                continue;
            }

            const score =
                calculateCompleteScore(
                    candidate,
                    pairHistory
                );

            if (
                score < bestScore
            ) {

                bestScore = score;
                bestOption = candidate;
            }
        }

        /*
         * Caso não tenha encontrado opção,
         * cria uma diretamente.
         */
        if (!bestOption) {

            bestOption =
                generateOption(
                    available,
                    numTeams,
                    teamSize,
                    pairHistory
                );
        }

        /*
         * Adiciona a opção.
         */
        options.push(
            bestOption
        );

        /*
         * MUITO IMPORTANTE:
         *
         * Agora registramos as duplas
         * dessa opção.
         *
         * A próxima opção saberá que
         * essas pessoas já jogaram juntas.
         */
        registerTeamsInHistory(
            bestOption,
            pairHistory
        );
    }

    return options;
}

/**
 * Mantém compatibilidade com seu código antigo.
 *
 * Se algum componente ainda chamar:
 *
 * createBalancedTeams(...)
 *
 * ele continua funcionando.
 */
export function createBalancedTeams(
    selected: Set<string>,
    players: Player[]
): Player[][] {

    const options =
        createMultipleBalancedTeams(
            selected,
            players,
            1
        );

    return options[0] ?? [];
}

