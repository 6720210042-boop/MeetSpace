import React from 'react';
import '../styles/ReportsDashboard.css';

const ReportsDashboard = ({ stats, loading }) => {
  if (loading) {
    return <div className="reports-container"><p>Loading reports...</p></div>;
  }

  if (!stats) {
    return <div className="reports-container"><p>No data available</p></div>;
  }

  return (
    <div className="reports-container">
      <div className="stats-overview">
        <div className="stat-card">
          <h4>Total Bookings</h4>
          <p className="stat-value">{stats.totalBookings}</p>
        </div>

        <div className="stat-card">
          <h4>Total Hours Booked</h4>
          <p className="stat-value">{stats.totalHours.toFixed(2)}</p>
        </div>

        <div className="stat-card">
          <h4>Student Bookings</h4>
          <p className="stat-value">{stats.byRole.student || 0}</p>
        </div>

        <div className="stat-card">
          <h4>Teacher Bookings</h4>
          <p className="stat-value">{stats.byRole.teacher || 0}</p>
        </div>
      </div>

      <div className="reports-grid">
        <div className="report-section">
          <h3>Bookings by Room</h3>
          <ul>
            {Object.entries(stats.byRoom || {}).map(([room, count]) => (
              <li key={room}>
                <span>{room}</span>
                <span className="count">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="report-section">
          <h3>Bookings by Purpose</h3>
          <ul>
            {Object.entries(stats.byPurpose || {}).map(([purpose, count]) => (
              <li key={purpose}>
                <span>{purpose}</span>
                <span className="count">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="report-section">
        <h3>Top Users</h3>
        <ul>
          {Object.entries(stats.byUser || {}).slice(0, 10).map(([user, count]) => (
            <li key={user}>
              <span>{user}</span>
              <span className="count">{count} bookings</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReportsDashboard;
