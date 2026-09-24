import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getImageUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanPath}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface PhotoResponse {
  id: number;
  report_id: number;
  image_url: string;
  file_size?: number;
  display_order?: number;
  uploaded_at: string;
}

export interface UpdateResponse {
  id: number;
  report_id: number;
  update_text: string;
  created_at: string;
}

export interface CommentResponse {
  id: number;
  report_id: number;
  user_id: number;
  text: string;
  created_at: string;
  user?: { id: number; email: string; role: string; is_flagged: boolean };
}

export interface Report {
  id: number;
  report_code: string;
  issue_type: 'Leak' | 'Overflow' | 'Damaged Tap' | 'Broken Valve' | 'Water Supply Issue' | 'Other';
  description: string;
  district?: string;
  latitude: number;
  longitude: number;
  status: 'Active' | 'Resolved';
  ai_urgency?: string;
  priority_score: number;
  created_at: string;
  photos: PhotoResponse[];
  updates: UpdateResponse[];
  comments: CommentResponse[];
  user?: { id: number; email: string; role: string; is_flagged: boolean };
  verification_counts?: {
    confirmed: number;
    duplicate: number;
    resolved: number;
  };
}

export interface UserRecord {
  id: number;
  email: string;
  role: string;
  is_flagged: boolean;
  created_at: string;
}

export interface ReportCreateParams {
  issue_type: string;
  description?: string;
  district?: string;
  latitude: number;
  longitude: number;
  photo_url?: string;
  photos?: {
    image_url: string;
    file_size?: number;
    display_order?: number;
  }[];
}

export interface CommentParams {
  text: string;
}

export interface UpdateParams {
  update_text: string;
}

export interface Statistics {
  total: number;
  active: number;
  confirmed: number;
  resolved: number;
}

export interface BulkUserEntry {
  email: string;
  password: string;
}

export interface BulkRegisterResponse {
  created: number;
  failed: number;
  results: { email: string; success: boolean; message: string }[];
}

// Session ID helper
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('leakmap_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('leakmap_session_id', sessionId);
  }
  return sessionId;
};

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchStatistics = async (): Promise<Statistics> => {
  const response = await api.get<Statistics>('/api/statistics');
  return response.data;
};

export const fetchMyStatistics = async (): Promise<Statistics> => {
  const response = await api.get<Statistics>('/api/statistics/me', { headers: authHeader() });
  return response.data;
};

// ---- Admin User Management ----

export const fetchUsers = async (): Promise<UserRecord[]> => {
  const response = await api.get<UserRecord[]>('/api/admin/users', {
    headers: authHeader()
  });
  return response.data;
};

export const updateUserRole = async (id: number, role: string): Promise<UserRecord> => {
  const response = await api.put<UserRecord>(`/api/users/${id}/role`, { role }, {
    headers: authHeader()
  });
  return response.data;
};

export const promoteUser = async (id: number): Promise<UserRecord> => {
  const response = await api.put<UserRecord>(`/api/admin/users/${id}/promote`, {}, {
    headers: authHeader()
  });
  return response.data;
};

export const purgeUserReports = async (id: number): Promise<{ detail: string }> => {
  const response = await api.post<{ detail: string }>(`/api/admin/users/${id}/purge_reports`, {}, {
    headers: authHeader()
  });
  return response.data;
};

export const bulkRegisterUsers = async (users: BulkUserEntry[]): Promise<BulkRegisterResponse> => {
  const response = await api.post<BulkRegisterResponse>('/api/admin/users/bulk_register', { users }, {
    headers: authHeader()
  });
  return response.data;
};

// ---- Reports ----

export const fetchPublicReports = async (): Promise<Report[]> => {
  const response = await api.get<Report[]>('/api/reports/public');
  return response.data;
};

export const fetchReports = async (filters: {
  status?: string;
  district?: string;
  search?: string;
  page?: number;
  limit?: number;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  exclude_mine?: boolean;
} = {}): Promise<Report[]> => {
  const response = await api.get<Report[]>('/api/reports', {
    params: filters,
    headers: authHeader()
  });
  return response.data;
};

export const fetchAdminReports = async (filters: {
  status?: string;
  district?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<Report[]> => {
  const response = await api.get<Report[]>('/api/admin/reports', {
    params: filters,
    headers: authHeader()
  });
  return response.data;
};

export const fetchReportById = async (id: number): Promise<Report> => {
  const response = await api.get<Report>(`/api/reports/${id}`);
  return response.data;
};

export const createReport = async (data: ReportCreateParams): Promise<Report> => {
  const response = await api.post<Report>('/api/reports', data, {
    headers: authHeader()
  });
  return response.data;
};

export const addComment = async (id: number, data: CommentParams): Promise<Report> => {
  const response = await api.post<Report>(`/api/reports/${id}/comments`, data, {
    headers: authHeader()
  });
  return response.data;
};

export const addReportUpdate = async (id: number, data: UpdateParams): Promise<Report> => {
  const response = await api.post<Report>(`/api/reports/${id}/updates`, data, {
    headers: authHeader()
  });
  return response.data;
};

export const uploadPhoto = async (file: File): Promise<{ image_url: string; file_size: number; ai_description?: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<{ image_url: string; file_size: number; ai_description?: string }>('/api/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...authHeader()
    },
  });
  return response.data;
};

export const verifyReport = async (id: number, data: string | { verification_type: string; session_id: string }): Promise<Report> => {
  const payload = typeof data === 'string' ? { verification_type: data } : data;
  const response = await api.post<Report>(`/api/reports/${id}/verify`, payload, {
    headers: authHeader()
  });
  return response.data;
};
