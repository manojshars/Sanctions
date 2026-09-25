export type NavItem = { label: string; href: string; description?: string };
export type NavGroup = { label: string; href?: string; items?: NavItem[] };

export const MAIN_NAV: NavGroup[] = [
  { label: "Academy", href: "/academy" },
  {
    label: "Practice",
    items: [
      { label: "Question Bank", href: "/question-bank", description: "Topic-based practice with explanations" },
      { label: "Mock Exams", href: "/mock-exams", description: "Timed examinations and analytics" },
      { label: "Exam Readiness", href: "/mock-exams/readiness", description: "Diagnose strengths and gaps" },
      { label: "Flashcards", href: "/flashcards", description: "Decks with spaced repetition" },
    ],
  },
  {
    label: "Learn",
    items: [
      { label: "Video Learning", href: "/videos", description: "Curated, source-verified videos" },
      { label: "Case Studies", href: "/case-studies", description: "Interactive investigation simulations" },
      { label: "Knowledge Hub", href: "/knowledge", description: "Insights, explainers and guides" },
      { label: "Glossary", href: "/knowledge/glossary", description: "Financial crime terminology" },
      { label: "Regulatory Library", href: "/knowledge/regulations", description: "Official sources by authority" },
      { label: "Typologies & Red Flags", href: "/knowledge/typologies", description: "Indicators by risk area" },
      { label: "Resources", href: "/resources", description: "Checklists and templates" },
    ],
  },
  { label: "Corporate", href: "/corporate" },
  { label: "Pricing", href: "/pricing" },
  { label: "Support", href: "/support" },
  { label: "About", href: "/about" },
];

export const FOOTER_NAV: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Learn",
    items: [
      { label: "Academy", href: "/academy" },
      { label: "Course Catalog", href: "/academy/courses" },
      { label: "Video Learning", href: "/videos" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Learning Packages", href: "/pricing/packages" },
    ],
  },
  {
    heading: "Practice",
    items: [
      { label: "Question Bank", href: "/question-bank" },
      { label: "Mock Exams", href: "/mock-exams" },
      { label: "Exam Readiness", href: "/mock-exams/readiness" },
      { label: "Flashcards", href: "/flashcards" },
      { label: "Flashcard of the Day", href: "/flashcards/daily" },
    ],
  },
  {
    heading: "Knowledge",
    items: [
      { label: "Knowledge Hub", href: "/knowledge" },
      { label: "Glossary", href: "/knowledge/glossary" },
      { label: "Regulatory Library", href: "/knowledge/regulations" },
      { label: "Typologies", href: "/knowledge/typologies" },
      { label: "Resources", href: "/resources" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About Us", href: "/about" },
      { label: "Corporate Training", href: "/corporate" },
      { label: "Pricing", href: "/pricing" },
      { label: "Support Center", href: "/support" },
      { label: "Contact", href: "/contact" },
      { label: "Verify a Certificate", href: "/certificates/verify" },
    ],
  },
];
