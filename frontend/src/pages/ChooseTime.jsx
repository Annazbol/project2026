import React, { useState, useEffect } from 'react';
import { fetchAvailableTimeSlots } from '../api'; // Импорт вашей функции из api.js

const tg = window.Telegram?.WebApp;

export default function ChooseTime({ selectedRoomId, selectedDate, peopleCount, onSelectTime, goBack }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);

    useEffect(() => {
        const loadSlots = async () => {
            try {
                setLoading(true);
                setError(false);
                
                // Формируем тело запроса для вашего FastAPI
                const payload = {
                    room_id: selectedRoomId,
                    slot_date: selectedDate,
                    num_of_people: peopleCount
                };

                const data = await fetchAvailableTimeSlots(payload);
                
                if (data.success) {
                    // Предполагаем, что бэкенд возвращает список объектов [{time: "09:00", start: "09:00", is_available: true}, ...]
                    setTimeSlots(data.time_slots || []);
                } else {
                    throw new Error("Не удалось получить слоты");
                }
            } catch (err) {
                console.error("Ошибка загрузки времени:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (selectedRoomId && selectedDate) {
            loadSlots();
        }
    }, [selectedRoomId, selectedDate, peopleCount]);

    const handleConfirm = () => {
        if (selectedSlot) {
            tg?.HapticFeedback.impactOccurred('medium');
            onSelectTime(selectedSlot); // Передаем объект слота в App.js
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Поиск свободного времени...</div>;

    if (error) return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: 'red' }}>Ошибка загрузки данных</p>
            <button onClick={goBack}>Вернуться назад</button>
        </div>
    );

    return (
        <div style={{ padding: '16px', color: 'var(--tg-theme-text-color)' }}>
            <h2 style={{ textAlign: 'center' }}>Выберите время</h2>
            <p style={{ textAlign: 'center', color: 'var(--tg-theme-hint-color)', fontSize: '14px' }}>
                Доступные интервалы на {selectedDate}
            </p>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '10px', 
                marginTop: '20px',
                marginBottom: '30px'
            }}>
                {timeSlots.length > 0 ? (
                    timeSlots.map((slot, index) => (
                        <button
                            key={index}
                            disabled={!slot.is_available}
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                                padding: '12px 5px',
                                borderRadius: '10px',
                                border: 'none',
                                backgroundColor: selectedSlot?.time === slot.time 
                                    ? 'var(--tg-theme-button-color)' 
                                    : 'var(--tg-theme-secondary-bg-color)',
                                color: selectedSlot?.time === slot.time 
                                    ? 'var(--tg-theme-button-text-color)' 
                                    : (slot.is_available ? 'var(--tg-theme-text-color)' : 'var(--tg-theme-hint-color)'),
                                opacity: slot.is_available ? 1 : 0.4,
                                cursor: slot.is_available ? 'pointer' : 'default',
                                fontWeight: '500'
                            }}
                        >
                            {slot.time}
                        </button>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                        Свободного времени не осталось 
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                    className="btn-primary" 
                    disabled={!selectedSlot}
                    onClick={handleConfirm}
                    style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: 'var(--tg-theme-button-color)',
                        color: 'var(--tg-theme-button-text-color)',
                        fontWeight: 'bold',
                        opacity: selectedSlot ? 1 : 0.6
                    }}
                >
                    Подтвердить время
                </button>
                
                <button onClick={goBack} style={{ background: 'none', border: 'none', color: 'var(--tg-theme-link-color)', padding: '10px' }}>
                    ← Изменить количество человек
                </button>
            </div>
        </div>
    );
}