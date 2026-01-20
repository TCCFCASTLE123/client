import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const BLANK = {
  status: "",
  office: "",
  case_type: "",
  appointment_type: "",
  language: "",
  delay_hours: 0,
  template: "",
  active: 1,
  attorney_assigned: "", // ✅ ADD
};

function getToken() {
  return localStorage.getItem("token") || "";
}

export default function TemplateFormPage() {
  const { id } = useParams(); // id can be "new" route or actual id depending on your setup
  const navigate = useNavigate();
  const [form, setForm] = useState(BLANK);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing template if editing
  useEffect(() => {
    if (!id) return;
    if (String(id) === "new") return;

    setLoading(true);
    fetch(process.env.REACT_APP_API_URL + "/api/templates/" + id, {
      headers: { Authorization: "Bearer " + getToken() },
    })
      .then((res) => res.json())
      .then((data) => {
        setForm({
          ...BLANK,
          ...data,
          active: Number(data?.active) ? 1 : 0,
          delay_hours: Number(data?.delay_hours || 0),
          attorney_assigned: String(data?.attorney_assigned || ""), // ✅ KEEP
        });
      })
      .catch(() => {
        alert("Failed to load template");
        navigate("/admin/templates");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const save = async (e) => {
    e.preventDefault();
    if (!String(form.template || "").trim()) return alert("Template message required.");

    setSaving(true);
    try {
      const isEdit = !!id && String(id) !== "new";
      const url = process.env.REACT_APP_API_URL + "/api/templates" + (isEdit ? "/" + id : "");
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        status: String(form.status || "").trim(),
        office: String(form.office || "").trim(),
        case_type: String(form.case_type || "").trim(),
        appointment_type: String(form.appointment_type || "").trim(),
        language: String(form.language || "").trim(),
        delay_hours: Number(form.delay_hours || 0),
        template: String(form.template || "").trim(),
        active: form.active ? 1 : 0,
        attorney_assigned: String(form.attorney_assigned || "").trim(), // ✅ SEND
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to save template");
      }

      navigate("/admin/templates");
    } catch (err) {
      alert(err.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  const isEditing = !!id && String(id) !== "new";

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>
          {isEditing ? "Edit Template Step" : "Add Template Step"}
        </div>
        <button
          onClick={() => navigate("/admin/templates")}
          style={{
            marginLeft: "auto",
            border: "1px solid #e2e8f0",
            background: "#fff",
            padding: "8px 12px",
            borderRadius: 10,
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Back
        </button>
      </div>

      <form onSubmit={save} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10 }}>
          <Field label="Status">
            <input value={form.status || ""} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} style={fieldStyle} />
          </Field>

          <Field label="Language">
            <input value={form.language || ""} onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))} style={fieldStyle} />
          </Field>

          <Field label="Case Type">
            <input value={form.case_type || ""} onChange={(e) => setForm((p) => ({ ...p, case_type: e.target.value }))} style={fieldStyle} />
          </Field>

          <Field label="Office">
            <input value={form.office || ""} onChange={(e) => setForm((p) => ({ ...p, office: e.target.value }))} style={fieldStyle} />
          </Field>

          <Field label="Appt Type">
            <input
              value={form.appointment_type || ""}
              onChange={(e) => setForm((p) => ({ ...p, appointment_type: e.target.value }))}
              style={fieldStyle}
            />
          </Field>
        </div>

        {/* ✅ Attorney Assigned row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
          <Field label="Assigned Attorney (rule)">
            <input
              value={form.attorney_assigned || ""}
              onChange={(e) => setForm((p) => ({ ...p, attorney_assigned: e.target.value }))}
              style={fieldStyle}
              placeholder="e.g., Blake Mayes"
            />
          </Field>

          <div />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
          <Field label="Delay (hours)" style={{ flex: 1 }}>
            <input
              type="number"
              min="0"
              value={Number(form.delay_hours || 0)}
              onChange={(e) => setForm((p) => ({ ...p, delay_hours: Number(e.target.value || 0) }))}
              style={fieldStyle}
            />
          </Field>

          <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 900, marginTop: 22 }}>
            <input
              type="checkbox"
              checked={!!form.active}
              onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked ? 1 : 0 }))}
            />
            Active
          </label>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginLeft: "auto",
              border: "none",
              background: "#22c55e",
              color: "#fff",
              padding: "10px 14px",
              borderRadius: 12,
              fontWeight: 900,
              cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>Message</div>
          <textarea
            value={form.template || ""}
            onChange={(e) => setForm((p) => ({ ...p, template: e.target.value }))}
            rows={10}
            style={{
              width: "100%",
              borderRadius: 12,
              border: "1px solid #cbd5e1",
              padding: 12,
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.35,
              resize: "vertical",
            }}
          />
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={style}>
      <div style={{ fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const fieldStyle = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  padding: "10px 12px",
  fontWeight: 800,
  fontSize: 13,
};
