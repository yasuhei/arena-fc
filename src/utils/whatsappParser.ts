// Utilitário para extrair nomes de listas do WhatsApp

export interface ExtractedPlayer {
    name: string;
    originalLine: string;
    position: number;
}

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
            let name = match[2].trim();

            // Limpeza do nome
            name = cleanPlayerName(name);

            // Só adicionar se o nome for válido
            if (isValidPlayerName(name)) {
                extractedPlayers.push({
                    name,
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

    // Remove emojis comuns
    name = name.replace(/[⚽🏃‍♂️👤🔥💪⭐]/g, '');

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

    for (const line of lines) {
        const lowerLine = line.toLowerCase().trim();

        // Detectar seções
        if (lowerLine.includes('fora') || lowerLine.includes('não vai') || lowerLine.includes('ausente')) {
            currentSection = 'out';
            continue;
        }

        if (lowerLine.includes('talvez') || lowerLine.includes('maybe') || lowerLine.includes('dúvida')) {
            currentSection = 'maybe';
            continue;
        }

        if (lowerLine.includes('confirmado') || lowerLine.includes('vai jogar')) {
            currentSection = 'confirmed';
            continue;
        }

        // Extrair jogadores da linha atual
        const extracted = extractPlayersFromWhatsAppList(line);
        if (extracted.length > 0) {
            sections[currentSection as keyof typeof sections].push(...extracted);
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