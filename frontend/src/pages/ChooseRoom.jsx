import React, { useState, useEffect, useRef, useMemo } from 'react';
import './ChooseRoom.css';
// 🆕 Импортируем fetchBuildings и fetchTags
import { fetchRooms, checkBookingOptions, fetchBuildings, fetchTags } from '../api';

const tg = window.Telegram?.WebApp;

export default function ChooseRoom({ bookingData, onSelectRoom, goBack }) {
    const [rooms, setRooms] = useState([]);
    const [availableRoomIds, setAvailableRoomIds] = useState([]);
    
    // 🆕 Состояния для БД-справочнов
    const [dbBuildings, setDbBuildings] = useState([]);
    const [dbTags, setDbTags] = useState([]);
    
    const [loading, setLoading] = useState(true);

    // Поиск и фильтры
    const [roomQuery, setRoomQuery] = useState('');
    const [showHints, setShowHints] = useState(false);
    const autocompleteRef = useRef(null);
    const [building, setBuilding] = useState('any');
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [showBuildingDropdown, setShowBuildingDropdown] = useState(false);
    const buildingDropdownRef = useRef(null);

    const selectedBuildingName = useMemo(() => {
        if (building === 'any') return 'Все корпуса';
        const found = dbBuildings.find(b => String(b.building_id) === building);
        return found?.name || 'Все корпуса';
    }, [building, dbBuildings]);

    useEffect(() => {
        tg?.expand();

        const loadData = async () => {
            try {
                setLoading(true);
                
                // 🆕 Загружаем всё параллельно для скорости
                const [allRoomsData, options, buildingsData, tagsData] = await Promise.all([
                    fetchRooms(),
                    checkBookingOptions({ ...bookingData, room_id: null }),
                    fetchBuildings(),
                    fetchTags()
                ]);

                setRooms(Array.isArray(allRoomsData) ? allRoomsData : (allRoomsData.rooms || []));
                setAvailableRoomIds(options.available_rooms || []);
                setDbBuildings(buildingsData || []);
                setDbTags(tagsData || []);

            } catch (e) {
                tg?.showAlert("Ошибка соединения с сервером");
            } finally {
                setLoading(false);
            }
        };
        loadData();
        

        const handleClickOutside = (event) => {
            if (buildingDropdownRef.current && !buildingDropdownRef.current.contains(event.target)) {
                setShowBuildingDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [bookingData]);

    // Подсказки автокомплита
    const hints = useMemo(() => {
        if (!roomQuery) return [];
        return rooms
            .filter(r => availableRoomIds.includes(r.id_room))
            .filter(r => {
                const formatted = `${r.id_building}-${r.room_number}`;
                return formatted.toLowerCase().includes(roomQuery.toLowerCase()) ||
                       r.room_number.toString().includes(roomQuery);
            })
            .slice(0, 5);
    }, [roomQuery, rooms, availableRoomIds]);

    // Отфильтрованные комнаты
    const displayRooms = useMemo(() => {
        return rooms.filter(r => {
            if (!availableRoomIds.includes(r.id_room)) return false;
            
            // Фильтр по зданию
            if (building !== 'any' && r.id_building !== parseInt(building)) return false;
            
            // Поиск по тексту
            if (roomQuery && !r.room_number.toString().includes(roomQuery) &&
                !`${r.id_building}-${r.room_number}`.includes(roomQuery)) return false;
                
            // Фильтр по тегам
            if (selectedTags.length > 0) {
                const roomTags = r.tags || [];
                // Проверяем, есть ли у комнаты ХОТЯ БЫ ОДИН выбранный тег
                const hasMatch = selectedTags.some(tag => roomTags.includes(tag));
                if (!hasMatch) return false;
            }
            return true;
        });
    }, [rooms, availableRoomIds, building, roomQuery, selectedTags]);

    const handleTagToggle = (tagName) => {
        tg?.HapticFeedback?.impactOccurred('light');
        setSelectedTags(prev =>
            prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
        );
    };

    const selectHint = (room) => {
        tg?.HapticFeedback?.impactOccurred('light');
        setRoomQuery(`${room.id_building}-${room.room_number}`);
        setSelectedRoomId(room.id_room);
        setShowHints(false);
    };

    const resetFilters = () => {
        tg?.HapticFeedback?.impactOccurred('light');
        setRoomQuery('');
        setBuilding('any');
        setSelectedTags([]);
        setSelectedRoomId(null);
    };

    const handleConfirm = () => {
        if (!selectedRoomId) return;
        const room = rooms.find(r => r.id_room === selectedRoomId);
        tg?.HapticFeedback?.notificationOccurred('success');
        onSelectRoom(room);
    };

    const hasActiveFilters = building !== 'any' || selectedTags.length > 0 || roomQuery;

    return (
        <div className="choose-room-container">
            <div className="choose-room-wrapper">
                <div className="page-header">
                    <h1 className="page-title">🏛 Выбор кабинета</h1>
                    <p className="page-subtitle">Найдите подходящую комнату для бронирования</p>
                </div>

                {/* ПОИСК */}
                <div className="card">
                    <div className="card-title">
                        <span className="card-icon">🔍</span> Поиск
                    </div>
                    <div className="form-group" ref={autocompleteRef}>
                        <div className="search-input-wrapper">
                            <span className="search-icon">🔎</span>
                            <input
                                type="text"
                                className="form-control with-icon"
                                placeholder="Например: 1-207 или 207"
                                value={roomQuery}
                                onChange={(e) => {
                                    setRoomQuery(e.target.value);
                                    setShowHints(true);
                                    setSelectedRoomId(null);
                                }}
                                onFocus={() => roomQuery && setShowHints(true)}
                            />
                            {roomQuery && (
                                <button className="clear-btn" onClick={() => { setRoomQuery(''); setSelectedRoomId(null); }}>✕</button>
                            )}
                        </div>

                        {showHints && hints.length > 0 && (
                            <div className="autocomplete-hints">
                                {hints.map(room => (
                                    <div key={room.id_room} className="hint-item" onClick={() => selectHint(room)}>
                                        <div className="hint-main">
                                            <span className="hint-room-num">{room.id_building}-{room.room_number}</span>
                                            <span className="hint-room-name">{room.building?.name || `Корпус ${room.id_building}`}</span>
                                        </div>
                                        <div className="hint-meta"><span>👥 {room.capacity}</span></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ФИЛЬТРЫ */}
                <div className="card">
                    <div className="card-title">
                        <span className="card-icon">⚙️</span> Фильтры
                        {hasActiveFilters && (
                            <button className="reset-btn" onClick={resetFilters}>Сбросить</button>
                        )}
                    </div>

                    {/* Корпус из БД */}
                    {/* Корпус как выпадающий список */}
                    <div className="form-group" ref={buildingDropdownRef}>
                        <label>🏢 Корпус</label>
                        <div className="dropdown-wrapper">
                            <button
                                type="button"
                                className={`dropdown-trigger ${showBuildingDropdown ? 'open' : ''} ${building !== 'any' ? 'has-value' : ''}`}
                                onClick={() => {
                                    tg?.HapticFeedback?.impactOccurred('light');
                                    setShowBuildingDropdown(!showBuildingDropdown);
                                }}
                            >
                                <span className="dropdown-value">{selectedBuildingName}</span>
                                <span className="dropdown-arrow">▼</span>
                            </button>

                            {showBuildingDropdown && (
                                <div className="dropdown-menu">
                                    <div
                                        className={`dropdown-item ${building === 'any' ? 'active' : ''}`}
                                        onClick={() => {
                                            setBuilding('any');
                                            setShowBuildingDropdown(false);
                                            tg?.HapticFeedback?.selectionChanged();
                                        }}
                                    >
                                        <span>Все корпуса</span>
                                        {building === 'any' && <span className="check-icon">✓</span>}
                                    </div>

                                    {dbBuildings.map(b => (
                                        <div
                                            key={b.building_id}
                                            className={`dropdown-item ${building === String(b.building_id) ? 'active' : ''}`}
                                            onClick={() => {
                                                setBuilding(String(b.building_id));
                                                setShowBuildingDropdown(false);
                                                tg?.HapticFeedback?.selectionChanged();
                                            }}
                                        >
                                            <span>{b.name}</span>
                                            {building === String(b.building_id) && <span className="check-icon">✓</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Теги из БД */}
                    {dbTags.length > 0 && (
                        <div className="form-group">
                            <label>✨ Особенности</label>
                            <div className="tags-container">
                                {dbTags.map(tag => (
                                    <button
                                        key={tag.tag_id}
                                        onClick={() => handleTagToggle(tag.name)}
                                        className={`tag-pill ${selectedTags.includes(tag.name) ? 'active' : ''}`}
                                    >
                                        {selectedTags.includes(tag.name) && '✓ '}
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* РЕЗУЛЬТАТЫ */}
                <div className="card" style={{marginBottom: "20px"}}>
                    <div className="card-title">
                        <span className="card-icon">🏨</span> Доступные комнаты
                        {!loading && <span className="results-count">{displayRooms.length}</span>}
                    </div>

                    {loading ? (
                        <div className="skeleton-list">
                            {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
                        </div>
                    ) : displayRooms.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">😔</div>
                            <div className="empty-title">Ничего не найдено</div>
                            <div className="empty-text">Попробуйте изменить параметры поиска</div>
                        </div>
                    ) : (
                        <div className="rooms-list">
                            {displayRooms.map(room => (
                                <div
                                    key={room.id_room}
                                    className={`room-card ${selectedRoomId === room.id_room ? 'selected' : ''}`}
                                    onClick={() => {
                                        tg?.HapticFeedback?.selectionChanged();
                                        setSelectedRoomId(room.id_room);
                                    }}
                                >
                                    <div className="room-card-header">
                                        <div className="room-number-badge">{room.id_building}-{room.room_number}</div>
                                        <div className="room-capacity">👥 до {room.capacity} чел.</div>
                                    </div>
                                    <div className="room-building">🏢 {room.building?.name || `Корпус ${room.id_building}`}</div>
                                    {room.tags && room.tags.length > 0 && (
                                        <div className="room-tags">
                                            {room.tags.map((tag, i) => (
                                                <span key={i} className="room-tag">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ФУТЕР */}
            <div className="footer-bar">
                <button className="btn-secondary" onClick={goBack}>Назад</button>
                <button className="btn-primary" disabled={!selectedRoomId} onClick={handleConfirm}>
                    {selectedRoomId ? '✓ Выбрать' : 'Выберите комнату'}
                </button>
            </div>
        </div>
    );
}