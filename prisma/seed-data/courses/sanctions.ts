import type { SeedCourse } from "../types";

export const SANCTIONS_COURSES: SeedCourse[] = [
  {
    slug: "global-sanctions-fundamentals",
    title: "Global Sanctions Fundamentals",
    subtitle: "What sanctions are, who imposes them and how they apply to your business",
    topic: "sanctions",
    level: "BEGINNER",
    minutes: 140,
    tier: "FREE",
    cpd: 2.5,
    overview:
      "A clear introduction to economic and financial sanctions: their objectives, the main types of measures, the key sanctions authorities, jurisdictional reach, and the core components of a sanctions compliance programme.",
    objectives: [
      "Explain the purpose of sanctions and the main types of restrictive measures",
      "Identify the major sanctions authorities and their legal bases",
      "Distinguish list-based, sectoral and comprehensive sanctions",
      "Describe jurisdictional nexus and why it matters for global firms",
      "Outline the components of a sanctions compliance programme",
    ],
    keywords: ["sanctions", "asset freeze", "OFAC", "UN", "EU", "OFSI", "embargo"],
    related: ["ofac-sanctions-sdn-non-sdn", "un-eu-uk-sanctions-regimes", "sanctions-screening-alert-investigation"],
    modules: [
      {
        title: "Sanctions explained",
        lessons: [
          {
            title: "Purpose and types of sanctions",
            minutes: 12,
            content: `## Why sanctions exist
Sanctions are restrictive measures imposed by governments and international bodies to achieve foreign-policy and national-security objectives: countering terrorism and proliferation of weapons of mass destruction, responding to armed conflict, human-rights abuses, cyber-attacks and corruption, and supporting international peace and security.

## Types of measures
- **Asset freezes / blocking:** funds and economic resources of designated persons are frozen, and making funds available to them is prohibited.
- **Comprehensive or territorial sanctions:** broad prohibitions on dealings involving a country or region.
- **Sectoral sanctions:** targeted restrictions on specific activities in specific sectors (e.g., new debt or equity, certain energy projects).
- **Trade restrictions:** export and import bans, including on dual-use goods and luxury goods.
- **Services restrictions:** bans on providing certain services (e.g., trust, accounting, shipping insurance).
- **Travel bans:** restrictions on entry for designated individuals.

Sanctions are dynamic — designations, general licences and guidance change frequently.`,
          },
          {
            title: "Key sanctions authorities",
            minutes: 14,
            content: `## Principal authorities

- **United Nations Security Council** — adopts sanctions under Chapter VII of the UN Charter, binding on all UN member states, who implement them domestically.
- **United States** — the **Office of Foreign Assets Control (OFAC)** at the Treasury administers most economic sanctions; the State Department and the Commerce Department's Bureau of Industry and Security (BIS) have related roles.
- **European Union** — the Council adopts restrictive measures (CFSP decisions and regulations), which member states enforce.
- **United Kingdom** — sanctions are made under the Sanctions and Anti-Money Laundering Act 2018. The FCDO makes designations; **OFSI** (within HM Treasury) implements and enforces financial sanctions.
- Other jurisdictions (e.g., Canada, Australia, Switzerland, Japan) maintain autonomous regimes.

## Jurisdiction and nexus
Obligations attach based on **nexus**: nationality or incorporation of the person, location of the activity, currency (e.g., US dollar clearing), or involvement of goods and services of a particular origin. A single transaction can touch several regimes at once.`,
          },
        ],
      },
      {
        title: "Compliance in practice",
        lessons: [
          {
            title: "Building a sanctions compliance programme",
            minutes: 14,
            content: `## Programme components
OFAC's *Framework for OFAC Compliance Commitments* (2019) describes five essential components, which are widely recognised internationally:

1. **Management commitment** — resources, authority, and a culture of compliance
2. **Risk assessment** — customers, products, geographies, counterparties and supply chains
3. **Internal controls** — policies, screening, escalation, blocking/rejection and reporting
4. **Testing and auditing** — independent assessment of controls
5. **Training** — role-based and regular

## Screening
Firms screen customers, beneficial owners and payment parties against relevant lists, and screen transactions in real time. Screening is necessary but not sufficient: ownership and control analysis, evasion indicators and trade controls are also required.`,
          },
          {
            title: "Consequences of breaches",
            minutes: 10,
            content: `## Consequences
Breaches can result in civil penalties, criminal prosecution, loss of licences, and reputational harm. Some regimes operate on **strict liability** for civil penalties (e.g., OFAC), meaning a violation can occur without intent.

## Voluntary disclosure
Many authorities consider voluntary self-disclosure, co-operation and remediation as mitigating factors when determining penalties. Firms should have a clear process for identifying, escalating and assessing potential breaches.`,
            exercise:
              "Your firm, a UK-incorporated company, receives a US dollar payment for a customer. Which sanctions regimes could be relevant, and why?",
          },
        ],
      },
    ],
    resources: [
      {
        title: "Sanctions authority reference card",
        filename: "sanctions-authority-reference.md",
        tier: "FREE",
        content: `# Sanctions authority reference card

| Authority | Instrument | Where to check official lists |
|---|---|---|
| UN Security Council | Security Council resolutions (Chapter VII) | UN Security Council Consolidated List |
| US Treasury — OFAC | Executive orders, statutes, 31 CFR Chapter V | OFAC Sanctions List Service (SDN and non-SDN lists) |
| EU Council | CFSP Decisions and Council Regulations | EU Financial Sanctions Files / EU Sanctions Map |
| UK — FCDO / OFSI | Regulations under SAMLA 2018 | UK Sanctions List (GOV.UK) |

Always verify against official sources on the date of your decision.
`,
      },
    ],
  },
  {
    slug: "ofac-sanctions-sdn-non-sdn",
    title: "OFAC Sanctions: SDN and Non-SDN Lists",
    subtitle: "Understanding OFAC programmes, lists, licensing and reporting",
    topic: "sanctions",
    level: "INTERMEDIATE",
    minutes: 150,
    tier: "PREMIUM",
    cpd: 2.5,
    overview:
      "A detailed guide to US sanctions administered by OFAC: the SDN List, non-SDN lists, blocking versus rejecting, general and specific licences, reporting requirements, and enforcement.",
    objectives: [
      "Describe OFAC's legal authorities and programme structure",
      "Differentiate the SDN List from non-SDN lists and their consequences",
      "Distinguish blocking from rejecting and apply reporting requirements",
      "Use general and specific licences correctly",
      "Explain OFAC's enforcement approach",
    ],
    keywords: ["OFAC", "SDN", "SSI", "NS-MBS", "blocking", "rejecting", "general license"],
    related: ["ofac-50-percent-rule-ownership", "sectoral-sanctions-restrictions", "global-sanctions-fundamentals"],
    modules: [
      {
        title: "OFAC and its lists",
        lessons: [
          {
            title: "OFAC authorities and US persons",
            minutes: 12,
            content: `## Legal authorities
OFAC programmes are primarily based on presidential national emergency powers under the International Emergency Economic Powers Act (IEEPA), the Trading with the Enemy Act (TWEA), and programme-specific statutes. Regulations are codified at 31 CFR Chapter V.

## Who must comply
**US persons**: US citizens and permanent residents wherever located, entities organised under US law (including foreign branches), and anyone in the United States. Some programmes extend to foreign entities owned or controlled by US persons. Non-US persons can violate US sanctions by **causing** US persons to violate them — for example, routing US-dollar payments through US banks.

## Secondary sanctions
Certain programmes authorise sanctions against non-US persons who engage in specified activities, even without a US nexus.`,
          },
          {
            title: "The SDN List and non-SDN lists",
            minutes: 14,
            content: `## Specially Designated Nationals and Blocked Persons (SDN) List
Property and interests in property of SDNs subject to US jurisdiction are **blocked**, and US persons are generally prohibited from dealing with them. Under OFAC's 50 Percent Rule, entities owned 50% or more by blocked persons are also blocked, even if not listed.

## Non-SDN lists
OFAC also maintains lists with **narrower** restrictions — these do not automatically result in blocking. Examples include:
- **Sectoral Sanctions Identifications (SSI) List** — restrictions defined by directives
- **Non-SDN Menu-Based Sanctions (NS-MBS) List** — specific menu-based sanctions
- **Foreign Sanctions Evaders (FSE) List**
- **Non-SDN Chinese Military-Industrial Complex Companies (NS-CMIC) List** — securities-related restrictions

Always read the programme tags and the specific restrictions that apply to a listed party.`,
          },
        ],
      },
      {
        title: "Operational compliance",
        lessons: [
          {
            title: "Blocking, rejecting and reporting",
            minutes: 14,
            content: `## Blocking vs rejecting
- **Block** when property in which a blocked person has an interest comes within US jurisdiction or the possession of a US person. Funds are placed in a blocked, interest-bearing account.
- **Reject** when a transaction is prohibited but there is no blockable interest (e.g., a prohibited transaction under a comprehensive programme not involving an SDN).

## Reporting
OFAC's Reporting, Procedures and Penalties Regulations require reports of blocked property and rejected transactions within **10 business days**, and an annual report of blocked property. Record-keeping requirements apply — check the current rule for the retention period.

## Licensing
- **General licences** authorise classes of transactions for all persons meeting the conditions.
- **Specific licences** are issued to a particular applicant for a particular transaction.
Always check conditions, expiry dates and reporting obligations attached to licences.`,
          },
          {
            title: "Enforcement",
            minutes: 10,
            content: `## Enforcement Guidelines
OFAC's Economic Sanctions Enforcement Guidelines consider factors including wilfulness or recklessness, awareness, harm to programme objectives, individual characteristics, compliance programme, remedial response, co-operation and voluntary self-disclosure.

## Lessons from enforcement
Published enforcement actions frequently cite: screening gaps (e.g., incomplete lists or fuzzy-matching settings), failure to screen IP address geolocation, ignoring ownership information, and weak escalation. Reviewing enforcement actions is an excellent way to test your own programme.`,
            exercise:
              "A US bank receives a wire for a company whose name matches an entity on the SSI List. Explain why the bank should not automatically block the payment, and what it should check.",
          },
        ],
      },
    ],
  },
  {
    slug: "un-eu-uk-sanctions-regimes",
    title: "UN, EU, UK, and Other Sanctions Regimes",
    subtitle: "Comparing major regimes, their scope and how they interact",
    topic: "sanctions",
    level: "INTERMEDIATE",
    minutes: 140,
    tier: "PREMIUM",
    cpd: 2.5,
    overview:
      "Compare the UN, EU and UK sanctions frameworks — their legal bases, list management, ownership and control tests, licensing, reporting and enforcement — and understand how to manage conflicts between regimes.",
    objectives: [
      "Explain how UN sanctions are implemented by member states",
      "Describe the EU restrictive measures framework and key concepts",
      "Explain the UK regime under SAMLA and the role of OFSI",
      "Compare ownership and control thresholds across regimes",
    ],
    keywords: ["UN", "EU", "UK", "OFSI", "SAMLA", "restrictive measures", "blocking statute"],
    related: ["global-sanctions-fundamentals", "ownership-control-beneficial-ownership"],
    modules: [
      {
        title: "Regimes",
        lessons: [
          {
            title: "United Nations and European Union",
            minutes: 14,
            content: `## United Nations
Security Council sanctions committees maintain lists of designated individuals and entities. Member states are obliged to implement measures through domestic law — so the practical effect on firms is through national or regional instruments.

## European Union
EU restrictive measures are adopted by unanimity in the Council as CFSP Decisions, with economic measures implemented through Council Regulations under Article 215 TFEU. They apply within EU territory, to EU nationals and entities anywhere, and to business done in the EU.

Key EU concepts:
- **Making available** funds or economic resources, directly or indirectly, to a listed person is prohibited.
- **Ownership and control:** the EU considers entities owned more than 50% or controlled by a listed person, with Commission guidance and FAQs describing control indicators.
- **Best-efforts obligations** for EU parents regarding subsidiaries in third countries in certain regimes.
- **Blocking Statute:** prohibits compliance with specified extraterritorial third-country sanctions.`,
          },
          {
            title: "United Kingdom",
            minutes: 12,
            content: `## UK framework
The Sanctions and Anti-Money Laundering Act 2018 (SAMLA) allows the UK to make sanctions regulations. Designations are made by ministers (FCDO for most regimes); **OFSI** implements and enforces financial sanctions, issues licences, and receives reports.

Key points:
- UK persons must comply wherever they are; anyone in the UK must comply.
- Ownership and control: an entity is owned or controlled by a designated person where they hold **more than 50%** of shares or voting rights, or can ensure affairs are conducted according to their wishes.
- Reporting obligations for relevant firms who know or suspect a designated person or breach.
- OFSI can impose civil monetary penalties, and since 2022 has been able to do so on a strict civil liability basis.`,
          },
        ],
      },
      {
        title: "Managing multiple regimes",
        lessons: [
          {
            title: "Thresholds and conflicts",
            minutes: 12,
            content: `## Threshold comparison
- **OFAC:** 50% **or more**, in the aggregate, by one or more blocked persons.
- **EU and UK:** **more than** 50%, plus control tests.

An entity owned exactly 50% by a designated person may be blocked under OFAC but not automatically under EU/UK ownership tests (control may still apply).

## Conflicts
Firms operating globally often adopt a **global policy baseline** incorporating the strictest relevant requirements, subject to local legal constraints such as the EU Blocking Statute. Legal advice is essential where conflicts arise.`,
            exercise:
              "An EU-incorporated entity is 50% owned by a person designated by both OFAC and the EU. Explain the potential difference in treatment under each regime.",
          },
        ],
      },
    ],
  },
  {
    slug: "sanctions-screening-alert-investigation",
    title: "Sanctions Screening and Alert Investigation",
    subtitle: "Name screening, payment screening and disciplined alert review",
    topic: "sanctions",
    level: "BEGINNER",
    minutes: 150,
    tier: "FREE",
    cpd: 2.5,
    overview:
      "Learn how screening systems work, why fuzzy matching creates alerts, and how to investigate name-screening and payment-screening alerts consistently using secondary identifiers and documented reasoning.",
    objectives: [
      "Explain customer, payment and trade screening processes",
      "Understand fuzzy matching, thresholds and list management",
      "Investigate alerts using primary and secondary identifiers",
      "Document true-match, false-positive and escalation decisions",
    ],
    keywords: ["screening", "fuzzy matching", "false positive", "true match", "alert"],
    related: ["sanctions-false-positives-escalations", "global-sanctions-fundamentals", "sanctions-due-diligence-counterparties"],
    modules: [
      {
        title: "How screening works",
        lessons: [
          {
            title: "Screening types and fuzzy matching",
            minutes: 14,
            content: `## Screening types
- **Customer (name) screening** — at onboarding and whenever lists or customer data change
- **Payment screening** — real-time screening of payment messages (parties, banks, addresses, free-text fields)
- **Trade screening** — goods, vessels, ports and parties in trade documents

## Fuzzy matching
Names vary due to transliteration, spelling, word order, abbreviations and typos. Screening tools use algorithms (e.g., edit distance, phonetic matching, token-based comparison) to generate alerts above a similarity threshold. Lower thresholds catch more variants but create more false positives.

## List management
Firms must ensure lists are complete, current and correctly loaded — including aliases, weak AKAs, and relevant non-SDN lists. Screening effectiveness should be tested periodically with sample data.`,
          },
        ],
      },
      {
        title: "Investigating alerts",
        lessons: [
          {
            title: "Primary and secondary identifiers",
            minutes: 14,
            content: `## Review method
1. **Compare the name** — is the match exact, a variant, or partial?
2. **Compare secondary identifiers:**
   - Individuals: date of birth, nationality, place of birth, identification numbers, address
   - Entities: registration number, address, country, business type
   - Vessels: IMO number (primary identifier), flag, name history
3. **Consider context** — does the transaction or relationship make sense for the listed party?
4. **Conclude** — false positive, possible match (escalate), or true match (escalate and act).

## Documenting decisions
State which identifiers were compared and the result. "Different DOB (1978 vs 1965) and nationality (Canadian vs listed Syrian)" is a strong rationale; "not the same person" is not.`,
            exercise:
              "An alert matches customer 'Ali Hassan' (DOB 12/03/1990, UK national) to a listed 'Ali HASAN' (DOB 1962, place of birth Damascus). Write a disposition.",
          },
          {
            title: "Payment screening alerts",
            minutes: 12,
            content: `## Payment alerts
Payment screening alerts can hit on any field: ordering and beneficiary names, banks (BICs), addresses, city names and free-text remittance information.

Special considerations:
- **Geographic hits** (e.g., city names in comprehensively sanctioned regions) require location analysis
- **Vessel names** in remittance details — check IMO numbers
- **Time pressure** — payments may be held pending review; follow service levels while maintaining quality
- Never ask the payer to amend references merely to avoid screening — this can constitute evasion.`,
          },
        ],
      },
    ],
  },
  {
    slug: "ofac-50-percent-rule-ownership",
    title: "OFAC 50 Percent Rule and Ownership Analysis",
    subtitle: "Calculating aggregate and indirect ownership by blocked persons",
    topic: "sanctions",
    level: "INTERMEDIATE",
    minutes: 120,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Master OFAC's 50 Percent Rule through worked examples of direct, indirect and aggregated ownership. Learn how control differs from ownership and how EU and UK approaches compare.",
    objectives: [
      "State the OFAC 50 Percent Rule accurately",
      "Calculate indirect ownership through multiple corporate layers",
      "Aggregate holdings of multiple blocked persons",
      "Distinguish ownership from control and assess residual risk",
    ],
    keywords: ["50 percent rule", "aggregate ownership", "indirect ownership", "control", "blocked"],
    related: ["ownership-control-beneficial-ownership", "ofac-sanctions-sdn-non-sdn", "un-eu-uk-sanctions-regimes"],
    modules: [
      {
        title: "The rule",
        lessons: [
          {
            title: "Stating the 50 Percent Rule",
            minutes: 12,
            content: `## The rule
Under OFAC's guidance (revised August 2014), any entity owned in the aggregate, directly or indirectly, **50 percent or more** by one or more blocked persons is itself considered blocked — whether or not the entity is named on the SDN List.

### Key features
- **Aggregation:** holdings of different blocked persons are added together.
- **Indirect ownership:** ownership passes through entities that are themselves blocked (i.e., owned 50% or more by blocked persons).
- **Ownership, not control:** the rule is triggered by ownership. An entity **controlled** (but not 50%+ owned) by a blocked person is not automatically blocked under the rule, but OFAC cautions that such entities may be designated in future and dealings may involve a blocked person — proceed with caution.`,
          },
          {
            title: "Worked examples",
            minutes: 16,
            content: `## Example 1 — aggregation
SDN A owns 30% of Company X; SDN B owns 25%. Aggregate: **55%** → Company X is blocked.

## Example 2 — indirect ownership
SDN A owns 50% of Company Y. Company Y owns 50% of Company Z. Company Y is blocked (50%). Because Y is blocked, its 50% holding in Z counts as blocked ownership → **Z is blocked**.

## Example 3 — non-blocked intermediary
SDN A owns 40% of Company P (P is **not** blocked). P owns 100% of Company Q. OFAC's rule looks at ownership by blocked persons: P is not blocked, so P's holding in Q does not count. SDN A's indirect interest in Q is not aggregated through a non-blocked entity → Q is not blocked under the rule (though risk remains and further diligence is prudent).

## Example 4 — mixed
SDN A owns 25% of Company R directly. SDN A also owns 100% of Company S, which owns 30% of R. S is blocked; so R's blocked ownership is 25% + 30% = **55%** → R is blocked.`,
            exercise:
              "SDN C owns 60% of Alpha Ltd. Alpha Ltd owns 20% of Gamma Ltd. SDN D owns 35% of Gamma Ltd. Is Gamma Ltd blocked under the OFAC 50 Percent Rule? Show your working.",
          },
        ],
      },
      {
        title: "Practical application",
        lessons: [
          {
            title: "Data sources and documentation",
            minutes: 12,
            content: `## Obtaining ownership data
- Customer-provided ownership charts (verified)
- Corporate registries and beneficial ownership registers
- Commercial ownership data providers
- Company filings, annual reports and media

## Documenting the analysis
Record each layer, percentage, source and date; show the aggregation arithmetic; and note data gaps. Where ownership is close to 50% or data is unreliable, escalate and consider enhanced measures.

## Divestment
A blocked person's reduction below 50% must be genuine and completed; transactions to effect divestment may themselves require authorisation. Watch for transfers to family members or associates designed to evade the rule.`,
          },
        ],
      },
    ],
  },
  {
    slug: "ownership-control-beneficial-ownership",
    title: "Ownership, Control, and Beneficial Ownership",
    subtitle: "Unravelling complex structures for sanctions and AML purposes",
    topic: "sanctions",
    level: "ADVANCED",
    minutes: 150,
    tier: "PREMIUM",
    cpd: 2.5,
    overview:
      "Analyse complex corporate structures to identify beneficial owners and persons with control. Covers nominee arrangements, trusts, control indicators under EU and UK guidance, and how to document conclusions.",
    objectives: [
      "Differentiate legal ownership, beneficial ownership and control",
      "Apply EU and UK control indicators",
      "Identify nominee and proxy arrangements designed to evade sanctions",
      "Produce defensible ownership and control analyses",
    ],
    keywords: ["control", "nominee", "trust", "proxy", "beneficial owner"],
    related: ["ofac-50-percent-rule-ownership", "customer-due-diligence-kyc", "sanctions-evasion-typologies"],
    modules: [
      {
        title: "Concepts",
        lessons: [
          {
            title: "Ownership versus control",
            minutes: 14,
            content: `## Definitions
- **Legal ownership:** the registered holder of shares.
- **Beneficial ownership:** the natural person who ultimately owns or benefits.
- **Control:** the ability to direct the entity's affairs, regardless of shareholding.

## Control indicators (EU/UK guidance themes)
- Right to appoint or remove a majority of the board
- Control of a majority of voting rights through agreements
- Ability to direct use of the entity's funds or assets
- Joint and several liability for the entity's obligations
- Sharing of assets or management with a designated person

Control assessments require judgement and evidence. Document the facts relied upon.`,
          },
        ],
      },
      {
        title: "Complex structures",
        lessons: [
          {
            title: "Nominees, trusts and proxies",
            minutes: 16,
            content: `## Evasion through structures
Following designation, sanctioned persons may transfer shares to relatives, business associates or trusts while retaining practical control.

### Indicators
- Share transfers shortly before or after designation announcements
- New owners with no apparent means or expertise
- Designated person continues to represent the company publicly
- Powers of attorney or side agreements favouring the designated person
- Trusts where a designated person is settlor, protector or discretionary beneficiary

### Response
Obtain transfer documents and rationale, assess the timing and consideration paid, check governance documents, and consider whether the designated person retains control.`,
            exercise:
              "Two weeks after a businessman is designated, he transfers his 70% stake to his adult son for nominal consideration. The company's website still lists the businessman as chairman. How would you assess ownership and control?",
          },
        ],
      },
    ],
  },
  {
    slug: "sanctions-exposure-nexus-analysis",
    title: "Sanctions Exposure and Nexus Analysis",
    subtitle: "Mapping where sanctions obligations attach to a transaction",
    topic: "sanctions",
    level: "ADVANCED",
    minutes: 120,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Analyse transactions for sanctions nexus — persons, currency, goods, services and territory — and map exposure across direct, indirect and secondary risks.",
    objectives: [
      "Identify jurisdictional nexus points in a transaction",
      "Distinguish primary, secondary and facilitation risks",
      "Build an exposure map for complex deals",
    ],
    keywords: ["nexus", "exposure", "secondary sanctions", "facilitation", "US dollar"],
    related: ["un-eu-uk-sanctions-regimes", "sanctions-risk-assessment-approval"],
    modules: [
      {
        title: "Nexus",
        lessons: [
          {
            title: "Finding the nexus",
            minutes: 14,
            content: `## Nexus points
- **Persons:** nationality or incorporation of parties, employees and directors involved
- **Territory:** where activity occurs, including servers and staff
- **Currency:** clearing through a jurisdiction's financial system
- **Goods and technology:** origin and controlled content
- **Services:** financing, insurance, shipping, brokering

## Facilitation
Under some regimes (e.g., OFAC), US persons may not facilitate transactions by foreign persons that would be prohibited if performed by a US person. This affects approvals, referrals and support functions — not just the transacting entity.`,
          },
          {
            title: "Building an exposure map",
            minutes: 12,
            content: `## Exposure map
For each transaction, map parties, flows of goods, funds and services, and the regimes touched. Classify exposure as:
- **Direct:** a designated party is involved
- **Indirect:** ownership, control or agency relationships
- **Secondary:** activity that may trigger secondary sanctions
- **Reputational / policy:** allowed legally, but outside risk appetite

Summarise conclusions with required controls (e.g., licence, contractual clauses, non-USD payment, end-use certification).`,
            exercise:
              "A Singaporean company asks your UK bank to finance a cargo of machinery manufactured in Germany with US-origin components, destined for a port near a sanctioned region, payable in USD. Map the nexus points.",
          },
        ],
      },
    ],
  },
  {
    slug: "sectoral-sanctions-restrictions",
    title: "Sectoral Sanctions and Restrictions",
    subtitle: "Applying targeted restrictions on debt, equity, energy and other sectors",
    topic: "sanctions",
    level: "ADVANCED",
    minutes: 110,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Sectoral measures restrict specific activities with specific parties rather than imposing full blocking. Learn to interpret directives and regulations, apply maturity limits and manage prohibited services.",
    objectives: [
      "Explain how sectoral sanctions differ from asset freezes",
      "Interpret debt and equity restrictions and maturity tests",
      "Identify service and trade bans affecting sectors",
    ],
    keywords: ["sectoral", "SSI", "directives", "new debt", "maturity"],
    related: ["ofac-sanctions-sdn-non-sdn", "maritime-shipping-trade-sanctions"],
    modules: [
      {
        title: "Sectoral measures",
        lessons: [
          {
            title: "How sectoral sanctions work",
            minutes: 14,
            content: `## Targeted, activity-based restrictions
Sectoral sanctions prohibit specific types of dealings with listed entities in targeted sectors (e.g., financial services, energy, defence) — such as providing new debt above a certain maturity, dealing in new equity, or supporting certain energy projects. Other dealings remain permissible.

## Practical controls
- Identify affected parties (including 50%-owned subsidiaries where the rule applies)
- Classify transactions: is this new debt? Is the maturity above the limit? Is it new equity?
- Train front-office staff to recognise extended payment terms, which can constitute "debt"
- Maintain clear escalation to sanctions advisory

Always consult the current text of the relevant directive or regulation — restrictions have been amended many times.`,
          },
        ],
      },
    ],
  },
  {
    slug: "sanctions-risk-assessment-approval",
    title: "Sanctions Risk Assessment and Approval",
    subtitle: "Assessing inherent risk, controls and residual risk for decision-making",
    topic: "sanctions",
    level: "ADVANCED",
    minutes: 120,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Conduct enterprise-wide and transaction-level sanctions risk assessments and prepare approval memos that support clear, documented decisions.",
    objectives: [
      "Build a sanctions risk assessment methodology",
      "Evaluate control effectiveness and residual risk",
      "Prepare transaction approval memos with conditions",
    ],
    keywords: ["risk assessment", "approval", "residual risk", "risk appetite"],
    related: ["sanctions-exposure-nexus-analysis", "enterprise-financial-crime-risk-assessment"],
    modules: [
      {
        title: "Assessment",
        lessons: [
          {
            title: "Enterprise sanctions risk assessment",
            minutes: 14,
            content: `## Inherent risk factors
Customers and counterparties, products and services, geographies, delivery channels, currencies, and supply chains.

## Control assessment
Screening coverage and calibration, ownership analysis, escalation, training, testing and governance. Rate design and operating effectiveness separately.

## Residual risk
Residual = inherent risk mitigated by effective controls. Compare to risk appetite and define actions where residual risk exceeds appetite.`,
          },
          {
            title: "Transaction approval memos",
            minutes: 12,
            content: `## Approval memo structure
1. Transaction description and parties
2. Nexus and regimes engaged
3. Screening and ownership results
4. Risks identified (legal, secondary, reputational)
5. Mitigants and conditions (licences, contractual clauses, monitoring)
6. Recommendation and approver sign-off

Keep memos factual and dated. Re-assess if facts change before execution.`,
          },
        ],
      },
    ],
  },
  {
    slug: "sanctions-evasion-typologies",
    title: "Sanctions Evasion Typologies",
    subtitle: "How sanctioned actors attempt to access the financial system — and how to detect it",
    topic: "sanctions",
    level: "INTERMEDIATE",
    minutes: 130,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Study common evasion methods including front companies, transshipment, false documentation, maritime deceptive practices and procurement networks, using indicators published in government advisories.",
    objectives: [
      "Recognise common sanctions evasion techniques",
      "Link evasion typologies to data points available to firms",
      "Escalate evasion concerns appropriately",
    ],
    keywords: ["evasion", "front companies", "transshipment", "procurement networks"],
    related: ["maritime-shipping-trade-sanctions", "ownership-control-beneficial-ownership", "export-controls-dual-use-goods"],
    modules: [
      {
        title: "Typologies",
        lessons: [
          {
            title: "Common evasion techniques",
            minutes: 14,
            content: `## Techniques
- **Front and shell companies** in third countries acting for sanctioned parties
- **Transshipment** through intermediary jurisdictions to disguise final destination
- **False documentation** — altered bills of lading, certificates of origin or invoices
- **Name changes and new entities** created after designations
- **Use of family members and associates** as proxies
- **Procurement networks** acquiring dual-use or military goods via distributors

## Detection signals
- Newly incorporated counterparties with large orders
- Addresses shared with known evasion networks
- Goods inconsistent with the buyer's business
- Payment from third parties in unrelated jurisdictions
- Reluctance to provide end-use information`,
            exercise:
              "List five data points a bank could use to identify that a trading company might be a front for a sanctioned procurement network.",
          },
        ],
      },
    ],
  },
  {
    slug: "maritime-shipping-trade-sanctions",
    title: "Maritime, Shipping, and Trade Sanctions",
    subtitle: "Vessels, ports, deceptive shipping practices and trade controls",
    topic: "sanctions",
    level: "ADVANCED",
    minutes: 130,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Understand maritime sanctions risk: vessel identification, AIS manipulation, ship-to-ship transfers, flag hopping and price-cap regimes, as highlighted in government maritime advisories.",
    objectives: [
      "Identify vessels using IMO numbers and ownership data",
      "Recognise deceptive shipping practices",
      "Apply maritime due diligence to trade finance and payments",
    ],
    keywords: ["IMO", "AIS", "ship-to-ship", "flag hopping", "price cap", "maritime"],
    related: ["trade-based-money-laundering", "sanctions-evasion-typologies", "trade-finance-financial-crime"],
    modules: [
      {
        title: "Maritime risk",
        lessons: [
          {
            title: "Deceptive shipping practices",
            minutes: 16,
            content: `## Practices highlighted in advisories
- **AIS disablement or manipulation** — switching off or spoofing location transponders
- **Ship-to-ship (STS) transfers** to disguise cargo origin or destination
- **Falsifying cargo and vessel documents**
- **Flag hopping** — frequent re-flagging, including to fraudulent registries
- **Complex ownership and management** — single-vessel companies and frequent changes
- **Vessel name changes** while the IMO number remains constant

## Due diligence
Screen vessels by **IMO number**, check ownership, operator and manager, review flag and class history, and use AIS track data to confirm routes. Include sanctions clauses in contracts and require attestations where appropriate.`,
          },
        ],
      },
    ],
  },
  {
    slug: "sanctions-due-diligence-counterparties",
    title: "Sanctions Due Diligence on Customers and Counterparties",
    subtitle: "Risk-based sanctions checks beyond name screening",
    topic: "sanctions",
    level: "INTERMEDIATE",
    minutes: 110,
    tier: "PREMIUM",
    cpd: 2,
    overview:
      "Design and conduct sanctions due diligence on customers, suppliers and counterparties — ownership, geographic footprint, business activity and supply chains.",
    objectives: [
      "Scope sanctions due diligence by risk",
      "Identify geographic and business-activity exposure",
      "Use contractual protections and attestations",
    ],
    keywords: ["due diligence", "counterparty", "supply chain", "attestations"],
    related: ["sanctions-screening-alert-investigation", "ownership-control-beneficial-ownership"],
    modules: [
      {
        title: "Due diligence",
        lessons: [
          {
            title: "Scoping sanctions due diligence",
            minutes: 14,
            content: `## Beyond screening
Screening only finds names on lists. Due diligence asks:
- Who owns and controls the counterparty?
- Where does it operate, sell and source from?
- Does it deal with sanctioned jurisdictions or sectors?
- Are its goods or services subject to trade controls?

## Proportionality
Low-risk domestic counterparties may need only screening. Higher-risk counterparties (e.g., exposure to high-risk jurisdictions, controlled goods) require questionnaires, ownership verification, open-source research and contractual protections such as sanctions warranties and termination rights.`,
          },
        ],
      },
    ],
  },
  {
    slug: "sanctions-case-studies-investigations",
    title: "Sanctions Case Studies and Practical Investigations",
    subtitle: "Applying sanctions analysis to realistic, fictional scenarios",
    topic: "sanctions",
    level: "ADVANCED",
    minutes: 140,
    tier: "PREMIUM",
    cpd: 2.5,
    format: "BLENDED",
    overview:
      "Work through fictional, anonymised scenarios involving ownership analysis, screening alerts, trade transactions and evasion indicators. Practise documenting conclusions and recommendations.",
    objectives: [
      "Apply a structured sanctions investigation method",
      "Integrate ownership, nexus and evasion analysis",
      "Write clear recommendations for decision-makers",
    ],
    keywords: ["case study", "investigation", "practical"],
    related: ["ofac-50-percent-rule-ownership", "sanctions-evasion-typologies", "sanctions-screening-alert-investigation"],
    modules: [
      {
        title: "Investigation method",
        lessons: [
          {
            title: "A structured sanctions investigation",
            minutes: 14,
            content: `## Method
1. **Define the question** — e.g., "Is this payment permissible?"
2. **Gather facts** — parties, ownership, goods, routes, currency, documents
3. **Screen and research** — lists, ownership data, adverse media, vessel data
4. **Analyse** — nexus, ownership thresholds, control, evasion indicators
5. **Conclude** — permissible, prohibited, or requires licence/further information
6. **Recommend and document** — actions, reporting, and decision rationale

All case studies in this course are **fictional training scenarios**. Names and details are invented and do not refer to real persons or entities.`,
          },
          {
            title: "Practice scenario: the equipment distributor",
            minutes: 16,
            type: "EXERCISE",
            content: `## Scenario (fictional)
Northwind Components FZE, incorporated 8 months ago in a free-trade zone, orders precision CNC machine parts from your corporate customer. Payment is to come from a different company in a third country. The end user is stated as "a local agricultural cooperative". Northwind's director previously worked for a company designated for supplying a sanctioned defence manufacturer.

## Questions to consider
- What additional information would you request?
- Which red flags are present?
- Which regimes and controls might be engaged (sanctions and export controls)?
- What would you recommend pending further information?`,
            exercise:
              "Write a five-bullet recommendation to your sanctions committee for the Northwind scenario.",
          },
        ],
      },
    ],
  },
  {
    slug: "sanctions-false-positives-escalations",
    title: "Sanctions Screening False Positives and Escalations",
    subtitle: "Reducing noise without increasing risk",
    topic: "sanctions",
    level: "INTERMEDIATE",
    minutes: 100,
    tier: "PREMIUM",
    cpd: 1.5,
    overview:
      "Understand the causes of false positives, how to manage them safely (good-guy lists, tuning, data quality), and how to escalate genuine concerns effectively.",
    objectives: [
      "Identify root causes of false positives",
      "Apply safe false-positive reduction techniques",
      "Escalate possible matches with complete information",
    ],
    keywords: ["false positives", "good guy list", "tuning", "escalation"],
    related: ["sanctions-screening-alert-investigation"],
    modules: [
      {
        title: "Managing false positives",
        lessons: [
          {
            title: "Causes and safe reduction",
            minutes: 14,
            content: `## Root causes
- Common names and short tokens
- Poor customer data quality (missing DOB, country)
- Over-broad list content (weak aliases)
- Low matching thresholds or no use of secondary identifiers

## Safe reduction techniques
- **Improve data quality** at source
- **Secondary identifier matching** (DOB, country) in rules — tested and approved
- **Good-guy / whitelists** — documented, periodically reviewed, and re-screened when lists change
- **Threshold tuning** supported by testing and governance

## Escalation
Escalate with: the alert details, identifiers compared, research performed, and why a match cannot be excluded. Never release a payment on a possible true match without appropriate approval.`,
          },
        ],
      },
    ],
  },
];
