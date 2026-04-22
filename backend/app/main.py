from fastapi import FastAPI, Depends, Header, HTTPException, status, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func, case, delete
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import timedelta, datetime

from db.database import get_db, SessionLocal
from db.models import Room, TimeSlot, Booking, User, TagRoom, Building, Tag
import services.bookingServices as bookingServices
from schemas import schemas
import asyncio

async def periodic_db_tasks():
    while True:
        try:
            now = datetime.now()
            next_run = (now + timedelta(minutes=15)).replace(
                second=0, microsecond=0, minute=(now.minute // 15 + 1) * 15 % 60
            )
            sleep_sec = (next_run - now).total_seconds()
            await asyncio.sleep(sleep_sec)

            async with SessionLocal() as session:
                await session.execute(text("SELECT refresh_time_slots()"))
                await session.execute(text("SELECT update_booking_statuses()"))
                await session.commit()
            print(f"DB tasks refreshed at {datetime.now().strftime('%H:%M:%S')}")

        except Exception as e:
            print("Error:", e)
            await asyncio.sleep(60)

app = FastAPI(title="VyatGU Coworking API")

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(periodic_db_tasks())

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/rooms/{room_id}")
async def get_room_details(room_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Room)
        .options(
            selectinload(Room.building),
            selectinload(Room.photos),
            selectinload(Room.tag_rooms).joinedload(TagRoom.tag_rel)
        )
        .where(Room.id_room == room_id)
    )

    room = result.scalar_one_or_none()

    if not room:
        raise HTTPException(404, "Room not found")

    return {
        "id_room": room.id_room,
        "room_number": room.room_number,
        "capacity": room.capacity,
        "description": room.description,
        "building": room.building,
        "photos": room.photos,
        "tags": [
            {
                "tag_id": tr.tag_rel.tag_id,
                "name": tr.tag_rel.name
            }
            for tr in room.tag_rooms
            if tr.tag_rel
        ]
    }
@app.get("/api/rooms")
async def get_rooms(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Room).options(
            selectinload(Room.photos),
            selectinload(Room.building),
            selectinload(Room.tag_rooms).joinedload(TagRoom.tag_rel)
        )
    )

    rooms = result.scalars().all()

    return [
        {
            "id_room": room.id_room,
            "room_number": room.room_number,
            "capacity": room.capacity,
            "id_building": room.id_building,
            "building": {
                "building_id": room.building.building_id,
                "name": room.building.name,
                "address": room.building.address
            } if room.building else None,
            "preview_photo": room.photos[0].file_path if room.photos else None,
            # 🆕 Собираем названия тегов в простой список ['Wi-Fi', 'Проектор']
            "tags": [tr.tag_rel.name for tr in room.tag_rooms if tr.tag_rel]
        }
        for room in rooms
    ]

@app.get("/api/buildings", response_model=List[schemas.BuildingSchema])
async def get_all_buildings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Building).order_by(Building.name))
    return result.scalars().all()

@app.get("/api/tags", response_model=List[schemas.TagSchema])
async def get_all_tags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tag).order_by(Tag.name))
    return result.scalars().all()


async def check_user_not_banned(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id_user == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user.banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ваш аккаунт заблокирован. Обратитесь к администратору."
        )
    return user

@app.get("/api/users/me", response_model=schemas.UserSchema)
async def get_current_user(tg_id: int, db: AsyncSession = Depends(get_db)):
    """Получает данные пользователя по его Telegram ID"""
    result = await db.execute(
        select(User).where(User.tg_id == str(tg_id))  # str(), т.к. в БД строка
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Пользователь не найден. Сначала авторизуйтесь через бот."
        )

    if user.banned:
        raise HTTPException(
            status_code=403,
            detail="Ваш аккаунт заблокирован. Обратитесь к администратору."
        )

    return user


@app.get("/api/bookings/user/{tg_id}", response_model=List[schemas.BookingShortResponse])
async def get_user_bookings(tg_id: int, db: AsyncSession = Depends(get_db)):
    # Сначала находим пользователя по tg_id
    user_result = await db.execute(
        select(User).where(User.tg_id == str(tg_id))
    )
    user = user_result.scalar_one_or_none()

    if not user:
        return []  # Если не авторизован — пустой список

    status_priority = case(
        (Booking.status == 3, 1),
        (Booking.status == 1, 2),
        (Booking.status == 4, 3),
        (Booking.status == 5, 4),
        (Booking.status == 2, 5),
        (Booking.status == 8, 6),
        (Booking.status == 6, 7),
        (Booking.status == 7, 8),
        else_=99
    )

    query = (
        select(Booking)
        .options(
            selectinload(Booking.room).selectinload(Room.building),
            selectinload(Booking.room).selectinload(Room.photos),
            selectinload(Booking.status_rel),
        )
        .where(Booking.user_id == user.id_user)  # Используем внутренний ID
        .order_by(status_priority.asc(), Booking.slot_date_backup.desc())
    )

    result = await db.execute(query)
    return result.scalars().all()

