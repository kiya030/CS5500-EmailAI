import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import EmailForm from './components/EmailForm';
import ProtectedComponent from './components/ProtectedComponent';
import './styles/Common.css';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check for token on app load
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('accessToken');
  };

  return (
    <div>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={isLoggedIn ? '/email-form' : '/login'} replace />}
        />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route
          path="/email-form"
          element={isLoggedIn ? <EmailForm /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/protected"
          element={isLoggedIn ? <ProtectedComponent /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </div>
  );
};

export default App;