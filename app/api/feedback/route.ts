import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createFeedback, listFeedback } from "@/lib/storage";
import { ratings } from "@/lib/feedback";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const authenticated = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!authenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const entries = await listFeedback();
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const body = await request.json();
  const rating = ratings.find((item) => item.value === Number(body.rating));

  if (!rating) {
    return NextResponse.json({ message: "A valid rating is required." }, { status: 400 });
  }

  const entry = await createFeedback({
    rating: rating.value,
    emoji: rating.emoji,
    label: rating.label
  });

  return NextResponse.json({ entry }, { status: 201 });
}
