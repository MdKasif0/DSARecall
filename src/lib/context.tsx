'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { DSAQuestion, QuestionStatus, RevisionRecord, RevisionInterval } from '@/lib/types';
import * as storage from '@/lib/storage';

interface QuestionsContextValue {
  questions: DSAQuestion[];
  records: RevisionRecord[];
  recordsMap: Map<string, RevisionRecord>;
  isLoaded: boolean;
  addQuestion: (name: string, dateSolved: string, status?: QuestionStatus) => DSAQuestion;
  updateQuestion: (
    id: string,
    updates: Partial<Pick<DSAQuestion, 'questionName' | 'dateSolved' | 'status'>>
  ) => DSAQuestion | null;
  deleteQuestion: (id: string) => boolean;
  markRevision: (questionId: string, interval: RevisionInterval, completed?: boolean) => void;
  refreshQuestions: () => void;
}

const QuestionsContext = createContext<QuestionsContextValue | null>(null);

export function QuestionsProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<DSAQuestion[]>([]);
  const [records, setRecords] = useState<RevisionRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshQuestions = useCallback(() => {
    setQuestions(storage.getQuestions());
    setRecords(storage.getRevisionRecords());
  }, []);

  useEffect(() => {
    // Hydrate from localStorage asynchronously on mount
    const handleInit = () => {
      setQuestions(storage.getQuestions());
      setRecords(storage.getRevisionRecords());
      setIsLoaded(true);
    };

    queueMicrotask(handleInit);

    // Sync across tabs if user has multiple tabs open
    window.addEventListener('storage', refreshQuestions);
    return () => {
      window.removeEventListener('storage', refreshQuestions);
    };
  }, [refreshQuestions]);

  const recordsMap = useMemo(() => {
    const map = new Map<string, RevisionRecord>();
    for (const r of records) {
      map.set(`${r.questionId}_${r.interval}`, r);
    }
    return map;
  }, [records]);

  const handleAdd = useCallback(
    (name: string, dateSolved: string, status?: QuestionStatus) => {
      const q = storage.addQuestion(name, dateSolved, status);
      refreshQuestions();
      return q;
    },
    [refreshQuestions]
  );

  const handleUpdate = useCallback(
    (
      id: string,
      updates: Partial<Pick<DSAQuestion, 'questionName' | 'dateSolved' | 'status'>>
    ) => {
      const q = storage.updateQuestion(id, updates);
      refreshQuestions();
      return q;
    },
    [refreshQuestions]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const result = storage.deleteQuestion(id);
      refreshQuestions();
      return result;
    },
    [refreshQuestions]
  );

  const handleMarkRevision = useCallback(
    (questionId: string, interval: RevisionInterval, completed: boolean = true) => {
      storage.markRevisionCompleted(questionId, interval, completed);
      refreshQuestions();
    },
    [refreshQuestions]
  );

  return (
    <QuestionsContext.Provider
      value={{
        questions,
        records,
        recordsMap,
        isLoaded,
        addQuestion: handleAdd,
        updateQuestion: handleUpdate,
        deleteQuestion: handleDelete,
        markRevision: handleMarkRevision,
        refreshQuestions,
      }}
    >
      {children}
    </QuestionsContext.Provider>
  );
}

export function useQuestions(): QuestionsContextValue {
  const ctx = useContext(QuestionsContext);
  if (!ctx) {
    throw new Error('useQuestions must be used within a QuestionsProvider');
  }
  return ctx;
}
