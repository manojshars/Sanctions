import type { SeedCourse } from "../types";

export const ABC_COURSES: SeedCourse[] = [
  {
    slug: "abc-fundamentals",
    title: "ABC Fundamentals",
    subtitle: "Anti-bribery and corruption laws, risks and responsibilities",
    topic: "abc",
    level: "BEGINNER",
    minutes: 120,
    tier: "FREE",
    cpd: 2,
    overview:
      "A foundation course on bribery and corruption: key concepts, major laws such as the US FCPA and UK Bribery Act, corporate liability, and the practical controls every employee should understand.",
    objectives: [
      "Define bribery and corruption and recognise common forms",
      "Summarise key provisions of the FCPA and UK Bribery Act",
      "Explain corporate liability and the adequate procedures defence",
      "Identify everyday bribery risks and how to respond",
    ],
    keywords: ["bribery", "corruption", "FCPA", "UK Bribery Act", "adequate procedures"],
    related: ["third-party-intermediary-due-diligence", "gifts-hospitality-conflicts", "abc-controls-program-design"],
    modules: [
      {
        title: "Concepts and laws",
        lessons: [
          {
            title: "What is bribery?",
            minutes: 12,
            content: `## Bribery
Bribery is offering, promising, giving, requesting or accepting **anything of value** to improperly influence a person in the performance of their duties. "Anything of value" includes cash, gifts, hospitality, travel, jobs or internships for relatives, donations and sponsorships.

## Corruption
Corruption is the abuse of entrusted power for private gain. It includes bribery, but also embezzlement, nepotism, trading in influence and extortion.

## Common forms
- Kickbacks on contracts
- Payments to officials for licences, permits or inspections
- Excessive hospitality around tenders
- Charitable donations or sponsorships requested by decision-makers
- Payments routed through agents or consultants`,
          },
          {
            title: "Key laws: FCPA and UK Bribery Act",
            minutes: 14,
            content: `## US Foreign Corrupt Practices Act (1977)
- **Anti-bribery provisions:** prohibit corruptly giving anything of value to foreign officials to obtain or retain business.
- **Accounting provisions:** issuers must keep accurate books and records and maintain adequate internal accounting controls.
- Contains a narrow exception for **facilitating payments** for routine governmental action.

## UK Bribery Act 2010
- Section 1: bribing another person; Section 2: being bribed
- Section 6: bribing a foreign public official
- **Section 7:** a commercial organisation fails to prevent bribery by an associated person — a strict liability offence with a defence of **adequate procedures**
- **No exception** for facilitation payments
- Applies to public and private sector bribery

## Other laws
Many countries have their own laws — e.g., India's Prevention of Corruption Act, 1988 (amended in 2018 to include corporate liability and a bribe-giving offence). The OECD Anti-Bribery Convention and the UN Convention against Corruption drive international alignment.`,
          },
        ],
      },
      {
        title: "Everyday risk",
        lessons: [
          {
            title: "Recognising and responding to red flags",
            minutes: 12,
            content: `## Red flags
- Requests for cash or payments to third countries or unrelated accounts
- Agents with close ties to officials or recommended by the official
- Unusually high commissions or vague service descriptions
- Requests for donations or jobs for relatives during a tender
- Refusal to agree to anti-bribery contract clauses

## How to respond
1. Do not agree to or make the payment
2. Record the facts
3. Report to your manager or compliance team, or via speak-up channels
4. Where there is a threat to health, safety or liberty, prioritise safety and report afterwards (duress situations are treated differently by most policies)`,
            exercise:
              "A customs official suggests a 'processing fee' in cash to release a shipment faster. How should you respond under the UK Bribery Act and under the FCPA?",
          },
        ],
      },
    ],
  },
  {
    slug: "bribery-corruption-risk-assessment",
    title: "Bribery and Corruption Risk Assessment",
    subtitle: "Identifying and assessing corruption risk across the business",
    topic: "abc",
    level: "INTERMEDIATE",
    minutes: 100,
    tier: "PREMIUM",
    cpd: 1.5,
    overview:
      "Learn how to conduct an ABC risk assessment covering country, sector, transaction, business opportunity and partnership risks.",
    objectives: [
      "Identify the main categories of bribery risk",
      "Use indices and internal data to assess risk",
      "Link assessment outcomes to proportionate procedures",
    ],
    keywords: ["risk assessment", "country risk", "sector risk", "ABC"],
    related: ["abc-fundamentals", "abc-controls-program-design"],
    modules: [
      {
        title: "Assessment",
        lessons: [
          {
            title: "Risk categories",
            minutes: 14,
            content: `## Five risk families (UK MoJ guidance themes)
- **Country risk:** perceived corruption levels, weak governance
- **Sectoral risk:** extractives, construction, defence, healthcare, infrastructure
- **Transaction risk:** donations, licences, public procurement
- **Business opportunity risk:** high-value projects, many contractors or intermediaries
- **Business partnership risk:** intermediaries, joint ventures, relationships with PEPs

## Inputs
Corruption perception indices, enforcement actions, internal incident data, interviews with business leaders, and third-party register analysis.

## Output
A documented assessment with risk ratings and proportionate procedures for each risk area — reviewed periodically and when the business changes.`,
          },
        ],
      },
    ],
  },
  {
    slug: "third-party-intermediary-due-diligence",
    title: "Third-Party and Intermediary Due Diligence",
    subtitle: "Managing the highest source of bribery risk",
    topic: "abc",
    level: "INTERMEDIATE",
    minutes: 110,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Most major bribery enforcement cases involve third parties. Learn to risk-tier intermediaries, conduct due diligence, set contractual protections and monitor relationships.",
    objectives: [
      "Risk-tier third parties",
      "Conduct due diligence proportionate to risk",
      "Use contractual protections and ongoing monitoring",
    ],
    keywords: ["third parties", "agents", "intermediaries", "due diligence"],
    related: ["abc-fundamentals", "practical-abc-case-studies"],
    modules: [
      {
        title: "Due diligence",
        lessons: [
          {
            title: "Risk-tiering and due diligence",
            minutes: 14,
            content: `## Risk-tiering factors
Interaction with officials, country risk, service type (e.g., sales agents, customs brokers, lobbyists), compensation structure, and whether the third party was recommended by an official.

## Due diligence steps
- Identity, ownership (including links to officials)
- Qualifications and business rationale for engagement
- Reputation and adverse media, sanctions screening
- Compensation reasonableness against market rates
- Anti-corruption policies and training

## Contracts and monitoring
Anti-bribery clauses, audit rights, termination rights, detailed invoices, payment only to accounts in the third party's name and country of operation, and periodic refresh.`,
            exercise:
              "A sales agent requests a 15% success fee paid to an offshore account. List the questions you would ask before approval.",
          },
        ],
      },
    ],
  },
  {
    slug: "gifts-hospitality-conflicts",
    title: "Gifts, Hospitality, and Conflicts of Interest",
    subtitle: "Applying reasonable and proportionate standards",
    topic: "abc",
    level: "BEGINNER",
    minutes: 80,
    tier: "FREE",
    cpd: 1,
    overview:
      "Understand when gifts and hospitality are acceptable, how to use registers and approval thresholds, and how to identify and manage conflicts of interest.",
    objectives: [
      "Apply the principles of reasonable and proportionate hospitality",
      "Use gift and hospitality registers and approvals",
      "Identify, declare and manage conflicts of interest",
    ],
    keywords: ["gifts", "hospitality", "conflicts of interest", "register"],
    related: ["abc-fundamentals"],
    modules: [
      {
        title: "Gifts and conflicts",
        lessons: [
          {
            title: "When are gifts acceptable?",
            minutes: 12,
            content: `## Key questions
- **Intent:** is it intended to influence a decision?
- **Timing:** is a decision pending (tender, renewal, licence)?
- **Value and frequency:** is it modest and occasional?
- **Recipient:** is the recipient a public official?
- **Transparency:** would you be comfortable if it were public?

## Controls
Registers, pre-approval thresholds (stricter for public officials), prohibition of cash or cash equivalents, and periodic review of register entries.

## Conflicts of interest
A conflict arises when personal interests could influence professional judgement. Declare conflicts promptly; managers decide on mitigation (recusal, reassignment, additional oversight).`,
          },
        ],
      },
    ],
  },
  {
    slug: "pep-risk-corruption-exposure",
    title: "PEP Risk and Corruption Exposure",
    subtitle: "Politically exposed persons in AML and ABC contexts",
    topic: "abc",
    level: "INTERMEDIATE",
    minutes: 100,
    tier: "PREMIUM",
    cpd: 1.5,
    overview:
      "Understand PEP definitions, family members and close associates, the risk of laundering the proceeds of corruption, and proportionate EDD.",
    objectives: [
      "Define PEPs, family members and close associates",
      "Assess PEP risk proportionately",
      "Apply EDD including source of wealth",
    ],
    keywords: ["PEP", "politically exposed person", "close associates", "grand corruption"],
    related: ["enhanced-due-diligence-risk-assessment", "abc-fundamentals"],
    modules: [
      {
        title: "PEPs",
        lessons: [
          {
            title: "Who is a PEP?",
            minutes: 12,
            content: `## Definitions
FATF defines PEPs as individuals entrusted with **prominent public functions**: heads of state or government, senior politicians, senior government, judicial or military officials, senior executives of state-owned corporations, important political party officials. Categories include **foreign**, **domestic** and **international organisation** PEPs. Family members and close associates are also covered.

## Proportionate treatment
Not all PEPs present the same risk. Consider role seniority, country corruption risk, access to public funds, wealth plausibility and adverse media. Many regimes require EDD for foreign PEPs and risk-based measures for domestic PEPs; some require a minimum period of continued treatment after leaving office, assessed on risk.`,
          },
        ],
      },
    ],
  },
  {
    slug: "facilitation-payments-improper-benefits",
    title: "Facilitation Payments and Improper Benefits",
    subtitle: "Small payments, big risks",
    topic: "abc",
    level: "INTERMEDIATE",
    minutes: 70,
    tier: "PREMIUM",
    cpd: 1,
    overview:
      "Examine facilitation payments, the differing legal treatment across jurisdictions, duress payments, and other improper benefits such as political contributions and sponsorships.",
    objectives: [
      "Define facilitation payments and distinguish them from duress payments",
      "Compare the treatment under the FCPA and UK Bribery Act",
      "Manage political contributions, donations and sponsorships",
    ],
    keywords: ["facilitation payments", "duress", "donations", "sponsorships"],
    related: ["abc-fundamentals"],
    modules: [
      {
        title: "Facilitation payments",
        lessons: [
          {
            title: "Legal treatment and policy",
            minutes: 12,
            content: `## Facilitation payments
Small unofficial payments to speed up routine, non-discretionary government actions (e.g., processing visas, connecting utilities).

- **FCPA:** a narrow exception exists for routine governmental action — but payments must be accurately recorded, and local law may still prohibit them.
- **UK Bribery Act:** **no exception** — facilitation payments are bribes.
- Many multinational policies **prohibit** facilitation payments globally.

## Duress payments
Payments made under imminent threat to health, safety or liberty are generally treated differently — safety first, then report and record accurately.

## Other improper benefits
Donations and sponsorships must be transparent, legitimate, approved and not linked to business decisions.`,
          },
        ],
      },
    ],
  },
  {
    slug: "corporate-liability-internal-investigations",
    title: "Corporate Liability and Internal Investigations",
    subtitle: "Responding to bribery allegations",
    topic: "abc",
    level: "ADVANCED",
    minutes: 110,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Understand corporate criminal liability models, self-reporting and resolution mechanisms such as DPAs, and how to run privileged, credible internal investigations.",
    objectives: [
      "Explain corporate liability models for bribery",
      "Plan privileged internal investigations",
      "Understand self-reporting and resolution options",
    ],
    keywords: ["corporate liability", "DPA", "self-reporting", "privilege"],
    related: ["fraud-investigations-evidence", "whistleblowing-investigation-management"],
    modules: [
      {
        title: "Investigations",
        lessons: [
          {
            title: "Running an internal investigation",
            minutes: 14,
            content: `## Key considerations
- **Independence:** who oversees the investigation (board committee, external counsel)?
- **Privilege:** structure the investigation to protect legal privilege where appropriate
- **Preservation:** issue document holds promptly
- **Data protection and employment law:** comply in every relevant jurisdiction
- **Communications:** control internal and external messaging

## Resolution options
Depending on jurisdiction: prosecution, non-prosecution agreements, deferred prosecution agreements (DPAs), and civil settlements. Authorities consider self-reporting, co-operation, remediation and the quality of the compliance programme.`,
          },
        ],
      },
    ],
  },
  {
    slug: "abc-controls-program-design",
    title: "ABC Controls and Compliance Program Design",
    subtitle: "Building adequate procedures",
    topic: "abc",
    level: "ADVANCED",
    minutes: 110,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Design an ABC programme aligned to recognised guidance: top-level commitment, risk assessment, due diligence, communication and training, monitoring and review, and financial controls.",
    objectives: [
      "Apply the six principles of UK MoJ guidance",
      "Design financial and non-financial ABC controls",
      "Evaluate programme effectiveness",
    ],
    keywords: ["adequate procedures", "programme design", "financial controls"],
    related: ["bribery-corruption-risk-assessment", "abc-fundamentals"],
    modules: [
      {
        title: "Programme design",
        lessons: [
          {
            title: "The six principles",
            minutes: 14,
            content: `## UK Ministry of Justice guidance — six principles
1. **Proportionate procedures**
2. **Top-level commitment**
3. **Risk assessment**
4. **Due diligence**
5. **Communication (including training)**
6. **Monitoring and review**

## Financial controls
- Accurate books and records; no off-book accounts
- Segregation of duties for payments
- Scrutiny of high-risk expense categories (commissions, consultancy, travel for officials)
- Data analytics to detect anomalies

## Evaluating effectiveness
Authorities (e.g., the US DOJ's *Evaluation of Corporate Compliance Programs*) ask whether the programme is well designed, adequately resourced and empowered, and works in practice.`,
          },
        ],
      },
    ],
  },
  {
    slug: "whistleblowing-investigation-management",
    title: "Whistleblowing and Investigation Management",
    subtitle: "Speak-up programmes that people trust",
    topic: "abc",
    level: "INTERMEDIATE",
    minutes: 90,
    tier: "PREMIUM",
    cpd: 1.5,
    overview:
      "Design effective speak-up channels, protect whistleblowers from retaliation, triage reports and manage investigations to closure.",
    objectives: [
      "Design accessible and trusted reporting channels",
      "Protect whistleblowers and prevent retaliation",
      "Triage and manage cases through to closure",
    ],
    keywords: ["whistleblowing", "speak up", "retaliation", "triage"],
    related: ["corporate-liability-internal-investigations", "insider-fraud-employee-misconduct"],
    modules: [
      {
        title: "Speak-up",
        lessons: [
          {
            title: "Designing speak-up programmes",
            minutes: 14,
            content: `## Elements
- Multiple channels (online, phone, in person), with anonymity options where lawful
- Clear policy covering what can be reported and how reports are handled
- Confidentiality and **non-retaliation** commitments, backed by monitoring
- Independent triage and case management
- Feedback to reporters where possible

## Triage
Assess credibility, seriousness and urgency; decide on investigation route; manage conflicts; set timelines.

## Metrics
Report volumes, substantiation rate, time to close, and retaliation claims — interpreted with care (low volumes may signal low trust, not low misconduct).`,
          },
        ],
      },
    ],
  },
  {
    slug: "practical-abc-case-studies",
    title: "Practical ABC Case Studies",
    subtitle: "Applying ABC principles to realistic fictional scenarios",
    topic: "abc",
    level: "ADVANCED",
    minutes: 100,
    tier: "PREMIUM",
    cpd: 1.5,
    format: "BLENDED",
    overview:
      "Work through fictional scenarios involving agents, tenders, hospitality and joint ventures. Identify red flags and recommend proportionate actions.",
    objectives: [
      "Identify ABC red flags in realistic scenarios",
      "Recommend proportionate actions",
      "Document decisions clearly",
    ],
    keywords: ["case study", "ABC", "tender", "agent"],
    related: ["third-party-intermediary-due-diligence", "abc-fundamentals"],
    modules: [
      {
        title: "Scenarios",
        lessons: [
          {
            title: "Scenario: the tender consultant",
            minutes: 16,
            type: "EXERCISE",
            content: `## Scenario (fictional)
Your company is bidding for a hospital equipment contract in a high-risk country. A local consultant, recommended by a ministry official, offers to "manage relationships" for a 12% success fee. The consultant's firm was established last year and has two employees. They ask for part of the fee in advance to an account in a different country.

## Consider
- What are the red flags?
- What due diligence is required?
- What contractual protections would you require?
- Would you proceed?`,
            exercise:
              "Write a short recommendation to the business on whether to engage the consultant, with conditions if any.",
          },
        ],
      },
    ],
  },
];
