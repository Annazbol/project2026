import React, { useState, useEffect } from 'react';

const tg = window.Telegram?.WebApp;

// Реальные данные о комнатах из таблицы ВятГУ
const MOCK_BOOKINGS = [
    {
        id: 1,
        room_name: '1-207, коворкинг на 2 этаже',
        building_name: 'Учебный корпус №1, ул. Московская, д. 36',
        date: '2026-04-05',
        time_start: '14:00',
        time_end: '16:00',
        duration: 120,
        people_count: 4
    },
    {
        id: 2,
        room_name: '2-208',
        building_name: 'Учебный корпус №2, ул. Московская, д. 39',
        date: '2026-04-06',
        time_start: '10:00',
        time_end: '11:30',
        duration: 90,
        people_count: 2
    },
    {
        id: 3,
        room_name: '3-103a',
        building_name: 'Учебный корпус №3, ул. Московская, д. 29',
        date: '2026-04-03',
        time_start: '09:00',
        time_end: '10:00',
        duration: 60,
        people_count: 1
    },
    {
        id: 4,
        room_name: '1-207',
        building_name: 'Учебный корпус №4, ул. К. Либкнехта, 76',
        date: '2026-04-07',
        time_start: '13:00',
        time_end: '15:00',
        duration: 120,
        people_count: 3
    },
    {
        id: 5,
        room_name: '5-409',
        building_name: 'Учебный корпус №5, ул. Карла Маркса, д. 77',
        date: '2026-04-08',
        time_start: '11:00',
        time_end: '12:00',
        duration: 60,
        people_count: 2
    },
    {
        id: 6,
        room_name: '6-411',
        building_name: 'Учебный корпус №6, Студенческий проезд, д. 9',
        date: '2026-04-09',
        time_start: '15:00',
        time_end: '17:00',
        duration: 120,
        people_count: 5
    },
    {
        id: 7,
        room_name: '7-004',
        building_name: 'Учебный корпус №7, ул. Преображенская, д. 32',
        date: '2026-04-10',
        time_start: '09:30',
        time_end: '11:00',
        duration: 90,
        people_count: 2
    },
    {
        id: 8,
        room_name: '8-602',
        building_name: 'Учебный корпус №8, Студенческий проезд, д. 11',
        date: '2026-04-11',
        time_start: '14:00',
        time_end: '15:30',
        duration: 90,
        people_count: 3
    },
    {
        id: 9,
        room_name: '10-204',
        building_name: 'Учебный корпус №10, ул. Ломоносова, д. 18-a',
        date: '2026-04-12',
        time_start: '10:00',
        time_end: '11:00',
        duration: 60,
        people_count: 1
    },
    {
        id: 10,
        room_name: '11-31',
        building_name: 'Учебный корпус №11, ул. Преображенская, 41',
        date: '2026-04-13',
        time_start: '16:00',
        time_end: '18:00',
        duration: 120,
        people_count: 4
    },
    {
        id: 11,
        room_name: '13-206',
        building_name: 'Учебный корпус №13, ул. Красноармейская, д.26',
        date: '2026-04-14',
        time_start: '12:00',
        time_end: '13:30',
        duration: 90,
        people_count: 2
    },
    {
        id: 12,
        room_name: '14-215',
        building_name: 'Учебный корпус №14, ул. Ленина, д.111',
        date: '2026-04-15',
        time_start: '13:00',
        time_end: '14:00',
        duration: 60,
        people_count: 2
    },
    {
        id: 13,
        room_name: '15-321, коворкинг на 1 этаже',
        building_name: 'Учебный корпус №15, ул. Ленина, д.198',
        date: '2026-04-16',
        time_start: '11:00',
        time_end: '13:00',
        duration: 120,
        people_count: 6
    },
    {
        id: 14,
        room_name: '16-316, коворкинг на 1 этаже',
        building_name: 'Учебный корпус №16, ул. Свободы, д.122',
        date: '2026-04-17',
        time_start: '14:00',
        time_end: '16:00',
        duration: 120,
        people_count: 4
    },
    {
        id: 15,
        room_name: '19-105',
        building_name: 'Учебный корпус №19, ул. Орловская, д.12',
        date: '2026-04-18',
        time_start: '09:00',
        time_end: '10:30',
        duration: 90,
        people_count: 2
    }
];

