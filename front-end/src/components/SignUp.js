import React, { useState } from "react"; // Import useState
import { Link } from "react-router-dom"; // Import Link for navigation

// Import styles
import '../styles/common.css';
import '../styles/Form.css';

const Signup = ({ onSignup }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Define the API endpoint and request data
    const apiEndpoint = 'http://127.0.0.1:8000/signup';
    const requestData = { name, email, password };

    // Clear the previous response before new submission
    setResponse(null);

    // Mock API call (replace with real backend when available)
    // setTimeout(() => {
    //   console.log("Signup data:", requestData);
    //   setIsLoading(false);
    //   setResponse("Signup successful! Please log in.");
    //   if (onSignup) onSignup();
    // }, 1000);

    /* Uncomment and use when backend is ready:   */
    fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Signup response:", data);
        setResponse(data.message || "Signup successful! Please log in.");
        setIsLoading(false);
        if (onSignup) onSignup(); // Handle transition after successful signup
      })
      .catch((error) => {
        console.error("Signup error:", error);
        setResponse("An error occurred. Please try again.");
        setIsLoading(false);
      });
  };

  return (
    <div className="signup-page">
      <div className="welcome-message">
        <h1>Welcome to EmailAI</h1>
        <p>Create your account below:</p>
      </div>

      <form className="email-form" onSubmit={handleSubmit}>
        <h2>Sign Up</h2>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
          />
        </div>

        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? "Signing up..." : "Sign Up"}
        </button>
      </form>

      {response && (
        <div className="response-container">
          <h3>Response:</h3>
          <div className="response-content">
            <p>{response}</p>
          </div>
        </div>
      )}

      {/* Add a link back to the login page */}
      <p>
        Already have an account? <Link to="/login">Log in here</Link>.
      </p>
    </div>
  );
};

export default Signup;