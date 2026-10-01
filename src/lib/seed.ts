import { format, subDays } from 'date-fns';
import type { DSAQuestion, RevisionRecord } from './types';
import { calculateRevisionDates, generateId, getTodayISO, parseLocalDate } from './dates';

interface SeedData {
  questions: DSAQuestion[];
  records: RevisionRecord[];
}

/**
 * Generate rich, realistic DSA sample questions and spaced revision history
 * that dynamically centers on today's calendar date.
 */
export function generateSeedData(): SeedData {
  const todayISO = getTodayISO();
  const todayDate = parseLocalDate(todayISO);

  // Helper to get formatted ISO date string N days before today
  const daysAgo = (n: number): string => {
    return format(subDays(todayDate, n), 'yyyy-MM-dd');
  };

  // Helper to generate ISO datetime string for completedAt
  const timeDaysAgo = (n: number, hour = 10, min = 30): string => {
    const d = subDays(todayDate, n);
    d.setHours(hour, min, 0, 0);
    return d.toISOString();
  };

  // 18 Curated DSA Problems across all core topics and difficulties
  const seedQuestionsMeta: Array<{
    name: string;
    topic: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    priority: 'High' | 'Medium' | 'Low';
    daysAgoSolved: number;
    completedIntervals: number[]; // which intervals are already completed: 3, 7, 15, 30, 60, 120
  }> = [
    {
      name: 'Binary Search',
      topic: 'Binary Search',
      difficulty: 'Easy',
      priority: 'High',
      daysAgoSolved: 7, // solved 7 days ago -> +7d is DUE TODAY! +3d is completed
      completedIntervals: [3],
    },
    {
      name: 'Two Sum',
      topic: 'Arrays',
      difficulty: 'Easy',
      priority: 'High',
      daysAgoSolved: 125, // All 6 completed!
      completedIntervals: [3, 7, 15, 30, 60, 120],
    },
    {
      name: 'LRU Cache',
      topic: 'Linked List',
      difficulty: 'Medium',
      priority: 'High',
      daysAgoSolved: 32, // +3d, +7d, +15d, +30d completed
      completedIntervals: [3, 7, 15, 30],
    },
    {
      name: 'Trapping Rain Water',
      topic: 'Two Pointers',
      difficulty: 'Hard',
      priority: 'High',
      daysAgoSolved: 17, // +3d, +7d done, +15d is 2 days overdue!
      completedIntervals: [3, 7],
    },
    {
      name: 'Number of Islands',
      topic: 'Graphs',
      difficulty: 'Medium',
      priority: 'High',
      daysAgoSolved: 3, // +3d is DUE TODAY!
      completedIntervals: [],
    },
    {
      name: 'Longest Palindromic Substring',
      topic: 'Dynamic Programming',
      difficulty: 'Medium',
      priority: 'High',
      daysAgoSolved: 9, // +3d, +7d completed
      completedIntervals: [3, 7],
    },
    {
      name: 'Valid Parentheses',
      topic: 'Stack / Queue',
      difficulty: 'Easy',
      priority: 'Medium',
      daysAgoSolved: 130, // All 6 completed!
      completedIntervals: [3, 7, 15, 30, 60, 120],
    },
    {
      name: 'Merge k Sorted Lists',
      topic: 'Heap / Priority Queue',
      difficulty: 'Hard',
      priority: 'High',
      daysAgoSolved: 20, // +3d, +7d, +15d completed, +30d upcoming
      completedIntervals: [3, 7, 15],
    },
    {
      name: 'Lowest Common Ancestor',
      topic: 'Trees',
      difficulty: 'Medium',
      priority: 'Medium',
      daysAgoSolved: 5, // +3d done, +7d in 2 days
      completedIntervals: [3],
    },
    {
      name: 'Coin Change',
      topic: 'Dynamic Programming',
      difficulty: 'Medium',
      priority: 'High',
      daysAgoSolved: 35, // +3d, +7d, +15d, +30d completed
      completedIntervals: [3, 7, 15, 30],
    },
    {
      name: 'Subarray Sum Equals K',
      topic: 'Arrays',
      difficulty: 'Medium',
      priority: 'Medium',
      daysAgoSolved: 2, // +3d tomorrow!
      completedIntervals: [],
    },
    {
      name: 'Course Schedule',
      topic: 'Graphs',
      difficulty: 'Medium',
      priority: 'High',
      daysAgoSolved: 10, // +3d, +7d done, +15d in 5 days
      completedIntervals: [3, 7],
    },
    {
      name: 'Kth Largest Element in an Array',
      topic: 'Heap / Priority Queue',
      difficulty: 'Medium',
      priority: 'Medium',
      daysAgoSolved: 65, // +3d, +7d, +15d, +30d, +60d completed
      completedIntervals: [3, 7, 15, 30, 60],
    },
    {
      name: 'Word Break',
      topic: 'Dynamic Programming',
      difficulty: 'Medium',
      priority: 'High',
      daysAgoSolved: 14, // +3d, +7d done, +15d tomorrow!
      completedIntervals: [3, 7],
    },
    {
      name: 'Implement Trie (Prefix Tree)',
      topic: 'Trees',
      difficulty: 'Medium',
      priority: 'Low',
      daysAgoSolved: 42, // +3d, +7d, +15d, +30d completed
      completedIntervals: [3, 7, 15, 30],
    },
    {
      name: 'Search in Rotated Sorted Array',
      topic: 'Binary Search',
      difficulty: 'Medium',
      priority: 'High',
      daysAgoSolved: 1, // +3d in 2 days
      completedIntervals: [],
    },
    {
      name: 'Median of Two Sorted Arrays',
      topic: 'Binary Search',
      difficulty: 'Hard',
      priority: 'Medium',
      daysAgoSolved: 22, // +3d, +7d, +15d completed
      completedIntervals: [3, 7, 15],
    },
    {
      name: 'Climbing Stairs',
      topic: 'Dynamic Programming',
      difficulty: 'Easy',
      priority: 'Low',
      daysAgoSolved: 140, // All 6 completed!
      completedIntervals: [3, 7, 15, 30, 60, 120],
    },
  ];

  const questions: DSAQuestion[] = [];
  const records: RevisionRecord[] = [];

  // Generate question records
  seedQuestionsMeta.forEach((meta, idx) => {
    const qId = `q_seed_${idx + 1}`;
    const dateSolved = daysAgo(meta.daysAgoSolved);
    const revDates = calculateRevisionDates(dateSolved);

    let status: DSAQuestion['status'] = 'Pending';
    if (meta.completedIntervals.length === 6) {
      status = 'Completed';
    } else if (meta.completedIntervals.length > 0) {
      status = 'In Progress';
    }

    const question: DSAQuestion = {
      id: qId,
      questionName: meta.name,
      topic: meta.topic,
      difficulty: meta.difficulty,
      priority: meta.priority,
      dateSolved,
      ...revDates,
      status,
      createdAt: timeDaysAgo(meta.daysAgoSolved, 9, 0),
      updatedAt: timeDaysAgo(0, 11, 0),
    };

    questions.push(question);

    // Create records for the question's checkpoints
    const intervals = [3, 7, 15, 30, 60, 120] as const;
    intervals.forEach((interval) => {
      const isCompleted = meta.completedIntervals.includes(interval);
      const scheduledDate = revDates[`revision${interval}` as keyof typeof revDates];

      // Estimated completion time if done
      let completedAt: string | null = null;
      if (isCompleted) {
        // checkpoint was completed around scheduled date or slightly earlier
        const compDaysAgo = Math.max(0, meta.daysAgoSolved - interval);
        completedAt = timeDaysAgo(compDaysAgo, 14, 15);
      }

      records.push({
        id: generateId(),
        questionId: qId,
        interval,
        scheduledDate,
        completed: isCompleted,
        completedAt,
      });
    });
  });

  // 2. Generate Historical Revision Activity for Heatmap & 30-Day Activity Chart
  // We populate extra revision activity across the past 12 months to match the screenshot:
  // - 12 days current streak (daysAgo 0 to 11 has revisions every single day)
  // - 27 days longest streak (earlier in the year, e.g. daysAgo 60 to 86)
  // - Total revisions: 184
  // - Active days: 38

  // Activity distribution for last 30 days (daysAgo 0 to 29):
  // Peak at 7 days ago (Sep 24) with 12 revisions!
  const last30DaysDistribution: Record<number, number> = {
    0: 2,   // Today
    1: 3,   // 1 day ago
    2: 1,   // 2 days ago
    3: 4,   // 3 days ago
    4: 2,   // 4 days ago
    5: 3,   // 5 days ago
    6: 5,   // 6 days ago
    7: 12,  // 7 days ago (peak!)
    8: 8,   // 8 days ago
    9: 5,   // 9 days ago
    10: 4,  // 10 days ago
    11: 3,  // 11 days ago (completes 12-day streak!)
    14: 6,
    17: 4,
    19: 3,
    21: 7,
    24: 5,
    26: 2,
    28: 4,
  };

  // Populate historical records for the last 30 days
  Object.entries(last30DaysDistribution).forEach(([daysAgoStr, count]) => {
    const dAgo = parseInt(daysAgoStr, 10);
    for (let c = 0; c < count; c++) {
      records.push({
        id: generateId(),
        questionId: questions[c % questions.length].id,
        interval: 3,
        scheduledDate: daysAgo(dAgo),
        completed: true,
        completedAt: timeDaysAgo(dAgo, 9 + (c % 8), 10 + c * 3),
      });
    }
  });

  // Populate older activity to achieve 27-day longest streak (e.g. daysAgo 60 to 86)
  for (let d = 60; d <= 86; d++) {
    const count = 1 + (d % 4); // 1 to 4 revisions each day
    for (let c = 0; c < count; c++) {
      records.push({
        id: generateId(),
        questionId: questions[(d + c) % questions.length].id,
        interval: 7,
        scheduledDate: daysAgo(d),
        completed: true,
        completedAt: timeDaysAgo(d, 10 + (c % 6), 20),
      });
    }
  }

  // Populate a few scattered historical study sessions earlier in the year (e.g. 110, 140, 180, 220 days ago)
  const olderActiveDays = [110, 115, 140, 145, 180, 185, 210, 240, 280, 310];
  olderActiveDays.forEach((dAgo) => {
    const count = 2 + (dAgo % 3);
    for (let c = 0; c < count; c++) {
      records.push({
        id: generateId(),
        questionId: questions[c % questions.length].id,
        interval: 15,
        scheduledDate: daysAgo(dAgo),
        completed: true,
        completedAt: timeDaysAgo(dAgo, 11, 45),
      });
    }
  });

  return { questions, records };
}
