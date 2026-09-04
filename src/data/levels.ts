export interface BlockPattern {
  id: string;
  name: string;
  pattern: ('red' | 'white' | 'diagonal-tl-red' | 'diagonal-tr-red' | 'diagonal-bl-red' | 'diagonal-br-red' | 'large-triangle-up-red' | 'large-triangle-down-red' | 'large-triangle-up-white' | 'large-triangle-down-white')[][];
  imageUri?: string; // Optional: path to actual pattern image
}

// diagonal-tl-red = red triangle at top-left (diagonal dari kiri atas ke kanan bawah, merah di atas)
// diagonal-tr-red = red triangle at top-right (diagonal dari kanan atas ke kiri bawah, merah di atas)
// diagonal-bl-red = red triangle at bottom-left (diagonal dari kiri atas ke kanan bawah, merah di bawah)
// diagonal-br-red = red triangle at bottom-right (diagonal dari kanan atas ke kiri bawah, merah di bawah)
// large-triangle-up-red = large red triangle pointing up across entire 2x2 grid
// large-triangle-down-red = large red triangle pointing down across entire 2x2 grid
// large-triangle-up-white = large white triangle pointing up across entire 2x2 grid
// large-triangle-down-white = large white triangle pointing down across entire 2x2 grid

export interface Level {
  id: number;
  title: string;
  description: string;
  emoji: string;
  patterns: BlockPattern[];
  timeLimit: number; // in seconds
  unlocked: boolean;
}

// Level 1 patterns based on your images
const level1Patterns: BlockPattern[] = [
  {
    id: 'l1p1',
    name: 'Full Red',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level1-pattern1.png')
  },
  {
    id: 'l1p2', 
    name: 'Top Red',
    pattern: [
      ['red', 'red'],
      ['white', 'white']
    ],
    imageUri: require('../../assets/level1-pattern2.png')
  },
  {
    id: 'l1p3',
    name: 'Diagonal Split',
    pattern: [
      ['white', 'red'],
      ['red', 'white']
    ],
    imageUri: require('../../assets/level1-pattern3.png')
  },
  {
    id: 'l1p4',
    name: 'Bottom Right',
    pattern: [
      ['red', 'white'],
      ['white', 'red']
    ],
    imageUri: require('../../assets/level1-pattern4.png')
  }
];

// Level 2 patterns - diagonal triangles
const level2Patterns: BlockPattern[] = [
  {
    id: 'l2p1',
    name: 'Pattern 1',
    pattern: [
      ['red', 'white'],
      ['diagonal-br-red', 'white']
    ],
    imageUri: require('../../assets/level2-pattern1.png')
  },
  {
    id: 'l2p2',
    name: 'Pattern 2',
    pattern: [
      ['red', 'white'],
      ['white', 'diagonal-br-red']
    ],
    imageUri: require('../../assets/level2-pattern2.png')
  },
  {
    id: 'l2p3',
    name: 'Pattern 3',
    pattern: [
      ['white', 'red'],
      ['white', 'diagonal-tr-red']
    ],
    imageUri: require('../../assets/level2-pattern3.png')
  },
  {
    id: 'l2p4',
    name: 'Pattern 4',
    pattern: [
      ['white', 'red'],
      ['diagonal-tr-red', 'white']
    ],
    imageUri: require('../../assets/level2-pattern4.png')
  }
];

// Level 3 patterns - large triangles
const level3Patterns: BlockPattern[] = [
  {
    id: 'l3p1',
    name: 'Pattern 1',
    pattern: [
      ['large-triangle-up-red', 'large-triangle-up-red'],
      ['large-triangle-up-red', 'large-triangle-up-red']
    ],
    imageUri: require('../../assets/level3-pattern1.png')
  },
  {
    id: 'l3p2',
    name: 'Pattern 2',
    pattern: [
      ['large-triangle-up-white', 'large-triangle-up-white'],
      ['large-triangle-up-white', 'large-triangle-up-white']
    ],
    imageUri: require('../../assets/level3-pattern2.png')
  },
  {
    id: 'l3p3',
    name: 'Pattern 3',
    pattern: [
      ['large-triangle-down-white', 'large-triangle-down-white'],
      ['large-triangle-down-white', 'large-triangle-down-white']
    ],
    imageUri: require('../../assets/level3-pattern3.png')
  },
  {
    id: 'l3p4',
    name: 'Pattern 4',
    pattern: [
      ['large-triangle-down-red', 'large-triangle-down-red'],
      ['large-triangle-down-red', 'large-triangle-down-red']
    ],
    imageUri: require('../../assets/level3-pattern4.png')
  }
];

