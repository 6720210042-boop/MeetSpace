import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import { roomService } from '../services';
import RoomCard from '../components/RoomCard';
import BookingForm from '../components/BookingForm';

const EQUIPMENT_OPTIONS = [
  { key: 'projector', label: '🎥 โปรเจคเตอร์' },
  { key: 'whiteboard', label: '✍️ ไวท์บอร์ด' },
  { key: 'videoConferencing', label: '📹 วิดีโอคอนเฟอเรนซ์' },
  { key: 'wifi', label: '📡 WiFi' },
  { key: 'airConditioning', label: '❄️ แอร์' },
  { key: 'microphone', label: '🎤 ไมโครโฟน' },
];

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    name: '',
    building: '',
    capacity: '',
    equipment: [],
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await roomService.getAllRooms();
      setRooms(response.rooms || []);
    } catch (err) {
      setError('โหลดห้องไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Computed filtered rooms — derived inline, no separate state needed
  const filteredRooms = useCallback(() => {
    let result = [...rooms];

    if (filters.name.trim()) {
      result = result.filter(r =>
        (r.name || '').toLowerCase().includes(filters.name.trim().toLowerCase())
      );
    }

    if (filters.building) {
      result = result.filter(r => r.building === filters.building);
    }

    if (filters.capacity !== '' && !isNaN(parseInt(filters.capacity, 10))) {
      const minCap = parseInt(filters.capacity, 10);
      result = result.filter(r => Number(r.capacity) >= minCap);
    }

    if (filters.equipment.length > 0) {
      result = result.filter(room => {
        // equipment could be a JSON string or already an object
        let eq = room.equipment;
        if (typeof eq === 'string') {
          try { eq = JSON.parse(eq); } catch { eq = {}; }
        }
        if (!eq || typeof eq !== 'object') return false;
        return filters.equipment.every(key => eq[key] === true);
      });
    }

    return result;
  }, [filters, rooms]);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFilters(prev => ({
        ...prev,
        equipment: checked
          ? [...prev.equipment, name]
          : prev.equipment.filter(eq => eq !== name),
      }));
    } else if (name === 'capacity') {
      // Don't allow negative
      const val = value === '' ? '' : String(Math.max(0, parseInt(value, 10) || 0));
      setFilters(prev => ({ ...prev, capacity: val }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleBookRoom = (room) => {
    setSelectedRoom(room);
    setShowBookingForm(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    setSelectedRoom(null);
    fetchRooms();
  };

  const displayed = filteredRooms();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>แดชบอร์ด MeetSpace</h1>
        <div className="user-info">
          <span>{user?.name}</span>
          <span className="role-badge">
            {user?.role === 'admin' ? 'ผู้ดูแล' : 'ผู้ใช้'}
          </span>
        </div>
      </header>

      {error && <div className="error-alert">{error}</div>}

      <div className="dashboard-content">
        <aside className="filters-sidebar">
          <h3>ตัวกรอง</h3>

          <div className="filter-group">
            <label>ชื่อห้อง:</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="ค้นหาชื่อห้อง"
            />
          </div>

          <div className="filter-group">
            <label>อาคาร:</label>
            <select name="building" value={filters.building} onChange={handleFilterChange}>
              <option value="">ทุกอาคาร</option>
              <option value="Building A">อาคาร A</option>
              <option value="Building B">อาคาร B</option>
              <option value="Building C">อาคาร C</option>
            </select>
          </div>

          <div className="filter-group">
            <label>ความจุขั้นต่ำ:</label>
            <input
              type="number"
              name="capacity"
              value={filters.capacity}
              onChange={handleFilterChange}
              placeholder="จำนวนคนขั้นต่ำ"
              min="0"
            />
          </div>

          <div className="filter-group">
            <label>อุปกรณ์:</label>
            <div className="checkbox-group">
              {EQUIPMENT_OPTIONS.map(({ key, label }) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    name={key}
                    checked={filters.equipment.includes(key)}
                    onChange={handleFilterChange}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <button onClick={fetchRooms} className="refresh-btn">
            🔄 รีเฟรช
          </button>
        </aside>

        <main className="rooms-section">
          <h2>
            {loading
              ? 'กำลังโหลด...'
              : `ห้องที่พบ (${displayed.length} ห้อง)`}
          </h2>

          {loading ? (
            <div className="loading-spinner">กำลังโหลดห้องประชุม...</div>
          ) : displayed.length === 0 ? (
            <p className="no-rooms">ไม่มีห้องที่ตรงกับเงื่อนไข</p>
          ) : (
            <div className="rooms-grid">
              {displayed.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onBook={() => handleBookRoom(room)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {showBookingForm && selectedRoom && (
        <BookingForm
          room={selectedRoom}
          user={user}
          onSuccess={handleBookingSuccess}
          onClose={() => setShowBookingForm(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
