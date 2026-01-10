export interface NatureDevice {
  id: string;
  name: string;
  temperature_offset: number;
  humidity_offset: number;
  created_at: string;
  updated_at: string;
  firmware_version: string;
  mac_address: string;
  bt_mac_address: string;
  serial_number: string;
  newest_events: {
    te?: { val: number; created_at: string };
    hu?: { val: number; created_at: string };
    il?: { val: number; created_at: string };
    mo?: { val: number; created_at: string };
  };
}

export interface NatureAppliance {
  id: string;
  device: NatureDevice;
  model: {
    id: string;
    country: string;
    manufacturer: string;
    remote_name: string;
    series: string;
    name: string;
    image: string;
  } | null;
  nickname: string;
  image: string;
  type: 'AC' | 'TV' | 'LIGHT' | 'IR';
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
  updated_at: string;
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
  buttons: TVButton[];
}

export interface TVButton {
  name: string;
  image: string;
  label: string;
}

export interface LightInfo {
  state: {
    brightness: string;
    power: string;
    last_button: string;
  };
  buttons: LightButton[];
}

export interface LightButton {
  name: string;
  image: string;
  label: string;
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
