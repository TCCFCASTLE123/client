import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

// Options
const STATUS_OPTIONS = [
  "Pending", "Retained", "No Money", "Seen Can't Help", "Did Not Retain",
  "Set", "Working To Set", "Showed", "No Show", "Can't Help", "Attempted/Unsuccessful"
];
const OFFICE_OPTIONS = [
  { value: "", label: "Any Office" },
  { value: "PHX", label: "PHX" },
  { value: "MESA", label: "MESA" },
  { value: "OP", label: "OP" },
  { value: "ZOOM", label: "ZOOM" }
];
const CASE_TYPE_OPTIONS = [
  { value: "", label: "Any Case Type" },
  { value: "Criminal", label: "Criminal" },
  { value: "Immigration", label: "Immigration" },
  { value: "Personal Injury", label: "Personal Injury" },
  { value: "Bankruptcy", label: "Bankruptcy" }
];
const LANGUAGE_OPTIONS = [
  { value: "", label: "Any Language" },
  { value: "English", label: "English" },
  { value: "Spanish", label: "Spanish" }
];

const BLANK = {
  status: "",
  office: "",
  case_type: "",
  language: "",
  delay_hours: "",
  template: "",
  active: true,
};

export function TemplateForm({ initialData, onSave }) {
  const [form, setForm] = useState(initialData || BLANK);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const method = initialData?.id ? "PUT" : "POST";
    const url = process.env.REACT_APP_API_URL + "/api/templates" + (initialData?.id ? "/" + initialData.id : "");
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) return alert("Failed to save template");
    onSave && onSave();
    navigate("/admin/templates");
  };

  return (
    <div style={{ maxWidth: 600, margin: "50px auto", padding: 32, background: "#fff", borderRadius: 18, boxShadow: "0 2px 16px #0001" }}>
      <h2 style={{ fontSize: 28, marginBottom: 28 }}>{initialData?.id ? "Edit Template" : "Add Template"}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
          <select required value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="">Any Status</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select value={form.office} onChange={e => setForm({ ...form, office: e.target.value })}>
            {OFFICE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select value={form.case_type} onChange={e => setForm({ ...form, case_type: e.target.value })}>
            {CASE_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <select required value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
            {LANGUAGE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            max="999"
            placeholder="Delay (hours)"
            value={form.delay_hours}
            onChange={e => setForm({ ...form, delay_hours: e.target.value })}
          />
          <select value={form.active ? "1" : "0"} onChange={e => setForm({ ...form, active: e.target.value === "1" })}>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
        <textarea
          required
          placeholder="Message Template"
          style={{ width: "100%", minHeight: 120, fontSize: 16, marginBottom: 28, borderRadius: 10, border: "1px solid #bbb", padding: 14 }}
          value={form.template}
          onChange={e => setForm({ ...form, template: e.target.value })}
        />
        <div style={{ display: "flex", gap: 18, justifyContent: "flex-end" }}>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={saving}>
            {saving ? "Saving..." : initialData?.id ? "Save" : "Add"}
          </button>
          <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={() => navigate("/admin/templates")}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

// === List Page ===
export default function AdminTemplates() {
  const [templates, setTemplates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(process.env.REACT_APP_API_URL + "/api/templates")
      .then((res) => res.json())
      .then(setTemplates)
      .catch(() => alert("Failed to load templates"));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this template?")) return;
    const res = await fetch(process.env.REACT_APP_API_URL + "/api/templates/" + id, { method: "DELETE" });
    if (!res.ok) return alert("Failed to delete");
    setTemplates(templates.filter((t) => t.id !== id));
  };

  // Duplicates template and optionally lets you change office/case_type
  const handleDuplicate = async (tpl) => {
    // Prompt user for new office/case_type (keep as original if empty)
    let newOffice = window.prompt(
      `Enter office for the duplicate:\n(Leave blank for Any Office, or use one of: PHX, MESA, OP, ZOOM)`,
      tpl.office
    );
    let newCaseType = window.prompt(
      `Enter case type for the duplicate:\n(Leave blank for Any Case Type, or use one of: Criminal, Immigration, Personal Injury, Bankruptcy)`,
      tpl.case_type
    );
    if (newOffice === null || newCaseType === null) return; // cancel

    // Prep new template
    const newTpl = { ...tpl, office: newOffice || "", case_type: newCaseType || "" };
    delete newTpl.id;
    const res = await fetch(process.env.REACT_APP_API_URL + "/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTpl),
    });
    if (!res.ok) return alert("Failed to duplicate template");
    // Refresh
    fetch(process.env.REACT_APP_API_URL + "/api/templates")
      .then((res) => res.json())
      .then(setTemplates);
  };

  // Helper to show 'Any' in the table
  const formatAny = (val, label) => !val ? `Any ${label}` : val;

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">Message Templates Admin</h2>
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-4"
        onClick={() => navigate("/admin/templates/new")}
      >
        Add New Template
      </button>
      <table className="min-w-full border shadow mb-10">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Status</th>
            <th className="p-2">Office</th>
            <th className="p-2">Case Type</th>
            <th className="p-2">Lang</th>
            <th className="p-2">Delay (h)</th>
            <th className="p-2">Template</th>
            <th className="p-2">Active</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {templates.map((tpl) => (
            <tr key={tpl.id} className="border-t">
              <td className="p-2">{tpl.status || "Any Status"}</td>
              <td className="p-2">{formatAny(tpl.office, "Office")}</td>
              <td className="p-2">{formatAny(tpl.case_type, "Case Type")}</td>
              <td className="p-2">{tpl.language || "Any"}</td>
              <td className="p-2">{tpl.delay_hours}</td>
              <td className="p-2 max-w-xs truncate" title={tpl.template}>{tpl.template}</td>
              <td className="p-2">{tpl.active ? "Yes" : "No"}</td>
              <td className="p-2 flex gap-2">
                <button className="text-blue-700" onClick={() => navigate(`/admin/templates/${tpl.id}`)}>Edit</button>
                <button className="text-red-600" onClick={() => handleDelete(tpl.id)}>Delete</button>
                <button className="text-green-600" onClick={() => handleDuplicate(tpl)}>Duplicate</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// === Edit/Add Page Wrapper (for router) ===
export function TemplateFormPage() {
  const { id } = useParams();
  const [tpl, setTpl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetch(process.env.REACT_APP_API_URL + "/api/templates/" + id)
        .then(res => res.json())
        .then(setTpl)
        .catch(() => { alert("Failed to load template"); navigate("/admin/templates"); });
    }
  }, [id, navigate]);

  if (id && !tpl) return <div style={{ padding: 32 }}>Loading...</div>;
  return <TemplateForm initialData={tpl} />;
}
