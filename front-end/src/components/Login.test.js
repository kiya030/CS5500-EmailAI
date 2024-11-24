import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';

// Mock the fetch API
global.fetch = jest.fn();

describe('Login Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders login form correctly', () => {
    render(<Login onLogin={jest.fn()} />);

    // Check if form elements are rendered
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('allows user to input email and password', () => {
    render(<Login onLogin={jest.fn()} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('displays loading state and handles successful login', async () => {
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({ success: true, message: 'Login successful!' }),
    });

    const onLoginMock = jest.fn();
    render(<Login onLogin={onLoginMock} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Check loading state
    expect(screen.getByRole('button', { name: /logging in.../i })).toBeDisabled();

    // Wait for response
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
      });

      expect(screen.getByText(/response:/i)).toBeInTheDocument();
      expect(screen.getByText(/login successful!/i)).toBeInTheDocument();
      expect(onLoginMock).toHaveBeenCalledTimes(1);
    });
  });

  test('handles login error gracefully', async () => {
    // Mock API error
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<Login onLogin={jest.fn()} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText(/response:/i)).toBeInTheDocument();
      expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
    });

    // Ensure loading state is removed
    expect(screen.getByRole('button', { name: /login/i })).not.toBeDisabled();
  });

  test('displays server error message if login fails', async () => {
    // Mock API response with a server error message
    fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({ success: false, message: 'Invalid credentials' }),
    });

    render(<Login onLogin={jest.fn()} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // Wait for server response
    await waitFor(() => {
      expect(screen.getByText(/response:/i)).toBeInTheDocument();
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
