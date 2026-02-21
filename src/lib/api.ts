// API client utilities for making authenticated requests

// Get the base path dynamically
function getBasePath(): string {
  // In browser, check if we're running under a subdirectory
  if (typeof window !== "undefined") {
    const pathname = window.location.pathname;
    // Check if pathname starts with /audit-monitoring
    if (pathname.startsWith("/audit-monitoring")) {
      return "/audit-monitoring";
    }
  }

  // Try from Next.js config (available at build time)
  if (process.env.NEXT_PUBLIC_BASE_PATH) {
    return process.env.NEXT_PUBLIC_BASE_PATH;
  }

  // Finally, try from Next.js internals
  if (typeof window !== "undefined" && (window as any).__NEXT_DATA__?.buildId) {
    const basePath = (window as any).__NEXT_DATA__?.page;
    if (basePath && basePath.startsWith("/audit-monitoring")) {
      return "/audit-monitoring";
    }
  }

  return "";
}

// Helper function to construct full API URL with base path
export function getApiUrl(path: string): string {
  // Ensure the path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const basePath = getBasePath();
  return `${basePath}${normalizedPath}`;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new ApiError(response.status, errorData.error || "Request failed");
  }
  const result = await response.json();
  // If response has success and data structure
  if (result.success && result.data !== undefined) {
    // If there are other properties like pagination, return them along with data
    const { success, data, ...rest } = result;
    if (Object.keys(rest).length > 0) {
      return { data, ...rest } as T;
    }
    // Otherwise just return the data directly
    return data as T;
  }
  return result;
}

