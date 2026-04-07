import React, { useState, useEffect, useRef } from 'react';
import './ChooseRoom.css';

const tg = window.Telegram?.WebApp;

// Обновленная БД: добавили явные номер корпуса и комнаты
const roomsDatabase = [
    { id: 1, building_num: 1, room_num: '207', name: "🌿 Релакс-зона «Тишина»", capacity: 2, pricePerDay: 1200, features: ["quiet", "study"], description: "Кресла-мешки, мягкий свет, библиотека" },
    { id: 2, building_num: 2, room_num: '101', name: "🏙 Панорама «Вятка»", capacity: 3, pricePerDay: 1800, features: ["view", "large"], description: "Вид на набережную, диваны, кофемашина" },
    { id: 3, building_num: 3, room_num: '404', name: "👨‍👩‍👧‍👦 Семейная комната «Уют»", capacity: 4, pricePerDay: 2200, features: ["large", "quiet"], description: "Детский уголок, кухня, игрушки" },
    { id: 4, building_num: 1, room_num: '315', name: "💻 Коворкинг «Smart-отдых»", capacity: 2, pricePerDay: 1500, features: ["study", "quiet"], description: "Рабочие места, розетки, проектор" },
    { id: 5, building_num: 2, room_num: '220', name: "🎓 Мини-студия «Академик»", capacity: 1, pricePerDay: 900, features: ["study"], description: "Для индивидуальной работы и отдыха" },
    { id: 6, building_num: 3, room_num: '105', name: "🎮 GameZone «Мультиплеер»", capacity: 6, pricePerDay: 3000, features: ["large"], description: "Приставка, настолки, большой экран" }
];

const AVAILABLE_TAGS = [
    { id: 'quiet', label: '🤫 Тихая' },
    { id: 'study', label: '💻 Рабочая зона' },
    { id: 'view', label: '🌅 С видом' },
    { id: 'large', label: '🛋 Просторная' }
];

