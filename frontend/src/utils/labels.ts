import type { Schedule, AirconAction, TVAction, LightAction, ApplianceAction } from '@/types';

// エアコン運転モードのラベル
export const airconModeLabels: Record<string, string> = {
  auto: '自動',
  cool: '冷房',
  warm: '暖房',
  dry: '除湿',
  blow: '送風',
};

// エアコン風量のラベル
export const airconVolumeLabels: Record<string, string> = {
  auto: '自動',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
};

// エアコン風向のラベル
export const airconDirectionLabels: Record<string, string> = {
  auto: '自動',
  swing: 'スイング',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
};

// テレビボタンのラベル
export const tvButtonLabels: Record<string, string> = {
  // 電源系
  power: '電源',
  'power-on': '電源ON',
  'power-off': '電源OFF',
  onoff: '電源',
  // 音量
  'vol-up': '音量+',
  'vol-down': '音量-',
  mute: 'ミュート',
  // チャンネル
  'ch-up': 'チャンネル+',
  'ch-down': 'チャンネル-',
  'ch-1': '1ch',
  'ch-2': '2ch',
  'ch-3': '3ch',
  'ch-4': '4ch',
  'ch-5': '5ch',
  'ch-6': '6ch',
  'ch-7': '7ch',
  'ch-8': '8ch',
  'ch-9': '9ch',
  'ch-10': '10ch',
  'ch-11': '11ch',
  'ch-12': '12ch',
  // 方向キー
  'd-pad-up': '上',
  'd-pad-down': '下',
  'd-pad-left': '左',
  'd-pad-right': '右',
  up: '上',
  down: '下',
  left: '左',
  right: '右',
  ok: '決定',
  select: '決定',
  back: '戻る',
  home: 'ホーム',
  menu: 'メニュー',
  d: 'd',
  // 入力切替
  input: '入力切替',
  'input-src': '入力切替',
  'select-input-src': '入力切替',
  'input-terrestrial': '地デジ',
  'input-bs': 'BS',
  'input-cs': 'CS',
  tv: '地デジ',
  bs: 'BS',
  cs: 'CS',
  'select-audio': '音声切替',
  // 番号キー
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  '11': '11',
  '12': '12',
  // 表示
  display: '画面表示',
  subtitle: '字幕',
  option: 'オプション',
  // カラーボタン
  blue: '青',
  red: '赤',
  green: '緑',
  yellow: '黄',
  // 再生系
  play: '再生',
  pause: '一時停止',
  stop: '停止',
  fast_forw: '早送り',
  fast_back: '巻き戻し',
  'fast-forward': '早送り',
  'fast-rewind': '巻き戻し',
  prev: '前へ',
  next: '次へ',
  rec: '録画',
  record: '録画',
  'rec-list': '録画リスト',
  eject: '取り出し',
  // その他
  'tv-schedule': '番組表',
};

// 照明ボタンのラベル
export const lightButtonLabels: Record<string, string> = {
  on: '点灯',
  off: '消灯',
  onoff: '電源',
  'on-100': '全灯',
  'on-favorite': 'お気に入り',
  night: '常夜灯',
  bright: '明るく',
  dark: '暗く',
  'bright-up': '明るく',
  'bright-down': '暗く',
  'color-temp-up': '色温度+',
  'color-temp-down': '色温度-',
  'colortemp-up': '色温度+',
  'colortemp-down': '色温度-',
  preset: 'プリセット',
  'preset-1': 'プリセット1',
  'preset-2': 'プリセット2',
  'preset-3': 'プリセット3',
  'preset-4': 'プリセット4',
};

// デバイスタイプのラベル
export const applianceTypeLabels: Record<string, string> = {
  AC: 'エアコン',
  TV: 'テレビ',
  LIGHT: '照明',
  IR: '赤外線',
};

// デバイスタイプのseverity
export const applianceTypeSeverities: Record<string, string> = {
  AC: 'info',
  TV: 'success',
  LIGHT: 'warn',
  IR: 'secondary',
};

// デバイスタイプのアイコン
export const applianceTypeIcons: Record<string, string> = {
  AC: 'pi pi-gauge',
  TV: 'pi pi-desktop',
  LIGHT: 'pi pi-sun',
  IR: 'pi pi-wifi',
};

// ラベル取得関数
export function getAirconModeLabel(mode: string): string {
  return airconModeLabels[mode] || mode;
}

export function getAirconVolumeLabel(vol: string): string {
  return airconVolumeLabels[vol] || vol;
}

export function getAirconDirectionLabel(dir: string): string {
  return airconDirectionLabels[dir] || dir;
}

export function getTVButtonLabel(button: string): string {
  return tvButtonLabels[button] || button;
}

export function getLightButtonLabel(button: string): string {
  return lightButtonLabels[button] || button;
}

export function getApplianceTypeLabel(type: string): string {
  return applianceTypeLabels[type] || type;
}

export function getApplianceTypeSeverity(type: string): string {
  return applianceTypeSeverities[type] || 'secondary';
}

export function getApplianceTypeIcon(type: string): string {
  return applianceTypeIcons[type] || 'pi pi-box';
}

// アクションを日本語で表示
export function formatAction(action: ApplianceAction | null | undefined): string {
  if (!action) return '-';

  if (action.type === 'AC') {
    const acAction = action as AirconAction;
    // 電源ボタンの場合
    if (acAction.button === 'power-off') {
      return '電源OFF';
    }
    // 通常の設定の場合
    const parts: string[] = [];
    if (acAction.temperature) {
      parts.push(`${acAction.temperature}°`);
    }
    if (acAction.operation_mode) {
      parts.push(getAirconModeLabel(acAction.operation_mode));
    }
    if (acAction.air_volume && acAction.air_volume !== 'auto') {
      parts.push(`風量${acAction.air_volume}`);
    }
    return parts.length > 0 ? parts.join(' ') : '設定変更';
  }

  if (action.type === 'TV') {
    const tvAction = action as TVAction;
    return getTVButtonLabel(tvAction.button);
  }

  if (action.type === 'LIGHT') {
    const lightAction = action as LightAction;
    return getLightButtonLabel(lightAction.button);
  }

  if (action.type === 'IR') {
    return 'カスタム信号';
  }

  return '-';
}

// スケジュールのアクションをフォーマット
export function formatScheduleAction(schedule: Schedule): string {
  return formatAction(schedule.action);
}
