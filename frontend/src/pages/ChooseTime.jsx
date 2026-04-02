import React, { useState, useEffect } from 'react';
import { fetchAvailableTimeSlots } from './api';

const tg = window.Telegram?.WebApp;

export default function ChooseTime({ room_id, selectedDate, num_of_people, onSelectTime, goBack }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);

    useEffect(() => {
        const loadSlots = async () => {
            try {
                setLoading(true);
                setError(false);
                
                const payload = {
                    room_id: room_id,
                    slot_date: selectedDate,
                    num_of_people: num_of_people
                };

                const data = await fetchAvailableTimeSlots(payload);
                
                if (data.success) {
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
    }, [room_id, selectedDate, num_of_people]);

    const handleConfirm = () => {
        if (selectedSlot) {
            tg?.HapticFeedback.impactOccurred('medium');
            onSelectTime(selectedSlot);
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
                                backgroundColor: selected