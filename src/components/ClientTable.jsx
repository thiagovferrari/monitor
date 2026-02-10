import StatusBadge from './StatusBadge';

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function ClientTable({ clients, onDelete, onEdit, onRefresh, loading }) {
    const formatDate = (dateString) => {
        if (!dateString) return '—';

        // Criar datas no horário de Brasília (America/Sao_Paulo)
        const date = new Date(dateString);
        const now = new Date();

        // Normalizar ambas as datas para o início do dia no horário de Brasília
        const dateInBrasilia = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
        const nowInBrasilia = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

        // Zerar horas para comparar apenas dias
        dateInBrasilia.setHours(0, 0, 0, 0);
        nowInBrasilia.setHours(0, 0, 0, 0);

        // Calcular diferença em dias
        const diffDays = Math.floor((nowInBrasilia - dateInBrasilia) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `${diffDays} dias atrás`;

        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'America/Sao_Paulo'
        });
    };

    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const renderPostingDays = (days) => {
        if (!days || days.length === 0) return '—';
        const today = new Date().getDay();

        return (
            <div className="days-chips">
                {days.sort((a, b) => a - b).map(day => (
                    <span
                        key={day}
                        className={`day-chip ${day === today ? 'today' : ''}`}
                        title={WEEKDAY_NAMES[day]}
                    >
                        {WEEKDAY_NAMES[day]}
                    </span>
                ))}
            </div>
        );
    };

    if (clients.length === 0) {
        return (
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">
                        <span className="card-title-icon">📊</span>
                        Clientes Monitorados
                    </h2>
                </div>
                <div className="empty-state">
                    <div className="empty-state-icon">📱</div>
                    <h3 className="empty-state-title">Nenhum cliente cadastrado</h3>
                    <p>Adicione seu primeiro cliente usando o formulário acima.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">
                    <span className="card-title-icon">📊</span>
                    Clientes Monitorados ({clients.length})
                </h2>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={onRefresh}
                    disabled={loading}
                >
                    {loading ? (
                        <span className="loading-spinner"></span>
                    ) : (
                        '🔄 Atualizar'
                    )}
                </button>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Instagram</th>
                            <th>Dias de Postagem</th>
                            <th>Último Post</th>
                            <th>Status</th>
                            <th>Métricas</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map(client => (
                            <tr key={client.id}>
                                <td>
                                    <strong>{client.name}</strong>
                                </td>
                                <td>
                                    <a
                                        href={client.instagram_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="instagram-link"
                                    >
                                        <span className="instagram-link-icon">📷</span>
                                        @{client.instagram_username}
                                    </a>
                                </td>
                                <td>
                                    {renderPostingDays(client.posting_days)}
                                </td>
                                <td>
                                    <div>{formatDate(client.last_post_date)}</div>
                                </td>
                                <td>
                                    <StatusBadge status={client.status} />
                                </td>
                                <td>
                                    <div className="metrics-row">
                                        <span className="metric">
                                            <span className="metric-icon">👥</span>
                                            <span className="metric-value">{formatNumber(client.avg_likes)}</span>
                                        </span>
                                        <span className="metric">
                                            <span className="metric-icon">❤️</span>
                                            <span className="metric-value">{formatNumber(client.avg_comments)}</span>
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className="actions-cell">
                                        <button
                                            className="btn btn-secondary btn-icon"
                                            title="Editar cliente"
                                            onClick={() => onEdit(client)}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-icon"
                                            title="Ver Instagram"
                                            onClick={() => window.open(client.instagram_url, '_blank')}
                                        >
                                            👁️
                                        </button>
                                        <button
                                            className="btn btn-danger btn-icon"
                                            title="Remover cliente"
                                            onClick={() => {
                                                if (confirm(`Remover ${client.name}?`)) {
                                                    onDelete(client.id);
                                                }
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
