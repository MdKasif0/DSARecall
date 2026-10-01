'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { QuestionsProvider } from '@/lib/context';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import AddQuestionModal from '@/components/AddQuestionModal';
import ImportExportModal from '@/components/ImportExportModal';
import ToastContainer from '@/components/ToastContainer';

interface ClientShellProps {
  children: ReactNode;
}

export default function ClientShell({ children }: ClientShellProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [backupOpen, setBackupOpen] = useState(false);

  const handleClose = useCallback(() => {
    setAddModalOpen(false);
    setEditId(null);
  }, []);

  // Listen for custom events from child pages & navigation
  useEffect(() => {
    const handleEdit = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setEditId(detail);
      setAddModalOpen(true);
    };

    const handleAdd = () => {
      setEditId(null);
      setAddModalOpen(true);
    };

    window.addEventListener('dsarecall:edit', handleEdit);
    window.addEventListener('dsarecall:add', handleAdd);
    return () => {
      window.removeEventListener('dsarecall:edit', handleEdit);
      window.removeEventListener('dsarecall:add', handleAdd);
    };
  }, []);

  return (
    <QuestionsProvider>
      <div className="app-shell">
        {/* Desktop Sidebar */}
        <Sidebar onOpenBackup={() => setBackupOpen(true)} />

        {/* Main Content Area */}
        <div className="main-content">
          {/* Mobile Header & Bottom Navigation */}
          <MobileNav />

          <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
            {children}
          </main>
        </div>
      </div>

      {/* Global Modals & Notifications */}
      <AddQuestionModal
        open={addModalOpen}
        onClose={handleClose}
        editId={editId}
      />
      <ImportExportModal
        open={backupOpen}
        onClose={() => setBackupOpen(false)}
      />
      <ToastContainer />
    </QuestionsProvider>
  );
}
