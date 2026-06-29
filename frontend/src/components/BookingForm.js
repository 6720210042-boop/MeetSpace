import React, { useState } from 'react';
import '../styles/BookingForm.css';
import { bookingService } from '../services';

// Generate time slots 08:00 – 17:00 every 30 mins
function generateTimeSlots() {
  const slots = [];
  for (let h = 8; h <= 17; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 17 && m > 0) break;
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots(); // ['08:00','08:30',...,'17:00']

// Get today's date in YYYY-MM-DD (local time)
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Min date: 3 business days (Mon-Fri) from today
function minDateStr() {
  const d = new Date();
  let added = 0;
  while (added < 3) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++; // skip Saturday(6) and Sunday(0)
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Format date in Thai (Buddhist year)
function formatThaiDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

// Combine date + time string to ISO
function toISO(dateStr, timeStr) {
  if (!dateStr || !timeStr) return '';
  return `${dateStr}T${timeStr}:00`;
}

const BookingForm = ({ room, user, onSuccess, onClose }) => {
  const [dateStr, setDateStr] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [formData, setFormData] = useState({
    purpose: '',
    numberOfParticipants: Math.min(room.capacity || 1, 10),
    notes: '',
    requesterName: user?.name || '',
    requesterEmail: user?.email || '',
    requesterPhone: user?.phone || '',
    requesterDepartment: user?.department || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numberOfParticipants' ? Number(value) : value,
    }));
  };

  // Valid end time slots must be AFTER start time
  const validEndSlots = startTime
    ? TIME_SLOTS.filter(t => t > startTime)
    : [];

  const validate = () => {
    if (!dateStr) return 'กรุณาเลือกวันที่จอง';
    if (!startTime) return 'กรุณาเลือกเวลาเริ่มต้น';
    if (!endTime) return 'กรุณาเลือกเวลาสิ้นสุด';
    if (endTime <= startTime) return 'เวลาสิ้นสุดต้องหลังจากเวลาเริ่มต้น';

    const required = ['purpose','requesterName','requesterEmail','requesterPhone','requesterDepartment'];
    for (const f of required) {
      if (!String(formData[f] || '').trim()) {
        const labels = {
          purpose: 'วัตถุประสงค์',
          requesterName: 'ชื่อ-นามสกุล',
          requesterEmail: 'อีเมล',
          requesterPhone: 'เบอร์โทร',
          requesterDepartment: 'สาขา/หน่วยงาน',
        };
        return `กรุณากรอก${labels[f]}`;
      }
    }

    if (!formData.requesterEmail.endsWith('@tsu.ac.th')) {
      return 'กรุณาใช้อีเมล @tsu.ac.th เท่านั้น';
    }

    if (formData.numberOfParticipants < 1 || formData.numberOfParticipants > room.capacity) {
      return `จำนวนผู้เข้าร่วมต้องอยู่ระหว่าง 1 ถึง ${room.capacity} คน`;
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const err = validate();
    if (err) { setError(err); return; }

    try {
      setLoading(true);
      await bookingService.createBooking({
        roomId: room.id,
        startTime: toISO(dateStr, startTime),
        endTime: toISO(dateStr, endTime),
        ...formData,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'จองไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-form-overlay">
      <div className="booking-form-modal">
        <button className="close-btn" onClick={onClose} type="button">✕</button>

        <h2>📅 จองห้อง {room.name}</h2>

        <div className="room-summary">
          <span>📍 {room.building} ชั้น {room.floor}</span>
          <span>👥 รองรับ {room.capacity} คน</span>
        </div>

        {error && <div className="error-alert">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* ---- ข้อมูลวันเวลา ---- */}
          <div className="section-title">⏰ วันและเวลาที่ต้องการจอง</div>

          <div className="form-group">
            <label>วันที่จอง * <small>(ต้องจองล่วงหน้าอย่างน้อย 3 วันทำการ)</small></label>
            <input
              type="date"
              value={dateStr}
              min={minDateStr()}

              onChange={e => { setDateStr(e.target.value); setStartTime(''); setEndTime(''); }}
              required
            />
            {dateStr && (
              <small className="date-preview">📅 {formatThaiDate(dateStr)}</small>
            )}
          </div>

          <div className="time-row">
            <div className="form-group">
              <label>เวลาเริ่มต้น *</label>
              <select
                value={startTime}
                onChange={e => { setStartTime(e.target.value); setEndTime(''); }}
                disabled={!dateStr}
                required
              >
                <option value="">-- เลือกเวลา --</option>
                {TIME_SLOTS.filter(t => t < '17:00').map(t => (
                  <option key={t} value={t}>{t} น.</option>
                ))}
              </select>
            </div>

            <div className="time-arrow">→</div>

            <div className="form-group">
              <label>เวลาสิ้นสุด *</label>
              <select
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                disabled={!startTime}
                required
              >
                <option value="">-- เลือกเวลา --</option>
                {validEndSlots.map(t => (
                  <option key={t} value={t}>{t} น.</option>
                ))}
              </select>
            </div>
          </div>

          {startTime && endTime && (
            <div className="time-summary">
              ⏱ ระยะเวลา: {(() => {
                const [sh, sm] = startTime.split(':').map(Number);
                const [eh, em] = endTime.split(':').map(Number);
                const mins = (eh * 60 + em) - (sh * 60 + sm);
                const h = Math.floor(mins / 60);
                const m = mins % 60;
                return h > 0 ? `${h} ชั่วโมง${m > 0 ? ` ${m} นาที` : ''}` : `${m} นาที`;
              })()}
            </div>
          )}

          {/* ---- ข้อมูลผู้จอง ---- */}
          <div className="section-title">👤 ข้อมูลผู้จอง</div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>ชื่อ-นามสกุล *</label>
              <input
                type="text"
                name="requesterName"
                value={formData.requesterName}
                onChange={handleChange}
                placeholder="ชื่อ นามสกุล"
                required
              />
            </div>

            <div className="form-group">
              <label>อีเมล (@tsu.ac.th) *</label>
              <input
                type="email"
                name="requesterEmail"
                value={formData.requesterEmail}
                onChange={handleChange}
                placeholder="name@tsu.ac.th"
                required
              />
            </div>

            <div className="form-group">
              <label>เบอร์โทรศัพท์ *</label>
              <input
                type="tel"
                name="requesterPhone"
                value={formData.requesterPhone}
                onChange={handleChange}
                placeholder="08X-XXX-XXXX"
                required
              />
            </div>

            <div className="form-group">
              <label>สาขา / หน่วยงาน *</label>
              <input
                type="text"
                name="requesterDepartment"
                value={formData.requesterDepartment}
                onChange={handleChange}
                placeholder="เช่น วิทยาการคอมพิวเตอร์"
                required
              />
            </div>
          </div>

          {/* ---- รายละเอียดการจอง ---- */}
          <div className="section-title">📋 รายละเอียดการจอง</div>

          <div className="form-group">
            <label>วัตถุประสงค์ *</label>
            <input
              type="text"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="เช่น ประชุมกลุ่ม, สอบ, อบรม"
              required
            />
          </div>

          <div className="form-group">
            <label>จำนวนผู้เข้าร่วม * <small>(สูงสุด {room.capacity} คน)</small></label>
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
            <label>หมายเหตุ</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              placeholder="ความต้องการเพิ่มเติม (ถ้ามี)"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              ยกเลิก
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? '⏳ กำลังจอง...' : '✅ ยืนยันการจอง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
