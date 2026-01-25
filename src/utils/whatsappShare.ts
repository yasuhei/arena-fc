import { Player } from '../hooks/usePlayers';

export function shareTeamsOnWhatsApp(teams: Player[][]) {
    console.log('🔍 shareTeamsOnWhatsApp chamada com:', teams);

    // Verificar se os dados são válidos
    if (!teams || teams.length === 0) {
        console.error('❌ Dados de times inválidos:', teams);
        throw new Error('Nenhum time para compartilhar');
    }

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

    console.log('📝 Mensagem formatada (tamanho:', message.length, '):', message);

    // Codifica a mensagem para URL
    const encodedMessage = encodeURIComponent(message);
    console.log('🔗 URL codificada (tamanho:', encodedMessage.length, ')');

    // Abre o WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    console.log('🚀 Abrindo WhatsApp...');

    const opened = window.open(whatsappUrl, '_blank');

    if (!opened) {
        console.error('❌ Falha ao abrir pop-up');
        throw new Error('Pop-up bloqueado pelo navegador');
    }

    console.log('✅ WhatsApp aberto com sucesso!');
}

// Função para limpar caracteres problemáticos


export function shareAllTeamOptionsOnWhatsApp(allTeamOptions: Player[][][]) {
    console.log('🔍 shareAllTeamOptionsOnWhatsApp chamada com:', allTeamOptions);

    // Verificar se os dados são válidos
    if (!allTeamOptions || allTeamOptions.length === 0) {
        console.error('❌ Dados de times inválidos:', allTeamOptions);
        throw new Error('Dados de times inválidos');
    }

    try {
        console.log('🚀 Formatando mensagem segura...');

        // VERSÃO ULTRA-SIMPLES E SEGURA
        let message = 'SEM PANELA FC - 3 TEAM OPTIONS\n\n';

        const optionNames = [
            'OPTION 1 - RATING PRIORITY',
            'OPTION 2 - MIXED SHUFFLE',
            'OPTION 3 - SERPENTINE DRAFT'
        ];

        allTeamOptions.forEach((teamOption, optionIdx) => {
            if (!teamOption || teamOption.length === 0) {
                console.warn(`⚠️ Opção ${optionIdx + 1} está vazia`);
                return;
            }

            message += `${optionNames[optionIdx]}\n`;
            message += '====================\n';

            teamOption.forEach((team, teamIdx) => {
                message += `TEAM ${teamIdx + 1} \n`;
                team.forEach((player, playerIdx) => {
                    // Limpar nome do jogador
                    const cleanName = player.name.replace(/[^\w\s\-]/g, '').trim();
                    message += `${playerIdx + 1}. ${cleanName}`;

                    message += '\n';
                });
                message += '\n';
            });

            if (optionIdx < allTeamOptions.length - 1) {
                message += '\n';
            }
        });

        message += '====================\n';
        message += 'Vote for your preferred option!\n\n';
        message += 'https://sem-panela-fc.vercel.app/';

        console.log('📝 Mensagem segura (tamanho:', message.length, ')');
        console.log('📝 Prévia:', message.substring(0, 200) + '...');

        // Se ainda estiver muito longa, usar versão resumida
        if (message.length > 1500) {
            console.warn('⚠️ Mensagem muito longa, usando versão resumida...');

            message = 'SEM PANELA FC - 3 TEAM OPTIONS\n\n';

            allTeamOptions.forEach((teamOption, optionIdx) => {
                message += `OPTION ${optionIdx + 1}\n`;
                teamOption.forEach((team, teamIdx) => {
                    const teamAvg = team.length > 0 ? (team.reduce((sum, p) => sum + p.rating, 0) / team.length).toFixed(1) : '0.0';
                    message += `Team ${teamIdx + 1}: ${team.length} players (avg: ${teamAvg})\n`;
                });
                message += '\n';
            });

            message += 'Vote for your preferred option!\n';
            message += 'https://sem-panela-fc.vercel.app/';

            console.log('📝 Versão resumida (tamanho:', message.length, ')');
        }

        // Codificação segura
        console.log('🔄 Codificando URL...');

        try {
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

            console.log('🔗 URL final (tamanho:', whatsappUrl.length, ')');

            if (whatsappUrl.length > 8000) {
                throw new Error('URL muito longa');
            }

            console.log('🚀 Abrindo WhatsApp...');

            const opened = window.open(whatsappUrl, '_blank');

            if (!opened || opened.closed || typeof opened.closed == 'undefined') {
                console.error('❌ Falha ao abrir WhatsApp');
                throw new Error('Pop-up bloqueado pelo navegador');
            }

            console.log('✅ WhatsApp aberto com sucesso!');

        } catch (encodingError) {
            console.error('❌ Erro na codificação:', encodingError);

            // Fallback: versão mínima
            console.log('🔄 Usando fallback mínimo...');

            const fallbackMessage = `SEM PANELA FC\n\n3 Team Options Available\n\nOption 1: ${allTeamOptions[0].length} teams\nOption 2: ${allTeamOptions[1].length} teams\nOption 3: ${allTeamOptions[2].length} teams\n\nVote for your preferred option!\n\nhttps://sem-panela-fc.vercel.app/`;

            const fallbackUrl = `https://wa.me/?text=${encodeURIComponent(fallbackMessage)}`;

            const opened = window.open(fallbackUrl, '_blank');

            if (!opened) {
                throw new Error('Falha ao abrir WhatsApp mesmo com versão mínima');
            }

            console.log('✅ WhatsApp aberto com versão mínima!');
        }

    } catch (error) {
        console.error('❌ Erro ao processar compartilhamento:', error);
        throw error;
    }
}