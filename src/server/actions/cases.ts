"use server";
import { z } from "zod";
import { requireActionUser } from "@/lib/auth/session";
import { submitCaseSimulation } from "@/server/services/cases";
import { AccessError, NotFoundError } from "@/server/services/courses";

const schema = z.object({ responses: z.record(z.string().max(20), z.array(z.string().max(20)).max(20)), recommendation: z.string().max(5000) });

export async function submitCaseAction(slug: string, input: z.infer<typeof schema>) {
  const user = await requireActionUser();
  const data = schema.parse(input);
  try {
    return { ok: true as const, result: await submitCaseSimulation(user, slug, data.responses, data.recommendation) };
  } catch (e) {
    if (e instanceof AccessError || e instanceof NotFoundError) return { ok: false as const, error: e.message };
    throw e;
  }
}
