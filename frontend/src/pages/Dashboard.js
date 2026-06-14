import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import { roomService, bookingService } from '../services';
import RoomCard from '../components/RoomCard';
import BookingForm from '../components/BookingForm';

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    building: '',
    capacity: '',
    equipment: []
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, rooms]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomService.getAllRooms();
      setRooms(response.rooms);
      setFilteredRooms(response.rooms);
    } catch (err) {
      setError('Failed to load rooms');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rooms];

    if (filters.building) {
      filtered = filtered.filter(r => r.building === filters.building);
    }

    if (filters.capacity) {
      filtered = filtered.filter(r => r.capacity >= parseInt(filters.capacity));
    }

    if (filters.equipment.length > 0) {
      filtered = filtered.filter(room => {
        return room.equipment && filters.equipment.every(eq => room.equipment[eq]);
      });
    }

    setFilteredRooms(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFilters(prev => ({
        ...prev,
        equipment: checked
          ? [...prev.equipment, name]
          : prev.equipment.filter(eq => eq !== name)
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBookRoom = (room) => {
    setSelectedRoom(room);
    setShowBookingForm(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    setSelectedRoom(null);
    // Refresh rooms or show success message
  };

  if (loading) {
    return <div className="dashboard-container"><p>กำลังโหลดห้อง...</p></div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>แดชบอร์ด MeetSpace</h1>
        <div className="user-info">
          <span>{user?.name}</span>
          <span className="role-badge">{user?.role === 'admin' ? 'ผู้ดูแล' : 'ผู้ใช้'}</span>
        </div>
      </header>

      {error && <div className="error-alert">{error}</div>}

      <div className="dashboard-content">
        <aside className="filters-sidebar">
          <h3>ตัวกรอง</h3>

          <div className="filter-group">
            <label>อาคาร:</label>
            <select
              name="building"
              value={filters.building}
              onChange={handleFilterChange}
            >
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
            />
          </div>

          <div className="filter-group">
            <label>อุปกรณ์:</label>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="projector"
                  checked={filters.equipment.includes('projector')}
                  onChange={handleFilterChange}
                />
                โปรเจคเตอร์
              </label>
              <label>
                <input
                  type="checkbox"
                  name="whiteboard"
                  checked={filters.equipment.includes('whiteboard')}
                  onChange={handleFilterChange}
                />
                กระดานไวท์บอร์ด
              </label>
              <label>
                <input
                  type="checkbox"
                  name="videoConferencing"
                  checked={filters.equipment.includes('videoConferencing')}
                  onChange={handleFilterChange}
                />
                วิดีโอคอนเฟอเรนซ์
              </label>
            </div>
          </div>

          <button onClick={fetchRooms} className="refresh-btn">
            🔄 รีเฟรช
          </button>
        </aside>

        <main className="rooms-section">
          <h2>ห้องว่าง ({filteredRooms.length})</h2>

          {filteredRooms.length === 0 ? (
            <p className="no-rooms">ไม่มีห้องที่ตรงกับเงื่อนไข</p>
          ) : (
            <div className="rooms-grid">
              {filteredRooms.map(room => (
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
