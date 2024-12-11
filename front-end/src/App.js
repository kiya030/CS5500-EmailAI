import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup'; // Import the Signup component
import EmailForm from './components/EmailForm';
import ProtectedComponent from './components/ProtectedComponent';
import './styles/Common.css';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate(); // Hook for navigation

  // Check for token on page load
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleSignupSuccess = () => {
    navigate('/login'); // Redirect to login page after successful signup
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
        <Route path="/signup" element={<Signup onSignupSuccess={handleSignupSuccess} />} />
        <Route
          path="/email-form"
          element={
            isLoggedIn ? (
              <EmailForm username="YourUsername" handleLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
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