import { motion } from "framer-motion";
import { SCENARIO_QUESTIONS } from "@/data/scenarioQuestions";
import { Zap } from "lucide-react";

interface Props {
  selectedCards: number;
  answeredScenarios: number;
  textLength: number;
  activeTab: number;
}

export default function QuizProgressBar({ selectedCards, answeredScenarios, textLength, activeTab }: Props) {
  const total = SCENARIO_QUESTIONS.length;
  
  // Calculate overall completion - NO default scores
  const cardScore = Math.min(selectedCards / 5, 1) * 40;
  const scenarioScore = Math.min(answeredScenarios / total, 1) * 35;
  const priorityScore = 0; // Don't give free points - user must interact
  const textScore = Math.min(textLength / 30, 1) * 25;
  const totalProgress = Math.round(cardScore + scenarioScore + priorityScore + textScore);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Discovery Progress</span>
        </div>
        <span className={`text-xs font-bold ${totalProgress >= 80 ? 'text-success' : 'text-primary'}`}>
          {totalProgress}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          animate={{ width: `${totalProgress}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className={`h-full rounded-full ${
            totalProgress >= 80
              ? "bg-gradient-to-r from-success to-emerald-400"
              : "bg-gradient-to-r from-primary to-accent"
          }`}
        />
      </div>
      {/* Section indicators */}
      <div className="mt-2 grid grid-cols-4 gap-1">
        {[
          { label: "Cards", done: selectedCards >= 5, value: `${selectedCards}/5+` },
          { label: "Scenarios", done: answeredScenarios >= total, value: `${answeredScenarios}/${total}` },
          { label: "Priorities", done: false, value: "⟶" },
          { label: "Tell AI", done: textLength >= 30, value: textLength >= 30 ? "✓" : `${textLength}/30` },
        ].map((section, i) => (
          <button
            key={section.label}
            className={`rounded-lg px-2 py-1 text-center transition-all duration-200 ${
              activeTab === i ? "bg-primary/10 border border-primary/30" : ""
            }`}
          >
            <span className={`text-[10px] block ${section.done ? 'text-success font-bold' : 'text-muted-foreground'}`}>
              {section.value}
            </span>
            <span className="text-[10px] text-muted-foreground">{section.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
