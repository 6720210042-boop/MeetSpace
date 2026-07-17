import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyBookings from './pages/MyBookings';
import AdminPanel from './pages/AdminPanel';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  const { user, login, logout, isAuthenticated } = useAuth();

  const handleLogin = (userData, authToken) => {
    login(userData, authToken);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <Router>
      <div className="App">
        {isAuthenticated && <Navigation user={user} onLogout={handleLogout} />}
        
        <Routes>
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />}
          />

          <Route 
            path="/register" 
            element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />}
          />
          
          <Route 
            path="/dashboard" 
            element={isAuthenticated ? <Dashboard user={user} /> : <Navigate to="/login" />}
          />
          
          <Route 
            path="/my-bookings" 
            element={isAuthenticated ? <MyBookings user={user} /> : <Navigate to="/login" />}
          />
          
          <Route 
            path="/admin" 
            element={isAuthenticated ? <AdminPanel user={user} /> : <Navigate to="/login" />}
          />

          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
