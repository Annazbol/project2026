import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from models import User

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL)
async_session = async_sessionmaker(engine, expire_on_commit=False)


async def add_user():
    async with async_session() as session:
        # Создаем тестового пользователя
        new_user = User(
            login="BROUN",
            name="Сергей",
            surname="Сергеев",
            password="123098456",  # хэшировать потом!
            administrator=False
        )

        session.add(new_user)
        await session.commit()
        print("Тестовый пользователь успешно добавлен!")

        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(add_user())