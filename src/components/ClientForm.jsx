import { useState } from 'react';

const WEEKDAYS = [
    { value: 0, label: 'Dom', fullLabel: 'Domingo' },
    { value: 1, label: 'Seg', fullLabel: 'Segunda' },
    { value: 2, label: 'Ter', fullLabel: 'Terça' },
    { value: 3, label: 'Qua', fullLabel: 'Quarta' },
    { value: 4, label: 'Qui', fullLabel: 'Quinta' },
    { value: 5, label: 'Sex', fullLabel: 'Sexta' },
    { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

export default function ClientForm({ onSubmit, loading }) {
    const [formData, setFormData] = useState({
        name: '',
        instagram_url: '',
        posting_days: [1, 3, 5] // Segunda, Quarta, Sexta por padrão
    });

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
                // Remover dia (mas manter pelo menos 1)
                if (currentDays.length > 1) {
                    return {
                        ...prev,
                        posting_days: currentDays.filter(d => d !== dayValue).sort((a, b) => a - b)
                    };
                }
                return prev;
            } else {
                // Adicionar dia
                return {
                    ...prev,
                    posting_days: [...currentDays, dayValue].sort((a, b) => a - b)
                };
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validação básica
        if (!formData.name.trim() || !formData.instagram_url.trim()) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        if (formData.posting_days.length === 0) {
            alert('Selecione pelo menos um dia da semana para postagem.');
            return;
        }

        // Normalizar URL do Instagram
        let url = formData.instagram_url.trim();
        if (url.startsWith('@')) {
            url = url.substring(1);
        }
        if (!url.includes('instagram.com')) {
            url = `https://www.instagram.com/${url}/`;
        }
        if (!url.startsWith('http')) {
            url = `https://${url}`;
        }

        onSubmit({
            name: formData.name,
            instagram_url: url,
            posting_days: formData.posting_days,
            posts_per_week: formData.posting_days.length // Compatibilidade
        });

        // Limpar formulário
        setFormData({
            name: '',
            instagram_url: '',
            posting_days: [1, 3, 5]
        });
    };

    return (
        <div className="card">
            <div className="card-header">
                <h2 className="card-title">
                    <span className="card-title-icon">➕</span>
                    Cadastrar Novo Cliente
                </h2>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label" htmlFor="name">
                            Nome do Cliente *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="form-input"
                            placeholder="Ex: Empresa ABC"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="instagram_url">
                            URL ou @usuario do Instagram *
                        </label>
                        <input
                            type="text"
                            id="instagram_url"
                            name="instagram_url"
                            className="form-input"
                            placeholder="Ex: @empresa ou instagram.com/empresa"
                            value={formData.instagram_url}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group form-group-full">
                        <label className="form-label">
                            Dias de Postagem *
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

                    <div className="form-group">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Cadastrando...
                                </>
                            ) : (
                                <>
                                    📥 Cadastrar Cliente
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
