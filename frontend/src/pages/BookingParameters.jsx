import React, { useEffect } from 'react';

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

            <style jsx>{`
                .container {
                    max-width: 400px;
                    margin: 0 auto;
                    padding: 20px;
                    padding-bottom: 40px;
                }

                .header {
                    margin-bottom: 24px;
                    padding-top: 20px;
                }

                .header h1 {
                    font-size: 28px;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: var(--tg-theme-text-color, #000000);
                }

                .subtitle {
                    font-size: 14px;
                    color: var(--tg-theme-hint-color, #8e8e93);
                }

                .schedule-info {
                    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
                    border-radius: 16px;
                    padding: 16px;
                    margin-bottom: 24px;
                }

                .schedule-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 6px 0;
                    font-size: 13px;
                    color: var(--tg-theme-text-color, #000000);
                }

                .params-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 24px;
                }

                .param-btn {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
                    border: none;
                    border-radius: 16px;
                    padding: 16px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    width: 100%;
                    text-align: left;
                }

                .param-btn:active {
                    transform: scale(0.98);
                }

                .param-icon {
                    font-size: 32px;
                }

                .param-content {
                    flex: 1;
                }

                .param-label {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 4px;
                    color: var(--tg-theme-text-color, #000000);
                }

                .param-desc {
                    font-size: 12px;
                    color: var(--tg-theme-hint-color, #8e8e93);
                }

                .param-arrow {
                    font-size: 20px;
                    color: var(--tg-theme-hint-color, #8e8e93);
                }

                .btn-back {
                    width: 100%;
                    padding: 14px 20px;
                    background-color: transparent;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--tg-theme-link-color, #2481cc);
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}