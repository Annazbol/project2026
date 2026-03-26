import asyncio
from datetime import date, time, datetime, timedelta
from typing import List, Optional, Dict, Any
import random

class RoomMock:
    def __init__(self, id_room: int, id_building: int, room_number: int, capacity: int, tags: List[str]):
        self.id_room = id_room
        self.id_building = id_building
        self.room_number = room_number
        self.capacity = capacity
        self.tags = tags

class BookingMock:
    def __init__(self, book_id: int, user_id: int, room_id: int, slot_date: date, start_time: time, duration: timedelta, num_of_people: int):
        self.book_id = book_id
        self.user_id = user_id
        self.room_id = room_id
        self.slot_date = slot_date
        self.start_time = start_time
        self.duration = duration
        self.num_of_people = num_of_people
        self.status = 1

fake_rooms = [
    RoomMock(1, 1, 204, 10, ["проектор", "тихая зона"]),
    RoomMock(2, 1, 205, 4, ["маркерная доска"]),
    RoomMock(3, 2, 101, 20, ["лекционная", "проектор"]),
]
fake_bookings = []


async def search_best_room(
        id_building: Optional[int] = None,
        tags: Optional[List[str]] = None,
        min_capacity: Optional[int] = None,
        room_number: Optional[int] = None
) -> Optional[RoomMock]:
    await asyncio.sleep(0.1)

    best_match = None
    max_score = -1

    for room in fake_rooms:
        score = 0
        if id_building and room.id_building != id_building: continue
        if min_capacity and room.capacity < min_capacity: continue
        if room_number and room.room_number != room_number: continue

        if tags:
            match_tags = set(tags).intersection(set(room.tags))
            score += len(match_tags)

        if score > max_score:
            max_score = score
            best_match = room

    return best_match


async def check_intersection(room_id: int, target_date: date, target_start: time, target_duration: timedelta) -> bool:

    await asyncio.sleep(0.1)

    target_start_dt = datetime.combine(target_date, target_start)
    target_end_dt = target_start_dt + target_duration

    for b in fake_bookings:
        if b.room_id != room_id:
            continue

        b_start_dt = datetime.combine(b.slot_date, b.start_time)
        b_end_dt = b_start_dt + b.duration

        if max(target_start_dt, b_start_dt) < min(target_end_dt, b_end_dt):
            return True

    return False


async def autofill_booking_params(params: Dict[str, Any]) -> Dict[str, Any]:

    if not params.get("num_of_people"):
        params["num_of_people"] = 1
    if not params.get("duration"):
        params["duration"] = timedelta(hours=1)

    if not params.get("slot_date") or not params.get("start_time"):
        params["slot_date"] = date.today() + timedelta(days=1)
        params["start_time"] = time(10, 0)

    if not params.get("room_id"):
        available_rooms = []
        for room in fake_rooms:
            is_intersect = await check_intersection(
                room.id_room,
                params["slot_date"],
                params["start_time"],
                params["duration"]
            )
            if not is_intersect:
                available_rooms.append(room.id_room)

        if available_rooms:
            params["room_id"] = random.choice(available_rooms)
        else:
            raise ValueError("Нет свободных комнат на это время")

    return params


async def create_booking(user_id: int, raw_params: Dict[str, Any]) -> BookingMock:

    filled_params = await autofill_booking_params(raw_params)

    room_id = filled_params["room_id"]
    slot_date = filled_params["slot_date"]
    start_time = filled_params["start_time"]
    duration = filled_params["duration"]
    num_of_people = filled_params["num_of_people"]

    is_intersect = await check_intersection(room_id, slot_date, start_time, duration)
    if is_intersect:
        raise ValueError("Выбранное время уже занято другой бронью. Пожалуйста, выберите другое время.")

    room = next((r for r in fake_rooms if r.id_room == room_id), None)
    if room and num_of_people > room.capacity:
        raise ValueError(f"Количество людей ({num_of_people}) превышает вместимость комнаты ({room.capacity}).")

    new_book_id = len(fake_bookings) + 1
    new_booking = BookingMock(
        book_id=new_book_id,
        user_id=user_id,
        room_id=room_id,
        slot_date=slot_date,
        start_time=start_time,
        duration=duration,
        num_of_people=num_of_people
    )

    fake_bookings.append(new_booking)
    print(f"Успех! Бронь №{new_book_id} создана в комнате {room_id} на {slot_date} {start_time}.")

    return new_booking


async def test_run():
    best_room = await search_best_room(tags=["проектор"])
    print(f"Найдена комната: {best_room.room_number}")

    try:
        booking = await create_booking(user_id=101, raw_params={})
    except ValueError as e:
        print(f"Ошибка: {e}")