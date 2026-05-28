import { NextResponse } from "next/server";
import { sendBookingNotification } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await sendBookingNotification(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
