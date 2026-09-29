import { motion } from "framer-motion";
import { MessageSquare, Lightbulb } from "lucide-react";

interface Props {
  textInput: string;
  setTextInput: (value: string) => void;
}

const PROMPTS = [
  "I want to crack NEET and become a doctor like my father",
  "I love coding and want to build the next Flipkart",
  "I'm interested in government services like IAS/IPS",
  "I want to combine my love for art with technology",
  "I'm confused between engineering and medical",
];

export default function TellAITab({ textInput, setTextInput }: Props) {
  const charCount = textInput.length;
  const isReady = charCount >= 30;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Tell AI About Your Dreams</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Write freely about what excites you, your career goals, or what confuses you. The AI uses this for personalized recommendations.
        </p>
      </div>

      <div className="relative">
        <textarea
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          rows={6}
          placeholder="Write about your career dreams, interests, and goals..."
          className="w-full rounded-xl border border-border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className={`text-xs font-medium ${isReady ? 'text-success' : 'text-muted-foreground'}`}>
            {charCount}/30 min
          </span>
          {isReady && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-success text-sm">✓</motion.span>
          )}
        </div>
      </div>

      {/* Quick prompts */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-3.5 w-3.5 text-warning" />
          <span className="text-xs font-medium text-muted-foreground">Not sure what to write? Try these:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((prompt, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setTextInput(prompt)}
              className="rounded-lg border border-border bg-card/50 px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all duration-200"
            >
              "{prompt.slice(0, 40)}..."
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
