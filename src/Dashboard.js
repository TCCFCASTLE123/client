// src/Dashboard.js
import React, { useEffect, useMemo, useState } from "react";

function getToken() {
  return localStorage.getItem("token") || "";
}

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState("all"); // "all" or "mine"

  useEffect(() => {
    async function load() {
      try {
        const [sRes, cRes] = await Promise.all([
          fetch(process.env.REACT_APP_API_URL + "/api/statuses", {
            headers: { Authorization: "Bearer " + getToken() },
          }),
          fetch(process.env.REACT_APP_API_URL + "/api/clients", {
            headers: { Authorization: "Bearer " + getToken() },
          }),
        ]);

        const sJson = await sRes.json();
        const cJson = await cRes.json();

        setStatuses(Array.isArray(sJson) ? sJson : sJson.statuses || []);
        setClients(Array.isArray(cJson) ? cJson : cJson.clients || []);
        setLoading(false);
      } catch
