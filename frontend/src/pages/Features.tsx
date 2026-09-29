import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import StudyPlanner from "@/components/StudyPlanner";
import InterviewPrep from "@/components/InterviewPrep";
import SalarySimulator from "@/components/SalarySimulator";
import CareerNewsFeed from "@/components/CareerNewsFeed";
import MentorSpotlight from "@/components/MentorSpotlight";
import ExamCountdown from "@/components/ExamCountdown";
import { Target, Sparkles } from "lucide-react";

export default function Features() {
  const { profile } = useAuth();
  const career = profile?.selected_career as string | undefined;

  if (!career) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold text-foreground">No career selected</h2>
          <p className="mt-2 text-sm text-muted-foreground">Complete the quiz and select a career to unlock features</p>
          <a href="/quiz" className="btn-primary mt-4 inline-block">Start Quiz →</a>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="w-full max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <span className="icon-box icon-box-primary h-9 w-9 rounded-lg"><Sparkles className="h-5 w-5" /></span>
            Career Tools
          </h1>
          <p className="text-sm text-muted-foreground">AI-powered tools for <span className="text-primary font-medium">{career.title}</span></p>
        </div>

        <ExamCountdown career={career} />
        <StudyPlanner />
        <InterviewPrep career={career} />
        <SalarySimulator career={career} />
        <CareerNewsFeed career={career} />
        <MentorSpotlight career={career} />
      </div>
    </PageTransition>
  );
}
