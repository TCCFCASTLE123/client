// Inbox.js
import React, { useEffect, useState, useRef, useMemo } from "react";
import ClientSidebar from "./inbox/ClientSidebar";
import DetailsDrawer from "./inbox/DetailsDrawer";
import ConversationHeader from "./inbox/ConversationHeader";
import ConversationPanel from "./inbox/ConversationPanel";
import { useLocation } from "react-router-dom";
import api from "./services/api";
import { canonicalPhone, formatPhoneUS } from "./utils/phone";
import { statusThemeByName } from "./utils/statusTheme";
import ClientForm from "./inbox/ClientForm";
import ToastBanner from "./components/ToastBanner";

/** =========================
 * Inbox Component
 * ========================= */
function Inbox({
  clients,
  setClients,
  statuses,
  selectedClient,
  setSelectedClient,
  messages,
  setMessages,
  loadingMessages,
}) {
const selectedClientIdRef = useRef(null);
// MOBILE SUPPORT
const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
const [mobileView, setMobileView] = useState("clients"); 
// clients | chat
  const [newMsg, setNewMsg] = useState("");
  const textareaRef = useRef(null);
const [showDetails, setShowDetails] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editClientData, setEditClientData] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);

  const [toast, setToast] = useState({ show: false, text: "", clientId: null });
  const toastTimerRef = useRef(null);
  const [highlightClientId, setHighlightClientId] = useState(null);
  const highlightTimerRef = useRef(null);

  const location = useLocation();
  const clientIdFromUrl = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    const id = qs.get("clientId") || qs.get("clientid");
    return id ? Number(id) : null;
  }, [location.search]);

  // Statuses that should NOT appear in Inbox list
  const HIDE_FROM_INBOX_STATUSES = useMemo(
    () =>
      new Set([
        "Referred Out",
        "Can't Help",
        "No Longer Needs Assistance",
        "Seen Can't Help",
      ]),
    []
  );

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

