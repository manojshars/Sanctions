import type { Metadata } from "next";
import { SessionPage } from "@/components/practice/session-page";

export const metadata: Metadata = { title: "Examination", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <SessionPage id={(await params).id} expect="exam" />;
}
