import { NextResponse } from "next/server";
import { generateMetrics, generateRecentSessions, generateWeeklyProgress } from "../../../lib/mudra";

export async function GET() {
  const seed = "mudrahealth-api";
  return NextResponse.json({
    metrics: generateMetrics(seed),
    weekly: generateWeeklyProgress(seed),
    sessions: generateRecentSessions(seed),
  });
}
