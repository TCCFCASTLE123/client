import React, { useEffect, useState, useRef } from "react";
import { format } from "date-fns";

function canonicalPhone(input) {
  if (!input) return "";
  const digits = String(input).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  if (digits.length === 10) return digits;
  return digits;
}

/** =========================
 * STATUS COLORS (border + pill)
 * ========================= */
function statusThemeByName(nameRaw) {
  const name = String(nameRaw || "").trim();

  // colors chosen to match your sheet vibe (pastel but clear)
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

// =========================
// ClientForm Component
// =========================
function ClientForm({ initialData = {}, onClose, onSave }) {
  const [name, setName] = useState(initialData.name || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [notes, setNotes] = useState(initialData.notes || "");
  const [language, setLanguage] = useState(initialData.language || "English");
  const [office, setOffice] = useState(initialData.office || "");
  const [caseType, setCaseType] = useState(initialData.case_type || "");
  const [appointmentDate, setAppointmentDate] = useState(
    initialData.AppointmentScheduledDate || initialData.appointment_datetime || ""
  );

  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");

    const cleanName = (name || "").trim();
    const cleanPhone = canonicalPhone(phone);

    if (!cleanName) {
      setErrMsg("Name is required.");
      return;
    }
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrMsg("Phone number is required (10 digits).");
      return;
    }
    if (!office) {
      setErrMsg("Office is required.");
      return;
    }
    if (!caseType) {
      setErrMsg("Case Type is required.");
      return;
    }

    const method = initialData.id ? "PATCH" : "POST";
    const url = initialData.id
      ? `${process.env.REACT_APP_API_URL}/api/clients/${initialData.id}`
      : `${process.env.REACT_APP_API_URL}/api/clients`;

    try {
      setSaving(true);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          email,
          notes,
          language,
          office,
          case_type: caseType,
          AppointmentScheduledDate: appointmentDate,
        }),
      });

      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        const msg = (data && data.error) || text || "Failed to save client.";
        setErrMsg(msg);
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
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal client-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 8px 32px #1e27429c",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          overflow: "hidden",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>
          {initialData.id ? "Edit Client" : "Add Client"}
        </h3>

        {errMsg && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "10px 12px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {errMsg}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, minWidth: 0 }}>
          <input
            placeholder="Name*"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            style={{ flex: 2, minWidth: 0 }}
          />
          <input
            placeholder="Phone*"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            style={{ flex: 1, minWidth: 0, maxWidth: 170 }}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ flex: 1 }}
          />
          <select
            value={office}
            onChange={(e) => setOffice(e.target.value)}
            style={{ flex: 1 }}
            required
          >
            <option value="">Select Office</option>
            <option value="PHX">PHX</option>
            <option value="MESA">MESA</option>
            <option value="OP">OP</option>
            <option value="ZOOM">ZOOM</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <input
            placeholder="Appointment Date/Time"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <select
            value={caseType}
            onChange={(e) => setCaseType(e.target.value)}
            style={{ flex: 1 }}
            required
          >
            <option value="">Select Case Type</option>
            <option value="Criminal">Criminal</option>
            <option value="Immigration">Immigration</option>
            <option value="Bankruptcy">Bankruptcy</option>
          </select>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
          </select>
        </div>

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{ width: "100%", marginTop: 4 }}
        />

        <div className="modal-buttons" style={{ display: "flex", gap: 10, marginTop: 6 }}>
          <button type="submit" style={{ flex: 1 }} disabled={saving}>
            {saving ? "Saving..." : initialData.id ? "Save" : "Add"}
          </button>
          <button type="button" onClick={onClose} style={{ flex: 1 }} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// =========================
