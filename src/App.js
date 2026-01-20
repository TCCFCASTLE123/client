import React, { useState, useEffect } from "react";
import "./App.css";
import Login from "./Login";
import Inbox from "./Inbox";
import ClientsPage from "./ClientsPage";
import AdminTemplates from "./AdminTemplates";
import TemplateFormPage from "./TemplateFormPage";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

function NormalizePath() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Collapse multiple slashes (e.g. //inbox) into a single slash
    const fixedPathname = location.pathname.replace(/\/{2,}/g, "/");
    if (fixedPathname !== location.pathname) {
      navigate({ pathname: fixedPathname, search: location.search }, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  return null;
}

function Header({ onLogout }) {
  return (
    <header className="app-header">
      <img
        src={process.env.PUBLIC_URL + "/castle-logo.png"}
        className="app-logo"
        alt="Castle Consulting Logo"
        style={{ height: 100, marginBottom: 16 }}
      />
      <h1>Castle Consulting Messaging</h1>
      <p>Welcome! You are logged in.</p>

      <nav style={{ marginTop: 16 }}>
        <Link to="/inbox" style={{ marginRight: 18, fontWeight: 700 }}>
          Inbox
        </Link>

        <Link to="/clients" style={{ marginRight: 18, fontWeight: 700 }}>
          Clients
        </Link>

        <Link to="/admin/templates" style={{ fontWeight: 700, color: "#2774e6" }}>
          Admin
        </Link>
      </nav>

      <button
        style={{
          position: "absolute",
          right: 24,
          top: 24,
          padding: "6px 18px",
          borderRadius: 8,
          border: "none",
          background: "#283645",
          color: "#fff",
          cursor: "pointer",
          fontWeight: 700,
        }}
        onClick={onLogout}
      >
        Logout
      </button>
    </header>
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <Router>
      <NormalizePath />

      <div className="App">
        <Header
          onLogout={() => {
            localStorage.clear();
            setLoggedIn(false);
          }}
        />

        <main style={{ minHeight: "80vh" }}>
          <Routes>
            <Route path="/" element={<Navigate to="/inbox" replace />} />
            <Route path="/inbox" element={<Inbox />} />

            {/* NEW: Clients Page (filters + list) */}
            <Route path="/clients" element={<ClientsPage />} />

            <Route path="/admin/templates" element={<AdminTemplates />} />
            <Route path="/admin/templates/new" element={<TemplateFormPage />} />
            <Route path="/admin/templates/:id" element={<TemplateFormPage />} />

            <Route path="*" element={<Navigate to="/inbox" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
