
import { Player } from '../hooks/usePlayers';

type Position = 'ZAG' | 'MEI' | 'ATA';

interface TeamStats {
    rating: number;
    habilidade: number;
    resistencia: number;
    strength: number;
    positions: Record<Position, number>;
}

type PlayerTeamHistory = Map<string, Set<number>>;

/**
 * Resultado de tentar gerar UMA opção.
 *
 * `relaxed` indica se foi necessário afrouxar a regra
 * de "grupo repetido" (ver FALLBACK abaixo) para
 * conseguir encontrar essa opção.
 */
interface OptionAttemptResult {
    teams: Player[][];
    relaxed: boolean;
}

/**
 * ============================================================
 * CONFIGURAÇÕES
 * ============================================================
 */

const OPTIONS_TO_GENERATE = 3;

/**
 * Quantidade de candidatos.
 *
 * Como agora fazemos validação rígida,
 * precisamos testar bastante combinações.
 *
 * O valor de CANDIDATES_NEXT_OPTIONS foi aumentado
 * (15000 -> 30000) porque, com grupos menores de
 * jogadores (ex: 18-20 pessoas), o espaço de
 * combinações que respeitam todas as regras ao mesmo
 * tempo é pequeno, e a 3ª opção às vezes não era
 * encontrada dentro do limite antigo.
 */
const CANDIDATES_FIRST_OPTION = 3000;
const CANDIDATES_NEXT_OPTIONS = 30000;

/**
 * Uma dupla pode aparecer junta no máximo
 * em 2 opções.
 *
 * Ex:
 *
 * Opção 1 -> juntos
 * Opção 2 -> separados
 * Opção 3 -> juntos
 *
 * OK.
 *
 * Opção 1 -> juntos
 * Opção 2 -> juntos
 * Opção 3 -> juntos
 *
 * PROIBIDO.
 */
const MAX_PAIR_REPETITIONS = 2;

/**
 * Não permitimos que mais de 2 jogadores
 * do mesmo time anterior permaneçam juntos.
 *
 * Ex:
 *
 * Opção 1:
 * A B C D E F
 *
 * Opção 2:
 * A B C X Y Z
 *
 * 3 repetidos = PROIBIDO (por padrão).
 */
const MAX_REPEATED_GROUP = 2;

/**
 * ============================================================
 * FALLBACK (grupo repetido)
 * ============================================================
 *
 * Se, mesmo com CANDIDATES_NEXT_OPTIONS tentativas,
 * não for possível encontrar uma opção respeitando
 * MAX_REPEATED_GROUP, tentamos UMA VEZ MAIS afrouxando
 * esse limite em +1 (ex: de 2 para 3).
 *
 * Isso é sempre um último recurso: preferimos sempre a
 * regra rígida. O fallback só entra em ação se a regra
 * rígida genuinamente não encontrar nada, e a opção
 * gerada dessa forma vem marcada com `relaxed: true`
 * para a UI poder avisar o usuário.
 *
 * A dupla (MAX_PAIR_REPETITIONS) e o "jogador parado no
 * mesmo time" (hasForbiddenMovement) NUNCA são
 * relaxados — só o tamanho do maior grupo repetido.
 */
const FALLBACK_MAX_REPEATED_GROUP = MAX_REPEATED_GROUP + 1;

/**
 * ============================================================
 * IDENTIDADE
 * ============================================================
 */

