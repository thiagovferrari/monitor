-- ============================================
-- SISTEMA DE MONITORAMENTO DE INSTAGRAM
-- Executar este script no SQL Editor do Supabase
-- ============================================

-- Tabela de Clientes (perfis Instagram monitorados)
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    instagram_url VARCHAR(500) NOT NULL,
    instagram_username VARCHAR(100) NOT NULL,
    posts_per_week INTEGER DEFAULT 3,
    last_post_date TIMESTAMP WITH TIME ZONE,
    last_check_date TIMESTAMP WITH TIME ZONE,
    avg_likes INTEGER DEFAULT 0,
    avg_comments INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Histórico de Posts
CREATE TABLE IF NOT EXISTS posts_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    post_url VARCHAR(500),
    post_date TIMESTAMP WITH TIME ZONE,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    caption TEXT,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clients_username ON clients(instagram_username);
CREATE INDEX IF NOT EXISTS idx_posts_client_id ON posts_history(client_id);
CREATE INDEX IF NOT EXISTS idx_posts_date ON posts_history(post_date DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts_history ENABLE ROW LEVEL SECURITY;

-- Política de acesso público (para uso sem autenticação)
-- NOTA: Para produção, considere usar autenticação adequada
CREATE POLICY "Allow all operations on clients" ON clients
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on posts_history" ON posts_history
    FOR ALL USING (true) WITH CHECK (true);
