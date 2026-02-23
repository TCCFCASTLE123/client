import { useEffect, useState } from "react";
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
          setClients(fresh);
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

  return (
    <Inbox
      clients={clients}
      setClients={setClients}
      statuses={statuses}
    />
  );
}