function getPlayerKey(player: Player): string {
    return player.name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/**
 * ============================================================
 * POSIÇÃO
 * ============================================================
 */

function getPosition(player: Player): Position {
    return player.posicao ?? 'MEI';
}

/**
 * ============================================================
 * VALORES
 * ============================================================
 */

function getRating(player: Player): number {
    return player.rating ?? 0;
}

function getHabilidade(player: Player): number {
    return player.habilidade ?? player.rating ?? 0;
}

function getResistencia(player: Player): number {
    const playerWithResistance =
        player as Player & {
            resistencia?: number;
        };

    return (
        playerWithResistance.resistencia ??
        player.rating ??
        0
    );
}

/**
 * ============================================================
 * FORÇA DO JOGADOR
 * ============================================================
 *
 * Habilidade = 50%
 * Nota = 30%
 * Resistência = 20%
 */
function getPlayerStrength(player: Player): number {
    return (
        getHabilidade(player) * 0.5 +
        getRating(player) * 0.3 +
        getResistencia(player) * 0.2
    );
}

/**
 * ============================================================
 * ESTATÍSTICAS DO TIME
 * ============================================================
 */

function getTeamStats(team: Player[]): TeamStats {
    return {
        rating: team.reduce(
            (sum, player) =>
                sum + getRating(player),
            0
        ),

        habilidade: team.reduce(
            (sum, player) =>
                sum + getHabilidade(player),
            0
        ),

        resistencia: team.reduce(
            (sum, player) =>
                sum + getResistencia(player),
            0
        ),

        strength: team.reduce(
            (sum, player) =>
                sum + getPlayerStrength(player),
            0
        ),

        positions: {
            ZAG: team.filter(
                player =>
                    getPosition(player) === 'ZAG'
            ).length,

            MEI: team.filter(
                player =>
                    getPosition(player) === 'MEI'
            ).length,

            ATA: team.filter(
                player =>
                    getPosition(player) === 'ATA'
            ).length
        }
    };
}

/**
 * ============================================================
 * CHAVE DA DUPLA
 * ============================================================
 */

function getPairKey(
    playerA: Player,
    playerB: Player
): string {
    return [
        getPlayerKey(playerA),
        getPlayerKey(playerB)
    ]
        .sort()
        .join('|');
}

/**
 * ============================================================
 * CHAVE DO TIME
 * ============================================================
 */

function getTeamKey(team: Player[]): string {
    return team
        .map(getPlayerKey)
        .sort()
        .join('|');
}

/**
 * ============================================================
 * CHAVE DA OPÇÃO
 * ============================================================
 *
 * A ordem dos times não importa para detectar
 * uma opção exatamente igual.
 */
function getOptionKey(
    teams: Player[][]
): string {
    return teams
        .map(getTeamKey)
        .sort()
        .join('||');
}

/**
 * ============================================================
 * HISTÓRICO DE DUPLAS
 * ============================================================
 */

function buildPairHistory(
    previousOptions: Player[][][]
): Map<string, number> {

    const history =
        new Map<string, number>();

    for (
        const option of previousOptions
    ) {

        for (
            const team of option
        ) {

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

                    const key =
                        getPairKey(
                            team[i],
                            team[j]
                        );

                    history.set(
                        key,
                        (history.get(key) ?? 0) + 1
                    );
                }
            }
        }
    }

    return history;
}

/**
 * ============================================================
 * HISTÓRICO DE TIMES
 * ============================================================
 */

function buildPlayerTeamHistory(
    previousOptions: Player[][][]
): PlayerTeamHistory {

    const history:
        PlayerTeamHistory =
        new Map();

    for (
        const option of previousOptions
    ) {

        for (
            let teamIndex = 0;
            teamIndex < option.length;
            teamIndex++
        ) {

            for (
                const player of option[teamIndex]
            ) {

                const key =
                    getPlayerKey(player);

                if (
                    !history.has(key)
                ) {

                    history.set(
                        key,
                        new Set<number>()
                    );
                }

                history
                    .get(key)!
                    .add(teamIndex);
            }
        }
    }

    return history;
}

/**
 * ============================================================
 * MAIOR GRUPO REPETIDO
 * ============================================================
 */

function getLargestRepeatedGroup(
    team: Player[],
    previousOptions: Player[][][]
): number {

    let largestGroup = 0;

    const currentPlayers =
        new Set(
            team.map(getPlayerKey)
        );

    for (
        const option of previousOptions
    ) {

        for (
            const previousTeam of option
        ) {

            const previousPlayers =
                new Set(
                    previousTeam.map(
                        getPlayerKey
                    )
                );

            let repeated = 0;

            for (
                const playerKey of currentPlayers
            ) {

                if (
                    previousPlayers.has(
                        playerKey
                    )
                ) {

                    repeated++;
                }
            }

            largestGroup =
                Math.max(
                    largestGroup,
                    repeated
                );
        }
    }

    return largestGroup;
}

/**
 * ============================================================
 * DUPLA PROIBIDA
 * ============================================================
 *
 * Essa regra NUNCA é relaxada pelo fallback.
 */

