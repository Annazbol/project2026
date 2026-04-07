import React, { useState, useEffect } from 'react';
import './MyBookings.css'

const tg = window.Telegram?.WebApp;

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
        </div>
    );
}