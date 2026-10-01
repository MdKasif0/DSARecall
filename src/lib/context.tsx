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
import { toast } from '@/lib/toast';

interface QuestionsContextValue {
  questions: DSAQuestion[];
  records: RevisionRecord[];
  recordsMap: Map<string, RevisionRecord>;
  isLoaded: boolean;
  addQuestion: (
    name: string,
    dateSolved: string,
    status?: QuestionStatus,
    topic?: string,
    difficulty?: import('@/lib/types').QuestionDifficulty,
    priority?: import('@/lib/types').QuestionPriority
  ) => DSAQuestion;
  updateQuestion: (
    id: string,
    updates: Partial<Pick<DSAQuestion, 'questionName' | 'dateSolved' | 'status' | 'topic' | 'difficulty' | 'priority'>>
  ) => DSAQuestion | null;
  deleteQuestion: (id: string) => boolean;
  markRevision: (questionId: string, interval: RevisionInterval, completed?: boolean) => void;
  importData: (
    data: unknown,
    overwriteExisting?: boolean
  ) => { success: boolean; error?: string; count?: number };
  loadSampleData: () => void;
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
    (
      name: string,
      dateSolved: string,
      status?: QuestionStatus,
      topic?: string,
      difficulty?: import('@/lib/types').QuestionDifficulty,
      priority?: import('@/lib/types').QuestionPriority
    ) => {
      const q = storage.addQuestion(name, dateSolved, status, topic, difficulty, priority);
      refreshQuestions();
      toast.success(`Added "${q.questionName}"`);
      return q;
    },
    [refreshQuestions]
  );

  const handleUpdate = useCallback(
    (
      id: string,
      updates: Partial<Pick<DSAQuestion, 'questionName' | 'dateSolved' | 'status' | 'topic' | 'difficulty' | 'priority'>>
    ) => {
      const q = storage.updateQuestion(id, updates);
      refreshQuestions();
      if (q) {
        toast.success(`Updated "${q.questionName}"`);
      }
      return q;
    },
    [refreshQuestions]
  );

  const handleDelete = useCallback(
    (id: string) => {
      const q = questions.find((item) => item.id === id);
      const name = q ? q.questionName : 'Question';
      const result = storage.deleteQuestion(id);
      refreshQuestions();
      if (result) {
        toast.info(`Deleted "${name}"`);
      }
      return result;
    },
    [questions, refreshQuestions]
  );

  const handleMarkRevision = useCallback(
    (questionId: string, interval: RevisionInterval, completed: boolean = true) => {
      const { question } = storage.markRevisionCompleted(questionId, interval, completed);
      refreshQuestions();
      if (question) {
        if (completed) {
          toast.success(`Marked +${interval}d revision completed for "${question.questionName}"`);
        } else {
          toast.info(`Unmarked revision for "${question.questionName}"`);
        }
      }
    },
    [refreshQuestions]
  );

  const handleImport = useCallback(
    (data: unknown, overwriteExisting: boolean = false) => {
      const res = storage.importDataJSON(data, overwriteExisting);
      if (res.success) {
        refreshQuestions();
        toast.success(`Successfully imported ${res.count} questions!`);
      } else {
        toast.error(res.error || 'Import failed');
      }
      return res;
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
        importData: handleImport,
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
