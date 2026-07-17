import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css'; // Reuse Login styles for consistency
import { authService } from '../services';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ 
    name: '',
    email: '', 
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validations
    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      setLoading(false);
      return;
    }

    try {
      await authService.register(form.email, form.password, form.name, 'user');
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>MeetSpace</h1>
          <div className="login-content" style={{ textAlign: 'center' }}>
            <h2 style={{ color: '#10b981' }}>สมัครสมาชิกสำเร็จ! 🎉</h2>
            <p>ระบบกำลังพากลับไปยังหน้าเข้าสู่ระบบ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>MeetSpace</h1>
        <p className="subtitle">ระบบจองห้องประชุมคณะวิทยาศาสตร์และนวัตกรรม</p>

        <div className="login-content">
          <h2>สมัครสมาชิกใหม่</h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>ชื่อ-นามสกุล</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="สมชาย ใจดี"
                required
              />
            </div>

            <div className="form-group">
              <label>อีเมลมหาวิทยาลัย</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@tsu.ac.th"
                pattern=".*@tsu\.ac\.th"
                title="กรุณาใช้อีเมล @tsu.ac.th เท่านั้น"
                required
              />
            </div>

            <div className="form-group">
              <label>รหัสผ่าน</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                minLength="8"
                required
              />
            </div>

            <div className="form-group">
              <label>ยืนยันรหัสผ่าน</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                minLength="8"
                required
              />
            </div>

            <button className="google-login-btn" type="submit" disabled={loading} style={{ background: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer' }}>
              {loading ? 'กำลังสร้างบัญชี...' : 'สมัครสมาชิก'}
            </button>
            
            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
              มีบัญชีอยู่แล้ว? <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}>เข้าสู่ระบบที่นี่</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
