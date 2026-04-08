import random
from datetime import datetime, date, time, timedelta
from typing import Optional, List, Set

from sqlalchemy import select, and_, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models import Room, Building, TagRoom, Booking, TimeSlot, Notification
from .localization import t


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
        lang: str = "ru",
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
            raise ValueError(t("errors.room_not_found", lang))
        room_id = random.choice(rooms)

    if not slot_date:
        avail_dates = await get_available_dates_dynamic(session, room_id, final_num)
        if not avail_dates:
            raise ValueError(t("errors.booking_not_found", lang))
        slot_date = avail_dates[0]

    if not start_time:
        avail_times = await get_available_times_dynamic(session, room_id, slot_date, final_num)
        if not avail_times:
            raise ValueError(t("errors.time_conflict", lang))
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
        title=t("notifications.booking_success", lang),
        message=t("notifications.booking_success", lang),
    )
    session.add(notif)

    await session.commit()
    await session.refresh(new_booking)
    return new_booking


async def get_booking_by_id(session: AsyncSession, book_id: int) -> Optional[Booking]:
    result = await session.execute(select(Booking).where(Booking.book_id == book_id))
    return result.scalar_one_or_none()


async def get_slot(
    session: AsyncSession,
    room_id: int,
    slot_date: date,
    start_time: time,
) -> Optional[TimeSlot]:
    result = await session.execute(
        select(TimeSlot).where(
            and_(
                TimeSlot.id_room == room_id,
                TimeSlot.slot_date == slot_date,
                TimeSlot.start_time == start_time,
            )
        )
    )
    return result.scalar_one_or_none()


async def get_available_dates_for_edit(
    session: AsyncSession,
    room_id: int,
    num_of_people: int,
    exclude_book_id: int,
) -> List[date]:
    result = await session.execute(
        select(TimeSlot.slot_date)
        .join(Room, Room.id_room == TimeSlot.id_room)
        .distinct()
        .where(
            and_(
                TimeSlot.id_room == room_id,
                (TimeSlot.number_of_people + num_of_people) <= Room.capacity,
            )
        )
        .order_by(TimeSlot.slot_date)
    )
    return result.scalars().all()


async def get_available_times_for_edit(
    session: AsyncSession,
    room_id: int,
    slot_date: date,
    num_of_people: int,
    exclude_book_id: int,
) -> List[time]:
    result = await session.execute(
        select(TimeSlot.start_time)
        .join(Room, Room.id_room == TimeSlot.id_room)
        .where(
            and_(
                TimeSlot.id_room == room_id,
                TimeSlot.slot_date == slot_date,
                (TimeSlot.number_of_people + num_of_people) <= Room.capacity,
            )
        )
        .order_by(TimeSlot.start_time)
    )
    return result.scalars().all()


def _is_editable(booking: Booking) -> bool:
    return booking.status in (1, 2)


def _is_cancellable(booking: Booking) -> bool:
    return booking.status not in (6, 7, 8)


async def _send_notification(
    session: AsyncSession,
    user_id: int,
    book_id: int,
    title: str,
    message: str,
) -> None:
    notif = Notification(
        id_user=user_id,
        id_book=book_id,
        title=title,
        message=message,
    )
    session.add(notif)


async def update_booking(
    session: AsyncSession,
    book_id: int,
    lang: str = "ru",
    new_date: Optional[date] = None,
    new_start_time: Optional[time] = None,
    new_duration: Optional[time] = None,
    new_num_of_people: Optional[int] = None,
    new_room_id: Optional[int] = None,
) -> Booking:
    booking_obj = await get_booking_by_id(session, book_id)
    if not booking_obj:
        raise ValueError(t("errors.booking_not_found", lang))

    if not _is_editable(booking_obj):
        raise ValueError(t("errors.booking_not_found", lang))

    target_room_id = new_room_id or booking_obj.room_id
    target_duration = new_duration or booking_obj.duration
    target_num = new_num_of_people or booking_obj.num_of_people

    current_date = booking_obj.slot_date_backup
    current_time = booking_obj.start_time_backup
    if booking_obj.id_slot:
        slot = await session.get(TimeSlot, booking_obj.id_slot)
        if slot:
            current_date = slot.slot_date
            current_time = slot.start_time

    target_date = new_date or current_date
    target_time = new_start_time or current_time

    duration_td = timedelta(hours=target_duration.hour, minutes=target_duration.minute)
    if duration_td > timedelta(hours=3):
        raise ValueError(t("errors.duration_too_long", lang))

    room = await session.get(Room, target_room_id)
    if not room:
        raise ValueError(t("errors.room_not_found", lang))
    if room.capacity < target_num:
        raise ValueError(
            t("errors.capacity_exceeded", lang, capacity=room.capacity, requested=target_num)
        )

    new_slot = await get_slot(session, target_room_id, target_date, target_time)
    if not new_slot:
        raise ValueError(t("errors.booking_not_found", lang))

    end_time = (datetime.combine(target_date, target_time) + duration_td).time()
    conflict_result = await session.execute(
        select(Booking).join(
            TimeSlot, Booking.id_slot == TimeSlot.id_slot, isouter=True
        ).where(
            and_(
                Booking.room_id == target_room_id,
                Booking.book_id != book_id,
                Booking.status.in_([1, 2, 3, 4, 5]),
                or_(
                    and_(
                        TimeSlot.slot_date == target_date,
                        TimeSlot.start_time < end_time,
                    ),
                    and_(
                        Booking.id_slot.is_(None),
                        Booking.slot_date_backup == target_date,
                        Booking.start_time_backup < end_time,
                    ),
                ),
            )
        )
    )
    if conflict_result.scalar_one_or_none():
        raise ValueError(t("errors.time_conflict", lang))

    booking_obj.room_id = target_room_id
    booking_obj.id_slot = new_slot.id_slot
    booking_obj.slot_date_backup = target_date
    booking_obj.start_time_backup = target_time
    booking_obj.duration = target_duration
    booking_obj.num_of_people = target_num
    booking_obj.status = 1

    await _send_notification(
        session,
        user_id=booking_obj.user_id,
        book_id=booking_obj.book_id,
        title=t("common.booking", lang),
        message=t("notifications.booking_confirmed", lang),
    )

    await session.commit()
    await session.refresh(booking_obj)
    return booking_obj


async def cancel_booking(
    session: AsyncSession,
    book_id: int,
    user_id: int,
    lang: str = "ru",
) -> Booking:
    booking_obj = await get_booking_by_id(session, book_id)
    if not booking_obj:
        raise ValueError(t("errors.booking_not_found", lang))

    if booking_obj.user_id != user_id:
        raise ValueError(t("errors.no_access", lang))

    if not _is_cancellable(booking_obj):
        raise ValueError(t("errors.booking_not_found", lang))

    booking_obj.status = 7

    await _send_notification(
        session,
        user_id=booking_obj.user_id,
        book_id=booking_obj.book_id,
        title=t("my_bookings.cancel_modal_title", lang),
        message=t("notifications.cancel_success", lang),
    )

    await session.commit()
    await session.refresh(booking_obj)
    return booking_obj


async def cancel_booking_by_admin(
    session: AsyncSession,
    book_id: int,
    lang: str = "ru",
    reason: str = "",
) -> Booking:
    booking_obj = await get_booking_by_id(session, book_id)
    if not booking_obj:
        raise ValueError(t("errors.booking_not_found", lang))

    if not _is_cancellable(booking_obj):
        raise ValueError(t("errors.booking_not_found", lang))

    booking_obj.status = 7

    title = t("admin.reject_booking_title", lang)
    message = t("admin.reject_booking_message", lang, id=book_id, name="")
    if reason:
        message += f"\n{reason}"

    await _send_notification(
        session,
        user_id=booking_obj.user_id,
        book_id=booking_obj.book_id,
        title=title,
        message=message,
    )

    await session.commit()
    await session.refresh(booking_obj)
    return booking_obj
