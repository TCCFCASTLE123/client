import React, { useState, useEffect } from "react";
import "./App.css";
import Login from "./Login";
import Inbox from "./inbox/InboxContainer";
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className="app-header">
      <img
        src={process.env.PUBLIC_URL + "/castle-logo.png"}
        className="app-logo"
        alt="Castle Consulting Logo"
        style={{
          height: isMobile ? 50 : 100,
          marginBottom: isMobile ? 8 : 16,
        }}
      />

      <h1 style={{ fontSize: isMobile ? 22 : 48, margin: 0 }}>
        Castle Consulting Messaging
      </h1>

      {!isMobile && <p>Welcome! You are logged in.</p>}

      <nav
        style={{
          marginTop: isMobile ? 10 : 16,
          display: "flex",
          justifyContent: "center",
          gap: isMobile ? 14 : 18,
          flexWrap: "wrap",
          fontSize: isMobile ? 14 : 16,
        }}
      >
        <Link to="/inbox" style={{ fontWeight: 700 }}>
          Inbox
        </Link>

        <Link to="/clients" style={{ fontWeight: 700 }}>
          Clients
        </Link>

        <Link
          to="/admin/templates"
          style={{ fontWeight: 700, color: "#2774e6" }}
        >
          Admin
        </Link>
      </nav>

      <button
        style={{
          position: isMobile ? "static" : "absolute",
          marginTop: isMobile ? 12 : 0,
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

<main
  style={{
    flex: 1,
    minHeight: 0,   // 👈 THIS is the important one
    display: "flex",
    flexDirection: "column",
  }}
>
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
