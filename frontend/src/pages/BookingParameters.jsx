import React, { useEffect } from 'react';
import './BookingParameters.css';

const tg = window.Telegram?.WebApp;

export default function BookingParams() {
    useEffect(() => {
        if (tg) {
            tg.expand();
            tg.setHeaderColor('bg_color');
            tg.setBackgroundColor('bg_color');
            tg.BackButton.show();
            tg.BackButton.onClick(goBack);
        }

        return () => {
            tg?.BackButton.offClick(goBack);
        };
    }, []);

    const goBack = () => {
        tg?.sendData(JSON.stringify({ action: 'back', step: 'booking_params' }));
        tg?.close();
    };

    const openParamForm = (param) => {
        tg?.sendData(JSON.stringify({
            action: 'select_param',
            param: param
        }));
        tg?.close();
    };

    const params = [
        { key: 'room', label: 'Комната', icon: '🚪', description: 'Выберите комнату' },
        { key: 'date', label: 'Дата', icon: '📅', description: 'Выберите дату бронирования' },
        { key: 'time', label: 'Время начала', icon: '⏰', description: 'Выберите время' },
        { key: 'duration', label: 'Длительность', icon: '⏱️', description: 'Выберите длительность' },
        { key: 'peopleCount', label: 'Количество человек', icon: '👥', description: 'Выберите количество' }
    ];

    return (
        <div className="container">
            <div className="header">
                <h1>Параметры бронирования</h1>
                <p className="subtitle">Выберите параметр для настройки</p>
            </div>

            <div className="schedule-info">
                <div className="schedule-row">
                    <span>🕐 Режим работы:</span>
                    <span>8:00 – 20:30 (Пн–Сб)</span>
                </div>
                <div className="schedule-row">
                    <span>⏱️ Макс. длительность:</span>
                    <span>3 часа</span>
                </div>
                <div className="schedule-row">
                    <span>👥 Макс. человек:</span>
                    <span>10</span>
                </div>
            </div>

            <div className="params-grid">
                {params.map((param) => (
                    <button
                        key={param.key}
                        className="param-btn"
                        onClick={() => openParamForm(param.key)}
                    >
                        <div className="param-icon">{param.icon}</div>
                        <div className="param-content">
                            <div className="param-label">{param.label}</div>
                            <div className="param-desc">{param.description}</div>
                        </div>
                        <div className="param-arrow">→</div>
                    </button>
                ))}
            </div>

            <button className="btn-back" onClick={goBack}>← Назад</button>

        </div>
    );
}