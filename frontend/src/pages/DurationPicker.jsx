import React, { useState, useEffect } from 'react';
import { createBooking } from './api'; // Импорт функции финального бронирования

const tg = window.Telegram?.WebApp;

const DurationPicker = ({ bookingData, onConfirm, goBack }) => {
  const [durations, setDurations] = useState([]);
  const [selectedId, setSelectedId] = useState(60);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const options = [];
    for (let i = 30; i <= 180; i += 30) {
      options.push({
        id: i,
        label: formatDuration(i),
        popular: i === 60 || i === 120
      });
    }
    setDurations(options);
  }, []);

  const formatDuration = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m} мин`;
    if (m === 0) return `${h} ч`;
    return `${h} ч ${m} мин`;
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const finalData = {
        room_id: bookingData.roomId,
        slot_date: bookingData.date,
        start_time: bookingData.startTime,
        num_of_people: bookingData.peopleCount,
        duration_minutes: selectedId
      };

      const result = await createBooking(finalData);

      if (result.success) {
        tg?.HapticFeedback.notificationOccurred('success');
        onConfirm();
      } else {
        tg?.showAlert(`Ошибка: ${result.message || 'Место уже занято'}`);
      }
    } catch (error) {
      tg?.showAlert("Не удалось связаться с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', color: 'var(--tg-theme-text-color)' }}>
      <h2 style={{ textAlign: 'center' }}>На какое время?</h2>
      
      <div style={{ 
        background: 'var(--tg-theme-secondary-bg-color)', 
        padding: '15px', 
        borderRadius: '15px',
        marginBottom: '20px',
        fontSize: '14px'
      }}>
        <p style={{ margin: '5px 0' }}>📍 <b>{bookingData.roomName || `Кабинет ${bookingData.roomId}`}</b></p>
        <p style={{ margin: '5px 0' }}>📅 <b>{bookingData.date}</b> в <b>{bookingData.startTime}</b></p>
        <p style={{ margin: '5px 0' }}>👥 <b>{bookingData.peopleCount} чел.</b></p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '12px',
        marginBottom: '30px' 
      }}>
        {durations.map((d) => (
          <div
            key={d.id}
            onClick={() => {
                setSelectedId(d.id);
                tg?.HapticFeedback.impactOccurred('light');
            }}
            style={{
              position: 'relative',
              padding: '16px',
              textAlign: 'center',
              borderRadius: '16px',
              border: `2px solid ${selectedId === d.id ? 'var(--tg-theme-button-color)' : 'transparent'}`,
              backgroundColor: selectedId === d.id ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-secondary-bg-color)',
              color: selectedId === d.id ? 'var(--tg-theme-button-text-color)' : 'var(--tg-theme-text-color)',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s ease'
            }}
          >
            {d.popular && (
              <span style={{ 
                position: 'absolute', top: '-8px', right: '5px', 
                backgroundColor: '#ff9800', color: 'white', 
                fontSize: '10px', padding: '2px 6px', borderRadius: '10px' 
              }}>
                🔥
              </span>
            )}
            {d.label}
          </div>
        ))}
      </div>

      <button
        disabled={loading}
        onClick={handleFinalSubmit}
        style={{
          width: '100%',
          padding: '18px',
          borderRadius: '16px',
          border: 'none',
          backgroundColor: 'var(--tg-theme-button-color)',
          color: 'var(--tg-theme-button-text-color)',
          fontWeight: 'bold',
          fontSize: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        {loading ? 'Бронируем...' : 'Забронировать'}
      </button>

      <button 
        onClick={goBack}
        style={{
            width: '100%',
            background: 'none',
            border: 'none',
            marginTop: '15px',
            color: 'var(--tg-theme-hint-color)'
        }}
      >
        ← Изменить время начала
      </button>
    </div>
  );
};

export default DurationPicker;