export const legalContent = {
  companyName: "PortTrip",
  legalEntityName: "PortTrip",
  developerName: "PortTrip",
  websiteUrl: "https://porttrip.com",
  supportEmail: "support@porttrip.com",
  privacyEmail: "privacy@porttrip.com",
  effectiveDate: "March 26, 2026",
  jurisdictions: "United States and other jurisdictions where our users are located",
  thirdParties: [
    {
      name: "OpenAI",
      purpose: "AI itinerary and assistant responses",
      link: "https://openai.com/policies/privacy-policy",
    },
    {
      name: "Tavily",
      purpose: "Web research enrichment for travel answers",
      link: "https://tavily.com/privacy",
    },
    {
      name: "Stripe",
      purpose: "Payment processing and billing operations",
      link: "https://stripe.com/privacy",
    },
  ],
} as const;

export const privacySections = {
  whoWeAre:
    "PortTrip provides cruise-focused planning tools, itinerary generation, and account features for travelers. PortTrip is the data controller for personal data you provide to use our services.",
  dataCollected: [
    "Identity and account data (for example: full name, email, account identifiers, and authentication metadata).",
    "Planner and content data (for example: itinerary inputs, generated plans, and related interactions).",
    "Transaction and billing metadata from payment processing providers (for example: plan status, payment event IDs, and billing lifecycle information).",
    "Customer support and communication records.",
    "Technical and usage data (for example: log events, browser/device details, and security telemetry).",
  ],
  howWeUseData: [
    "To provide and operate account, planning, and support services.",
    "To protect users, enforce terms, prevent abuse, and maintain platform security.",
    "To process subscriptions, invoicing, and payment-related operations.",
    "To improve product quality, reliability, and user experience.",
    "To comply with legal obligations and respond to lawful requests.",
  ],
  legalBases: [
    {
      basis: "Contract performance",
      details:
        "Processing required to provide requested services, including account access, itinerary generation, and core app functionality.",
    },
    {
      basis: "Legitimate interests",
      details:
        "Security monitoring, fraud prevention, product improvement, and service reliability where these interests are not overridden by your rights.",
    },
    {
      basis: "Consent",
      details:
        "Where required by law, such as specific communications or optional processing, and you may withdraw consent at any time.",
    },
    {
      basis: "Legal obligation",
      details:
        "Retention or disclosure required by tax, accounting, consumer protection, anti-fraud, or other legal requirements.",
    },
  ],
  retention:
    "We retain personal data only as long as needed for the purposes in this policy, including operational, contractual, legal, tax, accounting, and dispute-resolution requirements. We then delete or de-identify data where feasible.",
  deletion:
    "You may request deletion from our public deletion URL. We verify identity before deletion. Certain records may be retained when required for legal, security, anti-fraud, or accounting reasons.",
  userRights: [
    "Right of access to your personal data.",
    "Right to rectify inaccurate or incomplete personal data.",
    "Right to erasure (right to be forgotten), subject to legal exceptions.",
    "Right to restrict processing in certain circumstances.",
    "Right to data portability for data processed by automated means on legal bases that support portability.",
    "Right to object to certain processing, including processing based on legitimate interests.",
    "Right to withdraw consent where processing is based on consent.",
    "Right to lodge a complaint with your local supervisory authority.",
  ],
  security:
    "We use administrative, technical, and organizational safeguards intended to protect personal data, including access controls and secure handling practices. No system can guarantee absolute security.",
  children:
    "PortTrip is not directed to children under 13 (or the higher age required in your jurisdiction), and we do not knowingly collect personal data from children.",
  transfers:
    "Personal data may be processed in countries outside your country of residence. Where required, we implement transfer safeguards such as contractual measures and service-provider protections.",
  automatedDecisionMaking:
    "PortTrip may use automated systems to generate recommendations, but we do not use solely automated decision-making that produces legal or similarly significant effects without meaningful human oversight.",
} as const;

export const deleteAccountContent = {
  intro:
    "Use this public web page to request deletion of your PortTrip account and associated personal data. App access is not required.",
  whoCanRequest:
    "The account owner, or an authorized representative acting on the owner’s behalf, may submit a deletion request.",
  whatGetsDeleted: [
    "Account profile and authentication records.",
    "Saved itineraries and user-generated planning content associated with the account.",
    "Support records linked to the account where deletion is legally permitted.",
  ],
  whatMayBeRetained:
    "We may retain limited records required for legal compliance, fraud/security prevention, dispute resolution, and accounting/tax obligations.",
  timeline:
    "After identity verification, we generally process deletion requests within 30 days, subject to legal exceptions or high request volume.",
  identity:
    "To protect users and prevent unauthorized deletion, we may request additional verification details before processing a request.",
} as const;
