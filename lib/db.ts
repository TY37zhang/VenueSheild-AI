import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

// Initialize the waitlist table
export async function initWaitlistTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS waitlist (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      company VARCHAR(255) NOT NULL,
      venue_type VARCHAR(100) NOT NULL,
      message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// Add entry to waitlist
export async function addToWaitlist(data: {
  name: string;
  email: string;
  company: string;
  venueType: string;
  message?: string;
}) {
  const result = await sql`
    INSERT INTO waitlist (name, email, company, venue_type, message)
    VALUES (${data.name}, ${data.email}, ${data.company}, ${data.venueType}, ${data.message || null})
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      company = EXCLUDED.company,
      venue_type = EXCLUDED.venue_type,
      message = EXCLUDED.message,
      created_at = CURRENT_TIMESTAMP
    RETURNING id, email
  `;
  return result[0];
}

// Check if email already exists
export async function checkEmailExists(email: string): Promise<boolean> {
  const result = await sql`
    SELECT id FROM waitlist WHERE email = ${email}
  `;
  return result.length > 0;
}
