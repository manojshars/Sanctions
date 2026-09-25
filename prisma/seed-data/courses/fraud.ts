import type { SeedCourse } from "../types";

export const FRAUD_COURSES: SeedCourse[] = [
  {
    slug: "fraud-fundamentals-typologies",
    title: "Fraud Fundamentals and Typologies",
    subtitle: "How fraud works, who commits it and how organisations defend against it",
    topic: "fraud",
    level: "BEGINNER",
    minutes: 130,
    tier: "FREE",
    cpd: 2,
    overview:
      "An accessible introduction to fraud: definitions, the fraud triangle, internal and external fraud, major typologies affecting financial services, and the prevent–detect–respond model.",
    objectives: [
      "Define fraud and distinguish it from error and other financial crime",
      "Explain the fraud triangle and its limits",
      "Classify common fraud typologies",
      "Describe the prevent, detect and respond control model",
    ],
    keywords: ["fraud triangle", "first-party fraud", "third-party fraud", "typologies"],
    related: ["payment-fraud-app-scams", "fraud-risk-assessment-prevention", "fraud-aml-convergence"],
    modules: [
      {
        title: "Understanding fraud",
        lessons: [
          {
            title: "What is fraud?",
            minutes: 12,
            content: `## Definition
Fraud is **deception intended to obtain an advantage, avoid an obligation, or cause loss**. Legal definitions vary; for example, the UK Fraud Act 2006 defines offences of fraud by false representation, failing to disclose information, and abuse of position.

## Categories
- **First-party fraud:** the customer deceives the firm (e.g., false income on a loan application, "bust-out" credit fraud)
- **Third-party fraud:** a criminal impersonates or exploits a genuine customer (e.g., account takeover, identity theft)
- **Authorised push payment (APP) fraud:** the victim is manipulated into sending money themselves
- **Insider fraud:** committed by employees or contractors

## The fraud triangle
Donald Cressey's model identifies **pressure**, **opportunity** and **rationalisation**. Organisations influence **opportunity** most directly through controls, but culture and whistleblowing channels address rationalisation too. Modern fraud — organised, automated and cross-border — doesn't always fit the triangle neatly.`,
          },
          {
            title: "Prevent, detect, respond",
            minutes: 12,
            content: `## Prevent
Strong onboarding, authentication, segregation of duties, customer education, and secure product design.

## Detect
Real-time transaction risk scoring, behavioural biometrics, device intelligence, data analytics and staff vigilance.

## Respond
Investigation, recovery of funds, customer support, reporting to authorities, and learning loops that update controls.

> Effective fraud management balances **loss prevention, customer experience and operational cost**.`,
            exercise:
              "For online banking, name one preventive, one detective and one responsive control that addresses account takeover.",
          },
        ],
      },
    ],
  },
  {
    slug: "payment-fraud-app-scams",
    title: "Payment Fraud and Authorized Push Payment Scams",
    subtitle: "Scam typologies, victim protection and reimbursement frameworks",
    topic: "fraud",
    level: "INTERMEDIATE",
    minutes: 120,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Explore APP scams — investment, romance, impersonation, purchase and invoice scams — along with detection techniques, effective warnings and the evolving reimbursement landscape.",
    objectives: [
      "Describe the main APP scam types and social engineering tactics",
      "Design effective interventions and warnings",
      "Understand reimbursement and liability frameworks",
    ],
    keywords: ["APP fraud", "scams", "impersonation", "invoice fraud", "reimbursement"],
    related: ["social-engineering-phishing", "mule-accounts-fraud-networks"],
    modules: [
      {
        title: "APP scams",
        lessons: [
          {
            title: "Scam typologies",
            minutes: 14,
            content: `## Common APP scam types
- **Impersonation:** criminals pose as the bank, police or a government body ("safe account" scams)
- **Investment scams:** fake high-return opportunities, often promoted on social media, including crypto
- **Romance scams:** long-term manipulation through online relationships
- **Purchase scams:** payment for goods that never arrive
- **Invoice and mandate fraud / business email compromise:** altered payee details on genuine-looking invoices
- **CEO fraud:** urgent payment requests purportedly from senior executives

## Why APP fraud is difficult
The payment is authorised by the genuine customer, often after passing authentication. Detection relies on behavioural signals (new payee, unusual amount, coached behaviour) and effective, dynamic interventions.`,
          },
          {
            title: "Interventions and reimbursement",
            minutes: 12,
            content: `## Effective interventions
- Context-specific warnings based on payment purpose
- Confirmation of Payee (name-checking) where available
- Human intervention for high-risk payments, using open questions
- Delays or holds where permitted to break the scammer's urgency

## Reimbursement (example: UK)
From 7 October 2024, the UK Payment Systems Regulator's mandatory reimbursement requirement applies to APP scams over Faster Payments and CHAPS, with costs shared between sending and receiving firms, subject to a maximum reimbursement limit and exceptions (e.g., gross negligence, first-party fraud). Always check current rules in your jurisdiction.`,
          },
        ],
      },
    ],
  },
  {
    slug: "account-takeover-identity-fraud",
    title: "Account Takeover and Identity Fraud",
    subtitle: "Protecting identities and accounts from compromise",
    topic: "fraud",
    level: "INTERMEDIATE",
    minutes: 110,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Understand how criminals steal identities and take over accounts, including credential stuffing, SIM swaps and social engineering of contact centres, and the layered controls that stop them.",
    objectives: [
      "Describe identity theft and account takeover attack paths",
      "Apply layered authentication and anomaly detection",
      "Respond to compromise and support victims",
    ],
    keywords: ["account takeover", "SIM swap", "credential stuffing", "identity theft", "authentication"],
    related: ["synthetic-identity-application-fraud", "card-digital-payment-fraud"],
    modules: [
      {
        title: "Attack paths and controls",
        lessons: [
          {
            title: "How accounts are taken over",
            minutes: 14,
            content: `## Attack paths
- **Credential stuffing:** reuse of leaked username/password pairs
- **Phishing and smishing:** stealing credentials and one-time passcodes
- **SIM swap / port-out fraud:** hijacking the victim's phone number to intercept codes
- **Malware and remote-access tools**
- **Contact-centre social engineering:** persuading staff to reset credentials or change contact details

## Warning signs
- Change of contact details followed quickly by new payees or high-value payments
- New device, location or behaviour inconsistent with history
- Multiple failed logins across many accounts from the same infrastructure

## Controls
Strong customer authentication, device binding, behavioural biometrics, cooling-off periods after profile changes, and step-up authentication for risky events.`,
          },
        ],
      },
    ],
  },
  {
    slug: "card-digital-payment-fraud",
    title: "Card Fraud and Digital Payment Fraud",
    subtitle: "Card-present, card-not-present and digital wallet fraud",
    topic: "fraud",
    level: "INTERMEDIATE",
    minutes: 100,
    tier: "PREMIUM",
    cpd: 1.5,
    overview:
      "Understand card and digital payment fraud types, the payment ecosystem, chargebacks, tokenisation and real-time risk scoring.",
    objectives: [
      "Identify card-present and card-not-present fraud types",
      "Explain the roles of issuers, acquirers, merchants and schemes",
      "Describe controls such as 3-D Secure, tokenisation and risk scoring",
    ],
    keywords: ["card fraud", "CNP", "3-D Secure", "chargeback", "tokenisation"],
    related: ["account-takeover-identity-fraud"],
    modules: [
      {
        title: "Card and digital payments",
        lessons: [
          {
            title: "Fraud types and controls",
            minutes: 14,
            content: `## Fraud types
- **Card-not-present (CNP):** use of stolen card details online — the largest category in many markets
- **Counterfeit / skimming:** cloned magnetic stripe data (reduced by chip technology)
- **Lost and stolen cards**
- **Card ID theft:** accounts opened or taken over to obtain cards
- **Digital wallet provisioning fraud:** stolen card details added to a criminal's device wallet

## Controls
- **3-D Secure** and strong customer authentication for online payments
- **Tokenisation** replacing card numbers with tokens
- **Real-time risk scoring** using device, merchant, velocity and behavioural features
- Secure provisioning checks for digital wallets

## Chargebacks
Card scheme dispute rules allocate liability between issuers, acquirers and merchants. Misuse of chargebacks by genuine cardholders ("friendly fraud") is a form of first-party fraud.`,
          },
        ],
      },
    ],
  },
  {
    slug: "social-engineering-phishing",
    title: "Social Engineering and Phishing",
    subtitle: "Understanding manipulation techniques to protect customers and colleagues",
    topic: "fraud",
    level: "BEGINNER",
    minutes: 90,
    tier: "FREE",
    cpd: 1.5,
    overview:
      "Learn the psychology of social engineering and how phishing, vishing, smishing and pretexting work — and how to build resilience in customers and staff.",
    objectives: [
      "Explain psychological levers used by fraudsters",
      "Recognise phishing, vishing and smishing",
      "Apply practical defences for individuals and organisations",
    ],
    keywords: ["phishing", "vishing", "smishing", "pretexting", "social engineering"],
    related: ["payment-fraud-app-scams", "account-takeover-identity-fraud"],
    modules: [
      {
        title: "Manipulation",
        lessons: [
          {
            title: "The psychology of social engineering",
            minutes: 12,
            content: `## Levers
- **Authority:** impersonating banks, police, executives
- **Urgency and fear:** "your account will be closed", "your money is at risk"
- **Trust and familiarity:** spoofed numbers and look-alike domains
- **Reciprocity and liking:** building rapport over time
- **Isolation:** "don't tell the bank staff, they may be involved"

## Channels
Email (phishing), phone (vishing), SMS (smishing), messaging apps, social media and fake websites.`,
          },
          {
            title: "Building resilience",
            minutes: 10,
            content: `## For individuals
- Stop and verify through an independently obtained contact
- Never share one-time passcodes or move money to a "safe account"
- Treat urgency as a red flag

## For organisations
- Simulated phishing and targeted training
- Email authentication (SPF, DKIM, DMARC)
- Clear, consistent customer communication about what you will never ask
- Call-back verification for payment detail changes`,
            exercise:
              "Draft a short, plain-language customer warning to display when a customer adds a new payee after receiving a call 'from the bank'.",
          },
        ],
      },
    ],
  },
  {
    slug: "synthetic-identity-application-fraud",
    title: "Synthetic Identity and Application Fraud",
    subtitle: "Detecting fabricated identities and falsified applications",
    topic: "fraud",
    level: "ADVANCED",
    minutes: 100,
    tier: "PREMIUM",
    cpd: 1.5,
    overview:
      "Examine how synthetic identities are built and nurtured, how application fraud manifests in lending and account opening, and which data and analytics expose them.",
    objectives: [
      "Explain how synthetic identities are created and matured",
      "Recognise application fraud indicators",
      "Apply consortium data, link analysis and document authentication",
    ],
    keywords: ["synthetic identity", "application fraud", "bust-out", "link analysis"],
    related: ["account-takeover-identity-fraud", "customer-due-diligence-kyc"],
    modules: [
      {
        title: "Synthetic identities",
        lessons: [
          {
            title: "Building and busting out",
            minutes: 14,
            content: `## Synthetic identity fraud
Fraudsters combine real and fabricated data (e.g., a genuine identifier with a fictitious name and date of birth) to create a new "person". The identity is **nurtured** — small credit lines, on-time repayments — before a **bust-out**, when all credit is drawn and abandoned.

## Indicators
- Thin credit files with rapid credit-building activity
- Shared attributes (phone, address, device) across unrelated applicants
- Authorised-user "piggybacking" on established accounts
- Identity data that doesn't age consistently across sources

## Controls
Document authentication and liveness, consortium and bureau data, device intelligence, and graph analytics to spot clusters.`,
          },
        ],
      },
    ],
  },
  {
    slug: "insider-fraud-employee-misconduct",
    title: "Insider Fraud and Employee Misconduct",
    subtitle: "Preventing, detecting and investigating internal fraud",
    topic: "fraud",
    level: "INTERMEDIATE",
    minutes: 100,
    tier: "PREMIUM",
    cpd: 1.5,
    overview:
      "Insider fraud can be the most damaging form of fraud. Learn common schemes, warning signs, controls such as segregation of duties and access monitoring, and fair investigation principles.",
    objectives: [
      "Identify common insider fraud schemes",
      "Apply preventive and detective controls",
      "Conduct fair, lawful internal investigations",
    ],
    keywords: ["insider fraud", "segregation of duties", "misconduct", "access monitoring"],
    related: ["fraud-investigations-evidence", "whistleblowing-investigation-management"],
    modules: [
      {
        title: "Insider risk",
        lessons: [
          {
            title: "Schemes and warning signs",
            minutes: 14,
            content: `## Common schemes
- Misappropriation of customer funds, especially dormant accounts
- Fictitious suppliers or payroll ("ghost employees")
- Expense fraud
- Data theft sold to external fraud rings
- Collusion with external criminals (e.g., opening mule accounts)

## Warning signs
- Reluctance to take leave or share duties
- Access to systems beyond role needs
- Overrides of controls, unexplained adjustments
- Lifestyle inconsistent with income (use with care — never as sole evidence)

## Controls
Segregation of duties, least-privilege access, mandatory leave, four-eyes approvals, and monitoring of privileged activity.`,
          },
        ],
      },
    ],
  },
  {
    slug: "mule-accounts-fraud-networks",
    title: "Mule Accounts and Fraud Networks",
    subtitle: "Disrupting the accounts that move criminal proceeds",
    topic: "fraud",
    level: "INTERMEDIATE",
    minutes: 100,
    tier: "PREMIUM",
    cpd: 1.5,
    overview:
      "Money mules are the connective tissue between fraud and money laundering. Learn mule types, recruitment tactics, detection analytics and network disruption.",
    objectives: [
      "Differentiate complicit, recruited and unwitting mules",
      "Recognise mule account behaviour",
      "Apply network analytics to disrupt mule networks",
    ],
    keywords: ["money mules", "networks", "recruitment", "graph analytics"],
    related: ["fraud-aml-convergence", "payment-fraud-app-scams"],
    modules: [
      {
        title: "Mules",
        lessons: [
          {
            title: "Mule behaviour and detection",
            minutes: 14,
            content: `## Mule types
- **Complicit:** knowingly sell or rent accounts
- **Recruited:** persuaded through fake job offers ("payment processing agent") or social media
- **Unwitting:** exploited, often through romance or employment scams

## Behavioural indicators
- Dormant or new accounts suddenly receiving many incoming payments
- Rapid outbound transfers, crypto purchases or cash withdrawals
- Logins from devices or IPs shared with other accounts
- Young account holders with activity inconsistent with profile

## Network disruption
Following funds across accounts and institutions, identifying shared attributes and exchanging intelligence (where legally permitted) helps dismantle networks rather than single accounts.`,
          },
        ],
      },
    ],
  },
  {
    slug: "fraud-investigations-evidence",
    title: "Fraud Investigations and Evidence Collection",
    subtitle: "Planning and conducting robust fraud investigations",
    topic: "investigations",
    level: "ADVANCED",
    minutes: 140,
    tier: "PREMIUM",
    cpd: 2.5,
    overview:
      "Plan investigations, preserve and handle evidence, conduct interviews, analyse data and report findings to a standard that supports internal, civil or criminal outcomes.",
    objectives: [
      "Plan an investigation with scope, hypotheses and resources",
      "Preserve evidence and maintain chain of custody",
      "Conduct fair interviews and analyse financial data",
      "Write investigation reports that separate facts from opinions",
    ],
    keywords: ["investigation", "evidence", "chain of custody", "interviews", "report"],
    related: ["transaction-monitoring-investigations", "corporate-liability-internal-investigations"],
    modules: [
      {
        title: "Investigation practice",
        lessons: [
          {
            title: "Planning and evidence",
            minutes: 16,
            content: `## Planning
Define allegations, scope, legal considerations (privilege, data protection, employment law), hypotheses, evidence needed and a timeline.

## Evidence types
- Documentary (contracts, invoices, emails)
- Digital (logs, device images, system audit trails)
- Financial (bank statements, ledgers)
- Testimonial (interviews)

## Chain of custody
Record who collected evidence, when, how, and every subsequent transfer. Use forensic methods for digital evidence (hashing, write-blockers) to preserve integrity.`,
          },
          {
            title: "Interviews and reporting",
            minutes: 14,
            content: `## Interviews
Plan questions, move from open to specific, listen actively, document accurately, and respect rights (representation, fairness). Avoid leading or oppressive questioning.

## Reporting
A good report includes: background, allegations, scope, methodology, findings with evidence references, conclusions against each allegation, and recommendations (control improvements, disciplinary, recovery, external reporting). Keep facts and opinions clearly separated.`,
            exercise:
              "Draft the 'findings' paragraph for an allegation that an employee created a fictitious supplier, using neutral, evidence-referenced language.",
          },
        ],
      },
    ],
  },
  {
    slug: "fraud-risk-assessment-prevention",
    title: "Fraud Risk Assessment and Prevention Controls",
    subtitle: "Designing a fraud risk framework that works",
    topic: "fraud",
    level: "ADVANCED",
    minutes: 110,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Build a fraud risk assessment, map controls to risks, and design a fraud prevention framework — including consideration of corporate 'failure to prevent fraud' obligations.",
    objectives: [
      "Conduct a fraud risk assessment",
      "Map preventive and detective controls to fraud risks",
      "Understand corporate failure-to-prevent obligations",
    ],
    keywords: ["fraud risk assessment", "controls", "failure to prevent fraud"],
    related: ["fraud-fundamentals-typologies", "enterprise-financial-crime-risk-assessment"],
    modules: [
      {
        title: "Framework",
        lessons: [
          {
            title: "Fraud risk assessment",
            minutes: 14,
            content: `## Steps
1. Identify fraud schemes relevant to each product, process and channel
2. Assess likelihood and impact (inherent risk)
3. Map existing controls and assess their effectiveness
4. Determine residual risk against appetite
5. Define actions, owners and timelines

## Corporate liability
Some jurisdictions impose corporate liability for failing to prevent fraud by associated persons. For example, the UK Economic Crime and Corporate Transparency Act 2023 created a "failure to prevent fraud" offence for large organisations, in force from 1 September 2025, with a defence of having reasonable fraud prevention procedures. Government guidance describes principles such as top-level commitment, risk assessment, proportionate procedures, due diligence, communication and monitoring.`,
          },
        ],
      },
    ],
  },
];
