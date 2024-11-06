// src/App.js
import React from 'react';
import './App.css';
import EmailForm from './components/EmailForm';

const App = () => {
  return (
    <div className="App">
      <h1>Welcome! Create the Perfect Email with Ease</h1>
      <EmailForm />
    </div>
  );
};

export default App;
