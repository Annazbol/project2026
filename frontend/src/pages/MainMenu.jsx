import React, { useState, useEffect } from 'react';

const tg = window.Telegram?.WebApp;

export default function MainMenu({ onStartBooking }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (tg) {
            tg.expand();
            // Устанавливаем цвета темы Telegram
            tg.setHeaderColor('bg_color');
            tg.setBackgroundColor('bg_color');
            setUser(tg.initDataUnsafe?.user || null);
            
            // Скрываем кнопку "Назад" на главном экране
            tg.BackButton.hide();
        }
    }, []);

    // Функция для вызова действий, которые обрабатывает бот (Python)
    const handleBotAction = (action) => {
        tg?.HapticFeedback.impactOccurred('light');
        // Отправляем данные боту и закрываем Mini App
        tg?.sendData(JSON.stringify({ action: action }));
        tg?.close();
    };

    return (
        <div className="container" style={{ padding: '16px', paddingBottom: '80px' }}>
            {/* Секция приветствия */}
            <div className="welcome-section" style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div className="avatar" style={{ 
                    width: '64px', height: '64px', borderRadius: '50%', 
                    background: 'var(--tg-theme-button-color)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px', fontSize: '24px'
                }}>
                    {user?.first_name ? user.first_name.charAt(0).toUpperCase() : '👤'}
                </div>
                <h2 style={{ margin: '0', color: 'var(--tg-theme-text-color)' }}>
                    Привет, {user?.first_name || 'студент'}!
                </h2>
                <p style={{ color: 'var(--tg-theme-hint-color)', fontSize: '14px' }}>
                    Система бронирования коворкингов ВятГУ
                </p>
            </div>

            {/* Карточка режима работы */}
            <div className="schedule-card" style={{ 
                background: 'var(--tg-theme-secondary-bg-color)', 
                padding: '16px', borderRadius: '16px', marginBottom: '24px' 
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🕐 Режим работы</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                    <span>Будни</span>
                    <span>8:00 – 20:30</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span>Суббота</span>
                    <span>8:00 – 18:00</span>
                </div>
            </div>

            <div className="menu-title" style={{ fontWeight: 'bold', marginBottom: '12px' }}>Действия</div>
            
            <div className="menu-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* ГЛАВНАЯ КНОПКА: Начинает процесс бронирования внутри React */}
                <div className="menu-item" 
                    onClick={onStartBooking} 
                    style={{ 
                        display: 'flex', alignItems: 'center', padding: '16px', 
                        background: 'var(--tg-theme-button-color)', color: 'var(--tg-theme-button-text-color)',
                        borderRadius: '16px', cursor: 'pointer'
                    }}
                >
                    <div style={{ fontSize: '24px', marginRight: '16px' }}>📅</div>
                    <div style={{ flexGrow: 1 }}>
                        <div style={{ fontWeight: 'bold' }}>Забронировать</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>Выбрать комнату и время</div>
                    </div>
                    <div style={{ fontWeight: 'bold' }}>→</div>
                </div>

                {/* Остальные кнопки: Взаимодействуют с ботом напрямую */}
                {[
                    { id: 'my_bookings', icon: '📋', name: 'Мои бронирования', action: 'my_bookings' },
                    { id: 'buildings', icon: '📍', name: 'Корпуса и адреса', action: 'show_buildings' },
                ].map(item => (
                    <div key={item.id} 
                        className="menu-item" 
                        onClick={() => handleBotAction(item.action)}
                        style={{ 
                            display: 'flex', alignItems: 'center', padding: '16px', 
                            background: 'var(--tg-theme-secondary-bg-color)', 
                            borderRadius: '16px', cursor: 'pointer'
                        }}
                    >
                        <div style={{ fontSize: '24px', marginRight: '16px' }}>{item.icon}</div>
                        <div style={{ flexGrow: 1 }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--tg-theme-text-color)' }}>{item.name}</div>
                        </div>
                        <div style={{ color: 'var(--tg-theme-hint-color)' }}>→</div>
                    </div>
                ))}
            </div>

            <button 
                onClick={() => handleBotAction('support')}
                style={{ 
                    width: '100%', marginTop: '24px', padding: '12px', 
                    background: 'none', border: '1px solid var(--tg-theme-hint-color)',
                    color: 'var(--tg-theme-hint-color)', borderRadius: '12px', fontSize: '14px'
                }}
            >
                ❓ Помощь и поддержка
            </button>
        </div>
    );
}