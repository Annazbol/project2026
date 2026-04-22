import React, { useState, useEffect, useMemo } from 'react';
import { checkBookingOptions } from '../api';
import './ChooseTime.css';

const tg = window.Telegram?.WebApp;

export default function ChooseTime({ bookingData, onSelectTime, goBack }) {
    const [loading, setLoading] = useState(true);
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);

    useEffect(() => {
        const loadSlots = async () => {
            try {
                setLoading(true);
                const data = await checkBookingOptions({
                    ...bookingData,
                    start_time: null
                });

                const slots = (data.available_slots || []).slice(0, -2);

                const formatted = slots.map(time => ({
                    time: time.slice(0, 5),
                    start: time,
                    is_available: true
                }));

                setTimeSlots(formatted);
            } catch (err) {
                console.error("Ошибка загрузки времени", err);
            } finally {
                setLoading(false);
            }
        };
        loadSlots();
    }, [bookingData]);

    // 🆕 Группировка слотов по периодам дня
    const groupedSlots = useMemo(() => {
        const groups = {
            morning: { label: '🌅 Утро', range: '08:00 – 11:59', slots: [] },
            day:     { label: '☀️ День',  range: '12:00 – 16:59', slots: [] },
            evening: { label: '🌆 Вечер', range: '17:00 – 20:30', slots: [] },
        };

        timeSlots.forEach(slot => {
            const hour = parseInt(slot.time.split(':')[0], 10);
            if (hour < 12) groups.morning.slots.push(slot);
            else if (hour < 17) groups.day.slots.push(slot);
            else groups.evening.slots.push(slot);
        });

        return groups;
    }, [timeSlots]);

    // 🆕 Расчёт времени окончания
    const endTime = useMemo(() => {
        if (!selectedSlot || !bookingData.duration_minutes) return null;
        const [h, m] = selectedSlot.time.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m + bookingData.duration_minutes, 0);
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }, [selectedSlot, bookingData.duration_minutes]);

    // 🆕 Форматирование даты для заголовка
    const formattedDate = useMemo(() => {
        if (!bookingData.booking_date) return '';
        return new Date(bookingData.booking_date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            weekday: 'long'
        });
    }, [bookingData.booking_date]);

    const handleSelect = (slot) => {
        tg?.HapticFeedback?.selectionChanged();
        setSelectedSlot(slot);
    };

    const handleConfirm = () => {
        tg?.HapticFeedback?.impactOccurred('medium');
        onSelectTime(selectedSlot);
    };

    return (
        <div className="time-container">
            {/* Заголовок */}
            <div className="time-header">
                <h2 className="time-title">Выберите время</h2>
                {formattedDate && (
                    <div className="time-subtitle">📅 {formattedDate}</div>
                )}
            </div>  

            {/* Превью выбранного времени */}
            {selectedSlot && (
                <div className="selected-preview">
                    <div className="selected-label">Вы выбрали</div>
                    <div className="selected-time">
                        <span className="time-big">{selectedSlot.time}</span>
                        {endTime && (
                            <>
                                <span className="time-separator">→</span>
                                <span className="time-end">{endTime}</span>
                            </>
                        )}
                    </div>
                    {bookingData.duration_minutes && (
                        <div className="selected-duration">
                            ⏱ {bookingData.duration_minutes} минут
                        </div>
                    )}
                </div>
            )}

            {/* Контент */}
            <div className="time-content">
                {loading ? (
                    <div className="skeleton-grid">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="skeleton-slot" />
                        ))}
                    </div>
                ) : timeSlots.length === 0 ? (
                    <div className="empty-slots">
                        <div className="empty-icon">⏰</div>
                        <div className="empty-title">Нет свободного времени</div>
                        <div className="empty-text">
                            Попробуйте выбрать другую дату или комнату
                        </div>
                    </div>
                ) : (
                    <>
                        {Object.entries(groupedSlots).map(([key, group]) => (
                            group.slots.length > 0 && (
                                <div key={key} className="time-section">
                                    <div className="section-header">
                                        <span className="section-label">{group.label}</span>
                                        <span className="section-range">{group.range}</span>
                                    </div>
                                    <div className="time-grid">
                                        {group.slots.map((slot, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleSelect(slot)}
                                                className={`slot-btn ${selectedSlot?.time === slot.time ? 'active' : ''}`}
                                            >
                                                {slot.time}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}
                    </>
                )}
            </div>

            {/* Sticky-футер */}
            <div className="actions-footer">
                <button
                    className="btn-primary confirm-btn"
                    disabled={!selectedSlot}
                    onClick={handleConfirm}
                >
                    {selectedSlot ? `Подтвердить ${selectedSlot.time}` : 'Выберите время'}
                </button>
                <button className="btn-back" onClick={goBack}>
                    Назад
                </button>
            </div>
        </div>
    );
}