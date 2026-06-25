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
  uploaded_at: string;
}

export interface UpdateResponse {
  id: number;
  report_id: number;
  update_text: string;
  created_at: string;
}

export interface VerificationCounts {
  confirmed: number;
  duplicate: number;
  resolved: number;
}

export interface Report {
  id: number;
  report_code: string;
  issue_type: 'Leak' | 'Overflow' | 'Damaged Tap' | 'Broken Valve' | 'Water Supply Issue' | 'Other';
  description: string;
  latitude: number;
  longitude: number;
  status: 'Active' | 'Resolved';
  created_at: string;
  photos: PhotoResponse[];
  updates: UpdateResponse[];
  verification_counts: VerificationCounts;
}

export interface ReportCreateParams {
  issue_type: string;
  description?: string;
  latitude: number;
  longitude: number;
  photo_url?: string;
}

export interface VerificationParams {
  verification_type: 'Confirmed' | 'Duplicate' | 'Resolved';
  session_id: string;
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

export const fetchReports = async (filters: {
  q?: string;
  issue_type?: string;
  status?: string;
  min_lat?: number;
  max_lat?: number;
  min_lng?: number;
  max_lng?: number;
  page?: number;
  limit?: number;
} = {}): Promise<Report[]> => {
  const response = await api.get<Report[]>('/api/reports', { params: filters });
  return response.data;
};

export const fetchReportById = async (id: number): Promise<Report> => {
  const response = await api.get<Report>(`/api/reports/${id}`);
  return response.data;
};

export const createReport = async (data: ReportCreateParams): Promise<Report> => {
  const response = await api.post<Report>('/api/reports', data);
  return response.data;
};

export const verifyReport = async (id: number, data: VerificationParams): Promise<Report> => {
  const response = await api.post<Report>(`/api/reports/${id}/verify`, data);
  return response.data;
};

export const addReportUpdate = async (id: number, data: UpdateParams): Promise<Report> => {
  const response = await api.post<Report>(`/api/reports/${id}/updates`, data);
  return response.data;
};

export const uploadPhoto = async (file: File): Promise<{ image_url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post<{ image_url: string }>('/api/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
