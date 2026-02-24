// src/inbox/ConversationHeader.js
import React from "react";

export default function ConversationHeader({
  selectedClient,
  isMobile,
  onBack,
  onEdit,
  onDelete,
  onShowDetails,
}) {
  if (!selectedClient) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 10,
      }}
    >
      {isMobile && (
        <button
          onClick={onBack}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "none",
            background: "#e2e8f0",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      )}

      <h2 style={{ margin: 0, fontWeight: 900 }}>
        Conversation with {selectedClient.name}
      </h2>

      <button
        onClick={onEdit}
        style={{
          marginLeft: "auto",
          background: "#818cf8",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "8px 16px",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        Edit
      </button>

      <button
        onClick={onDelete}
        style={{
          background: "#f43f5e",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          padding: "8px 16px",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        Delete
      </button>

      <button
        onClick={onShowDetails}
        style={{
          background: "#e2e8f0",
          border: "none",
          borderRadius: 10,
          padding: "8px 14px",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        ⋯
      </button>
    </div>
  );
}
