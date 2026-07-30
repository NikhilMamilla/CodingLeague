// CBB Weekly Coding League 2026-27 — Week-wise Topic Schedule
// Auto-detects current week based on today's date.

export interface WeekBlock {
  weeks: string;           // "1 - 2"
  weekStart: number;       // 1
  weekEnd: number;         // 2
  contests: string;        // "1 - 2"
  topic: string;           // "Arrays, Prefix Sum"
  icon: string;            // emoji
  focusAreas: string[];
  dateRange: string;       // "Aug 1 – Aug 8, 2026"
  startDate: Date;
  endDate: Date;
  color: string;           // tailwind text color
}

export const WEEK_TOPICS: WeekBlock[] = [
  {
    weeks: '1 – 2',   weekStart: 1,  weekEnd: 2,
    contests: '1 – 2',
    topic: 'Arrays, Prefix Sum',
    icon: '🔢',
    focusAreas: ['Arrays', '2D Arrays', 'Prefix Sum', 'Difference Array'],
    dateRange: 'Aug 1 – Aug 8, 2026',
    startDate: new Date('2026-08-01'),
    endDate:   new Date('2026-08-08'),
    color: 'text-blue-400',
  },
  {
    weeks: '3 – 4',   weekStart: 3,  weekEnd: 4,
    contests: '3 – 4',
    topic: 'Strings, HashMap & HashSet',
    icon: '🔤',
    focusAreas: ['String Manipulation', 'Hashing Techniques'],
    dateRange: 'Aug 15 – Aug 22, 2026',
    startDate: new Date('2026-08-15'),
    endDate:   new Date('2026-08-22'),
    color: 'text-green-400',
  },
  {
    weeks: '5 – 6',   weekStart: 5,  weekEnd: 6,
    contests: '5 – 6',
    topic: 'Two Pointers, Sliding Window',
    icon: '↔️',
    focusAreas: ['Two Pointer Techniques', 'Sliding Window Patterns'],
    dateRange: 'Aug 29 – Sep 5, 2026',
    startDate: new Date('2026-08-29'),
    endDate:   new Date('2026-09-05'),
    color: 'text-cyan-400',
  },
  {
    weeks: '7 – 8',   weekStart: 7,  weekEnd: 8,
    contests: '7 – 8',
    topic: 'Stack & Monotonic Stack, Queue & Deque',
    icon: '📚',
    focusAreas: ['Stack', 'Monotonic Stack', 'Queue', 'Deque'],
    dateRange: 'Sep 12 – Sep 19, 2026',
    startDate: new Date('2026-09-12'),
    endDate:   new Date('2026-09-19'),
    color: 'text-orange-400',
  },
  {
    weeks: '9 – 10',  weekStart: 9,  weekEnd: 10,
    contests: '9 – 10',
    topic: 'Linked Lists, Two Pointers',
    icon: '🔗',
    focusAreas: ['Singly / Doubly Linked Lists', 'Two Pointer on Linked List'],
    dateRange: 'Sep 26 – Oct 3, 2026',
    startDate: new Date('2026-09-26'),
    endDate:   new Date('2026-10-03'),
    color: 'text-purple-400',
  },
  {
    weeks: '11 – 12', weekStart: 11, weekEnd: 12,
    contests: '11 – 12',
    topic: 'Binary Search, Recursion, BST',
    icon: '🔍',
    focusAreas: ['Binary Search on Arrays', 'Recursion', 'BST Operations'],
    dateRange: 'Oct 10 – Oct 17, 2026',
    startDate: new Date('2026-10-10'),
    endDate:   new Date('2026-10-17'),
    color: 'text-yellow-400',
  },
  {
    weeks: '13 – 14', weekStart: 13, weekEnd: 14,
    contests: '13 – 14',
    topic: 'Heap (Priority Queue), Greedy',
    icon: '⛰️',
    focusAreas: ['Heap Operations', 'Greedy Techniques'],
    dateRange: 'Oct 24 – Oct 31, 2026',
    startDate: new Date('2026-10-24'),
    endDate:   new Date('2026-10-31'),
    color: 'text-red-400',
  },
  {
    weeks: '15 – 16', weekStart: 15, weekEnd: 16,
    contests: '15 – 16',
    topic: 'Trees (DFS/BFS), Backtracking',
    icon: '🌳',
    focusAreas: ['Tree Traversals', 'Backtracking Basics'],
    dateRange: 'Nov 7 – Nov 14, 2026',
    startDate: new Date('2026-11-07'),
    endDate:   new Date('2026-11-14'),
    color: 'text-emerald-400',
  },
  {
    weeks: '17 – 18', weekStart: 17, weekEnd: 18,
    contests: '17 – 18',
    topic: 'Graphs (BFS/DFS), Union Find (DSU)',
    icon: '🕸️',
    focusAreas: ['Graph Traversals', 'DSU', 'Connected Components'],
    dateRange: 'Nov 21 – Nov 28, 2026',
    startDate: new Date('2026-11-21'),
    endDate:   new Date('2026-11-28'),
    color: 'text-indigo-400',
  },
  {
    weeks: '19 – 20', weekStart: 19, weekEnd: 20,
    contests: '19 – 20',
    topic: 'Trie, Strings',
    icon: '🌐',
    focusAreas: ['Trie Operations', 'Advanced String Problems'],
    dateRange: 'Dec 5 – Dec 12, 2026',
    startDate: new Date('2026-12-05'),
    endDate:   new Date('2026-12-12'),
    color: 'text-teal-400',
  },
  {
    weeks: '21 – 22', weekStart: 21, weekEnd: 22,
    contests: '21 – 22',
    topic: 'Bit Manipulation, Dynamic Programming',
    icon: '⚡',
    focusAreas: ['Bitwise Operations', 'DP on 1D Structures'],
    dateRange: 'Dec 19 – Dec 26, 2026',
    startDate: new Date('2026-12-19'),
    endDate:   new Date('2026-12-26'),
    color: 'text-yellow-300',
  },
  {
    weeks: '23 – 24', weekStart: 23, weekEnd: 24,
    contests: '23 – 24',
    topic: 'Backtracking, Dynamic Programming',
    icon: '🔄',
    focusAreas: ['Advanced Backtracking', 'DP on 2D Structures'],
    dateRange: 'Jan 2 – Jan 9, 2027',
    startDate: new Date('2027-01-02'),
    endDate:   new Date('2027-01-09'),
    color: 'text-pink-400',
  },
  {
    weeks: '25 – 26', weekStart: 25, weekEnd: 26,
    contests: '25 – 26',
    topic: 'Greedy, Dynamic Programming',
    icon: '🎯',
    focusAreas: ['Advanced Greedy', 'DP Optimization'],
    dateRange: 'Jan 16 – Jan 23, 2027',
    startDate: new Date('2027-01-16'),
    endDate:   new Date('2027-01-23'),
    color: 'text-orange-300',
  },
  {
    weeks: '27 – 57', weekStart: 27, weekEnd: 57,
    contests: '27 – 57',
    topic: 'Revision, Mixed Topics & Challenge Weeks',
    icon: '🏆',
    focusAreas: ['Mixed Topic Contests', 'Bonus & Special Challenges'],
    dateRange: 'Jan 30 – Aug 7, 2027',
    startDate: new Date('2027-01-30'),
    endDate:   new Date('2027-08-07'),
    color: 'text-gold',
  },
];

