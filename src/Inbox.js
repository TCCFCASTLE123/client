import React, { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";

function canonicalPhone(input) {
  if (!input) return "";
  const digits = String(input).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  if (digits.length === 10) return digits;
  return digits;
}

// =========================
// ClientForm
// =========================
function ClientForm({ initialData = {}, onClose, onSave }) {
  const [name, setName] = useState(initialData.name || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [notes, setNotes] = useState(initialData.notes || "");

  const [language, setLanguage] = useState(initialData.language || "English");
  const [office, setOffice] = useState(initialData.office || "");
  const [caseType, setCaseType] = useState(initialData.case_type || "");

  // Optional fields coming from Sheets (if you add them to DB later)
  const [apptSetter, setApptSetter] = useState(initialData.appt_setter || "");
  const [ic, setIc] = useState(initialData.ic || "");

  const [appointmentDate, setAppointmentDate] = useState(
    initialData.AppointmentScheduledDate ||
      initialData.appointment_datetime ||
      ""
  );

  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const CODE_OPTIONS = [
    "CC",
    "CLC",
    "DT",
    "GBC",
    "ILD",
    "JMP",
    "JH",
    "JWG",
    "OXS",
    "OAC",
    "NVA",
    "TRD",
    "Walk-in",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrMsg("");

    const cleanName = (name || "").trim();
    const cleanPhone = canonicalPhone(phone);

    if (!cleanName) return setErrMsg("Name is required.");
    if (!cleanPhone || cleanPhone.length < 10)
      return setErrMsg("Phone number is required (10 digits).");
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

          // only matters if your backend/db supports these
          appt_setter: apptSetter,
          ic: ic,
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
        setErrMsg((data && data.error) || text || "Failed to save client.");
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
      >
        <div className="modal-title-row">
          <h3 className="modal-title">
            {initialData.id ? "Edit Client" : "Add Client"}
          </h3>
        </div>

        {errMsg && <div className="alert-error">{errMsg}</div>}

        <div className="grid-2">
          <div className="field">
            <label>Name*</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              placeholder="Full name"
            />
          </div>

          <div className="field">
            <label>Phone*</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="602..."
            />
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="optional"
            />
          </div>

          <div className="field">
            <label>Office*</label>
            <select value={office} onChange={(e) => setOffice(e.target.value)} required>
              <option value="">Select Office</option>
              <option value="PHX">PHX</option>
              <option value="MESA">MESA</option>
              <option value="OP">OP</option>
              <option value="ZOOM">ZOOM</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label>Case Type*</label>
            <select value={caseType} onChange={(e) => setCaseType(e.target.value)} required>
              <option value="">Select Case Type</option>
              <option value="Criminal">Criminal</option>
              <option value="Immigration">Immigration</option>
              <option value="Bankruptcy">Bankruptcy</option>
            </select>
          </div>

          <div className="field">
            <label>Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label>Appt Setter</label>
            <select value={apptSetter} onChange={(e) => setApptSetter(e.target.value)}>
              <option value="">—</option>
              {CODE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>I.C.</label>
            <select value={ic} onChange={(e) => setIc(e.target.value)}>
              <option value="">—</option>
              {CODE_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Appointment Date/Time</label>
          <input
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            placeholder="optional"
          />
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="anything important..."
          />
        </div>

        <div className="modal-buttons">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : initialData.id ? "Save" : "Add"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// =========================
// Inbox
// =========================
export default function Inbox() {
  const [clients, setClients] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [showClientForm, setShowClientForm] = useState(false);
  const [editClientData, setEditClientData] = useState(null);

  const [search, setSearch] = useState("");
  const messagesEndRef = useRef(null);

  // load statuses + clients
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

  // load conversation
  useEffect(() => {
    if (!selectedClient) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    fetch(
      `${process.env.REACT_APP_API_URL}/api/messages/conversation/${selectedClient.id}`,
      { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
    )
      .then((res) => res.json())
      .then((data) => {
        setMessages(data || []);
        setLoadingMessages(false);
      })
      .catch((err) => {
        alert(err.message);
        setLoadingMessages(false);
      });
  }, [selectedClient]);

  // auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredClients = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return clients;

    const qDigits = q.replace(/\D/g, "");
    return clients.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const phone = String(c.phone || "").replace(/\D/g, "");
      return name.includes(q) || (qDigits && phone.includes(qDigits));
    });
  }, [clients, search]);

  const getStatusName = (statusId) => {
    const found = statuses.find((s) => String(s.id) === String(statusId));
    return found ? found.name : "";
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

        setClients((prev) =>
          prev.map((c) => (c.id === clientId ? { ...c, status_id: statusId } : c))
        );
        if (selectedClient?.id === clientId) {
          setSelectedClient({ ...selectedClient, status_id: statusId });
        }
      })
      .catch((err) => alert(err.message));
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
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/clients/${selectedClient.id}`,
        {
          method: "DELETE",
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        }
      );
      if (!res.ok) throw new Error("Failed to delete client");

      setClients((prev) => prev.filter((c) => c.id !== selectedClient.id));
      setSelectedClient(null);
      setMessages([]);
    } catch (err) {
      alert(err.message || "Failed to delete client");
    }
  };

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

      const updated = await fetch(
        `${process.env.REACT_APP_API_URL}/api/messages/conversation/${selectedClient.id}`,
        { headers: { Authorization: "Bearer " + localStorage.getItem("token") } }
      ).then((r) => r.json());

      setMessages(updated || []);
      setNewMsg("");
    } catch (err) {
      alert("Could not send message: " + (err.message || err));
      console.error("Send error:", err);
    }
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-title-row">
            <h3 className="sidebar-title">Clients</h3>
            <button className="btn btn-primary btn-sm" onClick={openAddClientForm}>
              Add
            </button>
          </div>

          <div className="field">
            <input
              className="input"
              type="text"
              placeholder="Search name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <ul className="client-list">
          {filteredClients.map((client) => {
            const active = selectedClient?.id === client.id;
            const statusName = getStatusName(client.status_id);

            return (
              <li
                key={client.id}
                className={"client-card " + (active ? "active" : "")}
                onClick={() => setSelectedClient(client)}
              >
                <div className="client-card-top">
                  <div className="client-name">{client.name || "No Name"}</div>
                  {statusName ? (
                    <span className="pill pill-status">{statusName}</span>
                  ) : (
                    <span className="pill pill-muted">No status</span>
                  )}
                </div>

                <div className="client-meta">
                  <span>{client.phone || "No phone"}</span>
                  <span className="dot">•</span>
                  <span>{client.language === "Spanish" ? "Spanish" : "English"}</span>
                </div>

                <div className="client-controls" onClick={(e) => e.stopPropagation()}>
                  <select
                    className="select select-sm"
                    value={client.status_id || ""}
                    onChange={(e) => handleStatusChange(client.id, e.target.value)}
                  >
                    <option value="">Set status…</option>
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {active && (
                  <div className="client-details">
                    {client.email && <div><b>Email:</b> {client.email}</div>}
                    {client.office && <div><b>Office:</b> {client.office}</div>}
                    {client.case_type && <div><b>Case:</b> {client.case_type}</div>}
                    {client.appointment_datetime && <div><b>Appt:</b> {client.appointment_datetime}</div>}
                    {client.notes && <div><b>Notes:</b> {client.notes}</div>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </aside>

      <main className="main">
        {!selectedClient && (
          <div className="empty">
            <div className="empty-card">
              <h3>Select a client</h3>
              <p>Pick someone on the left to view and send messages.</p>
            </div>
          </div>
        )}

        {selectedClient && (
          <>
            <div className="main-header">
              <div>
                <div className="title">Conversation</div>
                <div className="subtitle">{selectedClient.name}</div>
              </div>

              <div className="main-actions">
                <button className="btn btn-ghost" onClick={openEditClientForm}>
                  Edit
                </button>
                <button className="btn btn-danger" onClick={handleDeleteClient}>
                  Delete
                </button>
              </div>
            </div>

            <div className="thread">
              {loadingMessages && <div className="muted">Loading…</div>}
              {!loadingMessages && messages.length === 0 && (
                <div className="muted">No messages yet.</div>
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
                  const isMe = msg.sender === "me" || msg.direction === "outbound";
                  const cls = isSystem ? "system" : isMe ? "me" : "client";

                  return (
                    <React.Fragment key={i}>
                      {showDate && (
                        <div className="date-divider">
                          {format(msgDate, "EEEE, MMM d, yyyy")}
                        </div>
                      )}

                      <div className={"bubble " + cls}>
                        <div className="bubble-text">{msg.text}</div>
                        <div className="bubble-meta">
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

              <div ref={messagesEndRef} />
            </div>

            <form className="composer" onSubmit={handleSend}>
              <input
                className="input input-lg"
                type="text"
                placeholder="Type a message…"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                disabled={!selectedClient}
              />
              <button className="btn btn-primary" type="submit" disabled={!newMsg.trim()}>
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
