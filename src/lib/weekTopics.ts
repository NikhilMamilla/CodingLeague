// CBB Weekly Coding League 2026-27 — Official Week-wise Contest Schedule
// Each week = one contest. Week N = Contest N.
// Every 4th week is an OFFLINE MONTHLY GRAND TEST covering the prior 3 weeks.

export interface WeekBlock {
  week: number;
  topic: string;
  icon: string;
  focusAreas: string[];
  date: string;           // "August 1, 2026"
  mode: 'Online' | 'Offline';
  isGrandTest: boolean;   // true for the monthly offline grand test
  month: number;          // 1, 2, 3, 4 …
  color: string;
}

export const WEEK_TOPIC_MAP: WeekBlock[] = [

  // ══ MONTH 1 ══════════════════════════════════════════════════════════════

  {
    week: 1,
    topic: 'Arrays, Prefix Sum',
    icon: '🔢',
    focusAreas: ['Arrays', '2D Arrays', 'Prefix Sum', 'Difference Array'],
    date: 'August 1, 2026',
    mode: 'Online',
    isGrandTest: false,
    month: 1,
    color: 'text-blue-400',
  },
  {
    week: 2,
    topic: 'Strings, HashMap & HashSet',
    icon: '🔤',
    focusAreas: ['String Manipulation', 'Hashing Techniques'],
    date: 'August 8, 2026',
    mode: 'Online',
    isGrandTest: false,
    month: 1,
    color: 'text-green-400',
  },
  {
    week: 3,
    topic: 'Two Pointers, Sliding Window',
    icon: '↔️',
    focusAreas: ['Two Pointer Techniques', 'Sliding Window Patterns'],
    date: 'August 15, 2026',
    mode: 'Online',
    isGrandTest: false,
    month: 1,
    color: 'text-cyan-400',
  },
  {
    week: 4,
    topic: 'Monthly Grand Test — Weeks 1–3',
    icon: '🏟️',
    focusAreas: ['Arrays & Prefix Sum', 'Strings, HashMap & HashSet', 'Two Pointers & Sliding Window'],
    date: 'August 22, 2026',
    mode: 'Offline',
    isGrandTest: true,
    month: 1,
    color: 'text-gold',
  },

  // ══ MONTH 2 ══════════════════════════════════════════════════════════════

  {
    week: 5,
    topic: 'Stack & Monotonic Stack, Queue & Deque',
    icon: '📚',
    focusAreas: ['Stack', 'Monotonic Stack', 'Queue', 'Deque'],
    date: 'August 29, 2026',
    mode: 'Online',
    isGrandTest: false,
    month: 2,
    color: 'text-orange-400',
  },
  {
    week: 6,
    topic: 'Linked Lists, Two Pointers',
    icon: '🔗',
    focusAreas: ['Singly & Doubly Linked Lists', 'Two Pointer on Linked List'],
    date: 'September 5, 2026',
    mode: 'Online',
    isGrandTest: false,
    month: 2,
    color: 'text-purple-400',
  },
  {
    week: 7,
    topic: 'Binary Search, Recursion, BST',
    icon: '🔍',
    focusAreas: ['Binary Search on Arrays', 'Recursion', 'BST Operations'],
    date: 'September 12, 2026',
    mode: 'Online',
    isGrandTest: false,
    month: 2,
    color: 'text-yellow-400',
  },
  {
    week: 8,
    topic: 'Monthly Grand Test — Weeks 5–7',
    icon: '🏟️',
    focusAreas: ['Stack, Monotonic Stack, Queue & Deque', 'Linked Lists & Two Pointers', 'Binary Search, Recursion & BST'],
    date: 'September 19, 2026',
    mode: 'Offline',
    isGrandTest: true,
    month: 2,
    color: 'text-gold',
  },

  // ══ MONTH 3 ══════════════════════════════════════════════════════════════

  {
    week: 9,
    topic: 'Heap (Priority Queue), Greedy',
    icon: '⛰️',
    focusAreas: ['Heap Operations', 'Greedy Techniques'],
    date: 'September 26, 2026',
    mode: 'Online',
    isGrandTest: false,
    month: 3,
    color: 'text-red-400',
  },
  {
    week: 10,
    topic: 'Trees (DFS/BFS), Backtracking',
    icon: '🌳',
    focusAreas: ['Tree Traversals', 'Backtracking Basics'],
    date: 'October 3, 2026',
    mode: 'Online',
    isGrandTest: false,
    month: 3,
    color: 'text-emerald-400',
  },
  {
    week: 11,
    topic: 'Graphs (BFS/DFS), Union Find (DSU)',
    icon: '🕸️',
    focusAreas: ['Graph Traversals', 'DSU', 'Connected Components'],
    date: 'October 10, 2026',
    mode: 'Online',
    isGrandTest: false,
    month: 3,
    color: 'text-indigo-400',
  },
  {
    week: 12,
    topic: 'Monthly Grand Test — Weeks 9–11',
    icon: '🏟️',
    focusAreas: ['Heap & Greedy', 'Trees & Backtracking', 'Graphs & Union Find (DSU)'],
    date: 'October 17, 2026',
    mode: 'Offline',
    isGrandTest: true,
    month: 3,
    color: 'text-gold',
  },

  // ══ MONTH 4 ══════════════════════════════════════════════════════════════

  {
    week: 13,
    topic: 'Trie, Strings',
    icon: '🌐',
    focusAreas: ['Trie Operations', 'Advanced String Problems'],
    date: 'October 24, 2026',
    mode: 'Online',
    isGrandTest: false,
    month: 4,
    color: 'text-teal-400',
  },
  {
    week: 14,
    topic: 'Bit Manipulation, Dynamic Programming',
    icon: '⚡',
    focusAreas: ['Bitwise Operations', 'DP on 1D Structures'],
    date: 'October 31, 2026',
    mode: 'Online',
    isGrandTest: false,
    month: 4,
    color: 'text-yellow-300',
  },
  {
    week: 15,
    topic: 'Backtracking, Dynamic Programming',
    icon: '🔄',
    focusAreas: ['Advanced Backtracking', 'DP on 2D Structures'],
    date: 'November 7, 2026',
    mode: 'Online',
    isGrandTest: false,
    month: 4,
    color: 'text-pink-400',
  },
  {
    week: 16,
    topic: 'Monthly Grand Test — Weeks 13–15',
    icon: '🏟️',
    focusAreas: ['Trie & Advanced Strings', 'Bit Manipulation & DP', 'Backtracking & DP'],
    date: 'November 14, 2026',
    mode: 'Offline',
    isGrandTest: true,
    month: 4,
    color: 'text-gold',
  },
  {
    week: 17,
    topic: 'Greedy, Dynamic Programming',
    icon: '🎯',
    focusAreas: ['Advanced Greedy', 'DP Optimization'],
    date: 'November 21, 2026',
    mode: 'Online',
    isGrandTest: false,
    month: 4,
    color: 'text-orange-300',
  },

  // ══ WEEK 18+ — Revision & Mixed Topics (TBA) ═════════════════════════════
  // Announced separately; shown as a placeholder in the roadmap.
];