/** Returns the block that is currently active (today falls within its date range). */
export function getCurrentWeekBlock(): WeekBlock | null {
  const today = new Date();
  return WEEK_TOPICS.find(b => today >= b.startDate && today <= b.endDate) ?? null;
}

/** Returns the next upcoming block after today. */
export function getNextWeekBlock(): WeekBlock | null {
  const today = new Date();
  return WEEK_TOPICS.find(b => b.startDate > today) ?? null;
}

/** Returns 'past' | 'current' | 'upcoming' for a block */
export function getBlockStatus(block: WeekBlock): 'past' | 'current' | 'upcoming' {
  const today = new Date();
  if (today > block.endDate) return 'past';
  if (today >= block.startDate && today <= block.endDate) return 'current';
  return 'upcoming';
}

/** Practice links per topic */
export const PRACTICE_LINKS: Record<string, { leetcode?: string; gfg?: string }> = {
  'Arrays, Prefix Sum':                           { leetcode: 'https://leetcode.com/tag/array/',        gfg: 'https://www.geeksforgeeks.org/array-data-structure/' },
  'Strings, HashMap & HashSet':                   { leetcode: 'https://leetcode.com/tag/hash-table/',   gfg: 'https://www.geeksforgeeks.org/hashing-data-structure/' },
  'Two Pointers, Sliding Window':                 { leetcode: 'https://leetcode.com/tag/two-pointers/', gfg: 'https://www.geeksforgeeks.org/two-pointers-technique/' },
  'Stack & Monotonic Stack, Queue & Deque':       { leetcode: 'https://leetcode.com/tag/stack/',        gfg: 'https://www.geeksforgeeks.org/stack-data-structure/' },
  'Linked Lists, Two Pointers':                   { leetcode: 'https://leetcode.com/tag/linked-list/',  gfg: 'https://www.geeksforgeeks.org/data-structures/linked-list/' },
  'Binary Search, Recursion, BST':                { leetcode: 'https://leetcode.com/tag/binary-search/',gfg: 'https://www.geeksforgeeks.org/binary-search/' },
  'Heap (Priority Queue), Greedy':                { leetcode: 'https://leetcode.com/tag/heap-priority-queue/', gfg: 'https://www.geeksforgeeks.org/heap-data-structure/' },
  'Trees (DFS/BFS), Backtracking':               { leetcode: 'https://leetcode.com/tag/tree/',         gfg: 'https://www.geeksforgeeks.org/binary-tree-data-structure/' },
  'Graphs (BFS/DFS), Union Find (DSU)':           { leetcode: 'https://leetcode.com/tag/graph/',        gfg: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/' },
  'Trie, Strings':                                { leetcode: 'https://leetcode.com/tag/trie/',         gfg: 'https://www.geeksforgeeks.org/trie-insert-and-search/' },
  'Bit Manipulation, Dynamic Programming':        { leetcode: 'https://leetcode.com/tag/bit-manipulation/', gfg: 'https://www.geeksforgeeks.org/bitwise-algorithms/' },
  'Backtracking, Dynamic Programming':            { leetcode: 'https://leetcode.com/tag/dynamic-programming/', gfg: 'https://www.geeksforgeeks.org/dynamic-programming/' },
  'Greedy, Dynamic Programming':                  { leetcode: 'https://leetcode.com/tag/greedy/',       gfg: 'https://www.geeksforgeeks.org/greedy-algorithms/' },
  'Revision, Mixed Topics & Challenge Weeks':     { leetcode: 'https://leetcode.com/problemset/',       gfg: 'https://practice.geeksforgeeks.org/' },
};
