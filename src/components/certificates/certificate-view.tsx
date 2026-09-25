import { LogoMark } from "@/components/layout/logo";
import { formatDate } from "@/lib/utils";

export function CertificateView({ c, verifyUrl }: { c: { learnerName: string; courseTitle: string; issuedAt: Date; number: string; verificationCode: string; cpdHours: number | null; score: number | null }; verifyUrl: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border-[6px] border-navy bg-white p-2 text-navy shadow-lift dark:border-gold-400">
      <div className="rounded-xl border border-gold-400 px-6 pb-8 pt-0 text-center sm:px-12">
        <div className="-mx-6 bg-navy px-6 py-5 sm:-mx-12">
          <div className="flex items-center justify-center gap-3"><LogoMark className="h-10 w-10" /><span className="font-display text-xl font-extrabold tracking-[0.1em] text-gold-300">FINCRIME ACADEMY</span></div>
        </div>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-navy-600">Certificate of Completion</p>
        <p className="mt-5 font-serif italic text-slate-500">This is to certify that</p>
        <p className="mt-3 font-serif text-3xl font-bold sm:text-4xl">{c.learnerName}</p>
        <div className="mx-auto mt-2 h-px w-72 bg-gold-400" />
        <p className="mt-4 font-serif italic text-slate-500">has successfully completed the course</p>
        <p className="mt-2 font-serif text-2xl font-bold text-navy-600">{c.courseTitle}</p>
        {(c.score != null || c.cpdHours) && <p className="mt-2 text-sm text-slate-500">{[c.score != null && `Final assessment: ${c.score}%`, c.cpdHours && `CPD hours (indicative): ${c.cpdHours}`].filter(Boolean).join(" · ")}</p>}
        <dl className="mt-8 grid grid-cols-1 gap-4 text-left text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-slate-500">Issue date</dt><dd className="font-semibold">{formatDate(c.issuedAt, { day: "numeric", month: "long", year: "numeric" })}</dd></div>
          <div><dt className="text-xs text-slate-500">Certificate number</dt><dd className="font-semibold">{c.number}</dd></div>
          <div><dt className="text-xs text-slate-500">Verification code</dt><dd className="font-semibold">{c.verificationCode}</dd></div>
        </dl>
        <p className="mt-6 break-all text-xs text-navy-600">Verify at {verifyUrl}</p>
        <p className="mt-1 text-[11px] text-slate-500">Internal completion certificate issued by FinCrime Academy. Not an external accredited qualification.</p>
      </div>
    </div>
  );
}
