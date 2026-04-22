import React, { useState, useEffect } from 'react';
import './BookingDetails.css';

const tg = window.Telegram?.WebApp;

export default function BookingDetails({ booking, goBack, onCancel }) {
    if (!booking) {
        return <div className="error-screen">Данные о бронировании не найдены</div>;
    }

    const room = booking.room;
    const building = room?.building;
    const photo = room?.preview_photo || "/no-image.png";

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            weekday: 'short'
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return "—";
        const [h, m] = timeStr.split(':');
        return `${h}:${m}`;
    };

    const parseDurationToMinutes = (duration) => {
        if (!duration) return 0;
        if (typeof duration === 'number') return duration;

        if (typeof duration === 'string') {
            if (duration.includes(':')) {
                const [h, m] = duration.split(':').map(Number);
                return (h || 0) * 60 + (m || 0);
            }
            if (duration.startsWith('PT')) {
                const h = parseInt(duration.match(/(\d+)H/)?.[1] || 0, 10);
                const m = parseInt(duration.match(/(\d+)M/)?.[1] || 0, 10);
                return h * 60 + m;
            }
            return parseInt(duration, 10) || 0;
        }
        return 0;
    };

    const formatDuration = (duration) => {
        const minutes = parseDurationToMinutes(duration);
        if (minutes <= 0) return "—";

        const h = Math.floor(minutes / 60);
        const m = minutes % 60;

        if (h > 0 && m > 0) return `${h} ч ${m} мин`;
        if (h > 0) return `${h} ч`;
        return `${m} мин`;
    };

    const getEndTime = () => {
        if (!booking.start_time_backup || !booking.duration) return null;

        const [h, m] = booking.start_time_backup.split(':').map(Number);
        const durationMinutes = parseDurationToMinutes(booking.duration);

        const date = new Date();
        date.setHours(h);
        date.setMinutes(m);
        date.setSeconds(0);
        date.setMinutes(date.getMinutes() + durationMinutes);

        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    };

    const handleChange = () => {
        tg?.sendData(JSON.stringify({
            action: 'change_booking',
            booking_id: booking.book_id
        }));
        tg?.close();
    };

    // 🆕 Проверяем, можно ли отменить бронь
    const canCancel = () => {
        if (!booking.slot_date_backup || !booking.start_time_backup) return false;
        const start = new Date(`${booking.slot_date_backup}T${booking.start_time_backup}`);
        return start > new Date(); // Можно отменить только будущие
    };

    const statusName = booking.status_rel?.name || "Неизвестно";
    const statusClass = `status-${(statusName || '').toLowerCase().replace(/\s/g, '-')}`;

    return (
        <div className="booking-details-container">
            {/* Фото и статус */}
            <div className="booking-photo-wrapper">
                <img src={photo} alt="Room" className="booking-photo" />
                <div className={`status-badge ${statusClass}`}>{statusName}</div>
            </div>

            {/* Заголовок */}
            <div className="booking-header">
                <h1>Комната №{room?.room_number}</h1>
                {building && (
                    <div className="building-info">
                        <span className="icon">📍</span>
                        <div>
                            <div className="building-name">{building.name}</div>
                            <div className="building-address">{building.address}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Теги */}
            {room?.tags && room.tags.length > 0 && (
                <div className="booking-tags">
                    {room.tags.map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                    ))}
                </div>
            )}

            {/* Карточка информации */}
            <div className="booking-info-card">
                <div className="info-row">
                    <div className="info-icon">📅</div>
                    <div className="info-content">
                        <div className="info-label">Дата</div>
                        <div className="info-value">{formatDate(booking.slot_date_backup)}</div>
                    </div>
                </div>

                <div className="info-divider" />

                <div className="info-row">
                    <div className="info-icon">🕐</div>
                    <div className="info-content">
                        <div className="info-label">Время</div>
                        <div className="info-value">
                            {formatTime(booking.start_time_backup)}
                            {getEndTime() && <span className="time-end"> – {getEndTime()}</span>}
                        </div>
                    </div>
                </div>

                <div className="info-divider" />

                <div className="info-row">
                    <div className="info-icon">⏱</div>
                    <div className="info-content">
                        <div className="info-label">Длительность</div>
                        <div className="info-value">{formatDuration(booking.duration)}</div>
                    </div>
                </div>

                <div className="info-divider" />

                <div className="info-row">
                    <div className="info-icon">👥</div>
                    <div className="info-content">
                        <div className="info-label">Гостей</div>
                        <div className="info-value">{booking.num_of_people} чел.</div>
                    </div>
                </div>
            </div>

            {/* Кнопки */}
            <div className="booking-actions">
                {canCancel() && (
                    <>
                        <button className="btn-edit-booking" onClick={handleChange}>
                            Изменить бронирование
                        </button>
                        <button className="btn-cancel-booking" onClick={onCancel}>
                            Отменить бронирование
                        </button>
                    </>
                )}
                <button className="btn-back" onClick={goBack}>
                    Назад
                </button>
            </div>
        </div>
    );
}