import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/utils";

const PRIVATE = ["/admin", "/dashboard", "/my-learning", "/profile", "/settings", "/notifications", "/certificates", "/checkout", "/corporate/dashboard", "/corporate/join", "/support/tickets", "/support/new", "/question-bank/session", "/mock-exams/exam", "/flashcards/review", "/api", "/account-export", "/certificates-pdf", "/support-files", "/corporate-report", "/search"];

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE }], sitemap: appUrl("/sitemap.xml") };
}
