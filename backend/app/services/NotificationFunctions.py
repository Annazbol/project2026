import logging
from datetime import datetime, timedelta
from aiogram import Bot, BaseMiddleware
from aiogram.types import Message
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select, and_, insert
from db.models import Notification, Booking, Ban, User  # модели из models.py
import inspect

logger = logging.getLogger(__name__)

# 1. УВЕДОМЛЕНИЯ
class NotificationManager:
    def __init__(self, bot: Bot, session_factory):
        self.bot = bot
        self.session_factory = session_factory
        self.scheduler = AsyncIOScheduler()
        self.scheduler.start()

    async def _save_notification(self, user_id: int, book_id: int, title: str, message: str):

        async with self.session_factory() as session:
            new_note = Notification(
                id_user=user_id,
                id_book=book_id,
                title=title,
                message=message,
                created_at=datetime.now(),
                status=False
            )
            session.add(new_note)
            await session.commit()

    async def send_booking_confirmation(self, user_tg_id: int, booking: Booking, room_number: int):
        """Мгновенное подтверждение"""
        title = "Бронирование подтверждено"
        msg_text = (
            f"Ваше бронирование подтверждено!\n"
            f"Комната №{room_number}\n"
            f"Дата: {booking.slot_date_backup.strftime('%d.%m.%Y')}\n"
            f"Время: {booking.start_time_backup.strftime('%H:%M')}"
        )
        await self.bot.send_message(user_tg_id, msg_text)
        await self._save_notification(booking.user_id, booking.book_id, title, msg_text)

    def schedule_booking_reminders(self, user_tg_id: int, booking: Booking, room_number: int):
        """1 день > 1 час > Начало"""
        # Объединяем дату и время
        start_dt = datetime.combine(booking.slot_date_backup, booking.start_time_backup)
        now = datetime.now()

        # 1. ЗА 1 ДЕНЬ
        remind_24h = start_dt - timedelta(days=1)
        if remind_24h > now:
            self.scheduler.add_job(
                self.send_direct_message, 'date', run_date=remind_24h,
                args=[user_tg_id,
                      f"Завтра в {booking.start_time_backup.strftime('%H:%M')} у вас бронь комнаты №{room_number}. Ждем вас!"]
            )

        # 2. ЗА 1 ЧАС
        remind_1h = start_dt - timedelta(hours=1)
        if remind_1h > now:
            self.scheduler.add_job(
                self.send_direct_message, 'date', run_date=remind_1h,
                args=[user_tg_id, f"Напоминание: Через 1 час начнется ваша бронь (комната №{room_number})."]
            )

        # 3. В МОМЕНТ НАЧАЛА
        self.scheduler.add_job(
            self.send_direct_message, 'date', run_date=start_dt,
            args=[user_tg_id, f"Ваше время началось! Комната №{room_number} готова к использованию."]
        )

    async def send_ban_notification(self, user_tg_id: int, ban_record: Ban):
        """Уведомление при наложении бана"""
        msg_text = (
            f"Ваша учетная запись была заблокирована.\n"
            f"Срок: с {ban_record.ban_start.strftime('%d.%m %H:%M')} "
            f"до {ban_record.ban_end.strftime('%d.%m %H:%M')}."
        )
        await self.bot.send_message(user_tg_id, msg_text)

    async def send_direct_message(self, chat_id: int, text: str):
        try:
            await self.bot.send_message(chat_id, text)
        except Exception as e:
            logger.error(f"Ошибка отправки: {e}")


# 2. ПРОВЕРКА БАНА
class BanAware(BaseMiddleware):
    def __init__(self, session_factory):
        super().__init__()
        self.session_factory = session_factory

    async def __call__(self, handler, event: Message, data):
        # ДОБАВЬ ЭТИ ПРИНТЫ:
        print(f"--- DEBUG INFO ---")
        print(f"User class location: {inspect.getfile(User)}")
        print(f"Available attributes: {dir(User)}")
        print(f"------------------")

        if not event.from_user:
            return await handler(event, data)

        async with self.session_factory() as session:
            current_time = datetime.now()
            query = (
                select(Ban).join(User).where(
                    and_(
                        # Оборачиваем ID в str(), чтобы типы совпали
                        User.tg_id == str(event.from_user.id),
                        Ban.is_active == True,
                        Ban.ban_start <= current_time,
                        Ban.ban_end >= current_time
                    )
                )
            )
            result = await session.execute(query)
            active_ban = result.scalar_one_or_none()

            if active_ban:
                until_date = active_ban.ban_end.strftime("%d.%m.%Y %H:%M")
                await event.answer(
                    f"**Доступ ограничен**\n\n"
                    f"Ваш аккаунт заблокирован до {until_date}.\n"
                    "Для уточнения причин обратитесь к администратору."
                )
                return
        return await handler(event, data)