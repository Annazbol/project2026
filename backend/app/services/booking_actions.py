from datetime import date, time, datetime, timedelta
from typing import Optional

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.models import Booking, Room, TimeSlot, Notification


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
) -> list[date]:
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
) -> list[time]:
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
    new_date: Optional[date] = None,
    new_start_time: Optional[time] = None,
    new_duration: Optional[time] = None,
    new_num_of_people: Optional[int] = None,
    new_room_id: Optional[int] = None,
) -> Booking:
    booking = await get_booking_by_id(session, book_id)
    if not booking:
        raise ValueError("Бронирование не найдено")

    if not _is_editable(booking):
        raise ValueError(f"Бронирование нельзя изменить (текущий статус: {booking.status})")

    target_room_id = new_room_id or booking.room_id
    target_duration = new_duration or booking.duration
    target_num = new_num_of_people or booking.num_of_people

    current_date = booking.slot_date_backup
    current_time = booking.start_time_backup
    if booking.id_slot:
        slot = await session.get(TimeSlot, booking.id_slot)
        if slot:
            current_date = slot.slot_date
            current_time = slot.start_time

    target_date = new_date or current_date
    target_time = new_start_time or current_time

    duration_td = timedelta(hours=target_duration.hour, minutes=target_duration.minute)
    if duration_td > timedelta(hours=3):
        raise ValueError("Длительность не может превышать 3 часа")

    room = await session.get(Room, target_room_id)
    if not room:
        raise ValueError("Комната не найдена")
    if room.capacity < target_num:
        raise ValueError(
            f"Комната вмещает максимум {room.capacity} человек, запрошено {target_num}"
        )

    new_slot = await get_slot(session, target_room_id, target_date, target_time)
    if not new_slot:
        raise ValueError(
            f"Слот на {target_date} {target_time} в комнате {target_room_id} не найден"
        )

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
        raise ValueError("Выбранное время уже занято другим бронированием")

    booking.room_id = target_room_id
    booking.id_slot = new_slot.id_slot
    booking.slot_date_backup = target_date
    booking.start_time_backup = target_time
    booking.duration = target_duration
    booking.num_of_people = target_num
    booking.status = 1

    await _send_notification(
        session,
        user_id=booking.user_id,
        book_id=booking.book_id,
        title="Бронирование изменено",
        message=(
            f"Бронирование #{book_id} изменено.\n"
            f"Комната: {room.room_number}, дата: {target_date}, "
            f"время: {target_time}, длительность: {target_duration}, "
            f"кол-во человек: {target_num}.\n"
            f"Ожидайте подтверждения администратором."
        ),
    )

    await session.commit()
    await session.refresh(booking)
    return booking


async def cancel_booking(
    session: AsyncSession,
    book_id: int,
    user_id: int,
) -> Booking:
    booking = await get_booking_by_id(session, book_id)
    if not booking:
        raise ValueError("Бронирование не найдено")

    if booking.user_id != user_id:
        raise ValueError("Нет доступа к этому бронированию")

    if not _is_cancellable(booking):
        raise ValueError(f"Бронирование нельзя отменить (текущий статус: {booking.status})")

    booking.status = 7

    await _send_notification(
        session,
        user_id=booking.user_id,
        book_id=booking.book_id,
        title="Бронирование отменено",
        message=f"Ваше бронирование #{book_id} отменено.",
    )

    await session.commit()
    await session.refresh(booking)
    return booking


async def cancel_booking_by_admin(
    session: AsyncSession,
    book_id: int,
    reason: str = "",
) -> Booking:
    booking = await get_booking_by_id(session, book_id)
    if not booking:
        raise ValueError("Бронирование не найдено")

    if not _is_cancellable(booking):
        raise ValueError(f"Бронирование нельзя отменить (текущий статус: {booking.status})")

    booking.status = 7

    message = f"Ваше бронирование #{book_id} отменено администратором."
    if reason:
        message += f"\nПричина: {reason}"

    await _send_notification(
        session,
        user_id=booking.user_id,
        book_id=booking.book_id,
        title="Бронирование отменено администратором",
        message=message,
    )

    await session.commit()
    await session.refresh(booking)
    return booking