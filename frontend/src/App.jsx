import React, { useState, useEffect } from 'react';
import MainMenu from './pages/MainMenu.jsx';
import RoomList from './pages/RoomList.jsx';
import DatePicker from './pages/DatePicker.jsx';
import Peoples from './pages/Peoples.jsx';
import ChooseTime from './pages/ChooseTime.jsx';
import DurationPicker from './pages/DurationPicker.jsx';
import MyBookings from './pages/MyBookings.jsx';
import BookingParams from './pages/BookingParameters.jsx';
import ChooseRoom from './pages/ChooseRoom.jsx';
import RoomDetails from './pages/RoomDetails.jsx';
import BookingDetails from './pages/BookDescription.jsx';
import AdminBookings from './pages/AdminBookings.jsx';
import CreateRoom from './pages/CreateRoom.jsx';
import { createBooking, fetchBookingDetails, cancelBooking, fetchRoomById } from './api';
import { useUser } from './UserContext.jsx';

const tg = window.Telegram?.WebApp || {
    ready: () => {},
    expand: () => {},
    showAlert: (msg) => alert(msg),
    showConfirm: (msg, cb) => cb(window.confirm(msg)),
    HapticFeedback: { notificationOccurred: () => {} },
    initData: '',
    initDataUnsafe: { user: { id: 12345 } }
};

function App() {
    const { user, loading: userLoading, error: userError, tgId } = useUser();  // 🆕
    
    const [step, setStep] = useState('menu');
    const [bookingData, setBookingData] = useState({
        room_id: null,
        booking_date: null,
        people_count: 1,
        start_time: null,
        duration_minutes: 30
    });
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [editingRoom, setEditingRoom] = useState(null);

    useEffect(() => {
        tg?.ready();
        tg?.expand();
    }, []);

    // 🆕 Экраны загрузки и ошибки авторизации
    if (userLoading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '100vh',
                color: 'var(--tg-theme-hint-color)'
            }}>
                <div>⏳ Загрузка...</div>
            </div>
        );
    }

    if (userError || !user) {
        return (
            <div style={{ 
                padding: '40px 20px', 
                textAlign: 'center',
                color: 'var(--tg-theme-text-color)'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                <h2>Требуется авторизация</h2>
                <p style={{ color: 'var(--tg-theme-hint-color)', marginTop: '12px' }}>
                    Сначала привяжите свой Telegram-аккаунт через бота.
                </p>
                <p style={{ marginTop: '8px', fontSize: '13px', color: '#888' }}>
                    {userError || 'Пользователь не найден'}
                </p>
            </div>
        );
    }

    // ============================================
    // ОБРАБОТЧИКИ
    // ============================================

    const chooseRoom = (room) => {
        setSelectedRoomId(room.id_room);
        setStep('roomdetails');
    };

    const handleSelectDate = (date) => {
        setBookingData(prev => ({ ...prev, booking_date: date }));
        setStep('params');
    };

    const handleSelectPeople = (count) => {
        setBookingData(prev => ({ ...prev, people_count: count }));
        setStep('params');
    };

    const handleSelectTime = (slot) => {
        setBookingData(prev => ({ ...prev, start_time: slot.start }));
        setStep('params');
    };

    const handleSelectDuration = (minutes) => {
        setBookingData(prev => ({ ...prev, duration_minutes: minutes }));
        setStep('params');
    };

    const handleSelectRoom = (room) => {
        setBookingData(prev => ({ ...prev, room_id: room.id_room }));
        setStep('params');
    };

    const handleOpenBookingDetails = async (booking) => {
        try {
            const details = await fetchBookingDetails(booking.book_id);
            setSelectedBooking(details);
            setStep('bookingdetails');
        } catch (e) {
            console.error(e);
            tg?.showAlert("Ошибка загрузки информации о бронировании");
        }
    };

    const handleFinalBook = async () => {
        try {
            const finalData = {
                user_id: tgId,  // 🆕 Используем tgId из контекста
                room_id: bookingData.room_id,
                booking_date: bookingData.booking_date,
                start_time: bookingData.start_time,
                people_count: bookingData.people_count,
                duration_minutes: bookingData.duration_minutes
            };

            const result = await createBooking(finalData);

            if (result.success) {
                tg?.showAlert("Бронирование успешно создано!");
                setStep('menu');
            }
        } catch (e) {
            console.error(e);
            tg?.showAlert(e.message || "Ошибка соединения с сервером");
        }
    };

    // 🆕 Универсальная функция отмены
    const handleCancelBooking = async (bookId) => {
        return new Promise((resolve, reject) => {
            const requestCancellation = async () => {
                try {
                    const result = await cancelBooking(bookId, tgId);
                    tg?.HapticFeedback?.notificationOccurred('success');
                    tg?.showAlert("Бронирование успешно отменено");
                    resolve(result);
                } catch (error) {
                    console.error("Ошибка отмены:", error);
                    tg?.showAlert(`Ошибка: ${error.message}`);
                    reject(error);
                }
            };

            if (tg?.showConfirm) {
                tg.showConfirm(
                    "Вы действительно хотите отменить это бронирование?",
                    (confirmed) => {
                        if (confirmed) requestCancellation();
                        else resolve(null);
                    }
                );
            } else {
                if (window.confirm("Отменить бронирование?")) {
                    requestCancellation();
                } else {
                    resolve(null);
                }
            }
        });
    };

    // 🆕 Отмена с возвратом в список
    const handleCancelFromDetails = async (bookId) => {
        try {
            const result = await handleCancelBooking(bookId);
            if (result) setStep('mybookings');
        } catch (e) {}
    };
    const handleEditRoom = async (roomId) => {
        try {
            const roomDetails = await fetchRoomById(roomId);
            setEditingRoom(roomDetails);
            setStep('createroom');
        } catch (e) {
            tg?.showAlert("Ошибка загрузки данных комнаты");
        }
    };
    
    const handleBackFromForm = () => {
        setEditingRoom(null);
        setStep(editingRoom ? 'roomdetails' : 'rooms');
    };

    // ============================================
    // РЕНДЕР
    // ============================================

    return (
        <div className="App">
            {step === 'menu' && (
                <MainMenu
                    onStartBooking={() => setStep('params')}
                    onShowBookings={() => setStep('mybookings')}
                    onShowRooms={() => setStep('rooms')}
                    onShowAdmin={() => setStep('admin')}
                />
            )}

            {step === 'params' && (
                <BookingParams
                    bookingData={bookingData}
                    onChooseRoom={() => setStep('chooseroom')}
                    onChooseDate={() => setStep('date')}
                    onChooseTime={() => setStep('time')}
                    onChooseDuration={() => setStep('duration')}
                    onChoosePeople={() => setStep('people')}
                    onFinalBook={handleFinalBook}
                    goBack={() => setStep('menu')}
                />
            )}

            {step === 'mybookings' && (
                <MyBookings
                    onBackToMenu={() => setStep('menu')}
                    onOpenBooking={handleOpenBookingDetails}
                    onCancel={handleCancelBooking}
                />
            )}

            {step === 'bookingdetails' && (
                <BookingDetails
                    booking={selectedBooking}
                    goBack={() => setStep('mybookings')}
                    onCancel={() => handleCancelFromDetails(selectedBooking.book_id)}
                />
            )}

            {step === 'rooms' && (
                <RoomList 
                    onSelectRoom={(room) => { setSelectedRoomId(room.id_room); setStep('roomdetails'); }} 
                    goBack={() => setStep('menu')} 
                    onCreateRoom={() => { setEditingRoom(null); setStep('createroom'); }} 
                />
            )}

            {step === 'roomdetails' && (
                <RoomDetails
                    roomId={selectedRoomId}
                    goBack={() => setStep('rooms')}
                    onBook={() => setStep('date')}
                    onEdit={() => handleEditRoom(selectedRoomId)}
                />
            )}

            {step === 'date' && (
                <DatePicker
                    bookingData={bookingData}
                    setBookingData={setBookingData}
                    goBack={() => setStep('params')}
                    onSelectDate={handleSelectDate}
                />
            )}

            {step === 'chooseroom' && (
                <ChooseRoom
                    bookingData={bookingData}
                    onSelectRoom={handleSelectRoom}
                    goBack={() => setStep('params')}
                />
            )}

            {step === 'people' && (
                <Peoples
                    bookingData={bookingData}
                    onSelectPeople={handleSelectPeople}
                    goBack={() => setStep('params')}
                />
            )}

            {step === 'time' && (
                <ChooseTime
                    bookingData={bookingData}
                    onSelectTime={handleSelectTime}
                    goBack={() => setStep('params')}
                />
            )}

            {step === 'duration' && (
                <DurationPicker
                    bookingData={bookingData}
                    goBack={() => setStep('params')}
                    onConfirm={handleSelectDuration}
                />
            )}

            {step === 'createroom' && (
                <CreateRoom 
                    goBack={handleBackFromForm}
                    roomToEdit={editingRoom} 
                />
            )}

            {step === 'admin' && (
                <AdminBookings goBack={() => setStep('menu')} />
            )}
        </div>
    );
}

export default App;