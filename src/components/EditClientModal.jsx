import { useState, useEffect } from 'react';

const WEEKDAYS = [
    { value: 0, label: 'Dom', fullLabel: 'Domingo' },
    { value: 1, label: 'Seg', fullLabel: 'Segunda' },
    { value: 2, label: 'Ter', fullLabel: 'Terça' },
    { value: 3, label: 'Qua', fullLabel: 'Quarta' },
    { value: 4, label: 'Qui', fullLabel: 'Quinta' },
    { value: 5, label: 'Sex', fullLabel: 'Sexta' },
    { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

export default function EditClientModal({ client, onSave, onClose }) {
    const [formData, setFormData] = useState({
        name: '',
        instagram_url: '',
        posting_days: [1, 3, 5],
        last_post_date: '',
        avg_likes: 0,
        avg_comments: 0,
    });

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name || '',
                instagram_url: client.instagram_url || '',
                posting_days: client.posting_days || [1, 3, 5],
                last_post_date: client.last_post_date
                    ? new Date(client.last_post_date).toISOString().slice(0, 16)
                    : '',
                avg_likes: client.avg_likes || 0,
                avg_comments: client.avg_comments || 0,
            });
        }
    }, [client]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value
        }));
    };

    const toggleDay = (dayValue) => {
        setFormData(prev => {
            const currentDays = prev.posting_days;
            if (currentDays.includes(dayValue)) {
                if (currentDays.length > 1) {
                    return {
                        ...prev,
                        posting_days: currentDays.filter(d => d !== dayValue).sort((a, b) => a - b)
                    };
                }
                return prev;
            } else {
                return {
                    ...prev,
                    posting_days: [...currentDays, dayValue].sort((a, b) => a - b)
                };
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const updates = {
            name: formData.name,
            instagram_url: formData.instagram_url,
            posting_days: formData.posting_days,
            posts_per_week: formData.posting_days.length,
            avg_likes: formData.avg_likes,
            avg_comments: formData.avg_comments,
        };

        // Atualizar data do último post se preenchida
        if (formData.last_post_date) {
            updates.last_post_date = new Date(formData.last_post_date).toISOString();
            updates.last_check_date = new Date().toISOString();
        }

        onSave(updates);
    };

    const handleMarkPostedToday = () => {
        setFormData(prev => ({
            ...prev,
            last_post_date: new Date().toISOString().slice(0, 16)
        }));
    };

    if (!client) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Editar Cliente</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-name">
                                Nome
                            </label>
                            <input
                                type="text"
                                id="edit-name"
                                name="name"
                                className="form-input"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-instagram">
                                Instagram
                            </label>
                            <input
                                type="text"
                                id="edit-instagram"
                                name="instagram_url"
                                className="form-input"
                                value={formData.instagram_url}
                                onChange={handleChange}
                                disabled
                            />
                            <span className="form-hint">O Instagram não pode ser alterado</span>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Dias de Postagem</label>
                            <div className="weekday-selector">
                                {WEEKDAYS.map(day => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        className={`weekday-btn ${formData.posting_days.includes(day.value) ? 'active' : ''}`}
                                        onClick={() => toggleDay(day.value)}
                                        title={day.fullLabel}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                            <span className="form-hint">
                                {formData.posting_days.length} dia(s) selecionado(s)
                            </span>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-last-post">
                                Último Post
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                                <input
                                    type="datetime-local"
                                    id="edit-last-post"
                                    name="last_post_date"
                                    className="form-input"
                                    value={formData.last_post_date}
                                    onChange={handleChange}
                                    style={{ flex: 1 }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={handleMarkPostedToday}
                                    title="Marcar como postado agora"
                                >
                                    Hoje
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="edit-likes">
                                    Média de Curtidas
                                </label>
                                <input
                                    type="number"
                                    id="edit-likes"
                                    name="avg_likes"
                                    className="form-input"
                                    value={formData.avg_likes}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="edit-comments">
                                    Média de Comentários
                                </label>
                                <input
                                    type="number"
                                    id="edit-comments"
                                    name="avg_comments"
                                    className="form-input"
                                    value={formData.avg_comments}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
