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

function formatPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length !== 10) return raw || "";
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
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
  const [apptSetter, setApptSetter] = useState("");
  const [ic, setIc] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const statusColors = {
    Set: "#3b82f6",
    Showed: "#10b981",
    "No Show": "#f59e0b",
    "Working To Set": "#8b5cf6",
    default: "#94a3b8",
  };

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

        if (!cancelled) {
          setStatuses(Array.isArray(sJson) ? sJson : sJson.statuses || []);
          setClients(Array.isArray(cJson) ? cJson : cJson.clients || []);
          setLoading(false);
        }
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
      const lower = q.toLowerCase();
      list = list.filter((c) =>
        (c.name || "").toLowerCase().includes(lower)
      );
    }

    if (statusId) {
      list = list.filter((c) => String(c.status_id) === statusId);
    }

    if (office) list = list.filter((c) => c.office === office);
    if (caseType) list = list.filter((c) => c.case_type === caseType);
    if (apptSetter)
      list = list.filter((c) =>
        (c.appt_setter || "").toLowerCase().includes(apptSetter.toLowerCase())
      );
    if (ic)
      list = list.filter((c) =>
        (c.ic || "").toLowerCase().includes(ic.toLowerCase())
      );

    if (unreadOnly) {
      list = list.filter((c) => Number(c.unreadCount || 0) > 0);
    }

    list.sort(
      (a, b) =>
        safeTime(b.last_message_at) - safeTime(a.last_message_at)
    );

    return list;
  }, [clients, q, statusId, office, caseType, apptSetter, ic, unreadOnly]);

  return (
    <div style={container}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontWeight: 800 }}>Clients</h2>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button onClick={() => navigate("/inbox")} style={btnStyle}>
            Back
          </button>
          <button onClick={() => window.location.reload()} style={btnStyle}>
            Reset
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div style={filterBar}>
        <input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} style={inputStyle} />

        <select value={statusId} onChange={(e) => setStatusId(e.target.value)} style={inputStyle}>
          <option value="">Status</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select value={office} onChange={(e) => setOffice(e.target.value)} style={inputStyle}>
          <option value="">Office</option>
          <option value="PHX">PHX</option>
          <option value="GILBERT">GILBERT</option>
          <option value="OP">OP</option>
        </select>

        <select value={caseType} onChange={(e) => setCaseType(e.target.value)} style={inputStyle}>
          <option value="">Case Type</option>
          <option value="Criminal">Criminal</option>
          <option value="Immigration">Immigration</option>
        </select>

        <input placeholder="Appt Setter" value={apptSetter} onChange={(e) => setApptSetter(e.target.value)} style={inputStyle} />
        <input placeholder="I.C." value={ic} onChange={(e) => setIc(e.target.value)} style={inputStyle} />

        <label>
          <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} /> Unread
        </label>
      </div>

      {/* TABLE */}
      <div style={tableCard}>
        <div style={tableHeader}>
          {loading ? "Loading..." : `${filtered.length} clients`}
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          <table style={tableStyle}>
            <thead style={theadStyle}>
              <tr>
                <th style={th}>Name</th>
                <th style={th}>Phone</th>
                <th style={th}>Office</th>
                <th style={th}>Case</th>
                <th style={th}>Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() =>
                    navigate("/inbox", {
                      state: { clientId: c.id }, // 🔥 FIXED NAVIGATION
                    })
                  }
                  style={row}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  <td style={tdStrong}>{c.name}</td>
                  <td style={td}>{formatPhone(c.phone)}</td>
                  <td style={td}>{c.office}</td>
                  <td style={td}>{c.case_type}</td>
                  <td style={td}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#fff",
                        background:
                          statusColors[c.status_name] || statusColors.default,
                      }}
                    >
                      {c.status_name || "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* STYLES */

const container = {
  height: "calc(100vh - 110px)",
  display: "flex",
  flexDirection: "column",
  padding: 20,
  background: "#f1f5f9",
  gap: 14,
};

const filterBar = {
  background: "#fff",
  padding: 12,
  borderRadius: 14,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  border: "1px solid #e2e8f0",
};

const tableCard = {
  flex: 1,
  background: "#fff",
  borderRadius: 14,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
};

const tableHeader = {
  padding: "12px 14px",
  fontWeight: 700,
  borderBottom: "1px solid #e2e8f0",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
};

const theadStyle = {
  position: "sticky",
  top: 0,
  background: "#fff",
};

const th = {
  textAlign: "left",
  padding: "12px 14px",
  fontSize: 12,
  color: "#64748b",
  borderBottom: "1px solid #e2e8f0",
};

const td = {
  padding: "12px 14px",
  borderBottom: "1px solid #f1f5f9",
};

const tdStrong = {
  ...td,
  fontWeight: 600,
};

const row = {
  cursor: "pointer",
};

const inputStyle = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
};

const btnStyle = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  background: "#fff",
  cursor: "pointer",
};
