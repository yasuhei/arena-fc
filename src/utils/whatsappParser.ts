// Utilitário para extrair nomes de listas do WhatsApp

export interface ExtractedPlayer {
    name: string;
    rating?: number;
    isKeyPlayer?: boolean;
    originalLine: string;
    position: number;
}

const DEFAULT_KEY_PLAYER_PATTERNS = ['fabiano', 'fernando', 'gui', 'guilherme', 'robert'];

export const detectKeyPlayer = (name: string): boolean => {
    const lower = name.toLowerCase();
    return DEFAULT_KEY_PLAYER_PATTERNS.some(pattern => lower.includes(pattern));
};

export const extractPlayersFromWhatsAppList = (text: string): ExtractedPlayer[] => {
    const lines = text.split('\n');
    const extractedPlayers: ExtractedPlayer[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Diferentes padrões de numeração encontrados em listas do WhatsApp
        const patterns = [
            /^(\d+)\s*[-–]\s*(.+?)(?:\s*$)/, // "01 - Miguel" ou "1 - Diego"
            /^(\d+)\s*[.]\s*(.+?)(?:\s*$)/, // "01. Miguel" ou "1. Diego"
            /^(\d+)\s+(.+?)(?:\s*$)/, // "01 Miguel" ou "1 Diego"
            /^(\d+)[-–](.+?)(?:\s*$)/, // "01-Miguel" ou "1-Diego"
        ];

        let match = null;
        let position = 0;

        for (const pattern of patterns) {
            match = line.match(pattern);
            if (match) {
                position = parseInt(match[1]);
                break;
            }
        }

        if (match && match[2]) {
            let name = match[2].trim().replace(/[^a-zA-ZÀ-ÿ0-9\s\-']/g, '').trim();

            // Limpeza do nome
            name = cleanPlayerName(name);

            // Só adicionar se o nome for válido
            if (isValidPlayerName(name)) {
                extractedPlayers.push({
                    name,
                    isKeyPlayer: detectKeyPlayer(name),
                    originalLine: line,
                    position
                });
            }
        }
    }

    // Ordenar por posição
    return extractedPlayers.sort((a, b) => a.position - b.position);
};

const cleanPlayerName = (name: string): string => {
    // Remove informações entre parênteses
    name = name.replace(/\([^)]*\)/g, '');

    // Remove informações entre colchetes
    name = name.replace(/\[[^\]]*\]/g, '');

    // Remove caracteres não alfanuméricos (emojis, símbolos, etc.)
    name = name.replace(/[^a-zA-ZÀ-ÿ0-9\s\-']/g, '');

    // Remove caracteres especiais no final
    name = name.replace(/[.,;:!?]+$/, '');

    // Remove espaços extras
    name = name.replace(/\s+/g, ' ').trim();

    // Capitaliza primeira letra de cada palavra
    name = name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    return name;
};

const isValidPlayerName = (name: string): boolean => {
    // Nome deve ter pelo menos 2 caracteres
    if (name.length < 2) return false;

    // Nome não pode ser apenas números
    if (/^\d+$/.test(name)) return false;

    // Nome não pode conter apenas caracteres especiais
    if (!/[a-zA-ZÀ-ÿ]/.test(name)) return false;

    // Filtrar palavras comuns que não são nomes
    const invalidNames = [
        'fora', 'lista', 'reserva', 'banco', 'confirmado', 'talvez',
        'data', 'horário', 'duração', 'obs', 'mensalistas', 'prioridade'
    ];

    if (invalidNames.includes(name.toLowerCase())) return false;

    return true;
};

// Função para detectar seções da lista (confirmados, fora, etc.)
export const parseWhatsAppSections = (text: string) => {
    const lines = text.split('\n');
    const sections = {
        confirmed: [] as ExtractedPlayer[],
        out: [] as ExtractedPlayer[],
        maybe: [] as ExtractedPlayer[],
        other: [] as ExtractedPlayer[]
    };

    let currentSection = 'confirmed';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lowerLine = line.toLowerCase();

        // Detectar início da seção FORA
        if (lowerLine.includes('fora') && !lowerLine.match(/^\d+\s*[-–]\s*/)) {
            currentSection = 'out';
            continue;
        }

        // Detectar outras seções que indicam fim da seção FORA
        if (lowerLine.includes('mensalistas') ||
            lowerLine.includes('prioridade') ||
            lowerLine.includes('observação') ||
            lowerLine.includes('obs:')) {
            currentSection = 'other';
            continue;
        }

        // Se não há numeração e contém palavras-chave, pode ser cabeçalho de seção
        if (!line.match(/^\d+/) && (
            lowerLine.includes('talvez') ||
            lowerLine.includes('maybe') ||
            lowerLine.includes('dúvida') ||
            lowerLine.includes('confirmado') ||
            lowerLine.includes('vai jogar')
        )) {
            if (lowerLine.includes('talvez') || lowerLine.includes('maybe') || lowerLine.includes('dúvida')) {
                currentSection = 'maybe';
            } else {
                currentSection = 'confirmed';
            }
            continue;
        }

        // Extrair jogadores da linha atual se ela contém numeração
        if (line.match(/^\d+/)) {
            // Processar linha individual ao invés de chamar extractPlayersFromWhatsAppList
            const patterns = [
                /^(\d+)\s*[-–]\s*(.+?)(?:\s*$)/, // "01 - Miguel" ou "1 - Diego"
                /^(\d+)\s*[.]\s*(.+?)(?:\s*$)/, // "01. Miguel" ou "1. Diego"
                /^(\d+)\s+(.+?)(?:\s*$)/, // "01 Miguel" ou "1 Diego"
                /^(\d+)[-–](.+?)(?:\s*$)/, // "01-Miguel" ou "1-Diego"
            ];

            let match = null;
            let position = 0;

            for (const pattern of patterns) {
                match = line.match(pattern);
                if (match) {
                    position = parseInt(match[1]);
                    break;
                }
            }

            if (match && match[2]) {
                let nameAndRating = match[2].trim();
                let extractedRating = 0; // Default sem rating

                // Tentar extrair rating do final do nome
                // Padrões: "Nome 3.5", "Nome 4", "Nome - Dúvida 2.5"
                const ratingPatterns = [
                    /^(.+?)\s+(\d+(?:\.\d+)?)$/, // "Nome 3.5" ou "Nome 4"
                    /^(.+?)\s*-\s*.*?\s+(\d+(?:\.\d+)?)$/, // "Nome - Info 3.5"
                ];

                let finalName = nameAndRating;

                for (const ratingPattern of ratingPatterns) {
                    const ratingMatch = nameAndRating.match(ratingPattern);
                    if (ratingMatch) {
                        finalName = ratingMatch[1].trim();
                        const ratingValue = parseFloat(ratingMatch[2]);

                        // Validar se o rating está no range válido (0-5)
                        if (ratingValue >= 0 && ratingValue <= 5) {
                            extractedRating = ratingValue;
                        }
                        break;
                    }
                }

                // Limpeza do nome
                finalName = cleanPlayerName(finalName);

                // Só adicionar se o nome for válido
                if (isValidPlayerName(finalName)) {
                    sections[currentSection as keyof typeof sections].push({
                        name: finalName,
                        rating: extractedRating,
                        isKeyPlayer: detectKeyPlayer(finalName),
                        originalLine: line,
                        position
                    });
                }
            }
        }
    }

    return sections;
};

// Função para gerar estatísticas da importação
export const getImportStats = (extracted: ExtractedPlayer[], existingPlayers: string[]) => {
    const newPlayers = extracted.filter(p =>
        !existingPlayers.some(existing =>
            existing.toLowerCase().trim() === p.name.toLowerCase().trim()
        )
    );

    const duplicates = extracted.filter(p =>
        existingPlayers.some(existing =>
            existing.toLowerCase().trim() === p.name.toLowerCase().trim()
        )
    );

    return {
        total: extracted.length,
        new: newPlayers.length,
        duplicates: duplicates.length,
        newPlayers,
        duplicateNames: duplicates.map(p => p.name)
    };
};