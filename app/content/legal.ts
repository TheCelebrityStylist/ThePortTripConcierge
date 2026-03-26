export const legalContent = {
  companyName: "PortTrip",
  developerName: "PortTrip",
  websiteUrl: "https://porttrip.com",
  supportEmail: "support@porttrip.com",
  privacyEmail: "privacy@porttrip.com",
  dpoEmail: "privacy@porttrip.com",
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
    "PortTrip provides cruise-focused planning tools, itinerary generation, and account features for travelers. We act as the controller for personal information you provide directly to us through our app and website.",
  dataCollected: [
    "Account details such as name, email address, and account identifiers.",
    "Planner inputs and generated itinerary content needed to provide app functionality.",
    "Support and communications data when you contact us.",
    "Billing metadata from our payment provider (for example, subscription status and payment events).",
    "Technical and device data such as log records, browser information, and security telemetry.",
  ],
  howWeUseData: [
    "To create, maintain, and improve your cruise plans and app experience.",
    "To operate account authentication, saved itineraries, and security controls.",
    "To process subscriptions and prevent fraud or abuse.",
    "To provide customer support and respond to requests.",
    "To comply with legal obligations and enforce our terms.",
  ],
  legalBases:
    "Where applicable, we rely on one or more legal bases: your consent, performance of a contract (providing our services), legitimate interests (service reliability, fraud prevention, product improvement), and compliance with legal obligations.",
  retention:
    "We retain personal information only for as long as needed for the purposes described in this policy, including operational, contractual, tax, accounting, and legal requirements. Retention periods may vary by data category and jurisdiction.",
  deletion:
    "You can request account deletion from our public deletion page. After verification, we delete or de-identify data unless retention is required for legal, security, fraud prevention, or accounting reasons.",
  userRights:
    "Depending on your location, you may have rights to access, correct, delete, or restrict processing of your data, and to object to certain processing or request data portability.",
  security:
    "We use administrative, technical, and organizational safeguards designed to protect personal information. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.",
  children:
    "PortTrip is not directed to children under 13 (or higher age where required by local law), and we do not knowingly collect personal data from children.",
  transfers:
    "Your information may be processed in countries other than your own. When required, we use appropriate safeguards for international transfers.",
} as const;

export const deleteAccountContent = {
  intro:
    "Use this page to request deletion of your PortTrip account and associated personal data. This page is publicly accessible and does not require in-app access.",
  whoCanRequest:
    "The account owner, or an authorized representative acting on the owner’s behalf, may submit a deletion request.",
  whatGetsDeleted: [
    "Account profile and authentication records.",
    "Saved itineraries and user-generated planning content associated with the account.",
    "Support records linked to the account where deletion is permitted.",
  ],
  whatMayBeRetained:
    "We may retain limited records required for legal compliance, fraud/security prevention, dispute resolution, and accounting/tax obligations.",
  timeline:
    "After identity verification, we generally process deletion requests within 30 days, subject to legal exceptions or high request volume.",
  identity:
    "To protect users, we may request additional verification details before deleting an account.",
} as const;
