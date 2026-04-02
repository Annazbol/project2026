import React, { useState, useEffect } from 'react';

const tg = window.Telegram?.WebApp;

const DatePicker = ({ onSelectDate, goBack }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);

  useEffect(() => {
    tg?.expand();
    // Генерируем список доступных дат (сегодня + 30 дней)
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toISOString().split('T')[0]); // Формат '2026-04-02'
    }
    setAvailableDates(dates);
  }, []);

  const formatToISO = (year, month, day) => {
    const d = new Date(year, month, day, 12, 0, 0); // Используем полдень во избежание сдвига часовых поясов
    return d.toISOString().split('T')[0];
  };

  const confirmDate = () => {
    if (selectedDate) {
      tg?.HapticFeedback.impactOccurred('medium');
      onSelectDate(selectedDate); // Отправляем дату в App.jsx
    }
  };

  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Определяем день недели для первого числа (Пн=0, Вс=6)
    let startOffset = firstDay.getDay() - 1;
    if (startOffset === -1) startOffset = 6;

    const days = [];
    // Пустые ячейки для выравнивания начала месяца
    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} style={{ padding: '10px' }}></div>);
    }

    // Дни месяца
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = formatToISO(year, month, d);
      const isAvailable = availableDates.includes(dateStr);
      const isSelected = selectedDate === dateStr;

      days.push(
        <div
          key={d}
          onClick={() => isAvailable && setSelectedDate(dateStr)}
          style={{
            padding: '12px 0',
            textAlign: 'center',
            borderRadius: '10px',
            cursor: isAvailable ? 'pointer' : 'default',
            backgroundColor: isSelected 
              ? 'var(--tg-theme-button-color)' 
              : 'transparent',
            color: isSelected 
              ? 'var(--tg-theme-button-text-color)' 
              : (isAvailable ? 'var(--tg-theme-text-color)' : 'var(--tg-theme-hint-color)'),
            fontWeight: isSelected ? 'bold' : 'normal',
            opacity: isAvailable ? 1 : 0.3
          }}
        >
          {d}
        </div>
      );
    }
    return days;
  };

  return (
    <div style={{ padding: '16px', color: 'var(--tg-theme-text-color)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Выберите дату</h2>
      
      <div style={{ 
        background: 'var(--tg-theme-secondary-bg-color)', 
        padding: '15px', 
        borderRadius: '15px',
        marginBottom: '20px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
          <button 
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
            style={{ background: 'none', border: 'none', color: 'var(--tg-theme-button-color)', fontSize: '18px' }}
          >
            ←
          </button>
          <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
            {currentMonth.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
            style={{ background: 'none', border: 'none', color: 'var(--tg-theme-button-color)', fontSize: '18px' }}
          >
            →
          </button>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(7, 1fr)', 
          gap: '5px', 
          textAlign: 'center', 
          fontSize: '12px', 
          color: 'var(--tg-theme-hint-color)',
          marginBottom: '10px'
        }}>
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => <div key={day}>{day}</div>)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
          {renderDays()}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button 
          disabled={!selectedDate}
          onClick={confirmDate}
          style={{ 
            padding: '16px', 
            borderRadius: '12px', 
            border: 'none', 
            backgroundColor: 'var(--tg-theme-button-color)', 
            color: 'var(--tg-theme-button-text-color)',
            fontWeight: 'bold',
            fontSize: '16px',
            opacity: selectedDate ? 1 : 0.5
          }}
        >
          {selectedDate ? `Выбрать ${new Date(selectedDate).toLocaleDateString('ru-RU')}` : 'Выберите день'}
        </button>
        
        <button 
          onClick={goBack} 
          style={{ background: 'none', border: 'none', color: 'var(--tg-theme-hint-color)', padding: '10px' }}
        >
          ← Назад к списку комнат
        </button>
      </div>
    </div>
  );
};

export default DatePicker;