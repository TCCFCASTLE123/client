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
  const t = d && !isNaN(d.getTime()) ? d.getTime() : 0;
  return t;
}

export default function ClientsPage() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [q, setQ] = useState("");
  const [statusId, setStatusId] = useState("");
  const [office, setOffice] = useState("");
  const [caseType, setCaseType] = useState("");
  const [language, setLanguage] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [sortBy, setSortBy] = useState("recent"); // recent | name
const [icFilter, setIcFilter] = useState("all");
const [apptSetterFilter, setApptSetterFilter] = useState("all");

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

        if (sRes.status === 401 || sRes.status === 403 || cRes.status === 401 || cRes.status === 403) {
          redirectToLogin();
          return;
        }

        const sJson = await sRes.json().catch(() => []);
        const cJson = await cRes.json().catch(() => []);

        const statusList = Array.isArray(sJson) ? sJson : Array.isArray(sJson?.statuses) ? sJson.statuses : [];
        const clientList = Array.isArray(cJson) ? cJson : Array.isArray(cJson?.clients) ? cJson.clients : [];

        if (cancelled) return;
        setStatuses(statusList);
        setClients(clientList);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          alert(err.message || "Failed to load clients");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusNameById = useMemo(() => {
    const m = new Map();
    (Array.isArray(statuses) ? statuses : []).forEach((s) => m.set(String(s.id), s.name));
    return m;
  }, [statuses]);

  const uniqueOffices = useMemo(() => {
    const set = new Set();
    (Array.isArray(clients) ? clients : []).forEach((c) => c.office && set.add(c.office));
    return Array.from(set).sort();
  }, [clients]);

  const uniqueCaseTypes = useMemo(() => {
    const set = new Set();
    (Array.isArray(clients) ? clients : []).forEach((c) => c.case_type && set.add(c.case_type));
    return Array.from(set).sort();
  }, [clients]);

  const uniqueLanguages = useMemo(() => {
    const set = new Set();
    (Array.isArray(clients) ? clients : []).forEach((c) => c.language && set.add(c.language));
    return Array.from(set).sort();
  }, [clients]);

  const filtered = useMemo(() => {
    const list = Array.isArray(clients) ? clients : [];
    const needle = (q || "").trim().toLowerCase().replace(/\D/g, (m) => m);
const icOptions = useMemo(() => {
  const set = new Set();
  (clients || []).forEach(c => c.ic && set.add(c.ic));
  return Array.from(set).sort();
}, [clients]);

const apptSetterOptions = useMemo(() => {
  const set = new Set();
  (clients || []).forEach(c => c.appt_setter && set.add(c.appt_setter));
  return Array.from(set).sort();
}, [clients]);

    let out = list.filter((c) => {
      // search
      if (q && q.trim()) {
        const name = (c.name || "").toLowerCase();
        const phone = (c.phone || "").replace(/\D/g, "");
        const email = (c.email || "").toLowerCase();
        const notes = (c.notes || "").toLowerCase();

        const qLower = q.toLowerCase();
        const qDigits = q.replace(/\D/g, "");

        const matches =
          name.includes(qLower) ||
          email.includes(qLower) ||
          notes.includes(qLower) ||
          (qDigits && phone.includes(qDigits));

        if (!matches) return false;
      }

      // filters
      if (statusId && String(c.status_id || "") !== String(statusId)) return false;
      if (office && String(c.office || "") !== String(office)) return false;
      if (caseType && String(c.case_type || "") !== String(caseType)) return false;
      if (language && String(c.language || "") !== String(language)) return false;
if (icFilter !== "all" && c.ic !== icFilter) return false;
if (apptSetterFilter !== "all" && c.appt_setter !== apptSetterFilter) return false;


      if (unreadOnly) {
        const unread = Number(c.unreadCount || 0);
        if (!unread) return false;
      }

      return true;
    });

    // sort
    if (sortBy === "name") {
      out.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    } else {
      out.sort((a, b) => safeTime(b.last_message_at || b.lastMessageAt) - safeTime(a.last_message_at || a.lastMessageAt));
    }
if (sort === "ic") return (a.ic || "").localeCompare(b.ic || "");
if (sort === "appt_setter") return (a.appt_setter || "").localeCompare(b.appt_setter || "");

    return out;
  }, [clients, q, statusId, office, caseType, language, unreadOnly, sortBy]);

  const resetFilters = () => {
    setQ("");
    setStatusId("");
    setOffice("");
    setCaseType("");
    setLanguage("");
    setUnreadOnly(false);
    setSortBy("recent");
  };

  const openConversation = (clientId) => {
    navigate(`/inbox?clientId=${clientId}`);
  };

  return (
    <div style={{ maxWidth: 1150, margin: "18px auto", padding: "0 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontWeight: 900 }}>Clients</h2>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/inbox")}
            style={{
              border: "1px solid #e2e8f0",
              background: "#fff",
              padding: "8px 12px",
              borderRadius: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Back to Inbox
          </button>

          <button
            onClick={resetFilters}
            style={{
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              padding: "8px 12px",
              borderRadius: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          marginTop: 12,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: 12,
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name / phone / email / notes"
            style={{
              width: "100%",
              height: 38,
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: "0 12px",
              fontWeight: 700,
            }}
          />

          <select
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
            style={{ height: 38, borderRadius: 12, border: "1px solid #e2e8f0", padding: "0 10px", fontWeight: 800 }}
          >
            <option value="">Status (all)</option>
            {(Array.isArray(statuses) ? statuses : []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={office}
            onChange={(e) => setOffice(e.target.value)}
            style={{ height: 38, borderRadius: 12, border: "1px solid #e2e8f0", padding: "0 10px", fontWeight: 800 }}
          >
            <option value="">Office (all)</option>
            {uniqueOffices.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
<option value="ic">IC</option>
<option value="appt_setter">Appt Setter</option>

          <select
            value={caseType}
            onChange={(e) => setCaseType(e.target.value)}
            style={{ height: 38, borderRadius: 12, border: "1px solid #e2e8f0", padding: "0 10px", fontWeight: 800 }}
          >
            <option value="">Case Type (all)</option>
            {uniqueCaseTypes.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
<select value={icFilter} onChange={(e) => setIcFilter(e.target.value)}>
  <option value="all">IC (all)</option>
  {icOptions.map(v => <option key={v} value={v}>{v}</option>)}
</select>

<select value={apptSetterFilter} onChange={(e) => setApptSetterFilter(e.target.value)}>
  <option value="all">Appt Setter (all)</option>
  {apptSetterOptions.map(v => <option key={v} value={v}>{v}</option>)}
</select>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ height: 38, borderRadius: 12, border: "1px solid #e2e8f0", padding: "0 10px", fontWeight: 800 }}
          >
            <option value="">Language (all)</option>
            {uniqueLanguages.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, color: "#0f172a" }}>
            <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
            Unread only
          </label>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>Sort</div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ height: 36, borderRadius: 12, border: "1px solid #e2e8f0", padding: "0 10px", fontWeight: 900 }}
            >
              <option value="recent">Most recent</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          marginTop: 12,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>
            {loading ? "Loading..." : `${filtered.length} clients`}
          </div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#64748b", fontWeight: 700 }}>
            Click a row to open conversation
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 16, color: "#64748b", fontWeight: 700 }}>Loading clients…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 16, color: "#64748b", fontWeight: 700 }}>No clients match these filters.</div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={th}>Name</th>
                  <th style={th}>Phone</th>
                  <th style={th}>Status</th>
                  <th style={th}>Office</th>
                  <th style={th}>Case</th>
                  <th style={th}>Language</th>
                  <th style={thCenter}>Unread</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const statusName = statusNameById.get(String(c.status_id || "")) || "";
                  const unread = Number(c.unreadCount || 0);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => openConversation(c.id)}
                      style={{
                        cursor: "pointer",
                        borderTop: "1px solid #eef2f7",
                      }}
                    >
                      <td style={tdStrong}>{c.name || "-"}</td>
                      <td style={td}>{c.phone || "-"}</td>
                      <td style={td}>{statusName || "-"}</td>
                      <td style={td}>{c.office || "-"}</td>
                      <td style={td}>{c.case_type || "-"}</td>
                      <td style={td}>{c.language || "-"}</td>
                      <td style={tdCenter}>{unread ? unread : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 12,
  color: "#334155",
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const thCenter = { ...th, textAlign: "center" };

const td = {
  padding: "10px 12px",
  fontSize: 13,
  color: "#334155",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const tdStrong = {
  ...td,
  fontWeight: 900,
  color: "#0f172a",
};

const tdCenter = { ...td, textAlign: "center" };
