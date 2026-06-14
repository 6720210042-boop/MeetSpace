import React from 'react';
import '../styles/Navigation.css';
import { useNavigate, Link } from 'react-router-dom';

const Navigation = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navigation-bar">
      <div className="nav-left">
        <h2 className="nav-logo">MeetSpace</h2>
        <ul className="nav-links">
          <li><Link to="/dashboard">แผงควบคุม</Link></li>
          <li><Link to="/my-bookings">การจองของฉัน</Link></li>
          {user?.role === 'admin' && (
            <li><Link to="/admin">แผงผู้ดูแล</Link></li>
          )}
        </ul>
      </div>

      <div className="nav-right">
        <div className="user-menu">
          <span className="user-name">{user?.name}</span>
          <span className="user-role">{user?.role === 'admin' ? 'ผู้ดูแล' : 'ผู้ใช้'}</span>
          <button onClick={handleLogout} className="logout-btn">
            ออกจากระบบ
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
