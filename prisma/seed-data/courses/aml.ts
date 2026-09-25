import type { SeedCourse } from "../types";

export const AML_COURSES: SeedCourse[] = [
  {
    slug: "aml-cft-fundamentals",
    title: "AML/CFT Fundamentals",
    subtitle: "The foundations of anti-money laundering and counter-terrorist financing",
    topic: "aml-ctf",
    level: "BEGINNER",
    minutes: 150,
    tier: "FREE",
    cpd: 2.5,
    overview:
      "A practical introduction to money laundering and terrorist financing, the international standards that shape national regimes, and the controls every regulated firm is expected to operate. Designed for new joiners to compliance, operations and risk functions.",
    objectives: [
      "Define money laundering and terrorist financing and explain how they differ",
      "Describe the role of the FATF and its Recommendations in shaping national AML/CFT laws",
      "Explain the risk-based approach and why it underpins every AML programme",
      "Identify the core components of an AML/CFT compliance programme",
      "Recognise common red flags and know when and how to escalate concerns",
    ],
    keywords: ["money laundering", "terrorist financing", "FATF", "risk-based approach", "compliance programme"],
    related: ["money-laundering-stages-typologies", "customer-due-diligence-kyc", "suspicious-activity-reporting"],
    modules: [
      {
        title: "Understanding financial crime",
        summary: "What money laundering and terrorist financing are, and why they matter.",
        lessons: [
          {
            title: "What is money laundering?",
            minutes: 12,
            content: `## What is money laundering?

**Money laundering** is the process of disguising the origin of criminal proceeds so that they appear to come from a legitimate source. Criminals launder money because illicit funds are difficult to spend, invest or save without attracting attention.

Most legal definitions share three elements:

1. **Property** — any asset: cash, bank balances, real estate, crypto-assets, goods or business interests.
2. **Criminal origin** — the property derives, directly or indirectly, from a criminal offence (a *predicate offence*).
3. **Knowledge or suspicion** — the person dealing with the property knows, suspects or (in some jurisdictions) has reasonable grounds to suspect its criminal origin.

### Predicate offences
Predicate offences are the underlying crimes that generate proceeds. The FATF lists designated categories including fraud, corruption and bribery, drug trafficking, human trafficking, tax crimes, environmental crime, cybercrime and sanctions-related offences. Many jurisdictions take an "all crimes" approach, so the proceeds of *any* offence can be laundered.

### Why it matters
Money laundering allows crime to be profitable, corrupts financial institutions, distorts markets and undermines public trust. For firms, failure to prevent it can lead to criminal liability, regulatory fines, remediation costs, restrictions on business and severe reputational damage.

> **Key point:** You do not need to know which crime generated the funds to have a suspicion of money laundering. Unusual activity that lacks an apparent economic or lawful purpose is enough to prompt enquiry and, where appropriate, escalation.`,
            exercise:
              "A café owner deposits cash takings that are three times higher than comparable cafés in the same street, with no increase in stock purchases. List three questions you would ask to understand whether the activity is explainable.",
          },
          {
            title: "Terrorist financing and how it differs",
            minutes: 10,
            content: `## Terrorist financing

**Terrorist financing (TF)** is the provision or collection of funds, by any means, with the intention or knowledge that they will be used to carry out terrorist acts or support terrorist individuals or organisations.

### How TF differs from money laundering

| | Money laundering | Terrorist financing |
|---|---|---|
| Source of funds | Always criminal | Can be legitimate (salaries, donations, business income) or criminal |
| Direction of focus | Disguising where money **came from** | Concealing where money is **going** |
| Typical amounts | Often large | Often small and unremarkable |

Because TF can involve clean money and small sums, traditional "large and unusual" detection logic is less effective. Controls rely heavily on **sanctions screening**, intelligence-led indicators, geographic risk and relationships with high-risk intermediaries.

### Common TF methods
- Misuse of non-profit organisations (NPOs), particularly those operating near conflict zones
- Cash couriers and informal value transfer systems (e.g., hawala) where unregulated
- Small, structured transfers through money service businesses
- Crowdfunding and online payment platforms
- Virtual assets

> **Proportionality:** FATF guidance stresses that measures on NPOs should be risk-based and must not disrupt legitimate charitable activity.`,
          },
        ],
      },
      {
        title: "The international and legal framework",
        summary: "FATF standards, national laws and supervisors.",
        lessons: [
          {
            title: "The FATF and its Recommendations",
            minutes: 14,
            content: `## The Financial Action Task Force (FATF)

The **FATF** is an inter-governmental body established in 1989 by the G7. It sets international standards to combat money laundering, terrorist financing and proliferation financing.

### The FATF Recommendations
The FATF Recommendations (comprehensively revised in 2012 and updated regularly since) set out measures that countries should implement, including:

- Criminalising money laundering and terrorist financing
- Requiring financial institutions and designated non-financial businesses and professions (DNFBPs) to conduct customer due diligence, keep records and report suspicious transactions
- Establishing Financial Intelligence Units (FIUs)
- Ensuring transparency of beneficial ownership of legal persons and arrangements
- Implementing targeted financial sanctions related to terrorism and proliferation
- International co-operation

### Mutual evaluations
Countries are assessed through **mutual evaluations** that measure both technical compliance (are the laws in place?) and effectiveness (are they working?). Jurisdictions with strategic deficiencies may be publicly identified as under **increased monitoring**, or, in the most serious cases, subject to a **call for action**. These public statements are a key input into country-risk assessments.

> Always check the current FATF public statements on the official FATF website — the lists change after each plenary.`,
          },
          {
            title: "National regimes, FIUs and supervisors",
            minutes: 12,
            content: `## From standard to law

FATF standards are not directly binding on firms. They are implemented through national legislation and regulation. Examples include:

- **United States:** the Bank Secrecy Act (BSA) and its implementing regulations, administered by FinCEN, with sanctions administered by OFAC.
- **United Kingdom:** the Proceeds of Crime Act 2002, the Terrorism Act 2000 and the Money Laundering Regulations 2017.
- **European Union:** a directive-based framework that is transitioning to a directly applicable AML Regulation and a new EU Anti-Money Laundering Authority (AMLA).
- **India:** the Prevention of Money Laundering Act, 2002 (PMLA), with reporting to FIU-IND and sectoral rules from regulators such as the RBI and SEBI.

### Financial Intelligence Units
An FIU receives and analyses suspicious transaction reports and disseminates intelligence to law enforcement. Examples: FinCEN (US), the UK Financial Intelligence Unit within the National Crime Agency, and FIU-IND (India).

### Supervisors
Supervisors check that firms have effective systems and controls and can impose sanctions for failures. Supervisory expectations are communicated through rules, guidance, thematic reviews and enforcement outcomes.`,
          },
        ],
      },
      {
        title: "Building an AML programme",
        summary: "The risk-based approach and core controls.",
        lessons: [
          {
            title: "The risk-based approach",
            minutes: 12,
            content: `## The risk-based approach (RBA)

The RBA requires firms to **identify, assess and understand** their money laundering and terrorist financing risks and to apply controls proportionate to those risks.

### Risk factors
- **Customer:** type, ownership complexity, PEP status, adverse media, occupation or business activity
- **Product and service:** anonymity, speed, cross-border capability, cash intensity
- **Geography:** countries of residence, operation, and counterparties; FATF status; sanctions exposure; corruption levels
- **Delivery channel:** non-face-to-face onboarding, intermediaries, introducers

### From assessment to controls
The **business-wide risk assessment** informs policies, the customer risk-rating methodology, monitoring scenarios, staffing and training. Higher-risk relationships receive enhanced due diligence and more frequent review; lower-risk relationships may qualify for simplified measures where the law allows.

> A risk-based approach is **not** a zero-risk approach. The aim is to manage risk effectively and document the rationale for decisions.`,
          },
          {
            title: "Core controls and your role",
            minutes: 14,
            content: `## Core components of an AML/CFT programme

1. **Governance** — senior management oversight, a nominated officer / MLRO / BSA officer with adequate authority and resources.
2. **Risk assessment** — business-wide and customer-level.
3. **Customer due diligence** — identification, verification, beneficial ownership, purpose and nature of the relationship, ongoing monitoring.
4. **Transaction monitoring** — automated and manual detection of unusual activity.
5. **Sanctions screening** — customers, parties and payments.
6. **Suspicious activity reporting** — internal escalation and external filing.
7. **Record keeping** — retaining CDD and transaction records for the legally required period.
8. **Training** — role-appropriate, regular and tested.
9. **Independent testing** — audit and assurance of control effectiveness.

### Your personal obligations
Employees in regulated firms generally must report knowledge or suspicion internally. In many jurisdictions it is an offence to **tip off** a customer that a report has been made or an investigation is under way.

### Red flags to remember
- Reluctance to provide information or inconsistent explanations
- Transactions inconsistent with the customer's profile
- Complex structures without clear rationale
- Rapid movement of funds in and out ("pass-through")
- Use of third parties to make or receive payments without clear reason`,
            exercise:
              "Draft a two-sentence internal escalation note for a customer whose account receives many small incoming transfers from unrelated individuals, followed by same-day outgoing international transfers.",
          },
        ],
      },
    ],
    resources: [
      {
        title: "AML/CFT red-flag quick reference",
        filename: "aml-red-flags-quick-reference.md",
        tier: "FREE",
        content: `# AML/CFT red-flag quick reference (FinCrime Academy)

Educational aid only. Always follow your firm's policies.

## Customer behaviour
- Reluctant to provide identification or source-of-funds information
- Inconsistent or changing explanations
- Unusual interest in reporting thresholds or controls

## Account activity
- Activity inconsistent with stated occupation or business
- Rapid in-and-out movement of funds (pass-through)
- Structuring: multiple transactions just below thresholds
- Many unrelated third-party payers or beneficiaries

## Geography
- Links to jurisdictions under FATF increased monitoring or call for action
- Transactions with sanctioned or high-risk jurisdictions without clear rationale

## What to do
1. Do not tip off the customer.
2. Record what you observed and why it is unusual.
3. Escalate using your internal reporting procedure.
`,
      },
    ],
  },
  {
    slug: "money-laundering-stages-typologies",
    title: "Money Laundering Stages and Typologies",
    subtitle: "Placement, layering and integration — and how launderers exploit each sector",
    topic: "aml-ctf",
    level: "BEGINNER",
    minutes: 120,
    tier: "FREE",
    cpd: 2,
    overview:
      "Examine the classic three-stage model of money laundering and the typologies that criminals use across banking, cash businesses, real estate, professional services and trade. Learn to recognise the patterns behind the alerts.",
    objectives: [
      "Explain placement, layering and integration with practical examples",
      "Identify typologies involving cash, shell companies, real estate and professional enablers",
      "Connect typologies to observable red flags in customer and transaction data",
      "Recognise the limits of the three-stage model",
    ],
    keywords: ["placement", "layering", "integration", "shell companies", "smurfing", "structuring"],
    related: ["aml-cft-fundamentals", "transaction-monitoring-investigations", "trade-based-money-laundering"],
    modules: [
      {
        title: "The three stages",
        lessons: [
          {
            title: "Placement",
            minutes: 10,
            content: `## Placement

Placement is the introduction of criminal proceeds into the financial system. It is often the **most vulnerable** stage for the launderer because the funds are closest to the crime — frequently in cash.

### Common placement methods
- **Structuring / smurfing:** breaking cash into amounts below reporting thresholds and using multiple people ("smurfs") to deposit it.
- **Cash-intensive businesses:** co-mingling criminal cash with legitimate takings (restaurants, car washes, convenience stores).
- **Purchasing monetary instruments:** buying prepaid cards, money orders or casino chips with cash.
- **Cash smuggling:** physically moving cash across borders to jurisdictions with weaker controls.

### Indicators
- Frequent cash deposits just below reporting thresholds
- Deposits at multiple branches on the same day
- Cash volumes inconsistent with the business profile`,
          },
          {
            title: "Layering and integration",
            minutes: 12,
            content: `## Layering
Layering creates distance between the funds and their source through complex transactions: multiple transfers between accounts and jurisdictions, conversion between currencies or asset types, and use of corporate vehicles.

**Typical layering techniques**
- Chains of wire transfers through accounts held by shell or front companies
- Back-to-back loans and fictitious invoices
- Conversion into and out of virtual assets
- Buying and quickly reselling high-value goods

## Integration
Integration returns laundered funds to the criminal in apparently legitimate form: property purchases, business investments, luxury assets, or "loan" repayments from companies they secretly control.

## Limits of the model
Real schemes rarely follow tidy stages. Proceeds generated electronically (e.g., fraud or cybercrime) may skip placement entirely. Self-laundering and *professional money laundering networks* can merge stages. Use the model to structure thinking — not as a checklist.`,
          },
        ],
      },
      {
        title: "Sector typologies",
        lessons: [
          {
            title: "Corporate vehicles and professional enablers",
            minutes: 14,
            content: `## Corporate vehicles

**Shell companies** have no significant operations or assets. **Front companies** conduct some genuine business to disguise illicit flows. Both can hide beneficial ownership, especially when layered across jurisdictions, combined with nominee directors or shareholders, or held via trusts.

### Warning signs
- Complex ownership chains with no clear commercial rationale
- Registered addresses shared with hundreds of other companies
- Nominee directors with many appointments
- Payments described vaguely ("consulting", "services") with round amounts

## Professional enablers
Lawyers, accountants, trust and company service providers, and real estate agents can be misused — knowingly or unknowingly — to create structures, hold funds in client accounts, and lend credibility. The FATF has published reports on professional money laundering highlighting organisations that launder for multiple criminal clients for a fee.`,
          },
          {
            title: "Real estate, high-value goods and cash businesses",
            minutes: 12,
            content: `## Real estate
Property allows large sums to be moved in a single transaction and can hold or increase in value. Risks increase with all-cash purchases, purchases through opaque companies, rapid resales at unexplained price changes, and third-party payments.

## High-value goods
Art, jewellery, luxury vehicles and precious metals are portable, store value and may be traded privately. Dealers in precious metals and stones are designated non-financial businesses under FATF standards.

## Cash-intensive businesses
Legitimate businesses with high cash turnover can be used to co-mingle funds. Compare deposits with sector benchmarks, footfall, staffing and supplier purchases.`,
            exercise:
              "Map a hypothetical scheme across the three stages: cash from drug sales, a car-wash business, and the purchase of an apartment through a company. Identify one red flag a bank could detect at each stage.",
          },
        ],
      },
    ],
  },
  {
    slug: "customer-due-diligence-kyc",
    title: "Customer Due Diligence and KYC",
    subtitle: "Identify, verify and understand your customers",
    topic: "kyc-cdd",
    level: "BEGINNER",
    minutes: 160,
    tier: "FREE",
    cpd: 2.5,
    overview:
      "Learn how to perform customer due diligence for individuals and legal entities: identification and verification, beneficial ownership, the nature and purpose of the relationship, customer risk rating and ongoing monitoring.",
    objectives: [
      "Distinguish identification from verification and apply both to individuals and entities",
      "Identify beneficial owners and controllers of legal persons and arrangements",
      "Document the purpose and intended nature of a business relationship",
      "Assign and justify a customer risk rating",
      "Explain the triggers and scope of ongoing due diligence",
    ],
    keywords: ["KYC", "CDD", "beneficial ownership", "identification", "verification", "risk rating"],
    related: ["enhanced-due-diligence-risk-assessment", "ownership-control-beneficial-ownership", "aml-cft-fundamentals"],
    modules: [
      {
        title: "Identification and verification",
        lessons: [
          {
            title: "Individuals",
            minutes: 12,
            content: `## Customer identification and verification — individuals

**Identification** means obtaining information about who the customer is (full name, date of birth, residential address, nationality). **Verification** means confirming that information using reliable, independent sources.

### Verification sources
- Government-issued photo identity documents
- Electronic verification against reliable databases
- Digital identity schemes that meet regulatory standards

### Non-face-to-face onboarding
Remote onboarding is common and can be secure when combined with liveness checks, document authentication and device/behavioural signals. The risk lies in weak implementation, not in the channel itself.

### Common pitfalls
- Accepting expired or visibly altered documents
- Failing to reconcile inconsistencies (different address on document and application)
- Treating data capture as the end of the process rather than the beginning of understanding the customer`,
          },
          {
            title: "Legal entities and beneficial ownership",
            minutes: 16,
            content: `## Legal entities

For companies, partnerships, trusts and foundations, firms must understand:

- Legal name, registration number, registered address and principal place of business
- Legal form, constitution and powers that bind the entity
- Directors and senior managers
- **Ownership and control structure**
- **Beneficial owners**

### Beneficial owners
A beneficial owner is the **natural person** who ultimately owns or controls the customer, or on whose behalf a transaction is conducted. Many regimes use a **25%** ownership or voting threshold as a trigger, plus anyone exercising control through other means. If no person meets the threshold, firms identify the senior managing official — and record why.

### Trusts
Identify settlors, trustees, protectors (if any), beneficiaries or classes of beneficiary, and any other person exercising effective control.

> Registers of beneficial ownership are a helpful source but should not be relied on exclusively. Discrepancies should be investigated and, where required, reported.`,
            exercise:
              "Company A is owned 40% by Mr X, 35% by Company B and 25% by Ms Y. Company B is wholly owned by Mr X. Who are the beneficial owners of Company A under a 25% threshold, and why?",
          },
        ],
      },
      {
        title: "Understanding the relationship",
        lessons: [
          {
            title: "Purpose, nature and expected activity",
            minutes: 12,
            content: `## Purpose and intended nature

CDD is not only about identity. Firms must understand **why** the customer wants the relationship and **how** they will use it. This creates the baseline against which monitoring detects unusual activity.

Capture:
- Source of funds for the relationship and, where relevant, source of wealth
- Expected products, transaction types, volumes, values and frequency
- Expected counterparties and geographies
- For businesses: sector, customer base, supply chain, and trading patterns

A well-documented profile makes alerts easier to disposition and strengthens suspicious activity reports.`,
          },
          {
            title: "Customer risk rating and ongoing monitoring",
            minutes: 14,
            content: `## Customer risk rating

Risk ratings combine factors — customer type, geography, products, channel, PEP status, adverse media — into a rating (e.g., low / medium / high). Good methodologies are documented, consistently applied, explainable, and periodically validated.

## Ongoing due diligence
CDD is a continuous obligation:
- **Periodic reviews** based on risk (e.g., annually for high risk)
- **Trigger-based reviews** — material changes in ownership, activity, adverse media, sanctions hits or alerts
- **Keeping data current** — refreshing expired documents and outdated information

### Exiting relationships
Where CDD cannot be completed, firms should not open the account or should consider terminating the relationship and assess whether a suspicious activity report is required.`,
          },
        ],
      },
    ],
    resources: [
      {
        title: "Beneficial ownership worksheet",
        filename: "beneficial-ownership-worksheet.md",
        tier: "FREE",
        content: `# Beneficial ownership worksheet

1. Legal entity name / registration number:
2. Layer-by-layer ownership (entity → owner → %):
3. Indirect ownership calculation (multiply percentages along each chain; add chains held by the same person):
4. Natural persons at or above threshold:
5. Persons with control by other means (voting agreements, appointment rights, veto powers):
6. Senior managing official (if no beneficial owner identified) and rationale:
7. Verification sources used:
8. Discrepancies with public registers and actions taken:
`,
      },
    ],
  },
  {
    slug: "enhanced-due-diligence-risk-assessment",
    title: "Enhanced Due Diligence and Risk Assessment",
    subtitle: "Applying proportionate enhanced measures to higher-risk relationships",
    topic: "kyc-cdd",
    level: "INTERMEDIATE",
    minutes: 150,
    tier: "PREMIUM",
    cpd: 2.5,
    overview:
      "Move beyond standard CDD to design and perform enhanced due diligence for higher-risk customers: PEPs, high-risk jurisdictions, complex structures and high-risk industries. Learn to evidence source of wealth and write defensible risk assessments.",
    objectives: [
      "Identify mandatory and risk-based triggers for enhanced due diligence",
      "Corroborate source of wealth and source of funds with appropriate evidence",
      "Assess and mitigate risk from PEPs and high-risk third countries",
      "Write a clear, balanced EDD risk assessment and approval memo",
    ],
    keywords: ["EDD", "PEP", "source of wealth", "high-risk", "approval"],
    related: ["customer-due-diligence-kyc", "pep-risk-corruption-exposure", "aml-governance-compliance-programs"],
    modules: [
      {
        title: "When EDD applies",
        lessons: [
          {
            title: "Triggers for enhanced due diligence",
            minutes: 12,
            content: `## EDD triggers

**Mandatory triggers** (vary by jurisdiction) commonly include:
- Politically exposed persons (PEPs), particularly foreign PEPs
- Customers or transactions linked to high-risk third countries identified by the FATF or national lists
- Correspondent relationships with respondent institutions outside the home jurisdiction
- Complex or unusually large transactions with no apparent economic purpose

**Risk-based triggers** include adverse media, opaque ownership, cash-intensive or high-risk industries, private banking, and unexplained wealth.

EDD must be **proportionate**: more information, more corroboration, senior approval and more frequent monitoring — scaled to the specific risks identified.`,
          },
          {
            title: "Source of wealth and source of funds",
            minutes: 16,
            content: `## Source of funds vs source of wealth

- **Source of funds (SoF):** the origin of the specific funds used in the relationship or transaction (e.g., sale proceeds from a property).
- **Source of wealth (SoW):** how the customer accumulated their total net worth (e.g., career earnings, business sale, inheritance).

### Corroboration
Customer declarations should be **corroborated** in proportion to risk: sale contracts, audited accounts, payslips, tax returns, probate documents, reputable public sources. Record what was reviewed and how it supports the narrative.

### Plausibility testing
Ask: is the claimed wealth consistent with age, career, sector compensation norms and public information? Are there gaps in the timeline? Are there links to state contracts, high-corruption sectors or sanctioned parties?`,
            exercise:
              "A 34-year-old customer declares net worth of USD 25 million from 'crypto trading and consulting'. List the documents you would request and the public-source checks you would perform.",
          },
        ],
      },
      {
        title: "Assessment and approval",
        lessons: [
          {
            title: "Writing the EDD risk assessment",
            minutes: 14,
            content: `## Structure of a good EDD memo

1. **Relationship summary** — who, what, why, expected activity
2. **Risk factors identified** — each factor stated factually with evidence
3. **Mitigating factors** — verified facts that reduce risk (not assumptions)
4. **Residual risk** — overall conclusion and rating
5. **Conditions** — restrictions, monitoring enhancements, review frequency
6. **Recommendation** — approve, approve with conditions, or decline, with rationale

### Quality markers
- Balanced and evidence-based; distinguishes allegation from finding
- Cites sources with dates
- Explains why adverse media is or is not material
- Clear on what would change the assessment`,
          },
          {
            title: "Senior management approval and ongoing EDD",
            minutes: 10,
            content: `## Approval

Senior management approval is required in many regimes for PEPs and high-risk relationships. Approvers must receive enough information to make an informed decision and should document their reasoning, not just their signature.

## Ongoing EDD
- More frequent reviews (commonly annual or more often)
- Enhanced transaction monitoring and lower alert thresholds where appropriate
- Refreshed adverse media and sanctions screening
- Revisiting SoW when material changes occur`,
          },
        ],
      },
    ],
  },
  {
    slug: "transaction-monitoring-investigations",
    title: "Transaction Monitoring and Investigations",
    subtitle: "From alert to decision: detecting and investigating unusual activity",
    topic: "transaction-monitoring",
    level: "INTERMEDIATE",
    minutes: 170,
    tier: "PREMIUM",
    cpd: 3,
    overview:
      "Understand how monitoring systems generate alerts, how scenarios are designed and tuned, and how to investigate and disposition alerts consistently. Includes practical techniques for analysing account activity and documenting decisions.",
    objectives: [
      "Explain rules-based and behavioural monitoring approaches",
      "Design scenarios linked to typologies and customer segments",
      "Triage and investigate alerts using a structured method",
      "Write clear alert and case dispositions",
      "Understand tuning, below-the-line testing and model governance",
    ],
    keywords: ["alerts", "scenarios", "tuning", "disposition", "false positives"],
    related: ["suspicious-activity-reporting", "fraud-investigations-evidence", "money-laundering-stages-typologies"],
    modules: [
      {
        title: "How monitoring works",
        lessons: [
          {
            title: "Scenarios, rules and models",
            minutes: 14,
            content: `## Monitoring approaches

- **Rules / scenarios:** deterministic logic (e.g., cash deposits totalling more than X within Y days). Transparent and explainable; can generate many false positives.
- **Behavioural / anomaly detection:** compares activity with the customer's own history or peer group.
- **Network analytics:** identifies connected parties, shared attributes and flows.
- **Machine-learning models:** can prioritise alerts or detect complex patterns but require robust governance, explainability and validation.

### Linking to typologies
Every scenario should map to a documented risk or typology (e.g., rapid movement of funds, structuring, high-risk corridors). Coverage assessments identify gaps where risks exist but no detection is in place.`,
          },
          {
            title: "Tuning and governance",
            minutes: 12,
            content: `## Tuning

Thresholds are calibrated using data analysis:
- **Above-the-line (ATL):** review alerts produced at current thresholds and their productivity.
- **Below-the-line (BTL):** sample activity just below thresholds to test whether suspicious activity is being missed.

Changes must be documented, approved, and tested before deployment. Data quality — missing fields, incorrect customer segments, unmapped transaction codes — is a frequent root cause of monitoring failures.

## Governance
Model risk management, independent validation, periodic effectiveness reviews and management information (alert volumes, backlog, conversion to cases and reports) demonstrate control effectiveness to supervisors.`,
          },
        ],
      },
      {
        title: "Investigating alerts",
        lessons: [
          {
            title: "A structured investigation method",
            minutes: 16,
            content: `## Five-step alert review

1. **Understand the trigger** — which scenario fired, and what data caused it?
2. **Know the customer** — review KYC profile, risk rating, expected activity and prior alerts or reports.
3. **Analyse the activity** — look beyond the alerted transactions: counterparties, geographies, timing, velocity, round amounts, and flow-through patterns.
4. **Seek explanations** — internal information, open sources, and (where appropriate and without tipping off) customer outreach via the relationship team.
5. **Decide and document** — close with rationale, escalate to a case, or recommend a report.

### Useful analytical techniques
- Summarise inflows vs outflows by counterparty and country
- Identify the "first-in / first-out" relationship between credits and debits
- Look for common attributes (addresses, devices, phone numbers) across parties`,
            exercise:
              "Write a closure rationale for an alert on a small import business whose monthly incoming payments rose by 60% in December, consistent with prior years' seasonal pattern and supported by invoices.",
          },
          {
            title: "Writing dispositions",
            minutes: 10,
            content: `## Good dispositions are
- **Specific:** reference the transactions, amounts and dates reviewed
- **Evidence-based:** state what was verified and how
- **Reasoned:** explain why the activity is or is not consistent with the profile
- **Reproducible:** another reviewer would reach the same conclusion from the file

Avoid generic closures such as "activity appears normal". If you rely on the customer's explanation, record whether it was corroborated.`,
          },
        ],
      },
    ],
  },
  {
    slug: "suspicious-activity-reporting",
    title: "Suspicious Activity Reporting and STR Writing",
    subtitle: "Recognise, escalate and write high-quality suspicious activity reports",
    topic: "investigations",
    level: "INTERMEDIATE",
    minutes: 130,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Learn the legal basis of suspicious activity reporting, internal escalation, tipping-off risk and how to write clear, useful reports that law enforcement can act on.",
    objectives: [
      "Explain reporting obligations and the concept of suspicion",
      "Manage internal escalation and avoid tipping off",
      "Structure a narrative using the who, what, when, where, why and how",
      "Identify common quality failings in reports",
    ],
    keywords: ["SAR", "STR", "suspicion", "tipping off", "narrative"],
    related: ["transaction-monitoring-investigations", "aml-cft-fundamentals"],
    modules: [
      {
        title: "Obligations",
        lessons: [
          {
            title: "What is suspicion?",
            minutes: 12,
            content: `## Suspicion

Suspicion is a lower threshold than knowledge or belief. Courts in several common-law jurisdictions have described it as a possibility, which is more than fanciful, that the relevant facts exist — it need not be clear or firmly grounded, but it must be genuinely held.

### Reporting frameworks (examples)
- **US:** Suspicious Activity Reports are filed with FinCEN, generally within 30 calendar days of initial detection of facts that may constitute a basis for filing.
- **UK:** SARs are submitted to the UK Financial Intelligence Unit (NCA). A defence against money laundering (DAML) can be requested before proceeding with a prohibited act.
- **India:** Suspicious Transaction Reports are filed with FIU-IND within the timeframe set by the PMLA rules.

Always follow the current requirements of your jurisdiction and your firm's procedures.`,
          },
          {
            title: "Escalation and tipping off",
            minutes: 10,
            content: `## Internal escalation
Staff report to the nominated officer (MLRO/BSA officer), who decides whether to file externally. Escalation should be timely, factual, and documented.

## Tipping off
Disclosing to the customer (or third parties) that a report has been or may be made, or that an investigation is under way, can be a criminal offence. Practical safeguards:
- Use neutral language when requesting information
- Do not reference monitoring or reports in customer communications
- Restrict access to investigation files`,
          },
        ],
      },
      {
        title: "Writing the narrative",
        lessons: [
          {
            title: "Structure and quality",
            minutes: 14,
            content: `## A useful narrative answers

- **Who** — subjects, identifiers, relationships
- **What** — the activity and why it is suspicious
- **When** — dates and period covered
- **Where** — accounts, branches, jurisdictions
- **Why** — the reasons for suspicion, linked to typologies or red flags
- **How** — the method, flow of funds

### Tips
- Start with a one-paragraph summary of the suspicion
- Present transactions in a clear chronology or table
- Explain abbreviations and internal codes
- Separate facts from analysis
- Avoid speculation beyond the evidence`,
            exercise:
              "Rewrite this weak narrative into a clear summary paragraph: 'Customer did lots of transfers that looked strange. Please investigate.'",
          },
        ],
      },
    ],
  },
  {
    slug: "trade-based-money-laundering",
    title: "Trade-Based Money Laundering",
    subtitle: "How value is moved through the misrepresentation of trade",
    topic: "trade-based",
    level: "INTERMEDIATE",
    minutes: 140,
    tier: "PREMIUM",
    cpd: 2.5,
    overview:
      "Explore how criminals disguise proceeds through trade transactions — mis-invoicing, phantom shipments and third-party payments — and learn the red flags and data checks used by banks and trade finance teams.",
    objectives: [
      "Explain how TBML moves value through over- and under-invoicing",
      "Recognise documentary and open-account trade red flags",
      "Apply price, route and counterparty plausibility checks",
      "Understand the interaction between TBML, sanctions and export controls",
    ],
    keywords: ["TBML", "mis-invoicing", "trade finance", "letters of credit", "phantom shipment"],
    related: ["trade-finance-financial-crime", "maritime-shipping-trade-sanctions", "money-laundering-stages-typologies"],
    modules: [
      {
        title: "Techniques",
        lessons: [
          {
            title: "Mis-invoicing and phantom shipments",
            minutes: 14,
            content: `## Core TBML techniques

- **Over-invoicing:** the importer pays more than the goods are worth, moving excess value to the exporter.
- **Under-invoicing:** the importer pays less, moving value to the importer, who resells at market price.
- **Multiple invoicing:** the same shipment is invoiced and paid more than once, often through different banks.
- **Over/under-shipment:** quantity shipped differs from the quantity invoiced.
- **Phantom shipments:** no goods move at all; documents are fabricated.
- **Misdescription:** goods are described as something of different quality or type.

### Why trade is attractive
Trade volumes are huge, documents are complex, pricing varies, and most trade is financed on **open account**, where banks see only the payment and not the underlying documents.`,
          },
          {
            title: "Red flags and checks",
            minutes: 14,
            content: `## Red flags
- Prices significantly inconsistent with market values
- Goods inconsistent with the customer's business
- Transshipment through jurisdictions with no apparent commercial reason
- Payments from third parties unconnected to the trade
- Frequent amendments to letters of credit (beneficiary, port, goods)
- Circular trade (goods returning to origin)

## Practical checks
- Unit price comparisons against reference data
- Vessel and container tracking to confirm movement
- Consistency of goods, HS codes, weights and routes
- Counterparty due diligence and adverse media`,
            exercise:
              "An invoice shows 20,000 units of basic cotton T-shirts at USD 45 each shipped via three transshipment ports. What would you check first, and why?",
          },
        ],
      },
    ],
  },
  {
    slug: "correspondent-banking-aml-risk",
    title: "Correspondent Banking and AML Risk",
    subtitle: "Managing respondent-bank risk, nested relationships and payment transparency",
    topic: "aml-ctf",
    level: "ADVANCED",
    minutes: 140,
    tier: "PREMIUM",
    cpd: 2.5,
    overview:
      "Correspondent banking connects the global payments system but exposes correspondents to the controls of their respondents. Learn how to assess respondents, manage nested relationships and payable-through accounts, and monitor payment flows.",
    objectives: [
      "Explain correspondent banking and why it is considered higher risk",
      "Perform respondent due diligence and evaluate AML controls",
      "Identify nested and downstream correspondent relationships",
      "Apply payment transparency standards to cross-border wires",
    ],
    keywords: ["correspondent banking", "respondent", "nested", "payable-through", "Wolfsberg", "payment transparency"],
    related: ["aml-governance-compliance-programs", "sanctions-screening-alert-investigation"],
    modules: [
      {
        title: "Respondent risk",
        lessons: [
          {
            title: "Why correspondent banking is higher risk",
            minutes: 12,
            content: `## Correspondent banking

A **correspondent** provides accounts and services to a **respondent** bank, allowing the respondent's customers to access foreign currencies and markets. The correspondent generally has no direct relationship with the respondent's customers, so it relies on the respondent's controls.

### Key risks
- Weak AML controls at the respondent
- **Nested** relationships: the respondent offers services to other banks, which use the correspondent account indirectly
- **Payable-through accounts:** respondent customers directly transact through the correspondent account
- Exposure to high-risk jurisdictions and sanctioned parties

FATF Recommendation 13 requires enhanced measures, including understanding the respondent's business, reputation and supervision, assessing its AML/CFT controls, and obtaining senior management approval.`,
          },
          {
            title: "Respondent due diligence",
            minutes: 14,
            content: `## Due diligence components
- Ownership, management and licensing
- Regulatory and enforcement history, adverse media
- Jurisdictional risk and supervision quality
- AML/CFT programme and sanctions controls (industry questionnaires such as the Wolfsberg CBDDQ are commonly used)
- Products and customer base, including downstream correspondents
- Expected activity: currencies, volumes, corridors

## Ongoing monitoring
Monitor flows against expected activity, watch for nested activity, examine RFIs responses, and review periodically based on risk. Poor responses to requests for information are themselves a risk indicator.`,
          },
        ],
      },
      {
        title: "Payment transparency",
        lessons: [
          {
            title: "Wire transfers and the travel of information",
            minutes: 12,
            content: `## Payment transparency
FATF Recommendation 16 requires originator and beneficiary information to accompany wire transfers throughout the payment chain. Intermediary banks should monitor for missing or meaningless information and have risk-based policies for handling deficient messages.

### Red flags
- Missing or placeholder originator data
- Repeated use of cover payments to obscure parties
- Stripping or altering information to avoid sanctions filters — a serious violation`,
          },
        ],
      },
    ],
  },
  {
    slug: "aml-governance-compliance-programs",
    title: "AML Governance and Compliance Programs",
    subtitle: "Designing, leading and evidencing an effective AML programme",
    topic: "governance",
    level: "ADVANCED",
    minutes: 150,
    tier: "PREMIUM",
    cpd: 2.5,
    overview:
      "For MLROs, compliance leaders and aspiring managers: governance structures, the three lines model, management information, resourcing, and how to evidence programme effectiveness to boards and supervisors.",
    objectives: [
      "Describe governance structures and accountability for AML",
      "Apply the three lines model to financial crime risk",
      "Design meaningful management information",
      "Plan remediation and respond to supervisory findings",
    ],
    keywords: ["MLRO", "three lines", "board", "MI", "remediation"],
    related: ["financial-crime-risk-governance", "enterprise-financial-crime-risk-assessment", "financial-crime-audit-control-testing"],
    modules: [
      {
        title: "Governance",
        lessons: [
          {
            title: "Accountability and the three lines",
            minutes: 14,
            content: `## Accountability
Boards set risk appetite and oversee the programme. A designated officer (MLRO/BSA officer) has day-to-day responsibility with sufficient seniority, independence and resources.

## The three lines model
- **First line:** business and operations own risks and operate controls (e.g., onboarding, alert handling).
- **Second line:** compliance sets policy, provides advice and challenge, and monitors.
- **Third line:** internal audit provides independent assurance.

Clear roles avoid gaps and duplication. Documented RACI matrices help.`,
          },
          {
            title: "Management information and effectiveness",
            minutes: 12,
            content: `## Management information (MI)
Useful MI tells a story about risk and control effectiveness:
- Customer risk distribution and trends
- Overdue periodic reviews and CDD remediation
- Alert volumes, backlog, ageing and conversion rates
- Reports filed and law-enforcement feedback
- Training completion and test results
- Audit and assurance findings, and remediation status

Present thresholds and RAG ratings with commentary on causes and actions — not just numbers.`,
          },
        ],
      },
      {
        title: "Remediation",
        lessons: [
          {
            title: "Responding to findings",
            minutes: 12,
            content: `## Effective remediation
1. Root-cause analysis (people, process, systems, data)
2. Prioritised plan with owners, milestones and success criteria
3. Interim risk mitigation while fixes are built
4. Validation that controls work before closing issues
5. Transparent reporting to the board and, where required, the supervisor

Common pitfalls: closing issues on implementation rather than effectiveness; under-resourcing; neglecting data lineage.`,
          },
        ],
      },
    ],
  },
  {
    slug: "cryptocurrency-virtual-asset-aml",
    title: "Cryptocurrency and Virtual Asset AML",
    subtitle: "AML/CFT obligations and risk management for virtual assets",
    topic: "crypto",
    level: "INTERMEDIATE",
    minutes: 140,
    tier: "PREMIUM",
    cpd: 2.5,
    overview:
      "Understand how virtual assets work, how they are misused, the FATF standards for virtual asset service providers, the travel rule, and how blockchain analytics supports monitoring and investigations.",
    objectives: [
      "Explain wallets, exchanges and blockchain transparency",
      "Apply FATF standards for VASPs, including the travel rule",
      "Recognise crypto-specific money laundering typologies",
      "Use blockchain analytics outputs responsibly in investigations",
    ],
    keywords: ["VASP", "travel rule", "blockchain analytics", "mixers", "stablecoins"],
    related: ["crypto-assets-vasps", "aml-cft-fundamentals"],
    modules: [
      {
        title: "Virtual asset basics",
        lessons: [
          {
            title: "How virtual assets move",
            minutes: 12,
            content: `## Key concepts
- **Public blockchains** record transactions between addresses; the ledger is transparent but addresses are pseudonymous.
- **Custodial wallets** are controlled by a service provider (e.g., an exchange); **self-hosted (unhosted) wallets** are controlled by the user.
- **Stablecoins** aim to maintain a stable value against a reference asset and are widely used for cross-border value transfer.

## FATF standards
The FATF applies its standards to **virtual asset service providers (VASPs)** — businesses that exchange, transfer, safekeep or administer virtual assets for others. VASPs must be licensed or registered, conduct CDD, monitor transactions and report suspicions.`,
          },
          {
            title: "The travel rule",
            minutes: 10,
            content: `## Travel rule
FATF Recommendation 16 applies to virtual asset transfers: originating VASPs must obtain and transmit originator and beneficiary information to beneficiary VASPs. The FATF de minimis threshold is USD/EUR 1,000, but jurisdictions may apply stricter rules — for example, the EU's recast Transfer of Funds Regulation applies to crypto-asset transfers without a minimum threshold.

Challenges include counterparty VASP identification, interoperability between travel-rule solutions, and transfers to self-hosted wallets.`,
          },
        ],
      },
      {
        title: "Typologies and analytics",
        lessons: [
          {
            title: "Crypto typologies",
            minutes: 14,
            content: `## Typologies
- **Mixers and tumblers** that obscure transaction trails
- **Chain hopping** — rapid swaps across assets and blockchains
- **Peel chains** — sequences of transfers peeling small amounts off a large balance
- **Ransomware and scam proceeds** cashing out through exchanges with weak controls
- **Money mule accounts** at exchanges
- **Nested services** using an exchange's accounts to serve their own customers

## Blockchain analytics
Analytics tools cluster addresses and attribute them to services or illicit categories. Treat attributions as intelligence with confidence levels — corroborate before drawing conclusions, and document the tool, date and exposure calculation used.`,
            exercise:
              "An exchange customer receives funds that analytics indicates are 30% indirectly exposed to a sanctioned mixer, three hops away. What further analysis would you do before deciding on escalation?",
          },
        ],
      },
    ],
  },
];