function hasForbiddenPair(
    team: Player[],
    pairHistory: Map<string, number>
): boolean {

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

            const key =
                getPairKey(
                    team[i],
                    team[j]
                );

            const count =
                pairHistory.get(key) ?? 0;

            /**
             * Se já ficaram juntos em 2 opções,
             * não podem ficar juntos novamente.
             */
            if (
                count >=
                MAX_PAIR_REPETITIONS
            ) {

                return true;
            }
        }
    }

    return false;
}

/**
 * ============================================================
 * JOGADOR NO MESMO TIME 3 VEZES
 * ============================================================
 *
 * Essa regra NUNCA é relaxada pelo fallback.
 */

function hasForbiddenMovement(
    team: Player[],
    teamIndex: number,
    optionIndex: number,
    playerTeamHistory: PlayerTeamHistory
): boolean {

    /**
     * Só existe risco real na terceira opção.
     */
    if (
        optionIndex < 2
    ) {

        return false;
    }

    for (
        const player of team
    ) {

        const key =
            getPlayerKey(player);

        const history =
            playerTeamHistory.get(key);

        if (!history) {
            continue;
        }

        /**
         * Se o jogador só apareceu anteriormente
         * naquele mesmo número de time, ele está
         * prestes a ficar 3 vezes no mesmo time.
         */
        if (
            history.size === 1 &&
            history.has(teamIndex)
        ) {

            return true;
        }
    }

    return false;
}

/**
 * ============================================================
 * VALIDAÇÃO DE UM TIME
 * ============================================================
 */

function isValidTeam(
    team: Player[],
    teamIndex: number,
    optionIndex: number,
    teamSize: number,
    pairHistory: Map<string, number>,
    playerTeamHistory: PlayerTeamHistory,
    previousOptions: Player[][][],
    maxRepeatedGroup: number
): boolean {

    /**
     * Tamanho.
     */
    if (
        team.length !== teamSize
    ) {

        return false;
    }

    /**
     * Grupo repetido.
     */
    const repeatedGroup =
        getLargestRepeatedGroup(
            team,
            previousOptions
        );

    if (
        repeatedGroup >
        maxRepeatedGroup
    ) {

        return false;
    }

    /**
     * Dupla repetida.
     */
    if (
        hasForbiddenPair(
            team,
            pairHistory
        )
    ) {

        return false;
    }

    /**
     * Jogador parado no mesmo time.
     */
    if (
        hasForbiddenMovement(
            team,
            teamIndex,
            optionIndex,
            playerTeamHistory
        )
    ) {

        return false;
    }

    return true;
}

/**
 * ============================================================
 * VALIDAÇÃO COMPLETA DA OPÇÃO
 * ============================================================
 *
 * ESTA É A PARTE MAIS IMPORTANTE.
 *
 * Uma opção só entra se passar por TODAS
 * as regras.
 */
