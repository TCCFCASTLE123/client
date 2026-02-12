// Inbox.js
import React, { useEffect, useState, useRef, useMemo } from "react";
import { format } from "date-fns";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";

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
      <div style={{ flex: 1, minWidth: 0 }}>
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
function Inbox() {
  const [clients, setClients] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
const socketRef = useRef(null);
const selectedClientIdRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typing, setTyping] = useState(false);

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

  // Load statuses + clients
  useEffect(() => {
    let cancelled = false;

    async function loadStatuses() {
      try {
        const res = await fetch(process.env.REACT_APP_API_URL + "/api/statuses", {
          headers: { Authorization: "Bearer " + getToken() },
        });

        if (res.status === 401 || res.status === 403) {
          redirectToLogin();
          return;
        }

        const data = await res.json().catch(() => []);
        const list = Array.isArray(data) ? data : Array.isArray(data?.statuses) ? data.statuses : [];
        if (!cancelled) setStatuses(list);
      } catch (err) {
        if (!cancelled) alert(err.message);
      }
    }

    async function fetchClientsOnce() {
      try {
        const res = await fetch(process.env.REACT_APP_API_URL + "/api/clients", {
          headers: { Authorization: "Bearer " + getToken() },
        });

        if (res.status === 401 || res.status === 403) {
          redirectToLogin();
          return;
        }

        const data = await res.json().catch(() => []);
        const fresh = Array.isArray(data) ? data : Array.isArray(data?.clients) ? data.clients : [];
        if (cancelled) return;

        setClients((prev) => {
          const prevById = new Map((Array.isArray(prev) ? prev : []).map((c) => [c.id, c]));
          const merged = fresh.map((c) => {
            const old = prevById.get(c.id);
            return {
              ...c,
              unreadCount: old?.unreadCount || 0,
              lastMessageAt: old?.lastMessageAt || null,
              lastMessageText: old?.lastMessageText || "",
            };
          });

          merged.sort((a, b) => {
            const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return tb - ta;
          });

          return merged;
        });
      } catch (err) {
        if (!cancelled) alert(err.message);
      }
    }

    loadStatuses();
    fetchClientsOnce();

    const intervalId = setInterval(fetchClientsOnce, 10000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  // Socket listeners
 useEffect(() => {
  if (socketRef.current) return;

  const socket = io(process.env.REACT_APP_API_URL, {
    path: "/socket.io",
    transports: ["polling", "websocket"], // allow Render fallback
    auth: { token: getToken() },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  socketRef.current = socket;

  const onAnyMessage = (msg) => {
    if (!msg || !msg.client_id) return;

    const msgClientId = msg.client_id;
    const isInbound = msg.direction === "inbound" || msg.sender === "client";
    const isViewingThisChat =
      selectedClientIdRef.current === msgClientId;

    if (isViewingThisChat) {
      setMessages((prev) => [...prev, msg]);
    }

    setClients((prev) => {
      const next = [...prev];
      const idx = next.findIndex((c) => c.id === msgClientId);
      if (idx === -1) return prev;

      const old = next[idx];
      const updated = {
        ...old,
        lastMessageAt: msg.timestamp || new Date().toISOString(),
        lastMessageText: msg.text || "",
        unreadCount:
          isInbound && !isViewingThisChat
            ? (old.unreadCount || 0) + 1
            : old.unreadCount || 0,
      };

      next.splice(idx, 1);
      next.unshift(updated);
      return next;
    });

    if (isInbound && !isViewingThisChat) {
      playBeep();
      showToast(
        `${msg.client_name || "Client"}: ${(msg.text || "").slice(0, 90)}`,
        msgClientId
      );
      flashClient(msgClientId);
    }
  };

  socket.on("newMessage", onAnyMessage);
  socket.on("message", onAnyMessage);
  socket.on("message:new", onAnyMessage);

  socket.on("connect_error", (err) => {
    console.warn("Socket connect error:", err.message);
  });

  return () => {
    socket.off("newMessage", onAnyMessage);
    socket.off("message", onAnyMessage);
    socket.off("message:new", onAnyMessage);
    socket.disconnect();
    socketRef.current = null;
  };
}, []);


  // Fetch messages when selecting client
  useEffect(() => {
    let cancelled = false;

    async function loadConversation() {
      if (!selectedClient) {
        setMessages([]);
        return;
      }

      setLoadingMessages(true);

      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/messages/conversation/${selectedClient.id}`, {
          headers: { Authorization: "Bearer " + getToken() },
        });

        if (res.status === 401 || res.status === 403) {
          if (!cancelled) {
            setMessages([]);
            setLoadingMessages(false);
          }
          redirectToLogin();
          return;
        }

        const data = await res.json().catch(() => null);
        const list = Array.isArray(data) ? data : Array.isArray(data?.messages) ? data.messages : [];

        if (!cancelled) {
          setMessages(list);
          setLoadingMessages(false);
        }
      } catch (err) {
        if (!cancelled) {
          setMessages([]);
          setLoadingMessages(false);
          alert(err.message);
        }
      }
    }

    loadConversation();
    return () => {
      cancelled = true;
    };
  }, [selectedClient]);
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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return alert("Type a message first.");
    if (!selectedClient) return alert("No client selected.");

    const payload = { to: selectedClient.phone, text: newMsg, client_id: selectedClient.id };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401 || response.status === 403) {
        redirectToLogin();
        return;
      }

      if (!response.ok) throw new Error((await response.text()) || "Failed to send message");

      // Move this client to top immediately
      setClients((prev) => {
        const next = [...(Array.isArray(prev) ? prev : [])];
        const idx = next.findIndex((c) => c.id === selectedClient.id);
        if (idx === -1) return prev;

        const old = next[idx];
        const updated = { ...old, lastMessageAt: new Date().toISOString(), lastMessageText: payload.text };

        next.splice(idx, 1);
        next.unshift(updated);
        return next;
      });

      // Refresh conversation
      const res2 = await fetch(`${process.env.REACT_APP_API_URL}/api/messages/conversation/${selectedClient.id}`, {
        headers: { Authorization: "Bearer " + getToken() },
      });

      if (res2.status === 401 || res2.status === 403) {
        redirectToLogin();
        return;
      }

      const data2 = await res2.json().catch(() => null);
      const list2 = Array.isArray(data2) ? data2 : Array.isArray(data2?.messages) ? data2.messages : [];
      setMessages(list2);

      if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });

      setNewMsg("");
    } catch (err) {
      alert("Could not send message: " + (err.message || err));
      console.error("Send error:", err);
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

    if (window.confirm(`Delete client "${selectedClient.name}" and all messages?`)) {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/clients/${selectedClient.id}`, {
          method: "DELETE",
          headers: { Authorization: "Bearer " + getToken() },
        });

        if (res.status === 401 || res.status === 403) {
          redirectToLogin();
          return;
        }

        if (!res.ok) throw new Error("Failed to delete client");

        setClients((prev) => (Array.isArray(prev) ? prev : []).filter((c) => c.id !== selectedClient.id));
        setSelectedClient(null);
        setMessages([]);
      } catch (err) {
        alert(err.message || "Failed to delete client");
      }
    }
  };

  const handleStatusChange = (clientId, statusId) => {
    fetch(`${process.env.REACT_APP_API_URL}/api/clients/${clientId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      body: JSON.stringify({ status_id: statusId }),
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          redirectToLogin();
          return { success: false };
        }
        const data = await res.json().catch(() => ({ success: false }));
        return data;
      })
      .then((data) => {
        if (data && data.success) {
          setClients((prev) =>
            (Array.isArray(prev) ? prev : []).map((c) => (c.id === clientId ? { ...c, status_id: statusId } : c))
          );

          if (selectedClient && selectedClient.id === clientId) {
            setSelectedClient({ ...selectedClient, status_id: statusId });
          }
        } else {
          alert("Failed to update status.");
        }
      })
      .catch((err) => alert(err.message));
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
    setClients((prev) => (Array.isArray(prev) ? prev : []).map((c) => (c.id === client.id ? { ...c, unreadCount: 0 } : c)));
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
          minHeight: 600,
          height: "calc(100vh - 190px)",
          width: "calc(100vw - 40px)", // use almost full width
          maxWidth: 1600, // still prevents ultra-wide weirdness
          margin: "20px auto",
          overflow: "hidden",
        }}
      >
        {/* LEFT: Client list */}
        <aside
          className="inbox-sidebar"
          style={{
            width: 340,
            background: "#f8fafc",
            padding: 18,
            height: "100%",
            overflowY: "auto",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Clients</h3>

          <button
            onClick={openAddClientForm}
            style={{
              width: "100%",
              marginBottom: 12,
              background: "#374151",
              color: "#fff",
              borderRadius: 8,
              border: "none",
              padding: "9px 0",
              fontWeight: "bold",
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Add Client
          </button>

          <input
            style={{
              width: "100%",
              padding: "8px 10px",
              marginBottom: 14,
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 14,
            }}
            type="text"
            placeholder="Search by name or phone.."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <ul style={{ padding: 0, listStyle: "none", margin: 0 }}>
            {inboxClients.map((client) => {
              const statusName = client.status_id ? getStatusName(client.status_id) : "";
              const theme = statusThemeByName(statusName);

              const isSelected = selectedClient && selectedClient.id === client.id;
              const isFlashing = highlightClientId === client.id && !isSelected;

              return (
                <li
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  style={{
                    background: isSelected ? "#eef2ff" : "#fff",
                    borderRadius: 10,
                    padding: 14,
                    marginBottom: 10,
                    cursor: "pointer",
                    boxShadow: isSelected
                      ? "0 2px 12px #c7d2fe50"
                      : isFlashing
                      ? "0 0 0 4px rgba(34,197,94,0.22), 0 10px 30px rgba(34,197,94,0.12)"
                      : "0 1px 4px #cbd5e140",
                    transform: isFlashing ? "translateY(-1px)" : "none",
                    transition: "box-shadow 160ms ease, transform 160ms ease",
                    borderLeft: client.status_id ? `6px solid ${theme.border}` : "6px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, flex: 1, minWidth: 0 }}>
                      {client.name || "No Name"}
                    </div>

                    {!!client.unreadCount && (
                      <span
                        style={{
                          background: "#ef4444",
                          color: "#fff",
                          borderRadius: 999,
                          padding: "2px 8px",
                          fontSize: 12,
                          fontWeight: 800,
                          lineHeight: 1.4,
                        }}
                      >
                        {client.unreadCount}
                      </span>
                    )}

                    {statusName && (
                      <span
                        style={{
                          background: theme.pillBg,
                          color: theme.pillText,
                          borderRadius: 999,
                          padding: "3px 10px",
                          fontSize: 12,
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {statusName}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>
                    {formatPhoneUS(client.phone) || "No phone"}
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* RIGHT: Conversation + Details */}
        <main
          className="inbox-main"
          style={{
            flex: 1,
            padding: 32,
            minHeight: 600,
            height: "100%",
            overflow: "hidden",
          }}
        >
          {!selectedClient && (
            <div style={{ color: "#64748b", margin: "auto", textAlign: "center", fontSize: 16, fontWeight: 600 }}>
              Select a client to view messages
            </div>
          )}

          {selectedClient && (
            <>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <h2 style={{ margin: 0, fontWeight: 900 }}>Conversation with {selectedClient.name}</h2>

                <button
                  onClick={openEditClientForm}
                  style={{
                    marginLeft: "auto",
                    background: "#818cf8",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 16px",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={handleDeleteClient}
                  style={{
                    background: "#f43f5e",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 16px",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>

              {/* 2-column */}
              <div style={{ display: "flex", gap: 14, height: "calc(100% - 52px)" }}>
                {/* LEFT: messages + input */}
                <div style={{ flex: 1, minWidth: 650, display: "flex", flexDirection: "column" }}>
                  <div
                    className="messages"
                    style={{
                      background: "#f4f7fa",
                      borderRadius: 12,
                      padding: 18,
                      flex: 1,
                      overflowY: "auto",
                      boxShadow: "0 1px 4px #e0e7ef",
                    }}
                  >
                    {loadingMessages && <div>Loading messages...</div>}
                    {!loadingMessages && (Array.isArray(messages) ? messages : []).length === 0 && (
                      <div className="no-messages" style={{ color: "#aaa" }}>
                        No messages yet!
                      </div>
                    )}

                    {(() => {
                      let lastDate = null;

                      return (Array.isArray(messages) ? messages : []).map((msg, i) => {
                        const msgDate = safeDate(msg.timestamp);

                        const showDate =
                          !lastDate ||
                          !(
                            msgDate.getFullYear() === lastDate.getFullYear() &&
                            msgDate.getMonth() === lastDate.getMonth() &&
                            msgDate.getDate() === lastDate.getDate()
                          );

                        if (showDate) lastDate = msgDate;

                        const isSystem = msg.sender === "system";
                        const isOutbound = msg.direction === "outbound" || msg.sender === "me";
                        const bubbleClass = isSystem ? "system" : isOutbound ? "me" : "client";

                        let footer = "";
                        if (isSystem) footer = `Automated • ${format(msgDate, "h:mm a")}`;
                        else if (isOutbound) footer = `Sent by ${prettyName(msg.sender) || "Agent"} • ${format(msgDate, "h:mm a")}`;
                        else footer = `Received • ${format(msgDate, "h:mm a")}`;

                        return (
                          <React.Fragment key={i}>
                            {showDate && <div className="date-divider">{format(msgDate, "EEEE, MMM d, yyyy")}</div>}

                            <div
                              className={`message ${bubbleClass}`}
                              style={{
                                background: isSystem ? "#f1f5f9" : undefined,
                                border: isSystem ? "1px solid #e2e8f0" : undefined,
                                color: isSystem ? "#6d28d9" : undefined,
                                padding: isSystem ? "10px 14px" : "7px 16px",
                                borderRadius: isSystem ? 16 : 10,
                                margin: "8px 0",
                                maxWidth: isSystem ? "85%" : undefined,
                                alignSelf: isSystem ? "flex-start" : undefined,
                                boxShadow: isSystem ? "0 1px 3px rgba(0,0,0,0.06)" : undefined,
                              }}
                            >
                              <div className="message-text" style={{ whiteSpace: "pre-wrap" }}>
                                {msg.text}
                              </div>

                              <div
                                className="message-timestamp"
                                style={{
                                  marginTop: 6,
                                  fontSize: 11,
                                  opacity: 0.85,
                                  color: isSystem ? "#6d28d9" : undefined,
                                }}
                              >
                                {footer}
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      });
                    })()}

                    {typing && <div style={{ color: "#aaa", fontSize: 13, marginLeft: 5 }}>You are typing...</div>}
                    <div ref={messagesEndRef} />
                  </div>

           <form
  onSubmit={handleSend}
  style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}
>
  {/* Text input */}
  <input
    type="text"
    placeholder="Type your message..."
    value={newMsg}
    onChange={(e) => setNewMsg(e.target.value)}
    style={{
      flex: 1,
      padding: 13,
      borderRadius: 19,
      border: "1px solid #bfc8da",
      fontSize: 15,
      outline: "none",
    }}
    disabled={!selectedClient}
  />

  {/* Image upload button */}
  <label
    style={{
      padding: "10px 14px",
      borderRadius: 19,
      background: "#e2e8f0",
      cursor: "pointer",
      fontWeight: 700,
      fontSize: 14,
    }}
  >
    📎
    <input
      type="file"
      style={{ display: "none" }}
      onChange={(e) => setSelectedFile(e.target.files[0])}
      disabled={!selectedClient}
    />
  </label>

  {/* Send button */}
  <button
    type="submit"
    style={{
      padding: "0 24px",
      borderRadius: 19,
      border: "none",
      background: "#6366f1",
      color: "#fff",
      fontWeight: 900,
      fontSize: 16,
      cursor: "pointer",
      opacity: !newMsg.trim() && !selectedFile ? 0.7 : 1,
    }}
    disabled={!newMsg.trim() && !selectedFile}
  >
    Send
  </button>
</form>

                </div>

                {/* RIGHT: details */}
                <div
                  style={{
                    width: 260,
                    flex: "0 0 260px",
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 12,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    height: "fit-content",
                  }}
                >
                  <div style={{ fontWeight: 900, fontSize: 13, color: "#0f172a" }}>Client Details</div>

                  <div style={{ marginTop: 10, fontWeight: 800, fontSize: 13 }}>
                    {formatPhoneUS(selectedClient.phone) || "No phone"}
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <select
                      value={selectedClient.status_id || ""}
                      onChange={(e) => handleStatusChange(selectedClient.id, e.target.value)}
                      style={{
                        width: "100%",
                        height: 36,
                        borderRadius: 10,
                        border: "1px solid #e2e8f0",
                        padding: "6px 10px",
                        background: "#fff",
                        fontWeight: 800,
                      }}
                    >
                      <option value="">Select status...</option>
                      {(Array.isArray(statuses) ? statuses : []).map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginTop: 12, fontSize: 13, color: "#334155", display: "grid", gap: 6 }}>
                    {selectedClient.office && (
                      <div>
                        <b>Office:</b> {selectedClient.office}
                      </div>
                    )}
                    {selectedClient.language && (
                      <div>
                        <b>Language:</b> {selectedClient.language}
                      </div>
                    )}
                    {selectedClient.case_type && (
                      <div>
                        <b>Case:</b> {selectedClient.case_type}
                      </div>
                    )}
                    {selectedClient.case_subtype && (
                      <div>
                        <b>Subcase:</b> {selectedClient.case_subtype}
                      </div>
                    )}
                    {(selectedClient.appointment_datetime || selectedClient.appt_date) && (
                      <div>
                        <b>Appt:</b> {selectedClient.appointment_datetime || selectedClient.appt_date}
                      </div>
                    )}
                    {selectedClient.appt_setter && (
                      <div>
                        <b>Appt Setter:</b> {selectedClient.appt_setter}
                      </div>
                    )}
                    {selectedClient.ic && (
                      <div>
                        <b>IC:</b> {selectedClient.ic}
                      </div>
                    )}
                    {selectedClient.email && (
                      <div>
                        <b>Email:</b> {selectedClient.email}
                      </div>
                    )}
{selectedClient.attorney_assigned && (
  <div>
    <b>Assigned Attorney:</b> {selectedClient.attorney_assigned}
  </div>
)}

                    {selectedClient.notes && (
                      <div>
                        <b>Notes:</b> {selectedClient.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        {showClientForm && (
          <ClientForm initialData={editClientData || {}} onClose={() => setShowClientForm(false)} onSave={handleClientSave} />
        )}
      </div>
    </>
  );
}

export default Inbox;
