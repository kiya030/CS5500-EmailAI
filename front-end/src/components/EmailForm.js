// src/components/EmailForm.js
import React, { useState, useEffect } from 'react';
import { FaGoogle, FaMicrosoft, FaYahoo, FaEnvelope } from 'react-icons/fa'; // Import icons from react-icons

// Import styles
import '../styles/Common.css';
import '../styles/Form.css';

const EmailForm = () => {
  const [subject, setSubject] = useState('');
  const [tone, setTone] = useState('');
  const [historyResponse, setHistoryResponse] = useState("");
  const [generateResponse, setGenerateResponse] = useState(""); // For generate email
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [history, setHistory] = useState([]); // Stores email history
  const [isEditing, setIsEditing] = useState(false); // Controls editing state
  const [editedEmail, setEditedEmail] = useState(''); // Holds the edited email content
  const [showModal, setShowModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [refreshHistory, setRefreshHistory] = useState(false);
  const token = localStorage.getItem('accessToken'); // Retrieve the token stored during login

  // const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJraXlhIiwiZXhwIjoxNzMzODIwMTEwfQ.r9woDuK0jIFNnHQ7eV55gvdDWHCc1PCmTzTT4rt-9Rw";

  const copyToClipboard = () => {
    if (generateResponse) {
      navigator.clipboard.writeText(generateResponse).then(() => {
        alert("Copied to clipboard!");
      });
    }
  };
  
  // Fetch email history from the backend
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        // const token = localStorage.getItem("token"); // Retrieve the JWT token from localStorage (or any other storage mechanism)
        const response = await fetch("http://127.0.0.1:8000/email-history", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Include the token in the Authorization header
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Sort the history data by timestamp (newest first)
          const sortedData = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          setHistory(sortedData); // Update the history state
        } else if (response.status === 401) {
          // setResponse("Your session has expired. Please log in again.");
          // localStorage.removeItem("token");
          // window.location.href = "/login"; // Redirect to login page
        } else {
          const errorData = await response.json();
          setHistoryResponse(errorData.detail || "Error fetching history");
        }
      } catch (err) {
        console.error("API error:", err);
        setHistoryResponse("Unable to fetch history. Please try again later.");
      } finally {
        setIsLoading(false); // Stop the loading spinner
      }
    };

    fetchHistory();
  }, [refreshHistory]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsGenerating(true);

    // Define the API endpoint and request data
    const apiEndpoint = 'http://127.0.0.1:8000/generate-email';
    const requestData = { subject, tone };

    // Clear the previous response before new submission
    setGenerateResponse(null);

    // Send data to the API
    fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Include the token
      },
      body: JSON.stringify(requestData),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("API response:", data);
        setGenerateResponse(data.email_body); // Display generated email or fallback message
        setEditedEmail(data.email_body); // Initialize the edited email
        setIsGenerating(false);
        setRefreshHistory((prev) => !prev); // Trigger history fetch
        setGenerated(true);
      })
      .catch((error) => {
        console.error("API error:", error);
        setGenerateResponse("🚀 Model is warming up! Please retry in a few seconds.");
        setIsGenerating(false);
      });
  };

  // Redirect to email services
  const handleRedirect = (service) => {
    if (!setGenerateResponse) return;

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(isEditing ? editedEmail : generateResponse);
    let emailLink = '';

    switch (service) {
      case 'gmail':
        emailLink = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${encodedSubject}&body=${encodedBody}`;
        break;
      case 'outlook':
        emailLink = `https://outlook.live.com/owa/?path=/mail/action/compose&subject=${encodedSubject}&body=${encodedBody}`;
        break;
      case 'yahoo':
        emailLink = `https://compose.mail.yahoo.com/?subject=${encodedSubject}&body=${encodedBody}`;
        break;
      case 'default':
        emailLink = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
        break;
      default:
        return;
    }

    window.open(emailLink, '_blank'); // Opens the email service in a new tab
  };

  const handleShowModal = (email) => {
    setSelectedEmail(email); // Set the selected email content
    setShowModal(true); // Show the modal
  };

  const handleCloseModal = () => {
    setSelectedEmail(null); // Clear the selected email
    setShowModal(false); // Hide the modal
  };
 
  return (
    <div className="email-generator-container">
      {/* Side Panel for History */}
      <div className="side-panel">
        <h3>Email History</h3>
        {isLoading && <p>Loading...</p>}
        {!isLoading && !historyResponse && history.length === 0 && (
          <p>
            🧐 No email history found! <br />
            🌟 Start generating your first email now!
          </p>
        )}
        {!isLoading && !historyResponse && history.length > 0 && (
          <ul>
            {history.map((item) => (
              <li 
                key={item.id}
                onClick={() => handleShowModal(item)} // Attach onClick handler
                className="history-item"
              >
                <strong>{item.prompt}</strong>
                <p>
                  {item.generated_email.slice(0, 110)}... {/* Truncate email */}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Modal */}
      {showModal && selectedEmail && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="close-button" onClick={handleCloseModal}>✖</button>
            <div className="modal-content">
              <h3>{selectedEmail.prompt}</h3>
              <p className="email-body">{selectedEmail.generated_email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Panel */}
      <div className="main-panel">
        {/* Heading */}
        <h1>Welcome to EmailCraft! Create the Perfect Email 📧 with Ease</h1>
        {/* Email Form */}
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
            {isGenerating
              ? 'Generating...'
              : generated
              ? 'Regenerate'
              : 'Generate'}
          </button>
        </form>

        {/* Generated Email and Editing */}
        {generateResponse && (
          <div className="response-container">
            {isEditing ? (
              <textarea
                className="editable-email"
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
                rows="20"
              />
            ) : (
              <div className="response-content">
                <h3>Generated Email:</h3>
                <p>{generateResponse}</p>
                <div className="response-actions">
                  {/* Copy to Clipboard Button */}
                  <button onClick={copyToClipboard} className="copy-button">
                    Copy
                  </button>
                </div>
              </div>
            )}

            <button
              className="edit-toggle-button"
              onClick={() => {
                setIsEditing(!isEditing);
                if (isEditing) {
                  setGenerateResponse(editedEmail); // Remove original email from display after editing
                }
              }}
            >
              {isEditing ? 'Save' : 'Edit'}
            </button>
   
            {/* Email Service Icons */}
            <div className="email-icons">
              <FaGoogle
                className="email-icon"
                onClick={() => handleRedirect('gmail')}
                title="Gmail"
                style={{ cursor: 'pointer', margin: '0 10px', fontSize: '24px' }}
              />
              <FaMicrosoft
                className="email-icon"
                onClick={() => handleRedirect('outlook')}
                title="Outlook"
                style={{ cursor: 'pointer', margin: '0 10px', fontSize: '24px' }}
              />
              <FaYahoo
                className="email-icon"
                onClick={() => handleRedirect('yahoo')}
                title="Yahoo Mail"
                style={{ cursor: 'pointer', margin: '0 10px', fontSize: '24px' }}
              />
              <FaEnvelope
                className="email-icon"
                onClick={() => handleRedirect('default')}
                title="Default Email Client"
                style={{ cursor: 'pointer', margin: '0 10px', fontSize: '24px' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailForm;