import random
from datetime import datetime, date, time, timedelta
from typing import Optional, List, Set

from sqlalchemy import select, and_, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from db.models import Room, Building, TagRoom, Booking, TimeSlot, Notification

# localization убран

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
            raise ValueError("Подходящая комната не найдена")
        room_id = random.choice(rooms)

    if not slot_date:
        date_stmt = (
            select(TimeSlot.slot_date)
            .join(Room, Room.id_room == TimeSlot.id_room)
            .where(
                and_(
                    TimeSlot.id_room == room_id,
                    (TimeSlot.number_of_people + final_num) <= Room.capacity
                )
            )
            .order_by(TimeSlot.slot_date.asc())
            .limit(1)
        )

        slot_date = (await session.execute(date_stmt)).scalar_one_or_none()

        if not slot_date:
            raise ValueError("Нет доступных дат для бронирования")

    if not start_time:
        time_stmt = (
            select(TimeSlot.start_time)
            .join(Room, Room.id_room == TimeSlot.id_room)
            .where(
                and_(
                    TimeSlot.id_room == room_id,
                    TimeSlot.slot_date == slot_date,
                    (TimeSlot.number_of_people + final_num) <= Room.capacity
                )
            )
            .order_by(TimeSlot.start_time.asc())
            .limit(1)
        )

        start_time = (await session.execute(time_stmt)).scalar_one_or_none()

        if not start_time:
            raise ValueError("Конфликт времени: выбранный слот занят")

    if duration is None:
        final_duration = timedelta(minutes=15)
    else:
        final_duration = timedelta(hours=duration.hour, minutes=duration.minute)

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
        title="Бронирование создано",
        message="Ваше бронирование успешно оформлено!"
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


async def update_booking(
        session: AsyncSession,
        book_id: int,
        user_id: int,
        room_id: Optional[int] = None,
        booking_date: Optional[date] = None,
        start_time: Optional[time] = None,
        people_count: Optional[int] = None,
        duration_minutes: Optional[int] = None
) -> Booking:
    booking_obj = await get_booking_by_id(session, book_id)
    if not booking_obj:
        raise ValueError("Бронирование не найдено")

    if booking_obj.user_id != user_id:
        raise ValueError("У вас нет прав для редактирования этой брони")

    if booking_obj.status in [2, 3, 7]:
        raise ValueError("Нельзя редактировать отмененное или завершенное бронирование")

    if room_id is not None:
        booking_obj.room_id = room_id
    if booking_date is not None:
        booking_obj.slot_date_backup = booking_date
    if start_time is not None:
        booking_obj.start_time_backup = start_time
    if people_count is not None:
        booking_obj.num_of_people = people_count
    if duration_minutes is not None:
        # Учитываем переход на INTERVAL, если вы его сделали:
        booking_obj.duration = timedelta(minutes=duration_minutes)

    try:
        await session.commit()
        await session.refresh(booking_obj)
        return booking_obj
    except Exception as e:
        await session.rollback()
        raise ValueError(f"Ошибка при обновлении: {str(e)}")


async def cancel_booking(
    session: AsyncSession,
    book_id: int,
    user_id: int,
    lang: str = "ru",
) -> Booking:
    booking_obj = await get_booking_by_id(session, book_id)
    if not booking_obj:
        raise ValueError("Бронирование не найдено")

    if booking_obj.user_id != user_id:
        raise ValueError("Доступ запрещен")

    # Проверка статуса (можно ли отменить)
    if booking_obj.status in (6, 7, 8):
        raise ValueError("Это бронирование уже отменено или не может быть отменено")

    booking_obj.status = 7

    notif = Notification(
        id_user=user_id,
        id_book=booking_obj.book_id,
        title="Отмена бронирования",
        message="Ваше бронирование успешно отменено"
    )
    session.add(notif)

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
        raise ValueError("Бронирование не найдено")

    booking_obj.status = 7

    message = f"Администратор отклонил вашу заявку на бронирование №{book_id}."
    if reason:
        message += f"\nПричина: {reason}"

    notif = Notification(
        id_user=booking_obj.user_id,
        id_book=booking_obj.book_id,
        title="Бронирование отклонено",
        message=message
    )
    session.add(notif)

    await session.commit()
    await session.refresh(booking_obj)
    return booking_obj


async def confirm_booking_by_admin(
    session: AsyncSession,
    book_id: int,
    lang: str = "ru"
) -> Booking:
    booking_obj = await get_booking_by_id(session, book_id)
    if not booking_obj:
        raise ValueError("Бронирование не найдено")

    if booking_obj.status != 0:
        raise ValueError("Это бронирование нельзя подтвердить")

    booking_obj.status = 1

    notif = Notification(
        id_user=booking_obj.user_id,
        id_book=booking_obj.book_id,
        title="✅ Бронирование подтверждено",
        message=f"Администратор подтвердил вашу заявку на комнату №{booking_obj.room_id}."
    )
    session.add(notif)

    await session.commit()
    await session.refresh(booking_obj)
    return booking_obj