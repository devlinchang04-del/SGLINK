import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS } from "@/lib/plans";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId ?? session.client_reference_id;
      if (workspaceId && session.subscription && session.customer) {
        await activatePro(workspaceId, session.customer as string, session.subscription as string);
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscription(sub);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await downgradeToFree(sub.customer as string);
      break;
    }
  }

  return NextResponse.json({ received: true });
}

async function activatePro(workspaceId: string, customerId: string, subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      plan: "PRO",
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: subscription.items.data[0]?.price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      linksLimit: PLAN_LIMITS.PRO.links,
      clicksLimit: PLAN_LIMITS.PRO.clicks,
    },
  });
}

async function syncSubscription(sub: Stripe.Subscription) {
  const workspace = await prisma.workspace.findUnique({ where: { stripeCustomerId: sub.customer as string } });
  if (!workspace) return;

  const active = sub.status === "active" || sub.status === "trialing";
  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      plan: active ? "PRO" : "FREE",
      stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000),
      linksLimit: active ? PLAN_LIMITS.PRO.links : PLAN_LIMITS.FREE.links,
      clicksLimit: active ? PLAN_LIMITS.PRO.clicks : PLAN_LIMITS.FREE.clicks,
    },
  });
}

async function downgradeToFree(customerId: string) {
  const workspace = await prisma.workspace.findUnique({ where: { stripeCustomerId: customerId } });
  if (!workspace) return;

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { plan: "FREE", linksLimit: PLAN_LIMITS.FREE.links, clicksLimit: PLAN_LIMITS.FREE.clicks },
  });
}
