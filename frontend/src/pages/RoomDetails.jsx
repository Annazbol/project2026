import React, { useState, useEffect } from 'react';

const tg = window.Telegram?.WebApp;

// Моковые данные о комнате (в реальности приходят из API)
const MOCK_ROOM = {
    id: 1,
    name: 'Коворкинг на 2 этаже',
    room_number: '1-207',
    building: {
        id: 1,
        name: 'Учебный корпус №1',
        address: 'ул. Московская, д. 36'
    },
    capacity: 10,
    description: 'Просторный коворкинг с современной мебелью. Идеальное место для самостоятельной работы и встреч. Оснащен удобными столами, эргономичными креслами и большим количеством розеток.',
    tags: ['Wi-Fi', 'Розетки у каждого места', 'Кулер с водой', 'Кондиционер', 'Комфортные кресла'],
    photos: [
        'https://via.placeholder.com/400x300?text=Фото+1',
        'https://via.placeholder.com/400x300?text=Фото+2',
        'https://via.placeholder.com/400x300?text=Фото+3'
    ],
    schedule: [
        { date: '2026-04-05', slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] },
        { date: '2026-04-06', slots: ['10:00', '11:00', '12:00', '13:00', '17:00', '18:00'] },
        { date: '2026-04-07', slots: ['09:00', '14:00', '15:00', '16:00', '17:00'] },
        { date: '2026-04-08', slots: ['11:00', '12:00', '13:00', '14:00', '15:00'] },
        { date: '2026-04-09', slots: ['09:00', '10:00', '16:00', '17:00', '18:00'] },
        { date: '2026-04-10', slots: ['10:00', '11:00', '12:00', '13:00', '14:00'] }
    ]
};

// Время работы коворкингов
const WORK_HOURS = {
    start: 8,
    end: 20,
    days: 'Пн–Сб'
};

