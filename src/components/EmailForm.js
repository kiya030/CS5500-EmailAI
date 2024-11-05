// src/components/EmailForm.js
import React, { useState } from 'react';
import '../styles/Form.css';

const EmailForm = () => {
  const [subject, setSubject] = useState('');
  const [tone, setTone] = useState('');
  const [response, setResponse] = useState(null); // State for API response

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Define the API endpoint and request data
    const apiEndpoint = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3'; // Replace with actual API endpoint
    const requestData = { subject, tone };

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
        console.log("API response:", data);
        setResponse(data.generatedEmail || "Email generated successfully!"); // Display generated email or fallback message
      })
      .catch((error) => {
        console.error("API error:", error);
        setResponse("An error occurred. Please try again.");
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
            rows="3" // Adjust number of rows for more space
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

        <button type="submit" className="submit-button">Generate</button>
      </form>

      {/* Display API response */}
      {response && (
        <div className="response">
          <h3>Generated Email:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default EmailForm;