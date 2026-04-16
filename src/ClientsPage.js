// src/ClientsPage.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function getToken() {
  return localStorage.getItem("token") || "";
}

function redirectToLogin() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

function safeTime(ts) {
  const d = ts ? new Date(ts) : null;
  return d && !isNaN(d.getTime()) ? d.getTime() : 0;
}

function canonicalPhone(input) {
  const digits = String(input || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

function formatPhone10(raw) {
  const d = canonicalPhone(raw);
  if (d.length !== 10) return raw || "";
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function ClientsPage() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [statusId, setStatusId] = useState("");
  const [office, setOffice] = useState("");
  const [caseType, setCaseType] = useState("");
  const [language, setLanguage] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [sRes, cRes] = await Promise.all([
          fetch(process.env.REACT_APP_API_URL + "/api/statuses", {
            headers: { Authorization: "Bearer " + getToken() },
          }),
          fetch(process.env.REACT_APP_API_URL + "/api/clients", {
            headers: { Authorization: "Bearer " + getToken() },
          }),
        ]);

        if (sRes.status === 401 || cRes.status === 401) {
          redirectToLogin();
          return;
        }

        const sJson = await sRes.json().catch(() => []);
        const cJson = await cRes.json().catch(() => []);

        if (cancelled) return;

        setStatuses(Array.isArray(sJson) ? sJson : sJson.statuses || []);
        setClients(Array.isArray(cJson) ? cJson : cJson.clients || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }

    load();
    return () => (cancelled = true);
  }, []);

  const filtered = useMemo(() => {
    let list = [...clients];

    if (q) {
      const qLower = q.toLowerCase();
      list = list.filter((c) =>
        (c.name || "").toLowerCase().includes(qLower)
      );
    }

    if (statusId) list = list.filter((c) => String(c.status_id) === statusId);
    if (office) list = list.filter((c) => c.office === office);
    if (caseType) list = list.filter((c) => c.case_type === caseType);
    if (language) list = list.filter((c) => c.language === language);

    if (unreadOnly) list = list.filter((c) => c.unreadCount > 0);

    list.sort(
      (a, b) =>
        safeTime(b.last_message_at) - safeTime(a.last_message_at)
    );

    return list;
  }, [clients, q, statusId, office, caseType, language, unreadOnly]);

  return (
    <div
      style={{
        height: "calc(100vh - 110px)",
        display: "flex",
        flexDirection: "column",
        padding: 16,
        background: "#f4f7fa",
        gap: 12,
      }}
    >
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Clients</h2>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => navigate("/inbox")}>Back</button>
          <button onClick={() => window.location.reload()}>Reset</button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div
        style={{
          background: "#fff",
          padding: 12,
          borderRadius: 12,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        <input
          placeholder="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select onChange={(e) => setStatusId(e.target.value)}>
          <option value="">Status</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <label>
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />
          Unread
        </label>
      </div>

      {/* TABLE AREA */}
      <div
        style={{
          flex: 1,
          background: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: 10, fontWeight: 600 }}>
          {filtered.length} clients
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          <table style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Office</th>
                <th>Case</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/inbox?clientId=${c.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{c.name}</td>
                  <td>{formatPhone10(c.phone)}</td>
                  <td>{c.office}</td>
                  <td>{c.case_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
