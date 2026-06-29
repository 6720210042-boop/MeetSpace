import React, { useState, useEffect } from 'react';
import '../styles/RoomManagement.css';
import { roomService } from '../services';

const EQUIPMENT_LABELS = {
  projector: '🎥 โปรเจคเตอร์',
  whiteboard: '✍️ ไวท์บอร์ด',
  videoConferencing: '📹 วิดีโอคอนเฟอเรนซ์',
  wifi: '📡 WiFi',
  airConditioning: '❄️ แอร์',
  microphone: '🎤 ไมโครโฟน',
};

const DEFAULT_EQUIPMENT = {
  projector: false,
  whiteboard: false,
  videoConferencing: false,
  wifi: false,
  airConditioning: false,
  microphone: false,
};

// Parse equipment safely — handles JSON string or plain object
function parseEquipment(raw) {
  if (!raw) return { ...DEFAULT_EQUIPMENT };
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { return { ...DEFAULT_EQUIPMENT }; }
  }
  if (typeof raw !== 'object') return { ...DEFAULT_EQUIPMENT };
  return { ...DEFAULT_EQUIPMENT, ...raw };
}

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    floor: '',
    capacity: '',
    equipment: { ...DEFAULT_EQUIPMENT },
    description: '',
    status: 'available',
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomService.getAllRooms();
      setRooms(response.rooms || []);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('equipment.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        equipment: { ...prev.equipment, [key]: checked },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (editingRoom) {
        await roomService.updateRoom(editingRoom.id, {
          ...formData,
          floor: Number(formData.floor),
          capacity: Number(formData.capacity),
          // equipment is already a plain object — backend will JSON.stringify it
        });
        setMessage({ type: 'success', text: '✅ อัปเดตห้องสำเร็จแล้ว' });
      } else {
        await roomService.createRoom({
          ...formData,
          floor: Number(formData.floor),
          capacity: Number(formData.capacity),
        });
        setMessage({ type: 'success', text: '✅ เพิ่มห้องใหม่สำเร็จแล้ว' });
      }
      resetForm();
      fetchRooms();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด';
      setMessage({ type: 'error', text: '❌ ' + msg });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setMessage(null);
    setFormData({
      name: room.name || '',
      building: room.building || '',
      floor: room.floor ?? '',
      capacity: room.capacity ?? '',
      equipment: parseEquipment(room.equipment),
      description: room.description || '',
      status: room.status || 'available',
    });
    setShowForm(true);
    // scroll to form
    setTimeout(() => document.querySelector('.room-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('ยืนยันการลบห้องนี้?')) return;
    try {
      await roomService.deleteRoom(roomId);
      setMessage({ type: 'success', text: '✅ ลบห้องสำเร็จแล้ว' });
      fetchRooms();
    } catch (err) {
      const msg = err.response?.data?.message || 'ลบห้องไม่สำเร็จ';
      setMessage({ type: 'error', text: '❌ ' + msg });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      building: '',
      floor: '',
      capacity: '',
      equipment: { ...DEFAULT_EQUIPMENT },
      description: '',
      status: 'available',
    });
    setEditingRoom(null);
    setShowForm(false);
  };

  return (
    <div className="room-management">
      <div className="management-header">
        <h2>จัดการห้องประชุม</h2>
        <button className="btn-add" onClick={() => { setMessage(null); setShowForm(true); }}>
          ➕ เพิ่มห้องใหม่
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {showForm && (
        <form className="room-form" onSubmit={handleSubmit}>
          <h3>{editingRoom ? '✏️ แก้ไขห้อง' : '➕ สร้างห้องใหม่'}</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>ชื่อห้อง *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="เช่น ห้องประชุม 101"
                required
              />
            </div>

            <div className="form-group">
              <label>อาคาร *</label>
              <input
                type="text"
                name="building"
                value={formData.building}
                onChange={handleFormChange}
                placeholder="เช่น Building A"
                required
              />
            </div>

            <div className="form-group">
              <label>ชั้น *</label>
              <input
                type="number"
                name="floor"
                value={formData.floor}
                onChange={handleFormChange}
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>ความจุ (คน) *</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleFormChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>สถานะ</label>
              <select name="status" value={formData.status} onChange={handleFormChange}>
                <option value="available">ว่าง</option>
                <option value="occupied">ใช้งาน</option>
                <option value="maintenance">ปิดปรับปรุง</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>คำอธิบาย</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              rows="2"
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
            />
          </div>

          <div className="form-group">
            <label>อุปกรณ์ภายในห้อง</label>
            <div className="checkbox-group equipment-grid">
              {Object.keys(DEFAULT_EQUIPMENT).map(eq => (
                <label key={eq} className="checkbox-label">
                  <input
                    type="checkbox"
                    name={`equipment.${eq}`}
                    checked={!!formData.equipment[eq]}
                    onChange={handleFormChange}
                  />
                  {EQUIPMENT_LABELS[eq] || eq}
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={resetForm} className="btn-cancel">
              ยกเลิก
            </button>
            <button type="submit" className="btn-submit" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : editingRoom ? '💾 บันทึกการแก้ไข' : '➕ สร้างห้อง'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>กำลังโหลดข้อมูลห้อง...</p>
      ) : (
        <table className="rooms-table">
          <thead>
            <tr>
              <th>ชื่อห้อง</th>
              <th>อาคาร</th>
              <th>ชั้น</th>
              <th>ความจุ</th>
              <th>อุปกรณ์</th>
              <th>สถานะ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => {
              const eq = parseEquipment(room.equipment);
              const activeEq = Object.keys(eq).filter(k => eq[k]);
              return (
                <tr key={room.id}>
                  <td>{room.name}</td>
                  <td>{room.building}</td>
                  <td>{room.floor}</td>
                  <td>{room.capacity} คน</td>
                  <td>
                    <div className="eq-tags">
                      {activeEq.length === 0
                        ? <span className="eq-none">-</span>
                        : activeEq.map(k => (
                          <span key={k} className="eq-tag">{EQUIPMENT_LABELS[k]}</span>
                        ))}
                    </div>
                  </td>
                  <td>
                    <span className={`status ${room.status}`}>
                      {room.status === 'available' ? 'ว่าง' :
                       room.status === 'occupied' ? 'ใช้งาน' : 'ปิดปรับปรุง'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(room)}>✏️ แก้ไข</button>
                    <button className="btn-delete" onClick={() => handleDelete(room.id)}>🗑️ ลบ</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RoomManagement;
