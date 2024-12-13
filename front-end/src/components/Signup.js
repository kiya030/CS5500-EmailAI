import React, { useState } from 'react';
import '../styles/Common.css';

const Signup = ({ onSignupSuccess }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verifyPassword, setVerifyPassword] = useState('');
    const [response, setResponse] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Updated endpoint for registration
        const apiEndpoint = 'http://127.0.0.1:8000/register';

        fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password,
                verify_password: verifyPassword, // Match the backend's field name
                email_address: email,
            }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.message === 'User registered successfully') {
                    setResponse('Registration successful! You can now log in.');
                    onSignupSuccess(); // Redirect to login
                } else {
                    setResponse(data.detail || 'Registration failed.');
                }
                setIsLoading(false);
            })
            .catch(() => {
                setResponse('An error occurred. Please try again.');
                setIsLoading(false);
            });
    };

    return (
        <div className="container">
            <form onSubmit={handleSubmit}>
                <h2>Signup</h2>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    required
                />
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)} // New email input
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
                <input
                    type="password"
                    value={verifyPassword}
                    onChange={(e) => setVerifyPassword(e.target.value)}
                    placeholder="Verify Password"
                    required
                />
                <button className="submit-button" type="submit" disabled={isLoading}>
                    {isLoading ? 'Signing up...' : 'Signup'}
                </button>
                {response && <div className="response-container">{response}</div>}
            </form>
            <div className="signup-redirect">
                Already have an account?{' '}
                <span
                    className="signup-link"
                    onClick={() => onSignupSuccess()}
                >
                    Log in here
                </span>
            </div>
        </div>
    );
};

export default Signup;