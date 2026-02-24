// Inbox.js
import React, { useEffect, useState, useRef, useMemo } from "react";
import ClientSidebar from "./inbox/ClientSidebar";
import DetailsDrawer from "./inbox/DetailsDrawer";
import ConversationHeader from "./inbox/ConversationHeader";
import ConversationPanel from "./inbox/ConversationPanel";
import { useLocation } from "react-router-dom";
import api from "./services/api";

function canonicalPhone(input) {
  if (!input) return "";
  const digits = String(input).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  if (digits.length === 10) return digits;
  return digits;
}

function formatPhoneUS(input) {
  const d = String(input || "").replace(/\D/g, "");
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  if (ten.length !== 10) return input || "";
  return `${ten.slice(0, 3)}-${ten.slice(3, 6)}-${ten.slice(6)}`;
}

/** =========================
 * STATUS COLORS (border + pill)
 * ========================= */
function statusThemeByName(name) {
  const MAP = {
    "No Show": { border: "#f4c542", pillBg: "#fff3c4", pillText: "#7a5a00" },
    Set: { border: "#cbd5e1", pillBg: "#f1f5f9", pillText: "#334155" },
    "Attempted/Unsuccessful": { border: "#55c7da", pillBg: "#d9f6fb", pillText: "#0b5c6a" },
    "Working To Set": { border: "#a78bfa", pillBg: "#ede9fe", pillText: "#5b21b6" },
    Showed: { border: "#94a3b8", pillBg: "#e2e8f0", pillText: "#475569" },
    "Did Not Retain": { border: "#f59e0b", pillBg: "#ffedd5", pillText: "#92400e" },
    "No Money": { border: "#6b7280", pillBg: "#e5e7eb", pillText: "#374151" },
    Retained: { border: "#22c55e", pillBg: "#dcfce7", pillText: "#166534" },
    Pending: { border: "#fbbf24", pillBg: "#fef9c3", pillText: "#854d0e" },
    "Can't Help": { border: "#ef4444", pillBg: "#fee2e2", pillText: "#991b1b" },
    "Seen Can't Help": { border: "#ef4444", pillBg: "#fee2e2", pillText: "#991b1b" },
    "Referred Out": { border: "#ef4444", pillBg: "#fee2e2", pillText: "#991b1b" },
    "No Longer Needs Assistance": { border: "#ef4444", pillBg: "#fee2e2", pillText: "#991b1b" },
  };

  return MAP[name] || {
    border: "#e2e8f0",
    pillBg: "#f1f5f9",
    pillText: "#334155",
  };
}


/* =========================
   Tiny beep (no audio file)
   ========================= */
function playBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.04;
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 120);
  } catch {}
}

/** =========================
 * Shared auth helpers
 * ========================= */
function getToken() {
  return localStorage.getItem("token") || "";
}

function redirectToLogin() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

/** =========================
 * Helper: nice sender label
 * ========================= */
