import { useState, useEffect } from 'react';
import { clientsApi, calculateStatus, isDemoMode, scraperApi } from './lib/supabase';
import ClientForm from './components/ClientForm';
import ClientTable from './components/ClientTable';
import EditClientModal from './components/EditClientModal';
import './index.css';

function App() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [toast, setToast] = useState(null);
  const [editingClient, setEditingClient] = useState(null);

  // Carregar clientes ao iniciar
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await clientsApi.getAll();
      // Recalcular status para cada cliente usando posting_days
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
      setClients(prev => [newClient, ...prev]);
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

  // 🚀 Coleta automática de todos os clientes
  const handleScrapeAll = async () => {
    if (isDemoMode) {
      showToast('Coleta desabilitada no modo demo.', 'error');
      return;
    }

    setScraping(true);
    showToast('🔄 Iniciando coleta de dados... Isso pode levar alguns segundos.', 'success');

    try {
      const result = await scraperApi.scrapeAll();
      console.log('Resultado scraping:', result);

      if (result.success) {
        showToast(`✅ Coleta concluída! ${result.totalClients} perfis verificados.`, 'success');
        // Recarregar lista de clientes
        await loadClients();
      } else {
        showToast(`⚠️ Erro na coleta: ${result.error || 'Erro desconhecido'}`, 'error');
      }
    } catch (error) {
      console.error('Erro no scraping:', error);
      showToast('❌ Falha na coleta de dados.', 'error');
    } finally {
      setScraping(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Calcular estatísticas
  const stats = {
    total: clients.length,
    emDia: clients.filter(c => c.status === 'em_dia').length,
    atrasados: clients.filter(c => c.status === 'atrasado').length,
    pendentes: clients.filter(c => c.status === 'pending').length
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">📊</div>
          <h1 className="app-title">Instagram Monitor</h1>
        </div>
        <p className="app-subtitle">
          Monitoramento de métricas e postagens dos seus clientes
        </p>
        {!isDemoMode && (
          <button
            className="btn btn-primary"
            onClick={handleScrapeAll}
            disabled={scraping}
            style={{ marginTop: '1rem' }}
          >
            {scraping ? (
              <>
                <span className="loading-spinner"></span>
                Coletando dados...
              </>
            ) : (
              <>
                🚀 Coletar Dados de Todos os Clientes
              </>
            )}
          </button>
        )}
      </header>

      {/* Banner Modo Demo */}
      {isDemoMode && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(252, 176, 69, 0.2), rgba(253, 29, 29, 0.2))',
          border: '1px solid rgba(252, 176, 69, 0.4)',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <strong style={{ color: '#fcb045' }}>Modo Demonstração</strong>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Configure o arquivo <code>.env</code> com suas credenciais do Supabase para conectar ao banco de dados real.
            </p>
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
