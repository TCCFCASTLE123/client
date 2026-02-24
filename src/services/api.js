// src/services/api.js

const BASE_URL = process.env.REACT_APP_API_URL;

/* =========================
   Internal helpers
========================= */

function getToken() {
  return localStorage.getItem("token") || "";
}

function authHeaders(isJson = true) {
  const headers = {
    Authorization: "Bearer " + getToken(),
  };

  if (isJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

async function handleResponse(res) {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    return;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }

  return data;
}

/* =========================
   API METHODS
========================= */

export const api = {

  // ---- CLIENTS ----

  async getClients() {
    const res = await fetch(`${BASE_URL}/api/clients`, {
      headers: authHeaders(false),
    });
    return handleResponse(res);
  },

  async createClient(payload) {
    const res = await fetch(`${BASE_URL}/api/clients`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async updateClient(id, payload) {
    const res = await fetch(`${BASE_URL}/api/clients/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async deleteClient(id) {
    const res = await fetch(`${BASE_URL}/api/clients/${id}`, {
      method: "DELETE",
      headers: authHeaders(false),
    });
    return handleResponse(res);
  },

  async updateClientStatus(id, status_id) {
    const res = await fetch(`${BASE_URL}/api/clients/${id}/status`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ status_id }),
    });
    return handleResponse(res);
  },

  // ---- MESSAGES ----

  async sendMessage(client_id, text) {
    const res = await fetch(`${BASE_URL}/api/messages/send`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ client_id, text }),
    });
    return handleResponse(res);
  },

  async uploadImage(client_id, file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("client_id", client_id);

    const res = await fetch(`${BASE_URL}/api/messages/upload-image`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + getToken(),
      },
      body: formData,
    });

    return handleResponse(res);
  },
};