useEffect(() => {
  selectedClientIdRef.current = selectedClient?.id || null;
}, [selectedClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);


  useEffect(() => {
  const el = textareaRef.current;
  if (!el) return;

  el.style.height = "auto";

  const newHeight = Math.min(el.scrollHeight, 180); // max height cap
  el.style.height = newHeight + "px";
}, [newMsg]);

  useEffect(() => {
  if (selectedClient && textareaRef.current) {
    textareaRef.current.focus();
  }
}, [selectedClient]);
  
  useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
  
const handleSend = async (e) => {
  e.preventDefault();

  if (!selectedClient) return alert("No client selected.");

  try {
    // Upload image first
    if (selectedFile) {
      await api.uploadImage(selectedClient.id, selectedFile);
      setSelectedFile(null);
    }

    // Send text message
    if (newMsg.trim()) {
      await api.sendMessage(selectedClient.id, newMsg.trim());
      setNewMsg("");
    }

  } catch (err) {
    console.error("Send failed:", err);
    alert(err.message || "Failed to send message.");
  }
};

  const openAddClientForm = () => {
    setEditClientData(null);
    setShowClientForm(true);
  };

  const openEditClientForm = () => {
    setEditClientData(selectedClient);
    setShowClientForm(true);
  };

  const handleClientSave = (savedClient) => {
    if (editClientData) {
      setClients((prev) => (Array.isArray(prev) ? prev : []).map((c) => (c.id === savedClient.id ? savedClient : c)));
      setSelectedClient(savedClient);
    } else {
      setClients((prev) => [savedClient, ...(Array.isArray(prev) ? prev : [])]);
      setSelectedClient(savedClient);
    }
    setShowClientForm(false);
  };

const handleDeleteClient = async () => {
  if (!selectedClient) return;

  if (!window.confirm(`Delete client "${selectedClient.name}" and all messages?`)) {
    return;
  }

  try {
    await api.deleteClient(selectedClient.id);

    setClients((prev) =>
      (Array.isArray(prev) ? prev : []).filter(
        (c) => c.id !== selectedClient.id
      )
    );

    setSelectedClient(null);
    setMessages([]);
  } catch (err) {
    alert(err.message || "Failed to delete client");
  }
};


  const getStatusName = (statusId) => {
    const list = Array.isArray(statuses) ? statuses : [];
    const found = list.find((s) => String(s.id) === String(statusId));
    return found ? found.name : "";
  };

  // This is the actual list used for the LEFT sidebar
  // - hides those statuses
  // - applies search
  const inboxClients = useMemo(() => {
    const list = Array.isArray(clients) ? clients : [];
    const q = (search || "").trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");

    return list.filter((c) => {
      const statusName = c.status_id ? getStatusName(c.status_id) : "";
      if (statusName && HIDE_FROM_INBOX_STATUSES.has(statusName)) return false;

      if (!q) return true;

      const nameMatch = (c.name || "").toLowerCase().includes(q);
      const phoneDigits = String(c.phone || "").replace(/\D/g, "");
      const phoneMatch = qDigits ? phoneDigits.includes(qDigits) : false;

      return nameMatch || phoneMatch;
    });
  }, [clients, search, statuses, HIDE_FROM_INBOX_STATUSES]);

const handleSelectClient = (client) => {
  setSelectedClient(client);

  setClients((prev) =>
    (Array.isArray(prev) ? prev : []).map((c) =>
      c.id === client.id ? { ...c, unreadCount: 0 } : c
    )
  );

  if (isMobile) {
    setMobileView("chat");
  }
};

  // Deep link selection
  useEffect(() => {
    if (!clientIdFromUrl) return;
    if (!Array.isArray(clients) || clients.length === 0) return;
    if (Number(selectedClient?.id) === Number(clientIdFromUrl)) return;

    const target = clients.find((c) => Number(c.id) === Number(clientIdFromUrl));
    if (target) handleSelectClient(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientIdFromUrl, clients]);

  const jumpToClient = (clientId) => {
    const target = (Array.isArray(clients) ? clients : []).find((c) => c.id === clientId);
    if (target) {
      handleSelectClient(target);
      setToast((t) => ({ ...t, show: false }));
    }
  };

  return (
    <>
      <ToastBanner toast={toast} onClose={() => setToast((t) => ({ ...t, show: false }))} onJump={jumpToClient} />

<div
  className="inbox-container"
  style={{
    display: "flex",
    height: "calc(100vh - 140px)",
    width: "100%",
    overflow: "hidden",
  }}
>
   <ClientSidebar
  inboxClients={inboxClients}
  selectedClient={selectedClient}
  highlightClientId={highlightClientId}
  getStatusName={getStatusName}
  statusThemeByName={statusThemeByName}
  formatPhoneUS={formatPhoneUS}
  handleSelectClient={handleSelectClient}
  openAddClientForm={openAddClientForm}
  search={search}
  setSearch={setSearch}
/>

        {/* RIGHT: Conversation + Details */}
<main
  className="inbox-main"
  style={{
    flex: 1,
    minWidth: 0,
    padding: isMobile ? 16 : 32,
    minHeight: 600,
    height: "100%",
    overflow: "hidden",
    display: isMobile && mobileView !== "chat" ? "none" : "block",
  }}
>
<ConversationHeader
  selectedClient={selectedClient}
  isMobile={isMobile}
  onBack={() => setMobileView("clients")}
  onEdit={openEditClientForm}
  onDelete={handleDeleteClient}
  onShowDetails={() => setShowDetails(true)}
/>
     <ConversationPanel
  selectedClient={selectedClient}
  messages={messages}
  loadingMessages={loadingMessages}
  handleSend={handleSend}
  newMsg={newMsg}
  setNewMsg={setNewMsg}
  textareaRef={textareaRef}
  messagesEndRef={messagesEndRef}
/>
                  
        </main>

        {showClientForm && (
          <ClientForm initialData={editClientData || {}} onClose={() => setShowClientForm(false)} onSave={handleClientSave} />
        )}
          <DetailsDrawer
  selectedClient={selectedClient}
  isMobile={isMobile}
  showDetails={showDetails}
  onClose={() => setShowDetails(false)}
/>
      </div>
    </>
  );
}

export default Inbox;
