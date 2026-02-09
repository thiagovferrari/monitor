import { useState, useEffect } from 'react';
import { clientsApi, calculateStatus, isDemoMode, scraperApi, authApi, subscribeToClients } from './lib/supabase';
import ClientForm from './components/ClientForm';
import ClientTable from './components/ClientTable';
import EditClientModal from './components/EditClientModal';
import LoginPage from './components/LoginPage';
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [toast, setToast] = useState(null);
  const [editingClient, setEditingClient] = useState(null);

  // Efeito para carregar sessão inicial e ouvir mudanças
  useEffect(() => {
    authApi.getSession().then(session => {
      setSession(session);
    });

    const { data: { subscription } } = authApi.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Efeito para carregar clientes e assinar Realtime
  useEffect(() => {
    if (session) {
      loadClients();

      const subscription = subscribeToClients(() => {
        console.log('Mudança detectada no Realtime! Recarregando...');
        loadClients();
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [session]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await clientsApi.getAll();
      const clientsWithStatus = data.map(client => ({
        ...client,
        status: calculateStatus(client.last_post_date, client.posting_days, client.posts_per_week)
      }));
      setClients(clientsWithStatus);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      showToast('Erro ao carregar clientes. Verifique a conexão com Supabase.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (clientData) => {
    setLoading(true);
    try {
      const newClient = await clientsApi.create(clientData);
      // O Realtime cuidará da atualização da lista se estiver funcionando, 
      // mas adicionamos localmente para feedback instantâneo
      setClients(prev => [{ ...newClient, status: 'pending' }, ...prev]);
      showToast(`Cliente "${clientData.name}" cadastrado com sucesso!`, 'success');
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      showToast('Erro ao cadastrar cliente. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id) => {
    try {
      await clientsApi.delete(id);
      setClients(prev => prev.filter(c => c.id !== id));
      showToast('Cliente removido com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      showToast('Erro ao remover cliente.', 'error');
    }
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
  };

  const handleSaveClient = async (updates) => {
    if (!editingClient) return;

    setLoading(true);
    try {
      const updatedClient = await clientsApi.update(editingClient.id, updates);
      setClients(prev => prev.map(c =>
        c.id === editingClient.id
          ? { ...updatedClient, status: calculateStatus(updatedClient.last_post_date, updatedClient.posting_days, updatedClient.posts_per_week) }
          : c
      ));
      showToast(`Cliente "${updates.name}" atualizado com sucesso!`, 'success');
      setEditingClient(null);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      showToast('Erro ao atualizar cliente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleScrapeAll = async () => {
    if (isDemoMode) {
      showToast('Coleta desabilitada no modo demo.', 'error');
      return;
    }

    setScraping(true);
    showToast('🔄 Iniciando coleta de dados de todos os perfis...', 'info');

    try {
      const result = await scraperApi.scrapeAll();
      if (result.success) {
        showToast(`✅ Coleta concluída! ${result.totalClients || ''} perfis processados.`, 'success');
        await loadClients();
      } else {
        showToast(`⚠️ Aviso: ${result.error || 'Alguns perfis podem ter falhado.'}`, 'info');
      }
    } catch (error) {
      console.error('Erro no scraping:', error);
      showToast('Erro ao iniciar coleta automática.', 'error');
    } finally {
      setScraping(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authApi.signOut();
      setSession(null);
      setClients([]);
      showToast('Desconectado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      showToast('Erro ao fazer logout.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const stats = {
    total: clients.length,
    emDia: clients.filter(c => c.status === 'em_dia').length,
    atrasados: clients.filter(c => c.status === 'atrasado').length,
    pendentes: clients.filter(c => c.status === 'pending').length
  };

  if (!session) {
    return <LoginPage onLoginSuccess={() => loadClients()} />;
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-top">
          <div className="app-logo">
            <span className="app-logo-icon">📊</span>
            <div className="logo-text">
              <h1 className="app-title">Instagram Monitor</h1>
              <p className="app-subtitle">Sincronização em tempo real</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>Sair 🚪</button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleScrapeAll}
              disabled={scraping}
            >
              {scraping ? '⏳...' : '🚀 Coletar Dados de Todos'}
            </button>
          </div>
        </div>
      </header>

      {/* Banner Modo Demo */}
      {isDemoMode && (
        <div className="demo-banner">
          <span>⚠️</span>
          <div>
            <strong>Modo Demonstração</strong>
            <p>Configure o arquivo .env para conectar ao banco de dados real.</p>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total de Clientes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.emDia}</div>
          <div className="stat-label">Em Dia ✅</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.atrasados}</div>
          <div className="stat-label">Atrasados ⚠️</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pendentes}</div>
          <div className="stat-label">Pendentes 🔄</div>
        </div>
      </div>

      {/* Formulário de Cadastro */}
      <ClientForm onSubmit={handleAddClient} loading={loading} />

      {/* Tabela de Clientes */}
      <ClientTable
        clients={clients}
        onDelete={handleDeleteClient}
        onEdit={handleEditClient}
        onRefresh={loadClients}
        loading={loading}
      />

      {/* Modal de Edição */}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          onSave={handleSaveClient}
          onClose={() => setEditingClient(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast--${toast.type}`}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
