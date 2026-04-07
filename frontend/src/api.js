const tg = window.Telegram?.WebApp;

const BASE_URL = 'http://localhost:8000/api';



async function request(endpoint, method = 'GET', body = null) {

    const headers = {

        'Content-Type': 'application/json',

        'X-Telegram-Init-Data': tg?.initData || ''

    };



    const options = { method, headers };

    if (body) options.body = JSON.stringify(body);



    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    if (!response.ok) throw new Error(`Ошибка: ${response.status}`);

    return response.json();

}



export const fetchRooms = () => request('/rooms');

export const fetchAvailablePeopleCounts = () => request('/available-people-counts', 'POST', {});

export const fetchAvailableTimeSlots = (data) => request('/available-time-slots', 'POST', data);

export const createBooking = (data) => request('/book', 'POST', data);

export const fetchRoomById = async (id) => {
    const response = await axios.get(`/api/rooms/${id}`);
    return response.data;
};

export const fetchUserBookings = async (userId) => {
    const response = await axios.get(`/api/bookings/user/${userId}`);
    return response.data;
};