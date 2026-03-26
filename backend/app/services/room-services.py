from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
import logging

from ..db.models import Room

logger = logging.getLogger(__name__)


async def add_room(session: AsyncSession, id_building: int, room_number: int, capacity: int, description: str):
    try:
        new_room = Room(
            id_building=id_building,
            room_number=room_number,
            capacity=capacity,
            description=description
        )
        session.add(new_room)
        await session.commit()
        await session.refresh(new_room)  # сгенерированный id_room
        logger.info(f"Комната {room_number} успешно добавлена.")
        return new_room
    except Exception as e:
        await session.rollback()
        logger.error(f"Ошибка при добавлении комнаты: {e}")
        raise


async def update_room(session: AsyncSession, id_room: int, **kwargs) -> bool:

    try:
        if not kwargs:
            return False

        stmt = update(Room).where(Room.id_room == id_room).values(**kwargs)
        result = await session.execute(stmt)
        await session.commit()

        success = result.rowcount > 0
        if success:
            logger.info(f"Комната с ID {id_room} обновлена.")
        return success
    except Exception as e:
        await session.rollback()
        logger.error(f"Ошибка при обновлении комнаты {id_room}: {e}")
        raise


async def delete_room(session: AsyncSession, id_room: int) -> bool:
    try:
        stmt = delete(Room).where(Room.id_room == id_room)
        result = await session.execute(stmt)
        await session.commit()

        success = result.rowcount > 0
        if success:
            logger.info(f"Комната с ID {id_room} удалена.")
        return success
    except Exception as e:
        await session.rollback()
        logger.error(f"Ошибка при удалении комнаты {id_room}: {e}")
        raise