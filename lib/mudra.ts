export type HealthMetrics = {
  heartRate: number;
  spo2: number;
  stress: number;
  activity: number;
};

export type MudraItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  benefits: string[];
  difficulty: "Easy" | "Medium" | "Advanced";
  duration: string;
  color: string;
  icon: string;
  howTo: string[];
  referenceMeasurements: {
    distances: Array<{ label: string; value: number; unit: "palm" }>;
    angles: Array<{ label: string; value: number; unit: "deg" }>;
  };
};

export type Recommendation = {
  id: string;
  mudra: string;
  score: number;
  duration: string;
  benefits: string[];
  routine: string;
  reason: string;
  color: string;
};

function seededValue(seed: string, offset: number) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index) + offset) % 100000;
  }
  return hash / 100000;
}

export function getMudraLibrary(): MudraItem[] {
  return [
    {
      id: "gyan",
      name: "Gyan Mudra",
      slug: "gyan-mudra",
      description: "Improves focus, calmness, and mental clarity.",
      benefits: ["Focus", "Mind calmness", "Meditation support"],
      difficulty: "Easy",
      duration: "5-10 mins",
      color: "#22c55e",
      icon: "◌",
      howTo: ["Touch the index fingertip to the thumb tip.", "Keep the other fingers comfortably extended.", "Rest the hands on the knees during practice."],
      referenceMeasurements: {
        distances: [
          { label: "Thumb-Index tip", value: 0.15, unit: "palm" },
          { label: "Index-Middle tip gap", value: 0.32, unit: "palm" },
          { label: "Ring-Little tip gap", value: 0.36, unit: "palm" },
        ],
        angles: [
          { label: "Index-Middle", value: 16, unit: "deg" },
          { label: "Middle-Ring", value: 22, unit: "deg" },
          { label: "Ring-Little", value: 27, unit: "deg" },
        ],
      },
    },
    {
      id: "prana",
      name: "Prana Mudra",
      slug: "prana-mudra",
      description: "Supports vitality, recovery, and energy balance.",
      benefits: ["Energy", "Vitality", "Recovery"],
      difficulty: "Easy",
      duration: "5-12 mins",
      color: "#14b8a6",
      icon: "◉",
      howTo: ["Touch the ring and little fingertips to the thumb tip.", "Keep index and middle fingers relaxed.", "Breathe slowly while holding the gesture."],
      referenceMeasurements: {
        distances: [
          { label: "Thumb-Ring tip", value: 0.16, unit: "palm" },
          { label: "Thumb-Little tip", value: 0.14, unit: "palm" },
          { label: "Index-Middle tip gap", value: 0.24, unit: "palm" },
        ],
        angles: [
          { label: "Index-Middle", value: 14, unit: "deg" },
          { label: "Middle-Ring", value: 19, unit: "deg" },
          { label: "Ring-Little", value: 27, unit: "deg" },
        ],
      },
    },
    {
      id: "apana",
      name: "Apana Mudra",
      slug: "apana-mudra",
      description: "Used for grounding, digestion, and stress release.",
      benefits: ["Stress reduction", "Grounding", "Digestive support"],
      difficulty: "Medium",
      duration: "7-15 mins",
      color: "#10b981",
      icon: "◍",
      howTo: ["Join the thumb with the middle and ring fingertips.", "Keep the other fingers extended but relaxed.", "Practice with upright posture."],
      referenceMeasurements: {
        distances: [
          { label: "Thumb-Middle tip", value: 0.17, unit: "palm" },
          { label: "Thumb-Ring tip", value: 0.15, unit: "palm" },
          { label: "Ring-Little tip gap", value: 0.27, unit: "palm" },
        ],
        angles: [
          { label: "Index-Middle", value: 21, unit: "deg" },
          { label: "Middle-Ring", value: 17, unit: "deg" },
          { label: "Ring-Little", value: 25, unit: "deg" },
        ],
      },
    },
    {
      id: "surya",
      name: "Surya Mudra",
      slug: "surya-mudra",
      description: "Traditionally linked with warmth, metabolism, and activation.",
      benefits: ["Energy boost", "Metabolic support", "Warmth"],
      difficulty: "Medium",
      duration: "5-10 mins",
      color: "#f59e0b",
      icon: "☼",
      howTo: ["Bend the ring finger and press it with the thumb.", "Keep the other fingers straight.", "Use it in short sessions for an energizing routine."],
      referenceMeasurements: {
        distances: [
          { label: "Thumb-Ring tip", value: 0.13, unit: "palm" },
          { label: "Index-Middle tip gap", value: 0.29, unit: "palm" },
          { label: "Middle-Ring tip gap", value: 0.21, unit: "palm" },
        ],
        angles: [
          { label: "Index-Middle", value: 18, unit: "deg" },
          { label: "Middle-Ring", value: 14, unit: "deg" },
          { label: "Ring-Little", value: 23, unit: "deg" },
        ],
      },
    },
    {
      id: "vayu",
      name: "Vayu Mudra",
      slug: "vayu-mudra",
      description: "Commonly used for balance, mobility, and lightness.",
      benefits: ["Body balance", "Mobility", "Comfort"],
      difficulty: "Advanced",
      duration: "5-8 mins",
      color: "#38bdf8",
      icon: "✦",
      howTo: ["Fold the index finger to the base of the thumb.", "Press gently with the thumb tip.", "Keep the other fingers comfortably straight."],
      referenceMeasurements: {
        distances: [
          { label: "Thumb-Index tip", value: 0.11, unit: "palm" },
          { label: "Middle-Ring tip gap", value: 0.31, unit: "palm" },
          { label: "Ring-Little tip gap", value: 0.34, unit: "palm" },
        ],
        angles: [
          { label: "Index-Middle", value: 12, unit: "deg" },
          { label: "Middle-Ring", value: 24, unit: "deg" },
          { label: "Ring-Little", value: 28, unit: "deg" },
        ],
      },
    },
  ];
}

