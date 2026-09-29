import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { INTEREST_CARDS } from "@/data/interestCards";
import { SCENARIO_QUESTIONS } from "@/data/scenarioQuestions";
import { CAREERS } from "@/data/careers";
import { CARD_WEIGHTS, PRIORITY_CAREER_BOOST, SCENARIO_TAG_CAREERS, SUBJECT_CAREER_BOOST, CITY_TIER_BONUS } from "@/data/cardWeights";
import { computeCompassFitScore } from "@/data/compassScore";

const CARD_LABELS: Record<string, string> = Object.fromEntries(INTEREST_CARDS.map(c => [c.id, c.label]));

/** Which of the user's selected interests contributed most to a career's rule-based score. */
function topContributingFactors(career: { title: string }, selectedCards: string[], max = 3): string[] {
  return selectedCards
    .map(cardId => ({ cardId, weight: CARD_WEIGHTS[cardId]?.[career.title] || 0 }))
    .filter(f => f.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, max)
    .map(f => CARD_LABELS[f.cardId] || f.cardId);
}
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { aiApi } from "@/lib/api";
import WelcomeTour from "@/components/WelcomeTour";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import toast from "react-hot-toast";

import InterestCardsTab from "@/components/quiz/InterestCardsTab";
import ScenarioTab from "@/components/quiz/ScenarioTab";
import PriorityTab from "@/components/quiz/PriorityTab";
import TellAITab from "@/components/quiz/TellAITab";
import QuizProgressBar from "@/components/quiz/QuizProgressBar";

const TABS = ["Interest Cards", "Scenarios", "Priorities", "Tell AI"];
const TAB_ICONS = ["🃏", "🎭", "🎯", "📝"];

