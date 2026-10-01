export interface SchedulePreset {
  id: string;
  name: string;
  description: string;
  intervals: number[];
}

export const SCHEDULE_PRESETS: SchedulePreset[] = [
  {
    id: 'standard',
    name: 'Standard Spaced Repetition (Recommended)',
    description: 'The proven 6-step cycle: +3, +7, +15, +30, +60, and +120 days from initial solve.',
    intervals: [3, 7, 15, 30, 60, 120],
  },
  {
    id: 'accelerated',
    name: 'Accelerated Review',
    description: 'High-frequency reinforcement for active interview preparation: +1, +3, +7, +14, +30, and +60 days.',
    intervals: [1, 3, 7, 14, 30, 60],
  },
  {
    id: 'sprint',
    name: 'Interview Sprint / Short Cram',
    description: 'Dense intervals for fast approaching coding interviews: +1, +2, +4, +7, +15, and +30 days.',
    intervals: [1, 2, 4, 7, 15, 30],
  },
  {
    id: 'retention',
    name: 'Long-Term Retention',
    description: 'Gentler pacing for multi-month mastery: +5, +10, +20, +40, +80, and +160 days.',
    intervals: [5, 10, 20, 40, 80, 160],
  },
];

export interface AppSettings {
  userName: string;
  activePresetId: string;
  intervals: number[];
  dailyTarget: number;
  enableSound: boolean;
  recalculateExistingOnIntervalChange: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  userName: 'Kasif',
  activePresetId: 'standard',
  intervals: [3, 7, 15, 30, 60, 120],
  dailyTarget: 5,
  enableSound: false,
  recalculateExistingOnIntervalChange: false,
};

const SETTINGS_STORAGE_KEY = 'dsarecall_user_settings';

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      intervals: Array.isArray(parsed.intervals) && parsed.intervals.length > 0
        ? parsed.intervals
        : DEFAULT_SETTINGS.intervals,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated: AppSettings = {
    ...current,
    ...partial,
  };
  saveSettings(updated);
  return updated;
}
