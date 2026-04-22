import React, { useState, useEffect } from 'react';
import './RoomDetails.css';
import { fetchRooms, deleteRoom } from '../api';
import { useUser } from '../UserContext';

const tg = window.Telegram?.WebApp;

export default function RoomDetails({ roomId, goBack, onBook, onEdit }) { 
    const { tgId, user } = useUser();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const loadRoom = async () => {
        try {
            setLoading(true);
            const data = await fetchRooms();
            const roomData = data?.find(r => r.id_room === roomId);

            setRoom(roomData || null);
            setError(false);
        } catch (e) {
            console.error("Ошибка загрузки комнаты:", e);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (roomId) {
            loadRoom();
        }
    }, [roomId]);

    const handleDeleteRoom  = async () => {
        tg?.showConfirm("Вы уверены, что хотите удалить эту комнату?", async (ok) => {
            
            console.log("TG DEBUG:", {
                tg_id: tgId,
                tg: window.Telegram?.WebApp,
                initDataUnsafe: window.Telegram?.WebApp?.initDataUnsafe,
                user: window.Telegram?.WebApp?.initDataUnsafe?.user
            });
            
            if (!ok) return;

            try {
                await deleteRoom(room.id_room, tgId);

                tg?.HapticFeedback?.notificationOccurred('success');
                tg?.showAlert("Комната удалена");

                goBack(); // возвращаемся назад
            } catch (e) {
                tg?.showAlert(e.message);
            }
        });
    };

    // Безопасное извлечение URL фотографии (может быть строка или объект)
    const getPhotoUrl = (photo) => {
        if (!photo) return "/no-image.png";
        if (typeof photo === 'string') return photo;
        if (typeof photo === 'object') return photo.file_path || photo.url || "/no-image.png";
        return "/no-image.png";
    };

    // Состояния загрузки и ошибки
    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Загрузка информации о комнате...</p>
            </div>
        );
    }

    if (error || !room) {
        return (
            <div className="error-state">
                <p>⚠️ Не удалось загрузить информацию о комнате</p>
                <button className="btn-retry" onClick={loadRoom}>
                    Повторить
                </button>
            </div>
        );
    }

    // Собираем массив фотографий
    let photos = [];
    if (Array.isArray(room.photos) && room.photos.length > 0) {
        photos = room.photos.map(getPhotoUrl);
    } else if (room.preview_photo) {
        photos = [room.preview_photo];
    } else {
        photos = ["/no-image.png"];
    }

    // Защита от выхода за границы
    const safeIndex = Math.min(currentPhotoIndex, photos.length - 1);

    const nextPhoto = () => {
        if (safeIndex < photos.length - 1) {
            setCurrentPhotoIndex(safeIndex + 1);
            tg?.HapticFeedback?.selectionChanged();
        }
    };

    const prevPhoto = () => {
        if (safeIndex > 0) {
            setCurrentPhotoIndex(safeIndex - 1);
            tg?.HapticFeedback?.selectionChanged();
        }
    };

    return (
        <div className="container">
            {/* Галерея */}
            <div className="gallery-container">
                <div className="gallery">
                    <img
                        src={photos[safeIndex]}
                        alt={`${room.room_number} фото ${safeIndex + 1}`}
                        className="gallery-image"
                        onError={(e) => { e.target.src = "/no-image.png"; }}
                    />
                    {photos.length > 1 && (
                        <>
                            <button
                                className="gallery-nav prev"
                                onClick={prevPhoto}
                                disabled={safeIndex === 0}
                            >
                                ←
                            </button>
                            <button
                                className="gallery-nav next"
                                onClick={nextPhoto}
                                disabled={safeIndex === photos.length - 1}
                            >
                                →
                            </button>
                            <div className="gallery-dots">
                                {photos.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`dot ${index === safeIndex ? 'active' : ''}`}
                                        onClick={() => setCurrentPhotoIndex(index)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Информация о комнате */}
            <div className="room-info">
                <h1 className="room-title">Комната №{room.room_number}</h1>
                {room.building && (
                    <>
                        <div className="room-location">
                            <span className="location-icon">📍</span>
                            <span>{room.building.name}, ауд. {room.room_number}</span>
                        </div>
                        <div className="room-address">
                            {room.building.address}
                        </div>
                    </>
                )}
                <div className="room-capacity">
                    👥 Вместимость: до {room.capacity} человек
                </div>
            </div>

            {/* Теги */}
            {Array.isArray(room.tags) && room.tags.length > 0 && (
                <div className="tags-section">
                    <div className="section-title">🏷️ Оснащение и особенности</div>
                    <div className="tags-list">
                        {room.tags.map((tag, index) => (
                            <span key={index} className="tag">
                                {typeof tag === 'string' ? tag : tag?.name || ''}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Описание */}
            {room.description && (
                <div className="description-section">
                    <div className="section-title">📝 Описание</div>
                    <p className="description-text">{room.description}</p>
                </div>
            )}

            {/* Кнопки действий */}
            <div className="actions-section">
                <button className="btn-book" onClick={onBook}>
                    📅 Забронировать
                </button>

                {user?.administrator && (
                    <div className="admin-actions">
                        <button 
                        onClick={onEdit} 
                        className="btn-edit"
                        style={{ background: '#ff9800', color: 'white', marginTop: '10px' }}
                    >
                        ⚙️ Редактировать
                    </button>
                        <button className="btn-delete" onClick={handleDeleteRoom}>
                            🗑️ Удалить
                        </button>
                    </div>
                )}
            </div>

            <button className="btn-back" onClick={goBack}>Назад</button>
        </div>
    );
}