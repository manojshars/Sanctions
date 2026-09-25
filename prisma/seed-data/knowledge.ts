export interface SeedRegulation {
  slug: string;
  authority: string;
  title: string;
  jurisdiction: string;
  summary: string;
  url: string;
  published?: string;
  effective?: string;
  dateNote?: string;
  status?: "CURRENT" | "HISTORICAL";
  topic?: string;
}

/**
 * Only dates the editorial team is confident of are included; others are left blank and
 * shown as "see official source". Always confirm against the official link.
 */
export const REGULATIONS: SeedRegulation[] = [
  { slug: "ofac-sanctions-programs", authority: "OFAC", jurisdiction: "United States", topic: "sanctions", title: "OFAC Sanctions Programs and Country Information", summary: "Index of active US sanctions programmes with programme-specific regulations, executive orders, guidance, FAQs and general licences.", url: "https://ofac.treasury.gov/sanctions-programs-and-country-information" },
  { slug: "ofac-sanctions-list-service", authority: "OFAC", jurisdiction: "United States", topic: "sanctions", title: "OFAC Sanctions List Service (SDN and Consolidated Lists)", summary: "Official source for the SDN List and non-SDN lists, with search and downloadable data files.", url: "https://ofac.treasury.gov/sanctions-list-service" },
  { slug: "ofac-50-percent-guidance", authority: "OFAC", jurisdiction: "United States", topic: "sanctions", title: "Revised Guidance on Entities Owned by Persons Whose Property and Interests in Property Are Blocked (50 Percent Rule)", summary: "Explains that entities owned 50% or more in the aggregate, directly or indirectly, by one or more blocked persons are themselves blocked.", url: "https://ofac.treasury.gov/", published: "2014-08-13" },
  { slug: "ofac-compliance-framework", authority: "OFAC", jurisdiction: "United States", topic: "sanctions", title: "A Framework for OFAC Compliance Commitments", summary: "Describes five essential components of a sanctions compliance programme: management commitment, risk assessment, internal controls, testing and auditing, and training.", url: "https://ofac.treasury.gov/", published: "2019-05-02" },
  { slug: "ofac-enforcement-guidelines", authority: "OFAC", jurisdiction: "United States", topic: "sanctions", title: "Economic Sanctions Enforcement Guidelines (31 CFR Part 501, Appendix A)", summary: "Sets out the factors OFAC considers when responding to apparent violations, including wilfulness, harm, compliance programme and co-operation.", url: "https://ofac.treasury.gov/civil-penalties-and-enforcement-information" },
  { slug: "un-sc-consolidated-list", authority: "United Nations Security Council", jurisdiction: "International", topic: "sanctions", title: "United Nations Security Council Consolidated List", summary: "Consolidated list of individuals and entities subject to measures imposed by the Security Council.", url: "https://main.un.org/securitycouncil/en/content/un-sc-consolidated-list" },
  { slug: "eu-sanctions-overview", authority: "European Union", jurisdiction: "European Union", topic: "sanctions", title: "EU Sanctions (Restrictive Measures) — European Commission overview", summary: "Commission resources on EU restrictive measures, including guidance, FAQs and consolidated financial sanctions data.", url: "https://finance.ec.europa.eu/eu-and-world/sanctions-restrictive-measures_en" },
  { slug: "eu-sanctions-map", authority: "European Union", jurisdiction: "European Union", topic: "sanctions", title: "EU Sanctions Map", summary: "Interactive tool summarising EU restrictive measures by regime with links to legal acts.", url: "https://www.sanctionsmap.eu/" },
  { slug: "eu-blocking-statute", authority: "European Union", jurisdiction: "European Union", topic: "sanctions", title: "Council Regulation (EC) No 2271/96 (Blocking Statute)", summary: "Protects EU operators against the effects of specified extraterritorial legislation of third countries.", url: "https://eur-lex.europa.eu/eli/reg/1996/2271/oj", published: "1996-11-22" },
  { slug: "uk-ofsi", authority: "UK OFSI / HM Treasury", jurisdiction: "United Kingdom", topic: "sanctions", title: "Office of Financial Sanctions Implementation — guidance and resources", summary: "OFSI guidance on UK financial sanctions, licensing, reporting obligations and enforcement.", url: "https://www.gov.uk/government/organisations/office-of-financial-sanctions-implementation" },
  { slug: "uk-sanctions-list", authority: "UK FCDO", jurisdiction: "United Kingdom", topic: "sanctions", title: "The UK Sanctions List", summary: "The UK Government's list of persons, entities and ships designated under UK sanctions regulations made under SAMLA 2018.", url: "https://www.gov.uk/government/publications/the-uk-sanctions-list" },
  { slug: "uk-samla-2018", authority: "UK Parliament", jurisdiction: "United Kingdom", topic: "sanctions", title: "Sanctions and Anti-Money Laundering Act 2018", summary: "Primary legislation enabling the UK to make sanctions and anti-money laundering regulations.", url: "https://www.legislation.gov.uk/ukpga/2018/13/contents", published: "2018-05-23" },
  { slug: "fatf-recommendations", authority: "FATF", jurisdiction: "International", topic: "aml-ctf", title: "The FATF Recommendations", summary: "International standards on combating money laundering and the financing of terrorism and proliferation. Updated periodically — check the latest version.", url: "https://www.fatf-gafi.org/en/publications/Fatfrecommendations/Fatf-recommendations.html", published: "2012-02-16", dateNote: "Adopted February 2012; amended regularly since." },
  { slug: "fatf-high-risk-jurisdictions", authority: "FATF", jurisdiction: "International", topic: "aml-ctf", title: "High-risk and other monitored jurisdictions", summary: "FATF public statements identifying jurisdictions subject to a call for action and jurisdictions under increased monitoring. Updated after each plenary.", url: "https://www.fatf-gafi.org/en/topics/high-risk-and-other-monitored-jurisdictions.html" },
  { slug: "fatf-virtual-assets", authority: "FATF", jurisdiction: "International", topic: "crypto", title: "FATF guidance on virtual assets and VASPs", summary: "Guidance on applying the risk-based approach and the travel rule to virtual assets and virtual asset service providers.", url: "https://www.fatf-gafi.org/en/topics/virtual-assets.html" },
  { slug: "fincen-bsa", authority: "FinCEN", jurisdiction: "United States", topic: "aml-ctf", title: "Bank Secrecy Act resources", summary: "FinCEN resources on BSA requirements, including reporting (SARs, CTRs), recordkeeping and guidance.", url: "https://www.fincen.gov/resources/statutes-and-regulations" },
  { slug: "fincen-cdd-rule", authority: "FinCEN", jurisdiction: "United States", topic: "kyc-cdd", title: "Customer Due Diligence Requirements for Financial Institutions (CDD Rule)", summary: "Requires covered financial institutions to identify and verify beneficial owners of legal entity customers and to conduct ongoing monitoring.", url: "https://www.fincen.gov/resources/statutes-and-regulations/cdd-final-rule", published: "2016-05-11", effective: "2018-05-11" },
  { slug: "uk-poca-2002", authority: "UK Parliament", jurisdiction: "United Kingdom", topic: "aml-ctf", title: "Proceeds of Crime Act 2002", summary: "Contains the principal UK money laundering offences, reporting obligations and tipping-off offences.", url: "https://www.legislation.gov.uk/ukpga/2002/29/contents" },
  { slug: "uk-mlrs-2017", authority: "UK Parliament", jurisdiction: "United Kingdom", topic: "aml-ctf", title: "Money Laundering, Terrorist Financing and Transfer of Funds (Information on the Payer) Regulations 2017", summary: "Sets UK preventive AML/CTF requirements including risk assessment, CDD, EDD, record keeping and policies.", url: "https://www.legislation.gov.uk/uksi/2017/692/contents" },
  { slug: "uk-bribery-act-2010", authority: "UK Parliament", jurisdiction: "United Kingdom", topic: "abc", title: "Bribery Act 2010", summary: "UK offences of bribing, being bribed, bribing a foreign public official, and failure of commercial organisations to prevent bribery.", url: "https://www.legislation.gov.uk/ukpga/2010/23/contents" },
  { slug: "uk-eccta-failure-to-prevent-fraud", authority: "UK Home Office", jurisdiction: "United Kingdom", topic: "fraud", title: "Failure to prevent fraud offence — guidance (ECCTA 2023)", summary: "Guidance on the corporate offence of failure to prevent fraud and reasonable fraud prevention procedures.", url: "https://www.gov.uk/government/publications/offence-of-failure-to-prevent-fraud-introduced-by-eccta", effective: "2025-09-01" },
  { slug: "us-fcpa", authority: "US Department of Justice", jurisdiction: "United States", topic: "abc", title: "Foreign Corrupt Practices Act", summary: "DOJ resources on the FCPA anti-bribery and accounting provisions, including the Resource Guide.", url: "https://www.justice.gov/criminal/criminal-fraud/foreign-corrupt-practices-act" },
  { slug: "us-bis-ear", authority: "US Bureau of Industry and Security", jurisdiction: "United States", topic: "export-controls", title: "Export Administration Regulations (EAR)", summary: "US export controls on dual-use and certain military items, including the Commerce Control List and Entity List.", url: "https://www.bis.gov/" },
  { slug: "eu-dual-use-regulation", authority: "European Union", jurisdiction: "European Union", topic: "export-controls", title: "Regulation (EU) 2021/821 (Dual-Use Regulation)", summary: "EU regime for the control of exports, brokering, technical assistance, transit and transfer of dual-use items.", url: "https://eur-lex.europa.eu/eli/reg/2021/821/oj" },
  { slug: "eu-amlr-2024", authority: "European Union", jurisdiction: "European Union", topic: "aml-ctf", title: "Regulation (EU) 2024/1624 (AML Regulation)", summary: "Directly applicable EU rulebook on preventing the use of the financial system for money laundering or terrorist financing.", url: "https://eur-lex.europa.eu/eli/reg/2024/1624/oj", effective: "2027-07-10", dateNote: "Applies generally from 10 July 2027." },
  { slug: "eu-amla-regulation", authority: "European Union", jurisdiction: "European Union", topic: "aml-ctf", title: "Regulation (EU) 2024/1620 establishing the Anti-Money Laundering Authority (AMLA)", summary: "Establishes AMLA with supervisory and coordination powers across the EU.", url: "https://eur-lex.europa.eu/eli/reg/2024/1620/oj" },
  { slug: "eu-directive-2015-849", authority: "European Union", jurisdiction: "European Union", topic: "aml-ctf", title: "Directive (EU) 2015/849 (Fourth AML Directive, as amended)", summary: "The directive-based EU AML framework, being replaced by the AMLR package. Retained here for historical context.", url: "https://eur-lex.europa.eu/eli/dir/2015/849/oj", status: "HISTORICAL", dateNote: "Being superseded by the 2024 AML package; check transitional provisions." },
  { slug: "eu-mica", authority: "European Union", jurisdiction: "European Union", topic: "crypto", title: "Regulation (EU) 2023/1114 on Markets in Crypto-Assets (MiCA)", summary: "EU framework for crypto-asset issuance and crypto-asset service providers.", url: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj" },
  { slug: "india-pmla-2002", authority: "Government of India", jurisdiction: "India", topic: "aml-ctf", title: "Prevention of Money Laundering Act, 2002", summary: "India's principal AML statute establishing the offence of money laundering and reporting entity obligations.", url: "https://www.indiacode.nic.in/" },
  { slug: "india-fiu-ind", authority: "FIU-IND", jurisdiction: "India", topic: "aml-ctf", title: "Financial Intelligence Unit — India", summary: "India's FIU, receiving reports from reporting entities (e.g., STRs and CTRs) and publishing guidance.", url: "https://fiuindia.gov.in/" },
  { slug: "india-rbi-kyc", authority: "Reserve Bank of India", jurisdiction: "India", topic: "kyc-cdd", title: "RBI Master Direction — Know Your Customer (KYC) Direction, 2016 (as amended)", summary: "KYC, CDD and AML requirements for RBI-regulated entities. Updated periodically.", url: "https://www.rbi.org.in/" },
  { slug: "india-sebi", authority: "Securities and Exchange Board of India", jurisdiction: "India", topic: "aml-ctf", title: "SEBI AML/CFT guidelines for intermediaries", summary: "AML/CFT obligations for SEBI-registered intermediaries.", url: "https://www.sebi.gov.in/" },
  { slug: "wolfsberg-cbddq", authority: "The Wolfsberg Group", jurisdiction: "International", topic: "aml-ctf", title: "Correspondent Banking Due Diligence Questionnaire (CBDDQ)", summary: "Industry standard questionnaire for correspondent banking due diligence. (Industry body, not a regulator.)", url: "https://wolfsberg-group.org/" },
];

export interface SeedTypology {
  slug: string;
  title: string;
  category: "MONEY_LAUNDERING" | "SANCTIONS_EVASION" | "FRAUD" | "ABC" | "TRADE_BASED" | "CUSTOMER_RISK" | "TRANSACTION";
  description: string;
  indicators: string[];
  example?: string;
  source?: string;
  url?: string;
}

export const TYPOLOGIES: SeedTypology[] = [
  { slug: "cash-structuring", title: "Cash structuring", category: "MONEY_LAUNDERING", description: "Splitting cash deposits to avoid reporting thresholds or scrutiny.", indicators: ["Repeated deposits just below reporting thresholds", "Deposits at multiple branches or ATMs on the same day", "Use of multiple individuals to deposit into one account", "Customer asks about reporting thresholds"], example: "Fictional: four deposits of 9,500 on consecutive days at different branches." },
  { slug: "shell-company-layering", title: "Layering through shell companies", category: "MONEY_LAUNDERING", description: "Use of companies with little or no operations to move funds through multiple accounts and jurisdictions.", indicators: ["Round-amount transfers described as 'consulting' or 'services'", "Shared registered addresses and nominee directors", "Funds pass through with little retained balance", "Counterparties in multiple secrecy jurisdictions"] },
  { slug: "professional-enablers", title: "Misuse of professional enablers", category: "MONEY_LAUNDERING", description: "Use of lawyers, accountants, TCSPs or real estate agents to create structures and lend credibility.", indicators: ["Client account used to pass funds without underlying legal service", "Complex structures without commercial rationale", "Instructions from third parties not the client"], source: "FATF — Professional Money Laundering (2018)", url: "https://www.fatf-gafi.org/" },
  { slug: "front-company-procurement", title: "Front companies in procurement networks", category: "SANCTIONS_EVASION", description: "Newly created intermediaries acquire goods or funds on behalf of sanctioned parties.", indicators: ["Recently incorporated company with large orders", "Located in transshipment hubs", "Business profile inconsistent with goods ordered", "Payments from unrelated third parties"] },
  { slug: "maritime-deception", title: "Deceptive shipping practices", category: "SANCTIONS_EVASION", description: "Methods used to conceal the origin, destination or identity of vessels and cargo.", indicators: ["AIS gaps or spoofing", "Ship-to-ship transfers in high-risk areas", "Frequent flag or name changes", "Opaque single-vessel ownership structures", "Inconsistent cargo documentation"] },
  { slug: "post-designation-transfers", title: "Post-designation asset transfers", category: "SANCTIONS_EVASION", description: "Designated persons transfer assets to relatives or associates to avoid asset freezes.", indicators: ["Transfers shortly before or after designation", "Nominal consideration", "Designated person retains a public role", "New owner lacks means or expertise"] },
  { slug: "app-scam-mules", title: "APP scam proceeds through mule accounts", category: "FRAUD", description: "Scam victims' payments are routed through mule accounts and rapidly dispersed.", indicators: ["Many credits from unrelated individuals", "Rapid outbound transfers or crypto purchases", "Account recently opened or dormant", "Shared devices across accounts"] },
  { slug: "account-takeover-pattern", title: "Account takeover pattern", category: "FRAUD", description: "Criminals compromise credentials or phone numbers and drain accounts.", indicators: ["Contact detail change followed by new payee", "Login from new device or unusual location", "Multiple failed logins", "High-value payment soon after profile change"] },
  { slug: "third-party-intermediary-bribery", title: "Bribery through intermediaries", category: "ABC", description: "Agents or consultants are used to pass bribes to decision-makers.", indicators: ["Agent recommended by an official", "Unusually high commission or success fee", "Vague service descriptions", "Payment to offshore or third-party accounts", "Resistance to anti-bribery clauses"] },
  { slug: "improper-hospitality", title: "Improper gifts and hospitality", category: "ABC", description: "Hospitality or gifts used to influence decisions.", indicators: ["Hospitality during a tender", "Lavish or frequent events for the same official", "Family members invited", "Cash or cash equivalents"] },
  { slug: "tbml-mis-invoicing", title: "Mis-invoicing", category: "TRADE_BASED", description: "Over- or under-invoicing goods to transfer value between trading parties.", indicators: ["Unit prices inconsistent with market", "Goods inconsistent with business", "Frequent amendments to documents", "Circular trade"] },
  { slug: "tbml-phantom-shipment", title: "Phantom shipments", category: "TRADE_BASED", description: "Payments are made for goods that are never shipped, supported by forged documents.", indicators: ["No verifiable vessel movement", "Documents with inconsistencies", "Counterparties unable to demonstrate operations"] },
  { slug: "unexplained-wealth", title: "Unexplained wealth", category: "CUSTOMER_RISK", description: "Customer's wealth is inconsistent with known income or business activity.", indicators: ["Wealth disproportionate to career", "Gaps in wealth timeline", "Reluctance to provide evidence", "Links to high-corruption sectors"] },
  { slug: "opaque-ownership", title: "Opaque ownership structures", category: "CUSTOMER_RISK", description: "Multi-layered structures that obscure beneficial ownership.", indicators: ["Nominee shareholders or directors", "Bearer-share history", "Trusts with unclear beneficiaries", "Unwillingness to disclose owners"] },
  { slug: "rapid-movement", title: "Rapid movement of funds", category: "TRANSACTION", description: "Funds flow in and out quickly with little economic rationale.", indicators: ["Credits followed by same-day debits of similar value", "Low average balance relative to turnover", "Multiple jurisdictions involved"] },
  { slug: "high-risk-corridor", title: "High-risk corridor payments", category: "TRANSACTION", description: "Payments involving jurisdictions with elevated ML/TF or sanctions risk without clear rationale.", indicators: ["Counterparties in jurisdictions under FATF increased monitoring or call for action", "Unusual routing", "Payment references that don't fit the business"] },
];

export interface SeedArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: "EDUCATIONAL" | "REGULATORY_EXPLAINER" | "TRENDS" | "INVESTIGATION_GUIDE" | "CASE_ANALYSIS" | "CONTROL_GUIDANCE";
  topic: string;
  minutes: number;
  sources: { title: string; url: string }[];
  content: string;
}