export default function ChooseRoom() {
    const [roomQuery, setRoomQuery] = useState('');
    const [filteredHints, setFilteredHints] = useState([]);
    const [showHints, setShowHints] = useState(false);
    const autocompleteRef = useRef(null);

    const [building, setBuilding] = useState('any');
    const [selectedTags, setSelectedTags] = useState([]);

    const [searchResults, setSearchResults] = useState(null);
    const [selectedRoomId, setSelectedRoomId] = useState(null);

    useEffect(() => {
        tg?.expand();
        tg?.enableClosingConfirmation();

        const handleClickOutside = (event) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
                setShowHints(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRoomQueryChange = (e) => {
        const query = e.target.value;
        setRoomQuery(query);

        if (query === '') {
            setSelectedRoomId(null);
            setFilteredHints([]);
            setShowHints(false);
            return;
        }

        if (query.length > 0) {
            const hints = roomsDatabase
                .map(r => ({
                    id: r.id,
                    formatted: `${r.building_num}-${r.room_num}`,
                    name: r.name
                }))
                .filter(item => 
                    item.formatted.startsWith(query)
                )
                .slice(0, 5);

            setFilteredHints(hints);
            setShowHints(true);
        } else {
            setShowHints(false);
        }
    };

    const selectHint = (hint) => {
        if (tg) tg.HapticFeedback.impactOccurred('light');
        setRoomQuery(hint.formatted);
        setSelectedRoomId(hint.id);
        setShowHints(false);
    };

    const handleTagToggle = (tagId) => {
        if (tg) tg.HapticFeedback.impactOccurred('light');
        setSelectedTags(prev => 
            prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
        );
    };

    const calculateScore = (room) => {
        if (selectedTags.length === 0) return 100; // Если теги не выбраны, все комнаты равны
        const matchCount = selectedTags.filter(tag => room.features.includes(tag)).length;
        return Math.round((matchCount / selectedTags.length) * 100);
    };

    const handleSearch = () => {
        if (tg) tg.HapticFeedback.impactOccurred('medium');
        
        if (selectedRoomId) {
            const exactRoom = roomsDatabase.find(r => r.id === selectedRoomId);
            if (exactRoom) {
                setSearchResults([{ ...exactRoom, matchScore: 100 }]);
                return;
            }
        }

        let filtered = roomsDatabase;

        if (building !== 'any') {
            filtered = filtered.filter(room => room.building_num === parseInt(building));
        }

        if (selectedTags.length > 0) {
            filtered = filtered.filter(room => 
                selectedTags.some(tag => room.features.includes(tag))
            );
        }

        filtered = filtered.map(room => ({
            ...room,
            matchScore: calculateScore(room)
        })).sort((a, b) => b.matchScore - a.matchScore);

        setSearchResults(filtered);
        
        if (filtered.length > 0) {
            setSelectedRoomId(filtered[0].id);
        } else {
            setSelectedRoomId(null);
        }
    };

    const handleBooking = () => {
        if (!selectedRoomId) return;
        const room = roomsDatabase.find(r => r.id === selectedRoomId);
        
        const payload = {
            action: 'room_selected',
            roomId: room.id,
            roomName: `${room.building_num}-${room.room_num} ${room.name}`
        };

        if (tg) {
            tg.HapticFeedback.notificationOccurred('success');
            tg.sendData(JSON.stringify(payload));
            tg.showPopup({
                title: '✅ Комната выбрана',
                message: `Вы выбрали: ${payload.roomName}\nОжидайте продолжения.`,
                buttons: [{ type: 'ok' }]
            }, () => tg.close());
        } else {
            alert(`Выбрана комната: ${payload.roomName}`);
        }
    };

    return (
        <div className="choose-room-container">
            <div className="choose-room-wrapper">
                <div className="header">
                    <div className="logo">🏛 ВятГУ · Выбор</div>
                    <div class="subtitle">Поиск кабинета по номеру или критериям</div>
                </div>

                <div className="card">
                    <div className="card-title"><span>🔍</span> Поиск по номеру</div>
                    
                    <div className="form-group" ref={autocompleteRef}>
                        <label>🏛 Номер кабинета (Корпус-Кабинет)</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Пример: 1-207"
                            value={roomQuery}
                            onChange={handleRoomQueryChange}
                            onFocus={() => roomQuery.length > 0 && filteredHints.length > 0 && setShowHints(true)}
                        />
                        {showHints && filteredHints.length > 0 && (
                            <div className="autocomplete-hints">
                                {filteredHints.map(hint => (
                                    <div key={hint.id} className="hint-item" onClick={() => selectHint(hint)}>
                                        <span className="hint-room-num">{hint.formatted}</span>
                                        <span className="hint-room-name">{hint.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={handleSearch} className="btn-primary" style={{marginTop: '10px'}}>
                        🔍 Найти
                    </button>
                </div>

                {!selectedRoomId && (
                    <div className="card animate-in fade-in">
                        <div className="card-title"><span>📝</span> Или выберите критерии</div>
                        
                        <div className="form-group">
                            <label>🏢 Корпус</label>
                            <select className="form-control" value={building} onChange={e => setBuilding(e.target.value)}>
                                <option value="any">Все корпуса</option>
                                <option value="1">Корпус №1</option>
                                <option value="2">Корпус №2</option>
                                <option value="3">Корпус №3</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>✨ Особенности</label>
                            <div className="tags-container">
                                {AVAILABLE_TAGS.map(tag => (
                                    <button
                                        key={tag.id}
                                        onClick={() => handleTagToggle(tag.id)}
                                        className={`tag-pill ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                                    >
                                        {tag.label}
                                    </button>
                                ))
                                }
                            </div>
                        </div>
                    </div>
                )}

                {searchResults !== null && (
                    <div className="card animate-in slide-in-from-bottom">
                        <div className="card-title"><span>🏨</span> Результаты</div>
                        
                        {searchResults.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--tg-theme-hint-color)' }}>
                                😔 Комнат с такими критериями не найдено.
                            </div>
                        ) : (
                            <>
                                <div className="search-stats">Найдено {searchResults.length} вар.</div>
                                <div className="rooms-list">
                                    {searchResults.map(room => (
                                        <div 
                                            key={room.id} 
                                            className={`room-card ${selectedRoomId === room.id ? 'selected' : ''}`}
                                            onClick={() => {
                                                setSelectedRoomId(room.id);
                                                // Синхронизируем инпут с выбором из списка
                                                setRoomQuery(`${room.building_num}-${room.room_num}`);
                                                if (tg) tg.HapticFeedback.impactOccurred('light');
                                            }}
                                        >
                                            <div className="room-header">
                                                <div className="room-name">
                                                    {room.building_num}-{room.room_num} {room.name}
                                                </div>
                                                {!roomQuery && (
                                                    <div className="match-badge">
                                                        {room.matchScore}% совпадение
                                                    </div>
                                                )}
                                            </div>
                                            <div className="room-features">
                                                <span className="feature">👥 {room.capacity} мест</span>
                                                <span className="feature">🏢 Корпус {room.building_num}</span>
                                            </div>
                                            <div style={{ fontSize: '13px', marginTop: '8px', color: 'var(--tg-theme-hint-color)' }}>
                                                {room.description}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="footer-bar">
                <button 
                    className="btn-primary" 
                    disabled={!selectedRoomId} 
                    onClick={handleBooking}
                >
                    ✓ Подтвердить выбор комнаты
                </button>
            </div>
        </div>
    );
}