function isValidOption(
    teams: Player[][],
    players: Player[],
    numTeams: number,
    teamSize: number,
    optionIndex: number,
    previousOptions: Player[][][],
    pairHistory: Map<string, number>,
    playerTeamHistory: PlayerTeamHistory,
    maxRepeatedGroup: number
): boolean {

    /**
     * Número correto de times.
     */
    if (
        teams.length !== numTeams
    ) {

        return false;
    }

    /**
     * Todos os times precisam ter
     * a quantidade correta.
     */
    if (
        teams.some(
            team =>
                team.length !==
                teamSize
        )
    ) {

        return false;
    }

    /**
     * Todos os jogadores da opção.
     */
    const optionPlayerKeys =
        teams
            .flat()
            .map(getPlayerKey);

    /**
     * Não pode haver jogador duplicado.
     */
    if (
        new Set(
            optionPlayerKeys
        ).size !==
        optionPlayerKeys.length
    ) {

        return false;
    }

    /**
     * Tem que conter exatamente
     * os jogadores selecionados.
     */
    const selectedPlayerKeys =
        new Set(
            players.map(getPlayerKey)
        );

    if (
        selectedPlayerKeys.size !==
        optionPlayerKeys.length
    ) {

        return false;
    }

    for (
        const key of selectedPlayerKeys
    ) {

        if (
            !optionPlayerKeys.includes(key)
        ) {

            return false;
        }
    }

    /**
     * Nenhum time pode ser igual
     * a outro dentro da mesma opção.
     */
    const teamKeys =
        teams.map(
            getTeamKey
        );

    if (
        new Set(teamKeys).size !==
        teamKeys.length
    ) {

        return false;
    }

    /**
     * Valida cada time.
     */
    for (
        let teamIndex = 0;
        teamIndex < teams.length;
        teamIndex++
    ) {

        if (
            !isValidTeam(
                teams[teamIndex],
                teamIndex,
                optionIndex,
                teamSize,
                pairHistory,
                playerTeamHistory,
                previousOptions,
                maxRepeatedGroup
            )
        ) {

            return false;
        }
    }

    /**
     * ========================================================
     * PROTEÇÃO EXTRA
     * ========================================================
     *
     * A opção inteira nunca pode ser idêntica
     * a uma opção anterior.
     */
    const currentOptionKey =
        getOptionKey(teams);

    for (
        const previousOption of
        previousOptions
    ) {

        const previousOptionKey =
            getOptionKey(
                previousOption
            );

        if (
            currentOptionKey ===
            previousOptionKey
        ) {

            return false;
        }
    }

    /**
     * ========================================================
     * PROTEÇÃO EXTRA 2
     * ========================================================
     *
     * Nenhum time atual pode conter mais jogadores
     * do que `maxRepeatedGroup` de qualquer time anterior.
     *
     * Fazemos essa verificação NOVAMENTE aqui,
     * independente das outras funções.
     */
    for (
        const currentTeam of teams
    ) {

        const currentKeys =
            new Set(
                currentTeam.map(
                    getPlayerKey
                )
            );

        for (
            const previousOption of
            previousOptions
        ) {

            for (
                const previousTeam of
                previousOption
            ) {

                const previousKeys =
                    new Set(
                        previousTeam.map(
                            getPlayerKey
                        )
                    );

                let repeated = 0;

                for (
                    const key of currentKeys
                ) {

                    if (
                        previousKeys.has(key)
                    ) {

                        repeated++;
                    }
                }

                /**
                 * Mais repetidos do que o permitido:
                 * PROIBIDO.
                 */
                if (
                    repeated >
                    maxRepeatedGroup
                ) {

                    return false;
                }
            }
        }
    }

    return true;
}

/**
 * ============================================================
 * SCORE DE EQUILÍBRIO
 * ============================================================
 */

function calculateBalanceScore(
    teams: Player[][]
): number {

    let score = 0;

    const stats =
        teams.map(
            getTeamStats
        );

    /**
     * Força geral.
     */
    for (
        let i = 0;
        i < stats.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < stats.length;
            j++
        ) {

            score +=
                Math.abs(
                    stats[i].strength -
                    stats[j].strength
                ) * 10;
        }
    }

    /**
     * Habilidade.
     */
    for (
        let i = 0;
        i < stats.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < stats.length;
            j++
        ) {

            score +=
                Math.abs(
                    stats[i].habilidade -
                    stats[j].habilidade
                ) * 6;
        }
    }

    /**
     * Nota.
     */
    for (
        let i = 0;
        i < stats.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < stats.length;
            j++
        ) {

            score +=
                Math.abs(
                    stats[i].rating -
                    stats[j].rating
                ) * 4;
        }
    }

    /**
     * Resistência.
     */
    for (
        let i = 0;
        i < stats.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < stats.length;
            j++
        ) {

            score +=
                Math.abs(
                    stats[i].resistencia -
                    stats[j].resistencia
                ) * 3;
        }
    }

    /**
     * Posições.
     */
    const positions:
        Position[] = [
            'ZAG',
            'MEI',
            'ATA'
        ];

    for (
        const position of positions
    ) {

        const counts =
            stats.map(
                stat =>
                    stat.positions[position]
            );

        const max =
            Math.max(...counts);

        const min =
            Math.min(...counts);

        score +=
            (max - min) * 100;
    }

    return score;
}

/**
 * ============================================================
 * SCORE DE REPETIÇÃO
 * ============================================================
 */