@app.get("/api/bookings/{book_id}", response_model=schemas.BookingDetailResponse)
async def get_booking_details(book_id: int, db: AsyncSession = Depends(get_db)):
    query = (
        select(Booking)
        .options(
            selectinload(Booking.room).selectinload(Room.building),
            selectinload(Booking.room).selectinload(Room.photos),
            selectinload(Booking.status_rel),
        )
        .where(Booking.book_id == book_id)
    )
    result = await db.execute(query)
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")

    return booking

@app.post("/api/bookings/{book_id}/cancel")
async def cancel_booking_endpoint(
        book_id: int,
        tg_id: int,
        db: AsyncSession = Depends(get_db)
):
    # 1. Находим пользователя по tg_id
    user_result = await db.execute(
        select(User).where(User.tg_id == str(tg_id))
    )
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user.banned:
        raise HTTPException(status_code=403, detail="Аккаунт заблокирован")

    # 2. Вызываем сервис отмены, передавая ВНУТРЕННИЙ id пользователя
    try:
        cancelled_booking = await bookingServices.cancel_booking(
            session=db,
            book_id=book_id,
            user_id=user.id_user  # Внутренний ID, а не tg_id!
        )
        return {
            "success": True,
            "new_status": cancelled_booking.status,
            "book_id": cancelled_booking.book_id
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/users/me", response_model=schemas.UserSchema)
async def get_current_user(tg_id: int, db: AsyncSession = Depends(get_db)):
    """Получает данные пользователя по его Telegram ID"""
    result = await db.execute(
        select(User).where(User.tg_id == str(tg_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Пользователь не найден. Сначала авторизуйтесь через бот."
        )

    if user.banned:
        raise HTTPException(
            status_code=403,
            detail="Ваш аккаунт заблокирован. Обратитесь к администратору."
        )

    return user


@app.post("/api/admin/rooms/add")
async def admin_add_room(
        tg_id: int,
        room_number: int,
        building_id: int,
        capacity: int,
        description: str,
        tag_ids: List[int] = Body(...),  # Список ID тегов из тела запроса
        db: AsyncSession = Depends(get_db)
):
    await check_user_is_admin(tg_id, db)

    # 1. Создаем комнату
    new_room = Room(
        id_building=building_id,
        room_number=room_number,
        capacity=capacity,
        description=description
    )
    db.add(new_room)
    await db.flush()  # Получаем id_room

    # 2. Привязываем теги
    for t_id in tag_ids:
        tr = TagRoom(room=new_room.id_room, tag=t_id)
        db.add(tr)

    await db.commit()
    return {"success": True, "id_room": new_room.id_room}


@app.patch("/api/admin/rooms/{room_id}")
async def admin_update_room(
        room_id: int,
        tg_id: int,
        room_number: int,
        building_id: int,
        capacity: int,
        description: str,
        tag_ids: List[int] = Body(...),
        db: AsyncSession = Depends(get_db)
):
    await check_user_is_admin(tg_id, db)

    result = await db.execute(select(Room).where(Room.id_room == room_id))
    room = result.scalar_one_or_none()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Обновляем поля
    room.room_number = room_number
    room.id_building = building_id
    room.capacity = capacity
    room.description = description

    # Обновляем теги (удаляем старые, пишем новые)
    await db.execute(delete(TagRoom).where(TagRoom.room == room_id))
    for t_id in tag_ids:
        db.add(TagRoom(room=room_id, tag=t_id))

    await db.commit()
    return {"success": True}

@app.delete ("/api/admin/rooms/{room_id}")
async def admin_delete_room(
        room_id: int,
        tg_id: int,
        db: AsyncSession = Depends(get_db)
):
    # проверка админа
    await check_user_is_admin(tg_id, db)

    # ищем комнату
    result = await db.execute(
        select(Room).where(Room.id_room == room_id)
    )
    room = result.scalar_one_or_none()

    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # 1. удаляем связи many-to-many (теги)
    await db.execute(
        delete(TagRoom).where(TagRoom.room == room_id)
    )

    # 2. удаляем саму комнату
    await db.delete(room)

    await db.commit()

    return {"success": True, "deleted_room_id": room_id}

@app.post("/api/booking/check-options", response_model=schemas.AvailableOptionsResponse)
async def check_booking_options(
        state: schemas.BookingStateRequest,
        db: AsyncSession = Depends(get_db)
):
    # Базовые условия, которые будут применяться ко всем подзапросам
    def apply_filters(q, *, use_people=True, use_room=True, use_date=True):
        if use_people and state.people_count:
            q = q.where(
                (func.coalesce(TimeSlot.number_of_people, 0) + state.people_count) <= Room.capacity
            )
        if use_room and state.room_id:
            q = q.where(TimeSlot.id_room == state.room_id)
        if use_date and state.booking_date:
            q = q.where(TimeSlot.slot_date == state.booking_date)
        return q

    # 1. Уникальные ID комнат
    rooms_query = (
        select(Room.id_room, Room.capacity)
        .join(TimeSlot, TimeSlot.id_room == Room.id_room)
        .distinct()
    )
    rooms_query = apply_filters(rooms_query)

    # 2. Уникальные даты (без фильтрации по дате — ведь мы выбираем доступные даты)
    dates_query = (
        select(TimeSlot.slot_date)
        .join(Room, TimeSlot.id_room == Room.id_room)
        .distinct()
        .order_by(TimeSlot.slot_date)
    )
    dates_query = apply_filters(dates_query, use_date=False)

    # 3. Уникальные времена начала
    times_query = (
        select(TimeSlot.start_time)
        .join(Room, TimeSlot.id_room == Room.id_room)
        .distinct()
        .order_by(TimeSlot.start_time)
    )
    times_query = apply_filters(times_query)

    # Выполняем все запросы
    rooms_result = await db.execute(rooms_query)
    dates_result = await db.execute(dates_query)
    times_result = await db.execute(times_query)

    rooms = rooms_result.all()
    dates = [d[0] for d in dates_result.all()]
    times = [t[0] for t in times_result.all()]

    if not rooms:
        return schemas.AvailableOptionsResponse(
            available_rooms=[],
            available_dates=[],
            available_slots=[],
            max_capacity_found=0
        )
    max_duration = 180

    if state.room_id and state.booking_date and state.start_time:
        room_result = await db.execute(select(Room).where(Room.id_room == state.room_id))
        room = room_result.scalar_one_or_none()

        if room:
            slots_query = select(TimeSlot).where(
                TimeSlot.id_room == state.room_id,
                TimeSlot.slot_date == state.booking_date,
                TimeSlot.start_time >= state.start_time
            ).order_by(TimeSlot.start_time)

            future_slots = (await db.execute(slots_query)).scalars().all()

            calculated_duration = 0
            current_dt = datetime.combine(state.booking_date, state.start_time)
            people_to_add = state.people_count or 1

            for slot in future_slots:
                slot_dt = datetime.combine(slot.slot_date, slot.start_time)

                if slot_dt != current_dt:
                    break

                current_people = slot.number_of_people or 0
                if current_people + people_to_add > room.capacity:
                    break

                calculated_duration += 15

                # Ограничиваем тремя часами
                if calculated_duration >= 180:
                    calculated_duration = 180
                    break

                current_dt += timedelta(minutes=15)

            max_duration = calculated_duration

    return schemas.AvailableOptionsResponse(
        available_rooms=sorted([r.id_room for r in rooms]),
        available_dates=dates,
        available_slots=times,
        max_capacity_found=max(r.capacity for r in rooms),
        max_duration_minutes=max_duration  # 🆕 Отдаем на фронт
    )


@app.post("/api/book")
async def create_booking(
        request: schemas.BookingCreateRequest,
        db: AsyncSession = Depends(get_db)
):
    try:
        result = await db.execute(
            select(User).where(User.tg_id == str(request.user_id))
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="Сначала авторизуйтесь через бот")
        if user.banned:
            raise HTTPException(status_code=403, detail="Аккаунт заблокирован")

        duration_time = (datetime.min + timedelta(minutes=request.duration_minutes)).time()

        new_book = await bookingServices.booking(
            session=db,
            user_id=user.id_user,  # Внутренний ID из БД
            room_id=request.room_id,
            num_of_people=request.people_count,
            slot_date=request.booking_date,
            start_time=request.start_time,
            duration=duration_time
        )

        return {"success": True, "booking_id": new_book.book_id}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.patch("/api/bookings/{book_id}", response_model=schemas.BookingDetailResponse)
async def edit_booking(
    book_id: int,
    request: schemas.BookingUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        # Вызываем сервис обновления
        updated_book = await bookingServices.update_booking(
            session=db,
            book_id=book_id,
            **request.model_dump(exclude_unset=True) # Передаем только те поля, которые прислал фронт
        )
        return updated_book
    except ValueError as e:
        # Если бронь не найдена или занята, сервис выкинет ошибку
        raise HTTPException(status_code=400, detail=str(e))

# 🆕 Хелпер: проверка админа
async def check_user_is_admin(tg_id: int, db: AsyncSession) -> User:
    result = await db.execute(
        select(User).where(User.tg_id == str(tg_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.banned:
        raise HTTPException(status_code=403, detail="Аккаунт заблокирован")
    if not user.administrator:
        raise HTTPException(status_code=403, detail="Доступ только для администраторов")

    return user

@app.get("/api/admin/bookings/pending", response_model=List[schemas.AdminBookingResponse])
async def get_pending_bookings(tg_id: int, db: AsyncSession = Depends(get_db)):
    """
    Возвращает все брони, требующие внимания админа:
    - id=1: Создано. Ожидается подтверждение администратором
    - id=3: Ожидание подтверждения явки
    - id=4: Явка подтверждена пользователем
    """
    await check_user_is_admin(tg_id, db)

    # 🆕 Сортировка: сначала те, что нуждаются в действии админа
    status_priority = case(
        (Booking.status == 1, 1),  # Новые заявки — самое важное!
        (Booking.status == 4, 2),  # Подтверждено пользователем — нужно подтвердить админу
        (Booking.status == 3, 3),  # Ожидание явки от пользователя
        else_=99
    )

    query = (
        select(Booking)
        .options(
            selectinload(Booking.room).selectinload(Room.building),
            selectinload(Booking.user),
            selectinload(Booking.status_rel),
        )
        .where(Booking.status.in_([1, 3, 4]))  # 🆕 Все три статуса
        .order_by(
            status_priority.asc(),
            Booking.slot_date_backup.asc(),
            Booking.start_time_backup.asc()
        )
    )

    result = await db.execute(query)
    return result.scalars().all()


# 🆕 Подтверждение брони админом
@app.post("/api/admin/bookings/{book_id}/approve")
async def approve_booking(
        book_id: int,
        tg_id: int,
        db: AsyncSession = Depends(get_db)
):
    """Меняет статус брони на 'Не активна' (id=2)"""
    await check_user_is_admin(tg_id, db)

    result = await db.execute(select(Booking).where(Booking.book_id == book_id))
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    if booking.status != 1:
        raise HTTPException(status_code=400, detail="Бронирование не ожидает подтверждения")

    booking.status = 2  # Не активна (одобрено)
    await db.commit()

    return {"success": True, "new_status": 2}


@app.post("/api/admin/bookings/{book_id}/confirm-attendance")
async def confirm_attendance(
        book_id: int,
        tg_id: int,
        db: AsyncSession = Depends(get_db)
):
    """Меняет статус с 'Явка подтверждена пользователем' на 'Явка полностью подтверждена'"""
    await check_user_is_admin(tg_id, db)

    result = await db.execute(select(Booking).where(Booking.book_id == book_id))
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    if booking.status != 4:
        raise HTTPException(status_code=400, detail="Бронь не в статусе 'Явка подтверждена пользователем'")

    booking.status = 5  # Явка полностью подтверждена
    await db.commit()

    return {"success": True, "new_status": 5}


@app.post("/api/admin/bookings/{book_id}/mark-no-show")
async def mark_no_show(
        book_id: int,
        tg_id: int,
        db: AsyncSession = Depends(get_db)
):
    """Отмечает 'Неявку' (статус 6) для броней в статусе 3 (ожидание подтверждения явки)"""
    await check_user_is_admin(tg_id, db)

    result = await db.execute(select(Booking).where(Booking.book_id == book_id))
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    if booking.status not in [3, 4]:
        raise HTTPException(status_code=400, detail="Невозможно отметить неявку для этого статуса")

    booking.status = 6  # Неявка
    await db.commit()

    return {"success": True, "new_status": 6}


@app.post("/api/admin/bookings/{book_id}/reject")
async def reject_booking(
        book_id: int,
        tg_id: int,
        db: AsyncSession = Depends(get_db)
):
    """Меняет статус брони на 'Отменено' (id=7)"""
    await check_user_is_admin(tg_id, db)

    result = await db.execute(select(Booking).where(Booking.book_id == book_id))
    booking = result.scalar_one_or_none()

    if not booking:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    if booking.status != 1:
        raise HTTPException(status_code=400, detail="Бронирование не ожидает подтверждения")

    booking.status = 7  # Отменено
    await db.commit()

    return {"success": True, "new_status": 7}