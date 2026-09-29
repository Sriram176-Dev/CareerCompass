export interface Career {
  id: number;
  title: string;
  cat: string;
  sub: string;
  icon: string;
  salaryRange: string;
  entryLevel: string;
  midLevel: string;
  seniorLevel: string;
  topCompanies: string[];
  topColleges: string[];
  education: string;
  examPath: string[];
  jobDemand: string;
  growth: string;
  workStyle: string;
  environment: string;
  strongKeywords: string[];
  mediumKeywords: string[];
  skills: string[];
  desc: string;
  cityBoost: string[];
  interestCardMatches: string[];
  scenarioTags: string[];
  valueTags: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  user_type: string;
  current_class: string;
  institution: string;
  city_tier: string;
  board: string;
  subjects: Record<string, number>;
  selected_career_id: number | null;
  selected_career: Career | null;
  xp: number;
  level: number;
  completed_tasks: string[];
  saved_careers: number[];
  analysis_result: AnalysisResult | null;
  interest_cards: string[];
  priority_ranking: string[];
  roadmap_data: RoadmapData | null;
  created_at: string;
}

export interface AnalysisResult {
  topMatches: CareerMatch[];
  summary: string;
  strengths: string[];
}

export interface CareerMatch {
  careerId: number;
  score: number;
  reason: string;
  /** Explainable-match breakdown (0-100 each) — how the final score was built. */
  ruleScore?: number;
  aiScore?: number;
  /** Cosine-similarity score (0-100) between the user's own words/interests and this career's description. */
  semanticScore?: number;
  /** Which selected interests contributed most to the rule-based score, e.g. "Writing Code". */
  topFactors?: string[];
}

export interface RoadmapData {
  career: string;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  tasks: RoadmapTask[];
  capstone: string;
  outcome: string;
  color: string;
}

export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  xp: number;
  priority: 'high' | 'medium' | 'low';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  resource: string;
  completed: boolean;
}

export interface FlashcardDeck {
  id: string;
  user_id: string;
  topic: string;
  source_type: 'text' | 'pdf';
  cards: Flashcard[];
  progress: { easy: number; medium: number; hard: number };
  created_at: string;
}

export interface Flashcard {
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  xpRequired?: number;
  condition: string;
  earned: boolean;
}

export interface ScenarioQuestion {
  id: number;
  icon: string;
  question: string;
  options: { label: string; tags: string[] }[];
}

export const XP_REWARDS = {
  completeTask: 25,
  completeMilestone: 200,
  generateFlashcards: 10,
  studyFlashcardDeck: 5,
  summarizeDocument: 15,
  chatWithAI: 2,
  dailyLogin: 10,
  selectCareer: 25,
  completeOnboarding: 50,
};

export const getLevel = (xp: number) => Math.floor(xp / 150) + 1;
export const getXpForNextLevel = (level: number) => level * 150;
