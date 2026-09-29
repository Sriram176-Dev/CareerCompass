// Turns raw quiz data into plain text suitable for embedding. Kept separate
// from prompts.js because this text is consumed by the embedding model, not
// the generative model — different constraints (no instructions, just
// descriptive content for similarity comparison).

function humanize(id) {
  return typeof id === "string" ? id.replace(/-/g, " ") : id;
}

/** The user's free text is the strongest, most specific signal — lead with it. */
export function buildUserSemanticText({ interestCards, userDescription, priorityRanking }) {
  const interests = (interestCards || []).map(humanize).join(", ");
  const priorities = (priorityRanking || []).map(humanize).join(", ");
  return [
    userDescription?.trim() ? `In their own words: ${userDescription.trim()}` : "",
    interests ? `Interests: ${interests}` : "",
    priorities ? `What matters most to them, in order: ${priorities}` : "",
  ]
    .filter(Boolean)
    .join(". ");
}

/** Frontend sends these fields already (from data/careers.ts) — no backend duplication needed. */
export function buildCareerSemanticText(career) {
  return [
    career.title,
    career.cat,
    career.desc,
    Array.isArray(career.skills) && career.skills.length ? `Skills used: ${career.skills.join(", ")}` : "",
    Array.isArray(career.strongKeywords) && career.strongKeywords.length
      ? `Closely related to: ${career.strongKeywords.map(humanize).join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join(". ");
}
