import React, { useState, useEffect } from 'react';

const tg = window.Telegram?.WebApp;

export default function Peoples() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [availableOptions, setAvailableOptions] = useState([]);
    const [selectedCount, setSelectedCount] = useState(null);
    const [warning, setWarning] = useState('');

    const fetchAvailableOptions = async () => {
        try {
            setLoading(true);
            setError(false);
            
            const response = await fetch('/api/available-people-counts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-Init-Data': tg?.initData || ''
                },
                body: JSON.stringify({})
            });
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();
            
            if (data.success) {
                setAvailableOptions(data.available_counts || [1, 2, 3, 4, 5, 6, 8, 10]);
                if (data.warning) setWarning(data.warning);
            } else {
                throw new Error(data.error || 'Неизвестная ошибка');
            }
        } catch (err) {
            console.error('Ошибка:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        tg?.sendData(JSON.stringify({ action: 'back', step: 'people_count' }));
        tg?.close();
    };

    const submitSelection = () => {
        if (!selectedCount) {
            tg?.showAlert('Пожалуйста, выберите количество человек');
            return;
        }
        tg?.sendData(JSON.stringify({
            action: 'select_people_count',
            people_count: selectedCount
        }));
        tg?.close();
    };

    useEffect(() => {
        if (tg) {
            tg.expand();
            tg.setHeaderColor('bg_color');
            tg.BackButton.show();
            tg.BackButton.onClick(goBack);
        }
        
        fetchAvailableOptions();

        return () => {
            tg?.BackButton.offClick(goBack);
        };
    }, []);

    return (
        <div className="container">
            <div className="header">
                <h1>Выбор количества человек</h1>
                <p className="subtitle">Выберите количество участников бронирования</p>
            </div>

            {loading && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Загрузка доступных вариантов...</p>
                </div>
            )}

            {error && !loading && (
                <div className="error-state">
                    <p>⚠️ Не удалось загрузить доступные варианты</p>
                    <button 
                        className="btn" 
                        style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)', marginTop: '12px' }} 
                        onClick={fetchAvailableOptions}
                    >
                        Повторить
                    </button>
                </div>
            )}

            {!loading && !error && (
                <div>
                    <div className="section-title">Доступные варианты</div>
                    
                    <div className="options-grid" style={{ marginBottom: '24px' }}>
                        {availableOptions.length === 0 ? (
                            <div className="no-options">Нет доступных вариантов</div>
                        ) : (
                            availableOptions.map(count => (
                                <button
                                    key={count}
                                    className={`option-btn ${selectedCount === count ? 'selected' : ''}`}
                                    onClick={() => setSelectedCount(count)}
                                >
                                    {count} чел.
                                </button>
                            ))
                        )}
                    </div>

                    {warning && (
                        <div className="warning-message">
                            <p>⚠️ {warning}</p>
                        </div>
                    )}

                    <button 
                        className="btn btn-primary" 
                        disabled={!selectedCount || availableOptions.length === 0}
                        onClick={submitSelection}
                    >
                        Продолжить
                    </button>
                </div>
            )}

            <button className="btn btn-back" onClick={goBack}>← Назад</button>
        </div>
    );
}