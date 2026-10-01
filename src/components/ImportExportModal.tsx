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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 id="backup-modal-title" className="text-base font-semibold text-text">
              Backup & Transfer
            </h2>
          </div>
          <button className="btn-icon btn-ghost" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-border px-5">
          <button
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition-colors ${
              activeTab === 'export'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
            onClick={() => setActiveTab('export')}
          >
            <Download size={14} />
            Export Data
          </button>
          <button
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition-colors ${
              activeTab === 'import'
                ? 'border-[#8B6F47] text-[#5F4930]'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
            onClick={() => setActiveTab('import')}
          >
            <Upload size={14} />
            Import Data
          </button>
          <button
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold transition-colors ${
              activeTab === 'sample'
                ? 'border-[#8B6F47] text-[#5F4930]'
                : 'border-transparent text-text-muted hover:text-text'
            }`}
            onClick={() => setActiveTab('sample')}
          >
            <Sparkles size={14} />
            Sample Data
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-text-muted">
                  Download a backup of your questions and revision records. You can save it locally or transfer to another device.
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs font-medium text-text">
                  <span className="rounded bg-slate-100 px-2 py-1">
                    {questions.length} Questions
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-1">
                    {records.length} Revision Records
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* JSON Export */}
                <div className="card p-4 flex flex-col justify-between gap-3 border hover:border-primary/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <FileJson size={20} />
                      <span className="text-sm font-semibold text-text">Full Backup (JSON)</span>
                    </div>
                    <p className="text-xs text-text-muted">
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
                <div className="card p-4 flex flex-col justify-between gap-3 border hover:border-primary/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 text-[#15803d] mb-1">
                      <FileSpreadsheet size={20} />
                      <span className="text-sm font-semibold text-text">Spreadsheet (CSV)</span>
                    </div>
                    <p className="text-xs text-text-muted">
                      Original Excel table format with all 6 interval dates (+3, +7, etc.). Opens in Excel or Google Sheets.
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
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-text-muted">
                Restore questions from a previously exported <code className="text-primary font-semibold">.json</code> backup file.
              </p>

              {/* File upload dropzone */}
              <div
                className="card border-dashed border-2 p-5 text-center cursor-pointer hover:bg-slate-50 transition-colors"
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-primary">
                    <Upload size={18} />
                  </div>
                  <span className="text-xs font-semibold text-text">
                    {selectedFile ? selectedFile.name : 'Click to select JSON backup file'}
                  </span>
                  <span className="text-[0.6875rem] text-text-muted">
                    Only valid DSARecall JSON files are supported
                  </span>
                </div>
              </div>

              {/* Error message */}
              {importError && (
                <div className="flex items-center gap-2 rounded-lg bg-danger-light p-3 text-xs text-danger">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Parsed Preview */}
              {parsedData && !importError && (
                <div className="rounded-lg border border-border bg-slate-50/60 p-3.5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <FileCheck size={16} />
                    <span>File Validated Successfully</span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-text">
                    <span className="rounded bg-white border border-border px-2 py-1">
                      <strong>{parsedData.questions?.length || 0}</strong> questions found
                    </span>
                    <span className="rounded bg-white border border-border px-2 py-1">
                      <strong>{parsedData.records?.length || 0}</strong> revision checkpoints found
                    </span>
                  </div>

                  {/* Overwrite or Merge Option */}
                  <div className="pt-2 border-t border-border space-y-2">
                    <label className="flex items-center gap-2 text-xs text-text cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overwrite}
                        onChange={(e) => setOverwrite(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary"
                      />
                      <span>
                        Replace all existing data (Warning: will overwrite current questions)
                      </span>
                    </label>
                    {!overwrite && (
                      <p className="text-[0.6875rem] text-text-muted">
                        Unchecked: Items will be merged safely with your existing data.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
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
                <h3 className="text-sm font-bold text-text">Load Curated DSA Practice Dataset</h3>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Populate 18 realistic DSA questions across topics (Binary Search, Two Sum, LRU Cache, Trapping Rain Water, Number of Islands, etc.) with completed revisions, active 12-day streak, and historical activity matching the visual benchmark.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-[#FAF7F2] p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#5F4930]">
                  <Sparkles size={14} className="text-[#8B6F47]" />
                  <span>Included in Demo Data</span>
                </div>
                <ul className="text-xs text-text-secondary space-y-1 list-disc pl-4">
                  <li>18 curated problems across Arrays, Trees, Graphs, DP, Binary Search</li>
                  <li>Today&apos;s revisions (2 actionable questions due today)</li>
                  <li>Overdue revision (1 item for testing alerts)</li>
                  <li>Active 12-day streak and 184 completed revisions</li>
                  <li>Full 53-week GitHub-style heatmap and 30-day activity chart</li>
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
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
