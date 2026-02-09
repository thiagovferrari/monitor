/**
 * Agendador de Coleta Automática
 * ================================
 * 
 * Este script executa a coleta de dados dos perfis Instagram
 * de forma automatizada a cada 6 ou 12 horas.
 * 
 * COMO USAR:
 * ----------
 * 1. Configure as variáveis SUPABASE_URL e SUPABASE_KEY
 * 2. Execute: node scheduler.js
 * 3. O script irá rodar continuamente em segundo plano
 * 
 * Para usar com Antigravity Browser Agent:
 * Execute o browser_subagent com a task de scraping
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'SEU_SUPABASE_URL';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'SUA_SUPABASE_ANON_KEY';

// Intervalo de verificação (em milissegundos)
const CHECK_INTERVAL_HOURS = 6;
const CHECK_INTERVAL_MS = CHECK_INTERVAL_HOURS * 60 * 60 * 1000;

// Delay entre perfis (para evitar bloqueio)
const DELAY_BETWEEN_PROFILES_MS = 5000; // 5 segundos

/**
 * Busca todos os clientes cadastrados
 */
async function getClients() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/clients?select=*`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar clientes');
    }

    return response.json();
}

/**
 * Atualiza os dados de um cliente
 */
async function updateClient(clientId, data) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/clients?id=eq.${clientId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
            ...data,
            last_check_date: new Date().toISOString()
        })
    });

    return response.ok;
}

/**
 * Função de delay
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Processa todos os clientes
 */
async function processAllClients() {
    console.log('🚀 Iniciando verificação agendada...');
    console.log(`⏰ Horário: ${new Date().toLocaleString('pt-BR')}`);

    try {
        const clients = await getClients();
        console.log(`📋 ${clients.length} clientes para verificar`);

        for (let i = 0; i < clients.length; i++) {
            const client = clients[i];
            console.log(`\n[${i + 1}/${clients.length}] Processando: ${client.name} (@${client.instagram_username})`);

            // Aqui seria chamado o browser_subagent para coletar os dados
            // Como exemplo, apenas logamos a intenção
            console.log(`   ➡️ URL: ${client.instagram_url}`);
            console.log(`   ⏳ Aguardando ${DELAY_BETWEEN_PROFILES_MS / 1000}s antes do próximo...`);

            await delay(DELAY_BETWEEN_PROFILES_MS);
        }

        console.log('\n✅ Verificação concluída!');
        console.log(`🔄 Próxima verificação em ${CHECK_INTERVAL_HOURS} horas.`);

    } catch (error) {
        console.error('❌ Erro durante verificação:', error.message);
    }
}

/**
 * Inicia o agendador
 */
function startScheduler() {
    console.log('═══════════════════════════════════════════');
    console.log('     🕐 AGENDADOR DE MONITORAMENTO         ');
    console.log('═══════════════════════════════════════════');
    console.log(`Intervalo: ${CHECK_INTERVAL_HOURS} horas`);
    console.log('');

    // Executa imediatamente na primeira vez
    processAllClients();

    // Agenda para executar a cada X horas
    setInterval(processAllClients, CHECK_INTERVAL_MS);
}

// Se executado diretamente
if (typeof require !== 'undefined' && require.main === module) {
    startScheduler();
}

// Exportar para uso externo
if (typeof module !== 'undefined') {
    module.exports = {
        getClients,
        updateClient,
        processAllClients,
        startScheduler
    };
}
