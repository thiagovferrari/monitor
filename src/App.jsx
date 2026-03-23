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

  useEffect(() => {
    authApi.getSession().then(session => {
      setSession(session);
    });

    const { data: { subscription } } = authApi.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadClients();

      const subscription = subscribeToClients(() => {
        console.log('Realtime: recarregando clientes...');
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
      showToast('Erro ao carregar clientes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (clientData) => {
    setLoading(true);
    try {
      const newClient = await clientsApi.create(clientData);
      setClients(prev => [{ ...newClient, status: 'pending' }, ...prev]);
      showToast(`"${clientData.name}" cadastrado com sucesso!`, 'success');
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      showToast('Erro ao cadastrar cliente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id) => {
    try {
      await clientsApi.delete(id);
      setClients(prev => prev.filter(c => c.id !== id));
      showToast('Cliente removido.', 'success');
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
      showToast(`"${updates.name}" atualizado!`, 'success');
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
    showToast('Iniciando coleta de todos os perfis...', 'info');

    try {
      const result = await scraperApi.scrapeAll();
      if (result.success) {
        const msg = result.successCount !== undefined
          ? `Coleta concluída! ${result.successCount}/${result.totalClients} perfis atualizados.`
          : `Coleta concluída! ${result.totalClients || ''} perfis processados.`;
        showToast(msg, 'success');
        await loadClients();
      } else {
        showToast(`Aviso: ${result.error || 'Alguns perfis falharam.'}`, 'error');
      }
    } catch (error) {
      console.error('Erro no scraping:', error);
      showToast('Erro ao iniciar coleta automática.', 'error');
    } finally {
      setScraping(false);
    }
  };

  const handleScrapeOne = async (client) => {
    if (isDemoMode) return;

    showToast(`Coletando dados de @${client.instagram_username}...`, 'info');
    try {
      const result = await scraperApi.scrapeProfile(client.instagram_username, client.id);
      if (result.success) {
        showToast(`@${client.instagram_username} atualizado!`, 'success');
        await loadClients();
      } else {
        showToast(`Falha ao coletar @${client.instagram_username}.`, 'error');
      }
    } catch (error) {
      showToast('Erro na coleta individual.', 'error');
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await authApi.signOut();
      setSession(null);
      setClients([]);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
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
              <p className="app-subtitle">Monitoramento em tempo real</p>
            </div>
          </div>
          <div className="header-actions">
            {scraping && (
              <div className="scraping-status">
                <span className="loading-spinner"></span>
                Coletando dados...
              </div>
            )}
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Sair
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleScrapeAll}
              disabled={scraping}
            >
              {scraping ? 'Coletando...' : '↻ Atualizar Todos'}
            </button>
          </div>
        </div>
      </header>

      {/* Demo Banner */}
      {isDemoMode && (
        <div className="demo-banner">
          <span>⚠️</span>
          <div>
            <strong>Modo Demonstração</strong>
            <p>Configure o arquivo .env para conectar ao banco de dados real.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total de Clientes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.emDia}</div>
          <div className="stat-label">Em Dia</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.atrasados}</div>
          <div className="stat-label">Atrasados</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pendentes}</div>
          <div className="stat-label">Pendentes</div>
        </div>
      </div>

      {/* Form */}
      <ClientForm onSubmit={handleAddClient} loading={loading} />

      {/* Table */}
      <ClientTable
        clients={clients}
        onDelete={handleDeleteClient}
        onEdit={handleEditClient}
        onRefresh={loadClients}
        onScrapeOne={handleScrapeOne}
        loading={loading}
      />

      {/* Edit Modal */}
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
          {toast.type === 'success' ? '✓' : toast.type === 'info' ? '→' : '✕'} {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
