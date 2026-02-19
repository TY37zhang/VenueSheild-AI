import { NextRequest, NextResponse } from "next/server";
import { addToWaitlist, getWaitlistCount } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company, venueType, message } = body;

    // Validate required fields
    if (!name || !email || !company || !venueType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    const result = await addToWaitlist({
      name,
      email,
      company,
      venueType,
      message,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Successfully added to waitlist",
        id: result.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Waitlist submission error:", error);

    if (error instanceof Error) {
      // Supabase unique constraint error handling
      if (
        error.message.includes("duplicate") ||
        error.message.includes("unique constraint") ||
        error.message.includes("violates unique")
      ) {
        return NextResponse.json(
          { error: "This email is already on the waitlist" },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to add to waitlist. Please try again." },
      { status: 500 },
    );
  }
}

// GET endpoint to check waitlist count (for admin purposes)
export async function GET() {
  try {
    const count = await getWaitlistCount();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Waitlist count error:", error);
    return NextResponse.json(
      { error: "Failed to get waitlist count" },
      { status: 500 },
    );
  }
}
