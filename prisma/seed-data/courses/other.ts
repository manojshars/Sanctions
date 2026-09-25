import type { SeedCourse } from "../types";

export const OTHER_COURSES: SeedCourse[] = [
  {
    slug: "export-controls-dual-use-goods",
    title: "Export Controls and Dual-Use Goods",
    subtitle: "Controlled items, licensing, end-use checks and diversion risk",
    topic: "export-controls",
    level: "INTERMEDIATE",
    minutes: 130,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Understand export control regimes for military and dual-use items, how items are classified, catch-all controls, end-use and end-user checks, and the role financial institutions play in detecting diversion.",
    objectives: [
      "Explain the purpose of export controls and multilateral regimes",
      "Classify items using control lists (e.g., ECCNs, EU Annex I)",
      "Apply end-use and end-user due diligence",
      "Recognise diversion and procurement red flags",
    ],
    keywords: ["export controls", "dual-use", "ECCN", "EAR", "end-user", "catch-all"],
    related: ["sanctions-evasion-typologies", "trade-finance-financial-crime"],
    modules: [
      {
        title: "Framework",
        lessons: [
          {
            title: "What export controls cover",
            minutes: 14,
            content: `## Purpose
Export controls restrict the transfer of military items and **dual-use** goods, software and technology (items with civil and military applications) to prevent proliferation of weapons of mass destruction, support national security and implement foreign policy.

## Multilateral regimes
The Wassenaar Arrangement (conventional arms and dual-use), the Nuclear Suppliers Group, the Australia Group (chemical and biological), and the Missile Technology Control Regime shape national control lists.

## Examples of national frameworks
- **US:** Export Administration Regulations (EAR), administered by BIS; items on the Commerce Control List have Export Control Classification Numbers (ECCNs); items not listed are generally EAR99. The EAR can apply to foreign-made items with US content or technology.
- **EU:** Dual-Use Regulation (EU) 2021/821, with the control list in Annex I.
- **UK:** Export Control Order 2008 and retained dual-use legislation.

## Catch-all controls
Even unlisted items can require a licence if the exporter knows or is informed they may be used for WMD or certain military end uses.`,
          },
          {
            title: "End-use checks and diversion",
            minutes: 12,
            content: `## Due diligence
- Verify the end user and end use; obtain end-user statements where appropriate
- Screen parties against restricted party lists (e.g., the BIS Entity List)
- Check consistency of goods with the buyer's business
- Assess routing and transshipment points

## Red flags
- Customer reluctant to disclose end use
- Payment by unrelated third parties or in cash
- Unusual shipping routes or freight forwarder as final consignee
- Requests for items with performance above stated needs
- Newly established distributors in transshipment hubs

## The bank's role
Trade finance and payments teams can detect diversion indicators in documents and flows and should escalate concerns alongside sanctions review.`,
            exercise:
              "A distributor in a transshipment hub orders high-performance oscilloscopes and asks that they be delivered to a freight forwarder. List three questions you would ask.",
          },
        ],
      },
    ],
  },
  {
    slug: "trade-finance-financial-crime",
    title: "Trade Finance and Trade-Based Financial Crime",
    subtitle: "Financial crime risk in documentary and open-account trade",
    topic: "trade-based",
    level: "INTERMEDIATE",
    minutes: 120,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Learn how trade finance products work — letters of credit, documentary collections, guarantees and open account — and the AML, sanctions and fraud risks each presents.",
    objectives: [
      "Describe common trade finance products and document flows",
      "Identify financial crime risks in each product",
      "Apply document review and escalation practices",
    ],
    keywords: ["letters of credit", "documentary collections", "bills of lading", "trade finance"],
    related: ["trade-based-money-laundering", "maritime-shipping-trade-sanctions"],
    modules: [
      {
        title: "Products and risk",
        lessons: [
          {
            title: "Trade finance products",
            minutes: 14,
            content: `## Products
- **Letters of credit (LCs):** a bank undertaking to pay against compliant documents
- **Documentary collections:** banks exchange documents for payment or acceptance, without a payment undertaking
- **Guarantees and standby LCs:** assurances of performance or payment
- **Open account:** goods shipped and paid later directly — the majority of global trade, with limited bank visibility

## Documents
Commercial invoices, bills of lading, packing lists, certificates of origin, inspection certificates, insurance documents.

## Risks
Documentary trade gives banks more information to review for TBML, sanctions and dual-use concerns; open account relies on transaction monitoring and customer due diligence.`,
          },
        ],
      },
    ],
  },
  {
    slug: "crypto-assets-vasps",
    title: "Crypto Assets and Virtual Asset Service Providers",
    subtitle: "Regulation, business models and risk management for VASPs",
    topic: "crypto",
    level: "ADVANCED",
    minutes: 110,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Understand VASP business models, licensing regimes, banking VASPs, sanctions compliance on-chain, and emerging risks in DeFi and stablecoins.",
    objectives: [
      "Describe VASP business models and their risks",
      "Assess a VASP as a banking customer",
      "Apply sanctions controls to on-chain activity",
    ],
    keywords: ["VASP", "DeFi", "stablecoins", "MiCA", "licensing"],
    related: ["cryptocurrency-virtual-asset-aml"],
    modules: [
      {
        title: "VASP risk",
        lessons: [
          {
            title: "Assessing VASPs",
            minutes: 14,
            content: `## Business models
Exchanges, brokers, custodians, payment processors, OTC desks, and wallet providers each carry distinct risks.

## Due diligence on a VASP customer
- Licensing or registration status in each jurisdiction of operation
- Ownership and management fit and proper assessment
- AML/CFT programme, including travel-rule compliance and blockchain analytics
- Sanctions controls, including screening of wallet addresses and IP geolocation
- Customer base and geographic exposure; nested VASP relationships

## Emerging areas
Decentralised finance (DeFi), cross-chain bridges and stablecoins raise questions about who is responsible for compliance. Regulatory approaches continue to evolve — for example, the EU Markets in Crypto-Assets Regulation (MiCA).`,
          },
        ],
      },
    ],
  },
  {
    slug: "fraud-aml-convergence",
    title: "Fraud and AML Convergence",
    subtitle: "Integrating fraud and AML to follow the money",
    topic: "fraud",
    level: "INTERMEDIATE",
    minutes: 90,
    tier: "PREMIUM",
    cpd: 1.5,
    overview:
      "Fraud generates criminal proceeds; laundering moves them. Learn why organisations are converging fraud and AML capabilities (FRAML), and how shared data and analytics improve outcomes.",
    objectives: [
      "Explain the link between fraud and money laundering",
      "Identify benefits and challenges of FRAML operating models",
      "Design shared data and case management approaches",
    ],
    keywords: ["FRAML", "convergence", "mules", "shared data"],
    related: ["mule-accounts-fraud-networks", "fraud-fundamentals-typologies"],
    modules: [
      {
        title: "Convergence",
        lessons: [
          {
            title: "Why converge?",
            minutes: 14,
            content: `## The link
Fraud is a predicate offence; its proceeds must be laundered, frequently through mule accounts. Fraud teams see the victim side; AML teams see the laundering side. Separated, each sees only part of the picture.

## Benefits of FRAML
- Holistic customer view and shared intelligence
- Faster detection of mule networks
- Reduced duplication in investigations and customer outreach
- Better reporting quality

## Challenges
Different regulatory drivers, time-scales (real-time fraud vs retrospective AML), legacy systems, and data-sharing constraints. Start with shared data and joint typology work before organisational change.`,
          },
        ],
      },
    ],
  },
  {
    slug: "financial-crime-risk-governance",
    title: "Financial Crime Risk Governance",
    subtitle: "Board oversight, risk appetite and accountability",
    topic: "governance",
    level: "ADVANCED",
    minutes: 100,
    tier: "PREMIUM",
    cpd: 1.5,
    overview:
      "Examine how boards and senior managers govern financial crime risk: risk appetite statements, accountability regimes, committees and escalation.",
    objectives: [
      "Draft a financial crime risk appetite statement",
      "Explain individual accountability regimes",
      "Design committee structures and escalation paths",
    ],
    keywords: ["governance", "risk appetite", "accountability", "board"],
    related: ["aml-governance-compliance-programs", "enterprise-financial-crime-risk-assessment"],
    modules: [
      {
        title: "Governance",
        lessons: [
          {
            title: "Risk appetite and accountability",
            minutes: 14,
            content: `## Risk appetite
A financial crime risk appetite states the types and levels of risk the firm will accept — e.g., "no appetite for knowingly facilitating financial crime", with measurable indicators such as overdue high-risk reviews or screening backlog thresholds.

## Accountability
Individual accountability regimes (e.g., the UK Senior Managers and Certification Regime) assign prescribed responsibilities, including for financial crime, to named senior managers.

## Committees and escalation
Clear terms of reference, quorum, MI packs, and escalation paths to the board ensure issues are addressed promptly.`,
          },
        ],
      },
    ],
  },
  {
    slug: "regulatory-investigations-enforcement",
    title: "Regulatory Investigations and Enforcement",
    subtitle: "Understanding and responding to regulatory action",
    topic: "governance",
    level: "ADVANCED",
    minutes: 90,
    tier: "PREMIUM",
    cpd: 1.5,
    overview:
      "Learn how regulators supervise and enforce financial crime rules, what triggers enforcement, and how firms should respond to investigations and learn from public enforcement actions.",
    objectives: [
      "Describe supervisory and enforcement tools",
      "Identify common failings cited in enforcement actions",
      "Plan a firm's response to a regulatory investigation",
    ],
    keywords: ["enforcement", "regulator", "penalties", "lessons learned"],
    related: ["financial-crime-risk-governance"],
    modules: [
      {
        title: "Enforcement",
        lessons: [
          {
            title: "Common failings and responses",
            minutes: 14,
            content: `## Supervisory tools
Thematic reviews, skilled-person or monitorship reports, restrictions on business, fines, and public censure.

## Frequently cited failings
- Inadequate customer risk assessment and CDD
- Weak transaction monitoring coverage or data issues
- Backlogs in alerts and periodic reviews
- Poor governance, MI and escalation
- Failure to act on known weaknesses

## Responding
Engage early and transparently, preserve documents, co-ordinate legal and compliance teams, deliver credible remediation, and track commitments.`,
          },
        ],
      },
    ],
  },
  {
    slug: "financial-crime-audit-control-testing",
    title: "Financial Crime Auditing and Control Testing",
    subtitle: "Assuring that controls are designed and operating effectively",
    topic: "governance",
    level: "ADVANCED",
    minutes: 100,
    tier: "PREMIUM",
    cpd: 1.5,
    overview:
      "Plan and execute control testing and audits across AML, sanctions and fraud controls: test design, sampling, evidence standards and reporting.",
    objectives: [
      "Distinguish design effectiveness from operating effectiveness",
      "Plan tests and sampling approaches",
      "Report findings with root causes and ratings",
    ],
    keywords: ["audit", "control testing", "sampling", "assurance"],
    related: ["aml-governance-compliance-programs"],
    modules: [
      {
        title: "Testing",
        lessons: [
          {
            title: "Designing control tests",
            minutes: 14,
            content: `## Design vs operating effectiveness
- **Design:** would the control, if operated as intended, mitigate the risk?
- **Operating:** does it work consistently in practice?

## Test planning
Define the control objective, population, sample size and method (random, judgemental, risk-based), test attributes, and evidence standards.

## Examples
- Screening: inject test names to check matching and list completeness
- CDD: sample files for completeness and quality of beneficial ownership
- Monitoring: review alert closure quality and timeliness

## Reporting
Findings should state condition, criteria, cause, consequence and corrective action.`,
          },
        ],
      },
    ],
  },
  {
    slug: "enterprise-financial-crime-risk-assessment",
    title: "Enterprise Financial Crime Risk Assessment",
    subtitle: "A consolidated view of AML, sanctions, fraud and ABC risk",
    topic: "governance",
    level: "ADVANCED",
    minutes: 120,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Design and run an enterprise-wide risk assessment (EWRA) that integrates financial crime risk types, uses quantitative and qualitative data, and drives investment decisions.",
    objectives: [
      "Structure an EWRA methodology",
      "Combine quantitative and qualitative data",
      "Translate results into prioritised actions",
    ],
    keywords: ["EWRA", "enterprise risk assessment", "methodology", "residual risk"],
    related: ["sanctions-risk-assessment-approval", "fraud-risk-assessment-prevention", "financial-crime-risk-governance"],
    modules: [
      {
        title: "Methodology",
        lessons: [
          {
            title: "Building the EWRA",
            minutes: 16,
            content: `## Methodology
1. Define scope (business lines, legal entities, risk types)
2. Identify inherent risk factors and metrics (customer, product, geography, channel)
3. Assess control environment (design and operating effectiveness)
4. Calculate residual risk with a transparent scoring model
5. Validate results through challenge sessions with business and second line
6. Report to senior management and set actions

## Data
Use quantitative data (customer counts by risk, flows by country, alert statistics) supplemented with qualitative judgement. Document assumptions and data limitations.

## Outcomes
The EWRA should inform the compliance plan, resourcing, monitoring coverage and training — and be refreshed at least annually or when significant changes occur.`,
          },
        ],
      },
    ],
  },
];