export default function RoomDetails() {
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [selectedDate, setSelectedDate] = useState(null);
    const [expandedSchedule, setExpandedSchedule] = useState(false);

    useEffect(() => {
        if (tg) {
            tg.expand();
            tg.setHeaderColor('bg_color');
            tg.setBackgroundColor('bg_color');
            tg.BackButton.show();
            tg.BackButton.onClick(goBack);
        }

        // Загрузка данных о комнате (имитация API)
        setTimeout(() => {
            setRoom(MOCK_ROOM);
            // Проверка прав администратора (в реальности из данных пользователя)
            const userData = tg?.initDataUnsafe?.user;
            setIsAdmin(userData?.id === 123456789); // пример проверки
            setLoading(false);
            // Устанавливаем текущую дату для графика
            const today = new Date();
            setSelectedDate(today.toISOString().split('T')[0]);
        }, 500);

        return () => {
            tg?.BackButton.offClick(goBack);
        };
    }, []);

    const goBack = () => {
        tg?.sendData(JSON.stringify({ action: 'back', step: 'room_details' }));
        tg?.close();
    };

    const bookRoom = () => {
        tg?.sendData(JSON.stringify({
            action: 'book_room',
            room_id: room?.id,
            room_name: room?.name
        }));
        tg?.close();
    };

    const editRoom = () => {
        tg?.sendData(JSON.stringify({
            action: 'edit_room',
            room_id: room?.id
        }));
        tg?.close();
    };

    const deleteRoom = () => {
        tg?.showPopup({
            title: 'Удаление комнаты',
            message: `Вы уверены, что хотите удалить комнату "${room?.name}"?`,
            buttons: [
                { id: 'cancel', type: 'cancel', text: 'Отмена' },
                { id: 'confirm', type: 'default', text: 'Удалить' }
            ],
            callback: (buttonId) => {
                if (buttonId === 'confirm') {
                    tg?.sendData(JSON.stringify({
                        action: 'delete_room',
                        room_id: room?.id
                    }));
                    tg?.close();
                }
            }
        });
    };

    const nextPhoto = () => {
        if (room && currentPhotoIndex < room.photos.length - 1) {
            setCurrentPhotoIndex(currentPhotoIndex + 1);
        }
    };

    const prevPhoto = () => {
        if (currentPhotoIndex > 0) {
            setCurrentPhotoIndex(currentPhotoIndex - 1);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            weekday: 'short'
        });
    };

    const isDateAvailable = (dateString) => {
        const scheduleItem = room?.schedule.find(s => s.date === dateString);
        return scheduleItem && scheduleItem.slots.length > 0;
    };

    const getAvailableSlotsForDate = (dateString) => {
        const scheduleItem = room?.schedule.find(s => s.date === dateString);
        return scheduleItem?.slots || [];
    };

    const getNextAvailableDates = () => {
        if (!room) return [];
        const today = new Date().toISOString().split('T')[0];
        return room.schedule.filter(s => s.date >= today).slice(0, 5);
    };

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
                <button className="btn-retry" onClick={() => window.location.reload()}>
                    Повторить
                </button>
            </div>
        );
    }

    const nextDates = getNextAvailableDates();
    const availableSlots = selectedDate ? getAvailableSlotsForDate(selectedDate) : [];

    return (
        <div className="container">
            {/* Фотогалерея */}
            <div className="gallery-container">
                <div className="gallery">
                    <img 
                        src={room.photos[currentPhotoIndex]} 
                        alt={`${room.name} фото ${currentPhotoIndex + 1}`}
                        className="gallery-image"
                    />
                    {room.photos.length > 1 && (
                        <>
                            <button className="gallery-nav prev" onClick={prevPhoto} disabled={currentPhotoIndex === 0}>
                                ←
                            </button>
                            <button className="gallery-nav next" onClick={nextPhoto} disabled={currentPhotoIndex === room.photos.length - 1}>
                                →
                            </button>
                            <div className="gallery-dots">
                                {room.photos.map((_, index) => (
                                    <div 
                                        key={index}
                                        className={`dot ${index === currentPhotoIndex ? 'active' : ''}`}
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
                <h1 className="room-title">{room.name}</h1>
                <div className="room-location">
                    <span className="location-icon">📍</span>
                    <span>{room.building.name}, ауд. {room.room_number}</span>
                </div>
                <div className="room-address">
                    {room.building.address}
                </div>
                <div className="room-capacity">
                    👥 Вместимость: до {room.capacity} человек
                </div>
            </div>

            {/* Теги */}
            <div className="tags-section">
                <div className="section-title">🏷️ Оснащение и особенности</div>
                <div className="tags-list">
                    {room.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                    ))}
                </div>
            </div>

            {/* Описание */}
            <div className="description-section">
                <div className="section-title">📝 Описание</div>
                <p className="description-text">{room.description}</p>
            </div>

            {/* График занятости */}
            <div className="schedule-section">
                <div className="section-header">
                    <div className="section-title">📅 График свободных слотов</div>
                    <button className="expand-btn" onClick={() => setExpandedSchedule(!expandedSchedule)}>
                        {expandedSchedule ? 'Свернуть' : 'Развернуть'}
                    </button>
                </div>
                <div className="schedule-info">
                    <div className="work-hours">
                        🕐 Время работы: {WORK_HOURS.start}:00 – {WORK_HOURS.end}:30 ({WORK_HOURS.days})
                    </div>
                </div>
                
                <div className="schedule-dates">
                    {nextDates.map((item) => (
                        <button
                            key={item.date}
                            className={`date-btn ${selectedDate === item.date ? 'selected' : ''} ${isDateAvailable(item.date) ? 'available' : 'unavailable'}`}
                            onClick={() => setSelectedDate(item.date)}
                        >
                            <div className="date-day">{formatDate(item.date)}</div>
                            <div className="date-slots">{item.slots.length} слотов</div>
                        </button>
                    ))}
                </div>

                {selectedDate && (
                    <div className="time-slots">
                        <div className="time-slots-title">
                            Доступное время на {formatDate(selectedDate)}:
                        </div>
                        <div className="slots-grid">
                            {availableSlots.length > 0 ? (
                                availableSlots.map((slot, index) => (
                                    <div key={index} className="slot-available">{slot}</div>
                                ))
                            ) : (
                                <div className="no-slots">Нет свободных слотов</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Кнопки действий */}
            <div className="actions-section">
                <button className="btn-book" onClick={bookRoom}>
                    📅 Забронировать
                </button>
                
                {isAdmin && (
                    <div className="admin-actions">
                        <button className="btn-edit" onClick={editRoom}>
                            ✏️ Изменить
                        </button>
                        <button className="btn-delete" onClick={deleteRoom}>
                            🗑️ Удалить
                        </button>
                    </div>
                )}
            </div>

            <button className="btn-back" onClick={goBack}>← Назад</button>

            <style jsx>{`
                .container {
                    max-width: 400px;
                    margin: 0 auto;
                    padding: 20px;
                    padding-bottom: 40px;
                }

                .loading-state {
                    text-align: center;
                    padding: 60px 20px;
                }

                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--tg-theme-hint-color, #e0e0e0);
                    border-top-color: var(--tg-theme-button-color, #2481cc);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .error-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #e34d4d;
                }

                .btn-retry {
                    margin-top: 16px;
                    padding: 12px 24px;
                    background-color: var(--tg-theme-button-color, #2481cc);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 14px;
                    cursor: pointer;
                }

                /* Галерея */
                .gallery-container {
                    margin-bottom: 20px;
                }

                .gallery {
                    position: relative;
                    border-radius: 20px;
                    overflow: hidden;
                    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
                }

                .gallery-image {
                    width: 100%;
                    height: 250px;
                    object-fit: cover;
                }

                .gallery-nav {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    background-color: rgba(0, 0, 0, 0.5);
                    color: white;
                    border: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    font-size: 20px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .gallery-nav.prev {
                    left: 10px;
                }

                .gallery-nav.next {
                    right: 10px;
                }

                .gallery-nav:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }

                .gallery-dots {
                    position: absolute;
                    bottom: 10px;
                    left: 0;
                    right: 0;
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                }

                .dot {
                    width: 8px;
                    height: 8px;
                    background-color: rgba(255, 255, 255, 0.5);
                    border-radius: 50%;
                    cursor: pointer;
                }

                .dot.active {
                    background-color: white;
                }

                /* Информация о комнате */
                .room-info {
                    margin-bottom: 20px;
                }

                .room-title {
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 12px;
                    color: var(--tg-theme-text-color, #000000);
                }

                .room-location {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 16px;
                    font-weight: 500;
                    margin-bottom: 4px;
                    color: var(--tg-theme-text-color, #000000);
                }

                .room-address {
                    font-size: 13px;
                    color: var(--tg-theme-hint-color, #8e8e93);
                    margin-bottom: 8px;
                }

                .room-capacity {
                    font-size: 14px;
                    color: var(--tg-theme-text-color, #000000);
                    padding: 6px 12px;
                    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
                    border-radius: 20px;
                    display: inline-block;
                }

                /* Секции */
                .section-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    color: var(--tg-theme-text-color, #000000);
                }

                .tags-section, .description-section, .schedule-section {
                    margin-bottom: 24px;
                }

                .tags-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .tag {
                    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    color: var(--tg-theme-text-color, #000000);
                }

                .description-text {
                    font-size: 14px;
                    line-height: 1.5;
                    color: var(--tg-theme-text-color, #000000);
                    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
                    padding: 16px;
                    border-radius: 16px;
                }

                /* График */
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .expand-btn {
                    background: none;
                    border: none;
                    font-size: 13px;
                    color: var(--tg-theme-link-color, #2481cc);
                    cursor: pointer;
                }

                .schedule-info {
                    margin-bottom: 16px;
                }

                .work-hours {
                    font-size: 13px;
                    color: var(--tg-theme-hint-color, #8e8e93);
                    padding: 8px 12px;
                    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
                    border-radius: 10px;
                }

                .schedule-dates {
                    display: flex;
                    gap: 10px;
                    overflow-x: auto;
                    padding-bottom: 8px;
                    margin-bottom: 16px;
                }

                .date-btn {
                    min-width: 100px;
                    padding: 12px;
                    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
                    border: 1px solid transparent;
                    border-radius: 12px;
                    cursor: pointer;
                    text-align: center;
                }

                .date-btn.selected {
                    border-color: var(--tg-theme-button-color, #2481cc);
                    background-color: var(--tg-theme-button-color, #2481cc20);
                }

                .date-btn.available .date-slots {
                    color: #00b894;
                }

                .date-btn.unavailable .date-slots {
                    color: #e34d4d;
                }

                .date-day {
                    font-size: 13px;
                    font-weight: 500;
                    margin-bottom: 4px;
                    color: var(--tg-theme-text-color, #000000);
                }

                .date-slots {
                    font-size: 11px;
                }

                .time-slots {
                    margin-top: 16px;
                    padding: 16px;
                    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
                    border-radius: 16px;
                }

                .time-slots-title {
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 12px;
                    color: var(--tg-theme-text-color, #000000);
                }

                .slots-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .slot-available {
                    padding: 8px 16px;
                    background-color: #00b89420;
                    color: #00b894;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 500;
                }

                .no-slots {
                    padding: 20px;
                    text-align: center;
                    color: var(--tg-theme-hint-color, #8e8e93);
                }

                /* Кнопки действий */
                .actions-section {
                    margin-top: 16px;
                }

                .btn-book {
                    width: 100%;
                    padding: 16px;
                    background-color: var(--tg-theme-button-color, #2481cc);
                    color: var(--tg-theme-button-text-color, #ffffff);
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    margin-bottom: 12px;
                }

                .admin-actions {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .btn-edit, .btn-delete {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                }

                .btn-edit {
                    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
                    color: var(--tg-theme-text-color, #000000);
                }

                .btn-delete {
                    background-color: #e34d4d20;
                    color: #e34d4d;
                }

                .btn-back {
                    width: 100%;
                    padding: 14px 20px;
                    background-color: transparent;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--tg-theme-link-color, #2481cc);
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}