// Shared demo dataset for the Design Lab. All 6 directions render the same
// data through different layouts — never duplicate or diverge the numbers,
// only the composition changes.

export const LAB_DATA = {
  fighter: "Fighter",
  readiness: 78,
  streakDays: 12,
  sessionsTotal: 48,
  masteryAvg: 63,
  activeGoals: 3,
  focus: "Cage exit → lead hook → level change",
  todaySession: { skill: "Grappling", minutes: 45 },
  skills: [
    { name: "Striking", value: 74, trend: "+4%" },
    { name: "Wrestling", value: 61, trend: "+2%" },
    { name: "Grappling", value: 83, trend: "+6%" },
    { name: "MMA IQ", value: 68, trend: "+1%" },
  ],
  weekBars: [62, 80, 45, 90, 70, 55, 85],
  camp: {
    name: "Camp 04 — Build the complete fighter",
    day: 18,
    totalDays: 42,
    milestone: "Advanced clinch",
    milestoneProgress: "3/5",
    quote: "Discipline today. Freedom tomorrow.",
  },
  week: [
    { day: "Mon", label: "Striking", done: true },
    { day: "Tue", label: "Rest", done: true },
    { day: "Wed", label: "Wrestling", done: false },
    { day: "Thu", label: "Grappling", done: false },
    { day: "Fri", label: "MMA", done: false },
  ],
  strugglingWith: {
    skill: "Guard retention",
    sessions: 3,
    observations: 7,
    failedAttempts: 2,
  },
  technique: {
    name: "Knee Cut Pass",
    position: "Half Guard",
    concepts: ["Inside position", "Underhook", "Hip pressure"],
    prerequisites: ["Half guard control"],
    followUps: ["Mount", "Crossface", "Back step"],
    related: ["Underhook Pass", "Back Step", "Smash Pass"],
  },
  studyQueue: [
    { name: "Knee Cut Pass", status: "learn" },
    { name: "Back Step", status: "drill" },
    { name: "Smash Pass", status: "review" },
  ],
  trainingLoad: [40, 65, 55, 80, 60, 70, 50],
  journal: {
    date: "12 Apr 2025",
    text:
      "Good session today. Felt better with my level change. Need to work on my hand fighting. Still getting countered on the cage. Focus next week: more clinch work.",
    tags: ["#striking", "#clinch", "#progress"],
    quote: "Small steps build champions.",
  },
  recentEntries: [
    { date: "12 Apr", label: "Cage wrestling — Progress" },
    { date: "10 Apr", label: "Sparring — Tough session" },
    { date: "08 Apr", label: "Guard retention — Key lesson" },
    { date: "05 Apr", label: "Striking — Good rhythm" },
  ],
} as const;
