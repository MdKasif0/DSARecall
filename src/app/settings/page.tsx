'use client';

import { useState } from 'react';
import {
  Calendar,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  User,
  Sliders,
  Volume2,
  Database,
  ArrowRight,
  Download,
  Trash2,
} from 'lucide-react';
import {
  getSettings,
  saveSettings,
  SCHEDULE_PRESETS,
  type AppSettings,
} from '@/lib/settings';
import {
  exportDataJSON,
  exportDataCSV,
  loadSampleData,
  recalculateAllQuestionIntervals,
  saveQuestions,
  saveRevisionRecords,
} from '@/lib/storage';
import { useQuestions } from '@/lib/context';
import { addDays, format } from 'date-fns';
import { getTodayISO, parseLocalDate } from '@/lib/dates';
import TopBar from '@/components/TopBar';

export default function SettingsPage() {
  const { questions, refreshQuestions } = useQuestions();

  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [activePreset, setActivePreset] = useState<string>(() => getSettings().activePresetId);
  const [customIntervals, setCustomIntervals] = useState<number[]>(() => getSettings().intervals);
  const [userName, setUserName] = useState<string>(() => getSettings().userName || 'Kasif');
  const [dailyTarget, setDailyTarget] = useState<number>(() => getSettings().dailyTarget || 5);
  const [enableSound, setEnableSound] = useState<boolean>(() => getSettings().enableSound || false);

  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handlePresetSelect = (presetId: string) => {
    setActivePreset(presetId);
    if (presetId !== 'custom') {
      const preset = SCHEDULE_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        setCustomIntervals([...preset.intervals]);
      }
    }
  };

  const handleIntervalChange = (index: number, val: number) => {
    const next = [...customIntervals];
    next[index] = Math.max(1, isNaN(val) ? 1 : val);
    setCustomIntervals(next);
    setActivePreset('custom');
  };

  const handleSaveSettings = () => {
    setErrorNotice(null);

    // Validate intervals: must be 6 numbers, strictly increasing
    if (customIntervals.length !== 6) {
      setErrorNotice('Exactly 6 revision intervals are required.');
      return;
    }

    for (let i = 0; i < customIntervals.length; i++) {
      if (customIntervals[i] <= 0) {
        setErrorNotice('All interval days must be greater than zero.');
        return;
      }
      if (i > 0 && customIntervals[i] <= customIntervals[i - 1]) {
        setErrorNotice(
          `Interval #${i + 1} (${customIntervals[i]}d) must be greater than Interval #${i} (${customIntervals[i - 1]}d).`
        );
        return;
      }
    }

    const updated: AppSettings = {
      userName: userName.trim() || 'Kasif',
      activePresetId: activePreset,
      intervals: customIntervals,
      dailyTarget: Math.max(1, Math.min(50, dailyTarget)),
      enableSound,
      recalculateExistingOnIntervalChange: false,
    };

    saveSettings(updated);
    setSettings(updated);

    setSavedNotice('Settings saved successfully!');
    setTimeout(() => {
      setSavedNotice(null);
    }, 3000);
  };

  const handleApplyToAllQuestions = () => {
    const confirmRecalc = window.confirm(
      `Recalculate scheduled revision dates for all ${questions.length} existing questions using [${customIntervals.join(', ')}] days? Existing uncompleted checkpoints will move to these new dates.`
    );
    if (!confirmRecalc) return;

    // Save settings first
    handleSaveSettings();

    // Recalculate
    const res = recalculateAllQuestionIntervals(customIntervals);
    refreshQuestions();

    setSavedNotice(
      `Recalculated revision schedules for ${res.count} questions using +${customIntervals.join(', +')} days!`
    );
    setTimeout(() => {
      setSavedNotice(null);
    }, 4000);
  };

  const handleResetToSampleData = () => {
    const confirmed = window.confirm(
      'Reset all data back to the curated 18 sample DSA questions and 184 completed revisions?'
    );
    if (!confirmed) return;

    loadSampleData();
    refreshQuestions();
    setSavedNotice('Successfully reset to rich sample DSA data!');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleClearAllData = () => {
    const confirmed = window.confirm(
      'WARNING: Are you sure you want to delete ALL questions and revision records? This action cannot be undone.'
    );
    if (!confirmed) return;

    saveQuestions([]);
    saveRevisionRecords([]);
    refreshQuestions();
    setSavedNotice('All tracker data has been cleared.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleDownloadJSON = () => {
    const data = exportDataJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dsa-recall-backup-${getTodayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const csv = exportDataCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dsa-recall-tracker-${getTodayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Preview schedule dates starting from today
  const sampleBaseDate = parseLocalDate(getTodayISO());
  const previewDates = customIntervals.map((days) => ({
    days,
    date: format(addDays(sampleBaseDate, days), 'MMM d'),
  }));

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-text-muted">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TopBar />

      {/* Toast Notification */}
      {savedNotice && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-lg border border-[#CCD8C4] bg-[#F2F7F0] px-4 py-3 text-xs font-semibold text-[#55674C] shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} />
          <span>{savedNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-lg border border-[#ECD1CC] bg-[#FDF2F0] px-4 py-3 text-xs font-semibold text-[#A65D50] shadow-lg animate-in fade-in slide-in-from-top-2">
          <AlertTriangle size={16} />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
              Settings & Preferences
            </h1>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Customize spaced repetition revision intervals, daily revision targets, and manage your data.
          </p>
        </div>

        <button
          className="btn btn-primary btn-sm self-start gap-1.5 px-4 font-bold"
          onClick={handleSaveSettings}
        >
          <Save size={14} />
          <span>Save Preferences</span>
        </button>
      </div>

      {/* Section 1: Revision Schedule & Intervals */}
      <div className="card p-5 bg-white/65 border border-white/80 backdrop-blur-md shadow-[inset_0_1px_1.5px_#fff,0_4px_20px_rgba(70,50,30,0.04)] space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 border border-white/80 shadow-[inset_0_1px_1px_#fff] text-[#7D613D]">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">
                Spaced Repetition Schedule (Intervals)
              </h2>
              <p className="text-xs text-text-secondary">
                Configure how many days after solving a question each of the 6 revision checkpoints is due.
              </p>
            </div>
          </div>
        </div>

        {/* Schedule Presets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SCHEDULE_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-150 ${
                  isSelected
                    ? 'border-[#7D613D] bg-white/85 ring-1 ring-[#7D613D] shadow-[inset_0_1px_1.5px_#fff,0_4px_16px_rgba(125,97,61,0.08)]'
                    : 'border-white/70 bg-white/50 hover:bg-white/75 hover:border-white/90 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text">
                    {preset.name}
                  </span>
                  {isSelected && (
                    <span className="rounded-full bg-white/80 border border-white/90 px-2 py-0.5 text-[0.625rem] font-bold text-[#543E26] shadow-xs">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[0.6875rem] text-text-secondary mt-1 leading-relaxed">
                  {preset.description}
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                  {preset.intervals.map((day, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-white/75 px-1.5 py-0.5 text-[0.625rem] font-mono font-bold text-[#543E26] border border-white/80 shadow-xs"
                    >
                      +{day}d
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Custom Preset Card */}
          <div
            onClick={() => setActivePreset('custom')}
            className={`cursor-pointer rounded-xl border p-3.5 transition-all duration-150 ${
              activePreset === 'custom'
                ? 'border-[#7D613D] bg-white/85 ring-1 ring-[#7D613D] shadow-[inset_0_1px_1.5px_#fff,0_4px_16px_rgba(125,97,61,0.08)]'
                : 'border-white/70 bg-white/50 hover:bg-white/75 hover:border-white/90 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text">
                Custom Intervals
              </span>
              {activePreset === 'custom' && (
                <span className="rounded-full bg-white/80 border border-white/90 px-2 py-0.5 text-[0.625rem] font-bold text-[#543E26] shadow-xs">
                  Active
                </span>
              )}
            </div>
            <p className="text-[0.6875rem] text-text-secondary mt-1 leading-relaxed">
              Define your own customized spaced repetition sequence with 6 progressive review intervals.
            </p>
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              {customIntervals.map((day, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-white/75 px-1.5 py-0.5 text-[0.625rem] font-mono font-bold text-[#543E26] border border-white/80 shadow-xs"
                >
                  +{day}d
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Interval Days Input Boxes */}
        <div className="rounded-xl bg-white/60 border border-white/80 p-4 shadow-[inset_0_1px_1px_#fff]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-text">
              Revision Checkpoint Days ({customIntervals.length} Stages)
            </span>
            <span className="text-[0.6875rem] text-text-muted">
              Enter number of days from initial solve date
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {customIntervals.map((days, idx) => (
              <div key={idx} className="space-y-1">
                <label className="text-[0.625rem] font-bold uppercase tracking-wider text-text-muted block">
                  Rev #{idx + 1}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">
                    +
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={days}
                    onChange={(e) =>
                      handleIntervalChange(idx, parseInt(e.target.value, 10))
                    }
                    className="input pl-6 pr-6 text-xs text-center font-mono font-bold bg-white/85 border-white/90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] w-full"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.6875rem] text-text-muted">
                    d
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Date Timeline Visualizer */}
          <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.6)]">
            <span className="text-[0.6875rem] font-semibold text-text-muted block mb-2">
              Preview Schedule (if solved today {format(sampleBaseDate, 'MMM d')}):
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto text-[0.6875rem] font-medium text-text-secondary py-1">
              <span className="rounded-full bg-white/80 border border-white/90 px-2.5 py-0.5 font-bold text-[#543E26] shadow-xs">
                Today ({format(sampleBaseDate, 'MMM d')})
              </span>
              {previewDates.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 shrink-0">
                  <ArrowRight size={11} className="text-[#8F8578]" />
                  <span className="rounded-full bg-white/70 border border-white/80 px-2.5 py-0.5 font-mono text-[0.6875rem] shadow-xs">
                    +{item.days}d ({item.date})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Apply to existing questions action */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[rgba(255,255,255,0.6)]">
            <p className="text-xs text-text-secondary">
              By default, interval changes apply to new questions. You can also re-calculate all existing questions:
            </p>
            <button
              className="btn btn-secondary btn-sm text-xs font-bold gap-1.5 shrink-0 shadow-xs"
              onClick={handleApplyToAllQuestions}
            >
              <RotateCcw size={13} />
              <span>Apply to All Existing ({questions.length}) Questions</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Study Target & Profile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Profile & Greeting */}
        <div className="card p-5 bg-white/65 border border-white/80 backdrop-blur-md shadow-[inset_0_1px_1.5px_#fff,0_4px_20px_rgba(70,50,30,0.04)] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 border border-white/80 shadow-[inset_0_1px_1px_#fff] text-[#7D613D]">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">Study Profile</h2>
              <p className="text-xs text-text-secondary">
                Personalize your greeting and dashboard experience.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text">Display Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. Kasif"
              className="input text-xs w-full bg-white/80 border-white/85 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
            />
            <p className="text-[0.6875rem] text-text-muted">
              Used in the dashboard greeting (&ldquo;Good afternoon, {userName}&rdquo;) and exported reports.
            </p>
          </div>

          <div className="pt-2 border-t border-[rgba(255,255,255,0.6)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-text-muted" />
              <div>
                <p className="text-xs font-bold text-text">Revision Completion Chime</p>
                <p className="text-[0.6875rem] text-text-muted">Play a subtle audio tone when marking revisions completed</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableSound}
                onChange={(e) => setEnableSound(e.target.checked)}
                className="rounded border-[#D5CCBF] text-[#543E26] focus:ring-[#8B6F47]"
              />
            </label>
          </div>
        </div>

        {/* Daily Goal Target */}
        <div className="card p-5 bg-white/65 border border-white/80 backdrop-blur-md shadow-[inset_0_1px_1.5px_#fff,0_4px_20px_rgba(70,50,30,0.04)] space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 border border-white/80 shadow-[inset_0_1px_1px_#fff] text-[#7D613D]">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-text">Daily Revision Target</h2>
              <p className="text-xs text-text-secondary">
                Set how many problems you commit to reviewing daily.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text">Target Questions / Day</label>
              <span className="font-mono text-xs font-bold text-[#543E26]">
                {dailyTarget} problems / day
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={25}
              value={dailyTarget}
              onChange={(e) => setDailyTarget(parseInt(e.target.value, 10))}
              className="w-full accent-[#543E26]"
            />
            <div className="flex items-center justify-between text-[0.625rem] text-text-muted">
              <span>1 (Light)</span>
              <span>5 (Recommended)</span>
              <span>10 (Intense)</span>
              <span>25 (Mastery)</span>
            </div>
          </div>

          <div className="rounded-xl bg-white/50 p-2.5 border border-white/70 shadow-[inset_0_1px_1px_#fff] text-[0.75rem] text-[#635A4F] backdrop-blur-sm">
            Setting this target powers the daily progress ring on your dashboard and streaks.
          </div>
        </div>
      </div>

      {/* Section 3: Data Management */}
      <div className="card p-5 bg-white/65 border border-white/80 backdrop-blur-md shadow-[inset_0_1px_1.5px_#fff,0_4px_20px_rgba(70,50,30,0.04)] space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 border border-white/80 shadow-[inset_0_1px_1px_#fff] text-[#7D613D]">
            <Database size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-text">Data Management & Backup</h2>
            <p className="text-xs text-text-secondary">
              Export data, reset demo data, or purge your local database.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Download JSON */}
          <button
            className="btn btn-secondary btn-sm flex-col py-3 h-auto items-center justify-center gap-1.5 text-xs font-semibold hover:border-[#8B6F47] hover:text-[#5F4930]"
            onClick={handleDownloadJSON}
          >
            <Download size={16} />
            <span>Download JSON Backup</span>
          </button>

          {/* Download CSV */}
          <button
            className="btn btn-secondary btn-sm flex-col py-3 h-auto items-center justify-center gap-1.5 text-xs font-semibold hover:border-[#8B6F47] hover:text-[#5F4930]"
            onClick={handleDownloadCSV}
          >
            <Download size={16} />
            <span>Export CSV (Excel)</span>
          </button>

          {/* Reset to Sample Data */}
          <button
            className="btn btn-secondary btn-sm flex-col py-3 h-auto items-center justify-center gap-1.5 text-xs font-semibold text-[#8B6F47] hover:bg-[#FAF7F2]"
            onClick={handleResetToSampleData}
          >
            <RotateCcw size={16} />
            <span>Reset to Curated Sample Data</span>
          </button>

          {/* Clear All Data */}
          <button
            className="btn btn-secondary btn-sm flex-col py-3 h-auto items-center justify-center gap-1.5 text-xs font-semibold text-[#A65D50] hover:bg-[#FDF2F0] hover:border-[#ECD1CC]"
            onClick={handleClearAllData}
          >
            <Trash2 size={16} />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
