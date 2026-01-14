import React, { useEffect, useState, useRef } from "react";
import { format } from "date-fns";

function canonicalPhone(input) {
  if (!input) return "";
  const digits = String(input).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  if (digits.length === 10) return digits;
  return digits;
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

    if (!cleanName) return setErrMsg("Name is required.");
    if (!cleanPhone || cleanPhone.length < 10) return setErrMsg("Phone number is required (10 digits).");
    if (!office) return setErrMsg("Office is required.");
    if (!caseType) return setErrMsg("Case Type is required.");

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
          boxShadow: "0 8px 32px rgba(30,39,66,0.35)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          overflow: "hidden",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>{initialData.id ? "Edit Client" : "Add Client"}</h3>

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
          <input placeholder="Name*" value={name} onChange={(e) => setName(e.target.value)} required autoFocus style={{ flex: 2, minWidth: 0 }} />
          <input placeholder="Phone*" value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ flex: 1, minWidth: 0, maxWidth: 170 }} />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1 }} />
          <select value={office} onChange={(e) => setOffice(e.target.value)} style={{ flex: 1 }} required>
            <option value="">Select Office</option>
            <option value="PHX">PHX</option>
            <option value="MESA">MESA</option>
            <option value="OP">OP</option>
            <option value="ZOOM">ZOOM</option>
          </select>
        </div>

        <input
          placeholder="Appointment Date/Time"
          value={appointmentDate}
          onChange={(e) => setAppointmentDate(e.target.value)}
        />

        <div style={{ display: "flex", gap: 12 }}>
          <select value={caseType} onChange={(e) => setCaseType(e.target.value)} style={{ flex: 1 }} required>
            <option value="">Select Case Type</option>
            <option value="Criminal">Criminal</option>
            <option value="Immigration">Immigration</option>
            <option value="Bankruptcy">Bankruptcy</option>
          </select>

          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ flex: 1 }}>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
          </select>
        </div>

        <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />

        <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
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
    if (!selectedClient) {
      setMessages([]);
      return;
    }

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
  }, [selectedClient]);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!newMsg) return setTyping(false);
    setTyping(true);
    const timeout = setTimeout(() => setTyping(false), 1200);
    return () => clearTimeout(timeout);
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
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error((await response.text()) || "Failed to send message");

      const convo = await fetch(`${process.env.REACT_APP_API_URL}/api/messages/conversation/${selectedClient.id}`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      }).then((res) => res.json());

      setMessages(convo);
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
      setClients((prev) => prev.map((c) => (c.id === savedClient.id ? savedClient : c)));
      setSelectedClient(savedClient);
    } else {
      setClients((prev) => [savedClient, ...prev]);
    }
    setShowClientForm(false);
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    if (!window.confirm(`Delete client "${selectedClient.name}" and all messages?`)) return;

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/clients/${selectedClient.id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      });
      if (!res.ok) throw new Error("Failed to delete client");

      setClients((prev) => prev.filter((c) => c.id !== selectedClient.id));
      setSelectedClient(null);
      setMessages([]);
    } catch (err) {
      alert(err.message || "Failed to delete client");
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
        if (!data.success) return alert("Failed to update status.");

        setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, status_id: statusId } : c)));
        if (selectedClient && selectedClient.id === clientId) {
          setSelectedClient({ ...selectedClient, status_id: statusId });
        }
      })
      .catch((err) => alert(err.message));
  };

  const getStatusName = (statusId) => {
    const found = statuses.find((s) => String(s.id) === String(statusId));
    return found ? found.name : "";
  };

  const filteredClients = clients.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(s)) ||
      (c.phone && c.phone.replace(/\D/g, "").includes(search.replace(/\D/g, "")))
    );
  });

  return (
    <div
      className="inbox-container"
      style={{
        // THIS is the key: page doesn’t grow forever — the panels scroll internally.
        height: "calc(100vh - 120px)",
        minHeight: 600,
      }}
    >
      <aside className="inbox-sidebar">
        <h3>Clients</h3>

        <button onClick={openAddClientForm}>Add Client</button>

        <input
          type="text"
          placeholder="Search by name or phone.."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 10px",
            marginBottom: 14,
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            fontSize: 14,
          }}
        />

        {/* Scrollable client list (so the page doesn’t go forever) */}
        <div style={{ overflowY: "auto", maxHeight: "calc(100% - 120px)", paddingRight: 4 }}>
          <ul>
            {filteredClients.map((client) => (
              <li
                key={client.id}
                className={selectedClient && selectedClient.id === client.id ? "selected" : ""}
                onClick={() => setSelectedClient(client)}
              >
                <strong>{client.name || "No Name"}</strong>
                <span>{client.phone || "No phone"}</span>

                <select
                  className="status-dropdown"
                  value={client.status_id || ""}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleStatusChange(client.id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">Select status...</option>
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>

                {client.status_id && (
                  <span className="status-label" data-status={getStatusName(client.status_id)}>
                    {getStatusName(client.status_id)}
                  </span>
                )}

                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                  {client.language === "Spanish" ? "Spanish" : "English"}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="inbox-main">
        {!selectedClient && (
          <div style={{ color: "#888", margin: "auto", textAlign: "center" }}>
            <h3>Select a client to view messages</h3>
          </div>
        )}

        {selectedClient && (
          <>
            <div className="inbox-main-header">
              <h2>Conversation with {selectedClient.name}</h2>
              <div>
                <button className="edit-btn" onClick={openEditClientForm}>
                  Edit Client
                </button>
                <button className="delete-btn" onClick={handleDeleteClient}>
                  Delete Client
                </button>
              </div>
            </div>

            <div
              className="messages"
              style={{
                // Keep messages scrollable inside the box, not the whole page
                minHeight: 220,
                maxHeight: "calc(100% - 150px)",
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

                  const bubbleClass =
                    msg.sender === "system"
                      ? "client"
                      : msg.sender === "me" || msg.direction === "outbound"
                      ? "me"
                      : "client";

                  return (
                    <React.Fragment key={i}>
                      {showDate && <div className="date-divider">{format(msgDate, "EEEE, MMM d, yyyy")}</div>}

                      <div
                        className={`message ${bubbleClass}`}
                        style={
                          msg.sender === "system"
                            ? {
                                background: "#e0e7ef",
                                color: "#7c3aed",
                                fontStyle: "italic",
                              }
                            : undefined
                        }
                      >
                        <div className="message-text">{msg.text}</div>
                        <div className="message-timestamp">
                          {format(msgDate, "h:mm a")}
                          {msg.direction === "outbound" && " • Sent"}
                          {msg.direction === "inbound" && " • Received"}
                          {msg.sender === "system" && " • Automated"}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                });
              })()}

              {typing && (
                <div className="typing-indicator" style={{ color: "#aaa", fontSize: 13, marginLeft: 5 }}>
                  You are typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form className="message-input-row" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Type your message..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                disabled={!selectedClient}
              />
              <button type="submit" disabled={!newMsg.trim()}>
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
