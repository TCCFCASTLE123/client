import React from "react";

function ClientSidebar({
  inboxClients,
  selectedClient,
  highlightClientId,
  getStatusName,
  statusThemeByName,
  formatPhoneUS,
  handleSelectClient,
  openAddClientForm,
  search,
  setSearch,
}) {
  return (
<aside
  className="inbox-sidebar"
  style={{
    width: 340,
    minWidth: 340,
    maxWidth: 380,
    background: "#ffffff",
    padding: 18,
    height: "100%",
    overflowY: "auto",
    borderRight: "1px solid #e5e7eb",
  }}
>
      <h3 style={{ marginTop: 0 }}>Clients</h3>

      <button
        onClick={openAddClientForm}
        style={{
          width: "100%",
          marginBottom: 12,
          background: "#374151",
          color: "#fff",
          borderRadius: 8,
          border: "none",
          padding: "9px 0",
          fontWeight: "bold",
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        Add Client
      </button>

      <input
        style={{
          width: "100%",
          padding: "8px 10px",
          marginBottom: 14,
          borderRadius: 8,
          border: "1px solid #cbd5e1",
          fontSize: 14,
        }}
        type="text"
        placeholder="Search by name or phone.."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <ul style={{ padding: 0, listStyle: "none", margin: 0 }}>
        {inboxClients.map((client) => {
          const statusName = client.status_id
            ? getStatusName(client.status_id)
            : "";

          const theme = statusThemeByName(statusName);

          const isSelected =
            selectedClient && selectedClient.id === client.id;

          const isFlashing =
            highlightClientId === client.id && !isSelected;

          return (
            <li
              key={client.id}
              onClick={() => handleSelectClient(client)}
              style={{
                background: isSelected ? "#eef2ff" : "#fff",
                borderRadius: 10,
                padding: 14,
                marginBottom: 10,
                cursor: "pointer",
                boxShadow: isSelected
                  ? "0 2px 12px #c7d2fe50"
                  : isFlashing
                  ? "0 0 0 4px rgba(34,197,94,0.22), 0 10px 30px rgba(34,197,94,0.12)"
                  : "0 1px 4px #cbd5e140",
                transform: isFlashing ? "translateY(-1px)" : "none",
                transition:
                  "box-shadow 160ms ease, transform 160ms ease",
                borderLeft: client.status_id
                  ? `6px solid ${theme.border}`
                  : "6px solid transparent",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {client.name || "No Name"}
                </div>

                {!!client.unreadCount && (
                  <span
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      borderRadius: 999,
                      padding: "2px 8px",
                      fontSize: 12,
                      fontWeight: 800,
                      lineHeight: 1.4,
                    }}
                  >
                    {client.unreadCount}
                  </span>
                )}

                {statusName && (
                  <span
                    style={{
                      background: theme.pillBg,
                      color: theme.pillText,
                      borderRadius: 999,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {statusName}
                  </span>
                )}
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: "#475569",
                  marginTop: 4,
                }}
              >
                {formatPhoneUS(client.phone) || "No phone"}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export default ClientSidebar;
