export interface SimOption { id: string; text: string; correct: boolean; feedback: string }
export interface SimStep { id: string; kind: "questions" | "indicators" | "request" | "explanations" | "recommendation"; prompt: string; multi: boolean; options: SimOption[] }
export interface Simulation { documents: { id: string; title: string; content: string }[]; steps: SimStep[]; modelReasoning: string }

export interface SeedCase {
  slug: string;
  title: string;
  summary: string;
  category: "AML_INVESTIGATION" | "SANCTIONS_EXPOSURE" | "OWNERSHIP_CONTROL" | "SCREENING_ALERT" | "TRANSACTION_MONITORING" | "FRAUD_INVESTIGATION" | "ABC_INVESTIGATION" | "TBML" | "EXPORT_CONTROL" | "CRYPTO";
  topic: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  tier: "FREE" | "PREMIUM";
  featured?: boolean;
  background: string;
  profile: string;
  transactionDetails: string;
  businessContext: string;
  redFlags: string[];
  riskIndicators: string[];
  investigationQuestions: string[];
  evidenceRequired: string[];
  investigationSteps: string[];
  possibleFindings: string;
  alternativeExplanations: string[];
  riskConsiderations: string;
  conclusion: string;
  references: { title: string; url: string }[];
  followUpQuestions: { q: string; a: string }[];
  simulation: Simulation;
}

const o = (id: string, text: string, correct: boolean, feedback: string): SimOption => ({ id, text, correct, feedback });

