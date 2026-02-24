// src/inbox/DetailsDrawer.js
import React from "react";

export default function DetailsDrawer({
  selectedClient,
  isMobile,
  showDetails,
  onClose,
}) {
  if (!showDetails || !selectedClient) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: isMobile ? "100%" : "360px",
        background: "#fff",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
        padding: 20,
        zIndex: 9999,
        overflowY: "auto",
        transition: "transform 0.3s ease",
      }}
    >
      <button
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          fontSize: 20,
          cursor: "pointer",
          marginBottom: 10,
        }}
      >
        ✕
      </button>

      <h3 style={{ marginTop: 0 }}>Client Details</h3>

      <div style={{ marginBottom: 8 }}>
        <b>Phone:</b> {selectedClient.phone}
      </div>

      {selectedClient.email && (
        <div><b>Email:</b> {selectedClient.email}</div>
      )}

      {selectedClient.office && (
        <div><b>Office:</b> {selectedClient.office}</div>
      )}

      {selectedClient.case_type && (
        <div><b>Case:</b> {selectedClient.case_type}</div>
      )}

      {selectedClient.case_subtype && (
        <div><b>Subcase:</b> {selectedClient.case_subtype}</div>
      )}

      {selectedClient.notes && (
        <div style={{ marginTop: 10 }}>
          <b>Notes:</b><br />
          {selectedClient.notes}
        </div>
      )}
    </div>
  );
}
