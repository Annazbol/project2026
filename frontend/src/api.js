const BASE_URL = 'https://preparation-cement-christine-tires.trycloudflare.com/api';

const tg = window.Telegram?.WebApp;

/**
 * Универсальный API wrapper
 */
async function request(endpoint, method = 'GET', body = null) {
    try {
        const res = await fetch(BASE_URL + endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Telegram-Init-Data': tg?.initData || ''
            },
            body: body ? JSON.stringify(body) : null
        });

        // Читаем JSON только ОДИН раз
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            // Используем уже распарсенный data
            let errorMessage = "Неизвестная ошибка сервера";
            
            if (data.detail) {
                if (Array.isArray(data.detail)) {
                    // Обработка ошибок валидации Pydantic (422)
                    errorMessage = data.detail.map(err => 
                        `Поле ${err.loc.join('.')} - ${err.msg}`
                    ).join(', ');
                } else {
                    // Обработка обычных HTTPException
                    errorMessage = data.detail;
                }
            }
            
            console.error(`[API ERROR] ${endpoint}:`, errorMessage);
            throw new Error(errorMessage);
        }

        return data;

    } catch (err) {
        // Здесь err.message уже будет содержать детальное описание
        console.error(`[FETCH ERROR] ${endpoint}`, err.message);
        throw err;
    }
}

/* =========================
   ROOMS
========================= */

export const fetchRooms = () => request('/rooms');

export const fetchBuildings = () => request('/buildings');

export const fetchTags = () => request('/tags'); 

export const createRoom = async (tgId, roomData) => {
    const { selectedTags, ...params } = roomData;
    
    const query = new URLSearchParams({
        tg_id: tgId,
        room_number: params.room_number,
        building_id: params.building_id,
        capacity: params.capacity,
        description: params.description
    }).toString();

    return request(`/admin/rooms/add?${query}`, 'POST', selectedTags);
};

export const updateRoom = async (tgId, roomId, roomData) => {
    const { selectedTags, ...params } = roomData;
    
    const query = new URLSearchParams({
        tg_id: tgId,
        room_number: params.room_number,
        building_id: params.building_id,
        capacity: params.capacity,
        description: params.description
    }).toString();

    return request(`/admin/rooms/${roomId}?${query}`, 'PATCH', selectedTags);
};

export const deleteRoom = async (roomId, tgId) => {
    return request(`/admin/rooms/${roomId}?tg_id=${tgId}`, 'DELETE');
};

export const fetchRoomById = (roomId) => request(`/rooms/${roomId}`);


/* =========================
   BOOKINGS
========================= */

export const createBooking = (data) =>
    request('/book', 'POST', data);

export const fetchUserBookings = (userId) =>
    request(`/bookings/user/${userId}`);

export const fetchBookingDetails = (bookId) =>
    request(`/bookings/${bookId}`);

export const cancelBooking = (bookId, tgId) =>
    request(`/bookings/${bookId}/cancel?tg_id=${tgId}`, 'POST');

export const updateBooking = (id, data) =>
    request(`/bookings/${id}`, 'PATCH', data);

export const fetchPendingBookings = (tgId) =>
    request(`/admin/bookings/pending?tg_id=${tgId}`);

export const approveBooking = (bookId, tgId) =>
    request(`/admin/bookings/${bookId}/approve?tg_id=${tgId}`, 'POST');

export const rejectBooking = (bookId, tgId) =>
    request(`/admin/bookings/${bookId}/reject?tg_id=${tgId}`, 'POST');

export const confirmAttendance = (bookId, tgId) =>
    request(`/admin/bookings/${bookId}/confirm-attendance?tg_id=${tgId}`, 'POST');

export const markNoShow = (bookId, tgId) =>
    request(`/admin/bookings/${bookId}/mark-no-show?tg_id=${tgId}`, 'POST');

/* =========================
   AVAILABILITY / OPTIONS
========================= */

export const checkBookingOptions = (state) =>
    request('/booking/check-options', 'POST', state);

export const fetchCurrentUser = (tgId) => 
    request(`/users/me?tg_id=${tgId}`);