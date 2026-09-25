import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ALL_FEATURES } from "@/lib/entitlements";
import { AdminHeader, Flash, L, SubmitBar, Table, Td, ActionButton } from "@/components/admin/ui";
import { Input, Select, Textarea } from "@/components/ui/form";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { createCouponAction, grantOrgMembershipAction, reviewAssistanceAction, toggleCouponAction, updateFeeSettingAction, updatePackageAction, updatePlanAction } from "@/server/actions/admin";
import { paymentMode } from "@/server/services/payments";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata = { title: "Memberships" };

export default async function AdminMemberships({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requirePermission("packages:manage");
  const sp = await searchParams;
  const [plans, packages, coupons, requests, orgs, topics, feeSetting] = await Promise.all([
    db.membershipPlan.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { memberships: { where: { status: "ACTIVE" } } } } } }),
    db.learningPackage.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { memberships: { where: { status: "ACTIVE" } }, courses: true } } } }),
    db.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    db.feeAssistanceRequest.findMany({ include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.organization.findMany({ include: { memberships: { where: { status: "ACTIVE" } }, _count: { select: { members: true } } } }),
    db.topic.findMany({ orderBy: { order: "asc" } }),
    db.setting.findUnique({ where: { key: "feeAssistance" } }),
  ]);
  const fee = (feeSetting?.value ?? { enabled: true, maxDiscountPct: 50 }) as { enabled: boolean; maxDiscountPct: number };
  return (
    <>
      <AdminHeader title="Membership management" description={`Payment mode: ${paymentMode()}`} />
      <Flash sp={sp} />
      <section className="mb-8"><h2 className="mb-3 text-lg font-semibold">Plans</h2>
        <div className="grid gap-4 lg:grid-cols-2">{plans.map((p) => (
          <form key={p.id} action={updatePlanAction.bind(null, p.id)} className="card space-y-3 p-5">
            <div className="flex items-center justify-between"><h3 className="font-semibold">{p.name} <span className="text-xs text-muted">({p.tier.toLowerCase()}, {p.interval.toLowerCase()})</span></h3><Badge tone="brand">{p._count.memberships} active</Badge></div>
            <div className="grid grid-cols-2 gap-3"><L label={`Price (${p.currency})`} htmlFor={`price-${p.id}`}><Input id={`price-${p.id}`} name="price" type="number" step="0.01" min={0} defaultValue={(p.priceCents / 100).toFixed(2)} /></L><L label="Stripe price ID" htmlFor={`sp-${p.id}`}><Input id={`sp-${p.id}`} name="stripePriceId" defaultValue={p.stripePriceId ?? ""} /></L></div>
            <L label="Description" htmlFor={`d-${p.id}`}><Input id={`d-${p.id}`} name="description" defaultValue={p.description} /></L>
            <L label="Features (one per line)" htmlFor={`f-${p.id}`}><Textarea id={`f-${p.id}`} name="features" defaultValue={p.features.join("\n")} className="min-h-[90px]" /></L>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={p.isActive} /> Active</label>
            <SubmitBar />
          </form>))}</div>
      </section>
      <section className="mb-8"><h2 className="mb-3 text-lg font-semibold">Learning packages</h2>
        <div className="grid gap-4 lg:grid-cols-2">{[...packages, null].map((p) => (
          <form key={p?.id ?? "new"} action={updatePackageAction.bind(null, p?.id ?? null)} className="card space-y-3 p-5">
            <div className="flex items-center justify-between"><h3 className="font-semibold">{p ? p.name : "New package"}</h3>{p && <Badge tone="brand">{p._count.memberships} active · {p._count.courses} courses</Badge>}</div>
            <div className="grid grid-cols-3 gap-3"><L label="Name" htmlFor={`pn-${p?.id}`}><Input id={`pn-${p?.id}`} name="name" defaultValue={p?.name} required /></L><L label="Price" htmlFor={`pp-${p?.id}`}><Input id={`pp-${p?.id}`} name="price" type="number" step="0.01" defaultValue={p ? (p.priceCents / 100).toFixed(2) : ""} required /></L><L label="Days" htmlFor={`pd-${p?.id}`}><Input id={`pd-${p?.id}`} name="durationDays" type="number" defaultValue={p?.durationDays ?? 365} /></L></div>
            <L label="Description" htmlFor={`pdesc-${p?.id}`}><Input id={`pdesc-${p?.id}`} name="description" defaultValue={p?.description} required /></L>
            <L label="Features (one per line)" htmlFor={`pf-${p?.id}`}><Textarea id={`pf-${p?.id}`} name="features" defaultValue={p?.features.join("\n")} className="min-h-[70px]" /></L>
            <fieldset><legend className="label">Topics (none = all)</legend><div className="grid grid-cols-2 gap-1 text-sm">{topics.map((t) => <label key={t.slug} className="flex gap-1.5"><input type="checkbox" name="topicSlugs" value={t.slug} defaultChecked={p?.topicSlugs.includes(t.slug)} />{t.shortName}</label>)}</div></fieldset>
            <fieldset><legend className="label">Entitlements</legend><div className="grid grid-cols-2 gap-1 text-sm">{ALL_FEATURES.map((f) => <label key={f} className="flex gap-1.5"><input type="checkbox" name="entitlements" value={f} defaultChecked={p?.entitlements.includes(f)} />{f.toLowerCase().replace(/_/g, " ")}</label>)}</div></fieldset>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={p?.isActive ?? true} /> Active</label>
            <SubmitBar label={p ? "Save" : "Create package"} />
          </form>))}</div>
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <section><h2 className="mb-3 text-lg font-semibold">Coupons</h2>
          <Table head={["Code", "Discount", "Redeemed", "Expires", ""]}>{coupons.map((c) => <tr key={c.id}><Td className="font-mono">{c.code}</Td><Td>{c.percentOff ? `${c.percentOff}%` : formatMoney(c.amountOffCents ?? 0)}</Td><Td>{c.redeemedCount}{c.maxRedemptions ? `/${c.maxRedemptions}` : ""}</Td><Td>{c.expiresAt ? formatDate(c.expiresAt) : "—"}</Td><Td><ActionButton action={toggleCouponAction.bind(null, c.id, !c.isActive)} label={c.isActive ? "Disable" : "Enable"} tone={c.isActive ? "danger" : "default"} /></Td></tr>)}</Table>
          <form action={createCouponAction} className="card mt-4 grid gap-3 p-5 sm:grid-cols-3">
            <L label="Code" htmlFor="code"><Input id="code" name="code" required className="uppercase" /></L><L label="% off" htmlFor="percentOff"><Input id="percentOff" name="percentOff" type="number" min={1} max={100} /></L><L label="or amount off" htmlFor="amountOff"><Input id="amountOff" name="amountOff" type="number" step="0.01" /></L>
            <L label="Max redemptions" htmlFor="maxRedemptions"><Input id="maxRedemptions" name="maxRedemptions" type="number" min={1} /></L><L label="Expires" htmlFor="expiresAt"><Input id="expiresAt" name="expiresAt" type="date" /></L><L label="Description" htmlFor="cdesc"><Input id="cdesc" name="description" /></L>
            <div className="sm:col-span-3"><SubmitBar label="Create coupon" /></div>
          </form>
        </section>
        <section><h2 className="mb-3 text-lg font-semibold">Fee assistance</h2>
          <form action={updateFeeSettingAction} className="card mb-4 flex flex-wrap items-end gap-3 p-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={fee.enabled} /> Accept applications</label><L label="Max discount %" htmlFor="maxDiscountPct"><Input id="maxDiscountPct" name="maxDiscountPct" type="number" min={1} max={100} defaultValue={fee.maxDiscountPct} className="w-24" /></L><button className="h-10 rounded-lg border border-line px-3 text-sm">Save</button></form>
          <div className="space-y-3">{requests.map((r) => (
            <div key={r.id} className="card p-4 text-sm">
              <div className="flex justify-between"><span className="font-semibold">{r.user.name} <span className="font-normal text-muted">{r.user.email}{r.country ? ` · ${r.country}` : ""}</span></span><StatusBadge status={r.status} /></div>
              <p className="mt-2 text-ink/85">{r.reason}</p>
              {r.status === "NEW" && <form action={reviewAssistanceAction.bind(null, r.id)} className="mt-3 flex flex-wrap gap-2"><Input name="discountPct" type="number" min={1} max={fee.maxDiscountPct} placeholder="Discount %" className="w-32" aria-label="Discount percent" /><Select name="decision" className="w-auto" aria-label="Decision"><option value="APPROVED">Approve</option><option value="REJECTED">Reject</option></Select><button className="rounded-lg bg-navy px-3 text-white dark:bg-gold-400 dark:text-navy">Submit</button></form>}
              {r.discountPct && <p className="mt-2 text-xs text-muted">Approved discount: {r.discountPct}%</p>}
            </div>))}{!requests.length && <p className="text-sm text-muted">No applications.</p>}</div>
        </section>
      </div>
      <section className="mt-8"><h2 className="mb-3 text-lg font-semibold">Corporate organisations</h2>
        <Table head={["Organisation", "Members", "Seats", "Corporate membership"]}>{orgs.map((o) => <tr key={o.id}><Td>{o.name}</Td><Td>{o._count.members}</Td><Td>{o.seatLimit}</Td><Td>{o.memberships.length ? `Active until ${formatDate(o.memberships[0].endsAt)}` : "None"}</Td></tr>)}</Table>
        <form action={grantOrgMembershipAction} className="card mt-4 flex flex-wrap items-end gap-3 p-4"><L label="Organisation" htmlFor="orgId"><Select id="orgId" name="orgId">{orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></L><L label="Days" htmlFor="odays"><Input id="odays" name="days" type="number" defaultValue={365} className="w-28" /></L><button className="h-10 rounded-lg bg-navy px-4 text-sm text-white dark:bg-gold-400 dark:text-navy">Activate corporate membership</button></form>
      </section>
    </>
  );
}
