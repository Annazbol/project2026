import React, { useState, useEffect } from 'react';
import MainMenu from './pages/MainMenu';
import RoomList from './pages/RoomList';
import DatePicker from './pages/DatePicker';
import Peoples from './pages/Peoples';
import ChooseTime from './pages/ChooseTime';
import DurationPicker from './pages/DurationPicker';

const tg = window.Telegram?.WebApp;

function App() {
  const [step, setStep] = useState('menu'); 

  const [bookingData, setBookingData] = useState({
    roomId: null,
    roomName: '',
    date: null,
    num_of_people: 1,
    startTime: null,
    duration: 60
  });

  useEffect(() => {
    tg?.ready();
    tg?.expand();
  }, []);

  const handleSelectRoom = (roomId, roomNumber) => {
    setBookingData({ ...bookingData, roomId, roomName: roomNumber });
    setStep('date');
  };

  const handleSelectDate = (date) => {
    setBookingData({ ...bookingData, date });
    setStep('people');
  };

 const handleSelectPeople = (count) => {
  setBookingData({ ...bookingData, num_of_people: count });
  setStep('duration');
};

const handleSelectDuration = (minutes) => {
  setBookingData({ ...bookingData, duration: minutes });
  setStep('time');
};

  const handleSelectTime = (timeSlot) => {
    setBookingData({ ...bookingData, startTime: timeSlot.start });
    setStep('duration');
  };

  const handleFinalBook = async () => {
  try {
    const finalData = {
      user_id: tg?.initDataUnsafe?.user?.id || 12345,
      room_id: bookingData.roomId,
      slot_date: bookingData.date,
      start_time: bookingData.startTime,
      num_of_people: bookingData.num_of_people,
      duration_minutes: bookingData.duration
    };

    const response = await fetch('http://localhost:8000/api/book', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': tg?.initData || '' 
      },
      body: JSON.stringify(finalData)
    });

    const result = await response.json();

    if (result.success) {
      tg?.showAlert("Бронирование успешно создано!");
      setStep('menu'); 
    } else {
      tg?.showAlert("Ошибка: " + (result.error || "Неизвестная ошибка"));
    }
  } catch (e) {
    console.error(e);
    tg?.showAlert("Ошибка соединения с сервером");
  }
};


  return (
    <div className="App">
      {step === 'menu' && (
        <MainMenu onStartBooking={() => setStep('rooms')} />
      )}

      {step === 'rooms' && (
        <RoomList onSelectRoom={handleSelectRoom} />
      )}

      {step === 'date' && (
        <DatePicker 
          onSelectDate={handleSelectDate} 
          goBack={() => setStep('rooms')} 
        />
      )}

      {step === 'people' && (
        <Peoples 
          onSelectPeople={handleSelectPeople} 
          goBack={() => setStep('date')} 
        />
      )}

      {step === 'time' && (
        <ChooseTime 
          selectedRoomId={bookingData.roomId}
          selectedDate={bookingData.date}
          num_of_people={bookingData.num_of_people}
          onSelectTime={handleSelectTime}
          goBack={() => setStep('people')} 
        />
      )}

      {step === 'duration' && (
        <DurationPicker 
          onSelect={handleSelectDuration} 
          goBack={() => setStep('people')} 
        />
      )}
    </div>
  );
}

export default App;