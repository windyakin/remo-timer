export interface NatureDevice {
  id: string;
  name: string;
  firmware_version: string;
  newest_events: {
    te?: { val: number; created_at: string };
    hu?: { val: number; created_at: string };
  };
}

export interface NatureAppliance {
  id: string;
  nickname: string;
  image: string;
  type: 'AC' | 'TV' | 'LIGHT' | 'IR';
  device: NatureDevice;
  settings: AirconSettings | null;
  aircon?: AirconInfo;
  tv?: TVInfo;
  light?: LightInfo;
  signals: Signal[];
}

export interface AirconSettings {
  temp: string;
  temp_unit: string;
  mode: string;
  vol: string;
  dir: string;
  dirh: string;
  button: string;
}

export interface AirconInfo {
  range: {
    modes: {
      [key: string]: {
        temp: string[];
        vol: string[];
        dir: string[];
        dirh: string[];
      };
    };
    fixedButtons: string[];
  };
  tempUnit: string;
}

export interface TVInfo {
  state: {
    input: string;
  };
  buttons: { name: string; image: string; label: string }[];
}

export interface LightInfo {
  state: {
    brightness: string;
    power: string;
    last_button: string;
  };
  buttons: { name: string; image: string; label: string }[];
}

export interface Signal {
  id: string;
  name: string;
  image: string;
}

export interface AirconAction {
  type: 'AC';
  operation_mode?: string;
  temperature?: string;
  air_volume?: string;
  air_direction?: string;
  air_direction_h?: string;
  button?: string;
}

export interface TVAction {
  type: 'TV';
  button: string;
}

export interface LightAction {
  type: 'LIGHT';
  button: string;
}

export interface SignalAction {
  type: 'IR';
  signal_id: string;
}

export type ApplianceAction = AirconAction | TVAction | LightAction | SignalAction;

export type ScheduleType = 'once' | 'recurring';

export interface Schedule {
  id: number;
  name: string;
  applianceId: string;
  applianceName: string;
  applianceType: string;
  action: ApplianceAction;
  scheduleType: ScheduleType;
  executeAt: string | null;
  cronExpression: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionLog {
  id: number;
  scheduleId: number;
  schedule?: Schedule;
  executedAt: string;
  status: 'success' | 'failed';
  response: object | null;
  errorMessage: string | null;
}

export interface LogsResponse {
  logs: ExecutionLog[];
  total: number;
  limit: number;
  offset: number;
}
