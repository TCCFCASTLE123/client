import React, { useEffect, useState, useRef } from "react";
import { format } from "date-fns";

// =========================
// ClientForm Component
// =========================
function ClientForm({ initialData = {}, onClose, onSave }) {
  const [name, setName] = useState(initialData.name || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [notes, setNotes] = useState(initialData.notes || "");
  const [language, setLanguage] = useState(initialData.language || "");
  const [office, setOffice] = useState(initialData.office || "");
  const [caseType, setCaseType] = useState(initialData.case_type || "");
  // --- NEW FIELDS ---
  const [appointmentDate, setAppointmentDate] = useState(initialData.AppointmentScheduledDate || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Name is required");
    const method = initialData.id ? "PATCH" : "POST";
    const url = initialData.id
      ? `${process.env.REACT_APP_API_URL}/api/clients/${initialData.id}`
      : `${process.env.REACT_APP_API_URL}/api/clients`;
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          notes,
          language,
          office,
          case_type: caseType,
          AppointmentScheduledDate: appointmentDate,
        }),
      });
      if (!response.ok) throw new Error("Failed to save client");
      const savedClient = await response.json();
      onSave(savedClient);
    } catch (err) {
      alert(err.message || "Error saving client");
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
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
        {/* --- NEW ROW FOR  Appointment Date/Time --- */}
        <div style={{ display: "flex", gap: 12 }}>
          <input
            placeholder="Appointment Date/Time"
            value={appointmentDate}
            onChange={e => setAppointmentDate(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        {/* END NEW ROW */}
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
          <button type="submit" style={{ flex: 1 }}>
            {initialData.id ? "Save" : "Add"}
          </button>
          <button type="button" onClick={onClose} style={{ flex: 1 }}>
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

  // Fetch statuses and clients
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

  // Fetch messages
  useEffect(() => {
    if (selectedClient) {
      setLoadingMessages(true);
      fetch(
        `${process.env.REACT_APP_API_URL}/api/messages/conversation/${selectedClient.id}`,
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        }
      )
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

  // Scroll to latest message
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

  // SEND MESSAGE
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
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/messages/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok)
        throw new Error((await response.text()) || "Failed to send message");

      await fetch(
        `${process.env.REACT_APP_API_URL}/api/messages/conversation/${selectedClient.id}`,
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        }
      )
        .then((res) => res.json())
        .then((data) => {
          setMessages(data);
          if (messagesEndRef.current)
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        });
      setNewMsg("");
    } catch (err) {
      alert("Could not send message: " + (err.message || err));
      console.error("Send error:", err);
    }
  };

  // Add/Edit client modal handlers
  const openAddClientForm = () => {
    setEditClientData(null);
    setShowClientForm(true);
  };
  const openEditClientForm = () => {
    setEditClientData(selectedClient);
    setShowClientForm(true);
  };

  // Save (add/edit) client handler
  const handleClientSave = (savedClient) => {
    if (editClientData) {
      setClients(clients.map((c) => (c.id === savedClient.id ? savedClient : c)));
      setSelectedClient(savedClient);
    } else {
      setClients([...clients, savedClient]);
    }
    setShowClientForm(false);
  };

  // Delete client handler
  const handleDeleteClient = async () => {
    if (
      window.confirm(
        `Delete client "${selectedClient.name}" and all messages?`
      )
    ) {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/clients/${selectedClient.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: "Bearer " + localStorage.getItem("token"),
            },
          }
        );
        if (!res.ok) throw new Error("Failed to delete client");
        setClients(clients.filter((c) => c.id !== selectedClient.id));
        setSelectedClient(null);
        setMessages([]);
      } catch (err) {
        alert(err.message || "Failed to delete client");
      }
    }
  };

  // Update only the status for a client
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
            clients.map((c) =>
              c.id === clientId ? { ...c, status_id: statusId } : c
            )
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

  // Filtered clients for search bar
  const filteredClients = clients.filter(
    (c) =>
      !search ||
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone &&
        c.phone.replace(/\D/g, "").includes(search.replace(/\D/g, ""))
      )
  );

  return (
    <div className="inbox-container" style={{ display: "flex", minHeight: 600 }}>
      {/* Sidebar */}
      <aside className="inbox-sidebar" style={{ width: 340, background: "#f8fafc", padding: 18 }}>
        <h3 style={{ marginTop: 0 }}>Clients</h3>
        <button onClick={openAddClientForm} style={{
          width: "100%",
          marginBottom: 12,
          background: "#374151",
          color: "#fff",
          borderRadius: 8,
          border: "none",
          padding: "9px 0",
          fontWeight: "bold",
          fontSize: 15,
          cursor: "pointer"
        }}>
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
        <ul style={{ padding: 0, listStyle: "none" }}>
          {filteredClients.map((client) => (
            <li
              key={client.id}
              className={
                selectedClient && selectedClient.id === client.id ? "selected" : ""
              }
              onClick={() => setSelectedClient(client)}
              style={{
                background: selectedClient && selectedClient.id === client.id ? "#c7d2fe" : "#fff",
                borderRadius: 10,
                padding: 14,
                marginBottom: 9,
                cursor: "pointer",
                boxShadow: selectedClient && selectedClient.id === client.id
                  ? "0 2px 12px #c7d2fe50"
                  : "0 1px 4px #cbd5e140"
              }}
            >
             <div
                style={{
                  fontWeight: 600,
                  fontSize: 16,
                  color: selectedClient && selectedClient.id === client.id ? "#2563eb" : "#222",
                  transition: "color 0.1s"
                }}
              >
                {client.name || "No Name"}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: selectedClient && selectedClient.id === client.id ? "#2563eb" : "#444",
                  transition: "color 0.1s"
                }}
              >
                {client.phone || "No phone"}
              </div>
              <div>
                <select
                  className="status-dropdown"
                  value={client.status_id || ""}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleStatusChange(client.id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    marginTop: 6,
                    marginBottom: 6,
                    borderRadius: 5,
                    border: "1px solid #e0e7ef",
                    padding: "3px 6px"
                  }}
                >
                  <option value="">Select status...</option>
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
                {client.status_id && (
                  <span
                    style={{
                      background: "#eef2ff",
                      color: "#4338ca",
                      borderRadius: 8,
                      padding: "2px 8px",
                      marginLeft: 8,
                      fontSize: 12
                    }}
                  >
                    {getStatusName(client.status_id)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: "#888" }}>
                {client.language === "Spanish" ? "Spanish" : "English"}
              </div>
              {selectedClient && selectedClient.id === client.id && (
                <div style={{ marginTop: 8, color: "#555", fontSize: 13 }}>
                  {client.email && <div>Email: {client.email}</div>}
                  {client.notes && <div>Notes: {client.notes}</div>}
                  {client.office && <div>Office: {client.office}</div>}
                  {client.case_type && <div>Case: {client.case_type}</div>}
                  {/* Display new fields if present */}
                  {client.ClientFirstName && <div>First Name: {client.ClientFirstName}</div>}
                  {client.AppointmentScheduledDate && <div>Appt: {client.AppointmentScheduledDate}</div>}
                </div>
              )}
            </li>
          ))}
        </ul>
      </aside>

      {/* Main conversation area */}
      <main className="inbox-main" style={{ flex: 1, padding: 32, minHeight: 600 }}>
        {!selectedClient && (
          <div style={{ color: "#888", margin: "auto", textAlign: "center" }}>
            <h3>Select a client to view messages</h3>
          </div>
        )}

        {selectedClient && (
          <>
            <div className="header-row" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
              <h2 style={{ margin: 0, fontWeight: 700 }}>Conversation with {selectedClient.name}</h2>
              <select
                className="status-dropdown"
                value={selectedClient.status_id || ""}
                onChange={(e) =>
                  handleStatusChange(selectedClient.id, e.target.value)
                }
                style={{ marginRight: 8, padding: "2px 6px" }}
              >
                <option value="">Select status...</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
              {selectedClient.status_id && (
                <span style={{
                  background: "#eef2ff",
                  color: "#4338ca",
                  borderRadius: 8,
                  padding: "2px 8px",
                  fontSize: 12
                }}>
                  {getStatusName(selectedClient.status_id)}
                </span>
              )}
              <span
                className="client-language"
                style={{ fontSize: 13, color: "#555", marginLeft: 10 }}
              >
                {selectedClient.language === "es" ? "Spanish" : "English"}
              </span>
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
                  cursor: "pointer"
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
                  cursor: "pointer"
                }}
              >
                Delete Client
              </button>
            </div>

            <div className="messages" style={{
              background: "#f4f7fa",
              borderRadius: 12,
              minHeight: 220,
              padding: 18,
              marginBottom: 16,
              maxHeight: 400,
              overflowY: "auto",
              boxShadow: "0 1px 4px #e0e7ef"
            }}>
              {loadingMessages && <div>Loading messages...</div>}
              {!loadingMessages && messages.length === 0 && (
                <div className="no-messages" style={{ color: "#aaa" }}>No messages yet!</div>
              )}
              {/* --- Message Grouping By Date --- */}
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
                  return (
                    <React.Fragment key={i}>
                      {showDate && (
                        <div className="date-divider">
                          {format(msgDate, "EEEE, MMM d, yyyy")}
                        </div>
                      )}
                      <div
                        className={`message ${
                          msg.sender === "system"
                            ? "system"
                            : msg.sender === "me" || msg.direction === "outbound"
                            ? "me"
                            : "client"
                        }`}
                        style={{
                          background: msg.sender === "system" ? "#e0e7ef" : undefined,
                          color: msg.sender === "system" ? "#7c3aed" : undefined,
                          fontStyle: msg.sender === "system" ? "italic" : undefined,
                          padding: "7px 16px",
                          borderRadius: "10px",
                          margin: "8px 0"
                        }}
                      >
                        <div className="message-text">
                          {msg.text}
                        </div>
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
                  outline: "none"
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
                  opacity: !newMsg.trim() ? 0.7 : 1
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