// ── Lookup helpers ──────────────────────────────────────────────────────────

/** Get topic info for a specific week / contest number. */
export function getTopicByWeek(weekNumber: number): WeekBlock | null {
  return WEEK_TOPIC_MAP.find(b => b.week === weekNumber) ?? null;
}

/** Month labels */
export const MONTH_LABELS: Record<number, string> = {
  1: 'Month 1 — August 2026',
  2: 'Month 2 — August / September 2026',
  3: 'Month 3 — September / October 2026',
  4: 'Month 4 — October / November 2026',
};

// ── Practice links per topic ────────────────────────────────────────────────
export const PRACTICE_LINKS: Record<string, { leetcode?: string; gfg?: string }> = {
  'Arrays, Prefix Sum':                        { leetcode: 'https://leetcode.com/tag/array/',               gfg: 'https://www.geeksforgeeks.org/array-data-structure/' },
  'Strings, HashMap & HashSet':                { leetcode: 'https://leetcode.com/tag/hash-table/',          gfg: 'https://www.geeksforgeeks.org/hashing-data-structure/' },
  'Two Pointers, Sliding Window':              { leetcode: 'https://leetcode.com/tag/two-pointers/',        gfg: 'https://www.geeksforgeeks.org/two-pointers-technique/' },
  'Stack & Monotonic Stack, Queue & Deque':    { leetcode: 'https://leetcode.com/tag/stack/',               gfg: 'https://www.geeksforgeeks.org/stack-data-structure/' },
  'Linked Lists, Two Pointers':                { leetcode: 'https://leetcode.com/tag/linked-list/',         gfg: 'https://www.geeksforgeeks.org/data-structures/linked-list/' },
  'Binary Search, Recursion, BST':             { leetcode: 'https://leetcode.com/tag/binary-search/',       gfg: 'https://www.geeksforgeeks.org/binary-search/' },
  'Heap (Priority Queue), Greedy':             { leetcode: 'https://leetcode.com/tag/heap-priority-queue/', gfg: 'https://www.geeksforgeeks.org/heap-data-structure/' },
  'Trees (DFS/BFS), Backtracking':             { leetcode: 'https://leetcode.com/tag/tree/',                gfg: 'https://www.geeksforgeeks.org/binary-tree-data-structure/' },
  'Graphs (BFS/DFS), Union Find (DSU)':        { leetcode: 'https://leetcode.com/tag/graph/',               gfg: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/' },
  'Trie, Strings':                             { leetcode: 'https://leetcode.com/tag/trie/',                gfg: 'https://www.geeksforgeeks.org/trie-insert-and-search/' },
  'Bit Manipulation, Dynamic Programming':     { leetcode: 'https://leetcode.com/tag/bit-manipulation/',    gfg: 'https://www.geeksforgeeks.org/bitwise-algorithms/' },
  'Backtracking, Dynamic Programming':         { leetcode: 'https://leetcode.com/tag/dynamic-programming/', gfg: 'https://www.geeksforgeeks.org/dynamic-programming/' },
  'Greedy, Dynamic Programming':               { leetcode: 'https://leetcode.com/tag/greedy/',              gfg: 'https://www.geeksforgeeks.org/greedy-algorithms/' },
  'Revision, Mixed Topics & Challenge Weeks':  { leetcode: 'https://leetcode.com/problemset/',              gfg: 'https://practice.geeksforgeeks.org/' },
};

// ── Legacy exports (kept so nothing else breaks) ────────────────────────────
export type LegacyWeekBlock = WeekBlock;
export const WEEK_TOPICS = WEEK_TOPIC_MAP;

export function getCurrentWeekBlock(): WeekBlock | null {
  return null; // replaced by contest-based lookup in Dashboard
}
export function getNextWeekBlock(): WeekBlock | null {
  return null;
}
export function getBlockStatus(_block: WeekBlock): 'past' | 'current' | 'upcoming' {
  return 'upcoming';
}
