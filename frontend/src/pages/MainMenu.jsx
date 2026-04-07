import React, { useState, useEffect } from 'react';
import './MainMenu.css'

const tg = window.Telegram?.WebApp;

export default function MainMenu({ onStartBooking }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (tg) {
            tg.expand();
            tg.setHeaderColor('bg_color');
            tg.setBackgroundColor('bg_color');
            setUser(tg.initDataUnsafe?.user || null);
            
            tg.BackButton.hide();
        }
    }, []);

    const handleBotAction = (action) => {
        tg?.HapticFeedback.impactOccurred('light');
        tg?.sendData(JSON.stringify({ action: action }));
        tg?.close();
    };

    return (
    <div className="container">
        <div className="welcome-section">
            <div className="avatar">
                {user?.first_name ? user.first_name.charAt(0).toUpperCase() : '👤'}
            </div>
            <div className="welcome-text">Здравствуйте, {user?.first_name || 'гость'}!</div>
            <div className="user-info">
                {user?.username ? `@${user.username}` : 'Система бронирования ВятГУ'}
            </div>
        </div>

        <div className="menu-grid">
            <div className="menu-item" onClick={() => handleBotAction(item.action)}>
                <div className="menu-icon">{item.icon}</div>
                <div className="menu-content">
                    <div className="menu-name">{item.name}</div>
                </div>
                <div className="menu-arrow">→</div>
            </div>
        </div>
    </div>
);
}