'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { QuestionsProvider } from '@/lib/context';
import Header from '@/components/Header';
import AddQuestionModal from '@/components/AddQuestionModal';

interface ClientShellProps {
  children: ReactNode;
}

export default function ClientShell({ children }: ClientShellProps) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const handleAddClick = useCallback(() => {
    setEditId(null);
    setAddModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setAddModalOpen(false);
    setEditId(null);
  }, []);

  // Listen for custom events from child pages
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
      <Header onAddClick={handleAddClick} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
      <AddQuestionModal
        open={addModalOpen}
        onClose={handleClose}
        editId={editId}
      />
    </QuestionsProvider>
  );
}
