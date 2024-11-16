// src/App.js
import React from 'react';
import Login from './components/Login';
import EmailForm from './components/EmailForm';
import './styles/Form.css'

function App() {
  return (
    <div className="App">
      <header>
        <h1>Welcome to My App</h1>
        <p>Generate emails or log in to access more features!</p>
      </header>
      <main>
        <section>
          <h2>Login Section</h2>
          <Login />
        </section>

        <section>
          <h2>Email Generator</h2>
          <EmailForm />
        </section>
      </main>
      <footer>
        <p>&copy; 2024 My App. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;