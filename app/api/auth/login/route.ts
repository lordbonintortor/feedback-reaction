import { NextResponse } from "next/server";
import {
  createSessionToken,
  isAuthConfigured,
  SESSION_COOKIE,
  SESSION_DURATION_SECONDS,
  verifyAdminPassword
} from "@/lib/auth";

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ message: "Admin login is not configured." }, { status: 503 });
  }

  const body = (await request.json()) as { password?: string };
  if (!verifyAdminPassword(String(body.password || ""))) {
    return NextResponse.json({ message: "Incorrect password." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  });
  return response;
}
