import React, { useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Signup from './components/Signup';
import Login from './components/Login';
import EmailForm from './components/EmailForm';
import ProtectedComponent from './components/ProtectedComponent';

const App = () => {
  // State to track if the user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Function to handle login and update the login state
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // Function to handle logout and clear login state
  const handleLogout = () => {
    setIsLoggedIn(false);
    // Clear the access token (if used)
    localStorage.removeItem('accessToken');
  };

  return (
    <div>
      {/* Navigation Bar */}
      <nav className="navbar">
        <Link to="/">Home</Link> |{' '}
        {!isLoggedIn ? (
          <>
            <Link to="/signup">Sign Up</Link> | <Link to="/login">Login</Link>
          </>
        ) : (
          <>
            <Link to="/email-form">Email Form</Link> |{' '}
            <Link to="/protected">Protected</Link> |{' '}
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </nav>

      {/* Application Routes */}
      <Routes>
        {/* Home Route */}
        <Route
          path="/"
          element={
            <div className="home-page">
              <h2>Welcome to EmailAI</h2>
              {!isLoggedIn ? (
                <p>
                  <Link to="/login">Log in</Link> or{' '}
                  <Link to="/signup">Sign up</Link> to get started.
                </p>
              ) : (
                <p>
                  You are logged in. Access your{' '}
                  <Link to="/protected">Protected Page</Link>.
                </p>
              )}
            </div>
          }
        />

        {/* Signup Route */}
        <Route
          path="/signup"
          element={
            <Signup
              onSignup={() => {
                handleLogin(); // Log in after successful registration
              }}
            />
          }
        />

        {/* Login Route */}
        <Route
          path="/login"
          element={<Login onLogin={handleLogin} />}
        />

        {/* Email Form Route */}
        <Route
          path="/email-form"
          element={
            isLoggedIn ? (
              <EmailForm />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Protected Route */}
        <Route
          path="/protected"
          element={
            isLoggedIn ? (
              <ProtectedComponent />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </div>
  );
};

export default App;