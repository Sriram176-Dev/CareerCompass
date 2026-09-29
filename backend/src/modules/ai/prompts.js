import { sanitizeInput } from "../../services/geminiService.js";

export function chatSystemPrompt(userProfile) {
  return `You are "Compass AI" — India's most knowledgeable and empathetic career counselor.

${
  userProfile
    ? `STUDENT PROFILE:
- Name: ${userProfile.name || "Student"}
- Career goal: ${userProfile.career || "Not selected yet"}
- User type: ${userProfile.userType || "Student"}
- Level: ${userProfile.level || 1}
${userProfile.streak != null ? `- Current study streak: ${userProfile.streak} day(s)` : ""}
${userProfile.roadmapProgressPct != null ? `- Roadmap progress: ${userProfile.roadmapProgressPct}% of tasks completed` : "- Hasn't started a roadmap yet"}
${userProfile.weakCategories?.length ? `- Recently struggling with: ${userProfile.weakCategories.join(", ")} (bring this up gently if relevant, don't lecture)` : ""}
${userProfile.lastSessionPreview ? `- What you last talked about together: "${userProfile.lastSessionPreview}" — pick up the thread naturally if it's still relevant, don't just repeat it back` : ""}`
    : ""
}

YOUR PERSONALITY:
- Warm, encouraging, knowledgeable about Indian education (JEE, NEET, UPSC, etc.)
- You remember this student's actual journey — reference their real progress/struggles when it's genuinely relevant, don't force it into every reply.
- Specific, actionable advice.

RESPONSE FORMAT:
- Use markdown.
- End with 2-3 follow-up question suggestions prefixed with >>>`;
}

export function careerAnalysisPrompt({ interestCards, priorityRanking, scenarioAnswers, userDescription, userProfile, topCareers }) {
  const careerList = (topCareers || []).map((c) => `${c.id}: ${c.title}`).join("\n");
  return `Student Career Quiz Analysis.
STUDENT DATA:
- Interests: ${JSON.stringify(interestCards)}
- Priorities: ${JSON.stringify(priorityRanking)}
- Scenarios: ${JSON.stringify(scenarioAnswers)}
- Words: "${sanitizeInput(userDescription, 500)}"
- Profile: ${JSON.stringify(userProfile)}

CANDIDATE LIST (already pre-filtered by rule-based interest/priority matching — re-rank and explain, don't invent new careers):
${careerList}

TASK: Re-rank these and return JSON: { topCareers: [{ careerId, matchScore, aiReason }], analysis: { strengths[], workStyle, recommendedStream, keyInsight } }`;
}

export function roadmapPrompt({ career, userProfile }) {
  return `Create a 4-6 phase Indian career roadmap for ${career.title}. Profile: ${JSON.stringify(
    userProfile
  )}. Return JSON: { overview, milestones: [{ id, title, description, duration, tasks: [{ id, title, description, xp, category }] }], salaryJourney, indianResources, topRecruiters, commonMistakes }`;
}

export function flashcardsPrompt({ topic, content, count = 15 }) {
  return `Generate ${count} flashcards for ${sanitizeInput(topic, 100)}. Content: ${sanitizeInput(
    content,
    4000
  )}. Return JSON: { flashcards: [{ id, front, back, category, difficulty, hint }] }`;
}

export function resumePrompt({ userProfile, completedTasks, career }) {
  return `Tailor a resume for ${career?.title}. Profile: ${JSON.stringify(userProfile)}. Tasks: ${JSON.stringify(
    completedTasks
  )}. Return JSON: { personalInfo, objective, education, skills, projects, certifications, achievements, languages }`;
}

export function dailyQuizPrompt({ career, topic, count = 5 }) {
  return `Generate ${count} MCQs for ${topic || career}. Return JSON: { questions: [{ id, question, options[], correctIndex, explanation, topic, examRelevance }] }`;
}

export function studyNotesPrompt({ topic, content }) {
  return `Study notes for ${topic}. Content: ${sanitizeInput(
    content,
    4000
  )}. Return JSON: { title, summary, keyPoints[], mnemonics[], formulas[], examQuestions[], resources[] }`;
}

