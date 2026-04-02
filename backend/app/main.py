from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import timedelta, datetime

from db.database import get_db
from db.models import Room
import services.bookingServices as bookingServices
import schemas.schemas

app = FastAPI(title="VyatGU Coworking API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/rooms", response_model=List[schemas.RoomResponse])
async def get_rooms(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Room))
    return result.scalars().all()


@app.post("/api/available-people-counts", response_model=schemas.PeopleCountResponse)
async def get_people_counts(
        x_telegram_init_data: Optional[str] = Header(None)
):
    return schemas.PeopleCountResponse(
        success=True,
        available_counts=[1, 2, 3, 4, 5, 6, 8, 10]
    )


@app.post("/api/available-time-slots", response_model=schemas.TimeSlotResponse)
async def get_time_slots(
        request: schemas.TimeSlotRequest,
        db: AsyncSession = Depends(get_db),
        x_telegram_init_data: Optional[str] = Header(None)
):
    try:
        available_times = await bookingServices.get_available_times_dynamic(
            session=db,
            room_id=request.room_id,
            selected_date=request.slot_date,
            num_of_people=request.people_count
        )

        slots = []
        for hour in range(8, 20):
            for minute in (0, 15, 30, 45):
                slot_time = datetime.strptime(f"{hour:02d}:{minute:02d}", "%H:%M").time()

                is_available = slot_time in available_times

                time_str = slot_time.strftime("%H:%M")
                end_time = (datetime.combine(date.today(), slot_time) + timedelta(minutes=15)).strftime("%H:%M")

                slots.append(schemas.TimeSlotItem(
                    time=time_str,
                    start=time_str,
                    end=end_time,
                    is_available=is_available
                ))

        return schemas.TimeSlotResponse(success=True, time_slots=slots)

    except Exception as e:
        return schemas.TimeSlotResponse(success=False, error=str(e))


@app.post("/api/book")
async def create_booking(
        request: schemas.CreateBookingRequest,
        db: AsyncSession = Depends(get_db)
):
    try:
        duration_time = (datetime.min + timedelta(minutes=request.duration_minutes)).time()

        new_book = await bookingServices.booking(
            session=db,
            user_id=request.user_id,
            room_id=request.room_id,
            num_of_people=request.num_of_people,
            slot_date=request.slot_date,
            start_time=request.start_time,
            duration=duration_time
        )
        return {"success": True, "booking_id": new_book.book_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")