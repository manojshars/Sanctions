import QuestionEditor from "../[id]/page";

export const metadata = { title: "New question" };

export default async function NewQuestion({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  return QuestionEditor({ params: Promise.resolve({ id: "new" }), searchParams });
}
