import React, { useState, useEffect } from 'react';
import './CreateRoom.css';
import { fetchBuildings, fetchTags, createRoom } from '../api';
import { useUser } from '../UserContext.jsx';

const tg = window.Telegram?.WebApp;

export default function CreateRoom({ goBack, roomToEdit  }) {
    const { tgId, user } = useUser();
    const isEditMode = !!roomToEdit;
    
    const [buildings, setBuildings] = useState([]);
    const [availableTags, setAvailableTags] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    
    const [loading, setLoading] = useState(false);
    
    const [form, setForm] = useState({
        building_id: '',
        room_number: '',
        capacity: 10,
        description: '',
        selectedTags: []
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                setDataLoading(true);
                const [buildingsData, tagsData] = await Promise.all([
                    fetchBuildings(),
                    fetchTags()
                ]);
                setBuildings(buildingsData || []);
                setAvailableTags(tagsData || []);
                
                if (isEditMode) {
                    setForm({
                        building_id: roomToEdit.id_building,
                        room_number: roomToEdit.room_number,
                        capacity: roomToEdit.capacity,
                        description: roomToEdit.description,
                        selectedTags: roomToEdit.tag_rooms?.map(tr => tr.tag) || []
                    });
                } else if (buildingsData?.length > 0) {
                    setForm(prev => ({ ...prev, building_id: buildingsData[0].building_id }));
                }
            } catch (err) {
                tg?.showAlert("Ошибка загрузки данных");
            } finally {
                setDataLoading(false);
            }
        };
        loadData();
    }, [roomToEdit]);

    const toggleTag = (tagId) => {
        setForm(prev => ({
            ...prev,
            selectedTags: prev.selectedTags.includes(tagId)
                ? prev.selectedTags.filter(id => id !== tagId)
                : [...prev.selectedTags, tagId]
        }));
        tg?.HapticFeedback?.impactOccurred('light');
    };

     const handleSubmit = async () => {
        if (!form.room_number || !form.building_id) {
            tg?.showAlert("Заполните номер и корпус");
            return;
        }

        setLoading(true);
        try {
            let result;
            const roomData = {
                room_number: form.room_number,
                building_id: form.building_id,
                capacity: form.capacity,
                description: form.description,
                selectedTags: form.selectedTags
            };

            if (isEditMode) {
                // 🆕 Вызываем API обновления (нужно добавить в api.js)
                // result = await updateRoom(tgId, roomToEdit.id_room, roomData);
                tg?.showAlert("Метод обновления еще не подключен в api.js");
            } else {
                result = await createRoom(tgId, roomData);
            }

            if (result?.success) {
                tg?.HapticFeedback?.notificationOccurred('success');
                tg?.showAlert(isEditMode ? "✅ Данные обновлены!" : "✅ Комната создана!");
                goBack();
            }
        } catch (e) {
            tg?.showAlert("Ошибка: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (dataLoading) return <div className="cr-loader">⏳ Загрузка справочников...</div>;

    return (
        <div className="cr-container">
            <div className="cr-header">
                <h2 className="cr-title">{isEditMode ? '⚙️ Редактирование' : '🏗️ Новая комната'}</h2>
                <p className="cr-subtitle">{isEditMode ? `Изменение комнаты №${roomToEdit.room_number}` : 'Добавление в базу ВятГУ'}</p>
            </div>

            <div className="cr-form">
                <div className="cr-field">
                    <label>Корпус</label>
                    <div className="cr-select-wrapper">
                        <select 
                            value={form.building_id} 
                            onChange={e => setForm({...form, building_id: e.target.value})}
                        >
                            <option value="" disabled>Выберите корпус</option>
                            {buildings.map(b => (
                                <option key={b.building_id} value={b.building_id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="cr-row">
                    <div className="cr-field">
                        <label>Номер аудитории</label>
                        <input 
                            type="number" 
                            placeholder="Напр: 207" 
                            value={form.room_number}
                            onChange={e => setForm({...form, room_number: e.target.value})}
                        />
                    </div>

                    <div className="cr-field">
                        <label>Мест</label>
                        <input 
                            type="number" 
                            value={form.capacity}
                            onChange={e => setForm({...form, capacity: e.target.value})}
                        />
                    </div>
                </div>

                <div className="cr-field">
                    <label>Оснащение (теги)</label>
                    <div className="cr-tags-grid">
                        {availableTags.map(tag => (
                            <button
                                key={tag.tag_id}
                                type="button"
                                className={`cr-tag-item ${form.selectedTags.includes(tag.tag_id) ? 'active' : ''}`}
                                onClick={() => toggleTag(tag.tag_id)}
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="cr-field">
                    <label>Описание</label>
                    <textarea 
                        rows="3" 
                        placeholder="Опишите особенности комнаты..."
                        value={form.description}
                        onChange={e => setForm({...form, description: e.target.value})}
                    />
                </div>
            </div>

            <div className="cr-actions">
                <button className="cr-submit-btn" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Сохранение...' : (isEditMode ? 'Сохранить изменения' : 'Создать комнату')}
                </button>
                <button className="cr-back-btn" onClick={goBack}>Отмена</button>
            </div>
        </div>
    );
}