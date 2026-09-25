import { db } from "@/lib/db";
import { canAccessTopicContent, getEntitlements, hasFeature } from "@/lib/entitlements";
import type { Role } from "@/lib/rbac";
import { AccessError, NotFoundError } from "./courses";

export interface SimOption { id: string; text: string; correct: boolean; feedback: string }
export interface SimStep { id: string; kind: string; prompt: string; multi: boolean; options: SimOption[] }
export interface Simulation { documents: { id: string; title: string; content: string }[]; steps: SimStep[]; modelReasoning: string }

export async function caseAccess(user: { id: string; role: Role } | null, c: { accessTier: "FREE" | "PREMIUM"; topic: { slug: string } }) {
  if (c.accessTier === "FREE") return true;
  const ent = await getEntitlements(user);
  return hasFeature(ent, "ADVANCED_CASES", c.topic.slug) || canAccessTopicContent(ent, { accessTier: "PREMIUM", topicSlug: c.topic.slug });
}

/** Client-safe simulation: strips correctness and feedback. */
export function publicSimulation(sim: Simulation) {
  return {
    documents: sim.documents,
    steps: sim.steps.map((s) => ({ id: s.id, kind: s.kind, prompt: s.prompt, multi: s.multi, options: s.options.map((o) => ({ id: o.id, text: o.text })) })),
  };
}

/** Grades a simulation: each step scores (hits − wrong picks) / correct count, floored at 0. */
export function gradeSimulation(sim: Simulation, responses: Record<string, string[]>) {
  const steps = sim.steps.map((s) => {
    const picked = new Set((responses[s.id] ?? []).filter((id) => s.options.some((o) => o.id === id)));
    const correct = s.options.filter((o) => o.correct);
    const hits = correct.filter((o) => picked.has(o.id)).length;
    const wrong = [...picked].filter((id) => !s.options.find((o) => o.id === id)?.correct).length;
    const score = correct.length ? Math.max(0, (hits - wrong) / correct.length) : 0;
    return { id: s.id, prompt: s.prompt, score, picked: [...picked], options: s.options };
  });
  const total = steps.length ? Math.round((steps.reduce((a, s) => a + s.score, 0) / steps.length) * 100) : 0;
  return { total, steps, modelReasoning: sim.modelReasoning };
}

export async function submitCaseSimulation(user: { id: string; role: Role }, slug: string, responses: Record<string, string[]>, recommendation: string) {
  const c = await db.caseStudy.findFirst({ where: { slug, status: "PUBLISHED" }, include: { topic: true } });
  if (!c) throw new NotFoundError("Case not found");
  if (!(await caseAccess(user, c))) throw new AccessError();
  const result = gradeSimulation(c.simulation as unknown as Simulation, responses);
  await db.caseAttempt.create({ data: { userId: user.id, caseId: c.id, responses, score: result.total, recommendation: recommendation.slice(0, 5000) } });
  return result;
}
