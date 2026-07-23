import type { Plan } from "@prisma/client";

export const PLAN_LIMITS: Record<Plan, { links: number; clicks: number; domains: number; label: string; price: number }> = {
  FREE: { links: 25, clicks: 1_000, domains: 1, label: "Free", price: 0 },
  PRO: { links: 1_000, clicks: 50_000, domains: 10, label: "Pro", price: 29 },
};

export function limitsFor(plan: Plan) {
  return PLAN_LIMITS[plan];
}
