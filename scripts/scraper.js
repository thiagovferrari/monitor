/**
 * Script de Scraping para Instagram
 * ===================================
 * 
 * Este script coleta dados de perfis públicos do Instagram.
 * Deve ser executado pelo Browser Agent do Antigravity.
 * 
 * Funcionalidades:
 * - Acessa perfis públicos do Instagram
 * - Extrai data do último post
 * - Extrai métricas (curtidas e comentários)
 * - Atualiza o banco de dados Supabase
 * 
 * IMPORTANTE: Este script é projetado para ser executado através
 * do browser_subagent do Antigravity, que automatiza o navegador
 * sem necessidade de APIs externas.
 */

// Configuração do Supabase (para atualizações diretas)
const SUPABASE_URL = 'SEU_SUPABASE_URL';
const SUPABASE_KEY = 'SUA_SUPABASE_ANON_KEY';

/**
 * Função principal para coletar dados de um perfil Instagram
 * @param {string} username - Nome de usuário do Instagram (sem @)
 * @returns {Object} Dados coletados do perfil
 */
async function scrapeInstagramProfile(username) {
    const profileUrl = `https://www.instagram.com/${username}/`;

    console.log(`🔍 Coletando dados de: ${profileUrl}`);

    // O browser_subagent irá:
    // 1. Navegar para a URL do perfil
    // 2. Aguardar a página carregar
    // 3. Extrair informações do DOM

    const result = {
        username: username,
        profileUrl: profileUrl,
        lastPostDate: null,
        lastPostLikes: 0,
        lastPostComments: 0,
        postUrl: null,
        collectedAt: new Date().toISOString(),
        success: false,
        error: null
    };

    return result;
}

/**
 * Atualiza o cliente no banco de dados Supabase
 */
async function updateClientInDatabase(clientId, data) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/clients?id=eq.${clientId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
            last_post_date: data.lastPostDate,
            last_check_date: new Date().toISOString(),
            avg_likes: data.lastPostLikes,
            avg_comments: data.lastPostComments,
            status: calculateStatus(data.lastPostDate)
        })
    });

    return response.ok;
}

/**
 * Adiciona registro ao histórico de posts
 */
async function addToPostHistory(clientId, data) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/posts_history`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({
            client_id: clientId,
            post_url: data.postUrl,
            post_date: data.lastPostDate,
            likes_count: data.lastPostLikes,
            comments_count: data.lastPostComments
        })
    });

    return response.ok;
}

/**
 * Calcula o status baseado na data do último post
 */
function calculateStatus(lastPostDate, postsPerWeek = 3) {
    if (!lastPostDate) return 'pending';

    const now = new Date();
    const lastPost = new Date(lastPostDate);
    const daysSinceLastPost = (now - lastPost) / (1000 * 60 * 60 * 24);

    const maxDays = 7 / postsPerWeek;

    return daysSinceLastPost > maxDays ? 'atrasado' : 'em_dia';
}

// Exportar funções para uso externo
if (typeof module !== 'undefined') {
    module.exports = {
        scrapeInstagramProfile,
        updateClientInDatabase,
        addToPostHistory,
        calculateStatus
    };
}

console.log('📊 Script de Scraping do Instagram carregado!');
console.log('➡️ Use scrapeInstagramProfile(username) para coletar dados.');
