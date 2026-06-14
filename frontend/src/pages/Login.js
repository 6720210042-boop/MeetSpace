import React, { useState } from 'react';
import '../styles/Login.css';
import { authService } from '../services';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(form.email, form.password);
      onLogin(res.user, res.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'เข้าสู่ระบบล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  const handleRegChange = (e) => {
    const { name, value } = e.target;
    setRegForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authService.register(regForm.email, regForm.password, regForm.name);
      // auto-login after register
      const res = await authService.login(regForm.email, regForm.password);
      onLogin(res.user, res.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'สมัครสมาชิกล้มเหลว');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>MeetSpace</h1>
        <p className="subtitle">ระบบจองห้องประชุม มหาวิทยาลัย</p>
        
        <div className="login-content">
          <h2>เข้าสู่ระบบ</h2>

          {error && <div className="error-message">{error}</div>}

          {!isRegister && (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>อีเมล</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>รหัสผ่าน</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required />
              </div>

              <button className="google-login-btn" type="submit" disabled={loading}>
                {loading ? 'กำลังเข้าสู่ระบบ...' : '🔐 เข้าสู่ระบบ'}
              </button>
            </form>
          )}

          {isRegister && (
            <form onSubmit={handleRegister} className="login-form">
              <div className="form-group">
                <label>ชื่อ</label>
                <input type="text" name="name" value={regForm.name} onChange={handleRegChange} required />
              </div>
              <div className="form-group">
                <label>อีเมล</label>
                <input type="email" name="email" value={regForm.email} onChange={handleRegChange} required />
              </div>
              <div className="form-group">
                <label>รหัสผ่าน</label>
                <input type="password" name="password" value={regForm.password} onChange={handleRegChange} required />
              </div>

              <button className="google-login-btn" type="submit" disabled={loading}>
                {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
              </button>
            </form>
          )}

          <p className="login-info">
            {!isRegister ? (
              <>
                ยังไม่มีบัญชี? <button className="link-btn" onClick={() => setIsRegister(true)}>สมัครสมาชิก</button>
              </>
            ) : (
              <>
                มีบัญชีแล้ว? <button className="link-btn" onClick={() => setIsRegister(false)}>กลับไปหน้าเข้าสู่ระบบ</button>
              </>
            )}
          </p>
        </div>

        <div className="features">
          <h3>คุณสมบัติ</h3>
          <ul>
            <li>✓ ตรวจสอบสถานะห้องแบบเรียลไทม์</li>
            <li>✓ จองห้องออนไลน์ง่าย ๆ</li>
            <li>✓ กรองห้องตามอุปกรณ์และขนาด</li>
            <li>✓ รายงานการใช้งาน</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