// Level 4 patterns
const level4Patterns: BlockPattern[] = [
  {
    id: 'l4p1',
    name: 'Pattern 1',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level4-pattern1.png')
  },
  {
    id: 'l4p2',
    name: 'Pattern 2',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level4-pattern2.png')
  },
  {
    id: 'l4p3',
    name: 'Pattern 3',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level4-pattern3.png')
  },
  {
    id: 'l4p4',
    name: 'Pattern 4',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level4-pattern4.png')
  }
];

// Level 5 patterns
const level5Patterns: BlockPattern[] = [
  {
    id: 'l5p1',
    name: 'Pattern 1',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level5-pattern1.png')
  },
  {
    id: 'l5p2',
    name: 'Pattern 2',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level5-pattern2.png')
  },
  {
    id: 'l5p3',
    name: 'Pattern 3',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level5-pattern3.png')
  },
  {
    id: 'l5p4',
    name: 'Pattern 4',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level5-pattern4.png')
  }
];

// Level 6 patterns
const level6Patterns: BlockPattern[] = [
  {
    id: 'l6p1',
    name: 'Pattern 1',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level6-pattern1.png')
  },
  {
    id: 'l6p2',
    name: 'Pattern 2',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level6-pattern2.png')
  },
  {
    id: 'l6p3',
    name: 'Pattern 3',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level6-pattern3.png')
  },
  {
    id: 'l6p4',
    name: 'Pattern 4',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level6-pattern4.png')
  }
];

// Level 7 patterns
const level7Patterns: BlockPattern[] = [
  {
    id: 'l7p1',
    name: 'Pattern 1',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level7-pattern1.png')
  },
  {
    id: 'l7p2',
    name: 'Pattern 2',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level7-pattern2.png')
  },
  {
    id: 'l7p3',
    name: 'Pattern 3',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level7-pattern3.png')
  },
  {
    id: 'l7p4',
    name: 'Pattern 4',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level7-pattern4.png')
  }
];

// Level 8 patterns
const level8Patterns: BlockPattern[] = [
  {
    id: 'l8p1',
    name: 'Pattern 1',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level8-pattern1.png')
  },
  {
    id: 'l8p2',
    name: 'Pattern 2',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level8-pattern2.png')
  },
  {
    id: 'l8p3',
    name: 'Pattern 3',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level8-pattern3.png')
  },
  {
    id: 'l8p4',
    name: 'Pattern 4',
    pattern: [
      ['red', 'red'],
      ['red', 'red']
    ],
    imageUri: require('../../assets/level8-pattern4.png')
  }
];

export const LEVELS: Level[] = [
  {
    id: 1,
    title: 'Petualangan Dimulai',
    description: 'Pelajari dasar-dasar pola blok',
    emoji: '🌟',
    patterns: level1Patterns,
    timeLimit: 120,
    unlocked: true
  },
  {
    id: 2,
    title: 'Hutan Ajaib',
    description: 'Jelajahi pola-pola di hutan',
    emoji: '🌲',
    patterns: level2Patterns,
    timeLimit: 120,
    unlocked: false
  },
  {
    id: 3,
    title: 'Kastil Awan',
    description: 'Terbang tinggi dengan pola kompleks',
    emoji: '🏰',
    patterns: level3Patterns,
    timeLimit: 120,
    unlocked: false
  },
  {
    id: 4,
    title: 'Lautan Biru',
    description: 'Menyelam ke pola bawah laut',
    emoji: '🌊',
    patterns: level4Patterns,
    timeLimit: 120,
    unlocked: false
  },
  {
    id: 5,
    title: 'Gunung Salju',
    description: 'Mendaki puncak dengan pola es',
    emoji: '🏔️',
    patterns: level5Patterns,
    timeLimit: 120,
    unlocked: false
  },
  {
    id: 6,
    title: 'Padang Bunga',
    description: 'Bermain di taman pola warna-warni',
    emoji: '🌸',
    patterns: level6Patterns,
    timeLimit: 120,
    unlocked: false
  },
  {
    id: 7,
    title: 'Gua Kristal',
    description: 'Temukan harta karun pola tersembunyi',
    emoji: '💎',
    patterns: level7Patterns,
    timeLimit: 120,
    unlocked: false
  },
  {
    id: 8,
    title: 'Istana Pelangi',
    description: 'Tantangan terakhir sang master!',
    emoji: '🌈',
    patterns: level8Patterns,
    timeLimit: 120,
    unlocked: false
  }
];