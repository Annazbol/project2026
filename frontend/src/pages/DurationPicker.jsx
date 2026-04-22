import React, { useState, useEffect } from 'react';
import './DurationPicker.css';
import { checkBookingOptions } from '../api';

const tg = window.Telegram?.WebApp;

const DurationPicker = ({ bookingData, onConfirm, goBack }) => {
    const [loading, setLoading] = useState(true);
    const [durations, setDurations] = useState([]);
    const [selectedDuration, setSelectedDuration] = useState(
        bookingData.duration_minutes || null
    );

    useEffect(() => {
        const loadDurations = async () => {
            try {
                setLoading(true);

                // Отправляем все данные: комнату, дату, время, количество людей
                const data = await checkBookingOptions(bookingData);

                // Берем рассчитанный бэкендом максимум (например, 45 минут или 180 минут)
                const maxDuration = data.max_duration_minutes || 180;

                const options = [];
                // Генерируем кнопки с шагом 15 минут до достижения максимума
                for (let min = 15; min <= maxDuration; min += 15) {
                    options.push({
                        id: min,
                        label: formatDuration(min)
                    });
                }

                setDurations(options);

                // Если текущая выбранная длительность больше доступной - сбрасываем
                if (selectedDuration > maxDuration) {
                    setSelectedDuration(null);
                }

            } catch (err) {
                console.error('Ошибка загрузки длительности', err);
                setDurations([]);
            } finally {
                setLoading(false);
            }
        };

        loadDurations();
    }, [bookingData]);

    const formatDuration = (min) => {
        const h = Math.floor(min / 60);
        const m = min % 60;
        if (h === 0) return `${m} мин`;
        if (m === 0) return `${h} ч`;
        return `${h} ч ${m} мин`;
    };

    const handleConfirm = () => {
        if (!selectedDuration) return;
        tg?.HapticFeedback?.impactOccurred('medium');
        onConfirm(selectedDuration);
    };

    return (
        <div className="duration-picker-container">
            <div className="duration-header">
                <h2>Длительность</h2>
                <p>Выберите время аренды (от 15 мин до 3 ч)</p>
            </div>

            <div className="durations-grid">
                {loading ? (
                    <div className="loader">Загрузка вариантов...</div>
                ) : durations.length > 0 ? (
                    durations.map(duration => (
                        <button
                            key={duration.id}
                            className={`duration-option ${
                                selectedDuration === duration.id ? 'selected' : ''
                            }`}
                            onClick={() => {
                                setSelectedDuration(duration.id);
                                tg?.HapticFeedback?.selectionChanged();
                            }}
                        >
                            {duration.label}
                        </button>
                    ))
                ) : (
                    <div className="empty-state">
                        К сожалению, на это время комната доступна менее чем на 15 минут.
                    </div>
                )}
            </div>

            <div className="actions-footer">
                <button className="back-btn" onClick={goBack}>
                    Назад
                </button>
                <button
                    className="confirm-btn"
                    disabled={!selectedDuration}
                    onClick={handleConfirm}
                >
                    Забронировать
                </button>
            </div>
        </div>
    );
};

export default DurationPicker;