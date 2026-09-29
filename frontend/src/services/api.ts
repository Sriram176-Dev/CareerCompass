// Central API client — replaces all Supabase calls

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// No longer using localStorage for tokens (switched to HttpOnly cookies)

// Type definitions
interface User {
  id: string;
  email: string;
  name: string;
  user_type: string;
  xp?: number;
  level?: number;
  streak?: number;
  analysis_result?: {
    topMatches?: Array<{ careerId: string; score: number; reason?: string }>;
  };
  flashcard_decks?: Array<unknown>;
  chat_sessions?: Array<unknown>;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: string;
}

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

interface FlashcardDeck {
  id: string;
  title: string;
  cards: Array<{ front: string; back: string }>;
  progress?: number;
}

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include", // Required for HttpOnly cookies
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; name: string; user_type: string }) =>
    request<{ message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<User>("/auth/me"),

  logout: () => request<{ message: string }>("/auth/logout", { method: "POST" }),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, password: string) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
};

// ─── Profile ───────────────────────────────────────────────────────────────
export const profileApi = {
  get: () => request<User>("/profile"),

  update: (updates: Partial<User>) =>
    request<User>("/profile", {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  addXp: (amount: number) =>
    request<{ xp: number; level: number }>("/profile/add-xp", {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),

  saveChatSession: (session: ChatSession) =>
    request<{ ok: boolean }>("/profile/chat-session", {
      method: "POST",
      body: JSON.stringify({ session }),
    }),

  deleteChatSession: (id: string) =>
    request<{ ok: boolean }>(`/profile/chat-session/${id}`, {
      method: "DELETE",
    }),

  // Fix 14: atomic flashcard deck operations
  pushFlashcardDeck: (deck: FlashcardDeck) =>
    request<{ ok: boolean; flashcard_decks: FlashcardDeck[] }>("/profile/flashcard-deck", {
      method: "POST",
      body: JSON.stringify({ deck }),
    }),

  updateFlashcardDeckProgress: (deckId: string, progress: Partial<FlashcardDeck>) =>
    request<{ ok: boolean }>(`/profile/flashcard-deck/${deckId}`, {
      method: "PATCH",
      body: JSON.stringify({ progress }),
    }),
};

// ─── Tasks ─────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: () => request<Task[]>("/tasks"),

  create: (text: string) =>
    request<Task>("/tasks", { method: "POST", body: JSON.stringify({ text }) }),

  update: (id: string, updates: { completed?: boolean; text?: string }) =>
    request<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/tasks/${id}`, { method: "DELETE" }),
};

// ─── AI ────────────────────────────────────────────────────────────────────
export const aiApi = {
  /** Returns a streaming Response — caller handles SSE */
  chatStream: (messages: ChatMessage[], userProfile?: User): Promise<Response> => {
    return fetch(`${BASE_URL}/ai/chat`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages, userProfile }),
    });
  },

  careerAnalysis: (data: Record<string, unknown>) =>
    request<Record<string, unknown>>("/ai/career-analysis", { method: "POST", body: JSON.stringify(data) }),

  generateRoadmap: (career: string, userProfile: User) =>
    request<Record<string, unknown>>("/ai/generate-roadmap", {
      method: "POST",
      body: JSON.stringify({ career, userProfile }),
    }),

  generateFlashcards: (data: { topic: string; content?: string; count?: number; difficulty?: string }) =>
    request<Record<string, unknown>>("/ai/generate-flashcards", { method: "POST", body: JSON.stringify(data) }),

  generateResume: (data: Record<string, unknown>) =>
    request<Record<string, unknown>>("/ai/generate-resume", { method: "POST", body: JSON.stringify(data) }),

  dailyQuiz: (data: { career?: string; topic?: string; difficulty?: string; count?: number }) =>
    request<Record<string, unknown>>("/ai/daily-quiz", { method: "POST", body: JSON.stringify(data) }),

  studyNotes: (data: { topic: string; content?: string; noteType?: string; career?: string }) =>
    request<Record<string, unknown>>("/ai/study-notes", { method: "POST", body: JSON.stringify(data) }),

  summarizeDocument: (data: { content: string; filename?: string; summaryType?: string }) =>
    request<Record<string, unknown>>("/ai/summarize-document", { method: "POST", body: JSON.stringify(data) }),

  careerTools: (tool: string, params: Record<string, unknown>) =>
    request<Record<string, unknown>>("/ai/career-tools", { method: "POST", body: JSON.stringify({ tool, ...params }) }),
};

export default {
  auth: authApi,
  profile: profileApi,
  tasks: tasksApi,
  ai: aiApi,
};
