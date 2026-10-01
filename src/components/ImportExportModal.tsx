'use client';

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import {
  X,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { useQuestions } from '@/lib/context';
import { exportDataJSON, exportDataCSV } from '@/lib/storage';
import { getTodayISO } from '@/lib/dates';
import type { TrackerExportData } from '@/lib/types';

interface ImportExportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportExportModal({ open, onClose }: ImportExportModalProps) {
  const { questions, records, importData, loadSampleData } = useQuestions();
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'sample'>('export');

  // Import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<TrackerExportData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const today = getTodayISO();

  // Export handlers
  const handleExportJSON = () => {
    const data = exportDataJSON();
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `dsarecall-backup-${today}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const csvContent = exportDataCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dsarecall-spreadsheet-${today}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Import handlers
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setParsedData(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.questions)) {
          setImportError('Invalid backup file: Missing questions list.');
          return;
        }

        setParsedData(parsed as TrackerExportData);
      } catch {
        setImportError('Failed to parse file: Please provide a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (!parsedData) return;
    const res = importData(parsedData, overwrite);
    if (res.success) {
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
    >
      <div className="modal-content !p-0 overflow-hidden shadow-[0_24px_64px_rgba(15,23,42,0.18),inset_0_1px_1.5px_rgba(255,255,255,0.95)] border border-white/80" onClick={(e) => e.stopPropagation()}>
        {/* Header with macOS traffic lights & specular sheen */}
        <div className="flex items-center justify-between border-b border-white/60 bg-white/40 px-6 py-4.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 mr-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]/80 shadow-[inset_0_0.5px_1px_rgba(255,255,255,0.8)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/80 shadow-[inset_0_0.5px_1px_rgba(255,255,255,0.8)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]/80 shadow-[inset_0_0.5px_1px_rgba(255,255,255,0.8)]" />
            </div>
            <div>
              <h2 id="backup-modal-title" className="text-base font-bold text-slate-900 tracking-tight">
                Data Transfer & Backup
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Export, restore, or load curated problem sets</p>
            </div>
          </div>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/60 hover:bg-white text-slate-500 hover:text-slate-800 transition-all border border-white/80 shadow-xs"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab selection (macOS segmented capsule control) */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex p-1 bg-slate-200/50 backdrop-blur-md border border-white/70 rounded-xl gap-1">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'export'
                  ? 'bg-white text-slate-900 shadow-sm border border-white/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab('export')}
            >
              <Download size={14} />
              Export
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'import'
                  ? 'bg-white text-slate-900 shadow-sm border border-white/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab('import')}
            >
              <Upload size={14} />
              Import
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'sample'
                  ? 'bg-white text-slate-900 shadow-sm border border-white/90'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setActiveTab('sample')}
            >
              <Sparkles size={14} className="text-emerald-600" />
              Demo Data
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-2">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Download a complete backup of your questions and revision records. You can save it locally or sync across your devices.
                </p>
                <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold">
                  <span className="rounded-lg bg-white/70 backdrop-blur-sm border border-white/90 px-2.5 py-1 text-slate-700 shadow-xs">
                    {questions.length} Questions
                  </span>
                  <span className="rounded-lg bg-white/70 backdrop-blur-sm border border-white/90 px-2.5 py-1 text-slate-700 shadow-xs">
                    {records.length} Revision Records
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* JSON Export */}
                <div className="card-glass p-4 rounded-xl flex flex-col justify-between gap-3 border border-white/80 hover:border-emerald-500/40 transition-all">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-600 mb-1.5">
                      <FileJson size={20} />
                      <span className="text-sm font-bold text-slate-900">Full Backup (JSON)</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Complete state including revision records, status, and metadata. Best for restoring or moving to another browser.
                    </p>
                  </div>
                  <button
                    className="btn btn-primary btn-sm w-full"
                    onClick={handleExportJSON}
                    disabled={questions.length === 0}
                  >
                    <Download size={14} />
                    Download JSON
                  </button>
                </div>

                {/* CSV Export */}
                <div className="card-glass p-4 rounded-xl flex flex-col justify-between gap-3 border border-white/80 hover:border-emerald-500/40 transition-all">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-700 mb-1.5">
                      <FileSpreadsheet size={20} />
                      <span className="text-sm font-bold text-slate-900">Spreadsheet (CSV)</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Original Excel table format with all 6 interval dates (+3, +7, etc.). Opens seamlessly in Excel or Google Sheets.
                    </p>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm w-full"
                    onClick={handleExportCSV}
                    disabled={questions.length === 0}
                  >
                    <Download size={14} />
                    Download CSV
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'import' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Restore questions from a previously exported <code className="text-emerald-700 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono font-semibold">.json</code> backup file.
              </p>

              {/* File upload dropzone */}
              <div
                className="card-glass border-dashed border-2 border-white/90 p-6 text-center cursor-pointer hover:bg-white/70 transition-all rounded-2xl"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 border border-emerald-500/25 shadow-xs">
                    <Upload size={18} />
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {selectedFile ? selectedFile.name : 'Click to select JSON backup file'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Only valid DSARecall JSON files are supported
                  </span>
                </div>
              </div>

              {/* Error message */}
              {importError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/25 p-3 text-xs text-rose-800 backdrop-blur-sm shadow-xs">
                  <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Parsed Preview */}
              {parsedData && !importError && (
                <div className="rounded-xl border border-white/80 bg-white/50 backdrop-blur-md p-4 space-y-3 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                    <FileCheck size={16} />
                    <span>File Validated Successfully</span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-slate-800">
                    <span className="rounded-lg bg-white/80 backdrop-blur-sm border border-white/90 px-2.5 py-1 font-medium shadow-xs">
                      <strong className="text-slate-900 font-bold">{parsedData.questions?.length || 0}</strong> questions found
                    </span>
                    <span className="rounded-lg bg-white/80 backdrop-blur-sm border border-white/90 px-2.5 py-1 font-medium shadow-xs">
                      <strong className="text-slate-900 font-bold">{parsedData.records?.length || 0}</strong> revision checkpoints found
                    </span>
                  </div>

                  {/* Overwrite or Merge Option */}
                  <div className="pt-2 border-t border-white/60 space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overwrite}
                        onChange={(e) => setOverwrite(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium">
                        Replace all existing data (Warning: will overwrite current questions)
                      </span>
                    </label>
                    {!overwrite && (
                      <p className="text-[11px] text-slate-500 pl-5">
                        Unchecked: Items will be merged safely with your existing data.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="flex justify-end gap-2 pt-3 border-t border-white/60">
                <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!parsedData || !!importError}
                  onClick={handleExecuteImport}
                >
                  <CheckCircle2 size={14} />
                  Confirm Import
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Load Curated DSA Practice Dataset</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Populate 18 realistic DSA questions across topics (Binary Search, Two Sum, LRU Cache, Trapping Rain Water, Number of Islands, etc.) with completed revisions, active 12-day streak, and historical activity.
                </p>
              </div>

              <div className="rounded-2xl border border-white/80 bg-white/50 backdrop-blur-md p-4 space-y-2.5 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.95)]">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <Sparkles size={14} className="text-emerald-600" />
                  <span>Included in Demo Data</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 font-medium">
                  <li>18 curated problems across Arrays, Trees, Graphs, DP, Binary Search</li>
                  <li>Today&apos;s revisions (2 actionable questions due today)</li>
                  <li>Overdue revision (1 item for testing alerts)</li>
                  <li>Active 12-day streak and 184 completed revisions</li>
                  <li>Full 53-week GitHub-style heatmap and 30-day activity chart</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/60">
                <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    loadSampleData();
                    onClose();
                  }}
                >
                  <Sparkles size={14} />
                  Load Sample Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
