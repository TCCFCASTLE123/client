import React from "react";

function ToastBanner({ toast, onClose, onJump }) {
  if (!toast?.show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 18,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        width: "min(680px, calc(100vw - 24px))",
        background: "#111827",
        color: "#fff",
        borderRadius: 14,
        boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: "#22c55e",
          flex: "0 0 auto",
        }}
      />

      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 13 }}>
          New message
        </div>
        <div
          style={{
            fontSize: 13,
            opacity: 0.92,
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {toast.text}
        </div>
      </div>

      {toast.clientId && (
        <button
          onClick={() => onJump(toast.clientId)}
          style={{
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.10)",
            color: "#fff",
            padding: "8px 10px",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: 800,
            fontSize: 12,
            whiteSpace: "nowrap",
          }}
        >
          Open
        </button>
      )}

      <button
        onClick={onClose}
        style={{
          border: "none",
          background: "transparent",
          color: "rgba(255,255,255,0.75)",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          padding: "6px 8px",
        }}
      >
        ×
      </button>
    </div>
  );
}

export default ToastBanner;
