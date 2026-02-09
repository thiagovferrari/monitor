import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Modo demo quando Supabase não está configurado
const isDemoMode = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('SEU_PROJETO');

if (isDemoMode) {
  console.warn('⚠️ Supabase não configurado. Executando em MODO DEMO.');
  console.warn('Configure o arquivo .env com suas credenciais do Supabase.');
}

// Configuração do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Objeto de API para Autenticação
export const authApi = {
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// URL da Edge Function
const SCRAPER_FUNCTION_URL = `${supabaseUrl}/functions/v1/instagram-scraper`;

// Dados de demonstração
let demoClients = [
  {
    id: 'demo-1',
    name: 'Cliente Demo 1',
    instagram_url: 'https://www.instagram.com/instagram/',
    instagram_username: 'instagram',
    posts_per_week: 7,
    last_post_date: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    last_check_date: new Date().toISOString(),
    avg_likes: 125000,
    avg_comments: 3500,
    status: 'em_dia',
    created_at: new Date().toISOString()
  }
];

// Funções utilitárias para clientes
export const clientsApi = {
  // Buscar todos os clientes
  async getAll() {
    if (isDemoMode) {
      return [...demoClients];
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Adicionar novo cliente
  async create(client) {
    const username = extractUsername(client.instagram_url);

    if (isDemoMode) {
      const newClient = {
        id: 'demo-' + Date.now(),
        name: client.name,
        instagram_url: client.instagram_url,
        instagram_username: username,
        posting_days: client.posting_days || [1, 3, 5],
        posts_per_week: client.posting_days?.length || client.posts_per_week || 3,
        last_post_date: null,
        last_check_date: null,
        avg_likes: 0,
        avg_comments: 0,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      demoClients.unshift(newClient);
      return newClient;
    }

    const { data, error } = await supabase
      .from('clients')
      .insert([{
        name: client.name,
        instagram_url: client.instagram_url,
        instagram_username: username,
        posting_days: client.posting_days || [1, 3, 5],
        posts_per_week: client.posting_days?.length || client.posts_per_week || 3,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Atualizar cliente
  async update(id, updates) {
    if (isDemoMode) {
      const index = demoClients.findIndex(c => c.id === id);
      if (index !== -1) {
        demoClients[index] = { ...demoClients[index], ...updates };
        return demoClients[index];
      }
      return null;
    }

    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar cliente
  async delete(id) {
    if (isDemoMode) {
      demoClients = demoClients.filter(c => c.id !== id);
      return true;
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};

// API de Scraping - Chama a Edge Function
export const scraperApi = {
  // Coletar dados de um único perfil
  async scrapeProfile(username, clientId = null) {
    if (isDemoMode) {
      return { success: false, error: 'Demo mode - scraping disabled' };
    }

    try {
      const response = await fetch(SCRAPER_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'scrape_single',
          username: username,
          clientId: clientId
        })
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  // Coletar dados de todos os clientes
  async scrapeAll() {
    if (isDemoMode) {
      return { success: false, error: 'Demo mode - scraping disabled' };
    }

    try {
      const response = await fetch(SCRAPER_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'scrape_all'
        })
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
};

// Funções utilitárias para histórico de posts
export const postsApi = {
  // Buscar histórico de um cliente
  async getByClientId(clientId) {
    if (isDemoMode) {
      return [];
    }

    const { data, error } = await supabase
      .from('posts_history')
      .select('*')
      .eq('client_id', clientId)
      .order('post_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Adicionar registro de post
  async create(post) {
    if (isDemoMode) {
      return { id: 'demo-post-' + Date.now(), ...post };
    }

    const { data, error } = await supabase
      .from('posts_history')
      .insert([post])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Extrair username da URL do Instagram
function extractUsername(url) {
  // Remove @ se presente
  if (url.startsWith('@')) {
    return url.substring(1);
  }
  const match = url.match(/instagram\.com\/([^/?#]+)/);
  return match ? match[1] : url;
}

// Nomes dos dias da semana
export const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAY_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Calcular status do cliente baseado nos dias da semana
export function calculateStatus(lastPostDate, postingDays, postsPerWeek) {
  if (!lastPostDate) return 'pending';

  const now = new Date();
  const lastPost = new Date(lastPostDate);

  // Se tem posting_days definido, usar lógica de dias da semana
  if (postingDays && postingDays.length > 0) {
    const todayWeekday = now.getDay(); // 0 = Domingo
    const lastPostWeekday = lastPost.getDay();

    // Encontrar o último dia de postagem que já passou
    const daysSinceLastPost = Math.floor((now - lastPost) / (1000 * 60 * 60 * 24));

    // Se postou hoje ou a diferença é de 0-1 dias, está em dia
    if (daysSinceLastPost <= 1) return 'em_dia';

    // Verificar quantos dias de postagem passaram desde o último post
    let missedDays = 0;
    for (let i = 1; i <= daysSinceLastPost; i++) {
      const checkDate = new Date(lastPost);
      checkDate.setDate(lastPost.getDate() + i);
      const weekday = checkDate.getDay();
      if (postingDays.includes(weekday) && checkDate < now) {
        missedDays++;
      }
    }

    // Se perdeu mais de 1 dia de postagem, está atrasado
    return missedDays > 1 ? 'atrasado' : 'em_dia';
  }

  // Fallback: usar lógica antiga de posts_per_week
  const daysSinceLastPost = (now - lastPost) / (1000 * 60 * 60 * 24);
  const maxDays = 7 / (postsPerWeek || 3);

  return daysSinceLastPost > maxDays ? 'atrasado' : 'em_dia';
}

// Função para formatar data de forma amigável
export function formatDate(dateString) {
  if (!dateString) return 'Nunca';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Inválido';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Configuração de Realtime - Assinar mudanças na tabela clients
export function subscribeToClients(onUpdate) {
  return supabase
    .channel('clients-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'clients' },
      () => {
        onUpdate();
      }
    )
    .subscribe();
}

// Exportar flag de modo demo
export { isDemoMode };