export default function Quiz() {
  const [selectedCards, setSelectedCards] = useState<string[]>(() => {
    const stored = sessionStorage.getItem("preSelectedCards");
    if (stored) { try { return JSON.parse(stored); } catch { return undefined; } }
    return [];
  });
  const [activeTab, setActiveTab] = useState(() => {
    const stored = sessionStorage.getItem("preSelectedCards");
    if (stored) { try { const c = JSON.parse(stored); if (Array.isArray(c) && c.length > 0) return 1; } catch { return undefined; } }
    return 0;
  });
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [scenarioAnswers, setScenarioAnswers] = useState<Record<number, number>>({});
  const [textInput, setTextInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [priorities, setPriorities] = useState(["salary", "security", "impact", "creative", "balance", "prestige"]);
  const navigate = useNavigate();
  const { user, profile, updateProfile, addXp } = useAuth();

  const [shakeButton, setShakeButton] = useState(false);

  useKeyboardShortcuts({
    advanceScenario: () => {
      if (scenarioAnswers[scenarioIndex] !== undefined && scenarioIndex < SCENARIO_QUESTIONS.length - 1)
        setScenarioIndex(i => i + 1);
    },
    goBackScenario: () => { if (scenarioIndex > 0) setScenarioIndex(i => i - 1); },
    selectScenarioOption: (index: number) => {
      if (activeTab === 1 && SCENARIO_QUESTIONS[scenarioIndex]?.options[index]) {
        setScenarioAnswers(prev => ({ ...prev, [scenarioIndex]: index }));
        if (scenarioIndex < SCENARIO_QUESTIONS.length - 1)
          setTimeout(() => setScenarioIndex(i => i + 1), 800);
      }
    },
  });

  const toggleCard = (id: string) => {
    setSelectedCards(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const liveMatches = useMemo(() => {
    if (selectedCards.length < 3) return [];
    const scores: Record<string, number> = {};
    selectedCards.forEach(cardId => {
      const mapping = CARD_WEIGHTS[cardId];
      if (!mapping) return;
      Object.entries(mapping).forEach(([career, weight]) => {
        scores[career] = (scores[career] || 0) + (weight * 10);
      });
    });
    const max = Math.max(...Object.values(scores), 1);
    return Object.entries(scores)
      .map(([title, score]) => ({ title, score: Math.round((score / max) * 100) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [selectedCards]);

  const computeLocalScores = useCallback(() => {
    const scores: Record<number, number> = {};
    CAREERS.forEach(career => {
      let score = 0;
      selectedCards.forEach(cardId => {
        const mapping = CARD_WEIGHTS[cardId];
        if (mapping && mapping[career.title]) score += mapping[career.title] * 4;
        if (career.interestCardMatches.includes(cardId)) score += 3.5;
        if (career.strongKeywords.includes(cardId)) score += 2;
        if (career.mediumKeywords.includes(cardId)) score += 1;
      });
      Object.entries(scenarioAnswers).forEach(([qIdx, aIdx]) => {
        const q = SCENARIO_QUESTIONS[parseInt(qIdx)];
        if (!q) return;
        const tags = q.options[aIdx]?.tags || [];
        tags.forEach(tag => {
          if (career.scenarioTags.includes(tag)) score += 2.8;
          if (SCENARIO_TAG_CAREERS[tag]?.includes(career.title)) score += 2.8;
        });
      });
      const priorityPoints = [30, 20, 15, 10, 5, 0];
      priorities.forEach((val, rank) => {
        if (career.valueTags.includes(val)) score += priorityPoints[rank] * 0.18;
        if (PRIORITY_CAREER_BOOST[val]?.includes(career.title)) score += priorityPoints[rank] * 0.12;
      });
      if (profile?.subjects) {
        Object.entries(profile.subjects).forEach(([key, val]) => {
          const v = val as number;
          if (v > 60) {
            SUBJECT_CAREER_BOOST[key]?.forEach(boost => {
              if (career.cat === boost.category) score += v * boost.multiplier * 0.14;
            });
          }
        });
      }
      const cityTier = profile?.city_tier || 'metro';
      const cityBonus = CITY_TIER_BONUS[cityTier];
      if (cityBonus?.categories.includes(career.cat)) score += cityBonus.bonus;
      scores[career.id] = score;
    });
    const maxScore = Math.max(...Object.values(scores), 1);
    return CAREERS.map(career => ({
      ...career,
      matchScore: Math.min(95, Math.max(5, Math.round((scores[career.id] / maxScore) * 95))),
    })).sort((a, b) => b.matchScore - a.matchScore);
  }, [selectedCards, scenarioAnswers, priorities, profile?.subjects, profile?.city_tier]);

  const handleAnalyze = async () => {
    if (selectedCards.length < 5) {
      setShakeButton(true);
      setTimeout(() => setShakeButton(false), 500);
      toast.error("Please select at least 5 interest cards");
      return;
    }
    setAnalyzing(true);
    try {
      const localScores = computeLocalScores();
      const topCareers = localScores.slice(0, 15);
      await updateProfile({ interest_cards: selectedCards, priority_ranking: priorities });
      const data = await aiApi.careerAnalysis({
        interestCards: selectedCards, scenarioAnswers, priorityRanking: priorities, userDescription: textInput,
        topCareers: topCareers.map(c => ({ id: c.id, title: c.title, cat: c.cat, score: c.matchScore, desc: c.desc, skills: c.skills, strongKeywords: c.strongKeywords })),
        userProfile: profile ? { userType: profile.user_type, cityTier: profile.city_tier, currentClass: profile.current_class, subjects: profile.subjects } : undefined,
      });
      const aiMatches = (data?.topCareers || data?.matches || []).map((m: { careerId: string; matchScore?: number; aiReason?: string; semanticScore?: number }) => ({
        careerId: m.careerId,
        matchScore: m.matchScore || 70, // AI returns 0-100 directly
        reason: m.aiReason,
        semanticScore: typeof m.semanticScore === "number" ? m.semanticScore : null,
      }));
      // Blend three independent signals into the final Compass Fit Score —
      // see data/compassScore.ts for the published methodology/weights.
      const mergedScores = localScores.map(career => {
        const aiMatch = aiMatches.find((m) => m.careerId === career.id);
        const finalScore = aiMatch
          ? computeCompassFitScore({ ruleScore: career.matchScore, aiScore: aiMatch.matchScore, semanticScore: aiMatch.semanticScore })
          : career.matchScore;
        return {
          ...career,
          matchScore: finalScore,
          aiReason: aiMatch?.reason,
          ruleScore: career.matchScore,
          aiScore: aiMatch?.matchScore,
          semanticScore: aiMatch?.semanticScore ?? undefined,
          topFactors: topContributingFactors(career, selectedCards),
        };
      }).sort((a, b) => b.matchScore - a.matchScore);
      const usedScores = new Set<number>();
      mergedScores.forEach(career => {
        while (usedScores.has(career.matchScore) && career.matchScore > 3) career.matchScore -= 1;
        usedScores.add(career.matchScore);
      });
      await updateProfile({
        analysis_result: {
          topMatches: mergedScores.slice(0, 20).map(c => ({
            careerId: c.id,
            score: c.matchScore,
            reason: c.aiReason || `Strong match based on your interests in ${selectedCards.slice(0, 3).join(", ")}`,
            ruleScore: c.ruleScore,
            aiScore: c.aiScore,
            semanticScore: c.semanticScore,
            topFactors: c.topFactors,
          })),
          summary: data?.analysis?.keyInsight || "Analysis complete!",
          strengths: data?.analysis?.strengths || [],
          recommendedStream: data?.analysis?.recommendedStream || "",
          workStyle: data?.analysis?.workStyle || "",
        },
      });
      await addXp(50, "Quiz completed!");
      sessionStorage.setItem("careerScores", JSON.stringify(mergedScores.slice(0, 100)));
      navigate("/results");
    } catch (err) {
      console.error("Analysis error:", err);
      const localScores = computeLocalScores();
      localScores.forEach((c, i) => {
        c.matchScore = Math.max(3, Math.min(95, localScores[0].matchScore - i * 1.5));
        c.ruleScore = c.matchScore;
        c.topFactors = topContributingFactors(c, selectedCards);
      });
      sessionStorage.setItem("careerScores", JSON.stringify(localScores.slice(0, 100)));
      toast.error("AI is busy, using local analysis");
      navigate("/results");
    } finally {
      setAnalyzing(false);
    }
  };

  const answeredCount = Object.keys(scenarioAnswers).length;
  const isComplete = (i: number) => i === 0 ? selectedCards.length >= 5 : i === 1 ? answeredCount >= 10 : i === 2 ? true : textInput.length >= 30;

  return (
    <PageTransition>
      <WelcomeTour />
      <div className="min-h-screen bg-background">
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto flex h-full items-center justify-between px-6">
            <a href="/" className="text-lg font-bold text-foreground">AI Career Compass</a>
            <a href="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Profile</a>
          </div>
        </nav>

        <div className="container mx-auto px-4 sm:px-6 pt-[68px] pb-28">
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Career Discovery</h1>
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="text-2xl"
            >
              🧭
            </motion.span>
          </div>
          <p className="mb-5 text-sm text-muted-foreground">Complete each section to unlock your personalized career matches</p>

          {/* Progress Bar */}
          <QuizProgressBar
            selectedCards={selectedCards.length}
            answeredScenarios={answeredCount}
            textLength={textInput.length}
            activeTab={activeTab}
          />

          {/* Tabs */}
          <div className="mb-6 flex gap-2 overflow-x-auto scrollbar-hide" data-tour="scenario-tab">
            {TABS.map((tab, i) => {
              const complete = isComplete(i);
              return (
                <button key={tab} onClick={() => setActiveTab(i)}
                  className={`relative flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    activeTab === i
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "border border-border text-muted-foreground hover:border-primary/30 hover:bg-card"
                  }`}>
                  {TAB_ICONS[i]} {tab}
                  {complete && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`ml-1 ${activeTab === i ? "text-primary-foreground" : "text-success"}`}
                    >
                      ✓
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 0 && (
                <InterestCardsTab
                  selectedCards={selectedCards}
                  onToggleCard={toggleCard}
                  liveMatches={liveMatches}
                />
              )}
              {activeTab === 1 && (
                <ScenarioTab
                  scenarioIndex={scenarioIndex}
                  setScenarioIndex={setScenarioIndex}
                  scenarioAnswers={scenarioAnswers}
                  setScenarioAnswers={setScenarioAnswers}
                />
              )}
              {activeTab === 2 && (
                <PriorityTab priorities={priorities} setPriorities={setPriorities} />
              )}
              {activeTab === 3 && (
                <TellAITab textInput={textInput} setTextInput={setTextInput} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Analyze Button — Sticky Bottom */}
          <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/90 backdrop-blur-sm z-40">
            <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1">
                  {selectedCards.slice(0, 3).map(id => {
                    const card = INTEREST_CARDS.find(c => c.id === id);
                    return card ? <span key={id} className="text-sm">{card.icon}</span> : null;
                  })}
                </div>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {selectedCards.length} cards • {answeredCount}/{SCENARIO_QUESTIONS.length} scenarios
                </p>
              </div>
              <motion.button
                onClick={handleAnalyze}
                disabled={analyzing}
                animate={shakeButton ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : analyzing ? { scale: [1, 1.03, 1] } : {}}
                transition={shakeButton ? { duration: 0.4 } : analyzing ? { duration: 1.5, repeat: Infinity } : {}}
                whileHover={!analyzing ? { scale: 1.05 } : {}}
                whileTap={!analyzing ? { scale: 0.95 } : {}}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 text-sm sm:text-base"
                data-tour="analyze-btn"
              >
                {analyzing ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block">⚙️</motion.span>
                    <span className="hidden sm:inline">AI Analyzing 300+ careers...</span>
                    <span className="sm:hidden">Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span> Discover My Career Path
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
