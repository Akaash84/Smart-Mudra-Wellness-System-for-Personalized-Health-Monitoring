import { NextResponse } from "next/server";
import { verifyUser } from "../../../../lib/server/user-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await verifyUser(String(body.email || ""), String(body.password || ""));

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const { passwordHash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch {
    return NextResponse.json({ error: "Login failed." }, { status: 400 });
  }
}