function calculatePairScore(
    teams: Player[][],
    pairHistory: Map<string, number>
): number {

    let score = 0;

    for (
        const team of teams
    ) {

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

                const key =
                    getPairKey(
                        team[i],
                        team[j]
                    );

                const count =
                    pairHistory.get(key) ?? 0;

                /**
                 * Uma repetição:
                 * permitido, mas preferimos evitar.
                 */
                if (
                    count === 1
                ) {

                    score += 10_000;
                }
            }
        }
    }

    return score;
}

/**
 * ============================================================
 * SCORE DE MOVIMENTAÇÃO
 * ============================================================
 */

function calculateMovementScore(
    teams: Player[][],
    playerTeamHistory: PlayerTeamHistory
): number {

    let score = 0;

    for (
        let teamIndex = 0;
        teamIndex < teams.length;
        teamIndex++
    ) {

        for (
            const player of teams[teamIndex]
        ) {

            const history =
                playerTeamHistory.get(
                    getPlayerKey(player)
                );

            if (!history) {
                continue;
            }

            /**
             * Preferimos que o jogador mude
             * de número de time.
             */
            if (
                history.has(teamIndex)
            ) {

                score += 1000;
            }
        }
    }

    return score;
}

/**
 * ============================================================
 * SCORE DE GRUPO REPETIDO
 * ============================================================
 *
 * Mesmo quando o fallback permite um grupo repetido
 * de tamanho FALLBACK_MAX_REPEATED_GROUP, ainda
 * preferimos, entre os candidatos aceitos, os que
 * tiverem o MENOR grupo repetido possível.
 */

function calculateRepeatedGroupScore(
    teams: Player[][],
    previousOptions: Player[][][]
): number {

    let worstGroup = 0;

    for (
        const team of teams
    ) {

        worstGroup =
            Math.max(
                worstGroup,
                getLargestRepeatedGroup(
                    team,
                    previousOptions
                )
            );
    }

    /**
     * Cada jogador repetido a mais custa muito caro
     * no score, para o algoritmo sempre preferir o
     * candidato mais "novo" possível.
     */
    return worstGroup * 50_000;
}

/**
 * ============================================================
 * SCORE FINAL
 * ============================================================
 */

function calculateOptionScore(
    teams: Player[][],
    pairHistory: Map<string, number>,
    playerTeamHistory: PlayerTeamHistory,
    previousOptions: Player[][][]
): number {

    return (
        calculateBalanceScore(
            teams
        ) +

        calculatePairScore(
            teams,
            pairHistory
        ) +

        calculateMovementScore(
            teams,
            playerTeamHistory
        ) +

        calculateRepeatedGroupScore(
            teams,
            previousOptions
        ) +

        Math.random() * 5
    );
}

/**
 * ============================================================
 * EMBARALHA ARRAY
 * ============================================================
 */

function shuffle<T>(
    array: T[]
): T[] {

    const result =
        [...array];

    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            result[i],
            result[j]
        ] = [
                result[j],
                result[i]
            ];
    }

    return result;
}

/**
 * ============================================================
 * GERA CANDIDATO
 * ============================================================
 *
 * Agora usamos uma distribuição
 * aleatória + balanceada.
 */
function generateCandidate(
    players: Player[],
    teamSizes: number[]
): Player[][] {

    /**
     * Ordena por força.
     */
    const ordered =
        [...players].sort(
            (a, b) =>
                getPlayerStrength(b) -
                getPlayerStrength(a)
        );

    /**
     * Cria os times.
     */
    const teams =
        teamSizes.map(
            () => [] as Player[]
        );

    /**
     * Alterna a direção da distribuição
     * para criar candidatos diferentes.
     */
    const direction =
        Math.random() < 0.5
            ? 1
            : -1;

    for (
        let index = 0;
        index < ordered.length;
        index++
    ) {

        const player =
            ordered[index];

        /**
         * Todos os times ainda disponíveis.
         */
        const availableTeams =
            teamSizes
                .map(
                    (_, teamIndex) =>
                        teamIndex
                )
                .filter(
                    teamIndex =>
                        teams[teamIndex]
                            .length <
                        teamSizes[teamIndex]
                );

        /**
         * Calcula a força atual.
         */
        const scoredTeams =
            availableTeams.map(
                teamIndex => {

                    const strength =
                        teams[teamIndex].reduce(
                            (sum, current) =>
                                sum +
                                getPlayerStrength(
                                    current
                                ),
                            0
                        );

                    return {
                        teamIndex,
                        strength
                    };
                }
            );

        /**
         * Ordena pela menor força.
         */
        scoredTeams.sort(
            (a, b) =>
                a.strength -
                b.strength
        );

        /**
         * Normalmente escolhe o mais fraco,
         * mas às vezes escolhe uma alternativa
         * para criar diversidade.
         */
        let selectedTeam =
            scoredTeams[0].teamIndex;

        if (
            scoredTeams.length > 1 &&
            Math.random() < 0.30
        ) {

            const alternative =
                direction === 1
                    ? 1
                    : Math.min(
                        2,
                        scoredTeams.length - 1
                    );

            selectedTeam =
                scoredTeams[
                    alternative
                ]?.teamIndex ??
                selectedTeam;
        }

        teams[selectedTeam].push(
            player
        );
    }

    /**
     * Embaralha jogadores dentro
     * dos times.
     */
    return teams.map(
        team =>
            shuffle(team)
    );
}

