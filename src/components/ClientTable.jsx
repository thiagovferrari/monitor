import StatusBadge from './StatusBadge';

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function ClientTable({ clients, onDelete, onEdit, onRefresh, onScrapeOne, loading }) {
    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return 'Agora mesmo';
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `${diffDays} dias atrás`;

        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatNumber = (num) => {
        if (num === null || num === undefined) return '0';
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
                        <span className="card-title-icon">📋</span>
                        Clientes
                    </h2>
                </div>
                <div className="empty-state">
                    <div className="empty-state-icon">📱</div>
                    <h3 className="empty-state-title">Nenhum cliente cadastrado</h3>
                    <p>Adicione seu primeiro cliente acima.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">
                    <span className="card-title-icon">📋</span>
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
                        '↻ Atualizar'
                    )}
                </button>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Instagram</th>
                            <th>Dias</th>
                            <th>Último Post</th>
                            <th>Status</th>
                            <th>Curtidas</th>
                            <th>Comentários</th>
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
                                        @{client.instagram_username}
                                    </a>
                                </td>
                                <td>
                                    {renderPostingDays(client.posting_days)}
                                </td>
                                <td>
                                    {formatDate(client.last_post_date)}
                                </td>
                                <td>
                                    <StatusBadge status={client.status} />
                                </td>
                                <td>
                                    <span className="metric">
                                        <span className="metric-icon">❤️</span>
                                        <span className="metric-value">{formatNumber(client.avg_likes)}</span>
                                    </span>
                                </td>
                                <td>
                                    <span className="metric">
                                        <span className="metric-icon">💬</span>
                                        <span className="metric-value">{formatNumber(client.avg_comments)}</span>
                                    </span>
                                </td>
                                <td>
                                    <div className="actions-cell">
                                        {onScrapeOne && (
                                            <button
                                                className="btn btn-secondary btn-icon"
                                                title="Coletar dados deste perfil"
                                                onClick={() => onScrapeOne(client)}
                                            >
                                                ↻
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-secondary btn-icon"
                                            title="Editar"
                                            onClick={() => onEdit(client)}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn btn-danger btn-icon"
                                            title="Remover"
                                            onClick={() => {
                                                if (confirm(`Remover ${client.name}?`)) {
                                                    onDelete(client.id);
                                                }
                                            }}
                                        >
                                            ✕
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
