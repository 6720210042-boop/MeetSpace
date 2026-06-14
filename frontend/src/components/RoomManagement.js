import React, { useState, useEffect } from 'react';
import '../styles/RoomManagement.css';
import { roomService } from '../services';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    floor: '',
    capacity: '',
    equipment: {
      projector: false,
      whiteboard: false,
      videoConferencing: false,
      wifi: false,
      airConditioning: false,
      microphone: false
    },
    description: ''
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomService.getAllRooms();
      setRooms(response.rooms);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith('equipment.')) {
      const equipmentKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        equipment: {
          ...prev.equipment,
          [equipmentKey]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingRoom) {
        await roomService.updateRoom(editingRoom.id, formData);
        alert('Room updated successfully');
      } else {
        await roomService.createRoom(formData);
        alert('Room created successfully');
      }
      resetForm();
      fetchRooms();
    } catch (err) {
      alert('Error saving room: ' + err.message);
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      building: room.building,
      floor: room.floor,
      capacity: room.capacity,
      equipment: room.equipment,
      description: room.description
    });
    setShowForm(true);
  };

  const handleDelete = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await roomService.deleteRoom(roomId);
        alert('Room deleted successfully');
        fetchRooms();
      } catch (err) {
        alert('Error deleting room');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      building: '',
      floor: '',
      capacity: '',
      equipment: {
        projector: false,
        whiteboard: false,
        videoConferencing: false,
        wifi: false,
        airConditioning: false,
        microphone: false
      },
      description: ''
    });
    setEditingRoom(null);
    setShowForm(false);
  };

  return (
    <div className="room-management">
      <div className="management-header">
        <h2>Room Management</h2>
        <button className="btn-add" onClick={() => setShowForm(true)}>
          ➕ Add New Room
        </button>
      </div>

      {showForm && (
        <form className="room-form" onSubmit={handleSubmit}>
          <h3>{editingRoom ? 'Edit Room' : 'Create New Room'}</h3>

          <div className="form-grid">
            <div className="form-group">
              <label>Room Name *</label>
              <input 
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Building *</label>
              <input 
                type="text"
                name="building"
                value={formData.building}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Floor *</label>
              <input 
                type="number"
                name="floor"
                value={formData.floor}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Capacity *</label>
              <input 
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              rows="3"
            ></textarea>
          </div>

          <div className="form-group">
            <label>Equipment</label>
            <div className="checkbox-group">
              {Object.keys(formData.equipment).map(eq => (
                <label key={eq}>
                  <input 
                    type="checkbox"
                    name={`equipment.${eq}`}
                    checked={formData.equipment[eq]}
                    onChange={handleFormChange}
                  />
                  {eq.charAt(0).toUpperCase() + eq.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={resetForm} className="btn-cancel">Cancel</button>
            <button type="submit" className="btn-submit">
              {editingRoom ? 'Update' : 'Create'} Room
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading rooms...</p>
      ) : (
        <table className="rooms-table">
          <thead>
            <tr>
              <th>Room Name</th>
              <th>Building</th>
              <th>Floor</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id}>
                <td>{room.name}</td>
                <td>{room.building}</td>
                <td>{room.floor}</td>
                <td>{room.capacity}</td>
                <td><span className={`status ${room.status}`}>{room.status}</span></td>
                <td>
                  <button className="btn-edit" onClick={() => handleEdit(room)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(room.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RoomManagement;
