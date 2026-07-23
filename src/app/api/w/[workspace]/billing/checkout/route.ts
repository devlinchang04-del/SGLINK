import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { requireWorkspaceMember } from "@/lib/workspace";
import { errorResponse } from "@/lib/api";

export async function POST(request: NextRequest, { params }: { params: Promise<{ workspace: string }> }) {
  try {
    const { workspace: workspaceSlug } = await params;
    const { workspace, session } = await requireWorkspaceMember(workspaceSlug, "ADMIN");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_PRO_MONTHLY, quantity: 1 }],
      success_url: `${appUrl}/${workspace.slug}/settings/billing?success=1`,
      cancel_url: `${appUrl}/${workspace.slug}/settings/billing`,
      client_reference_id: workspace.id,
      metadata: { workspaceId: workspace.id },
      ...(workspace.stripeCustomerId
        ? { customer: workspace.stripeCustomerId }
        : { customer_email: session.user.email ?? undefined }),
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    return errorResponse(err);
  }
}