function prettyName(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (s === "me") return "You";
  if (s === "agent") return "Agent";
  if (s === "system") return "Automated";
  if (s === "client") return "Client";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function safeDate(ts) {
  const d = ts ? new Date(ts) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

/** =========================
 * ClientForm
 * (removed intake coordinator field)
 * ========================= */
function ClientForm({ initialData = {}, onClose, onSave }) {
  const [name, setName] = useState(initialData.name || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [notes, setNotes] = useState(initialData.notes || "");
  const [language, setLanguage] = useState(initialData.language || "English");
  const [office, setOffice] = useState(initialData.office || "");
  const [caseType, setCaseType] = useState(initialData.case_type || "");
  const [caseSubtype, setCaseSubtype] = useState(initialData.case_subtype || "");
  const [apptDate, setApptDate] = useState(initialData.appt_date || "");
  const [apptTime, setApptTime] = useState(initialData.appt_time || "");
  const [apptSetter, setApptSetter] = useState(initialData.appt_setter || "");
  const [ic, setIc] = useState(initialData.ic || "");
const [attorneyAssigned, setAttorneyAssigned] = useState(initialData.attorney_assigned || "");

  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");

    const cleanName = (name || "").trim();
    const cleanPhone = canonicalPhone(phone);

    if (!cleanName) return setErrMsg("Name is required.");
    if (!cleanPhone || cleanPhone.length < 10) return setErrMsg("Phone number is required (10 digits).");
    if (!office) return setErrMsg("Office is required.");
    if (!caseType) return setErrMsg("Case Type is required.");

    const method = initialData.id ? "PATCH" : "POST";
    const url = initialData.id
      ? `${process.env.REACT_APP_API_URL}/api/clients/${initialData.id}`
      : `${process.env.REACT_APP_API_URL}/api/clients`;

    const payload = {};
    payload.name = cleanName;
    payload.phone = cleanPhone;
    if (email && email.trim()) payload.email = email.trim();
    if (notes && notes.trim()) payload.notes = notes.trim();
    if (language && language.trim()) payload.language = language.trim();
    if (office && office.trim()) payload.office = office.trim();
    if (caseType && caseType.trim()) payload.case_type = caseType.trim();
    if (caseSubtype && caseSubtype.trim()) payload.case_subtype = caseSubtype.trim();
    if (apptDate && apptDate.trim()) payload.appt_date = apptDate.trim();
    if (apptTime && apptTime.trim()) payload.appt_time = apptTime.trim();
    if (apptSetter && apptSetter.trim()) payload.appt_setter = apptSetter.trim();
    if (ic && ic.trim()) payload.ic = ic.trim();
if (attorneyAssigned && attorneyAssigned.trim()) payload.attorney_assigned = attorneyAssigned.trim();

    try {
      setSaving(true);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401 || response.status === 403) {
        setSaving(false);
        redirectToLogin();
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrMsg((data && (data.error || data.message)) || "Failed to save client.");
        setSaving(false);
        return;
      }

      onSave(data);
      setSaving(false);
    } catch (err) {
      setSaving(false);
      setErrMsg(err.message || "Error saving client");
    }
  };

  return (
    <div className="modal-backdrop cc-modal" onClick={onClose}>
      <form className="modal client-modal cc-modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h3 className="cc-modal-title">{initialData.id ? "Edit Client" : "Add Client"}</h3>

        {!!errMsg && <div className="cc-modal-error">{errMsg}</div>}

        <div className="cc-row">
          <input className="cc-field" placeholder="Name*" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="cc-field" placeholder="Phone*" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>

        <div className="cc-row">
          <input className="cc-field" type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} />
          <input className="cc-field" type="text" value={apptTime || ""} onChange={(e) => setApptTime(e.target.value)} placeholder="6:00 PM" />
        </div>

     <div className="cc-row">
  <input className="cc-field" placeholder="Appt Setter" value={apptSetter} onChange={(e) => setApptSetter(e.target.value)} />
  <input className="cc-field" placeholder="I.C." value={ic} onChange={(e) => setIc(e.target.value)} />
</div>

<div className="cc-row">
  <input
    className="cc-field"
    placeholder="Assigned Attorney"
    value={attorneyAssigned}
    onChange={(e) => setAttorneyAssigned(e.target.value)}
  />
  <div />
</div>


        <div className="cc-row">
          <input className="cc-field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select className="cc-field" value={office} onChange={(e) => setOffice(e.target.value)} required>
            <option value="">Select Office</option>
            <option value="PHX">PHX</option>
            <option value="MESA">MESA</option>
            <option value="OP">OP</option>
            <option value="ZOOM">ZOOM</option>
          </select>
        </div>

        <div className="cc-row">
          <select className="cc-field" value={caseType} onChange={(e) => setCaseType(e.target.value)} required>
            <option value="">Select Case Type</option>
            <option value="Criminal">Criminal</option>
            <option value="Immigration">Immigration</option>
            <option value="Bankruptcy">Bankruptcy</option>
      <option value="Personal Injury">Personal Injury</option>
          </select>
          <input className="cc-field" placeholder="Sub Case Type" value={caseSubtype} onChange={(e) => setCaseSubtype(e.target.value)} />
        </div>

        <div className="cc-row">
          <select className="cc-field" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
          </select>
          <div />
        </div>

        <textarea className="cc-textarea" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />

        <div className="cc-btn-row">
          <button className="cc-btn cc-btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : initialData.id ? "Save" : "Add"}
          </button>
          <button className="cc-btn cc-btn-ghost" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}


/** =========================
 * Toast / Banner
 * ========================= */
function ToastBanner({ toast, onClose, onJump }) {
  if (!toast?.show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 18,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        width: "min(680px, calc(100vw - 24px))",
        background: "#111827",
        color: "#fff",
        borderRadius: 14,
        boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: 999, background: "#22c55e", flex: "0 0 auto" }} />
<div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: 0.2 }}>New message</div>
        <div style={{ fontSize: 13, opacity: 0.92, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {toast.text}
        </div>
      </div>

      {toast.clientId && (
        <button
          onClick={() => onJump(toast.clientId)}
          style={{
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.10)",
            color: "#fff",
            padding: "8px 10px",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: 800,
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          Open
        </button>
      )}

      <button
        onClick={onClose}
        style={{
          border: "none",
          background: "transparent",
          color: "rgba(255,255,255,0.75)",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          padding: "6px 8px",
        }}
        aria-label="Close"
        title="Close"
      >
        ×
      </button>
    </div>
  );
}

/** =========================
 * Inbox Component
 * ========================= */
function Inbox({
  clients,
  setClients,
  statuses,
  selectedClient,
  setSelectedClient,
  messages,
  setMessages,
  loadingMessages,
}) {
const selectedClientIdRef = useRef(null);
// MOBILE SUPPORT
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
const [mobileView, setMobileView] = useState("clients"); 
// clients | chat
  const [newMsg, setNewMsg] = useState("");
  const textareaRef = useRef(null);
  const [typing, setTyping] = useState(false);
const [showDetails, setShowDetails] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editClientData, setEditClientData] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);

  const [toast, setToast] = useState({ show: false, text: "", clientId: null });
  const toastTimerRef = useRef(null);
  const [highlightClientId, setHighlightClientId] = useState(null);
  const highlightTimerRef = useRef(null);

  const selectedClientId = selectedClient?.id || null;

  const location = useLocation();
  const clientIdFromUrl = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    const id = qs.get("clientId") || qs.get("clientid");
    return id ? Number(id) : null;
  }, [location.search]);

  // Statuses that should NOT appear in Inbox list
  const HIDE_FROM_INBOX_STATUSES = useMemo(
    () =>
      new Set([
        "Referred Out",
        "Can't Help",
        "No Longer Needs Assistance",
        "Seen Can't Help",
      ]),
    []
  );

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const showToast = (text, clientId) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ show: true, text, clientId: clientId || null });
    toastTimerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
    }, 4200);
  };

  const flashClient = (clientId) => {
    if (!clientId) return;
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    setHighlightClientId(clientId);
    highlightTimerRef.current = setTimeout(() => setHighlightClientId(null), 1400);
  };