/**
 * ============================================================
 * ENCONTRA MELHOR OPÇÃO (para um maxRepeatedGroup específico)
 * ============================================================
 */

function findBestOptionWithLimit(
    players: Player[],
    teamSizes: number[],
    optionIndex: number,
    previousOptions: Player[][][],
    pairHistory: Map<string, number>,
    playerTeamHistory: PlayerTeamHistory,
    attempts: number,
    maxRepeatedGroup: number
): Player[][] | null {

    let bestOption:
        Player[][] | null = null;

    let bestScore =
        Infinity;

    const tested =
        new Set<string>();

    for (
        let attempt = 0;
        attempt < attempts;
        attempt++
    ) {

        const candidate =
            generateCandidate(
                players,
                teamSizes
            );

        /**
         * Chave para evitar duplicatas.
         */
        const candidateKey =
            getOptionKey(
                candidate
            );

        if (
            tested.has(candidateKey)
        ) {

            continue;
        }

        tested.add(
            candidateKey
        );

        /**
         * ====================================================
         * VALIDAÇÃO RÍGIDA
         * ====================================================
         */
        if (
            !isValidOption(
                candidate,
                players,
                teamSizes.length,
                teamSizes[0],
                optionIndex,
                previousOptions,
                pairHistory,
                playerTeamHistory,
                maxRepeatedGroup
            )
        ) {

            continue;
        }

        /**
         * ====================================================
         * SCORE
         * ====================================================
         */
        const score =
            calculateOptionScore(
                candidate,
                pairHistory,
                playerTeamHistory,
                previousOptions
            );

        if (
            score <
            bestScore
        ) {

            bestScore =
                score;

            bestOption =
                candidate;
        }
    }

    return bestOption;
}

/**
 * ============================================================
 * ENCONTRA MELHOR OPÇÃO (com fallback)
 * ============================================================
 *
 * 1ª tentativa: regra rígida (MAX_REPEATED_GROUP).
 *
 * Se não encontrar NADA nessa tentativa, faz uma 2ª
 * tentativa relaxando só o limite de grupo repetido
 * em +1 (FALLBACK_MAX_REPEATED_GROUP). As regras de
 * dupla e de "jogador parado no mesmo time" continuam
 * rígidas nas duas tentativas.
 */
function findBestOption(
    players: Player[],
    teamSizes: number[],
    optionIndex: number,
    previousOptions: Player[][][],
    pairHistory: Map<string, number>,
    playerTeamHistory: PlayerTeamHistory
): OptionAttemptResult | null {

    const attempts =
        optionIndex === 0
            ? CANDIDATES_FIRST_OPTION
            : CANDIDATES_NEXT_OPTIONS;

    /**
     * ========================================================
     * TENTATIVA 1: regra rígida.
     * ========================================================
     */
    const strictOption =
        findBestOptionWithLimit(
            players,
            teamSizes,
            optionIndex,
            previousOptions,
            pairHistory,
            playerTeamHistory,
            attempts,
            MAX_REPEATED_GROUP
        );

    if (
        strictOption
    ) {

        return {
            teams: strictOption,
            relaxed: false
        };
    }

    /**
     * ========================================================
     * TENTATIVA 2: fallback relaxado.
     * ========================================================
     *
     * Só entra em ação se a tentativa rígida não
     * encontrou absolutamente nada.
     */
    console.warn(
        `Opção ${optionIndex + 1}: não encontrada com a regra rígida (máx. ${MAX_REPEATED_GROUP} repetidos). ` +
        `Tentando fallback com máx. ${FALLBACK_MAX_REPEATED_GROUP} repetidos...`
    );

    const relaxedOption =
        findBestOptionWithLimit(
            players,
            teamSizes,
            optionIndex,
            previousOptions,
            pairHistory,
            playerTeamHistory,
            attempts,
            FALLBACK_MAX_REPEATED_GROUP
        );

    if (
        relaxedOption
    ) {

        console.warn(
            `Opção ${optionIndex + 1}: encontrada apenas com o fallback relaxado.`
        );

        return {
            teams: relaxedOption,
            relaxed: true
        };
    }

    return null;
}