export const ARTICLES: SeedArticle[] = [
  {
    slug: "ofac-50-percent-rule-explained", title: "The OFAC 50 Percent Rule, explained with worked examples", category: "REGULATORY_EXPLAINER", topic: "sanctions", minutes: 7,
    excerpt: "Aggregation, indirect ownership and the difference between ownership and control — with step-by-step calculations.",
    sources: [{ title: "OFAC — Revised Guidance on Entities Owned by Blocked Persons (2014)", url: "https://ofac.treasury.gov/" }],
    content: `OFAC's 50 Percent Rule is one of the most frequently misunderstood sanctions concepts. This explainer walks through the rule and four worked examples.

## The rule in one sentence
An entity owned **50 percent or more in the aggregate**, directly or indirectly, by one or more blocked persons is itself blocked — even if it does not appear on the SDN List.

## Three principles
1. **Aggregate** holdings of different blocked persons.
2. **Trace through blocked entities** to find indirect ownership.
3. **Ownership, not control** triggers the rule — but control is a risk factor that warrants caution.

## Worked example
SDN A owns 25% of Company R directly and 100% of Company S. S owns 30% of R. S is blocked, so R's blocked ownership is 25% + 30% = **55%** — R is blocked.

## Common mistakes
- Counting only the largest single SDN holding
- Stopping at the first corporate layer
- Assuming EU/UK thresholds are identical (they use "more than 50%" plus control)

This article is educational and does not constitute legal advice. Refer to OFAC's official guidance and FAQs.`,
  },
  {
    slug: "writing-better-alert-dispositions", title: "Writing better alert dispositions", category: "INVESTIGATION_GUIDE", topic: "transaction-monitoring", minutes: 5,
    excerpt: "Specific, evidence-based and reproducible: a practical checklist for monitoring and screening analysts.",
    sources: [],
    content: `A disposition is the permanent record of why an alert was closed or escalated. Reviewers, auditors and supervisors will read it long after you've moved on.

## Checklist
- **Reference the data:** dates, amounts, counterparties, identifiers compared
- **State the expected profile:** what did KYC say should happen?
- **Explain the reasoning:** why is the activity consistent — or not?
- **Record corroboration:** what did you verify, and how?
- **Be reproducible:** could a colleague reach the same conclusion?

## Before and after
*Weak:* "Activity normal, closing."

*Strong:* "Alerted on 3 incoming wires totalling 84,200 from Supplier Y (known counterparty since 2021). Values consistent with invoices on file and seasonal Q4 pattern seen in 2023 and 2024. No adverse media on counterparty. Closing — no unusual activity identified."`,
  },
  {
    slug: "app-fraud-reimbursement-uk", title: "APP fraud reimbursement in the UK: what compliance teams should know", category: "REGULATORY_EXPLAINER", topic: "fraud", minutes: 6,
    excerpt: "An overview of the mandatory reimbursement regime for authorised push payment scams introduced in October 2024.",
    sources: [{ title: "Payment Systems Regulator — APP scams", url: "https://www.psr.org.uk/" }],
    content: `Since **7 October 2024**, UK payment service providers have been subject to mandatory reimbursement requirements for APP scams over Faster Payments (with CHAPS covered by a parallel regime).

## Key features
- Sending and receiving firms share reimbursement costs
- A maximum reimbursement limit applies
- Exceptions include first-party fraud and consumer gross negligence
- Firms have strong incentives to detect mules and intervene effectively

## Implications
Fraud and AML teams increasingly collaborate on mule detection, while product teams invest in contextual warnings and payment friction for high-risk payments.

Always check the latest PSR policy statements for current limits and rules.`,
  },
  {
    slug: "fraud-aml-convergence-why-it-matters", title: "Fraud and AML convergence: why it matters", category: "TRENDS", topic: "fraud", minutes: 5,
    excerpt: "Fraud creates proceeds; laundering moves them. Joined-up teams see the whole picture.",
    sources: [],
    content: `Scam proceeds rarely stay in the first receiving account. They move through mule networks, crypto on-ramps and cash withdrawals within minutes.

## What convergence looks like
- Shared data on devices, identities and counterparties
- Joint typology development
- Unified case management for mule investigations
- Coordinated reporting and customer outreach

## Where to start
Begin with shared data and a joint mule-detection use case. Organisational change can follow once value is demonstrated.`,
  },
  {
    slug: "ubo-verification-good-practice", title: "Beneficial ownership verification: good practice", category: "CONTROL_GUIDANCE", topic: "kyc-cdd", minutes: 6,
    excerpt: "How to calculate indirect ownership, when to look beyond registers, and how to document your conclusion.",
    sources: [{ title: "FATF — Guidance on Beneficial Ownership of Legal Persons", url: "https://www.fatf-gafi.org/" }],
    content: `Beneficial ownership is central to AML and sanctions controls. Good practice includes:

1. **Map every layer** of ownership to natural persons.
2. **Multiply along chains** and add chains held by the same person.
3. **Look for control** beyond shareholding: voting agreements, appointment rights.
4. **Corroborate** registers with independent sources and customer documents.
5. **Record discrepancies** and report them where required.
6. **Refresh** on trigger events and periodic review.`,
  },
  {
    slug: "sanctions-screening-false-positives", title: "Reducing sanctions false positives without increasing risk", category: "CONTROL_GUIDANCE", topic: "sanctions", minutes: 6,
    excerpt: "Data quality, secondary identifiers and governed good-guy lists — and what not to do.",
    sources: [],
    content: `False positives consume analyst time, but careless reduction creates sanctions exposure.

## Safe levers
- Improve customer data completeness (DOB, country, registration numbers)
- Use secondary identifiers in tested, approved matching rules
- Maintain good-guy lists with governance and re-screening on list updates
- Tune thresholds with documented testing

## Unsafe practices
- Removing aliases from list data
- Suppressing whole countries or name tokens without analysis
- Asking customers to alter payment references`,
  },
  {
    slug: "fictional-case-analysis-trading-house", title: "Case analysis (fictional): the trading house with three banks", category: "CASE_ANALYSIS", topic: "trade-based", minutes: 7,
    excerpt: "A fictional training scenario exploring multiple invoicing across banks and how data-sharing could have helped.",
    sources: [],
    content: `**This is a fictional training case.** Any resemblance to real entities is coincidental.

Orion Trading House financed the same shipment of electronics at three banks using slightly different invoice numbers and dates. Each bank's documents appeared compliant in isolation.

## What went wrong
- No bank verified shipment movement independently
- Invoice values were within plausible ranges
- No mechanism to detect duplicate financing across banks

## Lessons
- Use vessel and container tracking where available
- Watch for frequent amendments and unusual urgency
- Participate in lawful information-sharing initiatives where they exist`,
  },
  {
    slug: "risk-based-approach-in-practice", title: "The risk-based approach in practice", category: "EDUCATIONAL", topic: "governance", minutes: 5,
    excerpt: "What proportionality really means — and why de-risking whole sectors is not the answer.",
    sources: [{ title: "FATF Recommendation 1", url: "https://www.fatf-gafi.org/en/publications/Fatfrecommendations/Fatf-recommendations.html" }],
    content: `The risk-based approach asks firms to understand their risks and apply controls proportionately.

## In practice
- Higher-risk customers receive EDD; lower-risk customers may receive simplified measures where permitted
- Resources are directed to where risk is greatest
- Decisions and rationale are documented

## What it is not
It is not a reason to exit entire categories of customers without individual assessment. FATF has repeatedly highlighted the unintended consequences of wholesale de-risking for financial inclusion.`,
  },
];
