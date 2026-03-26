from datetime import date, time, datetime
from typing import Optional, List

from sqlalchemy import (
    Boolean, CheckConstraint, Column, Date, ForeignKey,
    Integer, SmallInteger, String, Text, Time, TIMESTAMP,
    UniqueConstraint, func, text
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# Справочники

class Tag(Base):
    __tablename__ = "tags"
    tag_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    tag_rooms: Mapped[List["TagRoom"]] = relationship(back_populates="tag_rel", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Tag id={self.tag_id} name={self.name!r}>"


class ActivityType(Base):
    __tablename__ = "activity_types"
    id_type: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    activities: Mapped[List["UserActivity"]] = relationship(back_populates="activity_type_rel", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<ActivityType id={self.id_type} name={self.name!r}>"


class BookingStatus(Base):
    __tablename__ = "books_statuses"
    id_status: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    bookings: Mapped[List["Booking"]] = relationship(back_populates="status_rel")

    def __repr__(self) -> str:
        return f"<BookingStatus id={self.id_status} name={self.name!r}>"


# Комнаты

class Building(Base):
    __tablename__ = "buildings"
    building_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text)
    rooms: Mapped[List["Room"]] = relationship(back_populates="building", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Building id={self.building_id} name={self.name!r}>"


class Room(Base):
    __tablename__ = "rooms"
    id_room: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_building: Mapped[int] = mapped_column(Integer, ForeignKey("buildings.building_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    room_number: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    building: Mapped["Building"] = relationship(back_populates="rooms")
    time_slots: Mapped[List["TimeSlot"]] = relationship(back_populates="room", cascade="all, delete-orphan")
    photos: Mapped[List["Photo"]] = relationship(back_populates="room", cascade="all, delete-orphan")
    tag_rooms: Mapped[List["TagRoom"]] = relationship(back_populates="room_rel", cascade="all, delete-orphan")
    bookings: Mapped[List["Booking"]] = relationship(back_populates="room", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Room id={self.id_room} number={self.room_number} building={self.id_building}>"


class TimeSlot(Base):
    __tablename__ = "time_slots"
    __table_args__ = (UniqueConstraint("id_room", "slot_date", "start_time", name="uq_room_slot_time"),)
    id_slot: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_room: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id_room", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    slot_date: Mapped[date] = mapped_column(Date, nullable=False, server_default=func.current_date())
    start_time: Mapped[time] = mapped_column(Time, nullable=False, server_default=func.current_time())
    number_of_people: Mapped[int] = mapped_column(Integer, nullable=False)
    room: Mapped["Room"] = relationship(back_populates="time_slots")
    bookings: Mapped[List["Booking"]] = relationship(back_populates="slot", foreign_keys="Booking.id_slot")

    def __repr__(self) -> str:
        return f"<TimeSlot id={self.id_slot} room={self.id_room} {self.slot_date} {self.start_time}>"


class Photo(Base):
    __tablename__ = "photos"
    id_photo: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_room: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id_room", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    file_path: Mapped[str] = mapped_column(String(255), nullable=False)
    room: Mapped["Room"] = relationship(back_populates="photos")

    def __repr__(self) -> str:
        return f"<Photo id={self.id_photo} room={self.id_room} path={self.file_path!r}>"


class TagRoom(Base):
    __tablename__ = "tags_rooms"
    id_record: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tag: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("tags.tag_id", ondelete="CASCADE", onupdate="CASCADE"))
    room: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("rooms.id_room", ondelete="CASCADE", onupdate="CASCADE"))
    quantity: Mapped[Optional[int]] = mapped_column(Integer)
    tag_rel: Mapped[Optional["Tag"]] = relationship(back_populates="tag_rooms")
    room_rel: Mapped[Optional["Room"]] = relationship(back_populates="tag_rooms")

    def __repr__(self) -> str:
        return f"<TagRoom id={self.id_record} tag={self.tag} room={self.room} qty={self.quantity}>"


# Пользователи

class User(Base):
    __tablename__ = "users"
    id_user: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    login: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(20), nullable=False)
    surname: Mapped[str] = mapped_column(String(20), nullable=False)
    phone_number: Mapped[Optional[str]] = mapped_column(String(50))
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    administrator: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    activities: Mapped[List["UserActivity"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    bans: Mapped[List["Ban"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    bookings: Mapped[List["Booking"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User id={self.id_user} login={self.login!r} admin={self.administrator}>"


class UserActivity(Base):
    __tablename__ = "user_activity"
    id_record: Mapped[int] = mapped_column(Integer, primary_key=True)
    id_user: Mapped[int] = mapped_column(Integer, ForeignKey("users.id_user", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    activity_type: Mapped[int] = mapped_column(Integer, ForeignKey("activity_types.id_type", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    activity_time: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False)
    user: Mapped["User"] = relationship(back_populates="activities")
    activity_type_rel: Mapped["ActivityType"] = relationship(back_populates="activities")

    def __repr__(self) -> str:
        return f"<UserActivity id={self.id_record} user={self.id_user} type={self.activity_type}>"


class Ban(Base):
    __tablename__ = "bans"
    id_ban: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_user: Mapped[int] = mapped_column(Integer, ForeignKey("users.id_user", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    ban_start: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False)
    ban_end: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False)
    user: Mapped["User"] = relationship(back_populates="bans")

    def __repr__(self) -> str:
        return f"<Ban id={self.id_ban} user={self.id_user} active={self.is_active}>"


# --- Бронирования ---

class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (CheckConstraint("duration <= TIME '03:00:00'", name="chk_duration"),)
    book_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id_user", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    room_id: Mapped[int] = mapped_column(Integer, ForeignKey("rooms.id_room", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    id_slot: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("time_slots.id_slot", ondelete="SET NULL"), nullable=True)
    slot_date_backup: Mapped[Optional[date]] = mapped_column(Date)
    start_time_backup: Mapped[Optional[time]] = mapped_column(Time)
    duration: Mapped[time] = mapped_column(Time, nullable=False)
    num_of_people: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[int] = mapped_column(Integer, ForeignKey("books_statuses.id_status", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, server_default=text("1"))
    user: Mapped["User"] = relationship(back_populates="bookings")
    room: Mapped["Room"] = relationship(back_populates="bookings")
    slot: Mapped[Optional["TimeSlot"]] = relationship(back_populates="bookings", foreign_keys=[id_slot])
    status_rel: Mapped["BookingStatus"] = relationship(back_populates="bookings")
    notifications: Mapped[List["Notification"]] = relationship(back_populates="booking", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Booking id={self.book_id} user={self.user_id} room={self.room_id} status={self.status}>"


class Notification(Base):
    __tablename__ = "notifications"
    id_notification: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    id_user: Mapped[int] = mapped_column(Integer, ForeignKey("users.id_user", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    id_book: Mapped[int] = mapped_column(Integer, ForeignKey("bookings.book_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[Optional[bool]] = mapped_column(Boolean, server_default=text("false"))
    created_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP, server_default=func.current_timestamp())
    read_at: Mapped[Optional[datetime]] = mapped_column(TIMESTAMP)
    user: Mapped["User"] = relationship(back_populates="notifications")
    booking: Mapped["Booking"] = relationship(back_populates="notifications")

    def __repr__(self) -> str:
        return f"<Notification id={self.id_notification} user={self.id_user} read={self.status}>"