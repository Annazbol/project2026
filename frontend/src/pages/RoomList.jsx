import React, { useEffect, useState } from 'react';

const tg = window.Telegram?.WebApp;

const RoomList = ({ onSelectRoom }) => {
  const [rooms, setRooms] = useState([
    {
      id: 1,
      number: "Кабинет 204",
      description: "Тихая зона с мягкими пуфами и проектором. Идеально для командной работы.",
      image: "https://sao.mos.ru/парк%20Сокольники_U2zfdmLEodg.jpg"
    },
    {
      id: 2,
      number: "Кабинет 305",
      description: "Рабочая зона с компьютерами и быстрым интернетом.",
      image: "https://quasa.io/storage/photos/Фото%2014/AFP%205.jpeg"
    }
  ]);

  useEffect(() => {
    tg?.expand();
  }, []);

  const handleSelect = (roomId) => {
    tg?.HapticFeedback.impactOccurred('light');
    console.log("Выбрана комната:", roomId);
    if (onSelectRoom) onSelectRoom(roomId);
  };

  const styles = {
    container: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '16px',
      padding: '16px',
      backgroundColor: 'var(--tg-theme-bg-color, #ffffff)',
    },
    card: {
      background: 'var(--tg-theme-secondary-bg-color, #f4f4f5)',
      borderRadius: '12px',
      overflow: 'hidden',
      border: 'none',
      display: 'flex',
      flexDirection: 'column',
      cursor: 'pointer',
      textAlign: 'left',
      padding: 0,
      width: '100%',
    },
    image: {
      width: '100%',
      height: '180px',
      objectFit: 'cover',
      backgroundColor: '#ddd',
    },
    info: { padding: '12px' },
    number: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '4px',
      display: 'block',
      color: 'var(--tg-theme-text-color, #222222)',
    },
    description: {
      fontSize: '14px',
      color: 'var(--tg-theme-hint-color, #707579)',
      lineHeight: '1.4',
    }
  };

  return (
    <div style={styles.container}>
      {rooms.map(room => (
        <button key={room.id} style={styles.card} onClick={() => handleSelect(room.id)}>
          <img src={room.image} alt={room.number} style={styles.image} />
          <div style={styles.info}>
            <span style={styles.number}>{room.number}</span>
            <p style={styles.description}>{room.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default RoomList;