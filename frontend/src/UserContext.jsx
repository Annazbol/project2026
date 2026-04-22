import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchCurrentUser } from './api';

const UserContext = createContext(null);

export function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const tg = window.Telegram?.WebApp;

    const tgId = tg?.initDataUnsafe?.user?.id;

    if (!tgId) {
        console.error("Нет Telegram ID — запусти внутри Telegram WebApp");
    }

    const loadUser = async () => {
    try {
        setLoading(true);
        setError(null);
        
        // 🆕 ОТЛАДКА
        console.log('========== ОТЛАДКА АВТОРИЗАЦИИ ==========');
        console.log('initData:', window.Telegram?.WebApp?.initData);
        console.log('initDataUnsafe:', window.Telegram?.WebApp?.initDataUnsafe);
        console.log('user object:', window.Telegram?.WebApp?.initDataUnsafe?.user);
        console.log('Отправляю запрос с tg_id =', tgId);
        console.log('Тип tgId:', typeof tgId);
        
        const userData = await fetchCurrentUser(tgId);
        console.log('✅ Получен пользователь:', userData);
        setUser(userData);
    } catch (err) {
        console.error('❌ Ошибка:', err);
        setError(err.message);
        setUser(null);
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {
        loadUser();
    }, []);

    return (
        <UserContext.Provider value={{ 
            user, 
            loading, 
            error, 
            tgId,  // Передаём также tgId для использования в запросах
            reloadUser: loadUser 
        }}>
            {children}
        </UserContext.Provider>
    );
}

// Хук для удобного доступа
export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser должен быть внутри UserProvider');
    }
    return context;
}