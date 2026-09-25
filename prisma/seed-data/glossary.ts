export interface SeedTerm {
  term: string;
  topic: string;
  definition: string;
  example?: string;
  related?: string[];
  source?: string;
  url?: string;
}

const FATF = "https://www.fatf-gafi.org/";
const OFAC = "https://ofac.treasury.gov/";

export const GLOSSARY: SeedTerm[] = [
  { term: "Adverse media", topic: "kyc-cdd", definition: "Negative information from public sources linking a person or entity to financial crime, misconduct or other risk-relevant activity.", example: "A news report that a prospective client's company was investigated for bribery.", related: ["Enhanced due diligence", "Customer risk rating"] },
  { term: "Aggregation (sanctions)", topic: "sanctions", definition: "Adding together ownership interests held by multiple blocked persons when applying OFAC's 50 Percent Rule.", example: "Two SDNs holding 30% and 25% aggregate to 55%.", related: ["OFAC 50 Percent Rule"], source: "OFAC guidance (2014)", url: OFAC },
  { term: "Authorised push payment (APP) fraud", topic: "fraud", definition: "Fraud where a victim is deceived into authorising a payment to an account controlled by the fraudster.", example: "A 'safe account' impersonation scam.", related: ["Social engineering", "Money mule"] },
  { term: "Beneficial owner", topic: "kyc-cdd", definition: "The natural person(s) who ultimately own or control a customer and/or the natural person on whose behalf a transaction is conducted.", example: "An individual who owns 60% of a company through two holding companies.", related: ["Customer due diligence", "Senior managing official"], source: "FATF Glossary", url: FATF },
  { term: "Blocking", topic: "sanctions", definition: "Under US sanctions, freezing property and interests in property of a blocked person that come within US jurisdiction or the possession or control of a US person.", example: "Placing funds from an SDN payment into a blocked, interest-bearing account.", related: ["Rejecting", "SDN List"], url: OFAC },
  { term: "Catch-all control", topic: "export-controls", definition: "An export licence requirement for items not on a control list when the exporter knows or is informed they may be intended for WMD or certain military end uses.", related: ["Dual-use item"] },
  { term: "Correspondent banking", topic: "aml-ctf", definition: "The provision of banking services by one bank (the correspondent) to another (the respondent).", example: "A US bank providing USD clearing to a bank in another country.", related: ["Nested account", "Payable-through account"], source: "FATF Recommendation 13", url: FATF },
  { term: "Customer due diligence (CDD)", topic: "kyc-cdd", definition: "Measures to identify and verify customers and beneficial owners, understand the purpose and nature of the relationship, and conduct ongoing monitoring.", related: ["Enhanced due diligence", "Beneficial owner"], source: "FATF Recommendation 10", url: FATF },
  { term: "Dual-use item", topic: "export-controls", definition: "Goods, software or technology that can be used for both civil and military purposes.", example: "Certain high-performance machine tools.", related: ["Catch-all control"] },
  { term: "Enhanced due diligence (EDD)", topic: "kyc-cdd", definition: "Additional due diligence measures applied to higher-risk customers or situations.", example: "Senior approval and corroboration of source of wealth for a foreign PEP.", related: ["Source of wealth", "Politically exposed person"] },
  { term: "Facilitation payment", topic: "abc", definition: "A small unofficial payment made to expedite a routine, non-discretionary government action.", example: "A cash payment to speed up customs clearance.", related: ["Bribery"] },
  { term: "Financial Intelligence Unit (FIU)", topic: "aml-ctf", definition: "A national centre for receiving and analysing suspicious transaction reports and disseminating the results.", related: ["Suspicious activity report"], source: "FATF Recommendation 29", url: FATF },
  { term: "Front company", topic: "aml-ctf", definition: "A company conducting some genuine business that is used to disguise illicit activity or funds.", related: ["Shell company"] },
  { term: "General licence", topic: "sanctions", definition: "An authorisation permitting a class of otherwise prohibited transactions for all persons meeting its terms.", related: ["Specific licence"] },
  { term: "Integration", topic: "aml-ctf", definition: "The final stage of money laundering, in which laundered funds are reintroduced into the legitimate economy.", related: ["Placement", "Layering"] },
  { term: "Layering", topic: "aml-ctf", definition: "The stage of money laundering that separates proceeds from their source through complex transactions.", related: ["Placement", "Integration"] },
  { term: "Money mule", topic: "fraud", definition: "A person who transfers or allows use of their account to move criminal proceeds, knowingly or unknowingly.", related: ["APP fraud"] },
  { term: "Nested account", topic: "aml-ctf", definition: "Use of a correspondent account by a respondent's own bank customers, giving them indirect access to the correspondent.", related: ["Correspondent banking"] },
  { term: "OFAC 50 Percent Rule", topic: "sanctions", definition: "OFAC guidance that entities owned 50% or more in the aggregate, directly or indirectly, by blocked persons are themselves blocked.", related: ["Aggregation (sanctions)", "Blocking"], source: "OFAC Revised Guidance (Aug. 13, 2014)", url: OFAC },
  { term: "Placement", topic: "aml-ctf", definition: "The first stage of money laundering, introducing criminal proceeds into the financial system.", related: ["Structuring"] },
  { term: "Politically exposed person (PEP)", topic: "abc", definition: "An individual entrusted with a prominent public function, and their family members and close associates.", related: ["Enhanced due diligence"], source: "FATF Recommendation 12", url: FATF },
  { term: "Proliferation financing", topic: "sanctions", definition: "Providing funds or financial services for the manufacture, acquisition, development or transfer of weapons of mass destruction and related materials.", source: "FATF", url: FATF },
  { term: "Rejecting", topic: "sanctions", definition: "Declining to process a prohibited transaction in which there is no blockable property interest.", related: ["Blocking"], url: OFAC },
  { term: "Risk-based approach", topic: "governance", definition: "Identifying, assessing and understanding risks and applying mitigating measures commensurate with those risks.", source: "FATF Recommendation 1", url: FATF },
  { term: "SDN List", topic: "sanctions", definition: "OFAC's Specially Designated Nationals and Blocked Persons List.", related: ["Blocking"], url: OFAC },
  { term: "Shell company", topic: "aml-ctf", definition: "A company with no significant operations or assets, which may be misused to hide ownership or move funds.", related: ["Front company"] },
  { term: "Source of funds", topic: "kyc-cdd", definition: "The origin of the particular funds or assets involved in a relationship or transaction.", related: ["Source of wealth"] },
  { term: "Source of wealth", topic: "kyc-cdd", definition: "The origin of a customer's total wealth or net worth.", related: ["Source of funds", "Enhanced due diligence"] },
  { term: "Structuring", topic: "aml-ctf", definition: "Breaking transactions into smaller amounts to avoid reporting thresholds or scrutiny.", related: ["Placement"] },
  { term: "Suspicious activity report", topic: "investigations", definition: "A report submitted to the FIU when a firm knows or suspects that activity may involve money laundering, terrorist financing or other crime.", related: ["Tipping off"] },
  { term: "Tipping off", topic: "investigations", definition: "Disclosing to a person that a suspicious activity report has been made or an investigation is being carried out, where this may prejudice it.", related: ["Suspicious activity report"] },
  { term: "Trade-based money laundering", topic: "trade-based", definition: "Disguising criminal proceeds and moving value through trade transactions to legitimise their illicit origin.", related: ["Over-invoicing"], source: "FATF", url: FATF },
  { term: "Over-invoicing", topic: "trade-based", definition: "Invoicing goods or services above their fair value to transfer value to the seller.", related: ["Trade-based money laundering"] },
  { term: "Travel rule", topic: "crypto", definition: "Requirement for originator and beneficiary information to accompany wire and virtual asset transfers.", source: "FATF Recommendation 16", url: FATF },
  { term: "Virtual asset service provider (VASP)", topic: "crypto", definition: "A business that conducts exchange, transfer, safekeeping or administration of virtual assets for or on behalf of others.", source: "FATF Glossary", url: FATF },
  { term: "Three lines model", topic: "governance", definition: "A governance model distinguishing risk-owning operations (first line), oversight functions (second line) and independent assurance (third line).", related: ["Risk-based approach"] },
];
