// Inbox.js
import React, { useEffect, useState, useRef, useMemo } from "react";
import ClientSidebar from "./inbox/ClientSidebar";
import DetailsDrawer from "./inbox/DetailsDrawer";
import ConversationHeader from "./inbox/ConversationHeader";
import ConversationPanel from "./inbox/ConversationPanel";
import { useLocation } from "react-router-dom";
import { api } from "../services/api";
import { formatPhoneUS } from "./utils/phone";
import { statusThemeByName } from "./utils/statusTheme";
import ClientForm from "./inbox/ClientForm";
import ToastBanner from "./components/ToastBanner";
import { getStatusName } from "./utils/status";

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

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileView, setMobileView] = useState("clients");

  const [newMsg, setNewMsg] = useState("");
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [showDetails, setShowDetails] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editClientData, setEditClientData] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [toast, setToast] = useState({ show: false, text: "", clientId: null });
  const [highlightClientId, setHighlightClientId] = useState(null);

  const location = useLocation();

  const clientIdFromUrl = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    const id = qs.get("clientId") || qs.get("clientid");
    return id ? Number(id) : null;
  }, [location.search]);

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
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [newMsg]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedClient) return;

    try {
      if (selectedFile) {
        await api.uploadImage(selectedClient.id, selectedFile);
        setSelectedFile(null);
      }

      if (newMsg.trim()) {
        await api.sendMessage(selectedClient.id, newMsg.trim());
        setNewMsg("");

        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      }
    } catch (err) {
      console.error(err);
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
      setClients((prev) =>
        prev.map((c) => (c.id === savedClient.id ? savedClient : c))
      );
    } else {
      setClients((prev) => [savedClient, ...prev]);
    }

    setSelectedClient(savedClient);
    setShowClientForm(false);
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;

    if (!window.confirm(`Delete "${selectedClient.name}"?`)) return;

    try {
      await api.deleteClient(selectedClient.id);
      setClients((prev) =>
        prev.filter((c) => c.id !== selectedClient.id)
      );
      setSelectedClient(null);
      setMessages([]);
    } catch (err) {
      alert(err.message || "Failed to delete client");
    }
  };

  const inboxClients = useMemo(() => {
    const list = Array.isArray(clients) ? clients : [];
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");

    return list.filter((c) => {
      const statusName = c.status_id
        ? getStatusName(c.status_id, statuses)
        : "";

      if (statusName && HIDE_FROM_INBOX_STATUSES.has(statusName))
        return false;

      if (!q) return true;

      const nameMatch = c.name?.toLowerCase().includes(q);
      const phoneDigits = String(c.phone || "").replace(/\D/g, "");
      const phoneMatch = qDigits ? phoneDigits.includes(qDigits) : false;

      return nameMatch || phoneMatch;
    });
  }, [clients, search, statuses, HIDE_FROM_INBOX_STATUSES]);

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setClients((prev) =>
      prev.map((c) =>
        c.id === client.id ? { ...c, unreadCount: 0 } : c
      )
    );

    if (isMobile) setMobileView("chat");
  };

  useEffect(() => {
    if (!clientIdFromUrl) return;
    const target = clients.find((c) => c.id === clientIdFromUrl);
    if (target) handleSelectClient(target);
  }, [clientIdFromUrl, clients]);

  const jumpToClient = (clientId) => {
    const target = clients.find((c) => c.id === clientId);
    if (target) {
      handleSelectClient(target);
      setToast((t) => ({ ...t, show: false }));
    }
  };

  return (
    <>
      <ToastBanner
        toast={toast}
        onClose={() => setToast((t) => ({ ...t, show: false }))}
        onJump={jumpToClient}
      />

      <div className="inbox-container">

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

        <div
          className="inbox-main"
          style={{
            padding: isMobile ? 16 : 24,
            display: isMobile && mobileView !== "chat" ? "none" : "flex",
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
        </div>

        {showClientForm && (
          <ClientForm
            initialData={editClientData || {}}
            onClose={() => setShowClientForm(false)}
            onSave={handleClientSave}
          />
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
