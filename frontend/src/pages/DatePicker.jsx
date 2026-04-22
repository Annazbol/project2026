import React, { useState, useEffect } from 'react';
import './DatePicker.css';
import { checkBookingOptions } from '../api';

const tg = window.Telegram?.WebApp;

const DatePicker = ({ bookingData, goBack, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(bookingData.booking_date || null);
  const [availableDates, setAvailableDates] = useState([]);

  // Хелпер для форматирования даты для отображения
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  useEffect(() => {
    const loadDates = async () => {
      try {
        const data = await checkBookingOptions({
          ...bookingData,
          booking_date: null
        });
        setAvailableDates(data.available_dates || []);
      } catch (error) {
        console.error('Ошибка загрузки дат:', error);
      }
    };
    loadDates();
  }, [bookingData.room_id, bookingData.people_count]); 

  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
    tg?.HapticFeedback?.impactOccurred('light');
  };

  const confirmDate = () => {
    // onSelectDate передаст исходный ISO формат (yyyy-mm-dd), как и ожидает API
    onSelectDate(selectedDate);
  };

  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days = [];

    for (let i = 0; i < startOffset; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty" />);
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];

      const isAvailable = availableDates.includes(dateStr);
      const isSelected = selectedDate === dateStr;

      let className = 'calendar-day ';

      if (isSelected) className += 'selected';
      else if (isAvailable) className += 'available';
      else className += 'unavailable';

      days.push(
        <div
          key={dateStr}
          className={className}
          onClick={() => isAvailable && handleDateSelect(dateStr)}
        >
          {d}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="date-picker-container">
      <div className="date-picker-header">
        <h2>📅 Выбор даты</h2>
        <p>Пожалуйста, выберите подходящий день</p>
      </div>

      <div className="date-picker-calendar">
        <div className="calendar-nav">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
          >←</button>

          <span className="calendar-month">
            {currentMonth.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
          </span>

          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
          >→</button>
        </div>

        <div className="calendar-grid">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
          {renderDays()}
        </div>
      </div>

      {/* ОТОБРАЖЕНИЕ ДАТЫ В НОВОМ ФОРМАТЕ */}
      <div className="selected-date-box">
        <p>
          Выбрано: <b>{formatDateDisplay(selectedDate)}</b>
        </p>
      </div>

      <button className="back-btn" onClick={goBack}>
        Назад
      </button>
      <button
          className="confirm-btn"
          disabled={!selectedDate}
          onClick={confirmDate}
        >
          Подтвердить дату
        </button>
    </div>
  );
};

export default DatePicker;