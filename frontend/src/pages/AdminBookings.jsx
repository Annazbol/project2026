import React, { useState, useEffect } from 'react';
import './AdminBookings.css';
import { fetchPendingBookings, approveBooking, rejectBooking } from '../api';
import { useUser } from '../UserContext.jsx';

const tg = window.Telegram?.WebApp;

export default function AdminBookings({ goBack }) {
    const { tgId } = useUser();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [processingId, setProcessingId] = useState(null);

    const loadBookings = async () => {
        try {
            setLoading(true);
            setError(false);
            const data = await fetchPendingBookings(tgId);
            setBookings(data || []);
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();

        if (tg) {
            tg?.BackButton?.show();
            tg?.BackButton?.onClick(goBack);
        }
        return () => tg?.BackButton?.offClick(goBack);
    }, [goBack, tgId]);

    const handleApprove = async (bookId) => {
        const confirm = (msg) => new Promise(resolve => {
            if (tg?.showConfirm) tg.showConfirm(msg, resolve);
            else resolve(window.confirm(msg));
        });

        const ok = await confirm("Подтвердить это бронирование?");
        if (!ok) return;

        try {
            setProcessingId(bookId);
            await approveBooking(bookId, tgId);
            tg?.HapticFeedback?.notificationOccurred('success');
            tg?.showAlert("✅ Бронирование подтверждено");
            await loadBookings();
        } catch (err) {
            tg?.showAlert(`Ошибка: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (bookId) => {
        const confirm = (msg) => new Promise(resolve => {
            if (tg?.showConfirm) tg.showConfirm(msg, resolve);
            else resolve(window.confirm(msg));
        });

        const ok = await confirm("Отклонить это бронирование? Действие необратимо.");
        if (!ok) return;

        try {
            setProcessingId(bookId);
            await rejectBooking(bookId, tgId);
            tg?.HapticFeedback?.notificationOccurred('warning');
            tg?.showAlert("🚫 Бронирование отклонено");
            await loadBookings();
        } catch (err) {
            tg?.showAlert(`Ошибка: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateStr) =>
        new Date(dateStr).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            weekday: 'short'
        });

    const formatTime = (t) => t?.substring(0, 5) || '';

    const formatDuration = (d) => {
        if (!d) return '—';
        if (typeof d === 'string' && d.includes(':')) {
            const [h, m] = d.split(':').map(Number);
            const total = (h || 0) * 60 + (m || 0);
            if (total < 60) return `${total} мин`;
            const hh = Math.floor(total / 60);
            const mm = total % 60;
            return mm ? `${hh} ч ${mm} мин` : `${hh} ч`;
        }
        return d;
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="spinner"></div>
                <p>Загрузка заявок...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-error">
                <p>⚠️ Ошибка загрузки</p>
                <button className="btn-retry" onClick={loadBookings}>Повторить</button>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>👑 Заявки на подтверждение</h1>
                <p className="admin-subtitle">
                    Брони, ожидающие модерации администратора
                </p>
            </div>

            {bookings.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">✨</div>
                    <div className="empty-title">Нет новых заявок</div>
                    <div className="empty-text">Все бронирования рассмотрены</div>
                </div>
            ) : (
                <>
                    <div className="counter-card">
                        <span>Заявок на рассмотрение:</span>
                        <span className="counter-value">{bookings.length}</span>
                    </div>

                    <div className="bookings-list">
                        {bookings.map(b => (
                            <div key={b.book_id} className="admin-booking-card">
                                {/* Информация о пользователе */}
                                <div className="booking-user">
                                    <div className="user-avatar">
                                        {b.user?.name?.[0] || '?'}
                                    </div>
                                    <div className="user-info">
                                        <div className="user-name">
                                            {b.user?.name} {b.user?.surname}
                                        </div>
                                        <div className="user-login">@{b.user?.login}</div>
                                    </div>
                                </div>

                                {/* Информация о брони */}
                                <div className="booking-info">
                                    <div className="info-item">
                                        <span className="info-icon">🏛</span>
                                        <span>
                                            {b.room?.building?.name || `Корпус ${b.room?.id_building}`}, 
                                            каб. {b.room?.room_number}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-icon">📅</span>
                                        <span>{formatDate(b.slot_date_backup)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-icon">🕐</span>
                                        <span>
                                            {formatTime(b.start_time_backup)} 
                                            ({formatDuration(b.duration)})
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-icon">👥</span>
                                        <span>{b.num_of_people} чел.</span>
                                    </div>
                                </div>

                                {/* Кнопки действий */}
                                <div className="admin-actions">
                                    <button
                                        className="btn-reject"
                                        disabled={processingId === b.book_id}
                                        onClick={() => handleReject(b.book_id)}
                                    >
                                        {processingId === b.book_id ? '...' : '🚫 Отклонить'}
                                    </button>
                                    <button
                                        className="btn-approve"
                                        disabled={processingId === b.book_id}
                                        onClick={() => handleApprove(b.book_id)}
                                    >
                                        {processingId === b.book_id ? '...' : '✅ Подтвердить'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <button className="btn-back" onClick={goBack}>Назад в меню</button>
        </div>
    );
}