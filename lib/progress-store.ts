export type PracticeSession = {
  id: string;
  mudra: string;
  score: number;
  durationMinutes: number;
  completedAt: number;
};

export type PracticeProgressState = {
  sessions: PracticeSession[];
};

export type DashboardViewModel = {
  hasData: boolean;
  metrics: {
    heartRate: number;
    spo2: number;
    stress: number;
    activity: number;
  } | null;
  weeklyProgress: Array<{ label: string; value: number }>;
  recentSessions: Array<{
    id: string;
    mudra: string;
    duration: string;
    score: number;
    time: string;
  }>;
};

const STORAGE_KEY = "mudrahealth.progress.v1";
const UPDATE_EVENT = "mudrahealth:progress-updated";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const EMPTY_STATE: PracticeProgressState = {
  sessions: [],
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getSafeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeSession(session: Partial<PracticeSession>): PracticeSession {
  const completedAt = getSafeNumber(session.completedAt, Date.now());
  const mudra = typeof session.mudra === "string" && session.mudra.trim() ? session.mudra : "Unknown Mudra";

  return {
    id: typeof session.id === "string" && session.id ? session.id : `${completedAt}-${Math.random().toString(36).slice(2, 8)}`,
    mudra,
    score: clamp(Math.round(getSafeNumber(session.score, 0)), 0, 100),
    durationMinutes: clamp(Math.round(getSafeNumber(session.durationMinutes, 1)), 1, 120),
    completedAt,
  };
}

function saveState(state: PracticeProgressState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

function getDayIndex(date: Date) {
  const sundayFirst = date.getDay();
  return sundayFirst === 0 ? 6 : sundayFirst - 1;
}

function formatRelativeTime(timestamp: number) {
  const deltaSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (deltaSeconds < 60) {
    return "just now";
  }

  const deltaMinutes = Math.floor(deltaSeconds / 60);
  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) {
    return `${deltaHours}h ago`;
  }

  const deltaDays = Math.floor(deltaHours / 24);
  return `${deltaDays}d ago`;
}

export function loadPracticeProgress(): PracticeProgressState {
  if (typeof window === "undefined") {
    return EMPTY_STATE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<PracticeProgressState>;
    if (!Array.isArray(parsed.sessions)) {
      return EMPTY_STATE;
    }

    return {
      sessions: parsed.sessions.map((session) => normalizeSession(session)),
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function clearPracticeProgress() {
  saveState(EMPTY_STATE);
}

export function recordPracticeSession(input: {
  mudra: string;
  score: number;
  durationMinutes: number;
  completedAt?: number;
}) {
  const current = loadPracticeProgress();
  const nextSession = normalizeSession({
    mudra: input.mudra,
    score: input.score,
    durationMinutes: input.durationMinutes,
    completedAt: input.completedAt ?? Date.now(),
  });

  const sessions = [nextSession, ...current.sessions].slice(0, 64);
  saveState({ sessions });
  return nextSession;
}

export function subscribePracticeProgress(listener: (state: PracticeProgressState) => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onUpdate = () => {
    listener(loadPracticeProgress());
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onUpdate();
    }
  };

  window.addEventListener(UPDATE_EVENT, onUpdate as EventListener);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(UPDATE_EVENT, onUpdate as EventListener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getAverageScoreByMudra(state: PracticeProgressState) {
  const aggregate = new Map<string, { sum: number; count: number }>();

  state.sessions.forEach((session) => {
    const key = session.mudra.toLowerCase();
    const existing = aggregate.get(key) ?? { sum: 0, count: 0 };
    aggregate.set(key, {
      sum: existing.sum + session.score,
      count: existing.count + 1,
    });
  });

  const averages = new Map<string, number>();
  aggregate.forEach((value, key) => {
    averages.set(key, Math.round(value.sum / value.count));
  });

  return averages;
}

export function deriveDashboardViewModel(state: PracticeProgressState, liveTick: number): DashboardViewModel {
  if (state.sessions.length === 0) {
    return {
      hasData: false,
      metrics: null,
      weeklyProgress: DAY_LABELS.map((label) => ({ label, value: 0 })),
      recentSessions: [],
    };
  }

  const totalMinutes = state.sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
  const averageScore = state.sessions.reduce((sum, session) => sum + session.score, 0) / state.sessions.length;
  const heartBase = Math.round(84 - averageScore * 0.18);
  const heartbeatDrift = Math.round(Math.sin(liveTick / 2.5) * 2);

  const metrics = {
    heartRate: clamp(heartBase + heartbeatDrift, 56, 108),
    spo2: clamp(Math.round(95 + averageScore * 0.04), 90, 100),
    stress: clamp(Math.round(88 - averageScore * 0.62), 10, 95),
    activity: clamp(Math.round(totalMinutes * 3.8), 1, 100),
  };

  const weeklyBuckets: Array<{ sum: number; count: number }> = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }));

  state.sessions.forEach((session) => {
    const dayIndex = getDayIndex(new Date(session.completedAt));
    weeklyBuckets[dayIndex] = {
      sum: weeklyBuckets[dayIndex].sum + session.score,
      count: weeklyBuckets[dayIndex].count + 1,
    };
  });

  const weeklyProgress = DAY_LABELS.map((label, index) => {
    const bucket = weeklyBuckets[index];
    return {
      label,
      value: bucket.count === 0 ? 0 : Math.round(bucket.sum / bucket.count),
    };
  });

  const recentSessions = state.sessions.slice(0, 4).map((session) => ({
    id: session.id,
    mudra: session.mudra,
    duration: `${session.durationMinutes} min`,
    score: session.score,
    time: formatRelativeTime(session.completedAt),
  }));

  return {
    hasData: true,
    metrics,
    weeklyProgress,
    recentSessions,
  };
}
