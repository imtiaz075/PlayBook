export interface Quote {
  id: string;
  text: string;
  author: string;
  category: 'productivity' | 'discipline' | 'focus' | 'freelancing' | 'creativity' | 'success' | 'growth';
}

export const QUOTES_COLLECTION: Quote[] = [
  {
    id: 'q-1',
    text: "Your consistency is building your future. Small daily progress compounds into extraordinary freedom.",
    author: "Unknown",
    category: "freelancing",
  },
  {
    id: 'q-2',
    text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.",
    author: "Stephen King",
    category: "discipline",
  },
  {
    id: 'q-3',
    text: "Focus is a muscle. The more you practice saying no to distractions, the easier it becomes to build great things.",
    author: "Unknown",
    category: "focus",
  },
  {
    id: 'q-4',
    text: "Quality is not an act, it is a habit.",
    author: "Aristotle",
    category: "discipline",
  },
  {
    id: 'q-5',
    text: "Do not wait to strike till the iron is hot; but make it hot by striking.",
    author: "William Butler Yeats",
    category: "productivity",
  },
  {
    id: 'q-6',
    text: "Action is the foundational key to all success.",
    author: "Pablo Picasso",
    category: "success",
  },
  {
    id: 'q-7',
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    category: "productivity",
  },
  {
    id: 'q-8',
    text: "Simplicity boils down to two steps: Identify the essential. Eliminate the rest.",
    author: "Leo Babauta",
    category: "focus",
  },
  {
    id: 'q-9',
    text: "Either you run the day or the day runs you.",
    author: "Jim Rohn",
    category: "discipline",
  },
  {
    id: 'q-10',
    text: "Creativity is intelligence having fun.",
    author: "Albert Einstein",
    category: "creativity",
  },
  {
    id: 'q-11',
    text: "The price of excellence is discipline. The cost of mediocrity is disappointment.",
    author: "William Arthur Ward",
    category: "discipline",
  },
  {
    id: 'q-12',
    text: "Work like there is someone working twenty-four hours a day to take it away from you.",
    author: "Mark Cuban",
    category: "freelancing",
  },
  {
    id: 'q-13',
    text: "The main thing is to keep the main thing the main thing.",
    author: "Stephen Covey",
    category: "focus",
  },
  {
    id: 'q-14',
    text: "Your time is limited, so don't waste it living someone else's life.",
    author: "Steve Jobs",
    category: "growth",
  },
  {
    id: 'q-15',
    text: "Great things are done by a series of small things brought together.",
    author: "Vincent van Gogh",
    category: "creativity",
  },
  {
    id: 'q-16',
    text: "Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort.",
    author: "Paul J. Meyer",
    category: "productivity",
  },
  {
    id: 'q-17',
    text: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein",
    category: "growth",
  },
  {
    id: 'q-18',
    text: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
    category: "success",
  },
  {
    id: 'q-19',
    text: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
    category: "productivity",
  },
  {
    id: 'q-20',
    text: "Freedom is found when you take 100% ownership of your hours and output.",
    author: "Unknown",
    category: "freelancing",
  },
  {
    id: 'q-21',
    text: "Don't count the days, make the days count.",
    author: "Muhammad Ali",
    category: "discipline",
  },
  {
    id: 'q-22',
    text: "Until we can manage time, we can manage nothing else.",
    author: "Peter Drucker",
    category: "productivity",
  },
  {
    id: 'q-23',
    text: "The expert in anything was once a beginner.",
    author: "Helen Hayes",
    category: "growth",
  },
  {
    id: 'q-24',
    text: "He who moves a mountain begins by carrying away small stones.",
    author: "Confucius",
    category: "discipline",
  },
  {
    id: 'q-25',
    text: "Discipline is choosing between what you want now and what you want most.",
    author: "Abraham Lincoln",
    category: "discipline",
  },
  {
    id: 'q-26',
    text: "Flow follows focus. Protect your deep work time fierce and uninterrupted.",
    author: "Unknown",
    category: "focus",
  },
  {
    id: 'q-27',
    text: "Opportunities don't happen, you create them.",
    author: "Chris Grosser",
    category: "freelancing",
  },
  {
    id: 'q-28',
    text: "Build your own dreams, or someone else will hire you to build theirs.",
    author: "Farrah Gray",
    category: "freelancing",
  },
  {
    id: 'q-29',
    text: "Doubt kills more dreams than failure ever will.",
    author: "Suzy Kassem",
    category: "growth",
  },
  {
    id: 'q-30',
    text: "Success isn't always about greatness. It's about consistency. Consistent hard work leads to success.",
    author: "Dwayne Johnson",
    category: "success",
  },
  {
    id: 'q-31',
    text: "To produce extraordinary results, you must narrow your focus to the single most impactful task.",
    author: "Gary Keller",
    category: "focus",
  },
  {
    id: 'q-32',
    text: "Continuous effort—not strength or intelligence—is the key to unlocking our potential.",
    author: "Winston Churchill",
    category: "discipline",
  },
  {
    id: 'q-33',
    text: "It is not enough to be busy; so are the ants. The question is: What are we busy about?",
    author: "Henry David Thoreau",
    category: "productivity",
  },
  {
    id: 'q-34',
    text: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
    category: "growth",
  },
  {
    id: 'q-35',
    text: "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.",
    author: "Steve Jobs",
    category: "creativity",
  },
  {
    id: 'q-36',
    text: "Client trust is built by under-promising and consistently over-delivering.",
    author: "Unknown",
    category: "freelancing",
  },
  {
    id: 'q-37',
    text: "Starve your distractions, feed your focus.",
    author: "Unknown",
    category: "focus",
  },
  {
    id: 'q-38',
    text: "Failure is simply the opportunity to begin again, this time more intelligently.",
    author: "Henry Ford",
    category: "growth",
  },
  {
    id: 'q-39',
    text: "The distance between dreams and reality is called action.",
    author: "Unknown",
    category: "discipline",
  },
  {
    id: 'q-40',
    text: "Strive not to be a success, but rather to be of value.",
    author: "Albert Einstein",
    category: "success",
  }
];

export function getRandomQuoteIndex(currentIndex: number, totalQuotes: number): number {
  if (totalQuotes <= 1) return 0;
  let nextIndex: number;
  do {
    nextIndex = Math.floor(Math.random() * totalQuotes);
  } while (nextIndex === currentIndex);
  return nextIndex;
}
