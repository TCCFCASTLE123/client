// Inbox.js
import React, { useEffect, useState, useRef, useMemo } from "react";
import { format } from "date-fns";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";

/* =========================
   Helpers
   ========================= */

function canonicalPhone(input) {
  if (!input) return "";
  const digits = String(input).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  if (digits.length === 10) return digits;
  return digits;
}

function formatPhoneUS(input) {
  const d = String(input || "").replace(/\D/g, "");
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  if (ten.length !== 10) return input || "";
  return `${ten.slice(0, 3)}-${ten.slice(3, 6)}-${ten.slice(6)}`;
}

function getToken() {
  return localStorage.getItem("token") || "";
}

function redirectToLogin() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

function safeDate(ts) {
  const d = ts ? new Date(ts) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

function playBeep() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.04;
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close();
    }, 120);
  } catch {}
}

/* =========================
   Inbox Component
   ========================= */

function Inbox() {
  const [clients, setClients] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);

  /* =========================
     URL deep-link handling
     ========================= */
  const location = useLocation();
  const clientIdFromUrl = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    const id = qs.get("clientId") || qs.get("clientid");
    return id ? Number(id) : null;
  }, [location.search]);

  /* =========================
     SOCKET.IO — CREATE ONCE
     ========================= */
  const socketRef = useRef(null);

  useEffect(() => {
    if (socketRef.current) return;

    const socket = io(process.env.REACT_APP_API_URL, {
      transports: ["websocket"],
      auth: { token: getToken() },
    });

    socketRef.current = socket;

    const onMessage = (msg) => {
      if (!msg || !msg.client_id) return;

      const isInbound = msg.direction === "inbound" || msg.sender === "client";
      const isViewing = selectedClient?.id === msg.client_id;

      if (isViewing) {
        setMessages((prev) => [...prev, msg]);
      }

      setClients((prev) => {
        const next = [...prev];
        const idx = next.findIndex((c) => c.id === msg.client_id);
        if (idx === -1) return prev;

        const old = next[idx];
        next.splice(idx, 1);
        next.unshift({
          ...old,
          lastMessageAt: msg.timestamp || new Date().toISOString(),
          lastMessageText: msg.text || "",
          unreadCount: isInbound && !isViewing ? (old.unreadCount || 0) + 1 : old.unreadCount || 0,
        });
        return next;
      });

      if (isInbound && !isViewing) {
        playBeep();
      }
    };

    socket.on("newMessage", onMessage);
    socket.on("message", onMessage);
    socket.on("message:new", onMessage);

    socket.on("connect_error", (err) => {
      console.warn("Socket error:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedClient]);

  /* =========================
     Load clients + statuses
     ========================= */
  useEffect(() => {
    async function load() {
      const [cRes, sRes] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_URL}/api/clients`, {
          headers: { Authorization: "Bearer " + getToken() },
        }),
        fetch(`${process.env.REACT_APP_API_URL}/api/statuses`, {
          headers: { Authorization: "Bearer " + getToken() },
        }),
      ]);

      if ([401, 403].includes(cRes.status)) return redirectToLogin();

      const clientsData = await cRes.json();
      const statusesData = await sRes.json();

      setClients(Array.isArray(clientsData) ? clientsData : clientsData.clients || []);
      setStatuses(Array.isArray(statusesData) ? statusesData : statusesData.statuses || []);
    }

    load();
  }, []);

  /* =========================
     Deep-link selection
     ========================= */
  useEffect(() => {
    if (!clientIdFromUrl || !clients.length) return;
    if (selectedClient?.id === clientIdFromUrl) return;

    const target = clients.find((c) => c.id === clientIdFromUrl);
    if (target) {
      setSelectedClient(target);
      setClients((prev) =>
        prev.map((c) => (c.id === target.id ? { ...c, unreadCount: 0 } : c))
      );
    }
  }, [clientIdFromUrl, clients, selectedClient]);

  /* =========================
     Load conversation
     ========================= */
  useEffect(() => {
    async function loadConversation() {
      if (!selectedClient) {
        setMessages([]);
        return;
      }

      setLoadingMessages(true);

      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/messages/conversation/${selectedClient.id}`,
        { headers: { Authorization: "Bearer " + getToken() } }
      );

      if ([401, 403].includes(res.status)) return redirectToLogin();

      const data = await res.json();
      setMessages(Array.isArray(data) ? data : data.messages || []);
      setLoadingMessages(false);
    }

    loadConversation();
  }, [selectedClient]);

  /* =========================
     Auto-scroll
     ========================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* =========================
     Send message
     ========================= */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !selectedClient) return;

    await fetch(`${process.env.REACT_APP_API_URL}/api/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + getToken(),
      },
      body: JSON.stringify({
        to: selectedClient.phone,
        text: newMsg,
        client_id: selectedClient.id,
      }),
    });

    setNewMsg("");
  };

  /* =========================
     Render
     ========================= */
  return (
    <div className="inbox-container">
      <aside className="inbox-sidebar">
        {clients.map((c) => (
          <div
            key={c.id}
            onClick={() => {
              setSelectedClient(c);
              setClients((prev) =>
                prev.map((x) => (x.id === c.id ? { ...x, unreadCount: 0 } : x))
              );
            }}
          >
            <b>{c.name}</b>
            {!!c.unreadCount && <span>{c.unreadCount}</span>}
            <div>{formatPhoneUS(c.phone)}</div>
          </div>
        ))}
      </aside>

      <main className="inbox-main">
        {!selectedClient && <div>Select a client</div>}

        {selectedClient && (
          <>
            <h2>{selectedClient.name}</h2>

            <div className="messages">
              {loadingMessages && <div>Loading…</div>}
              {messages.map((m, i) => (
                <div key={i}>
                  <div>{m.text}</div>
                  <small>{format(safeDate(m.timestamp), "h:mm a")}</small>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend}>
              <input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                placeholder="Type message…"
              />
              <button type="submit">Send</button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

export default Inbox;
