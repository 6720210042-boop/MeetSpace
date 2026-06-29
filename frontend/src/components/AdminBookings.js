import React, { useState, useEffect } from 'react';
import { bookingService } from '../services';
import '../styles/AdminBookings.css';

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
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  });
}

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '', search: '' });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const res = await bookingService.getAllBookings(params);
      setBookings(res.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('ยืนยันการยกเลิกการจองนี้?')) return;
    try {
      await bookingService.cancelBooking(id);
      setMessage({ type: 'success', text: '✅ ยกเลิกการจองแล้ว' });
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      setMessage({ type: 'error', text: '❌ ยกเลิกไม่สำเร็จ: ' + (err.response?.data?.message || err.message) });
    }
  };

  const handleMarkNoShow = async (id) => {
    if (!window.confirm('ยืนยันการทำเครื่องหมาย No-Show?')) return;
    try {
      await bookingService.markNoShow(id);
      setMessage({ type: 'success', text: '✅ บันทึก No-Show แล้ว' });
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      setMessage({ type: 'error', text: '❌ ' + (err.response?.data?.message || err.message) });
    }
  };

  const filtered = bookings.filter(b => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return (
      (b.userName || '').toLowerCase().includes(q) ||
      (b.userEmail || '').toLowerCase().includes(q) ||
      (b.requesterName || '').toLowerCase().includes(q) ||
      (b.requesterEmail || '').toLowerCase().includes(q) ||
      (b.roomName || '').toLowerCase().includes(q) ||
      (b.userStudentId || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="admin-bookings">
      <h2>📋 รายการจองทั้งหมด</h2>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {/* Filters */}
      <div className="booking-filters">
        <input
          type="text"
          placeholder="ค้นหา ชื่อ / อีเมล / รหัสนิสิต / ห้อง"
          value={filters.search}
          onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
        />
        <select value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}>
          <option value="">ทุกสถานะ</option>
          <option value="confirmed">ยืนยันแล้ว</option>
          <option value="pending">รอดำเนินการ</option>
          <option value="in-use">กำลังใช้งาน</option>
          <option value="completed">เสร็จสิ้น</option>
          <option value="cancelled">ยกเลิกแล้ว</option>
          <option value="no-show">No-Show</option>
        </select>
        <input type="date" value={filters.startDate}
          onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
          title="ตั้งแต่วันที่" />
        <input type="date" value={filters.endDate}
          onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
          title="ถึงวันที่" />
        <button className="btn-search" onClick={fetchBookings}>🔍 ค้นหา</button>
      </div>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <div className="table-wrapper">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ห้อง</th>
                <th>ผู้จอง</th>
                <th>รหัสนิสิต</th>
                <th>สาขา</th>
                <th>เบอร์โทร</th>
                <th>วัตถุประสงค์</th>
                <th>วันเวลาจอง</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="10" style={{textAlign:'center',color:'#aaa'}}>ไม่พบรายการ</td></tr>
              ) : filtered.map(b => {
                const status = STATUS_LABEL[b.status] || { text: b.status, cls: '' };
                const name = b.requesterName || b.userName || '-';
                const email = b.requesterEmail || b.userEmail || '-';
                const phone = b.requesterPhone || b.userPhone || '-';
                const dept = b.requesterDepartment || b.userDepartment || '-';
                const studentId = b.userStudentId || '-';
                return (
                  <tr key={b.id} onClick={() => setSelectedBooking(b)} className="clickable-row" title="คลิกเพื่อดูรายละเอียด">
                    <td>{b.id}</td>
                    <td>{b.roomName || '-'}</td>
                    <td>
                      <div>{name}</div>
                      <div className="sub-text">{email}</div>
                    </td>
                    <td>{studentId}</td>
                    <td>{dept}</td>
                    <td>{phone}</td>
                    <td>{b.purpose || '-'}</td>
                    <td>
                      <div>{formatThaiDateTime(b.startTime)}</div>
                      <div className="sub-text">ถึง {formatThaiDateTime(b.endTime)}</div>
                    </td>
                    <td><span className={`status-badge ${status.cls}`}>{status.text}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      {['confirmed','pending','in-use'].includes(b.status) && (
                        <>
                          <button className="btn-sm btn-cancel" onClick={() => handleCancelBooking(b.id)}>ยกเลิก</button>
                          <button className="btn-sm btn-noshow" onClick={() => handleMarkNoShow(b.id)}>No-Show</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {selectedBooking && (
        <div className="detail-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedBooking(null)}>✕</button>
            <h3>📋 รายละเอียดการจอง #{selectedBooking.id}</h3>

            <div className="detail-section">
              <h4>👤 ข้อมูลผู้จอง</h4>
              <table className="info-table">
                <tbody>
                  <tr><td>ชื่อ-นามสกุล</td><td>{selectedBooking.requesterName || selectedBooking.userName || '-'}</td></tr>
                  <tr><td>อีเมล</td><td>{selectedBooking.requesterEmail || selectedBooking.userEmail || '-'}</td></tr>
                  <tr><td>เบอร์โทรศัพท์</td><td>{selectedBooking.requesterPhone || selectedBooking.userPhone || '-'}</td></tr>
                  <tr><td>สาขา / หน่วยงาน</td><td>{selectedBooking.requesterDepartment || selectedBooking.userDepartment || '-'}</td></tr>
                  <tr><td>รหัสนิสิต</td><td>{selectedBooking.userStudentId || '-'}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="detail-section">
              <h4>🏢 รายละเอียดการจอง</h4>
              <table className="info-table">
                <tbody>
                  <tr><td>ห้อง</td><td>{selectedBooking.roomName || '-'}</td></tr>
                  <tr><td>อาคาร / ชั้น</td><td>{selectedBooking.building}{selectedBooking.floor ? ` ชั้น ${selectedBooking.floor}` : ''}</td></tr>
                  <tr><td>วัตถุประสงค์</td><td>{selectedBooking.purpose || '-'}</td></tr>
                  <tr><td>จำนวนผู้เข้าร่วม</td><td>{selectedBooking.numberOfParticipants} คน</td></tr>
                  <tr><td>เวลาเริ่ม</td><td>{formatThaiDateTime(selectedBooking.startTime)}</td></tr>
                  <tr><td>เวลาสิ้นสุด</td><td>{formatThaiDateTime(selectedBooking.endTime)}</td></tr>
                  <tr><td>สถานะ</td><td><span className={`status-badge ${STATUS_LABEL[selectedBooking.status]?.cls}`}>{STATUS_LABEL[selectedBooking.status]?.text}</span></td></tr>
                  {selectedBooking.notes && <tr><td>หมายเหตุ</td><td>{selectedBooking.notes}</td></tr>}
                </tbody>
              </table>
            </div>

            {['confirmed','pending','in-use'].includes(selectedBooking.status) && (
              <div className="detail-actions">
                <button className="btn-cancel" onClick={() => handleCancelBooking(selectedBooking.id)}>🚫 ยกเลิกการจอง</button>
                <button className="btn-noshow-lg" onClick={() => handleMarkNoShow(selectedBooking.id)}>⏰ บันทึก No-Show</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
