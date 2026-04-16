/** =========================
 * ClientForm
 * (removed intake coordinator field)
 * ========================= */
import React, { useState } from "react";
import api from "../services/api";
import { canonicalPhone } from "../utils/phone";

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
  if (!cleanPhone || cleanPhone.length < 10)
    return setErrMsg("Phone number is required (10 digits).");
  if (!office) return setErrMsg("Office is required.");
  if (!caseType) return setErrMsg("Case Type is required.");

  const payload = {
    name: cleanName,
    phone: cleanPhone,
  };

  if (email?.trim()) payload.email = email.trim();
  if (notes?.trim()) payload.notes = notes.trim();
  if (language?.trim()) payload.language = language.trim();
  if (office?.trim()) payload.office = office.trim();
  if (caseType?.trim()) payload.case_type = caseType.trim();
  if (caseSubtype?.trim()) payload.case_subtype = caseSubtype.trim();
  if (apptDate?.trim()) payload.appt_date = apptDate.trim();
  if (apptTime?.trim()) payload.appt_time = apptTime.trim();
  if (apptSetter?.trim()) payload.appt_setter = apptSetter.trim();
  if (ic?.trim()) payload.ic = ic.trim();
  if (attorneyAssigned?.trim())
    payload.attorney_assigned = attorneyAssigned.trim();

  try {
    setSaving(true);

    const savedClient = initialData.id
      ? await api.updateClient(initialData.id, payload)
      : await api.createClient(payload);

    onSave(savedClient);
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
<h4>Contact</h4>
        <div className="cc-row">
          <input className="cc-field" placeholder="Name*" value={name} onChange={(e) => setName(e.target.value)} required />
          <input className="cc-field" placeholder="Phone*" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
<h4>Appointment</h4>
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
<h4>Case Info</h4>
        <div className="cc-row">
          <select className="cc-field" value={caseType} onChange={(e) => setCaseType(e.target.value)} required>
            <option value="">Select Case Type</option>
            <option value="Criminal">Criminal</option>
            <option value="Immigration">Immigration</option>
            <option value="Bankruptcy">Bankruptcy</option>
      <option value="Personal Injury">Personal Injury</option>
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
<h4>Notes</h4>
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
export default ClientForm;
