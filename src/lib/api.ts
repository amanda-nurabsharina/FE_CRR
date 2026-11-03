const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
}

export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function setStoredUser(user: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `HTTP ${response.status}: Request failed`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (body: any) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: any) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  getMe: () => request("/auth/me"),
  updateProfile: (body: any) => request("/auth/profile", { method: "PUT", body: JSON.stringify(body) }),

  // Super Admin
  getAdminMetrics: () => request("/admin/metrics"),
  listTenants: (status = "", page = 1) => request(`/admin/tenants?status=${status}&page=${page}`),
  updateTenantStatus: (id: string, status: string) =>
    request(`/admin/tenants/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  adjustQuota: (id: string, addMinutes: number, addStorageGB: number) =>
    request(`/admin/tenants/${id}/quota`, {
      method: "POST",
      body: JSON.stringify({ add_minutes: addMinutes, add_storage_gb: addStorageGB }),
    }),
  listPendingPayments: (page = 1) => request(`/admin/payments/pending?page=${page}`),
  approvePayment: (id: string) => request(`/admin/payments/${id}/approve`, { method: "POST" }),
  rejectPayment: (id: string, reason: string) =>
    request(`/admin/payments/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }),

  // Subscriptions (Tenant)
  getCurrentSubscription: () => request("/subscriptions/current"),
  submitManualPayment: (formData: FormData) =>
    request("/subscriptions/manual-payment", { method: "POST", body: formData }),
  getPaymentHistory: () => request("/subscriptions/history"),

  // Court Cases
  listCases: (search = "", page = 1) => request(`/cases?search=${encodeURIComponent(search)}&page=${page}`),
  createCase: (body: any) => request("/cases", { method: "POST", body: JSON.stringify(body) }),
  getCase: (id: string) => request(`/cases/${id}`),
  manualPurgeCase: (id: string) => request(`/cases/${id}/purge`, { method: "DELETE" }),
  createSession: (caseId: string, body: any) =>
    request(`/cases/${caseId}/sessions`, { method: "POST", body: JSON.stringify(body) }),
  getSession: (caseId: string, sessionId: string) => request(`/cases/${caseId}/sessions/${sessionId}`),

  // Recording & Media Ingest
  initRecording: (body: any) => request("/recording/sessions", { method: "POST", body: JSON.stringify(body) }),
  uploadChunk: (body: any) => request("/recording/chunk", { method: "POST", body: JSON.stringify(body) }),
  finalizeRecording: (id: string, body: any) =>
    request(`/recording/sessions/${id}/finalize`, { method: "POST", body: JSON.stringify(body) }),
  uploadMediaFile: (formData: FormData) => request("/ingest/upload", { method: "POST", body: formData }),
  getStreamUrl: (audioId: string) => {
    const token = getAuthToken();
    return `${API_BASE}/evidence/${audioId}/stream${token ? `?token=${token}` : ""}`;
  },

  // Transcripts
  triggerASR: (audioId: string, durationSec?: number) =>
    request(`/evidence/${audioId}/transcribe`, {
      method: "POST",
      body: JSON.stringify({ duration_seconds: durationSec }),
    }),
  getTranscript: (audioId: string) => request(`/evidence/${audioId}/transcripts`),
  saveTranscriptSegments: (transcriptId: string, segments: any[]) =>
    request("/transcripts/segments", {
      method: "PUT",
      body: JSON.stringify({ transcript_id: transcriptId, segments }),
    }),

  // Berita Acara Sidang & E-Signature
  createReport: (courtSessionId: string, title: string) =>
    request("/reports", {
      method: "POST",
      body: JSON.stringify({ court_session_id: courtSessionId, title }),
    }),
  getReport: (id: string) => request(`/reports/${id}`),
  updateReport: (id: string, body: any) => request(`/reports/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  signReport: (id: string, body: any) => request(`/reports/${id}/sign`, { method: "POST", body: JSON.stringify(body) }),

  // Public Verify
  publicVerify: (token: string) => request(`/public/verify/${token}`),
};

