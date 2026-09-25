import type { Metadata, Viewport } from "next";
import "./globals.css";
import { THEME_SCRIPT } from "@/components/layout/theme-toggle";
import { appUrl } from "@/lib/utils";
import { HydrationMarker } from "@/components/layout/hydration-marker";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "FinCrime Academy — Financial Crime Learning & Intelligence Hub", template: "%s · FinCrime Academy" },
  description:
    "Build practical expertise in AML, sanctions, fraud, anti-bribery and corruption through professional courses, interactive assessments, real-world case studies and personalised learning.",
  applicationName: "FinCrime Academy",
  openGraph: { type: "website", siteName: "FinCrime Academy", locale: "en_GB" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F4F6FA" }, { media: "(prefers-color-scheme: dark)", color: "#070D19" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen">
        {children}
        <HydrationMarker />
      </body>
    </html>
  );
}