export const api = {
  // Generic GET request
  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    const queryString = params
      ? "?" + new URLSearchParams(params).toString()
      : "";
    const response = await fetch(`${getApiUrl(url)}${queryString}`, {
      method: "GET",
      headers: await getAuthHeaders(),
    });
    return handleResponse<T>(response);
  },

  // Generic POST request
  async post<T>(url: string, data?: any): Promise<T> {
    const response = await fetch(getApiUrl(url), {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },

  // Generic PUT request
  async put<T>(url: string, data?: any): Promise<T> {
    const response = await fetch(getApiUrl(url), {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<T>(response);
  },

  // Generic DELETE request
  async delete<T>(url: string): Promise<T> {
    const response = await fetch(getApiUrl(url), {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    return handleResponse<T>(response);
  },

  // File upload (multipart/form-data)
  async uploadFile<T>(url: string, formData: FormData): Promise<T> {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const response = await fetch(getApiUrl(url), {
      method: "POST",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    return handleResponse<T>(response);
  },
};

// Specific API endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),

  getCurrentUser: () => api.get("/api/auth/me"),
};

export const vesselsApi = {
  getAll: (includeDeleted?: boolean) =>
    api.get(
      "/api/vessels",
      includeDeleted ? { includeDeleted: "true" } : undefined,
    ),
  getById: (id: number) => api.get(`/api/vessels/${id}`),
  create: (data: any) => api.post("/api/vessels", data),
  update: (id: number, data: any) => api.put(`/api/vessels/${id}`, data),
  delete: (id: number) => api.delete(`/api/vessels/${id}`),
  restore: (id: number) => api.post(`/api/vessels/${id}/restore`, {}),
};

export const auditTypesApi = {
  getAll: (includeDeleted?: boolean) =>
    api.get(
      "/api/audit-types",
      includeDeleted ? { includeDeleted: "true" } : undefined,
    ),
  getById: (id: number) => api.get(`/api/audit-types/${id}`),
  create: (data: any) => api.post("/api/audit-types", data),
  update: (id: number, data: any) => api.put(`/api/audit-types/${id}`, data),
  delete: (id: number) => api.delete(`/api/audit-types/${id}`),
  restore: (id: number) => api.post(`/api/audit-types/${id}/restore`, {}),
};

export const auditPartiesApi = {
  getAll: (includeDeleted?: boolean) =>
    api.get(
      `/api/audit-parties${includeDeleted ? "?includeDeleted=true" : ""}`,
    ),
  getById: (id: number) => api.get(`/api/audit-parties/${id}`),
  create: (data: any) => api.post("/api/audit-parties", data),
  update: (id: number, data: any) => api.put(`/api/audit-parties/${id}`, data),
  delete: (id: number) => api.delete(`/api/audit-parties/${id}`),
  restore: (id: number) => api.post(`/api/audit-parties/${id}/restore`, {}),
};

export const auditResultsApi = {
  getAll: (params?: any) => api.get("/api/audit-results", params),
  getById: (id: number) => api.get(`/api/audit-results/${id}`),
  create: (data: any) => api.post("/api/audit-results", data),
  update: (id: number, data: any) => api.put(`/api/audit-results/${id}`, data),
  delete: (id: number) => api.delete(`/api/audit-results/${id}`),
  restore: (id: number) => api.post(`/api/audit-results/${id}/restore`, {}),
};

export const auditCompaniesApi = {
  getAll: (params?: any) => api.get("/api/audit-companies", params),
  getById: (id: number) => api.get(`/api/audit-companies/${id}`),
  create: (data: any) => api.post("/api/audit-companies", data),
  update: (id: number, data: any) =>
    api.put(`/api/audit-companies/${id}`, data),
  delete: (id: number) => api.delete(`/api/audit-companies/${id}`),
  restore: (id: number) => api.post(`/api/audit-companies/${id}/restore`, {}),
};

export const auditorsApi = {
  getAll: (params?: any) => api.get("/api/auditors", params),
  getById: (id: number) => api.get(`/api/auditors/${id}`),
  create: (data: any) => api.post("/api/auditors", data),
  update: (id: number, data: any) => api.put(`/api/auditors/${id}`, data),
  delete: (id: number) => api.delete(`/api/auditors/${id}`),
  restore: (id: number) => api.post(`/api/auditors/${id}/restore`, {}),
  // Audit-specific auditor methods
  getAuditAuditors: (auditId: number) =>
    api.get(`/api/audits/${auditId}/auditors`),
  assignToAudit: (auditId: number, data: any) =>
    api.post(`/api/audits/${auditId}/auditors`, data),
  updateAssignment: (auditId: number, assignmentId: number, data: any) =>
    api.put(`/api/audits/${auditId}/auditors/${assignmentId}`, data),
  removeFromAudit: (auditId: number, assignmentId: number) =>
    api.delete(`/api/audits/${auditId}/auditors/${assignmentId}`),
};

export const auditsApi = {
  getAll: (params?: any) => api.get("/api/audits", params),
  getById: (id: number) => api.get(`/api/audits/${id}`),
  create: (data: any) => api.post("/api/audits", data),
  update: (id: number, data: any) => api.put(`/api/audits/${id}`, data),
  delete: (id: number) => api.delete(`/api/audits/${id}`),
  restore: (id: number) => api.post(`/api/audits/${id}/restore`, {}),
};

export const findingsApi = {
  getAll: (params?: any) => api.get("/api/findings", params),
  getById: (id: number) => api.get(`/api/findings/${id}`),
  create: (data: any) => api.post("/api/findings", data),
  update: (id: number, data: any) => api.put(`/api/findings/${id}`, data),
  delete: (id: number) => api.delete(`/api/findings/${id}`),
  restore: (id: number) => api.post(`/api/findings/${id}/restore`, {}),
  close: (id: number, data: any) => api.post(`/api/findings/${id}/close`, data),
  reopen: (id: number, reason: string) =>
    api.post(`/api/findings/${id}/reopen`, { reason }),
  // Evidence methods
  getEvidence: (id: number) => api.get(`/api/findings/${id}/evidence`),
  uploadEvidence: (id: number, formData: FormData) =>
    api.uploadFile(`/api/findings/${id}/evidence`, formData),
  deleteEvidence: (findingId: number, evidenceId: number) =>
    api.delete(`/api/findings/${findingId}/evidence/${evidenceId}`),
};

export const usersApi = {
  getAll: (includeDeleted?: boolean) =>
    api.get(
      "/api/users",
      includeDeleted ? { includeDeleted: "true" } : undefined,
    ),
  getById: (id: number) => api.get(`/api/users/${id}`),
  create: (data: any) => api.post("/api/users", data),
  update: (id: number, data: any) => api.put(`/api/users/${id}`, data),
  delete: (id: number) => api.delete(`/api/users/${id}`),
  restore: (id: number) => api.post(`/api/users/${id}/restore`, {}),
  getRoles: () => api.get("/api/users/roles"),
};

export const dashboardApi = {
  getStats: () => api.get("/api/dashboard/stats"),
  getCharts: () => api.get("/api/dashboard/charts"),
  getFindingsTrend: (params?: { vessel_id?: number; audit_type_id?: number }) =>
    api.get("/api/dashboard/findings-trend", params),
};

export const settingsApi = {
  get: () => api.get("/api/settings"),
  update: (data: any) => api.put("/api/settings", data),
};

export const permissionsApi = {
  getAll: () => api.get("/api/permissions"),
  getById: (id: number) => api.get(`/api/permissions/${id}`),
  create: (data: any) => api.post("/api/permissions", data),
  update: (id: number, data: any) => api.put(`/api/permissions/${id}`, data),
  delete: (id: number) => api.delete(`/api/permissions/${id}`),
};

export const pagesApi = {
  getAll: (params?: any) => api.get("/api/pages", params),
  getById: (id: number) => api.get(`/api/pages/${id}`),
  create: (data: any) => api.post("/api/pages", data),
  update: (id: number, data: any) => api.put(`/api/pages/${id}`, data),
  delete: (id: number) => api.delete(`/api/pages/${id}`),
};

export const rolesApi = {
  getAll: (params?: any) => api.get("/api/roles", params),
  getById: (id: number) => api.get(`/api/roles/${id}`),
  create: (data: any) => api.post("/api/roles", data),
  update: (id: number, data: any) => api.put(`/api/roles/${id}`, data),
  delete: (id: number) => api.delete(`/api/roles/${id}`),
  assignPermissions: (roleId: number, permissions: any[]) =>
    api.post(`/api/roles/${roleId}/permissions`, { permissions }),
};
