import React, { useState } from 'react';
import './App.css';
import Login from './Login';
import Inbox from './Inbox';
import AdminTemplates, { TemplateFormPage } from './AdminTemplates'; // <--- notice this import!
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

function Header({ onLogout }) {
  return (
    <header className="app-header">
      <img
        src={process.env.PUBLIC_URL + '/castle-logo.png'}
        className="app-logo"
        alt="Castle Consulting Logo"
        style={{ height: 100, marginBottom: 16 }}
      />
      <h1>Castle Consulting Messaging</h1>
      <p>Welcome! You are logged in.</p>
      <nav style={{ marginTop: 16 }}>
        <Link to="/" style={{ marginRight: 18, fontWeight: 600 }}>Inbox</Link>
        <Link to="/admin/templates" style={{ fontWeight: 600, color: '#2774e6' }}>Admin</Link>
      </nav>
      <button
        style={{
          position: 'absolute',
          right: 24,
          top: 24,
          padding: '6px 18px',
          borderRadius: 8,
          border: 'none',
          background: '#283645',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 600
        }}
        onClick={onLogout}
      >
        Logout
      </button>
    </header>
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <Router>
      <div className="App">
        <Header onLogout={() => {
          localStorage.clear();
          setLoggedIn(false);
        }} />
       <main className="app-main">
  <Routes>
    <Route path="/" element={<Inbox />} />
    <Route path="/admin/templates" element={<AdminTemplates />} />
    <Route path="/admin/templates/new" element={<TemplateFormPage />} />
    <Route path="/admin/templates/:id" element={<TemplateFormPage />} />
  </Routes>
</main>

      </div>
    </Router>
  );
}

export default App;
