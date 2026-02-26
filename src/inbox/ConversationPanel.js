// src/inbox/ConversationPanel.js
import React, { useRef, useEffect } from "react";
import { format } from "date-fns";

function safeDate(ts) {
  const d = ts ? new Date(ts) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

export default function ConversationPanel({
  selectedClient,
  messages,
  loadingMessages,
  handleSend,
  newMsg,
  setNewMsg,
  textareaRef,
  messagesEndRef,
}) {
  if (!selectedClient) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          fontWeight: 600,
        }}
      >
        Select a client to view messages
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      {/* HEADER */}
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontWeight: 900 }}>
          Conversation with {selectedClient.name}
        </h2>
      </div>

      {/* MESSAGE LIST (SCROLL AREA) */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 18,
          background: "#f4f7fa",
          borderRadius: 12,
          boxShadow: "0 1px 4px #e0e7ef",
        }}
      >
        {loadingMessages && <div>Loading messages...</div>}

        {!loadingMessages &&
          (Array.isArray(messages) ? messages : []).length === 0 && (
            <div style={{ color: "#aaa" }}>No messages yet!</div>
          )}

        {(Array.isArray(messages) ? messages : []).map((msg, i) => {
          const msgDate = safeDate(msg.timestamp);
          const isSystem = msg.sender === "system";
          const isOutbound =
            msg.direction === "outbound" || msg.sender === "me";

          const bubbleClass = isSystem
            ? "system"
            : isOutbound
            ? "me"
            : "client";

          return (
            <div
              key={i}
              className={`message ${bubbleClass}`}
              style={{
                background: isSystem ? "#f1f5f9" : undefined,
                border: isSystem ? "1px solid #e2e8f0" : undefined,
                color: isSystem ? "#6d28d9" : undefined,
                padding: "8px 14px",
                borderRadius: 14,
                margin: "8px 0",
                maxWidth: "85%",
                width: "fit-content",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
            >
              {msg.image_url ? (
                <div style={{ marginTop: 4 }}>
                  <img
                    src={`${process.env.REACT_APP_API_URL}${msg.image_url}`}
                    alt="attachment"
                    style={{
                      maxWidth: 260,
                      borderRadius: 12,
                      display: "block",
                    }}
                  />
                </div>
              ) : (
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {msg.text}
                </div>
              )}

              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  opacity: 0.7,
                }}
              >
                {format(msgDate, "h:mm a")}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* MESSAGE INPUT */}
      <form
        onSubmit={handleSend}
        style={{
          display: "flex",
          gap: 8,
          padding: 14,
          marginTop: 10,
          background: "#fff",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <textarea
          ref={textareaRef}
          placeholder="Type your message..."
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          rows={1}
          style={{
            flex: 1,
            padding: 13,
            borderRadius: 19,
            border: "1px solid #bfc8da",
            fontSize: 15,
            resize: "none",
            overflowY: "auto",
            maxHeight: 180,
          }}
        />

        <button
          type="submit"
          style={{
            padding: "0 24px",
            borderRadius: 19,
            border: "none",
            background: "#6366f1",
            color: "#fff",
            fontWeight: 900,
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
