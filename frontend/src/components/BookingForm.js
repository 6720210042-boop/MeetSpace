import React, { useState } from 'react';
import '../styles/BookingForm.css';
import { bookingService } from '../services';

const BookingForm = ({ room, user, onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    purpose: '',
    numberOfParticipants: room.capacity,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numberOfParticipants' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

      // Validation
      if (!formData.startTime || !formData.endTime || !formData.purpose) {
        setError('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
      }

      if (new Date(formData.startTime) >= new Date(formData.endTime)) {
        setError('เวลาเริ่มต้องน้อยกว่าเวลาสิ้นสุด');
        return;
      }

      if (formData.numberOfParticipants > room.capacity) {
        setError(`จำนวนผู้เข้าร่วมต้องไม่เกินความจุของห้อง (${room.capacity})`);
        return;
      }

    try {
      setLoading(true);
      await bookingService.createBooking({
        roomId: room.id,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose,
        numberOfParticipants: formData.numberOfParticipants,
        notes: formData.notes
      });

      alert('สร้างการจองเรียบร้อยแล้ว!');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-form-overlay">
      <div className="booking-form-modal">
        <button className="close-btn" onClick={onClose}>✕</button>

        <h2>จอง {room.name}</h2>

        <div className="room-summary">
          <p><strong>อาคาร:</strong> {room.building}</p>
          <p><strong>ความจุ:</strong> {room.capacity} คน</p>
          <p><strong>ชั้น:</strong> {room.floor}</p>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>เวลาเริ่ม *</label>
            <input 
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>เวลาสิ้นสุด *</label>
            <input 
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>วัตถุประสงค์ *</label>
            <input 
              type="text"
              name="purpose"
              placeholder="เช่น ประชุมทีม, สอน, เวิร์กช็อป"
              value={formData.purpose}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>จำนวนผู้เข้าร่วม *</label>
            <input 
              type="number"
              name="numberOfParticipants"
              min="1"
              max={room.capacity}
              value={formData.numberOfParticipants}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>หมายเหตุเพิ่มเติม</label>
            <textarea 
              name="notes"
              placeholder="รายละเอียดหรือข้อกำหนดพิเศษ"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              ยกเลิก
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'กำลังจอง...' : 'ยืนยันการจอง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
