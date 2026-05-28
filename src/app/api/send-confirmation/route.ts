import { NextResponse } from "next/server";
import { sendConfirmationNotification } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await sendConfirmationNotification(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Confirmation notification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send confirmation" },
      { status: 500 }
    );
  }
}
