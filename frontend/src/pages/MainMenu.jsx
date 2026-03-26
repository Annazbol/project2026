import React, { useState, useEffect } from 'react';

const tg = window.Telegram?.WebApp;

export default function MainMenu() {
    const [user, setUser] = useState(null);
    const [activeNav, setActiveNav] = useState('home');
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        if (tg) {
            tg.expand();
            tg.setHeaderColor('bg_color');
            tg.setBackgroundColor('bg_color');
            setUser(tg.initDataUnsafe?.user || null);
        }
    }, []);

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const handleMenuAction = (action) => {
        tg?.sendData(JSON.stringify({ action: action }));
        tg?.close();
    };

    const handleNavAction = (nav) => {
        setActiveNav(nav);
        switch(nav) {
            case 'home':
                showToast('Вы на главной странице');
                break;
            case 'book':
                handleMenuAction('start_booking');
                break;
            case 'bookings':
                handleMenuAction('my_bookings');
                break;
            case 'rooms':
                handleMenuAction('show_rooms');
                break;
            case 'buildings':
                handleMenuAction('show_buildings');
                break;
            default:
                showToast('Функция в разработке');
        }
    };

    return (
        <div className="container" style={{ paddingBottom: '80px' }}>
            <div className="welcome-section">
                <div className="avatar">
                    {user?.first_name ? user.first_name.charAt(0).toUpperCase() : '👤'}
                </div>
                <div className="welcome-text">
                    Здравствуйте, {user?.first_name || 'гость'}!
                </div>
                <div className="user-info">
                    {user?.username ? `@${user.username}` : 'Система бронирования комнат отдыха ВятГУ'}
                </div>
            </div>

            <div className="stats-section">
                <div className="stat-card">
                    <div className="stat-value">0</div>
                    <div className="stat-label">Активных броней</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">0</div>
                    <div className="stat-label">Всего бронирований</div>
                </div>
            </div>

            <div className="schedule-card">
                <div className="schedule-title">🕐 Режим работы коворкингов</div>
                <div className="schedule-row">
                    <span className="schedule-label">Часы работы</span>
                    <span className="schedule-value">8:00 – 20:30</span>
                </div>
                <div className="schedule-row">
                    <span className="schedule-label">Дни недели</span>
                    <span className="schedule-value">Понедельник – Суббота</span>
                </div>
                <div className="schedule-row">
                    <span className="schedule-label">Воскресенье</span>
                    <span className="schedule-value">Выходной</span>
                </div>
            </div>

            <div className="menu-title">Основные действия</div>
            <div className="menu-grid">
                {[
                    { id: 'book', icon: '📅', name: 'Забронировать', desc: 'Забронировать комнату отдыха', action: 'book', iconClass: '' },
                    { id: 'my_bookings', icon: '📋', name: 'Мои бронирования', desc: 'Просмотр и управление бронями', action: 'my_bookings', iconClass: 'secondary' },
                    { id: 'rooms', icon: '🏢', name: 'Все комнаты отдыха', desc: 'Список всех доступных комнат', action: 'rooms', iconClass: 'info' },
                    { id: 'buildings', icon: '📍', name: 'Корпуса ВятГУ', desc: 'Информация о корпусах и коворкингах', action: 'buildings', iconClass: 'building' }
                ].map(item => (
                    <div key={item.id} className="menu-item" onClick={() => handleMenuAction(item.action)}>
                        <div className={`menu-icon ${item.iconClass}`}>{item.icon}</div>
                        <div className="menu-content">
                            <div className="menu-name">{item.name}</div>
                            <div className="menu-desc">{item.desc}</div>
                        </div>
                        <div className="menu-arrow">→</div>
                    </div>
                ))}
            </div>

            <button className="btn-outline" onClick={() => handleMenuAction('support')}>
                ❓ Помощь и поддержка
            </button>

            {toastMessage && <div className="toast">{toastMessage}</div>}

            <div className="bottom-nav">
                {[
                    { id: 'home', icon: '🏠', label: 'Главная' },
                    { id: 'book', icon: '📅', label: 'Бронь' },
                    { id: 'bookings', icon: '📋', label: 'Мои' },
                    { id: 'rooms', icon: '🏢', label: 'Комнаты' },
                    { id: 'buildings', icon: '📍', label: 'Корпуса' }
                ].map(nav => (
                    <div 
                        key={nav.id} 
                        className={`nav-item ${activeNav === nav.id ? 'active' : ''}`} 
                        onClick={() => handleNavAction(nav.id)}
                    >
                        <div className="nav-icon">{nav.icon}</div>
                        <div className="nav-label">{nav.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}