export function summarizePrompt({ content, filename }) {
  return `Summarize ${filename}. Content: ${sanitizeInput(
    content,
    20000
  )}. Return JSON: { title, overview, keyPoints[], examQuestions[], sections[], statistics[], conclusions[], flashcardSuggestions[] }`;
}

export function careerToolPrompt(tool, params) {
  switch (tool) {
    case "interview-questions":
      return `10 Interview questions for ${params.career}. Return JSON: { questions: [{ id, question, category, modelAnswer, tips, followUp }], generalTips[], dresscode, salaryNegotiation }`;
    case "salary-insights":
      return `Salary trends in India for ${params.career} in ${params.city}. Return JSON: { role, salaryRanges, topPayingCities[], topCompanies[], skillPremiums[], growthTrajectory, marketTrend, tips[] }`;
    case "career-news":
      return `Recent field news for ${params.career}. Return JSON: { trends[], opportunities[], topRecruiters[], emergingSkills[], governmentInitiatives[], examAlerts[] }`;
    case "study-plan":
      return `Study plan for ${params.career}. Months: ${params.months || 6}. Return JSON: { weeklySchedule[], subjectAllocation[], milestones[], resources[], revisionStrategy, mockTestSchedule }`;
    case "decision-simulator":
      return decisionSimulatorPrompt(params);
    case "roadmap-rebalance":
      return roadmapRebalancePrompt(params);
    default:
      return null;
  }
}

// ─── A. Decision Simulator ────────────────────────────────────────────────
// Replaces "pick your interests" with "make a realistic decision under
// pressure" — fit is inferred from what the student actually chooses in a
// simulated day at the job, not from self-reported preference checkboxes.
export function decisionSimulatorPrompt({ career, workStyle, environment, skills }) {
  return `Design a realistic "day in the life" branching decision simulation for the career: ${career}.
Context: work style is "${workStyle || "unspecified"}", typical environment is "${environment || "unspecified"}", core skills used: ${(skills || []).join(", ") || "unspecified"}.

Write exactly 4 sequential decision points a real early-career professional in this role would face in a single representative day (e.g. a technical/creative/ethical trade-off, a time-pressure moment, a collaboration/conflict moment, a growth/learning moment). For EACH decision point give 2-3 realistic options.

For each option:
- Write what actually happens next as a direct consequence (2-3 sentences, concrete, no moralizing).
- Mark "alignsWithCareer": true only for the option(s) that reflect how professionals in this specific career genuinely tend to operate day-to-day (not simply "the correct" or "nicest" choice — real professionals in different careers would choose differently here).

Do NOT make the "aligned" option obviously the best one — realistic trade-offs, not a morality test.

Return JSON: { scenario, decisions: [{ id, situation, options: [{ id, text, consequence, alignsWithCareer }] }], reflectionPrompt }`;
}

// ─── C. Living Roadmap rebalance ──────────────────────────────────────────
// Called only when a student's pace/quiz signals show they're falling
// behind — turns the static roadmap into something that reacts.
export function roadmapRebalancePrompt({ career, currentMilestone, completedRatio, recentQuizAverage, weakCategories }) {
  return `A student following a career roadmap toward "${career}" is falling behind pace.
Current milestone: ${currentMilestone || "unspecified"}.
Roadmap completion so far: ${Math.round((completedRatio || 0) * 100)}%.
Recent quiz average: ${recentQuizAverage != null ? Math.round(recentQuizAverage * 100) + "%" : "no recent quiz data"}.
Weaker quiz categories recently: ${(weakCategories || []).join(", ") || "none flagged"}.

Write one short, specific, encouraging message (2-3 sentences, no generic pep talk) that names what's actually behind and why it matters for reaching ${career}. Then suggest 2-4 small, concrete catch-up tasks (each doable in under an hour) that would help most right now given the weak areas above.

Return JSON: { message, supportTasks: [{ id, title, description, xp, category }] }`;
}
