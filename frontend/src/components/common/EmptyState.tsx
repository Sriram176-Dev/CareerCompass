import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export type EmptyStateType =
  | "noResults"
  | "noFlashcards"
  | "noCareer"
  | "noBadges"
  | "noDocuments"
  | "noChat";

const CONFIGS: Record<EmptyStateType, { icon: string; title: string; description: string; action: string | null; route?: string }> = {
  noResults: {
    icon: "🔍",
    title: "No careers match this filter",
    description: "Try a different category or clear your search",
    action: "Clear Filters",
  },
  noFlashcards: {
    icon: "🃏",
    title: "No flashcard decks yet",
    description: "Generate your first deck to start studying for your career",
    action: "Create First Deck",
  },
  noCareer: {
    icon: "🎯",
    title: "You haven't selected a career yet",
    description: "Take the quiz to discover your perfect career match",
    action: "Take Career Quiz",
    route: "/quiz",
  },
  noBadges: {
    icon: "🏅",
    title: "No badges earned yet",
    description: "Complete tasks and study sessions to earn your first badge",
    action: "View Roadmap",
    route: "/roadmap",
  },
  noDocuments: {
    icon: "📄",
    title: "No documents summarized yet",
    description: "Upload a PDF to get AI-powered summaries and study guides",
    action: "Upload PDF",
  },
  noChat: {
    icon: "💬",
    title: "Start a conversation",
    description: "Ask Compass AI anything about your career path, exams, or studies",
    action: null,
  },
};

interface EmptyStateProps {
  type: EmptyStateType;
  onAction?: () => void;
}

export default function EmptyState({ type, onAction }: EmptyStateProps) {
  const navigate = useNavigate();
  const config = CONFIGS[type];

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (config.route) {
      navigate(config.route);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="text-6xl mb-4"
      >
        {config.icon}
      </motion.div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{config.title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">{config.description}</p>
      {config.action && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleAction}
          className="btn-primary text-sm"
        >
          {config.action}
        </motion.button>
      )}
    </motion.div>
  );
}
