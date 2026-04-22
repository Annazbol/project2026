import asyncio
import logging
import os
from dotenv import load_dotenv

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.client.session.aiohttp import AiohttpSession

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

from db.models import User, Base
from services.NotificationFunctions import NotificationManager, BanAware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()

TOKEN = os.getenv("BOT_TOKEN")
DATABASE_URL = os.getenv("DATABASE_URL")
MINI_APP_URL = os.getenv("MINI_APP_URL")

engine = create_async_engine(DATABASE_URL)
async_session = async_sessionmaker(engine, expire_on_commit=False)


class AuthState(StatesGroup):
    waiting_for_login = State()
    waiting_for_password = State()


# 🆕 Тексты кнопок (выносим в константы, чтобы не путаться)
BTN_BOOK = "🏛 Забронировать"
BTN_LOGOUT = "🚪 Выйти"
BTN_LOGIN = "🔑 Войти"
BTN_HELP = "ℹ️ Помощь"
BTN_MENU = "📋 Меню"


# 🆕 Reply-клавиатура для авторизованных
def get_user_keyboard() -> types.ReplyKeyboardMarkup:
    builder = ReplyKeyboardBuilder()
    builder.row(
        types.KeyboardButton(text=BTN_BOOK)
    )
    builder.row(
        types.KeyboardButton(text=BTN_MENU),
        types.KeyboardButton(text=BTN_HELP),
    )
    builder.row(
        types.KeyboardButton(text=BTN_LOGOUT),
    )
    return builder.as_markup(resize_keyboard=True, persistent=True)


# 🆕 Reply-клавиатура для неавторизованных
def get_guest_keyboard() -> types.ReplyKeyboardMarkup:
    builder = ReplyKeyboardBuilder()
    builder.row(
        types.KeyboardButton(text=BTN_LOGIN),
        types.KeyboardButton(text=BTN_HELP),
    )
    return builder.as_markup(resize_keyboard=True, persistent=True)


# Inline-клавиатура для главного меню (с Web App)
def get_main_menu(user_name: str) -> tuple[str, types.InlineKeyboardMarkup]:
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(
        text="🏛 Забронировать коворкинг",
        web_app=types.WebAppInfo(url=MINI_APP_URL)
    ))
    builder.row(types.InlineKeyboardButton(
        text="🚪 Выйти из аккаунта",
        callback_data="logout_request"
    ))

    text = (
        f"Рады видеть вас снова, <b>{user_name}</b>!\n\n"
        "Нажмите кнопку ниже, чтобы перейти к выбору комнат, "
        "или используйте кнопки внизу экрана."
    )
    return text, builder.as_markup()


# 🆕 Хелпер для проверки авторизации
async def get_user_by_tg_id(session, tg_id: int):
    result = await session.execute(
        select(User).where(User.tg_id == str(tg_id))
    )
    return result.scalar_one_or_none()


