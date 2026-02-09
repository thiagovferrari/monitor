export default function StatusBadge({ status }) {
    const statusConfig = {
        em_dia: {
            label: 'Em Dia',
            className: 'status-badge--em_dia'
        },
        atrasado: {
            label: 'Atrasado',
            className: 'status-badge--atrasado'
        },
        pending: {
            label: 'Pendente',
            className: 'status-badge--pending'
        }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span className={`status-badge ${config.className}`}>
            <span className="status-dot"></span>
            {config.label}
        </span>
    );
}
