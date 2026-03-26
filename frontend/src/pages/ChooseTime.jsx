import React, { useState, useEffect } from 'react';

const tg = window.Telegram?.WebApp;

export default function ChooseTime() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [infoMessage, setInfoMessage] = useState('');
    const [warning, setWarning] = useState('');

    const fetchAvailableTimeSlots = async () => {
        try {
            setLoading(true);
            setError(false);
            
            const response = await fetch('/api/available-time-slots', {
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
                // Моковые данные как в оригинале, если API не вернет список
                setTimeSlots(data.time_slots || [
                    { time: "09:00", start: "09:00", end: "10:00", is_available: true },
                    { time: "10:00", start: "10:00", end: "11:00", is_available: true },
                    { time: "11:00", start: "11:00", end: "12:00", is_available: true },
                    // ... остальные слоты
                ]);
                if (data.info_message) setInfoMessage(data.info_message);
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
        tg?.sendData(JSON.stringify({ action: 'back', step: 'time_selection' }));
        tg?.close();
    };

    const submitSelection = () => {
        if (!selectedSlot) {
            tg?.showAlert('Пожалуйста, выберите время бронирования');
            return;
        }
        tg?.sendData(JSON.stringify({
            action: 'select_time_slot',
            time_start: selectedSlot.start,
            time_end: selectedSlot.end
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
        
        fetchAvailableTimeSlots();

        return () => {
            tg?.BackButton.offClick(goBack);
        };
    }, []);

    return (
        <div className="container">
            <div className="header">
                <h1>Выбор времени</h1>
                <p className="subtitle">Выберите удобное время для бронирования</p>
            </div>

            {loading && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Загрузка доступных слотов времени...</p>
                </div>
            )}

            {error && !loading && (
                <div className="error-state">
                    <p>⚠️ Не удалось загрузить доступные слоты времени</p>
                    <button 
                        className="btn" 
                        style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)', marginTop: '12px' }} 
                        onClick={fetchAvailableTimeSlots}
                    >
                        Повторить
                    </button>
                </div>
            )}

            {!loading && !error && (
                <div>
                    {infoMessage && (
                        <div className="info-message">
                            <p>💡 <span>{infoMessage}</span></p>
                        </div>
                    )}

                    <div className="time-section">
                        <div className="section-title">Доступные слоты времени</div>
                        <div className="time-grid">
                            {timeSlots.length === 0 ? (
                                <div className="no-slots">Нет доступных слотов времени</div>
                            ) : (
                                timeSlots.map((slot, index) => (
                                    <button
                                        key={index}
                                        className={`time-slot ${!slot.is_available ? 'unavailable' : ''} ${selectedSlot?.time === slot.time ? 'selected' : ''}`}
                                        disabled={!slot.is_available}
                                        onClick={() => setSelectedSlot(slot)}
                                    >
                                        {slot.time}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {warning && (
                        <div className="warning-message">
                            <p>⚠️ <span>{warning}</span></p>
                        </div>
                    )}

                    <button 
                        className="btn btn-primary" 
                        disabled={!selectedSlot || timeSlots.length === 0} 
                        onClick={submitSelection}
                    >
                        Выбрать время
                    </button>
                </div>
            )}

            <button className="btn btn-back" onClick={goBack}>← Назад</button>
        </div>
    );
}