import React, { useEffect, useState } from 'react';
import { fetchRooms } from '../api';
import './RoomList.css'; // Импортируем вашу функцию

const tg = window.Telegram?.WebApp;

const RoomList = ({ onSelectRoom }) => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем данные с вашего FastAPI
    const loadRooms = async () => {
      try {
        setLoading(true);
        const data = await fetchRooms();
        // Приводим данные к удобному для фронтенда виду
        const formattedRooms = data.map(r => ({
          id: r.id_room,
          number: r.room_number,
          description: r.description || "Уютный коворкинг для работы и учебы",
          image: r.image_url || "https://via.placeholder.com/300x180?text=VyatSU+Room"
        }));
        setRooms(formattedRooms);
      } catch (error) {
        console.error("Ошибка загрузки комнат:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
    tg?.expand();
  }, []);

  const handleSelect = (room) => {
    tg?.HapticFeedback.impactOccurred('light');
    // Передаем и ID, и номер, чтобы в конце показать "Вы забронировали Кабинет 101"
    if (onSelectRoom) onSelectRoom(room.id, room.number);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', color: 'var(--tg-theme-hint-color)' }}>Загрузка кабинетов...</div>;
  }

  return (
    <div style={{ padding: '16px', backgroundColor: 'var(--tg-theme-bg-color)' }}>
      <h2 style={{ color: 'var(--tg-theme-text-color)', marginBottom: '20px' }}>Выберите кабинет</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {rooms.map((room) => (
          <div
            key={room.id}
            onClick={() => handleSelect(room)}
            style={{
              background: 'var(--tg-theme-secondary-bg-color)',
              borderRadius: '20px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
            }}
          >
            <img 
              src={room.image} 
              alt={room.number} 
              style={{ width: '100%', height: '160px', objectFit: 'cover' }} 
            />
            <div style={{ padding: '15px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: 'var(--tg-theme-text-color)' 
                }}>
                  Кабинет {room.number}
                </span>
                <span style={{ 
                  backgroundColor: 'var(--tg-theme-button-color)', 
                  color: 'var(--tg-theme-button-text-color)',
                  padding: '4px 12px',
                  borderRadius: '10px',
                  fontSize: '12px'
                }}>
                  Свободен
                </span>
              </div>
              <p style={{ 
                fontSize: '14px', 
                color: 'var(--tg-theme-hint-color)', 
                margin: 0,
                lineHeight: '1.4' 
              }}>
                {room.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomList;