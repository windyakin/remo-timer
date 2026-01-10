import {
  NatureDevice,
  NatureAppliance,
  AirconAction,
  TVAction,
  LightAction,
  SignalAction,
  ApplianceAction,
} from '../types/nature';

const NATURE_API_BASE_URL = 'https://api.nature.global/1';

export class NatureApiService {
  private token: string;

  constructor(token?: string) {
    this.token = token || process.env.NATURE_API_TOKEN || '';
    if (!this.token) {
      console.warn('NATURE_API_TOKEN is not set');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${NATURE_API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Nature API error: ${response.status} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  async getDevices(): Promise<NatureDevice[]> {
    return this.request<NatureDevice[]>('/devices');
  }

  async getAppliances(): Promise<NatureAppliance[]> {
    return this.request<NatureAppliance[]>('/appliances');
  }

  async sendAirconSettings(
    applianceId: string,
    action: AirconAction
  ): Promise<void> {
    const params = new URLSearchParams();

    if (action.operation_mode) {
      params.append('operation_mode', action.operation_mode);
    }
    if (action.temperature) {
      params.append('temperature', action.temperature);
    }
    if (action.air_volume) {
      params.append('air_volume', action.air_volume);
    }
    if (action.air_direction) {
      params.append('air_direction', action.air_direction);
    }
    if (action.air_direction_h) {
      params.append('air_direction_h', action.air_direction_h);
    }
    if (action.button) {
      params.append('button', action.button);
    }

    await this.request(`/appliances/${applianceId}/aircon_settings`, {
      method: 'POST',
      body: params.toString(),
    });
  }

  async sendTVButton(applianceId: string, button: string): Promise<void> {
    const params = new URLSearchParams();
    params.append('button', button);

    await this.request(`/appliances/${applianceId}/tv`, {
      method: 'POST',
      body: params.toString(),
    });
  }

  async sendLightButton(applianceId: string, button: string): Promise<void> {
    const params = new URLSearchParams();
    params.append('button', button);

    await this.request(`/appliances/${applianceId}/light`, {
      method: 'POST',
      body: params.toString(),
    });
  }

  async sendSignal(signalId: string): Promise<void> {
    await this.request(`/signals/${signalId}/send`, {
      method: 'POST',
    });
  }

  async executeAction(
    applianceId: string,
    action: ApplianceAction
  ): Promise<void> {
    switch (action.type) {
      case 'AC':
        await this.sendAirconSettings(applianceId, action);
        break;
      case 'TV':
        await this.sendTVButton(applianceId, action.button);
        break;
      case 'LIGHT':
        await this.sendLightButton(applianceId, action.button);
        break;
      case 'IR':
        await this.sendSignal(action.signal_id);
        break;
      default:
        throw new Error(`Unknown action type`);
    }
  }
}

let _natureApiService: NatureApiService | null = null;

export function getNatureApiService(): NatureApiService {
  if (!_natureApiService) {
    _natureApiService = new NatureApiService();
  }
  return _natureApiService;
}

// Proxy object for lazy initialization
export const natureApiService = {
  getDevices: () => getNatureApiService().getDevices(),
  getAppliances: () => getNatureApiService().getAppliances(),
  executeAction: (applianceId: string, action: ApplianceAction) =>
    getNatureApiService().executeAction(applianceId, action),
};
