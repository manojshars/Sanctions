export type Lvl = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type Tier = "FREE" | "PREMIUM";

export interface SeedLesson {
  title: string;
  minutes?: number;
  content: string;
  exercise?: string;
  type?: "READING" | "VIDEO" | "EXERCISE";
}

export interface SeedModule {
  title: string;
  summary?: string;
  lessons: SeedLesson[];
}

export interface SeedCourse {
  slug: string;
  title: string;
  subtitle: string;
  topic: string;
  level: Lvl;
  minutes: number;
  tier: Tier;
  format?: "SELF_PACED" | "VIDEO" | "READING" | "BLENDED";
  cpd?: number;
  certificate?: boolean;
  overview: string;
  objectives: string[];
  modules: SeedModule[];
  resources?: { title: string; filename: string; description?: string; content: string; tier?: Tier }[];
  related?: string[];
  keywords?: string[];
}
