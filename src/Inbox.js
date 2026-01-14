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
    }
    setTyping(false);
  }, [newMsg]);

  const getStatusName = (statusId) => {
    const found = statuses.find((s) => String(s.id) === String(statusId));
    return found ? found.name : "";
  };

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

      const data = await fetch(`${process.env.REACT_APP_API_URL}/api/messages/conversation/${selectedClient.id}`, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      }).then((res) => res.json());

      setMessages(data);
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
    if (window.confirm(`Delete client "${selectedClient.name}" and all messages?`)) {
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
          setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, status_id: statusId } : c)));
          if (selectedClient && selectedClient.id === clientId) {
            setSelectedClient((prev) => ({ ...prev, status_id: statusId }));
          }
        } else {
          alert("Failed to update status.");
        }
      })
      .catch((err) => alert(err.message));
  };

  const filteredClients = clients.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const nameMatch = (c.name || "").toLowerCase().includes(s);
    const phoneMatch = (c.phone || "").replace(/\D/g, "").includes(search.replace(/\D/g, ""));
    return nameMatch || phoneMatch;
  });

  return (
    <div className="inbox-container">
      <aside className="inbox-sidebar">
        <div className="sidebar-top">
          <h3>Clients</h3>

          <button onClick={openAddClientForm}>Add Client</button>

          <input
            className="client-search"
            type="text"
            placeholder="Search by name or phone.."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* ✅ ONLY this section scrolls (fixes “two sliders”) */}
        <div className="client-list">
          <ul className="client-ul">
            {filteredClients.map((client) => {
              const selected = selectedClient && selectedClient.id === client.id;
              const statusName = client.status_id ? getStatusName(client.status_id) : "";

              return (
                <li
                  key={client.id}
                  className={`client-card ${selected ? "selected" : ""}`}
                  onClick={() => setSelectedClient(client)}
                >
                  <div className="client-row">
                    <div className="client-name">
                      <span className="status-dot" data-status={statusName || ""} />
                      {client.name || "No Name"}
                    </div>
                    <div className="client-phone">{client.phone || "No phone"}</div>
                  </div>

                  {/* ✅ Keep dropdown, no extra label underneath */}
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

                  <div className="client-meta">
                    {(client.language === "Spanish" ? "Spanish" : "English") || ""}
                  </div>

                  {selected && (
                    <div className="client-details">
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
        </div>
      </aside>

      <main className="inbox-main">
        {!selectedClient && (
          <div className="empty-state">
            <h3>Select a client to view messages</h3>
          </div>
        )}

        {selectedClient && (
          <>
            <div className="inbox-main-header">
              <h2 style={{ margin: 0, fontWeight: 700 }}>
                Conversation with {selectedClient.name}
              </h2>

              <div className="header-actions">
                <button className="edit-btn" onClick={openEditClientForm}>
                  Edit Client
                </button>
                <button className="delete-btn" onClick={handleDeleteClient}>
                  Delete Client
                </button>
              </div>
            </div>

            <div className="messages">
              {loadingMessages && <div>Loading messages...</div>}
              {!loadingMessages && messages.length === 0 && (
                <div className="no-messages">No messages yet!</div>
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
                      ? "system"
                      : msg.sender === "me" || msg.direction === "outbound"
                      ? "me"
                      : "client";

                  return (
                    <React.Fragment key={i}>
                      {showDate && (
                        <div className="date-divider">
                          {format(msgDate, "EEEE, MMM d, yyyy")}
                        </div>
                      )}

                      <div className={`message ${bubbleClass}`}>
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

              {typing && <div className="typing-indicator">You are typing...</div>}
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