/**
 * ============================================================
 * CONFIGURAÇÃO DOS TIMES
 * ============================================================
 *
 * Agora suporta corretamente quantidades
 * diferentes de jogadores.
 */
function getTeamSizes(
    total: number
): number[] {

    /**
     * 6-11:
     * 2 times.
     */
    if (
        total >= 6 &&
        total <= 11
    ) {

        const first =
            Math.ceil(
                total / 2
            );

        const second =
            total - first;

        return [
            first,
            second
        ];
    }

    /**
     * 12:
     * 6 + 6.
     */
    if (
        total === 12
    ) {

        return [
            6,
            6
        ];
    }

    /**
     * 13:
     * 5 + 4 + 4.
     */
    if (
        total === 13
    ) {

        return [
            5,
            4,
            4
        ];
    }

    /**
     * 14:
     * 5 + 5 + 4.
     */
    if (
        total === 14
    ) {

        return [
            5,
            5,
            4
        ];
    }

    /**
     * 15:
     * 5 + 5 + 5.
     */
    if (
        total === 15
    ) {

        return [
            5,
            5,
            5
        ];
    }

    /**
     * 16:
     * 6 + 5 + 5.
     */
    if (
        total === 16
    ) {

        return [
            6,
            5,
            5
        ];
    }

    /**
     * 17:
     * 6 + 6 + 5.
     */
    if (
        total === 17
    ) {

        return [
            6,
            6,
            5
        ];
    }

    /**
     * 18:
     * 6 + 6 + 6.
     */
    if (
        total === 18
    ) {

        return [
            6,
            6,
            6
        ];
    }

    /**
     * Acima de 18:
     * distribui entre 3 times.
     */
    const base =
        Math.floor(
            total / 3
        );

    const remainder =
        total % 3;

    return [
        base + (remainder >= 1 ? 1 : 0),
        base + (remainder >= 2 ? 1 : 0),
        base
    ];
}

/**
 * ============================================================
 * VALIDA TODAS AS OPÇÕES NO FINAL
 * ============================================================
 *
 * Essa função é uma última barreira.
 *
 * Mesmo que alguma alteração futura no algoritmo
 * permita uma opção inválida, ela será removida.
 *
 * Cada opção é revalidada com o MESMO limite de
 * grupo repetido que foi usado para gerá-la
 * (rígido ou relaxado pelo fallback).
 */
function validateAllOptions(
    options: Player[][][],
    relaxedFlags: boolean[],
    players: Player[],
    teamSizes: number[]
): { teams: Player[][][]; relaxed: boolean[] } {

    const validOptions:
        Player[][][] = [];

    const validRelaxedFlags:
        boolean[] = [];

    for (
        let optionIndex = 0;
        optionIndex < options.length;
        optionIndex++
    ) {

        const option =
            options[optionIndex];

        const previousOptions =
            validOptions;

        const pairHistory =
            buildPairHistory(
                previousOptions
            );

        const playerTeamHistory =
            buildPlayerTeamHistory(
                previousOptions
            );

        const maxRepeatedGroup =
            relaxedFlags[optionIndex]
                ? FALLBACK_MAX_REPEATED_GROUP
                : MAX_REPEATED_GROUP;

        const valid =
            isValidOption(
                option,
                players,
                teamSizes.length,
                teamSizes[0],
                optionIndex,
                previousOptions,
                pairHistory,
                playerTeamHistory,
                maxRepeatedGroup
            );

        if (
            valid
        ) {

            validOptions.push(
                option
            );

            validRelaxedFlags.push(
                relaxedFlags[optionIndex]
            );

        } else {

            console.warn(
                `Opção ${optionIndex + 1} foi descartada na validação final.`
            );
        }
    }

    return {
        teams: validOptions,
        relaxed: validRelaxedFlags
    };
}

