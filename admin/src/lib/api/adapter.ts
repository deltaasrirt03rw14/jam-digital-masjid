export interface MosqueConfig {
  id: string;
  name: string;
  address: string;
  timezone: string;
  latitude: number;
  longitude: number;
}

export interface Device {
  id: string;
  device_identifier: string;
  name: string;
  status: "ACTIVE" | "DISABLED" | "REVOKED";
  last_heartbeat_at: string | null;
  mosque_id: string;
}

export interface ContentItem {
  id: string;
  title: string;
  type: string;
  is_active: boolean;
  priority: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function getAuthHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function handleResponse(res: any) {
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('mosqueId');
      window.location.href = '/login';
    }
  }
  return res;
}

export const ApiAdapter = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    handleResponse(res);
    if (!res.ok) throw new Error("Login failed");
    return res.json(); // { access_token, mosqueId }
  },

  getMosqueConfig: async (mosqueId: string): Promise<MosqueConfig> => {
    const res = await fetch(`${API_BASE_URL}/mosques/${mosqueId}`, {
      headers: getAuthHeaders(),
    });
    handleResponse(res);
    if (!res.ok) throw new Error("Failed to fetch mosque config");
    return res.json();
  },
  
  updateMosqueConfig: async (mosqueId: string, data: Partial<MosqueConfig>): Promise<MosqueConfig> => {
    const res = await fetch(`${API_BASE_URL}/mosques/${mosqueId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    handleResponse(res);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update mosque config");
    }
    return res.json();
  },

  getDevices: async (): Promise<Device[]> => {
    const res = await fetch(`${API_BASE_URL}/admin/devices`, {
      headers: getAuthHeaders(),
    });
    handleResponse(res);
    if (!res.ok) throw new Error("Failed to fetch devices");
    return res.json();
  },

  getContent: async (): Promise<ContentItem[]> => {
    const res = await fetch(`${API_BASE_URL}/contents`, {
      headers: getAuthHeaders(),
    });
    handleResponse(res);
    if (!res.ok) throw new Error("Failed to fetch contents");
    return res.json();
  },

  generatePairingToken: async (): Promise<{ token: string; expiresAt: string }> => {
    const res = await fetch(`${API_BASE_URL}/admin/devices/token`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    handleResponse(res);
    if (!res.ok) throw new Error("Failed to generate pairing token");
    return res.json();
  },

  revokeDevice: async (deviceId: string): Promise<Device> => {
    const res = await fetch(`${API_BASE_URL}/admin/devices/${deviceId}/revoke`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    handleResponse(res);
    if (!res.ok) throw new Error("Failed to revoke device");
    return res.json();
  },

  getMedia: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE_URL}/media`, {
      headers: getAuthHeaders(),
    });
    handleResponse(res);
    if (!res.ok) throw new Error("Failed to fetch media");
    return res.json();
  },

  uploadMedia: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${API_BASE_URL}/media/upload`, {
      method: "POST",
      headers, // No Content-Type, browser will set multipart/form-data with boundary
      body: formData,
    });
    handleResponse(res);
    if (!res.ok) throw new Error("Failed to upload media");
    return res.json();
  },

  deleteMedia: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/media/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    handleResponse(res);
    if (!res.ok) throw new Error("Failed to delete media");
  },

  createContent: async (data: Partial<ContentItem>): Promise<ContentItem> => {
    const res = await fetch(`${API_BASE_URL}/contents`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    handleResponse(res);
    if (!res.ok) throw new Error("Failed to create content");
    return res.json();
  },

  getContents: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE_URL}/contents`, {
      headers: getAuthHeaders(),
    });
    handleResponse(res);
    if (!res.ok) throw new Error("Failed to fetch contents");
    return res.json();
  },

  updateContent: async (id: string, data: Partial<ContentItem>): Promise<ContentItem> => {
    const res = await fetch(`${API_BASE_URL}/contents/${id}`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    handleResponse(res);
    if (!res.ok) throw new Error("Failed to update content");
    return res.json();
  },

  deleteContent: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/contents/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    handleResponse(res);
    if (!res.ok) throw new Error("Failed to delete content");
  }
};
