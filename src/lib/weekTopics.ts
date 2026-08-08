// CBB Weekly Coding League 2026-27 — Week-wise Topic Schedule
// Each contest maps 1:1 to a week. Contest N = Week N topic.

export interface WeekBlock {
  week: number;            // 1, 2, 3, …
  topic: string;           // "Arrays, Prefix Sum"
  icon: string;            // emoji
  focusAreas: string[];
  color: string;           // tailwind text color class
}

// ── Topic map: Week N → topic info ─────────────────────────────────────────
// Week 1 → Arrays, Prefix Sum
// Week 2 → Arrays, Prefix Sum  (same topic block)
// Week 3 → Strings, HashMap & HashSet
// Week 4 → Strings, HashMap & HashSet
// Week 5 → Two Pointers, Sliding Window
// Week 6 → Two Pointers, Sliding Window
// Week 7+ → Combination / Mixed (builds on all prior)
// Follows user spec exactly.

export const WEEK_TOPIC_MAP: WeekBlock[] = [
  // ── Week 1: Arrays, Prefix Sum ────────────────────────────────────────────
  {
    week: 1,
    topic: 'Arrays, Prefix Sum',
    icon: '🔢',
    focusAreas: ['Arrays', '2D Arrays', 'Prefix Sum', 'Difference Array'],
    color: 'text-blue-400',
  },

  // ── Week 2: Strings, HashMap & HashSet ───────────────────────────────────
  {
    week: 2,
    topic: 'Strings, HashMap & HashSet',
    icon: '🔤',
    focusAreas: ['String Manipulation', 'HashMap', 'HashSet', 'Hashing Techniques'],
    color: 'text-green-400',
  },

  // ── Week 3: Arrays, Prefix Sum (Round 2) ─────────────────────────────────
  {
    week: 3,
    topic: 'Arrays, Prefix Sum',
    icon: '🔢',
    focusAreas: ['Arrays', '2D Arrays', 'Prefix Sum', 'Difference Array'],
    color: 'text-blue-400',
  },

  // ── Week 4: Strings, HashMap & HashSet (Round 2) ─────────────────────────
  {
    week: 4,
    topic: 'Strings, HashMap & HashSet',
    icon: '🔤',
    focusAreas: ['String Manipulation', 'HashMap', 'HashSet', 'Hashing Techniques'],
    color: 'text-green-400',
  },

  // ── Week 5: BONUS ROUND — Combination of Arrays + Strings (Weeks 1–4) ───
  {
    week: 5,
    topic: '⭐ BONUS ROUND: Arrays + Strings',
    icon: '🎁',
    focusAreas: ['Arrays', 'Prefix Sum', 'Strings', 'HashMap', 'HashSet', 'Combination of Weeks 1–4'],
    color: 'text-gold',
  },

  // ── Weeks 6–7: Two Pointers, Sliding Window ───────────────────────────────
  {
    week: 6,
    topic: 'Two Pointers, Sliding Window',
    icon: '↔️',
    focusAreas: ['Two Pointer Techniques', 'Fixed Window', 'Variable Window', 'Sliding Window Patterns'],
    color: 'text-cyan-400',
  },
  {
    week: 7,
    topic: 'Two Pointers, Sliding Window',
    icon: '↔️',
    focusAreas: ['Two Pointer Techniques', 'Fixed Window', 'Variable Window', 'Sliding Window Patterns'],
    color: 'text-cyan-400',
  },

  // ── Week 8: Combination of ALL (Weeks 1–7) ────────────────────────────────
  {
    week: 8,
    topic: '⭐ Combination: Arrays + Strings + Two Pointers',
    icon: '🔀',
    focusAreas: ['Arrays', 'Prefix Sum', 'Strings', 'HashMap', 'Two Pointers', 'Sliding Window', 'Combination of Weeks 1–7'],
    color: 'text-violet-400',
  },

  // ── Block 5: Stack & Queue (Weeks 9–10) ──────────────────────────────────
  {
    week: 9,
    topic: 'Stack & Monotonic Stack, Queue & Deque',
    icon: '📚',
    focusAreas: ['Stack', 'Monotonic Stack', 'Queue', 'Deque'],
    color: 'text-orange-400',
  },
  {
    week: 10,
    topic: 'Stack & Monotonic Stack, Queue & Deque',
    icon: '📚',
    focusAreas: ['Stack', 'Monotonic Stack', 'Queue', 'Deque'],
    color: 'text-orange-400',
  },

  // ── Block 6: Linked Lists (Weeks 11–12) ──────────────────────────────────
  {
    week: 11,
    topic: 'Linked Lists, Two Pointers',
    icon: '🔗',
    focusAreas: ['Singly / Doubly Linked Lists', 'Fast & Slow Pointers', 'Two Pointer on Linked List'],
    color: 'text-purple-400',
  },
  {
    week: 12,
    topic: 'Linked Lists, Two Pointers',
    icon: '🔗',
    focusAreas: ['Singly / Doubly Linked Lists', 'Fast & Slow Pointers', 'Two Pointer on Linked List'],
    color: 'text-purple-400',
  },

  // ── Block 7: Binary Search, Recursion, BST (Weeks 13–14) ─────────────────
  {
    week: 13,
    topic: 'Binary Search, Recursion, BST',
    icon: '🔍',
    focusAreas: ['Binary Search on Arrays', 'Binary Search on Answer', 'Recursion', 'BST Operations'],
    color: 'text-yellow-400',
  },
  {
    week: 14,
    topic: 'Binary Search, Recursion, BST',
    icon: '🔍',
    focusAreas: ['Binary Search on Arrays', 'Binary Search on Answer', 'Recursion', 'BST Operations'],
    color: 'text-yellow-400',
  },

  // ── Block 8: Heap, Greedy (Weeks 15–16) ──────────────────────────────────
  {
    week: 15,
    topic: 'Heap (Priority Queue), Greedy',
    icon: '⛰️',
    focusAreas: ['Heap Operations', 'Top-K Problems', 'Greedy Techniques'],
    color: 'text-red-400',
  },
  {
    week: 16,
    topic: 'Heap (Priority Queue), Greedy',
    icon: '⛰️',
    focusAreas: ['Heap Operations', 'Top-K Problems', 'Greedy Techniques'],
    color: 'text-red-400',
  },

  // ── Block 9: Trees, Backtracking (Weeks 17–18) ───────────────────────────
  {
    week: 17,
    topic: 'Trees (DFS/BFS), Backtracking',
    icon: '🌳',
    focusAreas: ['Tree Traversals (DFS/BFS)', 'Level Order', 'Backtracking Basics'],
    color: 'text-emerald-400',
  },
  {
    week: 18,
    topic: 'Trees (DFS/BFS), Backtracking',
    icon: '🌳',
    focusAreas: ['Tree Traversals (DFS/BFS)', 'Level Order', 'Backtracking Basics'],
    color: 'text-emerald-400',
  },

  // ── Block 10: Graphs, DSU (Weeks 19–20) ──────────────────────────────────
  {
    week: 19,
    topic: 'Graphs (BFS/DFS), Union Find (DSU)',
    icon: '🕸️',
    focusAreas: ['Graph Traversals', 'DSU', 'Connected Components', 'Shortest Path'],
    color: 'text-indigo-400',
  },
  {
    week: 20,
    topic: 'Graphs (BFS/DFS), Union Find (DSU)',
    icon: '🕸️',
    focusAreas: ['Graph Traversals', 'DSU', 'Connected Components', 'Shortest Path'],
    color: 'text-indigo-400',
  },

  // ── Block 11: Trie, Strings (Weeks 21–22) ────────────────────────────────
  {
    week: 21,
    topic: 'Trie, Advanced Strings',
    icon: '🌐',
    focusAreas: ['Trie Insert / Search', 'Advanced String Problems', 'Pattern Matching'],
    color: 'text-teal-400',
  },
  {
    week: 22,
    topic: 'Trie, Advanced Strings',
    icon: '🌐',
    focusAreas: ['Trie Insert / Search', 'Advanced String Problems', 'Pattern Matching'],
    color: 'text-teal-400',
  },

  // ── Block 12: Bit Manipulation, DP (Weeks 23–24) ─────────────────────────
  {
    week: 23,
    topic: 'Bit Manipulation, Dynamic Programming',
    icon: '⚡',
    focusAreas: ['Bitwise Operations', 'DP on 1D Structures', 'Memoization'],
    color: 'text-yellow-300',
  },
  {
    week: 24,
    topic: 'Bit Manipulation, Dynamic Programming',
    icon: '⚡',
    focusAreas: ['Bitwise Operations', 'DP on 1D Structures', 'Memoization'],
    color: 'text-yellow-300',
  },

  // ── Block 13: Advanced Backtracking, DP (Weeks 25–26) ────────────────────
  {
    week: 25,
    topic: 'Backtracking, Dynamic Programming',
    icon: '🔄',
    focusAreas: ['Advanced Backtracking', 'DP on 2D Structures', 'Subset / Permutation'],
    color: 'text-pink-400',
  },
  {
    week: 26,
    topic: 'Backtracking, Dynamic Programming',
    icon: '🔄',
    focusAreas: ['Advanced Backtracking', 'DP on 2D Structures', 'Subset / Permutation'],
    color: 'text-pink-400',
  },

  // ── Block 14: Greedy + DP (Weeks 27–28) ──────────────────────────────────
  {
    week: 27,
    topic: 'Greedy, Dynamic Programming',
    icon: '🎯',
    focusAreas: ['Advanced Greedy', 'DP Optimization', 'Interval Problems'],
    color: 'text-orange-300',
  },
  {
    week: 28,
    topic: 'Greedy, Dynamic Programming',
    icon: '🎯',
    focusAreas: ['Advanced Greedy', 'DP Optimization', 'Interval Problems'],
    color: 'text-orange-300',
  },
];