useEffect(() => {
  selectedClientIdRef.current = selectedClient?.id || null;
}, [selectedClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Typing indicator
  useEffect(() => {
    if (newMsg) {
      setTyping(true);
      const timeout = setTimeout(() => setTyping(false), 1200);
      return () => clearTimeout(timeout);
    } else {
      setTyping(false);
    }
  }, [newMsg]);

  useEffect(() => {
  const el = textareaRef.current;
  if (!el) return;

  el.style.height = "auto";

  const newHeight = Math.min(el.scrollHeight, 180); // max height cap
  el.style.height = newHeight + "px";
}, [newMsg]);

  useEffect(() => {
  if (selectedClient && textareaRef.current) {
    textareaRef.current.focus();
  }
}, [selectedClient]);
  
  useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
  
const handleSend = async (e) => {
  e.preventDefault();

  if (!selectedClient) return alert("No client selected.");

  try {
    // Upload image first
    if (selectedFile) {
      await api.uploadImage(selectedClient.id, selectedFile);
      setSelectedFile(null);
    }

    // Send text message
    if (newMsg.trim()) {
      await api.sendMessage(selectedClient.id, newMsg.trim());
      setNewMsg("");
    }

  } catch (err) {
    console.error("Send failed:", err);
    alert(err.message || "Failed to send message.");
  }
};

  const openAddClientForm = () => {
    setEditClientData(null);
    setShowClientForm(true);
  };

  const openEditClientForm = () => {
    setEditClientData(selectedClient);
    setShowClientForm(true);
  };

  const handleClientSave = (savedClient) => {
    if (editClientData) {
      setClients((prev) => (Array.isArray(prev) ? prev : []).map((c) => (c.id === savedClient.id ? savedClient : c)));
      setSelectedClient(savedClient);
    } else {
      setClients((prev) => [savedClient, ...(Array.isArray(prev) ? prev : [])]);
      setSelectedClient(savedClient);
    }
    setShowClientForm(false);
  };

const handleDeleteClient = async () => {
  if (!selectedClient) return;

  if (!window.confirm(`Delete client "${selectedClient.name}" and all messages?`)) {
    return;
  }

  try {
    await api.deleteClient(selectedClient.id);

    setClients((prev) =>
      (Array.isArray(prev) ? prev : []).filter(
        (c) => c.id !== selectedClient.id
      )
    );

    setSelectedClient(null);
    setMessages([]);
  } catch (err) {
    alert(err.message || "Failed to delete client");
  }
};

const handleStatusChange = async (clientId, statusId) => {
  try {
    await api.updateClientStatus(clientId, statusId);

    setClients((prev) =>
      (Array.isArray(prev) ? prev : []).map((c) =>
        c.id === clientId ? { ...c, status_id: statusId } : c
      )
    );

    if (selectedClient && selectedClient.id === clientId) {
      setSelectedClient({ ...selectedClient, status_id: statusId });
    }

  } catch (err) {
    alert(err.message || "Failed to update status.");
  }
}; 

  const getStatusName = (statusId) => {
    const list = Array.isArray(statuses) ? statuses : [];
    const found = list.find((s) => String(s.id) === String(statusId));
    return found ? found.name : "";
  };

  // This is the actual list used for the LEFT sidebar
  // - hides those statuses
  // - applies search
  const inboxClients = useMemo(() => {
    const list = Array.isArray(clients) ? clients : [];
    const q = (search || "").trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");

    return list.filter((c) => {
      const statusName = c.status_id ? getStatusName(c.status_id) : "";
      if (statusName && HIDE_FROM_INBOX_STATUSES.has(statusName)) return false;

      if (!q) return true;

      const nameMatch = (c.name || "").toLowerCase().includes(q);
      const phoneDigits = String(c.phone || "").replace(/\D/g, "");
      const phoneMatch = qDigits ? phoneDigits.includes(qDigits) : false;

      return nameMatch || phoneMatch;
    });
  }, [clients, search, statuses, HIDE_FROM_INBOX_STATUSES]);

const handleSelectClient = (client) => {
  setSelectedClient(client);

  setClients((prev) =>
    (Array.isArray(prev) ? prev : []).map((c) =>
      c.id === client.id ? { ...c, unreadCount: 0 } : c
    )
  );

  if (isMobile) {
    setMobileView("chat");
  }
};

  // Deep link selection
  useEffect(() => {
    if (!clientIdFromUrl) return;
    if (!Array.isArray(clients) || clients.length === 0) return;
    if (Number(selectedClient?.id) === Number(clientIdFromUrl)) return;

    const target = clients.find((c) => Number(c.id) === Number(clientIdFromUrl));
    if (target) handleSelectClient(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientIdFromUrl, clients]);

  const jumpToClient = (clientId) => {
    const target = (Array.isArray(clients) ? clients : []).find((c) => c.id === clientId);
    if (target) {
      handleSelectClient(target);
      setToast((t) => ({ ...t, show: false }));
    }
  };

  return (
    <>
      <ToastBanner toast={toast} onClose={() => setToast((t) => ({ ...t, show: false }))} onJump={jumpToClient} />

<div
  className="inbox-container"
  style={{
    display: "flex",
    height: "calc(100vh - 140px)",
    width: "100%",
    overflow: "hidden",
  }}
>
   <ClientSidebar
  inboxClients={inboxClients}
  selectedClient={selectedClient}
  highlightClientId={highlightClientId}
  getStatusName={getStatusName}
  statusThemeByName={statusThemeByName}
  formatPhoneUS={formatPhoneUS}
  handleSelectClient={handleSelectClient}
  openAddClientForm={openAddClientForm}
  search={search}
  setSearch={setSearch}
/>

        {/* RIGHT: Conversation + Details */}
<main
  className="inbox-main"
  style={{
    flex: 1,
    minWidth: 0,
    padding: isMobile ? 16 : 32,
    minHeight: 600,
    height: "100%",
    overflow: "hidden",
    display: isMobile && mobileView !== "chat" ? "none" : "block",
  }}
>
<ConversationHeader
  selectedClient={selectedClient}
  isMobile={isMobile}
  onBack={() => setMobileView("clients")}
  onEdit={openEditClientForm}
  onDelete={handleDeleteClient}
  onShowDetails={() => setShowDetails(true)}
/>
     <ConversationPanel
  selectedClient={selectedClient}
  messages={messages}
  loadingMessages={loadingMessages}
  handleSend={handleSend}
  newMsg={newMsg}
  setNewMsg={setNewMsg}
  textareaRef={textareaRef}
  messagesEndRef={messagesEndRef}
/>
                  
        </main>

        {showClientForm && (
          <ClientForm initialData={editClientData || {}} onClose={() => setShowClientForm(false)} onSave={handleClientSave} />
        )}
          <DetailsDrawer
  selectedClient={selectedClient}
  isMobile={isMobile}
  showDetails={showDetails}
  onClose={() => setShowDetails(false)}
/>
      </div>
    </>
  );
}

export default Inbox;
