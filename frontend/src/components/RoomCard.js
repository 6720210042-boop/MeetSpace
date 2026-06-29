import React from 'react';
import '../styles/RoomCard.css';

const STATUS_MAP = {
  available: { color: 'green', label: '✅ ว่าง' },
  occupied:  { color: 'red',   label: '🔴 ไม่ว่าง' },
  maintenance: { color: 'orange', label: '🔧 ปิดปรับปรุง' },
};

const EQUIPMENT_LABELS = {
  projector: '🎥 โปรเจคเตอร์',
  whiteboard: '✍️ ไวท์บอร์ด',
  videoConferencing: '📹 วิดีโอคอล',
  wifi: '📡 WiFi',
  airConditioning: '❄️ แอร์',
  microphone: '🎤 ไมโครโฟน',
};

const RoomCard = ({ room, onBook }) => {
  const statusInfo = STATUS_MAP[room.status] || { color: 'gray', label: room.status };
  const activeEquipment = room.equipment
    ? Object.entries(room.equipment).filter(([, v]) => v === true).map(([k]) => k)
    : [];

  return (
    <div className={`room-card ${room.status || 'available'}`}>
      <div className="room-card-body">
        <div className="room-header">
          <h3>{room.name}</h3>
          <span className={`status-indicator ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        <div className="room-info">
          <p>📍 {room.building}{room.floor ? `, ชั้น ${room.floor}` : ''}</p>
          <p>👥 รองรับ <strong>{room.capacity}</strong> คน</p>
        </div>

        {room.description && (
          <div className="room-description">{room.description}</div>
        )}

        {activeEquipment.length > 0 && (
          <div className="equipment-list">
            <span>อุปกรณ์</span>
            <div className="equipment-tags">
              {activeEquipment.map(k => (
                <span key={k} className="tag">{EQUIPMENT_LABELS[k] || k}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        className="book-btn"
        onClick={onBook}
        disabled={room.status !== 'available'}
      >
        {room.status === 'available' ? '📅 จองห้องนี้' : 'ไม่สามารถจองได้'}
      </button>
    </div>
  );
};

export default RoomCard;
