import { ScenarioQuestion } from '@/types';

export const SCENARIO_QUESTIONS: ScenarioQuestion[] = [
  {
    id: 1,
    icon: '🎉',
    question: "It's Saturday morning. What are you most likely doing?",
    options: [
      { label: 'Building a side project or coding something new', tags: ['tech', 'creative', 'independent'] },
      { label: 'Volunteering at a local NGO or teaching kids', tags: ['social', 'education', 'impact'] },
      { label: 'Reading about stock markets or business news', tags: ['finance', 'business', 'analytical'] },
      { label: 'Playing sports or working out at the gym', tags: ['sports', 'physical', 'health'] },
    ],
  },
  {
    id: 2,
    icon: '💼',
    question: 'Your school asks you to lead a project. What do you choose?',
    options: [
      { label: 'Build a website or app for the school', tags: ['tech', 'creative', 'problem-solving'] },
      { label: 'Organize a health awareness camp', tags: ['healthcare', 'social', 'leadership'] },
      { label: 'Create a business plan for a student startup', tags: ['business', 'finance', 'entrepreneurship'] },
      { label: 'Direct a short film or stage play', tags: ['creative', 'media', 'arts'] },
    ],
  },
  {
    id: 3,
    icon: '🌟',
    question: 'Which news headline excites you the most?',
    options: [
      { label: 'Indian startup raises ₹500Cr in Series B funding', tags: ['business', 'tech', 'entrepreneurship'] },
      { label: 'ISRO successfully launches Mars mission', tags: ['science', 'engineering', 'government'] },
      { label: 'Indian doctor develops breakthrough cancer treatment', tags: ['healthcare', 'research', 'science'] },
      { label: 'Young IAS officer transforms rural district', tags: ['government', 'social', 'leadership'] },
    ],
  },
  {
    id: 4,
    icon: '🧪',
    question: 'In a group project, you naturally take the role of:',
    options: [
      { label: 'The researcher who digs deep into the topic', tags: ['research', 'analytical', 'science'] },
      { label: 'The presenter who explains to everyone', tags: ['communication', 'education', 'leadership'] },
      { label: 'The designer who makes everything look good', tags: ['creative', 'design', 'arts'] },
      { label: 'The manager who organizes and delegates', tags: ['business', 'leadership', 'management'] },
    ],
  },
  {
    id: 5,
    icon: '🎯',
    question: 'Which YouTube channel would you binge-watch?',
    options: [
      { label: 'Coding tutorials and tech reviews', tags: ['tech', 'learning', 'engineering'] },
      { label: 'Finance and investment strategies', tags: ['finance', 'business', 'analytical'] },
      { label: 'Science experiments and discoveries', tags: ['science', 'research', 'curiosity'] },
      { label: 'Creative arts, filmmaking, or design', tags: ['creative', 'media', 'arts'] },
    ],
  },
  {
    id: 6,
    icon: '🏢',
    question: 'Your dream workplace looks like:',
    options: [
      { label: 'A tech office with gaming zones and free food', tags: ['tech', 'startup', 'creative'] },
      { label: 'A hospital or research laboratory', tags: ['healthcare', 'science', 'research'] },
      { label: 'A government office where you impact policy', tags: ['government', 'leadership', 'social'] },
      { label: 'Your own studio or workspace', tags: ['creative', 'independent', 'entrepreneurship'] },
    ],
  },
  {
    id: 7,
    icon: '💡',
    question: 'A friend asks for help. What comes naturally to you?',
    options: [
      { label: 'Debugging their code or fixing their laptop', tags: ['tech', 'problem-solving', 'engineering'] },
      { label: 'Giving them emotional support and advice', tags: ['social', 'psychology', 'healthcare'] },
      { label: 'Helping them plan their budget or finances', tags: ['finance', 'analytical', 'business'] },
      { label: 'Designing a poster or presentation for them', tags: ['creative', 'design', 'arts'] },
    ],
  },
  {
    id: 8,
    icon: '🌍',
    question: 'If you could solve one problem in India, it would be:',
    options: [
      { label: 'Digital literacy and technology access', tags: ['tech', 'education', 'social'] },
      { label: 'Healthcare in rural areas', tags: ['healthcare', 'social', 'government'] },
      { label: 'Unemployment and skill development', tags: ['business', 'education', 'entrepreneurship'] },
      { label: 'Environmental pollution and climate change', tags: ['science', 'environment', 'research'] },
    ],
  },
  {
    id: 9,
    icon: '📚',
    question: 'Which book genre do you pick first?',
    options: [
      { label: 'Science fiction or technology', tags: ['tech', 'science', 'curiosity'] },
      { label: 'Biographies of leaders and entrepreneurs', tags: ['business', 'leadership', 'government'] },
      { label: 'Medical thrillers or psychology', tags: ['healthcare', 'psychology', 'science'] },
      { label: 'Art, photography, or travel', tags: ['creative', 'arts', 'exploration'] },
    ],
  },
  {
    id: 10,
    icon: '🚀',
    question: 'In 10 years, people know you as:',
    options: [
      { label: 'A tech innovator who built something millions use', tags: ['tech', 'entrepreneurship', 'creative'] },
      { label: 'A respected professional who saved lives', tags: ['healthcare', 'science', 'impact'] },
      { label: 'A leader who changed policy and society', tags: ['government', 'leadership', 'social'] },
      { label: 'A creative genius whose work inspires people', tags: ['creative', 'arts', 'media'] },
    ],
  },
];
