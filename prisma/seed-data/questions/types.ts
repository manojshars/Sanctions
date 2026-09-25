/**
 * Compact question authoring format used by seed files.
 *  t   type               d   difficulty (B/I/A)
 *  s   stem               sc  scenario text (optional)
 *  o   options            c   indices of correct options
 *  oe  per-option explanations (optional, same order as o)
 *  m   matching pairs [left, right]
 *  a   accepted answers (fill-blank / short answer)
 *  k   keyword groups for short answer ("a|b" = either)
 *  ma  model answer       e   explanation     p practical application
 *  src source reference   url source URL     tags topic tags
 *  tier F (free) or P (premium; default)      course course slug for final-assessment pools
 */
export interface Q {
  t: "SINGLE" | "MULTIPLE" | "TRUE_FALSE" | "SCENARIO" | "MATCHING" | "FILL_BLANK" | "SHORT_ANSWER" | "INVESTIGATION";
  d: "B" | "I" | "A";
  s: string;
  sc?: string;
  o?: string[];
  c?: number[];
  oe?: (string | null)[];
  m?: [string, string][];
  a?: string[];
  k?: string[];
  ma?: string;
  e: string;
  p?: string;
  src?: string;
  url?: string;
  tags?: string[];
  tier?: "F" | "P";
  course?: string;
}
