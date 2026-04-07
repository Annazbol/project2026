import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Для кнопки Назад
import './BookingDetails.css';

const tg = window.Telegram?.WebApp;

// Вспомогательные функции
const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatDateTime = (dateTimeStr) => {
    return new Date(dateTimeStr).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
};

const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

const getNightText = (nights) => {
    if (nights % 10 === 1 && nights % 100 !== 11) return `${nights} ночь`;
    if ([2,3,4].includes(nights % 10) && ![12,13,14].includes(nights % 100)) return `${nights} ночи`;
    return `${nights} ночей`;
};

const getGuestText = (guests) => {
    if (guests === 1) return 'гость';
    if (guests <= 4) return 'гостя';
    return 'гостей';
};

const getStatusInfo = (status) => {
    const map = {
        active: { text: "Активна 🟢", className: "status-active" },
        pending: { text: "Ожидает подтверждения ⏳", className: "status-pending" },
        cancelled: { text: "Отменена 🔴", className: "status-cancelled" },
        completed: { text: "Завершена 🏁", className: "status-completed" }
    };
    return map[status] || map.active;
};

// Моковые данные (В реальном проекте будешь загружать через API по ID из параметров)
const initialBookingData = {
    id: "VYATSU-20260401-001",
    room: {
        id: 2, name: "Панорама «Вятка»", building: "Корпус №2", roomNumber: "217", capacity: 3,
        description: "Просторная комната с панорамным видом на набережную. Удобные диваны, кофемашина, кондиционер.",
        imageUrl: null 
    },
    checkIn: "2026-04-10", checkOut: "2026-04-12",
    checkInTime: "14:00", checkOutTime: "12:00",
    guests: 2,
    status: "pending", // active, pending, cancelled, completed
    createdAt: "2026-03-25T10:30:00",
    user: { name: "Иван Студент", role: "admin" } // Поменяй на 'user' для теста
};


