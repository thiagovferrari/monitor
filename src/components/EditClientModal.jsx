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
        posting_days: [1, 3, 5]
    });

    useEffect(() => {
        if (client) {
            setFormData({
                name: client.name || '',
                instagram_url: client.instagram_url || '',
                posting_days: client.posting_days || [1, 3, 5]
            });
        }
    }, [client]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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
        onSave({
            ...formData,
            posts_per_week: formData.posting_days.length
        });
    };

    if (!client) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">✏️ Editar Cliente</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label" htmlFor="edit-name">
                                Nome do Cliente
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
                            <label className="form-label">
                                Dias de Postagem
                            </label>
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
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary">
                            💾 Salvar Alterações
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