export default function MyBookings() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [cancelModalId, setCancelModalId] = useState(null);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError(false);
            
            // Здесь должен быть реальный API запрос
            // const response = await fetch('/api/my-bookings', {
            //     method: 'GET',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'X-Telegram-Init-Data': tg?.initData || ''
            //     }
            // });
            // const data = await response.json();
            // setBookings(data.bookings || []);
            
            // Временно используем моковые данные
            setTimeout(() => {
                setBookings(MOCK_BOOKINGS);
                setLoading(false);
            }, 800);
        } catch (err) {
            console.error('Ошибка:', err);
            setError(true);
            setLoading(false);
        }
    };

    const goBack = () => {
        tg?.sendData(JSON.stringify({ action: 'back', step: 'my_bookings' }));
        tg?.close();
    };

    const bookNow = () => {
        tg?.sendData(JSON.stringify({ action: 'start_booking' }));
        tg?.close();
    };

    const cancelBooking = (bookingId) => {
        tg?.sendData(JSON.stringify({
            action: 'cancel_booking',
            booking_id: bookingId
        }));
        tg?.close();
    };

    const changeBooking = (bookingId) => {
        tg?.sendData(JSON.stringify({
            action: 'change_booking',
            booking_id: bookingId
        }));
        tg?.close();
    };

    const getBookingStatus = (date, timeStart, duration) => {
        const now = new Date();
        const bookingStart = new Date(`${date}T${timeStart}`);
        const bookingEnd = new Date(bookingStart.getTime() + duration * 60000);
        
        if (bookingEnd < now) {
            return { type: 'expired', label: 'Завершено', className: 'status-expired' };
        } else if (bookingStart <= now && bookingEnd > now) {
            return { type: 'active', label: 'Активно сейчас', className: 'status-active' };
        } else {
            return { type: 'soon', label: 'Предстоящее', className: 'status-soon' };
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

    const formatTime = (timeString) => {
        return timeString?.substring(0, 5) || '';
    };

    const formatDuration = (minutes) => {
        if (minutes < 60) return `${minutes} мин`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours} ч ${mins} мин` : `${hours} ч`;
    };

    useEffect(() => {
        if (tg) {
            tg.expand();
            tg.setHeaderColor('bg_color');
            tg.setBackgroundColor('bg_color');
            tg.BackButton.show();
            tg.BackButton.onClick(goBack);
        }
        
        fetchBookings();

        return () => {
            tg?.BackButton.offClick(goBack);
        };
    }, []);

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Загрузка ваших бронирований...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state">
                <p>⚠️ Не удалось загрузить бронирования</p>
                <button className="btn-book" onClick={fetchBookings}>
                    Повторить
                </button>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="header">
                <h1>Мои бронирования</h1>
                <p className="subtitle">Управление активными бронями комнат отдыха</p>
            </div>

            {bookings.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <div className="empty-title">Нет активных броней</div>
                    <div className="empty-text">У вас пока нет ни одного бронирования</div>
                    <button className="btn-book" onClick={bookNow}>
                        Забронировать сейчас
                    </button>
                </div>
            ) : (
                <>
                    <div className="counter-card">
                        <span className="counter-label">Активных броней</span>
                        <span className="counter-value">{bookings.length}</span>
                    </div>

                    <div className="bookings-list">
                        {bookings.map((booking) => {
                            const status = getBookingStatus(booking.date, booking.time_start, booking.duration);
                            return (
                                <div key={booking.id} className="booking-card">
                                    <div className={`booking-status ${status.className}`}>
                                        {status.label}
                                    </div>
                                    <div className="booking-body">
                                        <div className="booking-room">
                                            🪑 {booking.room_name}
                                        </div>
                                        <div className="booking-building">
                                            📍 {booking.building_name}
                                        </div>
                                        
                                        <div className="booking-details">
                                            <div className="detail-item">
                                                <span className="detail-icon">📅</span>
                                                <span>{formatDate(booking.date)}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-icon">⏰</span>
                                                <span>
                                                    {formatTime(booking.time_start)} – {formatTime(booking.time_end)}
                                                </span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-icon">⏱️</span>
                                                <span>{formatDuration(booking.duration)}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="booking-people">
                                            👥 {booking.people_count} человек
                                        </div>
                                        
                                        <div className="booking-actions">
                                            <button className="btn-cancel" onClick={() => setCancelModalId(booking.id)}>
                                                Отменить
                                            </button>
                                            <button className="btn-change" onClick={() => changeBooking(booking.id)}>
                                                Изменить
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            <button className="btn-back" onClick={goBack}>← Назад</button>

            {cancelModalId && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-title">Отмена бронирования</div>
                        <div className="modal-text">
                            Вы уверены, что хотите отменить это бронирование?
                        </div>
                        <div className="modal-buttons">
                            <button className="modal-btn modal-cancel" onClick={() => setCancelModalId(null)}>
                                Нет, назад
                            </button>
                            <button className="modal-btn modal-confirm" onClick={() => cancelBooking(cancelModalId)}>
                                Да, отменить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .container {
                    max-width: 400px;
                    margin: 0 auto;
                    padding: 20px;
                    padding-bottom: 20px;
                }

                .header {
                    margin-bottom: 24px;
                    padding-top: 20px;
                }

                .header h1 {
                    font-size: 28px;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: var(--tg-theme-text-color, #000000);
                }

                .subtitle {
                    font-size: 14px;
                    color: var(--tg-theme-hint-color, #8e8e93);
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

                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                }

                .empty-icon {
                    font-size: 64px;
                    margin-bottom: 16px;
                }

                .empty-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: var(--tg-theme-text-color, #000000);
                }

                .empty-text {
                    font-size: 14px;
                    color: var(--tg-theme-hint-color, #8e8e93);
                    margin-bottom: 24px;
                }

                .btn-book {
                    background-color: var(--tg-theme-button-color, #2481cc);
                    color: var(--tg-theme-button-text-color, #ffffff);
                    border: none;
                    padding: 14px 24px;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                }

                .counter-card {
                    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
                    border-radius: 16px;
                    padding: 16px;
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .counter-label {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--tg-theme-text-color, #000000);
                }

                .counter-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--tg-theme-button-color, #2481cc);
                }

                .bookings-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .booking-card {
                    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
                    border-radius: 16px;
                    overflow: hidden;
                }

                .booking-status {
                    padding: 8px 16px;
                    font-size: 12px;
                    font-weight: 600;
                    text-align: center;
                }

                .status-active {
                    background-color: #00b89420;
                    color: #00b894;
                }

                .status-soon {
                    background-color: #ffc10720;
                    color: #ffc107;
                }

                .status-expired {
                    background-color: #e34d4d20;
                    color: #e34d4d;
                }

                .booking-body {
                    padding: 16px;
                }

                .booking-room {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 4px;
                    color: var(--tg-theme-text-color, #000000);
                }

                .booking-building {
                    font-size: 13px;
                    color: var(--tg-theme-hint-color, #8e8e93);
                    margin-bottom: 12px;
                }

                .booking-details {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    color: var(--tg-theme-text-color, #000000);
                }

                .booking-people {
                    background-color: var(--tg-theme-bg-color, #ffffff);
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                    display: inline-block;
                    margin-bottom: 16px;
                    color: var(--tg-theme-text-color, #000000);
                }

                .booking-actions {
                    display: flex;
                    gap: 12px;
                }

                .btn-cancel {
                    flex: 1;
                    background-color: #e34d4d20;
                    border: none;
                    padding: 10px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 500;
                    color: #e34d4d;
                    cursor: pointer;
                }

                .btn-change {
                    flex: 1;
                    background-color: var(--tg-theme-button-color, #2481cc);
                    border: none;
                    padding: 10px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 500;
                    color: white;
                    cursor: pointer;
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
                    margin-top: 8px;
                }

                .modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .modal-content {
                    background-color: var(--tg-theme-bg-color, #ffffff);
                    border-radius: 20px;
                    padding: 24px;
                    width: 280px;
                    text-align: center;
                }

                .modal-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    color: var(--tg-theme-text-color, #000000);
                }

                .modal-text {
                    font-size: 14px;
                    color: var(--tg-theme-hint-color, #8e8e93);
                    margin-bottom: 24px;
                }

                .modal-buttons {
                    display: flex;
                    gap: 12px;
                }

                .modal-btn {
                    flex: 1;
                    padding: 12px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                }

                .modal-confirm {
                    background-color: #e34d4d;
                    color: white;
                    border: none;
                }

                .modal-cancel {
                    background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
                    color: var(--tg-theme-text-color, #000000);
                    border: none;
                }
            `}</style>
        </div>
    );
}