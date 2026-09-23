/** Planos vendidos na plataforma. Preços em centavos. */
export type PlanId = "essencial" | "profissional";

export const PLANS: Record<PlanId, { id: PlanId; name: string; price_cents: number; max_products: number | null }> = {
  essencial: { id: "essencial", name: "Essencial", price_cents: 7990, max_products: 60 },
  profissional: { id: "profissional", name: "Profissional", price_cents: 13990, max_products: null },
};

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

export function isPlanId(v: unknown): v is PlanId {
  return typeof v === "string" && v in PLANS;
}

export const TRIAL_DAYS = Math.max(0, Number(process.env.TRIAL_DAYS ?? 3) || 0);