// Inbox Component
// =========================
function Inbox() {
  const [clients, setClients] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editClientData, setEditClientData] = useState(null);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL + "/api/statuses")
      .then((res) => res.json())
      .then(setStatuses)
      .catch((err) => alert(err.message));

    const fetchClients = () => {
      fetch(process.env.REACT_APP_API_URL + "/api/clients", {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      })
        .then((res) => res.json())
        .then(setClients)
        .catch((err) => alert(err.message));
    };

    fetchClients();
    const intervalId = setInterval(fetchClients, 10000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (selectedClient) {
      setLoadingMessages(true);
      fetch(`${process.env.REACT_APP_API_URL}/api/messages/conversation/${selectedClient.id}`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      })
        .then((res) => res.json())
        .then((data) => {
          setMessages(data);
          setLoadingMessages(false);
        })
        .catch((err) => {
          alert(err.message);
          setLoadingMessages(false);
        });
    } else {
      setMessages([]);
    }
  }, [selectedClient]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

    const payload = {
      to: selectedClient.phone,
      text: newMsg,
      client_id: selectedClient.id,
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error((await response.text()) || "Failed to send message");

      await fetch(`${process.env.REACT_APP_API_URL}/api/messages/conversation/${selectedClient.id}`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      })
        .then((res) => res.json())
        .then((data) => {
          setMessages(data);
          if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        });
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
      setClients(clients.map((c) => (c.id === savedClient.id ? savedClient : c)));
      setSelectedClient(savedClient);
    } else {
      setClients([savedClient, ...clients]);
    }
    setShowClientForm(false);
  };

  const handleDeleteClient = async () => {
    if (window.confirm(`Delete client "${selectedClient.name}" and all messages?`)) {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/clients/${selectedClient.id}`, {
          method: "DELETE",
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        });
        if (!res.ok) throw new Error("Failed to delete client");
        setClients(clients.filter((c) => c.id !== selectedClient.id));
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
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
      body: JSON.stringify({ status_id: statusId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setClients((clients) =>
            clients.map((c) => (c.id === clientId ? { ...c, status_id: statusId } : c))
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
    const found = statuses.find((s) => String(s.id) === String(statusId));
    return found ? found.name : "";
  };

  const filteredClients = clients.filter(
    (c) =>
      !search ||
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.replace(/\D/g, "").includes(search.replace(/\D/g, "")))
  );

  return (
    <div
      className="inbox-container"
      style={{
        display: "flex",
        minHeight: 600,
        height: "calc(100vh - 190px)", // prevents endless page scroll + kills double scrollbars
        maxWidth: 1100,
        margin: "20px auto",
        overflow: "hidden",
      }}
    >
      <aside
        className="inbox-sidebar"
        style={{
          width: 340,
          background: "#f8fafc",
          padding: 18,
          height: "100%",
          overflowY: "auto", // ONLY scrollbar on the list
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
          {filteredClients.map((client) => {
            const statusName = client.status_id ? getStatusName(client.status_id) : "";
            const theme = statusThemeByName(statusName);

            return (
              <li
                key={client.id}
                className={selectedClient && selectedClient.id === client.id ? "selected" : ""}
                onClick={() => setSelectedClient(client)}
                style={{
                  background: selectedClient && selectedClient.id === client.id ? "#eef2ff" : "#fff",
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 10,
                  cursor: "pointer",
                  boxShadow:
                    selectedClient && selectedClient.id === client.id
                      ? "0 2px 12px #c7d2fe50"
                      : "0 1px 4px #cbd5e140",
                  borderLeft: client.status_id ? `6px solid ${theme.border}` : "6px solid transparent", // ✅ BORDER COLOR (not dot)
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, flex: 1, minWidth: 0 }}>
                    {client.name || "No Name"}
                  </div>

                  {/* ✅ small pill NEXT TO NAME (not under dropdown) */}
                  {statusName && (
                    <span
                      style={{
                        background: theme.pillBg,
                        color: theme.pillText,
                        borderRadius: 999,
                        padding: "3px 10px",
                        fontSize: 12,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statusName}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
                  {client.phone || "No phone"}
                </div>

                {/* ✅ dropdown stays, but fits the card (smaller + no overflow) */}
                <div style={{ marginTop: 8 }}>
                  <select
                    className="status-dropdown"
                    value={client.status_id || ""}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStatusChange(client.id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: "100%",
                      maxWidth: "100%",
                      height: 32,
                      fontSize: 13,
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      padding: "4px 8px",
                      background: "#fff",
                    }}
                  >
                    <option value="">Select status...</option>
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </select>

                  {/* ✅ REMOVED the duplicate extra label under dropdown (your request) */}
                </div>

                <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
                  {client.language === "Spanish" ? "Spanish" : "English"}
                </div>

                {selectedClient && selectedClient.id === client.id && (
                  <div style={{ marginTop: 8, color: "#555", fontSize: 13 }}>
                    {client.email && <div>Email: {client.email}</div>}
                    {client.notes && <div>Notes: {client.notes}</div>}
                    {client.office && <div>Office: {client.office}</div>}
                    {client.case_type && <div>Case: {client.case_type}</div>}
                    {client.appointment_datetime && <div>Appt: {client.appointment_datetime}</div>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </aside>

      <main
        className="inbox-main"
        style={{
          flex: 1,
          padding: 32,
          minHeight: 600,
          height: "100%",
          overflow: "hidden", // prevents second scrollbar
        }}
      >
        {!selectedClient && (
          <div style={{ color: "#888", margin: "auto", textAlign: "center" }}>
            <h3>Select a client to view messages</h3>
          </div>
        )}

        {selectedClient && (
          <>
            <div
              className="header-row"
              style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}
            >
              <h2 style={{ margin: 0, fontWeight: 700 }}>
                Conversation with {selectedClient.name}
              </h2>

              <button
                className="edit-btn"
                onClick={openEditClientForm}
                style={{
                  marginLeft: "auto",
                  background: "#818cf8",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 18px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Edit Client
              </button>

              <button
                className="delete-btn"
                onClick={handleDeleteClient}
                style={{
                  background: "#f43f5e",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 18px",
                  fontWeight: 600,
                  marginLeft: 10,
                  cursor: "pointer",
                }}
              >
                Delete Client
              </button>
            </div>

            <div
              className="messages"
              style={{
                background: "#f4f7fa",
                borderRadius: 12,
                padding: 18,
                marginBottom: 16,
                height: "calc(100% - 120px)", // keeps layout stable, avoids page scroll
                overflowY: "auto",
                boxShadow: "0 1px 4px #e0e7ef",
              }}
            >
              {loadingMessages && <div>Loading messages...</div>}
              {!loadingMessages && messages.length === 0 && (
                <div className="no-messages" style={{ color: "#aaa" }}>
                  No messages yet!
                </div>
              )}

              {(() => {
                let lastDate = null;
                return messages.map((msg, i) => {
                  const msgDate = new Date(msg.timestamp);
                  const showDate =
                    !lastDate ||
                    !(
                      msgDate.getFullYear() === lastDate.getFullYear() &&
                      msgDate.getMonth() === lastDate.getMonth() &&
                      msgDate.getDate() === lastDate.getDate()
                    );
                  if (showDate) lastDate = msgDate;

                  const isSystem = msg.sender === "system";

                  return (
                    <React.Fragment key={i}>
                      {showDate && (
                        <div className="date-divider">
                          {format(msgDate, "EEEE, MMM d, yyyy")}
                        </div>
                      )}

                      <div
                        className={`message ${
                          isSystem
                            ? "system"
                            : msg.sender === "me" || msg.direction === "outbound"
                            ? "me"
                            : "client"
                        }`}
                        style={{
                          // ✅ restore the AUTOMATED bubble look
                          background: isSystem ? "#f1f5f9" : undefined,
                          border: isSystem ? "1px solid #e2e8f0" : undefined,
                          color: isSystem ? "#6d28d9" : undefined,
                          fontStyle: isSystem ? "normal" : undefined,
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
                          {format(msgDate, "h:mm a")}
                          {msg.direction === "outbound" && " • Sent"}
                          {msg.direction === "inbound" && " • Received"}
                          {isSystem && " • Automated"}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                });
              })()}

              {typing && (
                <div
                  className="typing-indicator"
                  style={{ color: "#aaa", fontSize: 13, marginLeft: 5 }}
                >
                  You are typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              className="message-input-row"
              onSubmit={handleSend}
              style={{ display: "flex", gap: 8 }}
            >
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
              <button
                type="submit"
                style={{
                  padding: "0 24px",
                  borderRadius: 19,
                  border: "none",
                  background: "#6366f1",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: "pointer",
                  opacity: !newMsg.trim() ? 0.7 : 1,
                }}
                disabled={!newMsg.trim()}
              >
                Send
              </button>
            </form>
          </>
        )}
      </main>

      {showClientForm && (
        <ClientForm
          initialData={editClientData || {}}
          onClose={() => setShowClientForm(false)}
          onSave={handleClientSave}
        />
      )}
    </div>
  );
}

export default Inbox;
