import React, { useState } from 'react';

// Import styles
import '../styles/Common.css';
import '../styles/Form.css';

const EmailForm = () => {
  const [subject, setSubject] = useState('');
  const [tone, setTone] = useState('');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!subject || !tone) {
      setResponse('Please provide both subject and tone.');
      setIsLoading(false);
      return;
    }

    const apiEndpoint = 'http://127.0.0.1:8000/generate-email';
    const requestData = { subject, tone };

    setResponse(null);

    fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP Error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('API response:', data);
        setResponse(data.email_body || 'No email generated. Try again.');
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('API error:', error.message);
        setResponse('An error occurred. Please try again.');
        setIsLoading(false);
      });
  };

  return (
    <div className="email-generator">
      <form className="email-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="subject">Subject:</label>
          <textarea
            id="subject"
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
            rows="3"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="tone">Tone:</label>
          <select
            id="tone"
            name="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            required
          >
            <option value="">Select tone</option>
            <option value="Formal">Formal</option>
            <option value="Casual">Casual</option>
            <option value="Friendly">Friendly</option>
            <option value="Persuasive">Persuasive</option>
            <option value="Concise">Concise</option>
            <option value="Empathetic">Empathetic</option>
            <option value="Neutral">Neutral</option>
            <option value="Encouraging">Encouraging</option>
          </select>
        </div>

        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </form>

      {response && (
        <div className="response-container">
          <h3>Generated Email:</h3>
          <div className="response-content">
            <p>{response}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailForm;