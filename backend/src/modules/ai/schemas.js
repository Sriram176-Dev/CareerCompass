import { z } from "zod";

// Kept intentionally permissive (.passthrough / optional-heavy) — the goal is
// to catch genuinely broken AI output (wrong types, missing required keys),
// not to police every cosmetic field, since Gemini's exact phrasing varies.

export const careerAnalysisSchema = z.object({
  topCareers: z
    .array(
      z.object({
        careerId: z.union([z.string(), z.number()]),
        matchScore: z.number().min(0).max(100),
        aiReason: z.string().min(1),
      })
    )
    .min(1),
  analysis: z
    .object({
      strengths: z.array(z.string()).default([]),
      workStyle: z.string().optional().default(""),
      recommendedStream: z.string().optional().default(""),
      keyInsight: z.string().optional().default(""),
    })
    .passthrough(),
});

export const roadmapSchema = z.object({
  overview: z.string().optional().default(""),
  milestones: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        title: z.string(),
        description: z.string().optional().default(""),
        duration: z.string().optional().default(""),
        tasks: z
          .array(
            z.object({
              id: z.union([z.string(), z.number()]),
              title: z.string(),
              description: z.string().optional().default(""),
              xp: z.number().optional().default(10),
              category: z.string().optional().default("general"),
            })
          )
          .default([]),
      })
    )
    .min(1),
  salaryJourney: z.any().optional(),
  indianResources: z.any().optional(),
  topRecruiters: z.any().optional(),
  commonMistakes: z.any().optional(),
});

export const flashcardsSchema = z.object({
  flashcards: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        front: z.string().min(1),
        back: z.string().min(1),
        category: z.string().optional().default("general"),
        difficulty: z.string().optional().default("medium"),
        hint: z.string().optional().default(""),
      })
    )
    .min(1),
});

export const resumeSchema = z.object({
  personalInfo: z.any(),
  objective: z.string().optional().default(""),
  education: z.any().optional(),
  skills: z.any().optional(),
  projects: z.any().optional(),
  certifications: z.any().optional(),
  achievements: z.any().optional(),
  languages: z.any().optional(),
});

export const quizSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        question: z.string().min(1),
        options: z.array(z.string()).min(2),
        correctIndex: z.number().int().min(0),
        explanation: z.string().optional().default(""),
        topic: z.string().optional().default(""),
        examRelevance: z.string().optional().default(""),
      })
    )
    .min(1),
});

export const studyNotesSchema = z.object({
  title: z.string(),
  summary: z.string().optional().default(""),
  keyPoints: z.array(z.string()).default([]),
  mnemonics: z.array(z.string()).default([]),
  formulas: z.array(z.string()).default([]),
  examQuestions: z.array(z.string()).default([]),
  resources: z.array(z.string()).default([]),
});

export const summarizeSchema = z.object({
  title: z.string(),
  overview: z.string().optional().default(""),
  keyPoints: z.array(z.string()).default([]),
  examQuestions: z.array(z.string()).default([]),
  sections: z.array(z.any()).default([]),
  statistics: z.array(z.any()).default([]),
  conclusions: z.array(z.string()).default([]),
  flashcardSuggestions: z.array(z.any()).default([]),
});

export const interviewQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        question: z.string(),
        category: z.string().optional().default("general"),
        modelAnswer: z.string().optional().default(""),
        tips: z.string().optional().default(""),
        followUp: z.string().optional().default(""),
      })
    )
    .min(1),
  generalTips: z.array(z.string()).default([]),
  dresscode: z.string().optional().default(""),
  salaryNegotiation: z.string().optional().default(""),
});

export const salaryInsightsSchema = z.object({
  role: z.string(),
  salaryRanges: z.any(),
  topPayingCities: z.array(z.any()).default([]),
  topCompanies: z.array(z.any()).default([]),
  skillPremiums: z.array(z.any()).default([]),
  growthTrajectory: z.any().optional(),
  marketTrend: z.string().optional().default(""),
  tips: z.array(z.string()).default([]),
});

export const careerNewsSchema = z.object({
  trends: z.array(z.any()).default([]),
  opportunities: z.array(z.any()).default([]),
  topRecruiters: z.array(z.any()).default([]),
  emergingSkills: z.array(z.any()).default([]),
  governmentInitiatives: z.array(z.any()).default([]),
  examAlerts: z.array(z.any()).default([]),
});

export const studyPlanSchema = z.object({
  weeklySchedule: z.array(z.any()).default([]),
  subjectAllocation: z.array(z.any()).default([]),
  milestones: z.array(z.any()).default([]),
  resources: z.array(z.any()).default([]),
  revisionStrategy: z.any().optional(),
  mockTestSchedule: z.any().optional(),
});

// ─── Decision Simulator ("day in the life", branching decisions) ────────────
export const decisionSimulatorSchema = z.object({
  scenario: z.string().min(1), // one-line framing, e.g. "Your first week as a Software Engineer at a fast-growing startup"
  decisions: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        situation: z.string().min(1), // the moment the student must respond to
        options: z
          .array(
            z.object({
              id: z.union([z.string(), z.number()]),
              text: z.string().min(1),
              consequence: z.string().min(1), // what happens next, in-world
              // Whether this choice reflects how professionals in this career actually tend to operate day-to-day.
              alignsWithCareer: z.boolean(),
            })
          )
          .min(2),
      })
    )
    .min(3)
    .max(5),
  reflectionPrompt: z.string().optional().default(""), // shown after all decisions, ties choices back to career fit
});

// ─── Living Roadmap: AI-suggested rebalance when a student falls behind ─────
export const roadmapRebalanceSchema = z.object({
  message: z.string().min(1), // short, encouraging, specific to what's behind
  supportTasks: z
    .array(
      z.object({
        id: z.union([z.string(), z.number()]),
        title: z.string(),
        description: z.string().optional().default(""),
        xp: z.number().optional().default(15),
        category: z.string().optional().default("catch-up"),
      })
    )
    .min(1)
    .max(4),
});
