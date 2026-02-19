import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type IncidentPatchAction = "resolve" | "escalate" | "acknowledge";

interface IncidentPatchPayload {
  action?: IncidentPatchAction;
  actor?: string;
}

function isValidAction(value: unknown): value is IncidentPatchAction {
  return value === "resolve" || value === "escalate" || value === "acknowledge";
}

function isMissingAcknowledgeColumn(message: string) {
  return (
    message.includes("incident_events.acknowledged_by") ||
    message.includes("incident_events.acknowledged_at")
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const body = (await request.json().catch(() => ({}))) as IncidentPatchPayload;
    if (!isValidAction(body.action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'resolve', 'escalate', or 'acknowledge'." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    if (body.action === "resolve") {
      const { data, error } = await supabaseAdmin
        .from("incident_events")
        .update({
          status: "resolved",
          resolved_at: now,
          updated_at: now,
        })
        .eq("id", id)
        .eq("status", "active")
        .select("id");

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: "Incident not found or not active" },
          { status: 404 },
        );
      }

      return NextResponse.json({ success: true, action: "resolve", id });
    }

    if (body.action === "acknowledge") {
      const actor =
        typeof body.actor === "string" && body.actor.trim().length > 0
          ? body.actor.trim()
          : "Operator";
      const { data, error } = await supabaseAdmin
        .from("incident_events")
        .update({
          acknowledged_by: actor,
          acknowledged_at: now,
          updated_at: now,
        })
        .eq("id", id)
        .eq("status", "active")
        .select("id");

      if (error) {
        if (isMissingAcknowledgeColumn(error.message)) {
          return NextResponse.json(
            {
              error:
                "Acknowledge fields are not available in this database yet. Run the acknowledgement migration first.",
            },
            { status: 409 },
          );
        }
        throw error;
      }

      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: "Incident not found or not active" },
          { status: 404 },
        );
      }

      return NextResponse.json({ success: true, action: "acknowledge", id, actor });
    }

    const { data, error } = await supabaseAdmin
      .from("incident_events")
      .update({
        severity: "critical",
        updated_at: now,
      })
      .eq("id", id)
      .eq("status", "active")
      .select("id");

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Incident not found or not active" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, action: "escalate", id });
  } catch (error) {
    console.error("Incident patch error:", error);
    return NextResponse.json(
      { error: "Failed to update incident" },
      { status: 500 },
    );
  }
}
