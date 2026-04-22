from pydantic import BaseModel, ConfigDict
from datetime import date, time, datetime, timedelta
from typing import List, Optional

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class PhotoSchema(BaseSchema):
    id_photo: int
    file_path: str

class TagSchema(BaseSchema):
    tag_id: int
    name: str

class BuildingSchema(BaseSchema):
    building_id: int
    name: str
    address: str

class RoomShortResponse(BaseSchema):
    """Для списка в ChooseRoom.jsx"""
    id_room: int
    room_number: int
    capacity: int
    id_building: int
    preview_photo: Optional[str] = None
    building: Optional[BuildingSchema] = None
    tags: List[TagSchema] = []

class RoomDetailResponse(BaseSchema):
    """Для детальной карточки RoomDetails.jsx"""
    id_room: int
    room_number: int
    capacity: int
    description: str
    building: BuildingSchema
    tags: List[TagSchema]
    photos: List[PhotoSchema]

class RoomShortInfo(BaseModel):
    id_room: int
    room_number: int
    capacity: int

class BookingStatusSchema(BaseModel):
    id_status: int
    name: str

    class Config:
        from_attributes = True

class BookingShortResponse(BaseSchema):
    book_id: int
    room_id: int
    slot_date_backup: date
    start_time_backup: time
    num_of_people: int

    room: RoomShortResponse | None = None
    status_rel: BookingStatusSchema | None = None

class BookingDetailResponse(BaseModel):
    book_id: int
    user_id: int
    room_id: int
    num_of_people: int
    slot_date_backup: date
    start_time_backup: time
    duration: timedelta | None = None

    room: RoomShortResponse | None = None
    status_rel: BookingStatusSchema | None = None

    class Config:
        from_attributes = True

class BookingStateRequest(BaseModel):
    room_id: Optional[int] = None
    booking_date: Optional[date] = None
    start_time: Optional[time] = None
    people_count: Optional[int] = 1
    duration_minutes: Optional[int] = 30

class BookingCreateRequest(BaseModel):
    user_id: int
    room_id: int
    booking_date: date
    start_time: time
    people_count: int
    duration_minutes: int

class BookingUpdateRequest(BaseModel):
    room_id: Optional[int] = None
    booking_date: Optional[date] = None
    start_time: Optional[time] = None
    people_count: Optional[int] = None
    duration_minutes: Optional[int] = None

class AvailableOptionsResponse(BaseModel):
    available_rooms: List[int]
    available_dates: List[date]
    available_slots: List[time]
    max_capacity_found: int
    max_duration_minutes: int = 180

class UserSchema(BaseSchema):
    id_user: int
    login: Optional[str] = None
    name: Optional[str] = None
    surname: Optional[str] = None
    tg_id: Optional[str] = None
    administrator: bool
    banned: bool


class UserShortSchema(BaseSchema):
    """Краткая информация о пользователе для админ-панели"""
    id_user: int
    name: str
    surname: str
    login: str


class AdminBookingResponse(BaseSchema):
    """Бронь с информацией о пользователе для админ-панели"""
    book_id: int
    user_id: int
    room_id: int
    num_of_people: int
    slot_date_backup: date
    start_time_backup: time
    duration: timedelta | None = None

    user: UserShortSchema | None = None
    room: RoomShortResponse | None = None
    status_rel: BookingStatusSchema | None = None