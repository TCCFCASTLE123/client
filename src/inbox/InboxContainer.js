import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import Inbox from "../Inbox";

function getToken() {
  return localStorage.getItem("token") || "";
}

function redirectToLogin() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

export default function InboxContainer() {
  const [clients, setClients] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const socketRef = useRef(null);

  const [selectedClient, setSelectedClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  /* =========================
     FETCH STATUSES + CLIENTS
     ========================= */
  useEffect(() => {
    let cancelled = false;

    async function loadStatuses() {
      try {
        const res = await fetch(
          process.env.REACT_APP_API_URL + "/api/statuses",
          {
            headers: { Authorization: "Bearer " + getToken() },
          }
        );

        if (res.status === 401 || res.status === 403) {
          redirectToLogin();
          return;
        }

        const data = await res.json().catch(() => []);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.statuses)
          ? data.statuses
          : [];

        if (!cancelled) setStatuses(list);
      } catch (err) {
        if (!cancelled) console.error(err);
      }
    }

    async function fetchClientsOnce() {
      try {
        const res = await fetch(
          process.env.REACT_APP_API_URL + "/api/clients",
          {
            headers: { Authorization: "Bearer " + getToken() },
          }
        );

        if (res.status === 401 || res.status === 403) {
          redirectToLogin();
          return;
        }

        const data = await res.json().catch(() => []);
        const fresh = Array.isArray(data)
          ? data
          : Array.isArray(data?.clients)
          ? data.clients
          : [];

        if (!cancelled) {
          setClients((prev) => {
            const prevById = new Map(
              (Array.isArray(prev) ? prev : []).map((c) => [c.id, c])
            );

            const merged = fresh.map((c) => {
              const old = prevById.get(c.id);
              return {
                ...c,
                unreadCount: old?.unreadCount || 0,
                lastMessageAt: old?.lastMessageAt || null,
                lastMessageText: old?.lastMessageText || "",
              };
            });

            merged.sort((a, b) => {
              const ta = a.lastMessageAt
                ? new Date(a.lastMessageAt).getTime()
                : 0;
              const tb = b.lastMessageAt
                ? new Date(b.lastMessageAt).getTime()
                : 0;
              return tb - ta;
            });

            return merged;
          });
        }
      } catch (err) {
        if (!cancelled) console.error(err);
      }
    }

    loadStatuses();
    fetchClientsOnce();

    const intervalId = setInterval(fetchClientsOnce, 10000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  /* =========================
     SOCKET CONNECTION
     ========================= */
  useEffect(() => {
    if (socketRef.current) return;

    const socket = io(process.env.REACT_APP_API_URL, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      auth: { token: getToken() },
    });

    socketRef.current = socket;

    const handleMessage = (msg) => {
      if (!msg || !msg.client_id) return;

      // ✅ update open conversation (no duplicates)
      setMessages((prev) => {
        if (!selectedClient || msg.client_id !== selectedClient.id) return prev;

        const exists = prev.some(
          (m) =>
            (m.external_id && m.external_id === msg.external_id) ||
            (m.created_at === msg.created_at && m.body === msg.body)
        );

        if (exists) return prev;

        return [...prev, msg];
      });

      // ✅ update sidebar
      setClients((prev) => {
        const next = [...prev];
        const idx = next.findIndex((c) => c.id === msg.client_id);
        if (idx === -1) return prev;

        const old = next[idx];

        const updated = {
          ...old,
          lastMessageAt: msg.created_at || new Date().toISOString(),
          lastMessageText: msg.body || msg.text || "",
          unreadCount:
            msg.direction === "inbound"
              ? (old.unreadCount || 0) + 1
              : old.unreadCount || 0,
        };

        next.splice(idx, 1);
        next.unshift(updated);
        return next;
      });
    };

    socket.on("newMessage", handleMessage);
    socket.on("message", handleMessage);
    socket.on("message:new", handleMessage);

    return () => {
      socket.off("newMessage", handleMessage);
      socket.off("message", handleMessage);
      socket.off("message:new", handleMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedClient]);

  /* =========================
     LOAD CONVERSATION
     ========================= */
  useEffect(() => {
    let cancelled = false;

    async function loadConversation() {
      if (!selectedClient) {
        setMessages([]);
        return;
      }

      setLoadingMessages(true);

      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/messages/conversation/${selectedClient.id}`,
          {
            headers: { Authorization: "Bearer " + getToken() },
          }
        );

        const data = await res.json().catch(() => null);
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.messages)
          ? data.messages
          : [];

        if (!cancelled) {
          setMessages(list);
          setLoadingMessages(false);
        }
      } catch (err) {
        if (!cancelled) {
          setMessages([]);
          setLoadingMessages(false);
        }
      }
    }

    loadConversation();
    return () => {
      cancelled = true;
    };
  }, [selectedClient]);

  /* =========================
     SEND MESSAGE (INSTANT UI)
     ========================= */
const handleSend = async (text) => {
  if (!text.trim() || !selectedClient) return;

  const tempMessage = {
    body: text,
    user: "Cass",
    created_at: new Date().toISOString(),
    direction: "outbound",
    client_id: selectedClient.id,
  };

  // ✅ instant UI
setMessages((prev) => {
  const updated = [...prev, tempMessage];
  return updated;
}); 
  // 🔥 force React to re-render immediately
setTimeout(() => {
  setMessages((prev) => [...prev]);
}, 0);

  try {
    await fetch(process.env.REACT_APP_API_URL + "/api/internal/send-sms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.REACT_APP_INTERNAL_KEY,
      },
      body: JSON.stringify({
        phone: selectedClient.phone,
        text,
        sender: tempMessage.user,
      }),
    });
  } catch (err) {
    console.error(err);
  }
};

  /* =========================
     RENDER
     ========================= */
  return (
    <Inbox
      clients={clients}
      setClients={setClients}
      statuses={statuses}
      selectedClient={selectedClient}
      setSelectedClient={setSelectedClient}
      messages={messages}
      setMessages={setMessages}
      loadingMessages={loadingMessages}
      handleSend={handleSend}
    />
  );
}
