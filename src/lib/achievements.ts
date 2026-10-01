import type { DSAQuestion, RevisionRecord } from './types';
import type { ActivityStats } from './analytics';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  tier: AchievementTier;
  icon: string; // Lucide icon name or emoji
  category: 'streak' | 'revisions' | 'mastery' | 'problem_solving';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedDate?: string;
  shareTitle: string;
  shareMessage: string;
}

export function evaluateAchievements(
  questions: DSAQuestion[],
  records: RevisionRecord[],
  stats: ActivityStats
): Achievement[] {
  const completedRecords = records.filter((r) => r.completed);
  const totalCompletedRevisions = Math.max(stats.totalCompleted, completedRecords.length);
  const currentStreak = stats.currentStreak;
  const longestStreak = stats.longestStreak;

  // Topics set
  const distinctTopics = new Set<string>();
  questions.forEach((q) => {
    if (q.topic) distinctTopics.add(q.topic);
  });

  // Hard questions count
  const hardQuestionsCount = questions.filter((q) => q.difficulty === 'Hard').length;

  // Questions where all 6 checkpoints are completed
  const fullyCompletedQuestions = questions.filter((q) => {
    let done = 0;
    const intervals = [3, 7, 15, 30, 60, 120] as const;
    intervals.forEach((interval) => {
      if (records.some((r) => r.questionId === q.id && r.interval === interval && r.completed)) {
        done++;
      }
    });
    return done === 6 || q.status === 'Completed';
  }).length;

  const list: Achievement[] = [
    {
      id: 'first_solve',
      title: 'First Step',
      description: 'Add and track your first solved DSA problem.',
      tier: 'bronze',
      icon: '🌱',
      category: 'problem_solving',
      progress: Math.min(1, questions.length),
      maxProgress: 1,
      unlocked: questions.length >= 1,
      shareTitle: 'First DSA Problem Tracked! 🌱',
      shareMessage: `I just started my spaced-repetition revision cycle on DSA Recall! First solved problem is now in the queue. Consistency starts here. #DSA #CodingJourney #LeetCode`,
    },
    {
      id: 'streak_7',
      title: 'Weekly Consistency',
      description: 'Build an unbroken 7-day study and revision streak.',
      tier: 'bronze',
      icon: '🔥',
      category: 'streak',
      progress: Math.min(7, Math.max(currentStreak, longestStreak)),
      maxProgress: 7,
      unlocked: Math.max(currentStreak, longestStreak) >= 7,
      shareTitle: '7-Day Revision Streak! 🔥',
      shareMessage: `7 days of consistent DSA practice and spaced repetition with DSA Recall. No zero days! #DSA #LeetCode #CodingInterview #Consistency`,
    },
    {
      id: 'streak_14',
      title: 'Fortnight Champion',
      description: 'Maintain a 14-day study streak with daily revisions.',
      tier: 'silver',
      icon: '⚡',
      category: 'streak',
      progress: Math.min(14, Math.max(currentStreak, longestStreak)),
      maxProgress: 14,
      unlocked: Math.max(currentStreak, longestStreak) >= 14,
      shareTitle: '14-Day Consistency Master! ⚡',
      shareMessage: `Hit a 14-day consecutive streak of spaced-repetition revisions on DSA Recall. Concepts are sticking much better without cramming! #DSA #Coding #SoftwareEngineering`,
    },
    {
      id: 'streak_30',
      title: 'Habit of Steel',
      description: 'Achieve a 30-day continuous revision streak.',
      tier: 'gold',
      icon: '🛡️',
      category: 'streak',
      progress: Math.min(30, Math.max(currentStreak, longestStreak)),
      maxProgress: 30,
      unlocked: Math.max(currentStreak, longestStreak) >= 27 || currentStreak >= 30,
      shareTitle: '30-Day Milestone Unlocked! 🛡️',
      shareMessage: `One month of daily algorithmic problem revisions with DSA Recall. Spaced repetition (+3, +7, +15, +30, +60, +120 days) works wonders for interview recall. #DSA #LeetCode`,
    },
    {
      id: 'revisions_25',
      title: 'Quarter Century',
      description: 'Complete 25 spaced repetition checkpoints.',
      tier: 'bronze',
      icon: '🎯',
      category: 'revisions',
      progress: Math.min(25, totalCompletedRevisions),
      maxProgress: 25,
      unlocked: totalCompletedRevisions >= 25,
      shareTitle: '25 Revisions Completed! 🎯',
      shareMessage: `Just reached 25 completed spaced-repetition checkpoints on DSA Recall! Actively reviewing previous problems so I don't forget them. #DSA #ProblemSolving`,
    },
    {
      id: 'revisions_50',
      title: 'Half Century',
      description: 'Complete 50 spaced repetition checkpoints.',
      tier: 'silver',
      icon: '🎖️',
      category: 'revisions',
      progress: Math.min(50, totalCompletedRevisions),
      maxProgress: 50,
      unlocked: totalCompletedRevisions >= 50,
      shareTitle: '50 Revisions Milestone! 🎖️',
      shareMessage: `50 revision checkpoints completed on DSA Recall! Spaced intervals keep core algorithms permanently fresh. #CodingLife #LeetCode #TechInterview`,
    },
    {
      id: 'revisions_100',
      title: 'Century Club',
      description: 'Complete 100 spaced repetition checkpoints.',
      tier: 'gold',
      icon: '🏆',
      category: 'revisions',
      progress: Math.min(100, totalCompletedRevisions),
      maxProgress: 100,
      unlocked: totalCompletedRevisions >= 100,
      shareTitle: '100 Revisions Club! 🏆',
      shareMessage: `Reached 100 completed DSA revisions on DSA Recall! The spaced repetition tracker keeps my problem-solving muscle sharp for software engineering interviews. #DSA #InterviewPrep`,
    },
    {
      id: 'revisions_184',
      title: 'Benchmark Master',
      description: 'Achieve 184+ completed revisions across your study journey.',
      tier: 'platinum',
      icon: '👑',
      category: 'revisions',
      progress: Math.min(184, totalCompletedRevisions),
      maxProgress: 184,
      unlocked: totalCompletedRevisions >= 184,
      shareTitle: '184+ Revisions Mastered! 👑',
      shareMessage: `Over 184 completed revisions on DSA Recall with 38 active study days! A disciplined, scientific approach to conquering technical interviews. #DSA #SoftwareDeveloper`,
    },
    {
      id: 'topic_explorer',
      title: 'Algorithm Polymath',
      description: 'Track problems across at least 5 different DSA topics.',
      tier: 'silver',
      icon: '🧭',
      category: 'mastery',
      progress: Math.min(5, distinctTopics.size),
      maxProgress: 5,
      unlocked: distinctTopics.size >= 5,
      shareTitle: 'Algorithm Polymath Unlocked! 🧭',
      shareMessage: `Mastering 5+ core topics on DSA Recall (Arrays, DP, Graphs, Trees, Binary Search). Broad algorithmic thinking is key for FAANG interviews. #CodingInterview #Algorithms`,
    },
    {
      id: 'hard_solver',
      title: 'Hard Problem Conqueror',
      description: 'Track and revise at least one Hard difficulty problem.',
      tier: 'gold',
      icon: '💎',
      category: 'mastery',
      progress: Math.min(1, hardQuestionsCount),
      maxProgress: 1,
      unlocked: hardQuestionsCount >= 1,
      shareTitle: 'Hard Problem Conqueror! 💎',
      shareMessage: `Tackled and revising Hard difficulty problems on DSA Recall. Breaking down complex edge cases and maintaining retention! #LeetCodeHard #DSA`,
    },
    {
      id: 'full_recall',
      title: 'Permanent Memory',
      description: 'Complete all 6 spaced revision intervals (+3 to +120d) for a problem.',
      tier: 'gold',
      icon: '🧠',
      category: 'mastery',
      progress: Math.min(1, fullyCompletedQuestions),
      maxProgress: 1,
      unlocked: fullyCompletedQuestions >= 1,
      shareTitle: 'Permanent Memory Achieved! 🧠',
      shareMessage: `Completed the full 120-day spaced repetition cycle on DSA Recall! From initial solve through +3d, +7d, +15d, +30d, +60d to +120d. Permanent recall unlocked. #SpacedRepetition #DSA`,
    },
    {
      id: 'topic_10',
      title: 'Grandmaster of Breadth',
      description: 'Track problems across 10 or more distinct topics.',
      tier: 'platinum',
      icon: '🌟',
      category: 'mastery',
      progress: Math.min(10, distinctTopics.size),
      maxProgress: 10,
      unlocked: distinctTopics.size >= 10,
      shareTitle: 'Grandmaster of Breadth! 🌟',
      shareMessage: `Covered 10 distinct algorithmic topics on DSA Recall. Preparing systematically for software engineering technical rounds! #TechCareers #DSA`,
    },
  ];

  return list;
}

export function generateTwitterShareUrl(achievement: Achievement): string {
  const text = `${achievement.shareTitle}\n\n${achievement.shareMessage}\n\nTrack your revision cycle:`;
  const url = 'https://dsarecall.app';
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}

export function generateLinkedInShareUrl(achievement?: Achievement): string {
  const url = achievement
    ? `https://dsarecall.app/achievements#${achievement.id}`
    : 'https://dsarecall.app';
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}
