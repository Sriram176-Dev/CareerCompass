import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Authentication
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    resetToken: String,
    resetTokenExpiry: Date,

    // Profile
    name: { type: String, default: "" },
    user_type: { type: String, default: "school_student" },
    current_class: { type: String, default: null },
    institution: { type: String, default: null },
    city_tier: { type: String, default: null },
    board: { type: String, default: null },

    // Career data
    subjects: { type: mongoose.Schema.Types.Mixed, default: {} },
    selected_career_id: { type: Number, default: null },
    selected_career: { type: mongoose.Schema.Types.Mixed, default: null },
    saved_careers: { type: [Number], default: [] },
    analysis_result: { type: mongoose.Schema.Types.Mixed, default: null },

    // Quiz / onboarding
    interest_cards: { type: [String], default: [] },
    priority_ranking: { type: [String], default: [] },
    onboarding_complete: { type: Boolean, default: false },

    // Roadmap
    roadmap_data: { type: mongoose.Schema.Types.Mixed, default: null },
    roadmap_generated_at: { type: Date, default: null },
    completed_tasks: { type: [String], default: [] },

    // Quiz attempt history (feeds the Living Roadmap pulse + future match-quality feedback loop)
    quiz_attempts: {
      type: [
        {
          category: String,
          score: Number,
          total: Number,
          difficulty: String,
          timestamp: { type: String, default: () => new Date().toISOString() },
        },
      ],
      default: [],
    },

    // ─── Outcome logging (closes the loop on the Compass Fit Score) ─────────
    // The score's 45/35/20 blend is currently a fixed, unvalidated heuristic.
    // These two logs capture real behavioral signal — which career a student
    // actually picks relative to how it ranked, and how their Decision
    // Simulator choices aligned with that career — so a future analysis can
    // ask "did high-rule-score-low-AI-score careers get picked more or less
    // often than the score implies?" and adjust the weights with evidence
    // instead of guesswork. Nothing reads these yet; this is the
    // instrumentation layer that has to exist before that analysis can.
    career_selection_events: {
      type: [
        {
          careerId: mongoose.Schema.Types.Mixed,
          careerTitle: String,
          compassFitScore: Number,
          ruleScore: Number,
          aiScore: Number,
          semanticScore: Number,
          rankPosition: Number, // 1 = this was the #1 match when selected
          timestamp: { type: String, default: () => new Date().toISOString() },
        },
      ],
      default: [],
    },
    simulator_results: {
      type: [
        {
          careerId: mongoose.Schema.Types.Mixed,
          careerTitle: String,
          alignmentPct: Number,
          decisionsCount: Number,
          timestamp: { type: String, default: () => new Date().toISOString() },
        },
      ],
      default: [],
    },

    // Gamification
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    xp_today: { type: Number, default: 0 },
    last_xp_date: { type: String, default: null }, // e.g., "2026-03-30"


    // Chat sessions stored inline
    chat_sessions: {
      type: [
        {
          id: String,
          preview: String,
          created_at: String,
          messages: [
            {
              role: { type: String, enum: ["user", "assistant"] },
              content: String,
              timestamp: String,
            },
          ],
        },
      ],
      default: [],
    },

    // Bookmarked AI messages
    bookmarked_messages: { type: mongoose.Schema.Types.Mixed, default: [] },

    // Flashcard decks stored inline
    flashcard_decks: { type: mongoose.Schema.Types.Mixed, default: [] },

    // Saved exam names
    saved_exam_names: { type: [String], default: [] },

    // Daily check-in
    last_check_in: { type: String, default: null },
    streak: { type: Number, default: 0 },

    // Notifications
    notifications: {
      type: [
        {
          id: String,
          type: String,
          title: String,
          message: String,
          timestamp: String,
          read: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
