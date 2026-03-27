import React, { useState, useEffect } from 'react';

const tg = window.Telegram?.WebApp;

const DatePicker = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);

  useEffect(() => {
    tg?.expand();
    // Генерация доступных дат на 30 дней вперед
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    setAvailableDates(dates);
  }, []);

  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days = [];
    // Пустые ячейки
    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day other-month" style={{ opacity: 0.2 }}></div>);
    }

    // Дни месяца
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      const isAvailable = availableDates.includes(dateStr);
      const isSelected = selectedDate === dateStr;

      days.push(
        <div
          key={dateStr}
          onClick={() => isAvailable && handleDateSelect(dateStr)}
          style={{
            aspectRatio: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            cursor: isAvailable ? 'pointer' : 'not-allowed',
            background: isSelected ? 'var(--tg-theme-button-color, #4c8bf5)' : (isAvailable ? '#e8f5e9' : 'transparent'),
            color: isSelected ? '#fff' : 'var(--tg-theme-text-color)',
            border: '1px solid rgba(0,0,0,0.1)',
            opacity: isAvailable ? 1 : 0.3,
            fontWeight: '600'
          }}
        >
          {d}
        </div>
      );
    }
    return days;
  };

  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
    tg?.HapticFeedback.impactOccurred('light');
  };

  const confirmDate = () => {
    tg?.sendData(JSON.stringify({ action: 'select_date', date: selectedDate }));
    tg?.close();
  };

  return (
    <div style={{ padding: '20px', color: 'var(--tg-theme-text-color)' }}>
      <div style={{ background: 'linear-gradient(135deg, #4c8bf5 0%, #2c5aa6 100%)', color: 'white', padding: '20px', borderRadius: '20px', textAlign: 'center', marginBottom: '20px' }}>
        <h2>📅 Дата посещения</h2>
        <p>Выберите день для бронирования</p>
      </div>

      <div style={{ background: 'var(--tg-theme-secondary-bg-color)', borderRadius: '20px', padding: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>←</button>
          <span style={{ fontWeight: 'bold' }}>
            {currentMonth.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>→</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', fontSize: '12px', color: 'var(--tg-theme-hint-color)' }}>
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => <div key={day}>{day}</div>)}
          {renderDays()}
        </div>
      </div>

      <div style={{ marginTop: '20px', background: 'linear-gradient(135deg, #4c8bf5 0%, #2c5aa6 100%)', padding: '20px', borderRadius: '20px', color: 'white' }}>
        <p>Выбрано: <b>{selectedDate || 'Не выбрана'}</b></p>
        <button 
          disabled={!selectedDate}
          onClick={confirmDate}
          style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', marginTop: '10px', fontWeight: 'bold', backgroundColor: 'var(--tg-theme-button-color)', color: 'white', opacity: selectedDate ? 1 : 0.5 }}
        >
          ✅ Подтвердить дату
        </button>
      </div>
    </div>
  );
};

export default DatePicker;