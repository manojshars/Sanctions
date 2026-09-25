import { requirePermission } from "@/lib/auth/session";
import { AdminHeader, Flash } from "@/components/admin/ui";
import { Alert } from "@/components/ui/feedback";
import { importQuestionsAction } from "@/server/actions/admin";

export const metadata = { title: "Import questions" };

export default async function ImportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePermission("content:manage");
  const sp = await searchParams;
  return (
    <>
      <AdminHeader title="Import questions from CSV" back={{ href: "/admin/questions", label: "Questions" }} description="Imported questions enter the review workflow as drafts. Duplicates (identical stem and options) are skipped." />
      <Flash sp={{ error: sp.error }} />
      {sp.created !== undefined && <Alert tone={Number(sp.errors) ? "warning" : "success"} className="mb-5" title="Import complete">{sp.created} created · {sp.duplicates} duplicates skipped · {sp.errors} rows with errors{sp.details && <p className="mt-2 whitespace-pre-wrap text-xs">{sp.details.split(" | ").join("\n")}</p>}</Alert>}
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form action={importQuestionsAction} className="card space-y-4 p-5">
          <div><label className="label" htmlFor="file">CSV file</label><input id="file" name="file" type="file" accept=".csv,text/csv" className="text-sm" /></div>
          <div><label className="label" htmlFor="csv">…or paste CSV</label><textarea id="csv" name="csv" className="input min-h-[200px] font-mono text-xs" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="submitForReview" /> Submit imported questions directly for review</label>
          <button className="h-10 rounded-lg bg-navy px-5 text-sm font-medium text-white dark:bg-gold-400 dark:text-navy">Import</button>
        </form>
        <div className="card p-5 text-sm">
          <h2 className="font-semibold">Format</h2>
          <p className="mt-2 text-muted">Header row required. Columns:</p>
          <code className="mt-2 block rounded bg-surface-2 p-3 text-xs">topic, type, difficulty, stem, scenario, options, correct, explanation, practical_application, source_reference, source_url, tags, access_tier, accepted_answers, keywords, model_answer, matches, course</code>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
            <li><b>topic</b>: topic slug (e.g. <code>sanctions</code>) or name</li>
            <li><b>options</b>, <b>tags</b>, <b>accepted_answers</b>, <b>keywords</b>: separated by <code>|</code></li>
            <li><b>correct</b>: 1-based indexes or letters, e.g. <code>2</code> or <code>A|C</code></li>
            <li><b>matches</b> (MATCHING): <code>left=&gt;right|left=&gt;right</code></li>
            <li><b>course</b>: optional course slug for final-assessment pools</li>
          </ul>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download route */}
          <a href="/admin/questions/template" className="mt-4 inline-block font-semibold text-brand">Download template CSV</a>
        </div>
      </div>
    </>
  );
}
