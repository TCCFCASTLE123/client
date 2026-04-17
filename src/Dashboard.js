// src/Dashboard.js
import React, { useEffect, useMemo, useState } from "react";

function getToken() {
  return localStorage.getItem("token") || "";
}

// 🔴 SAME AS BACKEND
const STAFF_ALIASES = {
  aac: "aac",
  anahi: "aac",
  "anahi ayala": "aac",

  afl: "afl",
  angel: "afl",
  "angel lucero": "afl",

  bgl: "bgl",
  brianna: "bgl",
  "brianna lopez": "bgl",

  bag: "bag",
  brenda: "bag",
  "brenda garcia": "bag",

  cc: "cc",
  chris: "cc",
  "chris castle": "cc",

  clc: "clc",
  cass: "clc",
  cassandra: "clc",
  "cassandra castle": "clc",

  dt: "dt",
  dean: "dt",
  "dean turnbow": "dt",

  ild: "ild",
  itzayani: "ild",
  "itzayani luque": "ild",

  jmp: "jmp",
  janny: "jmp",
  "janny mancinas": "jmp",

  jh: "jh",
  josh: "jh",
  "josh hall": "jh",

  jwg: "jwg",
  jacob: "jwg",
  "jacob gray": "jwg",

  trd: "trd",
  tyler: "trd",
  "tyler durham": "trd",

  rp: "rp",
  rebeca: "rp",
  "rebeca perez": "rp",
};

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("all");

  const username = (localStorage.getItem("username") || "")
    .toLowerCase()
    .trim();

  const currentUserCode =
    STAFF_ALIASES[username] ||
    Object.keys(STAFF_ALIASES).find((key) =>
      username.includes(key)
    );

  useEffect(() => {
    async function load() {
      try {
        const [sRes, cRes, mRes] = await Promise.all([
          fetch(process.env.REACT_APP_API_URL + "/api/statuses", {
            headers: { Authorization: "Bearer " + getToken() },
          }),
          fetch(process.env.REACT_APP_API_URL + "/api/clients", {
            headers: { Authorization: "Bearer " + getToken() },
          }),
          fetch(process.env.REACT_APP_API_URL + "/api/messages", {
            headers: { Authorization: "Bearer " + getToken() },
          }),
        ]);

        const sJson = await sRes.json();
        const cJson = await cRes.json();
        const mJson = await mRes.json();

        setStatuses(Array.isArray(sJson) ? sJson : sJson.statuses || []);
        setClients(Array.isArray(cJson) ? cJson : cJson.clients || []);
        setMessages(Array.isArray(mJson) ? mJson : mJson.messages || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }

    load();
  }, []);

  const stats = useMemo(() => {
    const result = {
      set: 0,
      showed: 0,
      noShow: 0,
      cantHelp: 0,
      working: 0,
    };

    const visibleClients =
      viewMode === "mine"
        ? clients.filter((c) => {
            const setter = (c.appt_setter || "").toLowerCase();
            const ic = (c.ic || "").toLowerCase();
            return setter === currentUserCode || ic === currentUserCode;
          })
        : clients;

    visibleClients.forEach((c) => {
      const status = statuses.find(
        (s) => String(s.id) === String(c.status_id)
      )?.name;

      if (!status) return;

      const s = status.toLowerCase();

      if (s === "set") result.set++;
      else if (s === "showed") result.showed++;
      else if (s === "no show") result.noShow++;
      else if (s.includes("help")) result.cantHelp++;
      else if (s.includes("work")) result.working++;
    });

    return result;
  }, [clients, statuses, viewMode, currentUserCode]);

  const unreadMessages = messages
    .filter((m) => m.direction === "inbound")
    .slice(0, 5);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading dashboard...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Dashboard</h2>

        <div style={{ marginLeft: "auto" }}>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
            }}
          >
            <option value="mine">My Clients</option>
            <option value="all">All Clients</option>
          </select>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <Card label="Set" value={stats.set} color="#3b82f6" />
        <Card label="Showed" value={stats.showed} color="#10b981" />
        <Card label="No Show" value={stats.noShow} color="#ef4444" />
        <Card label="Can't Help" value={stats.cantHelp} color="#ef4444" />
        <Card label="Working" value={stats.working} color="#8b5cf6" />
      </div>

      {/* UNREAD MESSAGES */}
      <div style={{ marginTop: 30 }}>
        <h3>Unread Messages</h3>

        {unreadMessages.length === 0 ? (
          <div style={{ color: "#64748b" }}>No new messages</div>
        ) : (
          unreadMessages.map((m) => (
            <div
              key={m.id}
              style={{
                padding: 10,
                borderBottom: "1px solid #e2e8f0",
                cursor: "pointer",
              }}
            >
              <strong>{m.sender}</strong>: {m.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Card({ label, value, color }) {
  return (
    <div
      style={{
        flex: 1,
        background: "#fff",
        borderRadius: 12,
        padding: 16,
        borderTop: `4px solid ${color}`,
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
