import React, { useEffect, useState } from 'react';
import './RoomList.css';
import { fetchRooms } from '../api';
import { useUser } from '../UserContext.jsx';

const tg = window.Telegram?.WebApp;

const RoomList = ({ onSelectRoom, goBack, onCreateRoom }) => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();

    useEffect(() => {
        const loadRooms = async () => {
            try {
                setLoading(true);
                const data = await fetchRooms();
                setRooms(data?.data || data || []);
            } catch (e) {
                console.error(e);
                setRooms([]);
                tg?.showAlert("Ошибка при загрузке списка комнат");
            } finally {
                setLoading(false);
            }
        };

        loadRooms();
        tg?.expand();

        // 🆕 Включаем нативную кнопку "Назад" в Telegram
        if (tg?.BackButton) {
            tg.BackButton.show();
            tg.BackButton.onClick(goBack);
        }

        // Выключаем при уходе со страницы
        return () => {
            if (tg?.BackButton) {
                tg.BackButton.offClick(goBack);
                tg.BackButton.hide();
            }
        };
    }, [goBack]);

    const handleSelect = (room) => {
        tg?.HapticFeedback?.impactOccurred('light');
        onSelectRoom?.(room);
    };

    if (loading) {
        return (
            <div className="room-list-loading">
                Загрузка комнат...
            </div>
        );
    }

    if (rooms.length === 0) {
        return (
            <div className="room-list-empty">
                Свободных комнат не найдено
                {/* Кнопка назад для пустого экрана */}
                <button className="btn-back" onClick={goBack} style={{marginTop: '20px'}}>
                    Назад в меню
                </button>
            </div>
        );
    }

    return (
        <div className="room-list-container">
            <div className="room-list-header">
                <h1>Все комнаты</h1>
            </div>

            <div className="rooms-grid">
                {rooms.map((room) => (
                    <button
                        key={room.id_room}
                        className="room-card"
                        onClick={() => handleSelect(room)}
                    >
                        <img
                            src={room.preview_photo || "/no-image.png"}
                            alt={`Комната ${room.room_number}`}
                            className="room-image"
                        />

                        <div className="room-info">
                            <span className="room-number">
                                №{room.room_number}
                            </span>

                            <p className="room-description">
                                Вместимость: {room.capacity} чел.
                            </p>
                        </div>
                    </button>
                ))}
            </div>

            {/* 🆕 Добавлен футер с кнопкой назад */}
            <div className="actions-footer">
                {user?.administrator && (
                    <button className="btn-admin-add" onClick={onCreateRoom}>
                        ➕ Добавить
                    </button>
                )}
                <button className="btn-back" onClick={() => {
                    tg?.HapticFeedback?.impactOccurred('light');
                    goBack();
                }}>
                    Назад
                </button>
            </div>
        </div>
    );
};

export default RoomList;