export function buildRecommendations(metrics: HealthMetrics, goal?: string): Recommendation[] {
  const baseScore = Math.round((100 - metrics.stress * 0.65 - Math.max(metrics.heartRate - 75, 0) * 0.4 + (metrics.spo2 - 94) * 1.2) / 1.1);

  const options: Recommendation[] = [
    {
      id: "rec-1",
      mudra: "Gyan Mudra",
      score: clampScore(baseScore + 8),
      duration: "8 minutes",
      benefits: ["Improves focus", "Helps mental clarity"],
      routine: "Sit quietly, hold Gyan Mudra, and breathe in for 4 counts and out for 6 counts.",
      reason: goal?.toLowerCase().includes("focus") ? "Matches your focus goal." : "Balanced option for mental calm.",
      color: "#22c55e",
    },
    {
      id: "rec-2",
      mudra: "Apana Mudra",
      score: clampScore(baseScore + 3 - metrics.stress * 0.2),
      duration: "10 minutes",
      benefits: ["Reduces stress", "Supports grounding"],
      routine: "Practice after sitting upright for 2 minutes of slow nasal breathing.",
      reason: metrics.stress >= 60 ? "Good match for elevated stress." : "Useful for grounding and recovery.",
      color: "#10b981",
    },
    {
      id: "rec-3",
      mudra: "Prana Mudra",
      score: clampScore(baseScore + 2 + Math.max(96 - metrics.spo2, 0) * 0.8),
      duration: "6 minutes",
      benefits: ["Boosts vitality", "Supports energy"],
      routine: "Use during a short afternoon reset with a 1:2 inhale-to-exhale rhythm.",
      reason: metrics.activity < 40 ? "Can support low-energy moments." : "Good for short energetic resets.",
      color: "#14b8a6",
    },
  ];

  if (goal?.toLowerCase().includes("energy")) {
    options.sort((a, b) => Number(b.mudra === "Prana Mudra") - Number(a.mudra === "Prana Mudra"));
  }

  return options.sort((a, b) => b.score - a.score);
}

export function generateMetrics(seed: string): HealthMetrics {
  const heartRate = Math.round(68 + seededValue(seed, 3) * 22 + seededValue(seed, 11) * 8);
  const spo2 = Math.round(95 + seededValue(seed, 5) * 4);
  const stress = Math.round(28 + seededValue(seed, 7) * 54);
  const activity = Math.round(35 + seededValue(seed, 13) * 60);

  return {
    heartRate,
    spo2,
    stress,
    activity,
  };
}

export function generateWeeklyProgress(seed: string) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.map((label, index) => ({
    label,
    value: Math.round(45 + seededValue(seed, index + 1) * 50),
  }));
}

export function generateRecentSessions(seed: string) {
  const mudras = ["Gyan Mudra", "Prana Mudra", "Apana Mudra", "Surya Mudra"];
  return Array.from({ length: 4 }, (_, index) => {
    const mudra = mudras[(index + Math.floor(seededValue(seed, index + 9) * mudras.length)) % mudras.length];
    return {
      id: `session-${index}`,
      mudra,
      duration: `${6 + index * 2} min`,
      score: Math.round(72 + seededValue(seed, index + 17) * 20),
      time: `${index + 1}h ago`,
    };
  });
}

export function generateAchievements(seed: string) {
  const all = [
    { name: "Consistency Star", description: "Completed 5 guided sessions.", unlocked: seededValue(seed, 21) > 0.35 },
    { name: "Calm Streak", description: "Kept stress under control for 3 days.", unlocked: seededValue(seed, 31) > 0.45 },
    { name: "Morning Routine", description: "Practiced before 9 AM.", unlocked: seededValue(seed, 41) > 0.55 },
  ];

  return all;
}

export function assistantReply(message: string) {
  const text = message.toLowerCase();

  if (text.includes("stress") || text.includes("anxious") || text.includes("pressure")) {
    return {
      mudra: "Apana Mudra",
      response:
        "Apana Mudra is a good match for stress. Join the thumb with the middle and ring fingertips, keep the other fingers relaxed, and practice for 10 minutes with slow exhale-focused breathing.",
      benefits: ["Stress relief", "Grounding", "Calmer breathing"],
    };
  }

  if (text.includes("tired") || text.includes("low energy") || text.includes("weak")) {
    return {
      mudra: "Prana Mudra",
      response:
        "Prana Mudra can help with low-energy moments. Touch the ring and little fingertips to the thumb, keep the index and middle fingers relaxed, and use it for 6 minutes with steady breathing.",
      benefits: ["Energy support", "Vitality", "Short reset"],
    };
  }

  if (text.includes("focus") || text.includes("study") || text.includes("attention")) {
    return {
      mudra: "Gyan Mudra",
      response:
        "Gyan Mudra is a good fit for focus and clarity. Touch the index fingertip to the thumb tip and hold for 8 minutes during quiet breathing.",
      benefits: ["Focus", "Mental clarity", "Meditation"],
    };
  }

  return {
    mudra: "Gyan Mudra",
    response:
      "If you are not sure, begin with Gyan Mudra for a balanced practice. It is a simple mudra for concentration and calmness, and it works well as a daily baseline.",
    benefits: ["Balanced calm", "Focus", "Daily practice"],
  };
}

function clampScore(value: number) {
  return Math.max(60, Math.min(98, Math.round(value)));
}
