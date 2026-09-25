import { HeaderServer } from "@/components/layout/header-server";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieConsent } from "@/components/layout/cookie-consent";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <HeaderServer />
      <main id="main" className="min-h-[60vh]">{children}</main>
      <SiteFooter />
      <CookieConsent />
    </>
  );
}