async def main():
    session = AiohttpSession()
    bot = Bot(token=TOKEN, session=session)
    dp = Dispatcher()

    dp.message.outer_middleware(BanAware(async_session))
    dp.callback_query.outer_middleware(BanAware(async_session))

    notification_manager = NotificationManager(bot, async_session)

    # ============================================
    # /start — Главное меню
    # ============================================
    @dp.message(CommandStart())
    async def start_command(message: types.Message, state: FSMContext):
        await state.clear()
        async with async_session() as session:
            user = await get_user_by_tg_id(session, message.from_user.id)

            if not user:
                await message.answer(
                    "👋 Привет! Похоже, ты ещё не привязал свой Telegram к аккаунту "
                    "системы бронирования ВятГУ.\n\n"
                    "Нажмите <b>«🔑 Войти»</b> внизу экрана, чтобы авторизоваться.",
                    parse_mode="HTML",
                    reply_markup=get_guest_keyboard()
                )
            else:
                text, inline_markup = get_main_menu(user.name)
                # Сначала отправляем нижнюю клавиатуру
                await message.answer(
                    text,
                    parse_mode="HTML",
                    reply_markup=get_user_keyboard()
                )
                # Затем — inline для Web App
                await message.answer(
                    "Используйте кнопку ниже для бронирования:",
                    reply_markup=inline_markup
                )

    # ============================================
    # 🆕 Обработка нижних кнопок
    # ============================================

    # Кнопка "🔑 Войти"
    @dp.message(F.text == BTN_LOGIN)
    async def btn_login_handler(message: types.Message, state: FSMContext):
        async with async_session() as session:
            user = await get_user_by_tg_id(session, message.from_user.id)
            if user:
                await message.answer(
                    f"Вы уже авторизованы как <b>{user.name}</b>.\n"
                    "Чтобы войти в другой аккаунт — сначала выйдите.",
                    parse_mode="HTML",
                    reply_markup=get_user_keyboard()
                )
                return

        await message.answer(
            "Пожалуйста, отправь мне свой логин:",
            reply_markup=types.ReplyKeyboardRemove()
        )
        await state.set_state(AuthState.waiting_for_login)

    # Кнопка "🚪 Выйти"
    @dp.message(F.text == BTN_LOGOUT)
    async def btn_logout_handler(message: types.Message, state: FSMContext):
        await state.clear()
        async with async_session() as session:
            user = await get_user_by_tg_id(session, message.from_user.id)

            if not user:
                await message.answer(
                    "Вы не авторизованы.",
                    reply_markup=get_guest_keyboard()
                )
                return

            await show_logout_confirm(message, user.name)

    # Кнопка "🏛 Забронировать"
    @dp.message(F.text == BTN_BOOK)
    async def btn_book_handler(message: types.Message):
        async with async_session() as session:
            user = await get_user_by_tg_id(session, message.from_user.id)

            if not user:
                await message.answer(
                    "❌ Сначала войдите в аккаунт.",
                    reply_markup=get_guest_keyboard()
                )
                return

            builder = InlineKeyboardBuilder()
            builder.row(types.InlineKeyboardButton(
                text="🏛 Открыть приложение",
                web_app=types.WebAppInfo(url=MINI_APP_URL)
            ))
            await message.answer(
                "Нажмите кнопку ниже, чтобы открыть приложение бронирования:",
                reply_markup=builder.as_markup()
            )

    # Кнопка "📋 Меню"
    @dp.message(F.text == BTN_MENU)
    async def btn_menu_handler(message: types.Message):
        async with async_session() as session:
            user = await get_user_by_tg_id(session, message.from_user.id)

            if not user:
                await message.answer(
                    "Вы не авторизованы.",
                    reply_markup=get_guest_keyboard()
                )
                return

            text, inline_markup = get_main_menu(user.name)
            await message.answer(text, parse_mode="HTML", reply_markup=inline_markup)

    # Кнопка "ℹ️ Помощь"
    @dp.message(F.text == BTN_HELP)
    async def btn_help_handler(message: types.Message):
        async with async_session() as session:
            user = await get_user_by_tg_id(session, message.from_user.id)
            keyboard = get_user_keyboard() if user else get_guest_keyboard()

        await message.answer(
            "<b>📖 Справка</b>\n\n"
            "<b>Доступные команды:</b>\n"
            "/start — Главное меню\n"
            "/login — Войти в аккаунт\n"
            "/logout — Выйти из аккаунта\n"
            "/help — Эта справка\n\n"
            "<b>Кнопки внизу экрана:</b>\n"
            "🏛 <b>Забронировать</b> — открыть приложение\n"
            "📋 <b>Меню</b> — главное меню с Web App\n"
            "🔑 <b>Войти</b> — авторизоваться по логину/паролю\n"
            "🚪 <b>Выйти</b> — отвязать Telegram от аккаунта\n"
            "ℹ️ <b>Помощь</b> — показать эту справку\n\n"
            "Если у вас возникли вопросы — обратитесь к администратору.",
            parse_mode="HTML",
            reply_markup=keyboard
        )

    # ============================================
    # /logout — команда выхода
    # ============================================
    @dp.message(Command("logout"))
    async def logout_command(message: types.Message, state: FSMContext):
        await btn_logout_handler(message, state)

    # ============================================
    # /login — команда входа
    # ============================================
    @dp.message(Command("login"))
    async def login_command(message: types.Message, state: FSMContext):
        await btn_login_handler(message, state)

    # ============================================
    # /help — справка
    # ============================================
    @dp.message(Command("help"))
    async def help_command(message: types.Message):
        await btn_help_handler(message)

    # ============================================
    # Подтверждение выхода
    # ============================================
    async def show_logout_confirm(message_or_callback, user_name: str):
        builder = InlineKeyboardBuilder()
        builder.row(
            types.InlineKeyboardButton(text="✅ Да, выйти", callback_data="logout_confirm"),
            types.InlineKeyboardButton(text="❌ Отмена", callback_data="logout_cancel")
        )

        text = (
            f"⚠️ <b>Вы действительно хотите выйти из аккаунта?</b>\n\n"
            f"Текущий пользователь: <b>{user_name}</b>\n\n"
            "После выхода ваш Telegram будет отвязан от аккаунта. "
            "Чтобы войти снова, потребуется ввести логин и пароль."
        )

        if isinstance(message_or_callback, types.Message):
            await message_or_callback.answer(
                text, reply_markup=builder.as_markup(), parse_mode="HTML"
            )
        else:
            await message_or_callback.message.edit_text(
                text, reply_markup=builder.as_markup(), parse_mode="HTML"
            )

    @dp.callback_query(F.data == "logout_request")
    async def logout_request_callback(callback: types.CallbackQuery):
        await callback.answer()
        async with async_session() as session:
            user = await get_user_by_tg_id(session, callback.from_user.id)
            if not user:
                await callback.message.answer(
                    "Вы не авторизованы.",
                    reply_markup=get_guest_keyboard()
                )
                return
            await show_logout_confirm(callback, user.name)

    @dp.callback_query(F.data == "logout_confirm")
    async def logout_confirm_callback(callback: types.CallbackQuery, state: FSMContext):
        await callback.answer()
        await state.clear()

        async with async_session() as session:
            user = await get_user_by_tg_id(session, callback.from_user.id)

            if not user:
                await callback.message.edit_text("Вы уже вышли из аккаунта.")
                return

            user_name = user.name
            user.tg_id = None
            await session.commit()

            await callback.message.edit_text(
                f"👋 До свидания, <b>{user_name}</b>!\n\n"
                "Ваш Telegram-аккаунт был отвязан от системы.\n"
                "Используйте кнопку <b>«🔑 Войти»</b> внизу экрана, чтобы войти снова.",
                parse_mode="HTML"
            )

            # 🆕 Меняем нижнюю клавиатуру на гостевую
            await callback.message.answer(
                "Чтобы продолжить — войдите в систему.",
                reply_markup=get_guest_keyboard()
            )

            logger.info(f"Пользователь {user_name} (tg_id={callback.from_user.id}) вышел из аккаунта")

    @dp.callback_query(F.data == "logout_cancel")
    async def logout_cancel_callback(callback: types.CallbackQuery):
        await callback.answer("Отменено")
        async with async_session() as session:
            user = await get_user_by_tg_id(session, callback.from_user.id)

            if user:
                text, inline_markup = get_main_menu(user.name)
                await callback.message.edit_text(text, parse_mode="HTML", reply_markup=inline_markup)
            else:
                await callback.message.edit_text("Используйте /start, чтобы войти.")

    # ============================================
    # Обработка логина
    # ============================================
    @dp.message(AuthState.waiting_for_login, F.text)
    async def process_login(message: types.Message, state: FSMContext):
        await state.update_data(login=message.text)
        await message.answer("Отлично! Теперь отправь свой пароль:")
        await state.set_state(AuthState.waiting_for_password)

    # ============================================
    # Обработка пароля
    # ============================================
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
                # Проверка двойной привязки
                tg_check = await session.execute(
                    select(User).where(
                        User.tg_id == str(message.from_user.id),
                        User.id_user != user.id_user
                    )
                )
                existing = tg_check.scalar_one_or_none()
                if existing:
                    await message.answer(
                        "❌ Этот Telegram уже привязан к другому аккаунту.\n"
                        "Сначала выйдите из текущего аккаунта.",
                        reply_markup=get_user_keyboard()
                    )
                    await state.clear()
                    return

                user.tg_id = str(message.from_user.id)
                await session.commit()
                await state.clear()

                # 🆕 Возвращаем кнопки и показываем меню
                await message.answer(
                    f"✅ Авторизация успешна! Добро пожаловать, <b>{user.name} {user.surname}</b>.",
                    parse_mode="HTML",
                    reply_markup=get_user_keyboard()
                )

                text, inline_markup = get_main_menu(user.name)
                await message.answer(text, parse_mode="HTML", reply_markup=inline_markup)

                logger.info(f"Пользователь {user.name} ({login}) авторизовался, tg_id={message.from_user.id}")
            else:
                builder = InlineKeyboardBuilder()
                builder.row(types.InlineKeyboardButton(
                    text="🔄 Попробовать снова",
                    callback_data="restart_auth"
                ))
                await message.answer(
                    "❌ Неверный логин или пароль. Проверь данные и попробуй снова.",
                    reply_markup=builder.as_markup()
                )
                # Возвращаем нижнюю клавиатуру
                await message.answer(
                    "Или используйте кнопки внизу:",
                    reply_markup=get_guest_keyboard()
                )
                await state.clear()

    @dp.callback_query(F.data == "restart_auth")
    async def restart_auth_callback(callback: types.CallbackQuery, state: FSMContext):
        await callback.answer()
        await callback.message.answer(
            "Пожалуйста, отправь мне свой логин:",
            reply_markup=types.ReplyKeyboardRemove()
        )
        await state.set_state(AuthState.waiting_for_login)

    # ============================================
    # Запуск
    # ============================================
    await bot.set_my_commands([
        types.BotCommand(command="start", description="Главное меню"),
        types.BotCommand(command="login", description="Войти в аккаунт"),
        types.BotCommand(command="logout", description="Выйти из аккаунта"),
        types.BotCommand(command="help", description="Помощь"),
    ])

    try:
        await dp.start_polling(bot)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())