// ── Lookup helpers ──────────────────────────────────────────────────────────

/**
 * Get topic info for a specific week number.
 * Week N = Contest N in CWCL.
 * Returns null for weeks beyond the defined map (treated as challenge/mixed weeks).
 */
export function getTopicByWeek(weekNumber: number): WeekBlock | null {
  return WEEK_TOPIC_MAP.find(b => b.week === weekNumber) ?? null;
}

/**
 * Get topic info for a contest by its contest number (= week number in CWCL).
 */
export function getTopicByContestNumber(contestNumber: number): WeekBlock | null {
  return getTopicByWeek(contestNumber);
}

// ── Legacy date-based helpers (kept for backward compat) ───────────────────

export interface LegacyWeekBlock {
  weeks: string;
  weekStart: number;
  weekEnd: number;
  contests: string;
  topic: string;
  icon: string;
  focusAreas: string[];
  dateRange: string;
  startDate: Date;
  endDate: Date;
  color: string;
}

export const WEEK_TOPICS: LegacyWeekBlock[] = [
  {
    weeks: '1',    weekStart: 1,  weekEnd: 1,
    contests: '1',
    topic: 'Arrays, Prefix Sum',
    icon: '🔢',
    focusAreas: ['Arrays', '2D Arrays', 'Prefix Sum', 'Difference Array'],
    dateRange: 'Aug 1, 2026',
    startDate: new Date('2026-08-01'),
    endDate:   new Date('2026-08-07'),
    color: 'text-blue-400',
  },
  {
    weeks: '2',    weekStart: 2,  weekEnd: 2,
    contests: '2',
    topic: 'Strings, HashMap & HashSet',
    icon: '🔤',
    focusAreas: ['String Manipulation', 'HashMap', 'HashSet', 'Hashing Techniques'],
    dateRange: 'Aug 8, 2026',
    startDate: new Date('2026-08-08'),
    endDate:   new Date('2026-08-14'),
    color: 'text-green-400',
  },
  {
    weeks: '3',    weekStart: 3,  weekEnd: 3,
    contests: '3',
    topic: 'Arrays, Prefix Sum',
    icon: '🔢',
    focusAreas: ['Arrays', '2D Arrays', 'Prefix Sum', 'Difference Array'],
    dateRange: 'Aug 15, 2026',
    startDate: new Date('2026-08-15'),
    endDate:   new Date('2026-08-21'),
    color: 'text-blue-400',
  },
  {
    weeks: '4',    weekStart: 4,  weekEnd: 4,
    contests: '4',
    topic: 'Strings, HashMap & HashSet',
    icon: '🔤',
    focusAreas: ['String Manipulation', 'HashMap', 'HashSet', 'Hashing Techniques'],
    dateRange: 'Aug 22, 2026',
    startDate: new Date('2026-08-22'),
    endDate:   new Date('2026-08-28'),
    color: 'text-green-400',
  },
  {
    weeks: '5',    weekStart: 5,  weekEnd: 5,
    contests: '5',
    topic: '⭐ BONUS ROUND: Arrays + Strings',
    icon: '🎁',
    focusAreas: ['Arrays', 'Prefix Sum', 'Strings', 'HashMap', 'HashSet', 'Combination of Weeks 1–4'],
    dateRange: 'Aug 29, 2026',
    startDate: new Date('2026-08-29'),
    endDate:   new Date('2026-09-04'),
    color: 'text-gold',
  },
  {
    weeks: '6 – 7', weekStart: 6,  weekEnd: 7,
    contests: '6 – 7',
    topic: 'Two Pointers, Sliding Window',
    icon: '↔️',
    focusAreas: ['Two Pointer Techniques', 'Fixed Window', 'Variable Window', 'Sliding Window Patterns'],
    dateRange: 'Sep 5 – Sep 12, 2026',
    startDate: new Date('2026-09-05'),
    endDate:   new Date('2026-09-18'),
    color: 'text-cyan-400',
  },
  {
    weeks: '8',    weekStart: 8,  weekEnd: 8,
    contests: '8',
    topic: '⭐ Combination: Arrays + Strings + Two Pointers',
    icon: '🔀',
    focusAreas: ['Arrays', 'Prefix Sum', 'Strings', 'HashMap', 'Two Pointers', 'Sliding Window', 'Combination of Weeks 1–7'],
    dateRange: 'Sep 19, 2026',
    startDate: new Date('2026-09-19'),
    endDate:   new Date('2026-09-25'),
    color: 'text-violet-400',
  },
  {
    weeks: '9 – 10',  weekStart: 9,  weekEnd: 10,
    contests: '9 – 10',
    topic: 'Stack & Monotonic Stack, Queue & Deque',
    icon: '📚',
    focusAreas: ['Stack', 'Monotonic Stack', 'Queue', 'Deque'],
    dateRange: 'Sep 26 – Oct 3, 2026',
    startDate: new Date('2026-09-26'),
    endDate:   new Date('2026-10-03'),
    color: 'text-orange-400',
  },
  {
    weeks: '11 – 12', weekStart: 11, weekEnd: 12,
    contests: '11 – 12',
    topic: 'Linked Lists, Two Pointers',
    icon: '🔗',
    focusAreas: ['Singly / Doubly Linked Lists', 'Two Pointer on Linked List'],
    dateRange: 'Oct 10 – Oct 17, 2026',
    startDate: new Date('2026-10-10'),
    endDate:   new Date('2026-10-17'),
    color: 'text-purple-400',
  },
  {
    weeks: '13 – 14', weekStart: 13, weekEnd: 14,
    contests: '13 – 14',
    topic: 'Binary Search, Recursion, BST',
    icon: '🔍',
    focusAreas: ['Binary Search on Arrays', 'Recursion', 'BST Operations'],
    dateRange: 'Oct 24 – Oct 31, 2026',
    startDate: new Date('2026-10-24'),
    endDate:   new Date('2026-10-31'),
    color: 'text-yellow-400',
  },
  {
    weeks: '15 – 16', weekStart: 15, weekEnd: 16,
    contests: '15 – 16',
    topic: 'Heap (Priority Queue), Greedy',
    icon: '⛰️',
    focusAreas: ['Heap Operations', 'Greedy Techniques'],
    dateRange: 'Nov 7 – Nov 14, 2026',
    startDate: new Date('2026-11-07'),
    endDate:   new Date('2026-11-14'),
    color: 'text-red-400',
  },
  {
    weeks: '17 – 18', weekStart: 17, weekEnd: 18,
    contests: '17 – 18',
    topic: 'Trees (DFS/BFS), Backtracking',
    icon: '🌳',
    focusAreas: ['Tree Traversals', 'Backtracking Basics'],
    dateRange: 'Nov 21 – Nov 28, 2026',
    startDate: new Date('2026-11-21'),
    endDate:   new Date('2026-11-28'),
    color: 'text-emerald-400',
  },
  {
    weeks: '19 – 20', weekStart: 19, weekEnd: 20,
    contests: '19 – 20',
    topic: 'Graphs (BFS/DFS), Union Find (DSU)',
    icon: '🕸️',
    focusAreas: ['Graph Traversals', 'DSU', 'Connected Components'],
    dateRange: 'Dec 5 – Dec 12, 2026',
    startDate: new Date('2026-12-05'),
    endDate:   new Date('2026-12-12'),
    color: 'text-indigo-400',
  },
  {
    weeks: '21 – 22', weekStart: 21, weekEnd: 22,
    contests: '21 – 22',
    topic: 'Trie, Advanced Strings',
    icon: '🌐',
    focusAreas: ['Trie Operations', 'Advanced String Problems'],
    dateRange: 'Dec 19 – Dec 26, 2026',
    startDate: new Date('2026-12-19'),
    endDate:   new Date('2026-12-26'),
    color: 'text-teal-400',
  },
  {
    weeks: '23 – 24', weekStart: 23, weekEnd: 24,
    contests: '23 – 24',
    topic: 'Bit Manipulation, Dynamic Programming',
    icon: '⚡',
    focusAreas: ['Bitwise Operations', 'DP on 1D Structures'],
    dateRange: 'Jan 2 – Jan 9, 2027',
    startDate: new Date('2027-01-02'),
    endDate:   new Date('2027-01-09'),
    color: 'text-yellow-300',
  },
  {
    weeks: '25 – 26', weekStart: 25, weekEnd: 26,
    contests: '25 – 26',
    topic: 'Backtracking, Dynamic Programming',
    icon: '🔄',
    focusAreas: ['Advanced Backtracking', 'DP on 2D Structures'],
    dateRange: 'Jan 16 – Jan 23, 2027',
    startDate: new Date('2027-01-16'),
    endDate:   new Date('2027-01-23'),
    color: 'text-pink-400',
  },
  {
    weeks: '27 – 28', weekStart: 27, weekEnd: 28,
    contests: '27 – 28',
    topic: 'Greedy, Dynamic Programming',
    icon: '🎯',
    focusAreas: ['Advanced Greedy', 'DP Optimization'],
    dateRange: 'Jan 30 – Feb 6, 2027',
    startDate: new Date('2027-01-30'),
    endDate:   new Date('2027-02-06'),
    color: 'text-orange-300',
  },
  {
    weeks: '29 – 57', weekStart: 29, weekEnd: 57,
    contests: '29 – 57',
    topic: 'Revision, Mixed Topics & Challenge Weeks',
    icon: '🏆',
    focusAreas: ['Mixed Topic Contests', 'Bonus & Special Challenges'],
    dateRange: 'Feb 7 – Aug 7, 2027',
    startDate: new Date('2027-02-07'),
    endDate:   new Date('2027-08-07'),
    color: 'text-gold',
  },
];

