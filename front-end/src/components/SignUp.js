import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Common.css';
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

    // Corrected API endpoint
    const apiEndpoint = 'http://127.0.0.1:8000/register';

    // Send data to the API
    fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Signup response:', data);

        if (data.success) {
          setResponse('Signup successful! Please log in.');
          onSignup();
        } else {
          setResponse(data.message || 'Signup failed. Please try again.');
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Signup error:', error);
        setResponse('An error occurred. Please try again.');
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
            {isLoading ? 'Signing up...' : 'Sign Up'}
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

Signup.defaultProps = {
  onSignup: () => console.log('Default onSignup function called'),
};

export default Signup;