import type { QuestionStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: QuestionStatus;
}

const badgeClasses: Record<QuestionStatus, string> = {
  Pending: 'badge badge-pending',
  'In Progress': 'badge badge-in-progress',
  Completed: 'badge badge-completed',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={badgeClasses[status]}>{status}</span>;
}
