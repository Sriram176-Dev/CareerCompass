import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, profileApi } from "@/lib/api";

export interface Profile {
  _id: string;
  name: string;
  email: string;
  user_type: string;
  current_class: string | null;
  institution: string | null;
  city_tier: string | null;
  board: string | null;
  subjects: Record<string, number>;
  selected_career_id: number | null;
  selected_career: { id: string; title: string; cat: string; icon: string; salaryRange: string } | string | null;
  xp: number;
  level: number;
  completed_tasks: string[];
  saved_careers: number[];
  analysis_result: { topMatches?: Array<{ careerId: string; score: number; reason?: string; ruleScore?: number; aiScore?: number; semanticScore?: number }>; summary?: string; strengths?: string[]; recommendedStream?: string; workStyle?: string } | null;
  interest_cards: string[];
  priority_ranking: string[];
  roadmap_data: { milestones?: Array<{ id: string; title: string; tasks?: Array<{ id: string; title: string }> }> } | null;
  roadmap_generated_at: string | null;
  quiz_attempts: { category: string; score: number; total: number; difficulty: string; timestamp: string }[];
  career_selection_events: { careerId: string | number; careerTitle: string; compassFitScore: number; ruleScore?: number; aiScore?: number; semanticScore?: number; rankPosition: number | null; timestamp: string }[];
  simulator_results: { careerId: string | number; careerTitle: string; alignmentPct: number; decisionsCount: number; timestamp: string }[];
  onboarding_complete: boolean;
  chat_sessions: Array<{ id: string; messages: Array<{ role: string; content: string }>; created_at: string; preview?: string }>;
  notifications: Array<{ id: string; message: string; timestamp: string; read?: boolean }>;
  bookmarked_messages: string[];
  streak: number;
  createdAt: string;
}

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  addXp: (amount: number, reason: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, userType: string) => Promise<string>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const data = await profileApi.get();
      setProfile(data);
      setUser({ id: data._id, email: data.email });
    } catch {
      setUser(null);
      setProfile(null);
    }
  };


  useEffect(() => {
    loadProfile().finally(() => setLoading(false));
  }, []);


  const refreshProfile = async () => { await loadProfile(); };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      const updated = await profileApi.update(updates);
      setProfile(updated);
    } catch (err: unknown) {
      const toast = (await import("react-hot-toast")).default;
      const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(errorMessage);
    }
  };

  const addXp = async (amount: number, reason: string) => {
    try {
      const { xp, level } = await profileApi.addXp(amount);
      const toast = (await import("react-hot-toast")).default;
      toast.success(`+${amount} XP 🚀 ${reason}`);
      if (profile && level > (profile.level || 1)) toast.success(`Level ${level} unlocked! 🎉`);
      setProfile((prev) => (prev ? { ...prev, xp, level } : prev));
    } catch {
      // Error adding XP
    }
  };

  const signIn = async (email: string, password: string) => {
    const { user: userData } = await authApi.login({ email, password });
    setProfile(userData);
    setUser({ id: userData._id, email: userData.email });
  };

  const signUp = async (email: string, password: string, name: string, userType: string) => {
    const { message } = await authApi.register({ email, password, name, user_type: userType });
    // Note: We don't set user state here because the account is not yet verified.
    return message;
  };


  const signOut = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setProfile(null);
    }
  };


  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, updateProfile, addXp, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