export default function BookingDetails() {
    const navigate = useNavigate();
    
    // Состояния
    const [booking, setBooking] = useState(initialBookingData);
    const [userRole, setUserRole] = useState(initialBookingData.user.role);

    useEffect(() => {
        if (tg) {
            tg.expand();
            tg.enableClosingConfirmation();
            tg.MainButton.hide(); // Скрываем кнопку ТГ, так как у нас свои кнопки
        }
    }, []);

    // Обработчики действий
    const handleBack = () => {
        if (tg) tg.HapticFeedback.impactOccurred('light');
        navigate(-1); // Возврат на предыдущую страницу React
    };

    const handleEdit = () => {
        tg?.showPopup({
            title: '✏️ Изменение брони',
            message: `Изменить бронь ${booking.id}? Вы будете перенаправлены на форму редактирования.`,
            buttons: [
                { id: 'cancel', type: 'cancel', text: 'Отмена' },
                { id: 'confirm', type: 'default', text: 'Изменить' }
            ]
        }, (btnId) => {
            if (btnId === 'confirm') {
                if (tg) tg.HapticFeedback.impactOccurred('light');
                alert("Переход к редактированию..."); // Здесь можно сделать navigate()
            }
        });
    };

    const handleCancel = () => {
        tg?.showPopup({
            title: '❌ Отмена бронирования',
            message: `Вы уверены, что хотите отменить бронь ${booking.id}?`,
            buttons: [
                { id: 'cancel', type: 'cancel', text: 'Назад' },
                { id: 'confirm', type: 'destructive', text: 'Отменить' }
            ]
        }, (btnId) => {
            if (btnId === 'confirm') {
                if (tg) tg.HapticFeedback.notificationOccurred('warning');
                setBooking(prev => ({ ...prev, status: 'cancelled' }));
                tg?.sendData(JSON.stringify({ action: 'cancel_booking', bookingId: booking.id }));
            }
        });
    };

    const handleConfirm = () => {
        tg?.showPopup({
            title: '✅ Подтверждение брони',
            message: `Подтвердить бронь ${booking.id} для ${booking.user.name}?`,
            buttons: [
                { id: 'cancel', type: 'cancel', text: 'Отмена' },
                { id: 'confirm', type: 'default', text: 'Подтвердить' }
            ]
        }, (btnId) => {
            if (btnId === 'confirm') {
                if (tg) tg.HapticFeedback.notificationOccurred('success');
                setBooking(prev => ({ ...prev, status: 'active' }));
                tg?.sendData(JSON.stringify({ action: 'confirm_booking', bookingId: booking.id }));
            }
        });
    };

    const handleReject = () => {
        tg?.showPopup({
            title: '🚫 Отклонение брони',
            message: `Вы уверены, что хотите отклонить бронь ${booking.id}?`,
            buttons: [
                { id: 'cancel', type: 'cancel', text: 'Назад' },
                { id: 'confirm', type: 'destructive', text: 'Отклонить' }
            ]
        }, (btnId) => {
            if (btnId === 'confirm') {
                if (tg) tg.HapticFeedback.notificationOccurred('error');
                setBooking(prev => ({ ...prev, status: 'cancelled' }));
                tg?.sendData(JSON.stringify({ action: 'reject_booking', bookingId: booking.id }));
            }
        });
    };

    // Отрисовка кнопок в зависимости от роли и статуса
    const renderActionButtons = () => {
        const isActive = booking.status === 'active';
        const isPending = booking.status === 'pending';
        const isAdmin = userRole === 'admin';
        const isUser = userRole === 'user';

        if (isUser && isActive) {
            return (
                <div className="bd-actions">
                    <button className="bd-btn btn-secondary" onClick={handleEdit}>✏️ Изменить</button>
                    <button className="bd-btn btn-danger" onClick={handleCancel}>❌ Отменить</button>
                </div>
            );
        }
        
        if (isAdmin && isPending) {
            return (
                <div className="bd-actions">
                    <button className="bd-btn btn-primary" onClick={handleConfirm}>✅ Подтвердить</button>
                    <button className="bd-btn btn-danger" onClick={handleReject}>🚫 Отклонить</button>
                </div>
            );
        }
        
        if (isAdmin && isActive) {
            return (
                <div className="bd-actions">
                    <button className="bd-btn btn-secondary" onClick={handleEdit}>✏️ Изменить</button>
                    <button className="bd-btn btn-danger" onClick={handleCancel}>❌ Отменить</button>
                </div>
            );
        }

        // Для completed или cancelled
        return (
            <div className="bd-actions">
                <button className="bd-btn btn-secondary" onClick={handleBack}>🔙 Закрыть</button>
            </div>
        );
    };

    const nights = calculateNights(booking.checkIn, booking.checkOut);
    const statusInfo = getStatusInfo(booking.status);

    return (
        <div className="booking-details-container">
            <div className="booking-details-wrapper">
                <div className="back-button" onClick={handleBack}>←</div>
                
                <div className="bd-header">
                    <div className="bd-logo">ВятГУ · Детали</div>
                </div>

                {/* Карточка 1: Основная информация */}
                <div className="info-card">
                    <div className="room-image">
                        {booking.room.imageUrl ? (
                            <img src={booking.room.imageUrl} alt={booking.room.name} />
                        ) : (
                            <div className="image-placeholder">
                                <span>📸</span>
                            </div>
                        )}
                    </div>
                    
                    <div className={`status-badge ${statusInfo.className}`}>
                        {statusInfo.text}
                    </div>
                    
                    <div className="room-name">{booking.room.name}</div>
                    
                    <div className="location-info">
                        <div className="location-item">🏢 {booking.room.building}</div>
                        <div className="location-item">🚪 Каб. {booking.room.roomNumber}</div>
                        <div className="location-item">👥 до {booking.room.capacity} чел.</div>
                    </div>
                    
                    <div className="room-description">
                        {booking.room.description}
                    </div>
                </div>

                {/* Карточка 2: Детали времени */}
                <div className="info-card">
                    <div className="info-title">📋 Детали бронирования</div>
                    
                    <div className="detail-row">
                        <span className="detail-label">📅 Заезд</span>
                        <span className="detail-value">{formatDate(booking.checkIn)} в {booking.checkInTime}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">⏳ Длительность</span>
                        <span className="detail-value">{nights} {getNightText(nights)}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">👥 Количество человек</span>
                        <span className="detail-value">{booking.guests} {getGuestText(booking.guests)}</span>
                    </div>
                </div>

                {/* Карточка 3: Инфа о госте */}
                <div className="info-card">
                    <div className="info-title">👤 Информация о госте</div>
                    
                    <div className="detail-row">
                        <span className="detail-label">Имя</span>
                        <span className="detail-value">{booking.user.name}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">🕒 Создано</span>
                        <span className="detail-value">{formatDateTime(booking.createdAt)}</span>
                    </div>	
                </div>

                {/* Динамические кнопки */}
                {renderActionButtons()}
            </div>
        </div>
    );
}