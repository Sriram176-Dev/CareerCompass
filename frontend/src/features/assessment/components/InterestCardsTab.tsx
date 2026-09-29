import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { INTEREST_CARDS } from "@/data/interestCards";
import { SparkleEffect } from "@/components/common/SparkleEffect";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  selectedCards: string[];
  onToggleCard: (id: string) => void;
  liveMatches: { title: string; score: number }[];
}

const CATEGORY_ORDER = ["Activities", "Subjects", "Personality", "Dreams"];
const CATEGORY_ICONS: Record<string, string> = {
  Activities: "🎯",
  Subjects: "📚",
  Personality: "🧠",
  Dreams: "💭",
};
const CATEGORY_DESC: Record<string, string> = {
  Activities: "What do you enjoy doing in your free time?",
  Subjects: "Which subjects interest you the most?",
  Personality: "What describes your personality best?",
  Dreams: "What's your dream career scenario?",
};

export default function InterestCardsTab({ selectedCards, onToggleCard, liveMatches }: Props) {
  const [categoryStep, setCategoryStep] = useState(0);
  const [sparkleCard, setSparkleCard] = useState<string | null>(null);

  const currentCategory = CATEGORY_ORDER[categoryStep];

  const cardsInCategory = useMemo(
    () => INTEREST_CARDS.filter(c => c.category === currentCategory),
    [currentCategory]
  );

  const selectedInCategory = useMemo(
    () => selectedCards.filter(id => cardsInCategory.some(c => c.id === id)).length,
    [selectedCards, cardsInCategory]
  );

  const handleToggle = (id: string) => {
    const isSelecting = !selectedCards.includes(id);
    onToggleCard(id);
    if (isSelecting) {
      setSparkleCard(id);
      setTimeout(() => setSparkleCard(null), 700);
    }
  };

  const canGoNext = categoryStep < CATEGORY_ORDER.length - 1;
  const canGoBack = categoryStep > 0;

  return (
    <div>
      {/* Category stepper */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {CATEGORY_ORDER.map((cat, i) => {
          const count = selectedCards.filter(id => INTEREST_CARDS.find(c => c.id === id)?.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setCategoryStep(i)}
              className={`flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                categoryStep === i
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : count > 0
                    ? "border border-primary/40 text-primary bg-primary/5"
                    : "border border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {CATEGORY_ICONS[cat]} {cat}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  categoryStep === i ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/15 text-primary"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Category header */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCategory}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              {CATEGORY_ICONS[currentCategory]} {currentCategory}
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{cardsInCategory.length}</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{CATEGORY_DESC[currentCategory]}</p>
            <p className="text-xs text-primary mt-1">{selectedInCategory} selected in this section</p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {cardsInCategory.map(card => {
              const isSelected = selectedCards.includes(card.id);
              return (
                <motion.button
                  key={card.id}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  onClick={() => handleToggle(card.id)}
                  className={`relative flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-all duration-200 ${
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground shadow-sm shadow-primary/10"
                      : "border-border text-muted-foreground hover:border-border-hover"
                  }`}
                >
                  <SparkleEffect trigger={sparkleCard === card.id} />
                  <span className="text-base">{card.icon}</span>
                  <span className="truncate text-xs sm:text-sm">{card.label}</span>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground"
                      >
                        ✓
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          {/* Navigation buttons */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setCategoryStep(s => s - 1)}
              disabled={!canGoBack}
              className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>

            <div className="flex gap-1.5">
              {CATEGORY_ORDER.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                    i === categoryStep ? "bg-primary" : i < categoryStep ? "bg-primary/40" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setCategoryStep(s => s + 1)}
              disabled={!canGoNext}
              className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Total selection summary */}
      <div className="mt-6 rounded-xl border border-border bg-card p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-bold text-primary text-lg">{selectedCards.length}</span> cards selected
            {selectedCards.length < 5 && <span className="ml-1 text-xs text-destructive">• need {5 - selectedCards.length} more</span>}
          </p>
        </div>
        {selectedCards.length > 0 && (
          <div className="flex gap-1">
            {selectedCards.slice(-6).map(id => {
              const card = INTEREST_CARDS.find(c => c.id === id);
              return card ? <span key={id} className="text-sm" title={card.label}>{card.icon}</span> : null;
            })}
            {selectedCards.length > 6 && <span className="text-xs text-muted-foreground">+{selectedCards.length - 6}</span>}
          </div>
        )}
      </div>

      {/* Live preview floating bar */}
      <AnimatePresence>
        {liveMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-full border border-primary/30 bg-card/95 backdrop-blur-md px-5 py-3 shadow-lg shadow-black/20"
          >
            <span className="text-xs text-primary font-medium">🔮 Matching:</span>
            {liveMatches.slice(0, 4).map(m => (
              <span key={m.title} className="text-xs text-muted-foreground">
                {m.title} <span className="text-primary font-bold">{m.score}%</span>
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
