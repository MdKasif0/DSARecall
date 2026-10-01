'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { DSAQuestion, QuestionStatus } from '@/lib/types';
import * as storage from '@/lib/storage';

interface QuestionsContextValue {
  questions: DSAQuestion[];
  isLoaded: boolean;
  addQuestion: (name: string, dateSolved: string, status?: QuestionStatus) => DSAQuestion;
  updateQuestion: (id: string, updates: Partial<Pick<DSAQuestion, 'questionName' | 'dateSolved' | 'status'>>) => DSAQuestion | null;
  deleteQuestion: (id: string) => boolean;
  refreshQuestions: () => void;
}

const QuestionsContext = createContext<QuestionsContextValue | null>(null);

export function QuestionsProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<DSAQuestion[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshQuestions = useCallback(() => {
    setQuestions(storage.getQuestions());
  }, []);

  useEffect(() => {
    refreshQuestions();
    setIsLoaded(true);
  }, [refreshQuestions]);

  const handleAdd = useCallback(
    (name: string, dateSolved: string, status?: QuestionStatus) => {
      const q = storage.addQuestion(name, dateSolved, status);
      refreshQuestions();
      return q;
    },
    [refreshQuestions]
  );

  const handleUpdate = useCallback(
    (id: string, updates: Partial<Pick<DSAQuestion, 'questionName' | 'dateSolved' | 'status'>>) => {
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

  return (
    <QuestionsContext.Provider
      value={{
        questions,
        isLoaded,
        addQuestion: handleAdd,
        updateQuestion: handleUpdate,
        deleteQuestion: handleDelete,
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
