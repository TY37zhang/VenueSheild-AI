import { NextRequest, NextResponse } from "next/server";
import { sql, initWaitlistTable, addToWaitlist } from "@/lib/db";

// Initialize table on first request
let tableInitialized = false;

export async function POST(request: NextRequest) {
  try {
    // Initialize table if not done yet
    if (!tableInitialized) {
      await initWaitlistTable();
      tableInitialized = true;
    }

    const body = await request.json();
    const { name, email, company, venueType, message } = body;

    // Validate required fields
    if (!name || !email || !company || !venueType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Add to waitlist
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
        id: result.id 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Waitlist submission error:", error);
    
    // Check for unique constraint violation (duplicate email)
    if (error instanceof Error && error.message.includes("duplicate")) {
      return NextResponse.json(
        { error: "This email is already on the waitlist" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to add to waitlist. Please try again." },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check waitlist count (for admin purposes)
export async function GET() {
  try {
    if (!tableInitialized) {
      await initWaitlistTable();
      tableInitialized = true;
    }

    const result = await sql`SELECT COUNT(*) as count FROM waitlist`;
    return NextResponse.json({ count: result[0].count });
  } catch (error) {
    console.error("Waitlist count error:", error);
    return NextResponse.json(
      { error: "Failed to get waitlist count" },
      { status: 500 }
    );
  }
}

