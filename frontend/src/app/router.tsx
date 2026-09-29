import { lazy, Suspense, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";

const Landing = lazy(() => import("@/pages/HomePlatform"));
const Auth = lazy(() => import("@/pages/UserAuthentication"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const Quiz = lazy(() => import("@/pages/CareerAssessment"));
const Results = lazy(() => import("@/pages/Results"));
const Roadmap = lazy(() => import("@/pages/CareerRoadmap"));
const Pomodoro = lazy(() => import("@/pages/StudyFocusTimer"));
const Tasks = lazy(() => import("@/pages/PersonalTaskManager"));
const Features = lazy(() => import("@/pages/Features"));
const Study = lazy(() => import("@/pages/Study"));
const Documents = lazy(() => import("@/pages/Documents"));
const Profile = lazy(() => import("@/pages/Profile"));
const Exams = lazy(() => import("@/pages/Exams"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const DailyQuiz = lazy(() => import("@/pages/DailyQuiz"));
const DecisionSimulator = lazy(() => import("@/pages/DecisionSimulator"));
const CompassScoreMethodology = lazy(() => import("@/pages/CompassScoreMethodology"));
const CareerComparison = lazy(() => import("@/pages/CareerComparison"));
const StudyNotes = lazy(() => import("@/pages/StudyNotes"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingFallback />;
  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}

export function AppRouter() {
  const location = useLocation();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/results" element={<Results />} />
          <Route path="/how-it-works" element={<CompassScoreMethodology />} />

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/pomodoro" element={<Pomodoro />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/features" element={<Features />} />
            <Route path="/study" element={<Study />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/daily-quiz" element={<DailyQuiz />} />
            <Route path="/simulator" element={<DecisionSimulator />} />
            <Route path="/compare" element={<CareerComparison />} />
            <Route path="/study-notes" element={<StudyNotes />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
