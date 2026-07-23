import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { requireWorkspaceMember } from "@/lib/workspace";
import { errorResponse } from "@/lib/api";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ workspace: string }> }) {
  try {
    const { workspace: workspaceSlug } = await params;
    const { workspace } = await requireWorkspaceMember(workspaceSlug, "ADMIN");
    if (!workspace.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account yet. Subscribe to Pro first." }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const portal = await stripe.billingPortal.sessions.create({
      customer: workspace.stripeCustomerId,
      return_url: `${appUrl}/${workspace.slug}/settings/billing`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (err) {
    return errorResponse(err);
  }
}