/** Returns the block that is currently active (today falls within its date range). */
export function getCurrentWeekBlock(): LegacyWeekBlock | null {
  const today = new Date();
  return WEEK_TOPICS.find(b => today >= b.startDate && today <= b.endDate) ?? null;
}

/** Returns the next upcoming block after today. */
export function getNextWeekBlock(): LegacyWeekBlock | null {
  const today = new Date();
  return WEEK_TOPICS.find(b => b.startDate > today) ?? null;
}

/** Returns 'past' | 'current' | 'upcoming' for a block */
export function getBlockStatus(block: LegacyWeekBlock): 'past' | 'current' | 'upcoming' {
  const today = new Date();
  if (today > block.endDate) return 'past';
  if (today >= block.startDate && today <= block.endDate) return 'current';
  return 'upcoming';
}

/** Practice links per topic */
export const PRACTICE_LINKS: Record<string, { leetcode?: string; gfg?: string }> = {
  'Arrays, Prefix Sum':                                          { leetcode: 'https://leetcode.com/tag/array/',               gfg: 'https://www.geeksforgeeks.org/array-data-structure/' },
  'Strings, HashMap & HashSet':                                  { leetcode: 'https://leetcode.com/tag/hash-table/',          gfg: 'https://www.geeksforgeeks.org/hashing-data-structure/' },
  '⭐ BONUS ROUND: Arrays + Strings':                            { leetcode: 'https://leetcode.com/problemset/',              gfg: 'https://practice.geeksforgeeks.org/' },
  'Two Pointers, Sliding Window':                                { leetcode: 'https://leetcode.com/tag/two-pointers/',        gfg: 'https://www.geeksforgeeks.org/two-pointers-technique/' },
  '⭐ Combination: Arrays + Strings + Two Pointers':             { leetcode: 'https://leetcode.com/problemset/',              gfg: 'https://practice.geeksforgeeks.org/' },
  'Stack & Monotonic Stack, Queue & Deque':                      { leetcode: 'https://leetcode.com/tag/stack/',               gfg: 'https://www.geeksforgeeks.org/stack-data-structure/' },
  'Linked Lists, Two Pointers':                                  { leetcode: 'https://leetcode.com/tag/linked-list/',         gfg: 'https://www.geeksforgeeks.org/data-structures/linked-list/' },
  'Binary Search, Recursion, BST':                               { leetcode: 'https://leetcode.com/tag/binary-search/',       gfg: 'https://www.geeksforgeeks.org/binary-search/' },
  'Heap (Priority Queue), Greedy':                               { leetcode: 'https://leetcode.com/tag/heap-priority-queue/', gfg: 'https://www.geeksforgeeks.org/heap-data-structure/' },
  'Trees (DFS/BFS), Backtracking':                               { leetcode: 'https://leetcode.com/tag/tree/',                gfg: 'https://www.geeksforgeeks.org/binary-tree-data-structure/' },
  'Graphs (BFS/DFS), Union Find (DSU)':                          { leetcode: 'https://leetcode.com/tag/graph/',               gfg: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/' },
  'Trie, Advanced Strings':                                      { leetcode: 'https://leetcode.com/tag/trie/',                gfg: 'https://www.geeksforgeeks.org/trie-insert-and-search/' },
  'Bit Manipulation, Dynamic Programming':                       { leetcode: 'https://leetcode.com/tag/bit-manipulation/',    gfg: 'https://www.geeksforgeeks.org/bitwise-algorithms/' },
  'Backtracking, Dynamic Programming':                           { leetcode: 'https://leetcode.com/tag/dynamic-programming/', gfg: 'https://www.geeksforgeeks.org/dynamic-programming/' },
  'Greedy, Dynamic Programming':                                 { leetcode: 'https://leetcode.com/tag/greedy/',              gfg: 'https://www.geeksforgeeks.org/greedy-algorithms/' },
  'Revision, Mixed Topics & Challenge Weeks':                    { leetcode: 'https://leetcode.com/problemset/',              gfg: 'https://practice.geeksforgeeks.org/' },
};
