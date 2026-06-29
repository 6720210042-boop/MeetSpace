import React, { useState, useEffect } from 'react';
import '../styles/MyBookings.css';
import { bookingService } from '../services';

const STATUS_LABEL = {
  confirmed: { text: 'ยืนยันแล้ว', cls: 'confirmed' },
  pending: { text: 'รอดำเนินการ', cls: 'pending' },
  cancelled: { text: 'ยกเลิกแล้ว', cls: 'cancelled' },
  'in-use': { text: 'กำลังใช้งาน', cls: 'in-use' },
  completed: { text: 'เสร็จสิ้น', cls: 'completed' },
  'no-show': { text: 'ไม่มาตามนัด', cls: 'no-show' },
};

function formatThaiDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  });
}

function formatThaiTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  });
}

const MyBookings = ({ user }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const fetchUserBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bookingService.getUserBookings();
      setBookings(response.bookings || []);
    } catch (err) {
      setError('ไม่สามารถโหลดรายการการจองได้');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('ยืนยันการยกเลิกการจองนี้?')) return;
    setCancellingId(bookingId);
    try {
      await bookingService.cancelBooking(bookingId);
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
      ));
    } catch (err) {
      alert(err.response?.data?.message || 'ยกเลิกไม่สำเร็จ');
    } finally {
      setCancellingId(null);
    }
  };

  const getFilteredBookings = () => {
    const now = new Date();
    switch (filter) {
      case 'upcoming':
        return bookings.filter(b => new Date(b.startTime) > now && !['cancelled','completed','no-show'].includes(b.status));
      case 'past':
        return bookings.filter(b => new Date(b.endTime) < now || ['completed','no-show'].includes(b.status));
      case 'cancelled':
        return bookings.filter(b => b.status === 'cancelled');
      default:
        return bookings;
    }
  };

  const canCancel = (b) => {
    return ['confirmed','pending'].includes(b.status) && new Date(b.startTime) > new Date();
  };

  const filteredBookings = getFilteredBookings();

  return (
    <div className="mybookings-container">
      <h1>📋 การจองของฉัน</h1>

      {error && <div className="error-alert">{error}</div>}

      <div className="filter-tabs">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          ทั้งหมด ({bookings.length})
        </button>
        <button className={filter === 'upcoming' ? 'active' : ''} onClick={() => setFilter('upcoming')}>
          ที่กำลังจะมาถึง
        </button>
        <button className={filter === 'past' ? 'active' : ''} onClick={() => setFilter('past')}>
          ผ่านมาแล้ว
        </button>
        <button className={filter === 'cancelled' ? 'active' : ''} onClick={() => setFilter('cancelled')}>
          ยกเลิกแล้ว
        </button>
      </div>

      {loading ? (
        <div className="loading-text">กำลังโหลดรายการการจอง...</div>
      ) : filteredBookings.length === 0 ? (
        <p className="no-bookings">ไม่มีรายการการจอง</p>
      ) : (
        <div className="bookings-list">
          {filteredBookings.map(booking => {
            const statusInfo = STATUS_LABEL[booking.status] || { text: booking.status, cls: '' };
            return (
              <div key={booking.id} className={`booking-card ${booking.status}`}>
                <div className="booking-header">
                  <h3>🏢 {booking.roomName || 'ห้องประชุม'}</h3>
                  <span className={`status-badge ${statusInfo.cls}`}>
                    {statusInfo.text}
                  </span>
                </div>

                <div className="booking-details">
                  <div className="detail-row">
                    <span>📍</span>
                    <span>{booking.building || '-'}{booking.floor ? ` ชั้น ${booking.floor}` : ''}</span>
                  </div>
                  <div className="detail-row">
                    <span>📅</span>
                    <span>{formatThaiDateTime(booking.startTime)}</span>
                  </div>
                  <div className="detail-row">
                    <span>⏱</span>
                    <span>{formatThaiTime(booking.startTime)} – {formatThaiTime(booking.endTime)} น.</span>
                  </div>
                  <div className="detail-row">
                    <span>🎯</span>
                    <span>{booking.purpose}</span>
                  </div>
                  <div className="detail-row">
                    <span>👥</span>
                    <span>{booking.numberOfParticipants} คน</span>
                  </div>
                </div>

                {canCancel(booking) && (
                  <div className="booking-actions">
                    <button
                      className="btn-cancel-booking"
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                    >
                      {cancellingId === booking.id ? '⏳ กำลังยกเลิก...' : '🚫 ยกเลิกการจอง'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
