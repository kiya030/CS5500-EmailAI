// src/components/Signup.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Common.css";
import "../styles/Form.css";

const Signup = ({ onSignup }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", { name, email, password }); // Debugging log
    setIsLoading(true);

    fetch("http://127.0.0.1:8000/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }), // No token required
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Signup failed");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Signup response:", data); // Debugging log
        setResponse(data.message || "Signup successful! Please log in.");
        setIsLoading(false);
        if (data.success) onSignup(); // Call onSignup if the signup is successful
      })
      .catch((error) => {
        console.error("Signup error:", error); // Debugging log
        setResponse("An error occurred. Please try again.");
        setIsLoading(false);
      });
  };

  return (
    <div className="signup-page">
      <div className="container">
        <h1>Signup Page</h1>
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
            <p>{response}</p>
          </div>
        )}

        <p>
          Already have an account? <Link to="/login">Log in here</Link>.
        </p>
      </div>
    </div>
  );
};

export default Signup;