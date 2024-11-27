import React, { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Signup from "./components/Signup";
import Login from "./components/Login";
import EmailForm from "./components/EmailForm";

const App = () => {
  // Track if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Function to handle the login action
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <div>
      <Routes>
        {/* Route to SignUp component */}
        <Route path="/signup" element={<Signup onSignup={handleLogin} />} />

        {/* Route to Login component */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />

        {/* Route to EmailForm when logged in */}
        <Route
          path="/email-form"
          element={isLoggedIn ? <EmailForm /> : <Link to="/login">Please log in</Link>}
        />

        {/* Default route (Home page or first page) */}
        <Route
          path="/"
          element={
            <div className="home-page">
              <h2>Welcome to EmailAI</h2>
              <Link to="/signup">Sign Up</Link>
            </div>
          }
        />
      </Routes>
    </div>
  );
};

export default App;