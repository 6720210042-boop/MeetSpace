import React, { useState, useEffect, useCallback } from 'react';
import { bookingService } from '../services';
import '../styles/NoShowManagement.css';

function formatThaiDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  });
}

function getMinutesLate(startTimeStr) {
  // Parse the datetime from server — server stores in +07:00
  const start = new Date(startTimeStr);
  const now = new Date();
  return Math.floor((now - start) / (1000 * 60));
}

const NoShowManagement = () => {
  const [lateBookings, setLateBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchLateBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await bookingService.getAllBookings();
      const bookings = response.bookings || [];

      const now = new Date();

      // Filter: startTime has passed + 10 mins, still active, not checked in
      const late = bookings.filter(b => {
        if (b.checkedIn) return false;
        if (!['confirmed', 'pending', 'in-use'].includes(b.status)) return false;
        const startTime = new Date(b.startTime);
        if (isNaN(startTime.getTime())) return false;
        const diffMins = (now - startTime) / (1000 * 60);
        return diffMins >= 10;
      });

      // Sort by how late they are (most late first)
      late.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      setLateBookings(late);
      setLastUpdated(new Date().toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' }));
    } catch (error) {
      console.error('Failed to fetch late bookings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLateBookings();
    const interval = setInterval(fetchLateBookings, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchLateBookings]);

  const handleMarkNoShow = async (booking) => {
    const name = booking.requesterName || booking.userName || 'ผู้จอง';
    if (!window.confirm(`ยืนยันการทำเครื่องหมาย No-Show สำหรับ "${name}"?`)) return;
    setMessage(null);
    try {
      await bookingService.markNoShow(booking.id);
      setMessage({ type: 'success', text: `✅ บันทึก No-Show สำหรับ #${booking.id} แล้ว` });
      await fetchLateBookings();
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      setMessage({ type: 'error', text: `❌ ไม่สำเร็จ: ${msg}` });
    }
  };

  return (
    <div className="noshow-management">
      <div className="noshow-header">
        <div>
          <h2>⏰ รายการที่เลยเวลานัด (No-Show)</h2>
          <p className="noshow-desc">การจองที่ผ่านเวลาเริ่มต้นแล้ว 10 นาที และยังไม่เช็คอิน</p>
        </div>
        <div className="noshow-actions-top">
          <button className="btn-refresh" onClick={fetchLateBookings} disabled={loading}>
            {loading ? '⏳' : '🔄'} รีเฟรช
          </button>
          {lastUpdated && <span className="last-updated">อัปเดตล่าสุด {lastUpdated} น.</span>}
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {loading && lateBookings.length === 0 ? (
        <div className="noshow-loading">กำลังโหลด...</div>
      ) : lateBookings.length === 0 ? (
        <div className="noshow-empty">
          <div className="empty-icon">✅</div>
          <p>ไม่มีการจองที่เลยเวลา</p>
          <small>ระบบตรวจสอบทุก 1 นาทีโดยอัตโนมัติ</small>
        </div>
      ) : (
        <>
          <div className="noshow-count">
            พบ <strong>{lateBookings.length}</strong> รายการที่เลยเวลานัด
          </div>
          <div className="table-wrapper">
            <table className="noshow-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ห้อง</th>
                  <th>ผู้จอง</th>
                  <th>เบอร์โทร</th>
                  <th>วัตถุประสงค์</th>
                  <th>เวลาเริ่มนัด</th>
                  <th>เลยมาแล้ว</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {lateBookings.map(b => {
                  const minsLate = getMinutesLate(b.startTime);
                  const hoursLate = Math.floor(minsLate / 60);
                  const lateText = hoursLate > 0
                    ? `${hoursLate} ชม. ${minsLate % 60} นาที`
                    : `${minsLate} นาที`;
                  const name = b.requesterName || b.userName || '-';
                  const phone = b.requesterPhone || b.userPhone || '-';

                  return (
                    <tr key={b.id} className={minsLate >= 60 ? 'very-late' : 'late'}>
                      <td>{b.id}</td>
                      <td>
                        <div className="room-name">{b.roomName || '-'}</div>
                        {b.building && <div className="room-sub">{b.building}</div>}
                      </td>
                      <td>
                        <div>{name}</div>
                        <div className="sub-text">{b.requesterEmail || b.userEmail || ''}</div>
                      </td>
                      <td>{phone}</td>
                      <td>{b.purpose || '-'}</td>
                      <td>{formatThaiDateTime(b.startTime)}</td>
                      <td>
                        <span className={`late-badge ${minsLate >= 60 ? 'critical' : 'warning'}`}>
                          🕐 {lateText}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-noshow"
                          onClick={() => handleMarkNoShow(b)}
                        >
                          No-Show
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default NoShowManagement;