export const CASES: SeedCase[] = [
  {
    slug: "harbourline-logistics-ownership",
    title: "Harbourline Logistics: a hidden 50% owner?",
    summary: "A freight company's new shareholder structure raises OFAC 50 Percent Rule questions ahead of a USD payment.",
    category: "OWNERSHIP_CONTROL", topic: "sanctions", difficulty: "INTERMEDIATE", tier: "FREE", featured: true,
    background: "Harbourline Logistics Ltd (fictional) is a corporate customer of your bank for four years. It requests a USD 2.4 million payment to a shipbuilder for two vessels. During the pre-payment review, an updated ownership chart shows changes made three months ago.",
    profile: "Harbourline is a freight forwarder incorporated in a Gulf free zone. Directors: two local nationals. Previous ownership: 100% held by Meridian Holdings (unlisted).",
    transactionDetails: "Outgoing USD 2,400,000 to a shipbuilder in Asia, cleared via a US correspondent. Payment reference: 'Instalment 1 — Hull 214/215'.",
    businessContext: "Harbourline's turnover is around USD 30 million a year. Vessel purchases have not previously been part of its business.",
    redFlags: [
      "Ownership changed three months before a large, atypical transaction",
      "New shareholder entities are recently incorporated",
      "A designated individual appears in the ownership chain",
      "Business expansion into vessel ownership without explanation",
    ],
    riskIndicators: ["USD clearing creates US nexus", "Maritime sector exposure", "Opaque multi-layer ownership"],
    investigationQuestions: [
      "Who owns each layer of the new structure, with what percentages?",
      "Are any owners designated by OFAC, the EU or the UK?",
      "Does aggregate blocked ownership reach 50% or more?",
      "Why is the company buying vessels?",
    ],
    evidenceRequired: ["Certified shareholder registers for each entity", "Share transfer agreements", "Registry extracts", "Vessel purchase contract", "Board resolution approving the purchase"],
    investigationSteps: [
      "Map each ownership layer with percentages and sources",
      "Screen all entities and natural persons against relevant lists",
      "Calculate aggregate blocked ownership under OFAC rules",
      "Assess control indicators under EU/UK guidance",
      "Evaluate commercial rationale for the vessel purchase",
      "Escalate to sanctions advisory with a recommendation",
    ],
    possibleFindings: "The chart shows Meridian Holdings now 40% owned by Ridgeway Capital and 60% by Solent Ventures. Solent Ventures is 55% owned by an individual designated on the SDN List (fictional). Solent is therefore blocked; its 60% interest in Meridian makes Meridian blocked; Meridian's 100% holding makes Harbourline blocked under OFAC's 50 Percent Rule.",
    alternativeExplanations: [
      "The chart could be outdated or incorrect — verify against registers",
      "The designated individual may have divested — check the date and genuineness of any divestment",
    ],
    riskConsiderations: "Processing the payment through a US correspondent could cause a US person to deal in blocked property. Under EU/UK tests, ownership exceeds 50% at each layer, so the entity is likely also owned or controlled under those regimes.",
    conclusion: "Based on the verified structure, Harbourline is likely blocked under OFAC's 50 Percent Rule. The payment should not proceed; follow blocking/reporting procedures with legal advice and consider relationship exit and regulatory reporting obligations.",
    references: [{ title: "OFAC — 50 Percent Rule guidance", url: "https://ofac.treasury.gov/" }],
    followUpQuestions: [
      { q: "If Solent Ventures owned 45% of Meridian instead of 60%, and Ridgeway were unconnected, would Harbourline be blocked under OFAC's rule?", a: "No — Meridian would be only 45% owned by a blocked entity, so it would not be blocked and its holding in Harbourline would not count. Heightened risk and control analysis would still be warranted." },
      { q: "Why does the US correspondent matter even though Harbourline is not a US company?", a: "USD clearing involves US persons; causing them to process blocked property can create liability." },
    ],
    simulation: {
      documents: [
        { id: "d1", title: "Ownership chart (provided by customer)", content: "Harbourline Logistics Ltd ← 100% Meridian Holdings Ltd\nMeridian Holdings Ltd ← 60% Solent Ventures Ltd; 40% Ridgeway Capital Ltd\nSolent Ventures Ltd ← 55% Mr V. Aldren; 45% Ms K. Doran\nRidgeway Capital Ltd ← 100% Mr P. Hale" },
        { id: "d2", title: "Screening results", content: "Mr V. Aldren — TRUE MATCH to SDN List entry (fictional training data). All other parties — no match." },
        { id: "d3", title: "Payment instruction", content: "USD 2,400,000 to Eastern Yards Co. Ref: Instalment 1 — Hull 214/215. Intermediary: US correspondent bank." },
      ],
      steps: [
        { id: "s1", kind: "questions", multi: true, prompt: "Which investigation questions are most important at the outset?", options: [
          o("a", "What is each layer's ownership percentage and source?", true, "Essential for any 50% analysis."),
          o("b", "Are any owners designated under relevant regimes?", true, "Screening every party in the chain is required."),
          o("c", "What is the customer's favourite shipping route?", false, "Not relevant to the ownership question."),
          o("d", "Why is the company buying vessels now?", true, "Commercial rationale helps assess evasion risk."),
        ] },
        { id: "s2", kind: "indicators", multi: true, prompt: "Which risk indicators are present?", options: [
          o("a", "Ownership change shortly before an atypical transaction", true, "Timing is a classic indicator."),
          o("b", "Designated individual in the ownership chain", true, "Confirmed by screening."),
          o("c", "Four-year relationship history", false, "Tenure alone is not a risk indicator."),
          o("d", "USD payment via a US correspondent", true, "Creates US nexus."),
        ] },
        { id: "s3", kind: "request", multi: true, prompt: "Which additional information should you request?", options: [
          o("a", "Certified shareholder registers and transfer agreements", true, "Verifies the chart."),
          o("b", "The vessel purchase contract and board approval", true, "Supports rationale and parties."),
          o("c", "Personal social media passwords of directors", false, "Inappropriate and unlawful."),
        ] },
        { id: "s4", kind: "explanations", multi: false, prompt: "Calculate: what is Harbourline's status under OFAC's 50 Percent Rule?", options: [
          o("a", "Not blocked — the SDN owns only 55% of Solent, not Harbourline", false, "Ownership is traced through blocked entities."),
          o("b", "Blocked — Solent (55% SDN) is blocked; Solent's 60% makes Meridian blocked; Meridian's 100% makes Harbourline blocked", true, "Correct chain analysis."),
          o("c", "Blocked only if Harbourline is on the SDN List", false, "The rule applies by operation of law."),
        ] },
        { id: "s5", kind: "recommendation", multi: false, prompt: "What is your recommendation?", options: [
          o("a", "Process the payment — Harbourline itself is not listed", false, "Ignores the 50 Percent Rule."),
          o("b", "Do not process; escalate for blocking/reporting under legal advice and review the relationship", true, "Consistent with the analysis."),
          o("c", "Ask the customer to pay in another currency so it can proceed", false, "Advising workarounds may be evasion/facilitation."),
        ] },
      ],
      modelReasoning: "Mr Aldren (SDN) owns 55% of Solent → Solent blocked. Solent owns 60% of Meridian → Meridian blocked (≥50% blocked ownership). Meridian owns 100% of Harbourline → Harbourline blocked. The USD payment through a US correspondent would involve US persons dealing in blocked property. Do not proceed; escalate for blocking and reporting, seek legal advice, and review the relationship.",
    },
  },
  {
    slug: "screening-alert-common-name",
    title: "Screening alert: a common name at onboarding",
    summary: "Resolve a potential sanctions match for a retail customer using secondary identifiers.",
    category: "SCREENING_ALERT", topic: "sanctions", difficulty: "BEGINNER", tier: "FREE",
    background: "A new retail customer, Omar Farid Saleh (fictional), applies online for a current account. Screening generates an alert against a listed individual 'Omar Saleh'.",
    profile: "Customer: DOB 4 July 1996, nationality: Canadian, occupation: software engineer, resident in Toronto for 10 years (per application).",
    transactionDetails: "No transactions yet — onboarding alert.",
    businessContext: "Retail digital bank, standard-risk product.",
    redFlags: ["Name similarity to a listed individual"],
    riskIndicators: ["None beyond the name match"],
    investigationQuestions: ["Do secondary identifiers match?", "Does any other information suggest a link?"],
    evidenceRequired: ["Verified ID document", "List entry details"],
    investigationSteps: ["Compare DOB, nationality and place of birth", "Review list entry aliases", "Document the decision"],
    possibleFindings: "The listed individual's DOB is 1971, place of birth listed abroad, no Canadian nationality recorded. Customer's verified passport confirms DOB 1996.",
    alternativeExplanations: ["The list entry might have multiple DOBs — check all recorded dates"],
    riskConsiderations: "Low residual risk once identifiers are compared and documented.",
    conclusion: "False positive. Close with rationale citing DOB (1996 vs 1971) and nationality differences.",
    references: [{ title: "OFAC Sanctions List Service", url: "https://ofac.treasury.gov/sanctions-list-service" }],
    followUpQuestions: [{ q: "What would you do if the list entry had no DOB?", a: "Rely on other identifiers (nationality, place of birth, address, ID numbers) and context; escalate if a match cannot be reasonably excluded." }],
    simulation: {
      documents: [
        { id: "d1", title: "Customer verified data", content: "Name: Omar Farid Saleh\nDOB: 04/07/1996\nNationality: Canadian\nPassport verified via document check." },
        { id: "d2", title: "List entry (fictional training data)", content: "Name: Omar SALEH; a.k.a. Omar Salih\nDOB: 1971\nPOB: [abroad]\nNationality: not Canadian" },
      ],
      steps: [
        { id: "s1", kind: "questions", multi: true, prompt: "Which identifiers should you compare?", options: [
          o("a", "Date of birth", true, "Primary discriminator for individuals."), o("b", "Nationality", true, "Useful secondary identifier."), o("c", "Preferred app theme", false, "Irrelevant."),
        ] },
        { id: "s2", kind: "recommendation", multi: false, prompt: "What is your disposition?", options: [
          o("a", "True match — reject the application", false, "Identifiers clearly differ."),
          o("b", "False positive — close, recording DOB and nationality differences", true, "Correct and well-evidenced."),
          o("c", "Ask the customer if they are sanctioned", false, "Unhelpful and not a control."),
        ] },
      ],
      modelReasoning: "DOB 1996 vs 1971 and Canadian vs non-Canadian nationality clearly distinguish the customer. Close as a false positive and record the identifiers compared.",
    },
  },
  {
    slug: "student-account-mule-network",
    title: "The student account: fraud proceeds or genuine activity?",
    summary: "Multiple incoming transfers and rapid crypto purchases on a newly opened student account.",
    category: "FRAUD_INVESTIGATION", topic: "fraud", difficulty: "INTERMEDIATE", tier: "PREMIUM", featured: true,
    background: "A transaction monitoring alert and two fraud reports from other banks relate to the account of a 19-year-old student (fictional) opened six weeks ago.",
    profile: "Student, declared income: part-time retail job (~800/month). Expected activity: salary credits, small card spending.",
    transactionDetails: "38 incoming transfers (150–900 each) from different individuals over 10 days, total ~17,600. Each credit is followed within hours by transfers to a crypto exchange. Login device shared with two other accounts at the bank.",
    businessContext: "The bank participates in the UK reimbursement regime for APP scams (receiving-firm liability).",
    redFlags: ["Many unrelated payers", "Rapid onward movement to crypto", "Shared device with other accounts", "Activity inconsistent with declared income", "Fraud reports from other banks"],
    riskIndicators: ["Mule behaviour", "Link to APP scam victims"],
    investigationQuestions: ["Are credits linked to reported scams?", "Who controls the device?", "Is the customer complicit, recruited or unwitting?"],
    evidenceRequired: ["Inbound fraud reports", "Device and IP data", "Payment references", "Customer contact records"],
    investigationSteps: ["Link credits to fraud reports", "Analyse device linkages", "Review onboarding data", "Apply restrictions per policy", "Consider SAR and recovery"],
    possibleFindings: "Two credits match reported investment scam payments. The shared device links to two other recently opened student accounts with similar patterns — suggesting a recruited mule network.",
    alternativeExplanations: ["Customer selling items online (but volumes, crypto outflows and shared device do not fit)", "Customer unaware — recruited via fake job"],
    riskConsiderations: "Continued operation facilitates fraud losses and laundering; reimbursement liability; customer may themselves be a victim of recruitment.",
    conclusion: "Consistent with a mule account within a network. Restrict per policy, attempt recovery of remaining funds, file a suspicious activity report, review linked accounts, and handle the customer fairly (they may be exploited).",
    references: [{ title: "Payment Systems Regulator — APP scams", url: "https://www.psr.org.uk/" }],
    followUpQuestions: [{ q: "Why review linked accounts?", a: "Mule networks share infrastructure; disrupting the network prevents further harm." }],
    simulation: {
      documents: [
        { id: "d1", title: "Account summary", content: "Opened 6 weeks ago. 38 inbound transfers (150–900), 1 payer each. Outbound: 21 transfers to crypto exchange, same day." },
        { id: "d2", title: "Inbound fraud reports", content: "Bank A: victim of investment scam paid 850 to this account.\nBank B: victim paid 600, 'crypto trading opportunity'." },
        { id: "d3", title: "Device intelligence", content: "Device ID 7F2… used to log in to this account and two other student accounts opened in the last 2 months." },
      ],
      steps: [
        { id: "s1", kind: "indicators", multi: true, prompt: "Select the risk indicators present.", options: [
          o("a", "Many credits from unrelated individuals", true, "Classic mule inflow."), o("b", "Rapid onward transfers to crypto", true, "Cash-out pattern."), o("c", "Shared device across accounts", true, "Network indicator."), o("d", "Regular monthly salary", false, "Not observed and would not be a risk indicator."),
        ] },
        { id: "s2", kind: "request", multi: true, prompt: "Which information would most help?", options: [
          o("a", "Link each credit to fraud reports and payer details", true, "Establishes victim linkage."), o("b", "Review the two linked accounts", true, "Network view."), o("c", "Ask the customer on the phone whether they are laundering money", false, "Risks tipping off and is ineffective."),
        ] },
        { id: "s3", kind: "explanations", multi: false, prompt: "Which explanation best fits the evidence?", options: [
          o("a", "Online marketplace sales", false, "Crypto outflows and shared device don't fit."), o("b", "Recruited mule within a network", true, "Best fits all evidence."), o("c", "Student loan disbursements", false, "Loans come from a single lender."),
        ] },
        { id: "s4", kind: "recommendation", multi: true, prompt: "What actions do you recommend?", options: [
          o("a", "Restrict the account per policy and attempt recovery", true, ""), o("b", "Consider filing a suspicious activity report", true, ""), o("c", "Investigate linked accounts", true, ""), o("d", "Take no action as amounts are small", false, "Aggregate harm is significant."),
        ] },
      ],
      modelReasoning: "Victim-linked credits, rapid crypto cash-out and a shared device across new student accounts indicate a recruited mule network. Restrict, recover, report, and expand the investigation to linked accounts, while treating the customer fairly.",
    },
  },
  {
    slug: "cotton-shirts-tbml",
    title: "Cotton shirts at designer prices",
    summary: "A garment importer's letter of credit shows unit prices far above market with unusual routing.",
    category: "TBML", topic: "trade-based", difficulty: "INTERMEDIATE", tier: "PREMIUM",
    background: "Your trade finance team receives a documentary credit presentation from a long-standing garment importer (fictional).",
    profile: "Importer of low-cost basic apparel; typical unit prices 3–6 USD.",
    transactionDetails: "Invoice: 20,000 basic cotton T-shirts at USD 45 each (USD 900,000). Route: origin → two transshipment ports → destination. Beneficiary recently changed via LC amendment.",
    businessContext: "The importer's revenue grew 5% last year; this LC is 4× its usual size.",
    redFlags: ["Unit price ~10× market", "Unusual transshipment", "Late beneficiary amendment", "Size inconsistent with business"],
    riskIndicators: ["Over-invoicing", "Possible value transfer abroad"],
    investigationQuestions: ["Is the price plausible?", "Why this route?", "Who is the new beneficiary?"],
    evidenceRequired: ["Price benchmarks", "Vessel/container tracking", "Beneficiary due diligence", "Customer explanation"],
    investigationSteps: ["Benchmark price", "Track shipment", "Screen and research beneficiary", "Seek explanation via RM", "Escalate"],
    possibleFindings: "The new beneficiary is a two-month-old company in a free zone sharing an address with 40 other companies.",
    alternativeExplanations: ["Premium organic product misdescribed — request specification sheets"],
    riskConsiderations: "Over-invoicing could transfer USD ~800k of excess value; also sanctions risk depending on routes.",
    conclusion: "Significant TBML indicators. Do not pay pending satisfactory explanation; escalate and consider reporting.",
    references: [{ title: "FATF — Trade-Based Money Laundering", url: "https://www.fatf-gafi.org/" }],
    followUpQuestions: [{ q: "Why is the late beneficiary amendment important?", a: "Changing the recipient late in the process can redirect value to a party that has not been diligenced." }],
    simulation: {
      documents: [
        { id: "d1", title: "Commercial invoice", content: "20,000 pcs basic cotton T-shirts, unit USD 45.00, total USD 900,000." },
        { id: "d2", title: "LC amendment", content: "Beneficiary changed from Garment Works Co. to Apex Global FZE (incorporated 2 months ago)." },
      ],
      steps: [
        { id: "s1", kind: "indicators", multi: true, prompt: "Which red flags do you see?", options: [
          o("a", "Unit price far above market", true, ""), o("b", "Late beneficiary change to a new company", true, ""), o("c", "Transshipment without rationale", true, ""), o("d", "Use of a letter of credit", false, "LCs are normal trade instruments."),
        ] },
        { id: "s2", kind: "recommendation", multi: false, prompt: "Your recommendation?", options: [
          o("a", "Pay — documents comply on their face", false, "Compliance on the face doesn't remove financial crime concerns."), o("b", "Hold and escalate pending explanation, due diligence on the new beneficiary and shipment verification", true, ""), o("c", "Pay but reduce the amount", false, "No basis."),
        ] },
      ],
      modelReasoning: "Extreme price inflation, a newly created beneficiary substituted late, and unexplained transshipment together indicate possible over-invoicing. Escalate and hold pending verification.",
    },
  },
  {
    slug: "tender-consultant-abc",
    title: "The tender consultant",
    summary: "A consultant recommended by an official requests a large success fee paid offshore.",
    category: "ABC_INVESTIGATION", topic: "abc", difficulty: "ADVANCED", tier: "PREMIUM",
    background: "Your company (fictional) is bidding for a hospital equipment tender. A consultant recommended by a ministry procurement official offers support.",
    profile: "Consultant firm: established last year, two employees, no sector track record.",
    transactionDetails: "Proposed 12% success fee on a USD 8m contract; 30% requested in advance to an account in a third country.",
    businessContext: "High-corruption-risk jurisdiction; public procurement.",
    redFlags: ["Recommended by an official", "High success fee", "Advance payment", "Offshore account", "Thin experience"],
    riskIndicators: ["Potential conduit for a bribe"],
    investigationQuestions: ["Relationship between consultant and official?", "What services exactly?", "Is the fee market-rate?"],
    evidenceRequired: ["Ownership and background of consultant", "Scope of work", "Market benchmarks", "Bank account details"],
    investigationSteps: ["EDD on consultant", "Assess official links", "Benchmark fees", "Legal review", "Decision by compliance committee"],
    possibleFindings: "The consultant's director is the official's cousin.",
    alternativeExplanations: ["The consultant may have legitimate local expertise — but the family link makes this very high risk"],
    riskConsiderations: "Exposure under UK Bribery Act s.7, FCPA and local law.",
    conclusion: "Do not engage. Report internally; consider whether the tender approach should be reviewed.",
    references: [{ title: "UK Bribery Act 2010", url: "https://www.legislation.gov.uk/ukpga/2010/23/contents" }, { title: "DOJ — FCPA", url: "https://www.justice.gov/criminal/criminal-fraud/foreign-corrupt-practices-act" }],
    followUpQuestions: [{ q: "Would reducing the fee to 5% make engagement acceptable?", a: "No — the family link to the official is the core problem, not only the fee level." }],
    simulation: {
      documents: [
        { id: "d1", title: "Consultant proposal", content: "Services: 'relationship management and tender facilitation'. Fee: 12% success, 30% advance to account in [third country]." },
        { id: "d2", title: "Due diligence finding", content: "Director of consultant firm is a cousin of the ministry procurement official." },
      ],
      steps: [
        { id: "s1", kind: "indicators", multi: true, prompt: "Which red flags are present?", options: [
          o("a", "Recommendation by an official", true, ""), o("b", "Offshore advance payment", true, ""), o("c", "Vague services", true, ""), o("d", "Written proposal", false, "Documentation itself is not a red flag."),
        ] },
        { id: "s2", kind: "recommendation", multi: false, prompt: "Decision?", options: [
          o("a", "Engage with anti-bribery clauses", false, "Clauses can't cure a conflicted conduit."), o("b", "Do not engage; escalate internally", true, ""), o("c", "Engage but pay onshore", false, "Family link remains."),
        ] },
      ],
      modelReasoning: "The consultant is linked to the official, fees are high and vague, and payment is offshore — a textbook bribery conduit. Do not engage and escalate.",
    },
  },
  {
    slug: "exchange-mixer-exposure",
    title: "Indirect mixer exposure at a crypto exchange",
    summary: "Assess a customer deposit with indirect exposure to a sanctioned mixing service.",
    category: "CRYPTO", topic: "crypto", difficulty: "ADVANCED", tier: "PREMIUM",
    background: "An exchange customer (fictional) deposits 12 BTC. Analytics shows 30% indirect exposure to a sanctioned mixer, three hops away.",
    profile: "Customer onboarded 2 years ago; declared occupation: IT consultant; typical deposits 0.1–0.5 BTC.",
    transactionDetails: "Deposit 12 BTC from an address funded via several intermediate addresses.",
    businessContext: "Licensed VASP with travel-rule procedures.",
    redFlags: ["Indirect exposure to sanctioned service", "Deposit far above typical size"],
    riskIndicators: ["Possible sanctions exposure", "Possible laundering"],
    investigationQuestions: ["How reliable is the attribution?", "What is the funds' path?", "Customer's explanation of source?"],
    evidenceRequired: ["Analytics trace report", "Customer source-of-funds evidence", "Counterparty VASP information"],
    investigationSteps: ["Review trace with confidence levels", "Request source of funds", "Assess sanctions implications with legal", "Decide on withdrawal restrictions"],
    possibleFindings: "Funds passed through a peel chain from an address that received mixer outputs.",
    alternativeExplanations: ["Customer bought BTC OTC from a counterparty unaware of the history"],
    riskConsiderations: "Sanctions obligations may apply to property in which a blocked person has an interest; indirect exposure requires careful legal analysis.",
    conclusion: "Escalate to sanctions/legal, request source-of-funds evidence, restrict withdrawals per policy pending review, and consider reporting.",
    references: [{ title: "FATF — Virtual assets", url: "https://www.fatf-gafi.org/en/topics/virtual-assets.html" }],
    followUpQuestions: [{ q: "Why isn't a 3-hop exposure automatically a violation?", a: "Indirect exposure indicates risk; whether a blocked interest exists depends on facts and legal analysis." }],
    simulation: {
      documents: [{ id: "d1", title: "Analytics summary", content: "Deposit 12 BTC. Indirect exposure: 30% sanctioned mixer (3 hops). Pattern: peel chain." }],
      steps: [
        { id: "s1", kind: "request", multi: true, prompt: "What should you obtain?", options: [
          o("a", "Customer source-of-funds evidence (e.g., OTC purchase records)", true, ""), o("b", "Full trace with confidence levels", true, ""), o("c", "Customer's private keys", false, "Never request private keys."),
        ] },
        { id: "s2", kind: "recommendation", multi: false, prompt: "Recommendation?", options: [
          o("a", "Credit and allow withdrawal", false, ""), o("b", "Escalate, restrict per policy, and assess reporting", true, ""), o("c", "Return funds to the sending address immediately", false, "May itself raise sanctions concerns without legal review."),
        ] },
      ],
      modelReasoning: "Indirect exposure plus an atypical deposit requires escalation, SoF evidence and legal analysis before funds move.",
    },
  },
];
