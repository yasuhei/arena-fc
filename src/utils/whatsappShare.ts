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

// Função para mostrar dialog de cópia manual
function showManualCopyDialog(message: string) {
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
    `;

    dialog.innerHTML = `
        <div style="
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 90%;
            max-height: 80%;
            overflow-y: auto;
        ">
            <h3 style="margin-top: 0; color: #333;">📱 Copie e cole no WhatsApp:</h3>
            <textarea readonly style="
                width: 100%;
                height: 200px;
                padding: 10px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-family: monospace;
                font-size: 12px;
                resize: none;
            ">${message}</textarea>
            <div style="text-align: center; margin-top: 15px;">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                    background: #25D366;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                ">✅ FECHAR</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    // Selecionar texto automaticamente
    const textarea = dialog.querySelector('textarea') as HTMLTextAreaElement;
    textarea.select();
    textarea.setSelectionRange(0, 99999); // Para mobile

    console.log('📋 Dialog de cópia manual exibido');
}

export function shareAllTeamOptionsOnWhatsApp(allTeamOptions: Player[][][]) {
    console.log('🔍 shareAllTeamOptionsOnWhatsApp chamada com:', allTeamOptions);

    // Verificar se os dados são válidos
    if (!allTeamOptions || allTeamOptions.length === 0) {
        console.error('❌ Dados de times inválidos:', allTeamOptions);
        throw new Error('Dados de times inválidos');
    }

    try {
        console.log('📱 Detectando dispositivo...');

        // Detectar se é dispositivo móvel
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        console.log('📱 É móvel:', isMobile, '| É iOS:', isIOS);

        // VERSÃO COMPLETA COM NOMES DOS JOGADORES
        let message = 'SEM PANELA FC\n\n3 OPCOES DE TIMES\n\n';

        allTeamOptions.forEach((teamOption, optionIdx) => {
            if (!teamOption || teamOption.length === 0) return;

            message += `OPCAO ${optionIdx + 1}\n`;
            message += '==================\n';

            teamOption.forEach((team, teamIdx) => {

                message += `TIME ${teamIdx + 1} \n`;
                team.forEach((player, playerIdx) => {
                    // Limpar nome do jogador de caracteres especiais
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

        message += '==================\n';
        message += 'Vote na sua opcao preferida!\n\nsem-panela-fc.vercel.app';

        console.log('📝 Mensagem completa (tamanho:', message.length, ')');
        console.log('📝 Mensagem:', message);

        // Se a mensagem estiver muito longa, usar versão resumida
        if (message.length > 1500) {
            console.warn('⚠️ Mensagem muito longa, usando versão resumida...');

            message = 'SEM PANELA FC\n\n3 OPCOES DE TIMES\n\n';

            allTeamOptions.forEach((teamOption, optionIdx) => {
                if (!teamOption || teamOption.length === 0) return;

                message += `OPCAO ${optionIdx + 1}\n`;
                teamOption.forEach((team, teamIdx) => {
                    const teamAvg = team.length > 0 ? (team.reduce((sum, p) => sum + p.rating, 0) / team.length).toFixed(1) : '0';
                    message += `Time ${teamIdx + 1}: ${team.length} jogadores (media: ${teamAvg})\n`;
                });
                message += '\n';
            });

            message += 'Vote na sua opcao preferida!\n\nsem-panela-fc.vercel.app';

            console.log('📝 Versão resumida (tamanho:', message.length, ')');
        }

        if (isMobile) {
            console.log('📱 Usando estratégia mobile...');

            // Para mobile: usar location.href em vez de window.open
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

            console.log('🔗 URL mobile (tamanho:', whatsappUrl.length, ')');

            if (isIOS) {
                console.log('🍎 Estratégia específica para iOS...');

                // Para iOS: tentar múltiplas abordagens
                try {
                    // Primeira tentativa: location.href
                    window.location.href = whatsappUrl;
                    console.log('✅ iOS: Redirecionamento via location.href');
                    return;
                } catch (iosError) {
                    console.log('⚠️ iOS location.href falhou, tentando window.open...');

                    // Segunda tentativa: window.open com timeout
                    const opened = window.open(whatsappUrl, '_blank');

                    if (opened) {
                        console.log('✅ iOS: window.open funcionou');
                        return;
                    } else {
                        console.log('❌ iOS: window.open falhou');
                    }
                }

                // Terceira tentativa: criar link temporário e clicar
                console.log('🔗 iOS: Tentando link temporário...');

                const tempLink = document.createElement('a');
                tempLink.href = whatsappUrl;
                tempLink.target = '_blank';
                tempLink.style.display = 'none';
                document.body.appendChild(tempLink);

                // Simular clique
                tempLink.click();

                // Remover link após delay
                setTimeout(() => {
                    document.body.removeChild(tempLink);
                }, 1000);

                console.log('✅ iOS: Link temporário criado e clicado');

            } else {
                // Android e outros mobiles
                console.log('🤖 Estratégia para Android/Mobile...');

                try {
                    window.location.href = whatsappUrl;
                    console.log('✅ Mobile: Redirecionamento funcionou');
                } catch (mobileError) {
                    console.log('❌ Mobile: Redirecionamento falhou, tentando window.open...');

                    const opened = window.open(whatsappUrl, '_blank');

                    if (!opened) {
                        throw new Error('Falha ao abrir WhatsApp no mobile');
                    }

                    console.log('✅ Mobile: window.open funcionou');
                }
            }

        } else {
            // Desktop: usar window.open tradicional
            console.log('💻 Usando estratégia desktop...');

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

            console.log('🔗 URL desktop (tamanho:', whatsappUrl.length, ')');

            const opened = window.open(whatsappUrl, '_blank');

            if (!opened || opened.closed || typeof opened.closed == 'undefined') {
                console.error('❌ Desktop: Falha ao abrir WhatsApp');
                throw new Error('Pop-up bloqueado pelo navegador');
            }

            console.log('✅ Desktop: WhatsApp aberto com sucesso!');
        }

    } catch (error) {
        console.error('❌ Erro ao processar compartilhamento:', error);

        // FALLBACK FINAL: Copiar para clipboard
        console.log('📋 Tentando fallback: copiar para clipboard...');

        try {
            const fallbackMessage = `SEM PANELA FC - 3 OPCOES DE TIMES

OPCAO 1: ${allTeamOptions[0].length} times
OPCAO 2: ${allTeamOptions[1].length} times  
OPCAO 3: ${allTeamOptions[2].length} times

Vote na sua opcao preferida!

sem-panela-fc.vercel.app`;

            // Tentar copiar para clipboard
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(fallbackMessage).then(() => {
                    alert('📋 Mensagem copiada para a área de transferência! Cole no WhatsApp manualmente.');
                    console.log('✅ Fallback: Copiado para clipboard');
                }).catch(() => {
                    // Se clipboard falhar, mostrar mensagem para copiar manualmente
                    showManualCopyDialog(fallbackMessage);
                });
            } else {
                // Navegadores mais antigos
                showManualCopyDialog(fallbackMessage);
            }

        } catch (clipboardError) {
            console.error('❌ Fallback clipboard também falhou:', clipboardError);
            throw new Error('Não foi possível abrir o WhatsApp nem copiar a mensagem. Tente permitir pop-ups ou usar outro navegador.');
        }
    }
}