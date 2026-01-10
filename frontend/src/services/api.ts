import type {
  NatureDevice,
  NatureAppliance,
  Schedule,
  LogsResponse,
  ApplianceAction,
  ScheduleType,
} from '@/types';

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

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

  getAppliances(): Promise<NatureAppliance[]> {
    return request<NatureAppliance[]>('/appliances');
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
};
