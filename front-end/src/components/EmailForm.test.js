import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailForm from './EmailForm';

// Mock fetch API
global.fetch = jest.fn();

describe('EmailForm Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('displays loading state and handles successful API response', async () => {
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({ email_body: 'Generated email content' }),
    });

    render(<EmailForm />);

    // Fill out the form
    const subjectInput = screen.getByLabelText(/subject/i);
    const toneSelect = screen.getByLabelText(/tone/i);
    const submitButton = screen.getByRole('button', { name: /generate/i });

    fireEvent.change(subjectInput, { target: { value: 'Project Update' } });
    fireEvent.change(toneSelect, { target: { value: 'Formal' } });
    fireEvent.click(submitButton);

    // Check loading state
    expect(submitButton).toHaveTextContent(/generating.../i);
    expect(submitButton).toBeDisabled();

    // Wait for the response
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'Project Update', tone: 'Formal' }),
      });
      expect(screen.getByText(/generated email:/i)).toBeInTheDocument();
      expect(screen.getByText(/generated email content/i)).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    fetch.mockRejectedValueOnce(new Error('API Error'));

    render(<EmailForm />);

    // Fill out the form
    const subjectInput = screen.getByLabelText(/subject/i);
    const toneSelect = screen.getByLabelText(/tone/i);
    const submitButton = screen.getByRole('button', { name: /generate/i });

    fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
    fireEvent.change(toneSelect, { target: { value: 'Friendly' } });
    fireEvent.click(submitButton);

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
    });

    // Check loading state is removed
    expect(submitButton).toHaveTextContent(/generate/i);
    expect(submitButton).not.toBeDisabled();
  });
});
