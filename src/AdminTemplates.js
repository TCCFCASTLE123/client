import React, { useEffect, useMemo, useState } from "react";

function getToken() {
  return localStorage.getItem("token") || "";
}

const API = process.env.REACT_APP_API_URL;

const fieldLabel = (v, fallback = "Any") => (v && String(v).trim() ? String(v).trim() : fallback);
const norm = (v) => String(v || "").trim();

function groupKey(t) {
  // rule bucket
  return [
    norm(t.status),
    norm(t.language),
    norm(t.case_type),
    norm(t.office),
    norm(t.appointment_type),
  ].join("||");
}

function formatDelay(hours) {
  const h = Number(hours || 0);
  if (!h) return "Immediate";
  if (h % 24 === 0) {
    const days = h / 24;
    return days === 1 ? "After 1 day" : `After ${days} days`;
  }
  return `After ${h} hours`;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  // filters/search
  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  // expand/collapse
  const [openRuleKey, setOpenRuleKey] = useState(null);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // template row or "draft"
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function loadTemplates() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/templates`, {
        headers: { Authorization: "Bearer " + getToken() },
      });
      const data = await res.json().catch(() => []);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (e) {
      alert(e.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rules = useMemo(() => {
    const list = Array.isArray(templates) ? templates : [];
    const query = q.trim().toLowerCase();

    let filtered = list;

    if (onlyActive) filtered = filtered.filter((t) => Number(t.active) === 1);

    if (query) {
      filtered = filtered.filter((t) => {
        const hay = [
          t.status,
          t.language,
          t.case_type,
          t.office,
          t.appointment_type,
          t.template,
          t.delay_hours,
          t.id,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
    }

    const byKey = new Map();
    for (const t of filtered) {
      const k = groupKey(t);
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push(t);
    }

    const groups = Array.from(byKey.entries()).map(([k, rows]) => {
      // sort steps by delay then id
      rows.sort((a, b) => (Number(a.delay_hours || 0) - Number(b.delay_hours || 0)) || (Number(b.id) - Number(a.id)));
      const head = rows[0] || {};
      const activeCount = rows.filter((r) => Number(r.active) === 1).length;

      return {
        key: k,
        status: norm(head.status),
        language: norm(head.language),
        case_type: norm(head.case_type),
        office: norm(head.office),
        appointment_type: norm(head.appointment_type),
        steps: rows,
        activeCount,
      };
    });

    // sort rules: status, language, case_type, office
    groups.sort((a, b) => {
      const A = [a.status, a.language, a.case_type, a.office, a.appointment_type].join(" | ").toLowerCase();
      const B = [b.status, b.language, b.case_type, b.office, b.appointment_type].join(" | ").toLowerCase();
      return A.localeCompare(B);
    });

    return groups;
  }, [templates, q, onlyActive]);

  const distinct = useMemo(() => {
    const list = Array.isArray(templates) ? templates : [];
    const pick = (field) => {
      const s = new Set(list.map((t) => norm(t[field])).filter(Boolean));
      return Array.from(s).sort((a, b) => a.localeCompare(b));
    };
    return {
      statuses: pick("status"),
      languages: pick("language"),
      caseTypes: pick("case_type"),
      offices: pick("office"),
      apptTypes: pick("appointment_type"),
    };
  }, [templates]);

  const openNewRule = () => {
    setErr("");
    setEditing({
      id: null,
      status: "",
      language: "",
      case_type: "",
      office: "",
      appointment_type: "",
      delay_hours: 0,
      template: "",
      active: 1,
      __mode: "create",
    });
    setModalOpen(true);
  };

  const openAddStepForRule = (rule) => {
    setErr("");
    setEditing({
      id: null,
      status: rule.status || "",
      language: rule.language || "",
      case_type: rule.case_type || "",
      office: rule.office || "",
      appointment_type: rule.appointment_type || "",
      delay_hours: 24,
      template: "",
      active: 1,
      __mode: "create",
    });
    setModalOpen(true);
  };

  const openEditStep = (row) => {
    setErr("");
    setEditing({
      ...row,
      __mode: "edit",
      active: Number(row.active) ? 1 : 0,
      delay_hours: Number(row.delay_hours || 0),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setErr("");
  };

  async function saveTemplate() {
    if (!editing) return;

    const payload = {
      status: norm(editing.status),
      office: norm(editing.office),
      case_type: norm(editing.case_type),
      appointment_type: norm(editing.appointment_type),
      language: norm(editing.language),
      delay_hours: Number(editing.delay_hours || 0),
      template: String(editing.template || "").trim(),
      active: editing.active ? 1 : 0,
    };

    if (!payload.template) {
      setErr("Template message required.");
      return;
    }

    setSaving(true);
    setErr("");

    try {
      if (editing.__mode === "edit" && editing.id) {
        const res = await fetch(`${API}/api/templates/${editing.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + getToken(),
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Failed to update template");

        // update local list
        setTemplates((prev) =>
          (Array.isArray(prev) ? prev : []).map((t) => (t.id === editing.id ? { ...t, ...payload, id: editing.id } : t))
        );
      } else {
        const res = await fetch(`${API}/api/templates`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + getToken(),
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || "Failed to add template");

        setTemplates((prev) => [{ ...payload, id: data?.id ?? Date.now() }, ...(Array.isArray(prev) ? prev : [])]);
      }

      setModalOpen(false);
      setEditing(null);
    } catch (e) {
      setErr(e.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  async function deleteStep(row) {
    if (!row?.id) return;
    if (!window.confirm("Delete this step?")) return;

    try {
      const res = await fetch(`${API}/api/templates/${row.id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + getToken() },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to delete");
      setTemplates((prev) => (Array.isArray(prev) ? prev : []).filter((t) => t.id !== row.id));
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  }

  async function toggleActive(row) {
    if (!row?.id) return;
    const nextActive = Number(row.active) ? 0 : 1;

    // optimistic UI
    setTemplates((prev) =>
      (Array.isArray(prev) ? prev : []).map((t) => (t.id === row.id ? { ...t, active: nextActive } : t))
    );

    try {
      const payload = {
        status: norm(row.status),
        office: norm(row.office),
        case_type: norm(row.case_type),
        appointment_type: norm(row.appointment_type),
        language: norm(row.language),
        delay_hours: Number(row.delay_hours || 0),
        template: String(row.template || "").trim(),
        active: nextActive ? 1 : 0,
      };

      const res = await fetch(`${API}/api/templates/${row.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getToken(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to update");
    } catch (e) {
      // rollback
      setTemplates((prev) =>
        (Array.isArray(prev) ? prev : []).map((t) => (t.id === row.id ? { ...t, active: Number(row.active) ? 1 : 0 } : t))
      );
      alert(e.message || "Failed to toggle active");
    }
  }

  return (
    <div style={{ padding: 22, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 20, fontWeight: 900 }}>Templates</div>
        <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>
          Rules (grouped) → Steps (delay-based)
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button
            onClick={loadTemplates}
            style={{
              border: "1px solid #e2e8f0",
              background: "#fff",
              padding: "8px 12px",
              borderRadius: 10,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
          <button
            onClick={openNewRule}
            style={{
              border: "none",
              background: "#6366f1",
              color: "#fff",
              padding: "8px 12px",
              borderRadius: 10,
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            + Add step
          </button>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          padding: 12,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          marginBottom: 16,
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search status, language, case type, body…"
          style={{
            flex: "1 1 360px",
            minWidth: 260,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #cbd5e1",
            fontWeight: 700,
          }}
        />

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, color: "#0f172a" }}>
          <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
          Active only
        </label>

        <div style={{ marginLeft: "auto", color: "#64748b", fontWeight: 800, fontSize: 13 }}>
          {loading ? "Loading…" : `${rules.length} rule(s)`}
        </div>
      </div>

      {/* Rules */}
      {rules.length === 0 && (
        <div style={{ color: "#64748b", fontWeight: 800, padding: 14 }}>
          No templates yet. Click <b>+ Add step</b> to create your first rule step.
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {rules.map((r) => {
          const open = openRuleKey === r.key;

          return (
            <div
              key={r.key}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(15,23,42,0.04)",
              }}
            >
              {/* Rule header */}
              <div
                onClick={() => setOpenRuleKey(open ? null : r.key)}
                style={{
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  background: open ? "#f1f5f9" : "#fff",
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 14, color: "#0f172a" }}>
                  {fieldLabel(r.status, "Any Status")} • {fieldLabel(r.language, "Any Lang")} •{" "}
                  {fieldLabel(r.case_type, "Any Case")}
                </div>

                <div style={{ color: "#64748b", fontWeight: 800, fontSize: 13 }}>
                  {fieldLabel(r.office)} • {fieldLabel(r.appointment_type)}
                </div>

                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      padding: "4px 10px",
                      borderRadius: 999,
                      border: "1px solid #e2e8f0",
                      color: "#334155",
                      background: "#fff",
                    }}
                  >
                    {r.activeCount}/{r.steps.length} active
                  </span>

                  <span style={{ fontWeight: 900, color: "#64748b" }}>{open ? "▾" : "▸"}</span>
                </div>
              </div>

              {/* Steps */}
              {open && (
                <div style={{ padding: 12, borderTop: "1px solid #e2e8f0", background: "#fff" }}>
                  <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                    <button
                      onClick={() => openAddStepForRule(r)}
                      style={{
                        border: "none",
                        background: "#0ea5e9",
                        color: "#fff",
                        padding: "8px 12px",
                        borderRadius: 10,
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      + Add step to this rule
                    </button>

                    <div style={{ marginLeft: "auto", color: "#64748b", fontWeight: 800, fontSize: 13 }}>
                      Steps are sorted by delay.
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {r.steps.map((s) => {
                      const isActive = Number(s.active) === 1;

                      return (
                        <div
                          key={s.id}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 14,
                            padding: 12,
                            background: isActive ? "#ffffff" : "#f8fafc",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ fontWeight: 900, color: "#0f172a" }}>{formatDelay(s.delay_hours)}</div>

                            <span
                              style={{
                                marginLeft: 6,
                                fontSize: 12,
                                fontWeight: 900,
                                padding: "3px 10px",
                                borderRadius: 999,
                                background: isActive ? "#dcfce7" : "#fee2e2",
                                color: isActive ? "#166534" : "#991b1b",
                              }}
                            >
                              {isActive ? "Active" : "Off"}
                            </span>

                            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                              <button
                                onClick={() => toggleActive(s)}
                                style={{
                                  border: "1px solid #e2e8f0",
                                  background: "#fff",
                                  padding: "7px 10px",
                                  borderRadius: 10,
                                  fontWeight: 900,
                                  cursor: "pointer",
                                }}
                              >
                                Toggle
                              </button>

                              <button
                                onClick={() => openEditStep(s)}
                                style={{
                                  border: "none",
                                  background: "#6366f1",
                                  color: "#fff",
                                  padding: "7px 10px",
                                  borderRadius: 10,
                                  fontWeight: 900,
                                  cursor: "pointer",
                                }}
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => deleteStep(s)}
                                style={{
                                  border: "none",
                                  background: "#ef4444",
                                  color: "#fff",
                                  padding: "7px 10px",
                                  borderRadius: 10,
                                  fontWeight: 900,
                                  cursor: "pointer",
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <div
                            style={{
                              marginTop: 8,
                              color: "#334155",
                              fontSize: 13,
                              whiteSpace: "pre-wrap",
                              lineHeight: 1.35,
                            }}
                          >
                            {s.template}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && editing && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,23,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: 14,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(920px, 100%)",
              background: "#fff",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.30)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                background: "#0f172a",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 900 }}>
                {editing.__mode === "edit" ? `Edit step #${editing.id}` : "Add step"}
              </div>
              <div style={{ opacity: 0.8, fontWeight: 800, fontSize: 12 }}>
                Rule = Status / Language / Case Type / Office / Appointment Type
              </div>

              <button
                onClick={closeModal}
                style={{
                  marginLeft: "auto",
                  border: "none",
                  background: "rgba(255,255,255,0.12)",
                  color: "#fff",
                  padding: "6px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                Close
              </button>
            </div>

            <div style={{ padding: 14 }}>
              {!!err && (
                <div
                  style={{
                    background: "#fee2e2",
                    color: "#991b1b",
                    border: "1px solid #fecaca",
                    padding: 10,
                    borderRadius: 12,
                    fontWeight: 900,
                    marginBottom: 12,
                  }}
                >
                  {err}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>Status</div>
                  <input
                    value={editing.status || ""}
                    onChange={(e) => setEditing((p) => ({ ...p, status: e.target.value }))}
                    list="status-list"
                    placeholder="(blank = any)"
                    style={fieldStyle}
                  />
                  <datalist id="status-list">
                    {distinct.statuses.map((x) => (
                      <option key={x} value={x} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>Language</div>
                  <input
                    value={editing.language || ""}
                    onChange={(e) => setEditing((p) => ({ ...p, language: e.target.value }))}
                    list="lang-list"
                    placeholder="(blank = any)"
                    style={fieldStyle}
                  />
                  <datalist id="lang-list">
                    {distinct.languages.map((x) => (
                      <option key={x} value={x} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>Case Type</div>
                  <input
                    value={editing.case_type || ""}
                    onChange={(e) => setEditing((p) => ({ ...p, case_type: e.target.value }))}
                    list="case-list"
                    placeholder="(blank = any)"
                    style={fieldStyle}
                  />
                  <datalist id="case-list">
                    {distinct.caseTypes.map((x) => (
                      <option key={x} value={x} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>Office</div>
                  <input
                    value={editing.office || ""}
                    onChange={(e) => setEditing((p) => ({ ...p, office: e.target.value }))}
                    list="office-list"
                    placeholder="(blank = any)"
                    style={fieldStyle}
                  />
                  <datalist id="office-list">
                    {distinct.offices.map((x) => (
                      <option key={x} value={x} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>Appt Type</div>
                  <input
                    value={editing.appointment_type || ""}
                    onChange={(e) => setEditing((p) => ({ ...p, appointment_type: e.target.value }))}
                    list="appttype-list"
                    placeholder="(blank = any)"
                    style={fieldStyle}
                  />
                  <datalist id="appttype-list">
                    {distinct.apptTypes.map((x) => (
                      <option key={x} value={x} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#334155", marginBottom: 6 }}>Delay (hours)</div>
                  <input
                    type="number"
                    value={Number(editing.delay_hours || 0)}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p, delay_hours: clamp(Number(e.target.value || 0), 0, 24 * 365) }))
                    }
                    style={fieldStyle}
                  />
                  <div style={{ marginTop: 6, color: "#64748b", fontWeight: 800, fontSize: 12 }}>
                    {formatDelay(editing.delay_hours)}
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 900, marginTop: 18 }}>
                  <input
                    type="checkbox"
                    checked={!!editing.active}
                    onChange={(e) => setEditing((p) => ({ ...p, active: e.target.checked ? 1 : 0 }))}
                  />
                  Active
                </label>

                <button
                  onClick={saveTemplate}
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
                  value={editing.template || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, template: e.target.value }))}
                  rows={8}
                  placeholder="Write the message template…"
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
                <div style={{ marginTop: 8, color: "#64748b", fontWeight: 800, fontSize: 12 }}>
                  Tip: keep one “step” per delay. You’ll schedule these per status/language/case.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
