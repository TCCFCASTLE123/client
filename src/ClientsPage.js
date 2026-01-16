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

function statusThemeByName(nameRaw) {
  const name = String(nameRaw || "").trim();

  const MAP = {
    "No Show": { border: "#f4c542", pillBg: "#fff3c4", pillText: "#7a5a00" },
    "Set": { border: "#cbd5e1", pillBg: "#f1f5f9", pillText: "#334155" },
    "Attempted/Unsuccessful": { border: "#55c7da", pillBg: "#d9f6fb", pillText: "#0b5c6a" },
    "Working To Set": { border: "#a78bfa", pillBg: "#ede9fe", pillText: "#5b21b6" },
    "Showed": { border: "#94a3b8", pillBg: "#e2e8f0", pillText: "#475569" },
    "Did Not Retain": { border: "#f59e0b", pillBg: "#ffedd5", pillText: "#92400e" },
    "No Money": { border: "#6b7280", pillBg: "#e5e7eb", pillText: "#374151" },
    "Retained": { border: "#22c55e", pillBg: "#dcfce7", pillText: "#166534" },
    "Pending": { border: "#fbbf24", pillBg: "#fef9c3", pillText: "#854d0e" },
    "Can't Help": { border: "#ef4444", pillBg: "#fee2e2", pillText: "#991b1b" },
    "Seen Can't Help": { border: "#ef4444", pillBg: "#fee2e2", pillText: "#991b1b" },
    "Referred Out": { border: "#ef4444", pillBg: "#fee2e2", pillText: "#991b1b" },
  };

  return MAP[name] || { border: "#e2e8f0", pillBg: "#f1f5f9", pillText: "#334155" };
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
  const [icFilter, setIcFilter] = useState("all");
  const [apptSetterFilter, setApptSetterFilter] = useState("all");

  // Sort: recent | name | case_type | ic | appt_setter
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

        if (
          sRes.status === 401 ||
          sRes.status === 403 ||
          cRes.status === 401 ||
          cRes.status === 403
        ) {
          redirectToLogin();
          return;
        }

        const sJson = await sRes.json().catch(() => []);
        const cJson = await cRes.json().catch(() => []);

        const statusList = Array.isArray(sJson)
          ? sJson
          : Array.isArray(sJson?.statuses)
          ? sJson.statuses
          : [];

        const clientList = Array.isArray(cJson)
          ? cJson
          : Array.isArray(cJson?.clients)
          ? cJson.clients
          : [];

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

  const icOptions = useMemo(() => {
    const set = new Set();
    (Array.isArray(clients) ? clients : []).forEach((c) => c.ic && set.add(String(c.ic).trim()));
    return Array.from(set).filter(Boolean).sort();
  }, [clients]);

  const apptSetterOptions = useMemo(() => {
    const set = new Set();
    (Array.isArray(clients) ? clients : []).forEach((c) => c.appt_setter && set.add(String(c.appt_setter).trim()));
    return Array.from(set).filter(Boolean).sort();
  }, [clients]);

  const filtered = useMemo(() => {
    const list = Array.isArray(clients) ? clients : [];
    const qLower = (q || "").trim().toLowerCase();
    const qDigits = (q || "").replace(/\D/g, "");

    let out = list.filter((c) => {
      if (qLower) {
        const name = (c.name || "").toLowerCase();
        const phone = (c.phone || "").replace(/\D/g, "");
        const email = (c.email || "").toLowerCase();
        const notes = (c.notes || "").toLowerCase();

        const matches =
          name.includes(qLower) ||
          email.includes(qLower) ||
          notes.includes(qLower) ||
          (qDigits && phone.includes(qDigits));

        if (!matches) return false;
      }

      if (statusId && String(c.status_id || "") !== String(statusId)) return false;
      if (office && String(c.office || "") !== String(office)) return false;
      if (caseType && String(c.case_type || "") !== String(caseType)) return false;
      if (language && String(c.language || "") !== String(language)) return false;

      if (icFilter !== "all" && String(c.ic || "").trim() !== icFilter) return false;
      if (apptSetterFilter !== "all" && String(c.appt_setter || "").trim() !== apptSetterFilter) return false;

      if (unreadOnly) {
        const unread = Number(c.unreadCount || 0);
        if (!unread) return false;
      }

      return true;
    });

    out.sort((a, b) => {
      if (sortBy === "name") return String(a.name || "").localeCompare(String(b.name || ""));
      if (sortBy === "case_type") return String(a.case_type || "").localeCompare(String(b.case_type || ""));
      if (sortBy === "ic") return String(a.ic || "").localeCompare(String(b.ic || ""));
      if (sortBy === "appt_setter") return String(a.appt_setter || "").localeCompare(String(b.appt_setter || ""));

      return safeTime(b.last_message_at || b.lastMessageAt) - safeTime(a.last_message_at || a.lastMessageAt);
    });

    return out;
  }, [
    clients,
    q,
    statusId,
    office,
    caseType,
    language,
    unreadOnly,
    icFilter,
    apptSetterFilter,
    sortBy,
  ]);

  const resetFilters = () => {
    setQ("");
    setStatusId("");
    setOffice("");
    setCaseType("");
    setLanguage("");
    setUnreadOnly(false);
    setIcFilter("all");
    setApptSetterFilter("all");
    setSortBy("recent");
  };

  const openConversation = (clientId) => {
    navigate(`/inbox?clientId=${clientId}`);
  };

  return (
    <div style={{ maxWidth: 1250, margin: "18px auto", padding: "0 16px" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, fontWeight: 900, letterSpacing: 0.2 }}>Clients</h2>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button className="cc-btn2" onClick={() => navigate("/inbox")}>
            Back to Inbox
          </button>

          <button className="cc-btn2 cc-btn2-muted" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </div>

      {/* Filters card */}
      <div
        style={{
          marginTop: 12,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          padding: 12,
          boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name / phone / email / notes"
            className="cc-input2"
          />

          <select value={statusId} onChange={(e) => setStatusId(e.target.value)} className="cc-input2">
            <option value="">Status (all)</option>
            {(Array.isArray(statuses) ? statuses : []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select value={office} onChange={(e) => setOffice(e.target.value)} className="cc-input2">
            <option value="">Office (all)</option>
            {uniqueOffices.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>

          <select value={caseType} onChange={(e) => setCaseType(e.target.value)} className="cc-input2">
            <option value="">Case Type (all)</option>
            {uniqueCaseTypes.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>

          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="cc-input2">
            <option value="">Language (all)</option>
            {uniqueLanguages.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={icFilter} onChange={(e) => setIcFilter(e.target.value)} className="cc-input2" style={{ minWidth: 180 }}>
            <option value="all">IC (all)</option>
            {icOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <select
            value={apptSetterFilter}
            onChange={(e) => setApptSetterFilter(e.target.value)}
            className="cc-input2"
            style={{ minWidth: 220 }}
          >
            <option value="all">Appt Setter (all)</option>
            {apptSetterOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, color: "#0f172a" }}>
            <input type="checkbox" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
            Unread only
          </label>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontWeight: 900, color: "#0f172a" }}>Sort</div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="cc-input2" style={{ minWidth: 180 }}>
              <option value="recent">Most recent</option>
              <option value="name">Name</option>
              <option value="case_type">Case Type</option>
              <option value="ic">IC</option>
              <option value="appt_setter">Appt Setter</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div
        style={{
          marginTop: 12,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(2,6,23,0.06)",
        }}
      >
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontWeight: 900, color: "#0f172a" }}>
            {loading ? "Loading..." : `${filtered.length} clients`}
          </div>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#64748b", fontWeight: 800 }}>
            Click a row to open conversation
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 16, color: "#64748b", fontWeight: 700 }}>Loading clients…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 16, color: "#64748b", fontWeight: 700 }}>No clients match these filters.</div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table className="cc-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th className="cc-th">Name</th>
                  <th className="cc-th">Phone</th>
                  <th className="cc-th">Status</th>
                  <th className="cc-th">Office</th>
                  <th className="cc-th">Case</th>
                  <th className="cc-th">IC</th>
                  <th className="cc-th">Appt Setter</th>
                  <th className="cc-th">Language</th>
                  <th className="cc-th cc-center">Unread</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((c) => {
                  const statusName = statusNameById.get(String(c.status_id || "")) || "";
                  const theme = statusThemeByName(statusName);
                  const unread = Number(c.unreadCount || 0);

                  return (
                    <tr key={c.id} className="cc-tr" onClick={() => openConversation(c.id)}>
                      <td className="cc-td cc-strong">{c.name || "-"}</td>
                      <td className="cc-td">{formatPhone10(c.phone) || "-"}</td>
                      <td className="cc-td">
                        {statusName ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              borderRadius: 999,
                              padding: "4px 10px",
                              fontWeight: 900,
                              fontSize: 12,
                              background: theme.pillBg,
                              color: theme.pillText,
                              border: `1px solid ${theme.border}`,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {statusName}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontWeight: 900 }}>—</span>
                        )}
                      </td>
                      <td className="cc-td">{c.office || "-"}</td>
                      <td className="cc-td">{c.case_type || "-"}</td>
                      <td className="cc-td">{c.ic || "-"}</td>
                      <td className="cc-td">{c.appt_setter || "-"}</td>
                      <td className="cc-td">{c.language || "-"}</td>
                      <td className="cc-td cc-center">
                        {unread ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: 28,
                              height: 22,
                              padding: "0 8px",
                              borderRadius: 999,
                              background: "#ef4444",
                              color: "#fff",
                              fontWeight: 900,
                              fontSize: 12,
                            }}
                          >
                            {unread}
                          </span>
                        ) : (
                          ""
                        )}
                      </td>
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
