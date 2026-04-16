// src/Dashboard.js
import React, { useEffect, useMemo, useState } from "react";

function getToken() {
  return localStorage.getItem("token") || "";
}

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const [sRes, cRes] = await Promise.all([
          fetch(process.env.REACT_APP_API_URL + "/api/statuses", {
            headers: { Authorization: "Bearer " + getToken() },
          }),
          fetch(process.env.REACT_APP_API_URL + "/api/clients", {
            headers: { Authorization: "Bearer " + getToken() },
          }),
        ]);

        const sJson = await sRes.json();
        const cJson = await cRes.json();

        setStatuses(Array.isArray(sJson) ? sJson : sJson.statuses || []);
        setClients(Array.isArray(cJson) ? cJson : cJson.clients || []);
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

    clients.forEach((c) => {
      const status = statuses.find(
        (s) => String(s.id) === String(c.status_id)
      )?.name;

      if (!status) return;

      const s = status.toLowerCase();

      if (s.includes("set")) result.set++;
      else if (s.includes("show")) result.showed++;
      else if (s.includes("no")) result.noShow++;
      else if (s.includes("help")) result.cantHelp++;
      else if (s.includes("work")) result.working++;
    });

    return result;
  }, [clients, statuses]);

  if (loading) {
    return <div style={{ padding: 20 }}>Loading dashboard...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <Card label="Set" value={stats.set} color="#3b82f6" />
        <Card label="Showed" value={stats.showed} color="#10b981" />
        <Card label="No Show" value={stats.noShow} color="#ef4444" />
        <Card label="Can't Help" value={stats.cantHelp} color="#ef4444" />
        <Card label="Working" value={stats.working} color="#8b5cf6" />
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
