import React from 'react';
import '../styles/RoomCard.css';

const RoomCard = ({ room, onBook }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return 'green';
      case 'occupied': return 'red';
      case 'maintenance': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <div className="room-card">
      <div className="room-header">
        <h3>{room.name}</h3>
        <span className={`status-indicator ${getStatusColor(room.status)}`}>
          {room.status === 'available' ? 'ว่าง' : room.status === 'occupied' ? 'ใช้งาน' : 'ปิดปรับปรุง'}
        </span>
      </div>

      <div className="room-info">
        <p><strong>📍 อาคาร:</strong> {room.building}, ชั้น {room.floor}</p>
        <p><strong>👥 ความจุ:</strong> {room.capacity} คน</p>
        
        {room.description && (
          <p><strong>📝 คำอธิบาย:</strong> {room.description}</p>
        )}

        <div className="equipment-list">
          <strong>อุปกรณ์:</strong>
          <div className="equipment-tags">
            {room.equipment?.projector && <span className="tag">🎥 โปรเจคเตอร์</span>}
            {room.equipment?.whiteboard && <span className="tag">✍️ กระดานไวท์บอร์ด</span>}
            {room.equipment?.videoConferencing && <span className="tag">📹 วิดีโอคอล</span>}
            {room.equipment?.wifi && <span className="tag">📡 WiFi</span>}
            {room.equipment?.airConditioning && <span className="tag">❄️ แอร์</span>}
            {room.equipment?.microphone && <span className="tag">🎤 ไมโครโฟน</span>}
          </div>
        </div>
      </div>

      <button 
        className="book-btn"
        onClick={onBook}
        disabled={room.status !== 'available'}
      >
        {room.status === 'available' ? '📅 จองตอนนี้' : 'ไม่สามารถใช้ได้'}
      </button>
    </div>
  );
};

export default RoomCard;
