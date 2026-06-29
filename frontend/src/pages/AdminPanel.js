import React, { useState, useEffect } from 'react';
import '../styles/AdminPanel.css';
import { reportService } from '../services';
import RoomManagement from '../components/RoomManagement';
import ReportsDashboard from '../components/ReportsDashboard';
import NoShowManagement from '../components/NoShowManagement';
import AdminBookings from '../components/AdminBookings';

const AdminPanel = ({ user }) => {
  const [activeTab, setActiveTab] = useState('bookings');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await reportService.getUsageStats();
      setStats(response.stats);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="admin-panel-container"><p>ต้องการสิทธิ์ผู้ดูแลระบบ</p></div>;
  }

  return (
    <div className="admin-panel-container">
      <header className="admin-header">
        <h1>แผงผู้ดูแลระบบ</h1>
        <p>จัดการห้อง การจอง และดูรายงาน</p>
      </header>

      <div className="admin-tabs">
        <button
          className={activeTab === 'bookings' ? 'active' : ''}
          onClick={() => setActiveTab('bookings')}
        >
          📋 รายการจองทั้งหมด
        </button>
        <button
          className={activeTab === 'rooms' ? 'active' : ''}
          onClick={() => setActiveTab('rooms')}
        >
          🏢 จัดการห้อง
        </button>
        <button
          className={activeTab === 'noshow' ? 'active' : ''}
          onClick={() => setActiveTab('noshow')}
        >
          ⏰ เลยเวลา (No-Show)
        </button>
        <button
          className={activeTab === 'reports' ? 'active' : ''}
          onClick={() => setActiveTab('reports')}
        >
          📊 รายงาน & สถิติ
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'bookings' && <AdminBookings />}
        {activeTab === 'rooms' && <RoomManagement />}
        {activeTab === 'noshow' && <NoShowManagement />}
        {activeTab === 'reports' && <ReportsDashboard stats={stats} loading={loading} />}
      </div>
    </div>
  );
};

export default AdminPanel;
