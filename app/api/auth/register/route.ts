import { NextResponse } from "next/server";
import { createUser } from "../../../../lib/server/user-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await createUser({
      name: String(body.name || ""),
      email: String(body.email || ""),
      password: String(body.password || ""),
      goal: String(body.goal || "Stress relief"),
      age: Number(body.age || 28),
    });

    const { passwordHash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
