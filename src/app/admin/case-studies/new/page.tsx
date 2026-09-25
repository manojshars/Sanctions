import AdminCase from "../[id]/page";

export const metadata = { title: "New case study" };

export default async function NewCase({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  return AdminCase({ params: Promise.resolve({ id: "new" }), searchParams });
}
