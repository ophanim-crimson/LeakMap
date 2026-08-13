import axios from 'axios';

// Use relative paths to rely on vite proxy locally and vercel proxy in production
const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
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
  latitude: number;
  longitude: number;
  status: 'Active' | 'Resolved';
  ai_urgency?: string;
  created_at: string;
  photos: PhotoResponse[];
  updates: UpdateResponse[];
  comments: CommentResponse[];
  user?: { id: number; email: string; role: string; is_flagged: boolean };
}

export interface ReportCreateParams {
  issue_type: string;
  description?: string;
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

// Session ID helper (generates or retrieves UUID stored in localStorage)
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('leakmap_session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('leakmap_session_id', sessionId);
  }
  return sessionId;
};

export const fetchStatistics = async (): Promise<Statistics> => {
  const response = await api.get<Statistics>('/api/statistics');
  return response.data;
};

export const fetchUsers = async (): Promise<{ id: number; email: string; role: string; is_flagged: boolean }[]> => {
  const token = localStorage.getItem('token');
  const response = await api.get<{ id: number; email: string; role: string; is_flagged: boolean }[]>('/api/users', {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};

export const updateUserRole = async (id: number, role: string): Promise<{ id: number; email: string; role: string; is_flagged: boolean }> => {
  const token = localStorage.getItem('token');
  const response = await api.put<{ id: number; email: string; role: string; is_flagged: boolean }>(`/api/users/${id}/role`, { role }, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};

export const fetchPublicReports = async (): Promise<Report[]> => {
  const response = await api.get<Report[]>('/api/reports/public');
  return response.data;
};

export const fetchReports = async (filters: {
  status?: string;
  page?: number;
  limit?: number;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
} = {}): Promise<Report[]> => {
  const token = localStorage.getItem('token');
  const response = await api.get<Report[]>('/api/reports', { 
    params: filters,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};

export const fetchReportById = async (id: number): Promise<Report> => {
  const response = await api.get<Report>(`/api/reports/${id}`);
  return response.data;
};

export const createReport = async (data: ReportCreateParams): Promise<Report> => {
  const token = localStorage.getItem('token');
  const response = await api.post<Report>('/api/reports', data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};

export const addComment = async (id: number, data: CommentParams): Promise<Report> => {
  const token = localStorage.getItem('token');
  const response = await api.post<Report>(`/api/reports/${id}/comments`, data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};

export const addReportUpdate = async (id: number, data: UpdateParams): Promise<Report> => {
  const token = localStorage.getItem('token');
  const response = await api.post<Report>(`/api/reports/${id}/updates`, data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data;
};


export const uploadPhoto = async (file: File): Promise<{ image_url: string; file_size: number; ai_description?: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('token');
  const response = await api.post<{ image_url: string; file_size: number; ai_description?: string }>('/api/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });
  return response.data;
};
