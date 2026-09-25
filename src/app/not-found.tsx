import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-8 text-center">
      <div><h1 className="text-3xl font-bold">Page not found</h1><p className="mt-2 text-muted">The page you requested does not exist.</p><Link href="/" className="mt-6 inline-block font-semibold text-brand underline">Return home</Link></div>
    </main>
  );
}
