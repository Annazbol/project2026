from pydantic import BaseModel
from datetime import date, time
from typing import Optional, List, Dict, Any

class RoomResponse(BaseModel):
    id_room: int
    room_number: int
    capacity: int
    description: str

    class Config:
        from_attributes = True

class TimeSlotRequest(BaseModel):
    room_id: int
    slot_date: date
    num_of_people: int

class PeopleCountResponse(BaseModel):
    success: bool
    available_counts: List[int]
    warning: Optional[str] = None
    error: Optional[str] = None

class TimeSlotItem(BaseModel):
    time: str
    start: str
    end: str
    is_available: bool

class TimeSlotResponse(BaseModel):
    success: bool
    time_slots: List[TimeSlotItem] = []
    info_message: Optional[str] = None
    warning: Optional[str] = None
    error: Optional[str] = None

class CreateBookingRequest(BaseModel):
    user_id: str
    room_id: int
    slot_date: date
    start_time: time
    num_of_people: int
    duration_minutes: int