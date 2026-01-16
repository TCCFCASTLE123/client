// src/ClientsPage.js
import React, { useEffect, useState, useMemo } from "react";

function getToken() {
  return localStorage.getItem("token") || "";
}

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL + "/api/clients", {
      headers: {
        Authorization: "Bearer " + getToken(),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.clients)
          ? data.clients
          : [];
        setClients(list);
      })
      .catch((err) => {
        console.error("Failed to load clients:", err);
      });
  }, []);

  const filtered = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  return (
    <div style={{ maxWidth: 1100, margin: "20px auto", padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>Clients</h2>

      <input
        type="text"
        placeholder="Search by name, phone, or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "10px 12px",
          marginBottom: 16,
          borderRadius: 8,
          border: "1px solid #cbd5e1",
          fontSize: 14,
        }}
      />

      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f8fafc" }}>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Phone</th>
              <th style={th}>Status</th>
              <th style={th}>Office</th>
              <th style={th}>Case</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} style={{ borderTop: "1px solid #e2e8f0" }}>
                <td style={td}>{c.name}</td>
                <td style={td}>{c.phone}</td>
                <td style={td}>{c.status_name || ""}</td>
                <td style={td}>{c.office || ""}</td>
                <td style={td}>{c.case_type || ""}</td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 16, textAlign: "center", color: "#64748b" }}>
                  No clients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "12px 14px",
  fontSize: 13,
  fontWeight: 800,
  color: "#334155",
};

const td = {
  padding: "12px 14px",
  fontSize: 14,
  color: "#334155",
};
