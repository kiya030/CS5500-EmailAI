import React, { useState } from 'react';

// Import styles
import '../styles/Common.css';
import '../styles/Form.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Define the API endpoint and request data
    const apiEndpoint = 'http://127.0.0.1:8000/login';
    const requestData = { email, password };

    // Clear the previous response before new submission
    setResponse(null);

    // Send data to the API
    fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Login response:', data);

        if (data.access_token) {
          // Save the token to localStorage
          localStorage.setItem('accessToken', data.access_token);

          // Call onLogin to update the login state
          onLogin();

          setResponse('Login successful!');
        } else {
          setResponse(data.message || 'Login failed. Please try again.');
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Login error:', error);
        setResponse('An error occurred. Please try again.');
        setIsLoading(false);
      });
  };

  return (
    <div className="login-page">
      <div className="welcome-message">
        <h1>Welcome to EmailAI</h1>
      </div>

      <form className="email-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
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
            placeholder="Enter your password"
            required
          />
        </div>

        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
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
    </div>
  );
};

Login.defaultProps = {
  onLogin: () => console.log('Default onLogin function called'),
};

export default Login;