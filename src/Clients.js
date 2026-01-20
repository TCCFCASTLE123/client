import React, { useState } from "react";

// Main ClientForm Component
function Clients({ initialData = {}, onClose, onSave }) {
  // Core fields
  const [name, setName] = useState(initialData.name || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [notes, setNotes] = useState(initialData.notes || "");
  const [language, setLanguage] = useState(initialData.language || "English");
  const [office, setOffice] = useState(initialData.office || "");
  const [caseType, setCaseType] = useState(initialData.case_type || "");
  const [caseSubtype, setCaseSubtype] = useState(initialData.case_subtype || "");

  // Appointment fields (split)
  const [apptDate, setApptDate] = useState(initialData.appt_date || "");
  const [apptTime, setApptTime] = useState(initialData.appt_time || "");

  // Intake fields
  const [apptSetter, setApptSetter] = useState(initialData.appt_setter || "");
  const [intakeCoordinator, setIntakeCoordinator] = useState(
    initialData.intake_coordinator || ""
  ); const [attorneyAssigned, setAttorneyAssigned] = useState(initialData.attorney_assigned || "");


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
          case_subtype: caseSubtype,
          appt_date: apptDate,
          appt_time: apptTime,
          appt_setter: apptSetter,
          intake_coordinator: intakeCoordinator,
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

        <div style={{ display: "flex", gap: 12 }}>
          <input
            placeholder="Name*"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            style={{ flex: 2 }}
          />
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ flex: 1, maxWidth: 170 }}
          />
        </div>

        {/* Appointment date & time */}
        <div style={{ display: "flex", gap: 12 }}>
          <input
            type="date"
            value={apptDate}
            onChange={(e) => setApptDate(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="time"
            value={apptTime}
            onChange={(e) => setApptTime(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>

        {/* Intake fields */}
        <div style={{ display: "flex", gap: 12 }}>
          <input
            placeholder="Appt Setter"
            value={apptSetter}
            onChange={(e) => setApptSetter(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            placeholder="I.C."
            value={intakeCoordinator}
            onChange={(e) => setIntakeCoordinator(e.target.value)}
            style={{ flex: 1 }}
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
            <option value="">Any Office</option>
            <option value="PHX">PHX</option>
            <option value="MESA">MESA</option>
            <option value="OP">OP</option>
            <option value="ZOOM">ZOOM</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <select
            value={caseType}
            onChange={(e) => setCaseType(e.target.value)}
            style={{ flex: 1 }}
            required
          >
            <option value="">Any Case Type</option>
            <option value="Criminal">Criminal</option>
            <option value="Immigration">Immigration</option>
            <option value="Bankruptcy">Bankruptcy</option>
          </select>

          <input
            placeholder="Sub Case Type"
            value={caseSubtype}
            onChange={(e) => setCaseSubtype(e.target.value)}
            style={{ flex: 1 }}
          />
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

export default Clients;
