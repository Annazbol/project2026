import React, { useEffect } from 'react';
import './BookingParameters.css';

const tg = window.Telegram?.WebApp;

export default function BookingParams({ bookingData, onChooseRoom, onChooseDate, onChooseTime, onChooseDuration, onChoosePeople, goBack, onFinalBook }) {
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
    }, [goBack]);

    // Форматируем данные для красивого отображения
    const params = [
        { 
            key: 'room', 
            label: 'Комната', 
            icon: '🚪', 
            description: bookingData.room_id ? `Комната №${bookingData.room_id}` : 'Выберите комнату',
            onClick: onChooseRoom 
        },
        { 
            key: 'date', 
            label: 'Дата', 
            icon: '📅', 
            description: bookingData.booking_date || 'Выберите дату',
            onClick: onChooseDate 
        },
        { 
            key: 'time', 
            label: 'Время начала', 
            icon: '⏰', 
            description: bookingData.start_time ? bookingData.start_time.slice(0, 5) : 'Выберите время',
            onClick: onChooseTime 
        },
        { 
            key: 'duration', 
            label: 'Длительность', 
            icon: '⏱️', 
            description: `${bookingData.duration_minutes} мин.`,
            onClick: onChooseDuration 
        },
        { 
            key: 'peopleCount', 
            label: 'Количество человек', 
            icon: '👥', 
            description: `${bookingData.people_count} чел.`,
            onClick: onChoosePeople 
        }
    ];

    // Проверяем, все ли обязательные поля заполнены для активации кнопки

    return (
        <div className="container">
            <div className="header">
                <h1>Параметры бронирования</h1>
                <p className="subtitle">Проверьте данные перед подтверждением</p>
            </div>

            <div className="schedule-info">
                <div className="schedule-row"><span>🕐 Режим работы:</span><span>8:00 – 20:30 (Пн–Сб)</span></div>
                <div className="schedule-row"><span>⏱️ Макс. длительность:</span><span>3 часа</span></div>
                <div className="schedule-row"><span>👥 Макс. человек:</span><span>10</span></div>
            </div>

            <div className="params-grid">
                {params.map((param) => (
                    <button key={param.key} className="param-btn" onClick={param.onClick}>
                        <div className="param-icon">{param.icon}</div>
                        <div className="param-content">
                            <div className="param-label">{param.label}</div>
                            {/* Выводим реальное значение */}
                            <div className="param-desc" style={{ color: param.description.includes('Выберите') ? '#ff9800' : '#7F49B4', fontWeight: 600 }}>
                                {param.description}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <button 
                className="btn-book" 
                onClick={onFinalBook}
            >
                Забронировать
            </button>
            <button className="btn-back" onClick={goBack}>Назад</button>
        </div>
    );
}