/**
 * ============================================================
 * FUNÇÃO PRINCIPAL
 * ============================================================
 *
 * Retorna as opções de times.
 *
 * Cada opção pode ter sido gerada de forma "relaxada"
 * (ver FALLBACK_MAX_REPEATED_GROUP acima) se a regra
 * rígida genuinamente não encontrou nenhuma combinação
 * válida para aquela opção. Isso é raro e só acontece
 * com grupos de jogadores pequenos ou muito repetidos.
 *
 * Para saber quais opções foram relaxadas, use
 * `createMultipleBalancedTeamsWithMeta`.
 */
export function createMultipleBalancedTeams(
    selected: Set<string>,
    players: Player[],
    numberOfOptions: number = OPTIONS_TO_GENERATE
): Player[][][] {

    return createMultipleBalancedTeamsWithMeta(
        selected,
        players,
        numberOfOptions
    ).teams;
}

/**
 * Mesma coisa que `createMultipleBalancedTeams`, mas
 * também devolve, para cada opção, se ela precisou do
 * fallback relaxado (`relaxed[i] === true`) — útil para
 * a UI avisar o usuário "essa opção teve uma exceção na
 * regra de rotação".
 */
export function createMultipleBalancedTeamsWithMeta(
    selected: Set<string>,
    players: Player[],
    numberOfOptions: number = OPTIONS_TO_GENERATE
): { teams: Player[][][]; relaxed: boolean[] } {

    /**
     * Jogadores selecionados.
     */
    const available =
        players.filter(
            player =>
                selected.has(player.id)
        );

    const total =
        available.length;

    /**
     * Menos de 6 jogadores.
     */
    if (
        total < 6
    ) {

        return {
            teams: [],
            relaxed: []
        };
    }

    /**
     * Tamanhos dos times.
     */
    const teamSizes =
        getTeamSizes(total);

    /**
     * Histórico das opções.
     */
    const options:
        Player[][][] = [];

    const relaxedFlags:
        boolean[] = [];

    /**
     * ========================================================
     * GERA OPÇÕES
     * ========================================================
     */
    for (
        let optionIndex = 0;
        optionIndex < numberOfOptions;
        optionIndex++
    ) {

        /**
         * Histórico atual.
         */
        const pairHistory =
            buildPairHistory(
                options
            );

        const playerTeamHistory =
            buildPlayerTeamHistory(
                options
            );

        /**
         * Procura uma opção válida
         * (com fallback embutido).
         */
        const result =
            findBestOption(
                available,
                teamSizes,
                optionIndex,
                options,
                pairHistory,
                playerTeamHistory
            );

        /**
         * Se encontrou:
         */
        if (
            result
        ) {

            options.push(
                result.teams
            );

            relaxedFlags.push(
                result.relaxed
            );

            continue;
        }

        /**
         * ====================================================
         * NÃO ENCONTROU (nem com o fallback)
         * ====================================================
         *
         * Não vamos inventar uma opção inválida.
         *
         * Isso é importante.
         */
        console.warn(
            `Não foi possível encontrar a Opção ${optionIndex + 1}, mesmo com o fallback relaxado.`
        );

        /**
         * Para a geração.
         */
        break;
    }

    /**
     * ========================================================
     * VALIDAÇÃO FINAL
     * ========================================================
     */
    const validated =
        validateAllOptions(
            options,
            relaxedFlags,
            available,
            teamSizes
        );

    /**
     * ========================================================
     * LOG DE SEGURANÇA
     * ========================================================
     */
    if (
        validated.teams.length !==
        options.length
    ) {

        console.warn(
            'Uma ou mais opções foram removidas na validação final.'
        );
    }

    return validated;
}

/**
 * ============================================================
 * COMPATIBILIDADE COM CÓDIGO ANTIGO
 * ============================================================
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
