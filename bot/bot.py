import os
import asyncio
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.utils.keyboard import InlineKeyboardBuilder

# Токен вашего бота
TOKEN = "8706736441:AAHfrGhW95-5wHsCLnN2nbrblujN5NXJO5g"
# URL вашего Mini App (сюда вставьте ссылку на развернутый ListOfRooms.html)
APP_URL = os.getenv("APP_URL", "https://ваш-сайт.ru/ListOfRooms.html")

bot = Bot(token=TOKEN)
dp = Dispatcher()

def get_main_menu():
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(
        text="💻 Личный кабинет (Mini App)",
        web_app=types.WebAppInfo(url=APP_URL)
    ))
    return builder.as_markup()

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    await message.answer(
        f"Привет, {message.from_user.first_name}!\n"
        "Для доступа к системе используйте кнопку ниже.",
        reply_markup=get_main_menu()
    )

@dp.message()
async def echo_all(message: types.Message):
    await message.answer(
        "Используйте кнопку в меню или команду /start",
        reply_markup=get_main_menu()
    )

async def main():
    print("Бот запущен")
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Бот остановлен")