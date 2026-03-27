import React, { useState, useEffect } from 'react';

const tg = window.Telegram?.WebApp;

const DurationPicker = ({ roomName = "Загрузка...", bookingDate = "Сегодня" }) => {
  const [durations, setDurations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    tg?.ready();
    const options = [];
    for (let i = 30; i <= 180; i += 15) {
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

  const handleSelect = (id) => {
    setSelectedId(id);
    tg?.HapticFeedback.impactOccurred('light');
  };

  return (
    <div style={{ padding: '16px', backgroundColor: 'var(--tg-theme-bg-color)' }}>
      <div style={{ background: 'linear-gradient(135deg, #4c8bf5 0%, #2c5aa6 100%)', color: 'white', padding: '24px', borderRadius: '20px', textAlign: 'center', marginBottom: '20px' }}>
        <h1>Выбор длительности</h1>
        <p>Выберите удобное время</p>
      </div>

      <div style={{ background: 'var(--tg-theme-secondary-bg-color)', padding: '16px', borderRadius: '16px', marginBottom: '20px', fontSize: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: 'var(--tg-theme-hint-color)' }}>Комната:</span>
          <span style={{ fontWeight: '600' }}>{roomName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--tg-theme-hint-color)' }}>Дата:</span>
          <span style={{ fontWeight: '600' }}>{bookingDate}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {durations.map((d) => (
          <div
            key={d.id}
            onClick={() => handleSelect(d.id)}
            style={{
              position: 'relative',
              padding: '16px',
              textAlign: 'center',
              borderRadius: '16px',
              border: `2px solid ${selectedId === d.id ? 'var(--tg-theme-button-color)' : 'rgba(0,0,0,0.1)'}`,
              backgroundColor: selectedId === d.id ? 'rgba(76, 139, 245, 0.1)' : 'var(--tg-theme-bg-color)',
              cursor: 'pointer'
            }}
          >
            {d.popular && (
              <span style={{ position: 'absolute', top: '-10px', right: '-5px', backgroundColor: '#ff9800', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>
                🔥
              </span>
            )}
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{d.label}</div>
          </div>
        ))}
      </div>

      <button
        disabled={!selectedId}
        style={{
          width: '100%',
          marginTop: '24px',
          padding: '16px',
          borderRadius: '16px',
          border: 'none',
          backgroundColor: 'var(--tg-theme-button-color)',
          color: 'var(--tg-theme-button-text-color)',
          fontWeight: 'bold',
          opacity: selectedId ? 1 : 0.5
        }}
        onClick={() => tg?.sendData(JSON.stringify({ duration: selectedId }))}
      >
        Подтвердить выбор
      </button>
    </div>
  );
};

export default DurationPicker;