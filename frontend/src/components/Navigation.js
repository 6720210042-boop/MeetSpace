import React from 'react';
import '../styles/Navigation.css';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const Navigation = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const initial = (user?.name || 'U').charAt(0).toUpperCase();

  return (
    <nav className="navigation-bar">
      <div className="nav-left">
        <ul className="nav-links">
          <li>
            <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
              หน้าหลัก
            </Link>
          </li>
          <li>
            <Link to="/my-bookings" className={location.pathname === '/my-bookings' ? 'active' : ''}>
              การจองของฉัน
            </Link>
          </li>
          {user?.role === 'admin' && (
            <li>
              <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
                ผู้ดูแลระบบ
              </Link>
            </li>
          )}
        </ul>
      </div>

      <div className="nav-right">
        <div className="user-menu">
          <div className="user-avatar">{initial}</div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            ออกจากระบบ
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
