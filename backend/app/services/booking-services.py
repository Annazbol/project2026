import random
from datetime import datetime, date, time, timedelta
from typing import Optional, List, Set

from sqlalchemy import select, and_, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.models import Room, Building, TagRoom, Booking, TimeSlot, Notification

async def search_best_room(
        session: AsyncSession,
        num_of_people: int,
        building_id: Optional[int] = None,
        tag_ids: Optional[List[int]] = None,
        slot_date: Optional[date] = None,
        start_time: Optional[time] = None,
        exclude_room_ids: Optional[Set[int]] = None
) -> Optional[Room]:
    query = select(Room).options(selectinload(Room.building)).where(Room.capacity >= num_of_people)

    if slot_date and start_time:
        query = query.join(TimeSlot).where(
            and_(
                TimeSlot.slot_date == slot_date,
                TimeSlot.start_time == start_time,
                (TimeSlot.number_of_people + num_of_people) <= Room.capacity
            )
        )

    if building_id:
        query = query.where(Room.id_building == building_id)
    if tag_ids:
        query = query.join(Room.tag_rooms).where(TagRoom.tag.in_(tag_ids))
    if exclude_room_ids:
        query = query.where(Room.id_room.not_in(exclude_room_ids))

    query = query.order_by(Room.capacity.asc())

    result = await session.execute(query)
    return result.scalars().first()

async def get_available_dates_dynamic(
        session: AsyncSession,
        room_id: int,
        num_of_people: int
) -> List[date]:
    query = (
        select(TimeSlot.slot_date)
        .join(Room, Room.id_room == TimeSlot.id_room)
        .distinct()
        .where(and_(
            TimeSlot.id_room == room_id,
            (TimeSlot.number_of_people + num_of_people) <= Room.capacity
        ))
        .order_by(TimeSlot.slot_date)
    )
    result = await session.execute(query)
    return result.scalars().all()


async def get_available_times_dynamic(
        session: AsyncSession,
        room_id: int,
        selected_date: date,
        num_of_people: int
) -> List[time]:
    query = (
        select(TimeSlot.start_time)
        .join(Room, Room.id_room == TimeSlot.id_room)
        .where(and_(
            TimeSlot.id_room == room_id,
            TimeSlot.slot_date == selected_date,
            (TimeSlot.number_of_people + num_of_people) <= Room.capacity
        ))
        .order_by(TimeSlot.start_time)
    )
    result = await session.execute(query)
    return result.scalars().all()

async def booking(
        session: AsyncSession,
        user_id: int,
        num_of_people: Optional[int] = None,
        room_id: Optional[int] = None,
        slot_date: Optional[date] = None,
        start_time: Optional[time] = None,
        duration: Optional[time] = None
) -> Booking:

    final_num = num_of_people or 1

    if not room_id:
        room_stmt = select(Room.id_room).join(TimeSlot).where(
            (TimeSlot.number_of_people + final_num) <= Room.capacity
        ).distinct()
        rooms = (await session.execute(room_stmt)).scalars().all()
        if not rooms:
            raise ValueError("Нет доступных комнат с подходящей вместимостью")
        room_id = random.choice(rooms)

    if not slot_date:
        avail_dates = await get_available_dates_dynamic(session, room_id, final_num)
        if not avail_dates:
            raise ValueError("В выбранной комнате нет доступных дат")
        slot_date = avail_dates[0]

    if not start_time:
        avail_times = await get_available_times_dynamic(session, room_id, slot_date, final_num)
        if not avail_times:
            raise ValueError("На выбранную дату мест нет")
        start_time = avail_times[0]

    final_duration = duration or time(0, 15)

    slot_id_stmt = select(TimeSlot.id_slot).where(and_(
        TimeSlot.id_room == room_id,
        TimeSlot.slot_date == slot_date,
        TimeSlot.start_time == start_time
    ))
    slot_id = (await session.execute(slot_id_stmt)).scalar_one_or_none()

    new_booking = Booking(
        user_id=user_id,
        room_id=room_id,
        id_slot=slot_id,
        slot_date_backup=slot_date,
        start_time_backup=start_time,
        duration=final_duration,
        num_of_people=final_num,
        status=1
    )

    session.add(new_booking)
    await session.flush()

    notif = Notification(
        id_user=user_id,
        id_book=new_booking.book_id,
        title="Успех",
        message=f"Забронировано: комната {room_id}, дата {slot_date}, время {start_time}."
    )
    session.add(notif)

    await session.commit()
    await session.refresh(new_booking)
    return new_booking