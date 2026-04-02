import React, { useState, useEffect } from 'react';
import { fetchAvailablePeopleCounts } from '../api'; // Импортируем функцию из вашего api.js

const tg = window.Telegram?.WebApp;

export default function Peoples({ onSelectPeople, goBack }) {
    const [loading, setLoading] = useState(true);
    const [availableOptions, setAvailableOptions] = useState([]);
    const [selectedCount, setSelectedCount] = useState(null);
    const [error, setError] = useState(null);

    // Загружаем доступные варианты при открытии экрана
    useEffect(() => {
        const loadOptions = async () => {
            try {
                setLoading(true);
                // Делаем запрос к вашему FastAPI
                const data = await fetchAvailablePeopleCounts();
                
                // Если бэкенд вернул success: true и список
                if (data.success) {
                    setAvailableOptions(data.available_counts);
                } else {
                    // Если данных нет, ставим стандартный набор (заглушка)
                    setAvailableOptions([1, 2, 4, 6, 8]);
                }
            } catch (err) {
                console.error("Ошибка загрузки вместимости:", err);
                setError("Не удалось загрузить данные");
                // Стандартные значения на случай ошибки сервера
                setAvailableOptions([1, 2, 3, 4, 5]);
            } finally {
                setLoading(false);
            }
        };

        loadOptions();
    }, []);

    const handleConfirm = () => {
        if (selectedCount) {
            tg?.HapticFeedback.impactOccurred('medium');
            onSelectPeople(selectedCount); // Передаем выбор в App.js
        }
    };

    if (loading) return <div className="loader">Загрузка вариантов...</div>;

    return (
        <div className="peoples-container" style={{ padding: '20px', color: 'var(--tg-theme-text-color)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Сколько вас будет?</h2>
            
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

            <div className="options-grid" style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px',
                marginBottom: '30px' 
            }}>
                {availableOptions.map(count => (
                    <button
                        key={count}
                        onClick={() => setSelectedCount(count)}
                        style={{
                            padding: '15px',
                            borderRadius: '12px',
                            border: '2px solid',
                            borderColor: selectedCount === count ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.1)',
                            backgroundColor: selectedCount === count ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-secondary-bg-color)',
                            color: selectedCount === count ? 'var(--tg-theme-button-text-color)' : 'var(--tg-theme-text-color)',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {count} {count === 1 ? 'человек' : 'человека'}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                    className="btn-primary" 
                    disabled={!selectedCount}
                    onClick={handleConfirm}
                    style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: 'var(--tg-theme-button-color)',
                        color: 'var(--tg-theme-button-text-color)',
                        opacity: selectedCount ? 1 : 0.6,
                        fontWeight: 'bold'
                    }}
                >
                    Продолжить
                </button>

                <button 
                    onClick={goBack}
                    style={{
                        padding: '10px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--tg-theme-hint-color)',
                        cursor: 'pointer'
                    }}
                >
                    ← Назад к выбору даты
                </button>
            </div>
        </div>
    );
}