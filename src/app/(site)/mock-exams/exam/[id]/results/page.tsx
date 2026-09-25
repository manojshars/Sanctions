import type { Metadata } from "next";
import { ResultsPage } from "@/components/practice/results-page";

export const metadata: Metadata = { title: "Examination results", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ResultsPage id={(await params).id} expect="exam" />;
}
