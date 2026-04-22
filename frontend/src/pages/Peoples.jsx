import React, { useState, useEffect } from 'react';
import { checkBookingOptions } from '../api';
import './Peoples.css';

const tg = window.Telegram?.WebApp;

export default function Peoples({ bookingData, onSelectPeople, goBack }) {
    const [loading, setLoading] = useState(true);
    const [maxCapacity, setMaxCapacity] = useState(10);
    // Для слайдера нужно числовое значение по умолчанию (не null)
    const [selectedCount, setSelectedCount] = useState(bookingData.people_count || 1);

    useEffect(() => {
        const loadOptions = async () => {
            try {
                setLoading(true);
                const data = await checkBookingOptions({ ...bookingData, people_count: null });
                const max = data.max_capacity_found || 10;
                setMaxCapacity(max);
                
                // Если текущее выбранное значение больше максимума - сбрасываем до макс.
                if (selectedCount > max) {
                    setSelectedCount(max);
                }
            } catch (err) {
                setMaxCapacity(10);
            } finally {
                setLoading(false);
            }
        };
        loadOptions();
    }, [bookingData]);

    const handleSliderChange = (e) => {
        const val = parseInt(e.target.value, 10);
        setSelectedCount(val);
        // Вызываем легкую вибрацию при движении ползунка
        tg?.HapticFeedback?.selectionChanged(); 
    };

    const handleConfirm = () => {
        tg?.HapticFeedback?.impactOccurred('medium');
        onSelectPeople(selectedCount);
    };

    // Функция для правильных склонений (1 человек, 2 человека, 5 человек)
    const getPeopleLabel = (count) => {
        const mod10 = count % 10;
        const mod100 = count % 100;
        if (mod10 === 1 && mod100 !== 11) return 'человек';
        if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'человека';
        return 'человек';
    };

    if (loading) return <div className="loader">Загрузка...</div>;

    // Вычисляем процент заполнения ползунка синим цветом
    const fillPercentage = maxCapacity > 1 
        ? ((selectedCount - 1) / (maxCapacity - 1)) * 100 
        : 100;

    return (
        <div className="peoples-container">
            <div className="header-block">
                <h2>Количество гостей</h2>
                <p className="subtitle">Укажите, сколько человек будет присутствовать</p>
            </div>

            <div className="slider-section">
                {/* Огромное число по центру */}
                <div className="count-display">
                    <span className="count-number">{selectedCount}</span>
                    <span className="count-label">{getPeopleLabel(selectedCount)}</span>
                </div>

                {/* Сам ползунок */}
                <div className="slider-wrapper">
                    <span className="slider-min">1</span>
                    <input
                        type="range"
                        min="1"
                        max={maxCapacity}
                        value={selectedCount}
                        onChange={handleSliderChange}
                        className="people-slider"
                        style={{
                            background: `linear-gradient(to right, #0078D7 ${fillPercentage}%, #e0e0e0 ${fillPercentage}%)`
                        }}
                    />
                    <span className="slider-max">{maxCapacity}</span>
                </div>
            </div>

            <div className="actions-container">
                <button className="btn-primary" onClick={handleConfirm}>
                    Продолжить
                </button>
                <button className="btn-back" onClick={goBack}>
                    Назад
                </button>
            </div>
        </div>
    );
}