import React, { useState, useEffect } from 'react';
import '../styles/MyBookings.css';
import { bookingService } from '../services';

const MyBookings = ({ user }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const fetchUserBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getUserBookings();
      setBookings(response.bookings);
    } catch (err) {
      setError('ไม่สามารถโหลดรายการการจองได้');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await bookingService.cancelBooking(bookingId);
        setBookings(bookings.filter(b => b.id !== bookingId));
        alert('Booking cancelled successfully');
      } catch (err) {
        alert('Failed to cancel booking');
      }
    }
  };

  const handleCheckIn = async (bookingId) => {
    try {
      await bookingService.checkInBooking(bookingId);
      fetchUserBookings();
      alert('Check-in successful');
    } catch (err) {
      alert('Failed to check in');
    }
  };

  const getFilteredBookings = () => {
    const now = new Date();
    switch(filter) {
      case 'upcoming':
        return bookings.filter(b => new Date(b.startTime) > now && b.status !== 'cancelled');
      case 'past':
        return bookings.filter(b => new Date(b.endTime) < now);
      case 'cancelled':
        return bookings.filter(b => b.status === 'cancelled');
      default:
        return bookings;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return <div className="mybookings-container"><p>กำลังโหลด...</p></div>;
  };

  const filteredBookings = getFilteredBookings();

  return (
    <div className="mybookings-container">
      <h1>การจองของฉัน</h1>

      {error && <div className="error-alert">{error}</div>}

      <div className="filter-tabs">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          ทั้งหมด ({bookings.length})
        </button>
        <button 
          className={filter === 'upcoming' ? 'active' : ''}
          onClick={() => setFilter('upcoming')}
        >
          การจองที่กำลังจะมาถึง
        </button>
        <button 
          className={filter === 'past' ? 'active' : ''}
          onClick={() => setFilter('past')}
        >
          การจองที่ผ่านมา
        </button>
        <button 
          className={filter === 'cancelled' ? 'active' : ''}
          onClick={() => setFilter('cancelled')}
        >
          การจองที่ถูกยกเลิก
        </button>
      </div>

      {filteredBookings.length === 0 ? (
        <p className="no-bookings">ยังไม่มีการจอง</p>
      ) : (
        <div className="bookings-list">
          {filteredBookings.map(booking => (
            <div key={booking.id} className="booking-card">
              <div className="booking-header">
                <h3>{booking.roomName || 'Unknown Room'}</h3>
                <span className={`status-badge ${booking.status}`}>
                  {booking.status}
                </span>
              </div>

              <div className="booking-details">
                <p><strong>เริ่ม:</strong> {formatDate(booking.startTime)}</p>
                <p><strong>สิ้นสุด:</strong> {formatDate(booking.endTime)}</p>
                <p><strong>วัตถุประสงค์:</strong> {booking.purpose}</p>
                <p><strong>ผู้เข้าร่วม:</strong> {booking.numberOfParticipants}</p>
              </div>

              <div className="booking-actions">
                {booking.status === 'confirmed' && new Date(booking.startTime) > new Date() && (
                  <>
                    <button 
                      className="btn-checkin"
                      onClick={() => handleCheckIn(booking.id)}
                    >
                      เช็คอิน
                    </button>
                    <button 
                      className="btn-cancel"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      ยกเลิก
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
