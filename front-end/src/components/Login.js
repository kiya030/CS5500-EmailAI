import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import '../styles/Common.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate for navigation

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    const apiEndpoint = 'http://127.0.0.1:8000/login';

    fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // Required for OAuth2PasswordRequestForm
      body: new URLSearchParams({ username: email, password }), // Proper formatting for form data
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Login failed');
        }
        return res.json();
      })
      .then((data) => {
        if (data.access_token) {
          localStorage.setItem('accessToken', data.access_token); // Save the token
          onLogin(); // Trigger parent state change
          navigate('/email-form'); // Redirect to Email Form page
        } else {
          setResponse(data.message || 'Login failed.');
        }
        setIsLoading(false);
      })
      .catch((error) => {
        setResponse('An error occurred. Please try again.');
        console.error(error);
        setIsLoading(false);
      });
  };

  const handleSignUpRedirect = () => {
    navigate('/signup'); // Redirect to the signup page
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button className="submit-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        {response && <div className="response-container">{response}</div>}
      </form>
      <div className="signup-redirect">
        <p>
          Don't have an account?{' '}
          <span className="signup-link" onClick={handleSignUpRedirect}>
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;