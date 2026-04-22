import React, { useEffect } from 'react';
import './MainMenu.css';
import { useUser } from '../UserContext.jsx';

const tg = window.Telegram?.WebApp;

export default function MainMenu({ onStartBooking, onShowBookings, onShowRooms, onShowAdmin }) {
    const { user } = useUser();

    // 🆕 Базовые пункты меню для всех
    const menuItems = [
        {
            key: 'book',
            icon: '🗓️',
            label: 'Забронировать',
            action: 'start_booking'
        },
        {
            key: 'bookings',
            icon: '🕒',
            label: 'Мои бронирования',
            action: 'mybookings'
        },
        {
            key: 'rooms',
            icon: '🏢',
            label: 'Все комнаты',
            action: 'rooms'
        },
    ];

    // 🆕 Если админ — добавляем пункт "Заявки"
    if (user?.administrator) {
        menuItems.push({
            key: 'admin',
            icon: '👑',
            label: 'Заявки на подтверждение',
            action: 'admin',
            isAdmin: true   // флаг для стилизации
        });
    }

    useEffect(() => {
        if (tg) {
            tg.expand();
            tg.setHeaderColor('bg_color');
            tg.setBackgroundColor('bg_color');
            tg.BackButton?.hide();
        }
    }, []);

    const handleBotAction = (action) => {
        tg?.HapticFeedback?.impactOccurred('light');
        if (action === 'start_booking') return onStartBooking?.();
        if (action === 'mybookings') return onShowBookings?.();
        if (action === 'rooms') return onShowRooms?.();
        if (action === 'admin') return onShowAdmin?.();
        tg?.sendData?.(JSON.stringify({ action }));
        tg?.close?.();
    };

    const userName = user?.name || "Гость";

    return (
        <div className="container">
            <div className="welcome-section">
                <div className="welcome-text">
                    Добро пожаловать, {userName}!
                </div>
                {/* 🆕 Бейдж админа */}
                {user?.administrator && (
                    <div className="admin-badge">👑 Администратор</div>
                )}
            </div>

            <div className="menu-grid">
                {menuItems.map((item) => (
                    <div
                        key={item.key}
                        className={`menu-item ${item.isAdmin ? 'menu-item-admin' : ''}`}
                        onClick={() => handleBotAction(item.action)}
                    >
                        <div className="menu-icon">{item.icon}</div>
                        <div className="menu-content">
                            <div className="menu-name">{item.label}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}