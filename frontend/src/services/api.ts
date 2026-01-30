import type {
  NatureDevice,
  NatureAppliance,
  Schedule,
  LogsResponse,
  ApplianceAction,
  ScheduleType,
} from '@/types';

const API_BASE = '/api';

// CSRFトークンのキャッシュ
let csrfToken: string | null = null;

// CSRFトークンを取得
async function fetchCsrfToken(): Promise<string> {
  const response = await fetch(`${API_BASE}/csrf-token`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token');
  }
  const data = await response.json();
  const token: string = data.csrfToken || '';
  csrfToken = token;
  return token;
}

// CSRFトークンを取得（キャッシュあり）
async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }
  return fetchCsrfToken();
}

// CSRFトークンをリセット（403エラー時に再取得するため）
function resetCsrfToken(): void {
  csrfToken = null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = options.method || 'GET';
  const needsCsrf = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // POST/PUT/DELETE/PATCHリクエストにはCSRFトークンを含める
  if (needsCsrf) {
    headers['X-CSRF-Token'] = await getCsrfToken();
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Send cookies for session-based auth
    headers,
  });

  if (response.status === 401) {
    // Redirect to login on unauthorized
    window.location.href = '/api/auth/login';
    throw new Error('Unauthorized - redirecting to login');
  }

  // CSRFトークンが無効な場合は再取得してリトライ
  if (response.status === 403 && needsCsrf) {
    const error = await response.json().catch(() => ({}));
    if (error.error?.includes('CSRF')) {
      resetCsrfToken();
      headers['X-CSRF-Token'] = await getCsrfToken();
      const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers,
      });
      if (retryResponse.ok) {
        if (retryResponse.status === 204) {
          return undefined as T;
        }
        return retryResponse.json();
      }
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  getDevices(): Promise<NatureDevice[]> {
    return request<NatureDevice[]>('/devices');
  },

  getAppliances(forceRefresh = false): Promise<NatureAppliance[]> {
    const query = forceRefresh ? '?refresh=true' : '';
    return request<NatureAppliance[]>(`/appliances${query}`);
  },

  getSchedules(): Promise<Schedule[]> {
    return request<Schedule[]>('/schedules');
  },

  getSchedule(id: number): Promise<Schedule> {
    return request<Schedule>(`/schedules/${id}`);
  },

  createSchedule(data: {
    name: string;
    applianceId: string;
    applianceName: string;
    applianceType: string;
    action: ApplianceAction;
    scheduleType: ScheduleType;
    executeAt?: string;
    cronExpression?: string;
  }): Promise<Schedule> {
    return request<Schedule>('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSchedule(
    id: number,
    data: Partial<{
      name: string;
      applianceId: string;
      applianceName: string;
      applianceType: string;
      action: ApplianceAction;
      scheduleType: ScheduleType;
      executeAt?: string;
      cronExpression?: string;
    }>
  ): Promise<Schedule> {
    return request<Schedule>(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteSchedule(id: number): Promise<void> {
    return request<void>(`/schedules/${id}`, {
      method: 'DELETE',
    });
  },

  toggleSchedule(id: number): Promise<Schedule> {
    return request<Schedule>(`/schedules/${id}/toggle`, {
      method: 'POST',
    });
  },

  getLogs(limit = 100, offset = 0): Promise<LogsResponse> {
    return request<LogsResponse>(`/logs?limit=${limit}&offset=${offset}`);
  },

  getLogsBySchedule(
    scheduleId: number,
    limit = 50,
    offset = 0
  ): Promise<LogsResponse> {
    return request<LogsResponse>(
      `/logs/schedule/${scheduleId}?limit=${limit}&offset=${offset}`
    );
  },

  sendApplianceAction(
    applianceId: string,
    action: ApplianceAction
  ): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/appliances/${applianceId}/action`, {
      method: 'POST',
      body: JSON.stringify(action),
    });
  },
};
