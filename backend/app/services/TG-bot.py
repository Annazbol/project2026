import asyncio
import logging
import os
from dotenv import load_dotenv

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.utils.keyboard import InlineKeyboardBuilder
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

from models import User, Base
from NotificationFunctions import NotificationManager, BanAware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()

TOKEN = os.getenv("BOT_TOKEN")
DATABASE_URL = os.getenv("DATABASE_URL")
MINI_APP_URL = os.getenv("MINI_APP_URL")

engine = create_async_engine(DATABASE_URL)
async_session = async_sessionmaker(engine, expire_on_commit=False)


# 1. Состояние
class AuthState(StatesGroup):
    waiting_for_login = State()
    waiting_for_password = State()


async def main():
    bot = Bot(token=TOKEN)
    dp = Dispatcher()

    dp.message.outer_middleware(BanAware(async_session))
    dp.callback_query.outer_middleware(BanAware(async_session))

    notification_manager = NotificationManager(bot, async_session)

    # 2. /start
    @dp.message(CommandStart())
    async def start_command(message: types.Message, state: FSMContext):

        await state.clear()

        async with async_session() as session:

            result = await session.execute(
                select(User).where(User.tg_id == message.from_user.id)
            )
            user = result.scalar_one_or_none()

            builder = InlineKeyboardBuilder()

            if not user:

                await message.answer(
                    "Привет! Похоже, ты еще не привязал свой Telegram к аккаунту системы бронирования ВятГУ.\n\n"
                    "Пожалуйста, отправь мне свой логин:"
                )

                await state.set_state(AuthState.waiting_for_login)
            else:

                builder.row(types.InlineKeyboardButton(
                    text="Забронировать коворкинг",
                    web_app=types.WebAppInfo(url=MINI_APP_URL)
                ))
                await message.answer(
                    f"Рады видеть вас снова, {user.name}!\n"
                    "Нажми кнопку ниже, чтобы перейти к выбору комнат.",
                    reply_markup=builder.as_markup()
                )

    # 3. логин
    @dp.message(AuthState.waiting_for_login, F.text)
    async def process_login(message: types.Message, state: FSMContext):

        await state.update_data(login=message.text)

        await message.answer("Отлично! Теперь отправь свой пароль:")

        await state.set_state(AuthState.waiting_for_password)

    # 4.пароль
    @dp.message(AuthState.waiting_for_password, F.text)
    async def process_password(message: types.Message, state: FSMContext):
        password = message.text

        user_data = await state.get_data()
        login = user_data.get('login')

        try:
            await message.delete()
        except Exception:
            pass

        async with async_session() as session:

            result = await session.execute(
                select(User).where(User.login == login, User.password == password)
            )
            user = result.scalar_one_or_none()

            if user:
                # Если найден
                user.tg_id = message.from_user.id
                await session.commit()

                await state.clear()

                builder = InlineKeyboardBuilder()
                builder.row(types.InlineKeyboardButton(
                    text="Забронировать коворкинг",
                    web_app=types.WebAppInfo(url=MINI_APP_URL)
                ))

                await message.answer(
                    f"Авторизация успешна! Добро пожаловать, {user.name} {user.surname}.\n\n"
                    "Твой Telegram-аккаунт привязан. Теперь ты можешь зайти в приложение:",
                    reply_markup=builder.as_markup()
                )
            else:
                # Если неверны
                builder = InlineKeyboardBuilder()
                builder.row(types.InlineKeyboardButton(text="Попробовать снова", callback_data="restart_auth"))
                await message.answer(
                    "Неверный логин или пароль. Проверь данные и попробуй снова.",
                    reply_markup=builder.as_markup()
                )
                await state.clear()

    @dp.callback_query(F.data == "restart_auth")
    async def restart_auth_callback(callback: types.CallbackQuery, state: FSMContext):
        await callback.answer()
        await callback.message.answer("Пожалуйста, отправь мне свой логин:")
        await state.set_state(AuthState.waiting_for_login)

    try:
        await dp.start_polling(bot)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())