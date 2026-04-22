import React, { useState, useEffect } from 'react';
import './MyBookings.css';
import { fetchUserBookings } from '../api';
import { useUser } from '../UserContext.jsx'; 

const tg = window.Telegram?.WebApp;

const STATUS_CONFIG = {
    'создано. ожидается подтверждение администратором': { className: 'status-pending', label: '⏳ Ждёт подтверждения' },
    'не активна': { className: 'status-soon', label: '📅 Запланировано' },
    'ожидание подтверждения явки': { className: 'status-warning', label: '⚠️ Подтвердите явку!' },
    'явка подтверждено пользователем': { className: 'status-active', label: '✓ Явка подтверждена' },
    'явка полностью подтверждена': { className: 'status-active', label: '✅ Активно' },
    'неявка': { className: 'status-rejected', label: '❌ Неявка' },
    'отменено': { className: 'status-cancelled', label: '🚫 Отменено' },
    'завершена': { className: 'status-expired', label: '✓ Завершено' },
};

const CANCELLABLE_STATUSES = [
    'создано. ожидается подтверждение администратором',
    'не активна',
    'ожидание подтверждения явки',
    'явка подтверждено пользователем',
    'явка полностью подтверждена',
];

export default function MyBookings({ onBackToMenu, onOpenBooking, onCancel }) {
    const { tgId } = useUser();  // 🆕
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [bookings, setBookings] = useState([]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError(false);
            const data = await fetchUserBookings(tgId);  // 🆕 tgId из контекста

            const formatted = data.map(item => ({
                book_id: item.book_id,
                room_name: item.room?.room_number,
                date: item.slot_date_backup,
                time_start: item.start_time_backup,
                duration: item.duration || 60,
                people_count: item.num_of_people,
                status_name: item.status_rel?.name || 'Неизвестно',
            }));

            setBookings(formatted);
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = async (bookingId, e) => {
        e.stopPropagation();
        try {
            await onCancel(bookingId);
            await fetchBookings();
        } catch (err) {}
    };

    const changeBooking = (bookingId, e) => {
        e.stopPropagation();
        tg?.sendData(JSON.stringify({ action: 'change_booking', booking_id: bookingId }));
        tg?.close();
    };

    const bookNow = () => {
        tg?.sendData(JSON.stringify({ action: 'start_booking' }));
        tg?.close();
    };

    const getStatusConfig = (statusName) => {
        const key = (statusName || '').toLowerCase().trim();
        return STATUS_CONFIG[key] || { className: 'status-default', label: statusName || 'Неизвестно' };
    };

    const canCancelBooking = (statusName) => {
        const key = (statusName || '').toLowerCase().trim();
        return CANCELLABLE_STATUSES.includes(key);
    };

    const formatDate = (s) => new Date(s).toLocaleDateString('ru-RU', {
        day: 'numeric', month: 'long', weekday: 'short'
    });

    const formatTime = (t) => t?.substring(0, 5) || '';

    const formatDuration = (m) => {
        if (m < 60) return `${m} мин`;
        const h = Math.floor(m / 60);
        const mm = m % 60;
        return mm ? `${h} ч ${mm} мин` : `${h} ч`;
    };

    useEffect(() => {
        if (tg) {
            tg.expand();
            tg?.BackButton?.show();
            tg?.BackButton?.onClick(onBackToMenu);
        }
        fetchBookings();
        return () => tg?.BackButton?.offClick(onBackToMenu);
    }, [onBackToMenu, tgId]);

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Загрузка бронирований...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state">
                <p>⚠️ Ошибка при загрузке данных</p>
                <button className="btn-book" onClick={fetchBookings}>Повторить</button>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <h1>Мои бронирования</h1>
                <p className="subtitle">Список ваших текущих и прошедших записей</p>
            </div>

            {bookings.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <div className="empty-title">У вас пока нет бронирований</div>
                    <div className="empty-text">Выберите подходящую комнату и время.</div>
                    <button className="btn-book" onClick={bookNow}>Забронировать сейчас</button>
                </div>
            ) : (
                <>
                    <div className="counter-card">
                        <span className="counter-label">Всего бронирований:</span>
                        <span className="counter-value">{bookings.length}</span>
                    </div>

                    <div className="bookings-list">
                        {bookings.map((b) => {
                            const statusConfig = getStatusConfig(b.status_name);
                            const showActions = canCancelBooking(b.status_name);

                            return (
                                <div key={b.book_id} className="booking-card" onClick={() => onOpenBooking(b)}>
                                    <div className={`booking-status ${statusConfig.className}`}>
                                        {statusConfig.label}
                                    </div>

                                    <div className="booking-body">
                                        <div className="booking-room">🪑 Комната {b.room_name}</div>
                                        <div className="booking-details">
                                            <div className="detail-item">📅 {formatDate(b.date)}</div>
                                            <div className="detail-item">⏰ {formatTime(b.time_start)}</div>
                                            <div className="detail-item">⏱️ {formatDuration(b.duration)}</div>
                                        </div>
                                        <div className="booking-people">👥 {b.people_count} чел.</div>

                                        {showActions && (
                                            <div className="booking-actions">
                                                <button className="btn-cancel" onClick={(e) => handleCancelClick(b.book_id, e)}>
                                                    Отменить
                                                </button>
                                                <button className="btn-change" onClick={(e) => changeBooking(b.book_id, e)}>
                                                    Изменить
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            <button className="btn-back" onClick={onBackToMenu}>Назад</button>
        </div>
    );
}