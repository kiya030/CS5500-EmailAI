// src/App.js
import React, { useState } from "react"; // Import React and useState hook
import Login from "./components/Login"; // Import Login component
import EmailForm from "./components/EmailForm"; // Import EmailForm component

const App = () => {
  // Track if user is logged in
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Function to handle the login action
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <div>
      {/* Conditionally render based on isLoggedIn */}
      {isLoggedIn ? (
        <EmailForm />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;