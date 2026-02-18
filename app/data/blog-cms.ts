export type DockingType = "Dock" | "Tender" | "Both";

export type TravelerType =
  | "first-time"
  | "family"
  | "mobility"
  | "budget"
  | "luxury";

export type BlogSection = {
  id: string;
  heading: string;
  shortIntro: string;
  bullets: string[];
  steps: string[];
  checklist: string[];
  ifRunningLateRule: string;
  faqRefs?: string[];
};

export type BlogFaq = { q: string; a: string };

export type InternalLink = {
  title: string;
  href: string;
  anchorText: string;
};

export type PlannerCta = {
  label: string;
  href: string;
  prefillPort?: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  portName: string;
  country: string;
  region: string;
  timeInPort: string;
  dockingType: DockingType;
  travelerTypes: TravelerType[];
  toc: { id: string; label: string }[];
  sections: BlogSection[];
  faq: BlogFaq[];
  internalLinks: InternalLink[];
  plannerCta: PlannerCta;
  updatedAt: string;
};

const posts: BlogPost[] = [
  {
    slug: "barcelona-cruise-port-day-plan",
    title: "Barcelona cruise port day plan: Gothic lanes without missing all aboard",
    subtitle:
      "How to move from terminal to old town fast, avoid Ramblas bottlenecks, and return with a smart buffer.",
    excerpt:
      "A practical Barcelona strategy for 6–8 hour calls with transport options, crowd timing, and what to skip when time is tight.",
    metaTitle: "Barcelona Cruise Port Guide (Docked): Fast City Plan + Return Buffer",
    metaDescription:
      "Plan a Barcelona port day with terminal transport options, crowd-aware routing, budget tips, accessibility notes, and a reliable return-to-ship buffer.",
    keywords: ["Barcelona cruise port", "Las Ramblas", "Montjuic", "return to ship buffer"],
    portName: "Barcelona",
    country: "Spain",
    region: "Mediterranean",
    timeInPort: "6–8 hours",
    dockingType: "Dock",
    travelerTypes: ["first-time", "family", "budget", "mobility"],
    toc: [
      { id: "time-window", label: "Set your real city time" },
      { id: "terminal-city", label: "Terminal to city transport" },
      { id: "route-order", label: "Best crowd-smart route order" },
      { id: "budget-access", label: "Budget and accessibility" },
      { id: "tight-time", label: "What to skip when time is tight" }
    ],
    sections: [
      {
        id: "time-window",
        heading: "Set your real city time before picking attractions",
        shortIntro:
          "Barcelona looks close on the map, but traffic at Moll Adossat can remove a full hour if you guess instead of timing.",
        bullets: [
          "Count 20–35 minutes from gangway to first transport, longer when multiple ships dock.",
          "Target a hard city cut-off at least 90 minutes before all-aboard.",
          "Assume security and final shuttle queues on the way back can spike late afternoon."
        ],
        steps: [
          "Check your all-aboard, not sail-away, as your final deadline.",
          "Subtract 90 minutes for return and 30 minutes for uncertainty.",
          "Build your sightseeing block only in the remaining middle window."
        ],
        checklist: [
          "All-aboard screenshot saved offline",
          "Port gate location pinned in maps",
          "One backup taxi rank noted"
        ],
        ifRunningLateRule:
          "If you are still in the Gothic Quarter 2 hours before all-aboard, end sightseeing immediately and go straight to the shuttle or taxi."
      },
      {
        id: "terminal-city",
        heading: "Terminal → city transport: choose by queue risk, not by headline price",
        shortIntro:
          "The cheapest option is not always the fastest when ships unload together.",
        bullets: [
          "Cruise shuttle to Columbus: predictable and simple for first-timers.",
          "Taxi: best for families or limited mobility when queues are moderate.",
          "Port bus + metro: works for budget travelers comfortable with transfers."
        ],
        steps: [
          "Scan queue lengths before committing; switch modes if a line exceeds 20 minutes.",
          "For metro users, buy tickets once and avoid re-queuing later.",
          "Keep return fare and route decided before you start walking La Rambla."
        ],
        checklist: [
          "Transport mode selected before disembark",
          "Return mode preselected",
          "Cash/card backup for taxi"
        ],
        ifRunningLateRule:
          "If shuttle lines exceed 25 minutes on return, move immediately to taxi and split fare if needed."
      },
      {
        id: "route-order",
        heading: "Best order for lower crowds: old city first, viewpoints second",
        shortIntro:
          "Most visitors do the reverse and get stuck in midday congestion.",
        bullets: [
          "Start in Barri Gòtic before tour groups fully spread out.",
          "Move to Boqueria or lunch before peak line times.",
          "Finish with a short Montjuïc viewpoint if your clock is healthy."
        ],
        steps: [
          "Arrive city center and walk a compact Gothic route.",
          "Pause for early lunch around 11:30–12:00 to beat crowds.",
          "Only add Montjuïc if you can still begin return 90+ minutes before all-aboard."
        ],
        checklist: [
          "No more than two major stops",
          "Walking distance under 6 km total",
          "Return trigger alarm set"
        ],
        ifRunningLateRule:
          "Skip Montjuïc entirely once your return buffer drops under 100 minutes."
      },
      {
        id: "budget-access",
        heading: "Budget snapshot and accessibility reality",
        shortIntro:
          "Barcelona can be done affordably, but old paving and crowd density matter for comfort.",
        bullets: [
          "Budget pair: shuttle/metro + fixed lunch menu keeps costs predictable.",
          "Mobility: prioritize flatter waterfront and larger avenues over narrow medieval lanes.",
          "Family: identify toilets and shaded pauses around Port Vell and Plaça Reial."
        ],
        steps: [
          "Set a per-person cap before leaving the terminal.",
          "Pre-mark one accessible café stop with seating.",
          "Use ride-hail/taxi for uphill legs rather than forcing long walks."
        ],
        checklist: [
          "Water and sun protection",
          "Kid snack buffer",
          "Step-light route alternatives"
        ],
        ifRunningLateRule:
          "Drop shopping detours first; they create the biggest time drift for the least trip value."
      },
      {
        id: "tight-time",
        heading: "What to skip when your port call is only 4–5 usable hours",
        shortIntro:
          "Trying to combine Sagrada Família, Park Güell, and Gothic Quarter is the classic miss-your-ship plan.",
        bullets: [
          "Pick one icon + one neighborhood, not three headline sites.",
          "Skip cross-city hops unless tickets and transport are locked.",
          "Avoid long sit-down lunch if queues are active."
        ],
        steps: [
          "Choose either Gothic + waterfront or Sagrada exterior + nearby meal.",
          "Cap each activity with a strict end time.",
          "Start return earlier than feels necessary."
        ],
        checklist: [
          "Two-stop max rule applied",
          "No speculative detours",
          "Return mode open in map app"
        ],
        ifRunningLateRule:
          "When undecided between one more stop and returning, always return."
      }
    ],
    faq: [
      {
        q: "Can I walk from Barcelona terminal to the Gothic Quarter?",
        a: "From Moll Adossat it is usually too far and exposed for most cruise schedules; shuttle or taxi saves energy and protects your return buffer."
      },
      {
        q: "How much buffer is enough in Barcelona?",
        a: "Ninety minutes is a practical minimum in normal conditions; use 120 minutes on heavy traffic days or if multiple ships are docked."
      }
    ],
    internalLinks: [
      { title: "Civitavecchia plan", href: "/blog/rome-from-civitavecchia-without-stress", anchorText: "compare long-transfer strategy" },
      { title: "Palma old-town timing", href: "/blog/palma-de-mallorca-port-day-guide", anchorText: "see a short-transfer Mediterranean stop" }
    ],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Barcelona" },
    updatedAt: "2026-02-10"
  },
  {
    slug: "rome-from-civitavecchia-without-stress",
    title: "Rome from Civitavecchia without stress: what actually fits in one port day",
    subtitle: "Long transfer port math, rail vs private driver tradeoffs, and hard cutoffs to avoid panic.",
    excerpt: "A realistic Rome-in-a-day framework for cruise passengers docking in Civitavecchia.",
    metaTitle: "Rome from Civitavecchia Cruise Guide: Rail, Driver, and Safe Return",
    metaDescription: "Use this Civitavecchia-to-Rome plan to choose transport, protect your return window, and prioritize high-value stops.",
    keywords: ["Civitavecchia", "Rome cruise day", "train to Rome", "ship return safety"],
    portName: "Civitavecchia (Rome)",
    country: "Italy",
    region: "Mediterranean",
    timeInPort: "8–10 hours",
    dockingType: "Dock",
    travelerTypes: ["first-time", "family", "budget", "luxury"],
    toc: [
      { id: "transfer-reality", label: "Transfer reality check" },
      { id: "rail-vs-car", label: "Train vs private car" },
      { id: "rome-order", label: "Efficient Rome order" },
      { id: "scam-avoidance", label: "Common scams and mistakes" },
      { id: "trim-plan", label: "What to cut first" }
    ],
    sections: [
      {
        id: "transfer-reality",
        heading: "Transfer reality: Rome is not a quick hop",
        shortIntro: "The city is achievable, but only if you plan around a long out-and-back transport day.",
        bullets: [
          "Expect roughly 75–90 minutes each direction after terminal egress.",
          "Station/meeting-point navigation can add hidden delay.",
          "Your sightseeing window may be only 4–5 hours in practice."
        ],
        steps: [
          "Decide your latest possible departure from Rome before you arrive.",
          "Use one central zone plan rather than cross-city zigzags.",
          "Keep one no-excuses fallback route to Civitavecchia."
        ],
        checklist: ["Ticket strategy picked", "Fallback departure time set", "Meeting points pinned"],
        ifRunningLateRule: "If you miss your planned outbound or inbound leg, skip all nonessential stops and execute fallback immediately."
      },
      {
        id: "rail-vs-car",
        heading: "Train vs private driver: pick by failure tolerance",
        shortIntro: "Cost and convenience matter, but reliability under pressure matters more.",
        bullets: [
          "Regional rail is cost-efficient but requires confidence with platforms and timing.",
          "Private transfer costs more but reduces navigation friction.",
          "Families and mobility travelers often gain trip quality from door-to-door options."
        ],
        steps: [
          "Budget travelers: pre-check station transfer details and buy early where possible.",
          "Premium travelers: confirm driver contact and pickup buffer in writing.",
          "Everyone: predefine your return trigger time."
        ],
        checklist: ["Phone battery pack", "Offline train/route data", "Port return alarm"],
        ifRunningLateRule: "If your planned return train is uncertain, switch to a reserved car immediately rather than waiting for the next departure."
      },
      {
        id: "rome-order",
        heading: "Best order in Rome: cluster tightly",
        shortIntro: "Trying to conquer Rome in one call creates transit waste and line fatigue.",
        bullets: [
          "Choose one of two clusters: Ancient Rome area or Vatican area.",
          "Add one food stop near your chosen cluster.",
          "Avoid cross-town transfers during midday peaks."
        ],
        steps: [
          "Arrive and begin with highest-priority sight immediately.",
          "Use nearby secondary stops only if queue times stay acceptable.",
          "Depart Rome on your pre-set hard cutoff, not on " +
            "" +
            "how much you still want to see."
        ],
        checklist: ["Single cluster selected", "Lunch near cluster", "Return cutoff respected"],
        ifRunningLateRule: "Cancel interior museum visits first; they carry the highest queue uncertainty."
      },
      {
        id: "scam-avoidance",
        heading: "Scam and hassle avoidance around major monuments",
        shortIntro: "Most issues are small but time-consuming, which is costly on cruise schedules.",
        bullets: [
          "Ignore bracelet and petition distractions near tourist corridors.",
          "Confirm taxi meter/start fare before moving.",
          "Use official ticket channels; avoid street 'priority pass' sellers."
        ],
        steps: [
          "Keep valuables zipped and close in crowded transit zones.",
          "Politely decline unsolicited help at ticket machines.",
          "Recheck return details after every major stop."
        ],
        checklist: ["Anti-pickpocket setup", "Official payments only", "Trusted meeting points"],
        ifRunningLateRule: "Do not negotiate with unverified guides when time is short; keep moving toward confirmed transport."
      },
      {
        id: "trim-plan",
        heading: "What to skip first when time collapses",
        shortIntro: "The fastest way to protect the day is cutting low-yield extras early.",
        bullets: [
          "Drop shopping streets before landmark goals.",
          "Skip second major district transfer.",
          "Move from sit-down lunch to quick counter meal."
        ],
        steps: [
          "At midpoint, compare actual time vs plan.",
          "Cut one entire block if you are 30+ minutes behind.",
          "Leave Rome earlier than the minimum required."
        ],
        checklist: ["Midday time audit", "One block removed if behind", "Early return chosen"],
        ifRunningLateRule: "Once you are behind schedule, your only priority is guaranteed ship return."
      }
    ],
    faq: [
      { q: "Is Rome worth it from Civitavecchia on a short call?", a: "Yes on longer calls, but only with strict scope and a firm return cutoff." },
      { q: "How early should I leave Rome to return?", a: "Aim to start the return 3 hours before all-aboard; 3.5 hours on complex days." }
    ],
    internalLinks: [
      { title: "Barcelona short-port strategy", href: "/blog/barcelona-cruise-port-day-plan", anchorText: "compare with a closer city port" },
      { title: "Naples split-day planning", href: "/blog/naples-port-day-pompeii-vs-city", anchorText: "see another high-temptation Italy stop" }
    ],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Civitavecchia" },
    updatedAt: "2026-02-11"
  },
  {
    slug: "naples-port-day-pompeii-vs-city",
    title: "Naples port day: Pompeii or city center when your clock is unforgiving",
    subtitle: "Decide quickly between archaeology and urban food culture with a safe return plan.",
    excerpt: "A Naples decision framework for choosing Pompeii or central Naples without gambling on ship return.",
    metaTitle: "Naples Cruise Port Guide: Pompeii vs Naples City + Return Rules",
    metaDescription: "Choose the right Naples port-day plan by time window, crowd timing, transport friction, and family or mobility needs.",
    keywords: ["Naples cruise", "Pompeii from port", "Napoli transport", "Italy port planning"],
    portName: "Naples",
    country: "Italy",
    region: "Mediterranean",
    timeInPort: "6–8 hours",
    dockingType: "Dock",
    travelerTypes: ["first-time", "family", "mobility", "budget"],
    toc: [
      { id: "decision", label: "Pompeii vs city decision" },
      { id: "transport", label: "Terminal transport" },
      { id: "crowd", label: "Crowd timing" },
      { id: "budget", label: "Budget snapshot" },
      { id: "late", label: "Running-late rules" }
    ],
    sections: [
      {
        id: "decision",
        heading: "Pick one headline objective: Pompeii depth or Naples flavor",
        shortIntro: "This port punishes indecision because each extra transfer compounds risk.",
        bullets: ["Pompeii gives high historical value but consumes transit time.", "Naples center gives lower transit risk and flexible pacing.", "Families with younger kids usually enjoy city food streets and waterfront more."],
        steps: ["Set a single primary objective before disembarkation.", "Define one optional secondary stop only if ahead of schedule.", "Share the plan with your group to reduce spontaneous detours."],
        checklist: ["Primary objective selected", "Secondary stop optional", "Return alarm set"],
        ifRunningLateRule: "If your first segment runs 25 minutes late, drop the secondary objective immediately."
      },
      {
        id: "transport",
        heading: "Terminal to city/Pompeii transport with minimal friction",
        shortIntro: "Naples has workable options, but transfer complexity varies by destination.",
        bullets: ["For central Naples, taxi can be efficient for groups.", "For Pompeii, rail works if you are comfortable with station changes.", "Pre-booked transport reduces stress for mobility travelers."],
        steps: ["Check current queue conditions and pivot quickly.", "Keep exact return stop confirmed when you arrive.", "Carry small change/card for fast ticket handling."],
        checklist: ["Outbound and inbound modes chosen", "Return stop pinned", "Payment backup ready"],
        ifRunningLateRule: "Switch to the simplest direct mode back to port once delay appears."
      },
      {
        id: "crowd",
        heading: "Crowd timing: beat lines by moving earlier than tour buses",
        shortIntro: "Naples demand spikes quickly around late morning.",
        bullets: ["Begin your top site early.", "Eat before peak lunch queues.", "Avoid changing neighborhoods at peak traffic times."],
        steps: ["Start with highest-value stop.", "Use a fixed meal window.", "Begin return before terminal surge starts."],
        checklist: ["Priority stop complete early", "Lunch before rush", "Return pre-rush"],
        ifRunningLateRule: "Skip any attraction with visible long queue; continue with open-access experiences only."
      },
      {
        id: "budget",
        heading: "Budget, family comfort, and accessibility notes",
        shortIntro: "A successful Naples day is as much about pacing as price.",
        bullets: ["Budget travelers can keep costs low with focused neighborhoods and simple meals.", "Mobility travelers should prioritize flatter routes and direct transport.", "Families should pre-plan restroom and snack intervals."],
        steps: ["Set spending cap by category.", "Choose one seated break with shade.", "Limit walking mileage to preserve return energy."],
        checklist: ["Cost cap set", "Rest stop selected", "Walking limit defined"],
        ifRunningLateRule: "Cut shopping first; preserve core experience and return certainty."
      },
      {
        id: "late",
        heading: "What to skip if time is tight",
        shortIntro: "Cutting early keeps the day enjoyable and safe.",
        bullets: ["Skip museum interiors unless entry is guaranteed.", "Avoid adding a second distant district.", "Drop long sit-down dining."],
        steps: ["Run a time check at midpoint.", "Remove one full block if behind.", "Return with no further additions."],
        checklist: ["Midpoint check done", "One block removed", "Direct return active"],
        ifRunningLateRule: "No new stops after your return trigger time under any circumstance."
      }
    ],
    faq: [
      { q: "Can I do Pompeii and Naples old town in one day?", a: "Only on longer calls with strict timing; most travelers should choose one focus." },
      { q: "Is Naples walkable from the terminal?", a: "Central areas are reachable, but distance and street conditions vary by route and comfort level." }
    ],
    internalLinks: [
      { title: "Rome long-transfer guide", href: "/blog/rome-from-civitavecchia-without-stress", anchorText: "read another Italy transfer-heavy port" },
      { title: "Marseille city-first strategy", href: "/blog/marseille-port-to-provence-day-plan", anchorText: "see how to handle French port logistics" }
    ],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Naples" },
    updatedAt: "2026-02-11"
  },
  {
    slug: "palma-de-mallorca-port-day-guide",
    title: "Palma de Mallorca port day guide: old town flow for short calls",
    subtitle: "Use Palma’s compact layout to see more with less transit risk.",
    excerpt: "A focused Palma plan with terminal transport options, crowd timing, and family-friendly pacing.",
    metaTitle: "Palma de Mallorca Cruise Guide: Fast Old Town Plan + Return Buffer",
    metaDescription: "Plan Palma efficiently from the cruise terminal with route order, budgeting, and return-to-ship safeguards.",
    keywords: ["Palma cruise port", "Mallorca old town", "Mediterranean cruise planning"],
    portName: "Palma de Mallorca",
    country: "Spain",
    region: "Mediterranean",
    timeInPort: "4–6 hours",
    dockingType: "Dock",
    travelerTypes: ["first-time", "family", "budget", "luxury"],
    toc: [
      { id: "usable", label: "Usable city time" },
      { id: "city-access", label: "Getting into town" },
      { id: "order", label: "Best visit order" },
      { id: "family", label: "Family & mobility notes" },
      { id: "skip", label: "Skip list for tight calls" }
    ],
    sections: [
      {
        id: "usable",
        heading: "Palma feels easy—still calculate your usable window",
        shortIntro: "Short calls can disappear quickly if you assume immediate city access.",
        bullets: ["Disembark + transfer can consume 30–50 minutes.", "Build 75–90 minutes return margin.", "Compact routing is your competitive advantage here."],
        steps: ["Subtract fixed buffers first.", "Cap to two highlights plus one meal.", "Set an absolute return trigger."],
        checklist: ["Buffer locked", "Two-highlight cap", "Return trigger active"],
        ifRunningLateRule: "Drop the second highlight and head back after the first core stop."
      },
      {
        id: "city-access",
        heading: "Terminal → old town: choose lowest-friction option",
        shortIntro: "Palma options are straightforward, but line length can still hurt short itineraries.",
        bullets: ["Taxi is often time-efficient for groups.", "Shuttle/public bus supports budget plans.", "Walking from some berths may be impractical in heat."],
        steps: ["Inspect queue and switch quickly.", "Keep inbound and outbound options paired.", "Mark your return pickup point early."],
        checklist: ["Mode chosen", "Backup mode ready", "Pickup point saved"],
        ifRunningLateRule: "Take the first reliable return mode; do not wait for ideal pricing."
      },
      {
        id: "order",
        heading: "Best order: cathedral zone early, lanes later",
        shortIntro: "The area around La Seu gets crowded quickly.",
        bullets: ["Start near cathedral exteriors and waterfront views.", "Move into old lanes for cafés and smaller shops.", "Finish close to your outbound pickup point."],
        steps: ["Arrive, complete scenic photos first.", "Transition to nearby old-town streets.", "Begin return before late-afternoon surge."],
        checklist: ["Cathedral zone done early", "Low-transfer route", "Return on time"],
        ifRunningLateRule: "Skip indoor queue attractions and keep to open-air route segments."
      },
      {
        id: "family",
        heading: "Budget, family rhythm, and mobility comfort",
        shortIntro: "Palma rewards steady pacing over aggressive checklists.",
        bullets: ["Family success depends on shade and snack cadence.", "Mobility travelers should avoid uneven side streets when crowded.", "Budget travelers can keep costs low with set-menu lunches."],
        steps: ["Schedule one seated break in shade.", "Use flatter lanes for transitions.", "Pre-price key purchases to avoid overspending."],
        checklist: ["Rest stop selected", "Shade path mapped", "Budget cap visible"],
        ifRunningLateRule: "Abandon retail browsing first; keep comfort and return timing intact."
      },
      {
        id: "skip",
        heading: "What to skip when call length shrinks",
        shortIntro: "Overloading Palma creates the same stress as larger ports.",
        bullets: ["Skip beach transfer unless conditions are perfect.", "Avoid museum interiors without timed entry.", "Don’t stack neighborhoods far apart."],
        steps: ["Choose one core area.", "Delete nonessential transfer legs.", "Return with spare buffer."],
        checklist: ["One area focus", "No extra transfers", "Buffer preserved"],
        ifRunningLateRule: "When in doubt, start return and treat extra time at port-side as bonus."
      }
    ],
    faq: [
      { q: "Is Palma good for first-time cruisers?", a: "Yes, it is manageable and compact when you keep your stop count realistic." },
      { q: "Can I add a beach and old town?", a: "Usually not on shorter calls unless traffic and queues are unusually light." }
    ],
    internalLinks: [
      { title: "Barcelona plan", href: "/blog/barcelona-cruise-port-day-plan", anchorText: "read another Spain port strategy" },
      { title: "Santorini tender timing", href: "/blog/santorini-tender-port-day-survival-guide", anchorText: "see how tender ports change timing" }
    ],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Palma de Mallorca" },
    updatedAt: "2026-02-09"
  },
  {
    slug: "marseille-port-to-provence-day-plan",
    title: "Marseille port-to-Provence day plan with realistic cutoffs",
    subtitle: "How to choose Marseille city or a short Provence hop without return stress.",
    excerpt: "A practical Marseille strategy for transport friction, crowd timing, and safe reboarding.",
    metaTitle: "Marseille Cruise Guide: City vs Provence with Return Buffer",
    metaDescription: "Use this Marseille guide to choose the right radius for your port time and return safely.",
    keywords: ["Marseille cruise", "Provence from port", "France port day"],
    portName: "Marseille",
    country: "France",
    region: "Mediterranean",
    timeInPort: "6–8 hours",
    dockingType: "Dock",
    travelerTypes: ["first-time", "budget", "family"],
    toc: [{ id: "radius", label: "Travel radius" }, { id: "transport", label: "Transport choices" }, { id: "crowd", label: "Crowd timing" }],
    sections: [
      { id: "radius", heading: "Set your radius before disembarking", shortIntro: "Marseille can fill a full day; extra distance increases return risk.", bullets: ["City-first works best on shorter calls.", "Provence hop only if transit is smooth.", "Use one optional add-on, not two."], steps: ["Calculate usable hours.", "Pick city-only or one extension.", "Set firm return trigger."], checklist: ["Radius picked", "Return trigger set", "Backup route noted"], ifRunningLateRule: "Cancel out-of-city segment after any early delay." },
      { id: "transport", heading: "Terminal to city transport by friction level", shortIntro: "Choose lowest waiting time, not just cheapest fare.", bullets: ["Taxi simplifies family logistics.", "Shuttle/bus can save budget.", "Pre-booking helps mobility travelers."], steps: ["Check queue lengths.", "Commit quickly.", "Pre-pin return pickup."], checklist: ["Outbound selected", "Inbound selected", "Pickup pinned"], ifRunningLateRule: "Switch to direct taxi return if lines grow." },
      { id: "crowd", heading: "Crowd timing and what to skip", shortIntro: "Midday crush reduces value of long queue stops.", bullets: ["Do top viewpoint first.", "Eat before peak lunch lines.", "Skip museum interiors if late."], steps: ["Start with must-see.", "Limit transfers.", "Return before rush."], checklist: ["Must-see complete", "No extra transfers", "Early return"], ifRunningLateRule: "Drop all optional stops once return window opens." }
    ],
    faq: [{ q: "Should I choose Aix or Marseille center?", a: "On moderate calls, Marseille center gives better control and less transfer risk." }],
    internalLinks: [{ title: "Naples choices", href: "/blog/naples-port-day-pompeii-vs-city", anchorText: "see another decision-heavy port" }, { title: "Barcelona flow", href: "/blog/barcelona-cruise-port-day-plan", anchorText: "compare with Spain timing" }],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Marseille" },
    updatedAt: "2026-02-12"
  },
  {
    slug: "santorini-tender-port-day-survival-guide",
    title: "Santorini tender port survival guide for cruise passengers",
    subtitle: "Queue-aware timing for Fira, Oia decisions, and guaranteed tender return.",
    excerpt: "Tender logistics change everything in Santorini—this guide keeps your day safe and high value.",
    metaTitle: "Santorini Tender Cruise Guide: Fira/Oia Timing + Safe Return",
    metaDescription: "Plan Santorini tender days with cable-car strategy, crowd timing, and robust return-to-ship margins.",
    keywords: ["Santorini tender", "Fira cable car", "cruise tender timing"],
    portName: "Santorini",
    country: "Greece",
    region: "Mediterranean",
    timeInPort: "6–8 hours",
    dockingType: "Tender",
    travelerTypes: ["first-time", "family", "mobility"],
    toc: [{ id: "tender", label: "Tender reality" }, { id: "ascent", label: "Ascent options" }, { id: "return", label: "Return protection" }],
    sections: [
      { id: "tender", heading: "Tender ports reduce usable sightseeing time", shortIntro: "Both outbound and inbound tender waits must be budgeted.", bullets: ["Queues vary by ship volume.", "Weather can slow operations.", "Plan with extra margin."], steps: ["Reserve earliest tender possible.", "Subtract both-way tender time.", "Use strict return trigger."], checklist: ["Tender slot planned", "Weather checked", "Extra buffer set"], ifRunningLateRule: "If first tender is delayed, keep itinerary in one zone only." },
      { id: "ascent", heading: "Fira ascent options: pick for your group, not hype", shortIntro: "Comfort and queue reliability should drive your choice.", bullets: ["Cable car can bottleneck.", "Steep paths are not ideal for all travelers.", "Alternative transfer options can reduce stress."], steps: ["Inspect line length.", "Choose safest mode.", "Predefine descent plan."], checklist: ["Ascent mode", "Descent mode", "Mobility fit"], ifRunningLateRule: "Skip Oia transfer if ascent takes too long." },
      { id: "return", heading: "Return-to-ship buffer for Santorini", shortIntro: "Tender reboarding requires earlier commitment than dock ports.", bullets: ["Use roughly two-hour margin.", "Expect afternoon queue spikes.", "Treat early queueing as a win."], steps: ["Start descent early.", "Join tender line with margin.", "Avoid last-minute shopping."], checklist: ["2-hour margin", "Queue supplies", "No late detours"], ifRunningLateRule: "Go directly to tender queue; no additional stops." }
    ],
    faq: [{ q: "Can I do both Fira and Oia on a short call?", a: "Only if transfers are smooth; many travelers should choose one focus area." }],
    internalLinks: [{ title: "Mykonos balance", href: "/blog/mykonos-cruise-port-town-beach-balance", anchorText: "compare Greek island pacing" }, { title: "Palma short calls", href: "/blog/palma-de-mallorca-port-day-guide", anchorText: "see compact-port timing" }],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Santorini" },
    updatedAt: "2026-02-13"
  },
  {
    slug: "mykonos-cruise-port-town-beach-balance",
    title: "Mykonos cruise day: town or beach without wasting transfer time",
    subtitle: "A practical split-day strategy for dock and tender scenarios.",
    excerpt: "Plan Mykonos with smart sequencing, scam avoidance, and return buffer discipline.",
    metaTitle: "Mykonos Cruise Port Guide: Town vs Beach + Return Rules",
    metaDescription: "Use this Mykonos guide to decide town/beach priorities, manage transport queues, and return safely.",
    keywords: ["Mykonos cruise", "Mykonos town", "Mykonos beach transfer"],
    portName: "Mykonos",
    country: "Greece",
    region: "Mediterranean",
    timeInPort: "6–8 hours",
    dockingType: "Both",
    travelerTypes: ["first-time", "family", "budget", "luxury"],
    toc: [{ id: "docking", label: "Dock vs tender impact" }, { id: "sequence", label: "Best sequence" }, { id: "safety", label: "Safety and scams" }],
    sections: [
      { id: "docking", heading: "Docking type changes your transport plan", shortIntro: "Mykonos can be smooth or chaotic depending on arrival pattern.", bullets: ["Tender adds queue uncertainty.", "Dock access can speed outbound moves.", "Return traffic grows late afternoon."], steps: ["Confirm berth/tender status.", "Pick first destination accordingly.", "Lock return mode."], checklist: ["Arrival mode confirmed", "Return mode set", "Buffer alarm on"], ifRunningLateRule: "Cancel beach leg if transfer lines exceed expected window." },
      { id: "sequence", heading: "Town-first or beach-first?", shortIntro: "Choose based on crowd behavior, not preference alone.", bullets: ["Town early is calmer for photos.", "Beach later may mean fuller roads.", "Families often do better with one anchor zone."], steps: ["Complete must-see stop first.", "Add one contrast stop only.", "Return before transport spike."], checklist: ["Must-see done", "Single add-on", "Early return"], ifRunningLateRule: "Drop second zone and stay near return corridor." },
      { id: "safety", heading: "Scam avoidance and practical street safety", shortIntro: "Common issues are avoidable with simple habits.", bullets: ["Use official taxis/transport desks.", "Confirm prices before private transfers.", "Protect valuables in packed lanes."], steps: ["Verify provider identity.", "Keep cards/cash split.", "Monitor time at every transition."], checklist: ["Official transport", "Secure valuables", "Time checks"], ifRunningLateRule: "Do not negotiate with unverified drivers when behind schedule." }
    ],
    faq: [{ q: "Can I fit Little Venice and a beach?", a: "Yes on longer calls with low queue times, but keep strict return boundaries." }],
    internalLinks: [{ title: "Santorini tender guide", href: "/blog/santorini-tender-port-day-survival-guide", anchorText: "read a tender-heavy island strategy" }, { title: "Dubrovnik old town flow", href: "/blog/dubrovnik-cruise-port-old-town-strategy", anchorText: "compare walled-city crowd tactics" }],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Mykonos" },
    updatedAt: "2026-02-13"
  },
  {
    slug: "dubrovnik-cruise-port-old-town-strategy",
    title: "Dubrovnik cruise port old-town strategy without wall-walk regret",
    subtitle: "How to time Pile Gate, walls, and return transport when ships stack up.",
    excerpt: "A Dubrovnik plan for crowd-aware routing, budget control, and safe return timing.",
    metaTitle: "Dubrovnik Cruise Guide: Old Town Timing + Ship Return Buffer",
    metaDescription: "Navigate Dubrovnik cruise days with smart gate timing, transport choices, and what to skip under time pressure.",
    keywords: ["Dubrovnik cruise", "Old Town walls", "Pile Gate timing"],
    portName: "Dubrovnik",
    country: "Croatia",
    region: "Adriatic",
    timeInPort: "6–8 hours",
    dockingType: "Dock",
    travelerTypes: ["first-time", "family", "budget", "mobility"],
    toc: [{ id: "gates", label: "Gate timing" }, { id: "transport", label: "Port transport" }, { id: "skip", label: "Skip list" }],
    sections: [
      { id: "gates", heading: "Enter Old Town before the wave", shortIntro: "Pile Gate congestion can consume precious hours.", bullets: ["Arrive early for calmer lanes.", "Wall walks are weather and queue sensitive.", "Use one major historic block."], steps: ["Start with highest-priority old town objective.", "Add walls only if queue is manageable.", "Leave with strict time cap."], checklist: ["Early entry", "Queue threshold", "Time cap"], ifRunningLateRule: "Skip walls and keep a ground-level old-town loop only." },
      { id: "transport", heading: "Terminal to old town transport options", shortIntro: "Short urban transfers still need backup planning.", bullets: ["Bus is budget-friendly.", "Taxi saves time for groups.", "Return queues can spike late."], steps: ["Pick outbound mode by queue length.", "Pin return stop immediately.", "Carry fare backup."], checklist: ["Mode selected", "Return stop pinned", "Fare backup"], ifRunningLateRule: "Switch to taxi return if bus wait threatens your buffer." },
      { id: "skip", heading: "What to skip if heat or queues rise", shortIntro: "Protect energy and return confidence.", bullets: ["Skip extra viewpoints requiring long climbs.", "Skip shopping alleys during peak crowding.", "Skip second district transfers."], steps: ["Run midday energy check.", "Cut one optional block.", "Return with margin."], checklist: ["Energy check", "Optional cut", "Margin protected"], ifRunningLateRule: "End sightseeing when your buffer hits 90 minutes." }
    ],
    faq: [{ q: "Is wall walking worth it on a short call?", a: "Only with early start and manageable lines; otherwise focus on old-town lanes and viewpoints." }],
    internalLinks: [{ title: "Kotor tender guide", href: "/blog/kotor-bay-tender-port-day-planning", anchorText: "see another Adriatic old-town stop" }, { title: "Mykonos queue strategy", href: "/blog/mykonos-cruise-port-town-beach-balance", anchorText: "compare island crowd flow" }],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Dubrovnik" },
    updatedAt: "2026-02-14"
  },
  {
    slug: "kotor-bay-tender-port-day-planning",
    title: "Kotor Bay tender port day planning for maximum old-town value",
    subtitle: "Tender timing, bay traffic realities, and how to avoid staircase overreach.",
    excerpt: "A Kotor strategy for tender efficiency, old-town pacing, and return certainty.",
    metaTitle: "Kotor Cruise Tender Guide: Bay Timing + Safe Return",
    metaDescription: "Plan a Kotor tender day with old-town priorities, transport realities, and practical cutoff rules.",
    keywords: ["Kotor tender", "Kotor old town", "Adriatic cruise planning"],
    portName: "Kotor",
    country: "Montenegro",
    region: "Adriatic",
    timeInPort: "4–6 hours",
    dockingType: "Tender",
    travelerTypes: ["first-time", "budget", "mobility"],
    toc: [{ id: "tender", label: "Tender planning" }, { id: "oldtown", label: "Old town pacing" }, { id: "late", label: "Late rules" }],
    sections: [
      { id: "tender", heading: "Tender timing is the core constraint", shortIntro: "Short Kotor calls need strict queue strategy.", bullets: ["Outbound delay shrinks all options.", "Inbound queue can surge abruptly.", "Use wider return margin than expected."], steps: ["Aim for early tender.", "Subtract tender time both ways.", "Set no-flex return trigger."], checklist: ["Early slot", "Two-way tender budget", "Hard trigger"], ifRunningLateRule: "Reduce plan to old town core loop only." },
      { id: "oldtown", heading: "Old town first, climbs only if conditions fit", shortIntro: "Stair climbs can consume time and energy quickly.", bullets: ["Ground-level heritage route gives strong value.", "Climb segments are weather and fitness dependent.", "Families should prioritize shaded breaks."], steps: ["Complete compact old-town circuit.", "Assess heat and time before any climb.", "Exit toward tender queue early."], checklist: ["Core circuit done", "Heat checked", "Early queue approach"], ifRunningLateRule: "Skip fortress climb once return margin falls below two hours." },
      { id: "late", heading: "What to skip when schedule tightens", shortIntro: "Discipline beats ambitious checklists in Kotor.", bullets: ["Skip climb-heavy add-ons.", "Skip distant bay transfers.", "Skip long seated meals."], steps: ["Trim one block at midpoint.", "Focus on nearby highlights.", "Join tender queue earlier."], checklist: ["Midpoint trim", "Nearby-only mode", "Queue priority"], ifRunningLateRule: "Any doubt means immediate return to tender area." }
    ],
    faq: [{ q: "Can I do Perast and Kotor old town on a short call?", a: "Usually too ambitious for 4–6 hours once tender timing is included." }],
    internalLinks: [{ title: "Dubrovnik old-town plan", href: "/blog/dubrovnik-cruise-port-old-town-strategy", anchorText: "compare nearby Adriatic logic" }, { title: "Santorini tender timing", href: "/blog/santorini-tender-port-day-survival-guide", anchorText: "see another tender-heavy day" }],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Kotor" },
    updatedAt: "2026-02-14"
  },
  {
    slug: "cozumel-cruise-port-beach-ruins-choice",
    title: "Cozumel cruise port: beach day or ruins without losing your return window",
    subtitle: "Decide quickly between low-friction island fun and mainland archaeology logistics.",
    excerpt: "A Cozumel day plan balancing beach convenience, excursion risk, and family comfort.",
    metaTitle: "Cozumel Cruise Guide: Beach vs Ruins + Return Safety",
    metaDescription: "Plan Cozumel cruise days with realistic timing for beach clubs, ferry-linked ruins, and return-to-ship buffers.",
    keywords: ["Cozumel cruise", "Cozumel beach club", "Mayan ruins from cruise"],
    portName: "Cozumel",
    country: "Mexico",
    region: "Caribbean",
    timeInPort: "6–8 hours",
    dockingType: "Dock",
    travelerTypes: ["family", "budget", "first-time", "luxury"],
    toc: [{ id: "choice", label: "Beach vs ruins" }, { id: "transport", label: "Transport and taxi" }, { id: "safety", label: "Safety and scams" }],
    sections: [
      { id: "choice", heading: "Beach vs ruins: choose based on transfer complexity", shortIntro: "Mainland ruins involve multiple legs and less flexibility.", bullets: ["Beach clubs provide highest schedule control.", "Ruins can be rewarding but add ferry/road dependencies.", "Families usually prefer one stable base."], steps: ["Pick one primary format.", "Reject mixed plans unless very long call.", "Anchor return around most fragile leg."], checklist: ["Primary format set", "Mixed plan avoided", "Fragile leg identified"], ifRunningLateRule: "If any leg slips, revert to island-based activities only." },
      { id: "transport", heading: "Terminal transport: official services only", shortIntro: "Simple transport choices reduce scam risk and delays.", bullets: ["Use authorized taxi zones.", "Confirm destination and fare expectation.", "Keep driver details for return if useful."], steps: ["Use marked stands.", "Confirm route before departure.", "Prearrange return pickup time."], checklist: ["Authorized taxi", "Route confirmed", "Return time set"], ifRunningLateRule: "Take first verified taxi back; do not wait for better bargain." },
      { id: "safety", heading: "Scam avoidance and budgeting", shortIntro: "Most issues are avoidable with transaction discipline.", bullets: ["Avoid unsolicited tour offers outside official zones.", "Use card where possible and monitor exchange rates.", "Keep valuables minimal at beach venues."], steps: ["Set daily budget cap.", "Pay through official counters.", "Track time hourly."], checklist: ["Budget cap", "Official payments", "Hourly time checks"], ifRunningLateRule: "Stop shopping negotiations and head directly to port corridor." }
    ],
    faq: [{ q: "Is a mainland ruins tour risky on standard calls?", a: "It can be, due to multi-step transport; choose only with generous time and reliable operators." }],
    internalLinks: [{ title: "Nassau short-day strategy", href: "/blog/nassau-port-day-beach-vs-city-guide", anchorText: "see a lower-friction Caribbean stop" }, { title: "San Juan old-town plan", href: "/blog/san-juan-cruise-port-old-san-juan-day-plan", anchorText: "compare city-focused Caribbean planning" }],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Cozumel" },
    updatedAt: "2026-02-15"
  },
  {
    slug: "nassau-port-day-beach-vs-city-guide",
    title: "Nassau port day guide: beach vs city with family-first timing",
    subtitle: "How to avoid transport waste and keep a smooth return from busy Caribbean piers.",
    excerpt: "A Nassau approach for first-timers balancing beach comfort, city highlights, and return reliability.",
    metaTitle: "Nassau Cruise Port Guide: Beach or City + Safe Return",
    metaDescription: "Plan Nassau by choosing one anchor experience, reducing transfer waste, and protecting your ship-return margin.",
    keywords: ["Nassau cruise port", "Nassau beach day", "Bahamas cruise tips"],
    portName: "Nassau",
    country: "Bahamas",
    region: "Caribbean",
    timeInPort: "4–6 hours",
    dockingType: "Dock",
    travelerTypes: ["family", "first-time", "budget"],
    toc: [{ id: "anchor", label: "Choose an anchor" }, { id: "transport", label: "Local transport" }, { id: "tight", label: "Tight-time cuts" }],
    sections: [
      { id: "anchor", heading: "Choose one anchor experience", shortIntro: "Short Nassau calls reward focus over variety.", bullets: ["Beach-only day is low friction.", "City walk works for culture-focused travelers.", "Combining both can be rushed."], steps: ["Set one anchor objective.", "Add one nearby secondary stop.", "Fix return trigger early."], checklist: ["Anchor chosen", "Secondary nearby", "Return trigger"], ifRunningLateRule: "Drop secondary stop and return directly." },
      { id: "transport", heading: "Transport, pricing, and street confidence", shortIntro: "Keep logistics simple to protect your day.", bullets: ["Use recognized taxi hubs.", "Confirm fare expectations before departure.", "Avoid long negotiations for small savings."], steps: ["Choose official provider.", "Clarify destination and return plan.", "Save pickup details."], checklist: ["Official provider", "Fare clarified", "Pickup saved"], ifRunningLateRule: "Accept first reliable transport back to port." },
      { id: "tight", heading: "What to skip if the clock shrinks", shortIntro: "Nassau can still be enjoyable with early cuts.", bullets: ["Skip far beaches on heavy traffic days.", "Skip long retail detours.", "Skip large meal waits."], steps: ["Check midpoint timing.", "Cut one full segment.", "Return with comfort margin."], checklist: ["Midpoint check", "Segment cut", "Comfort margin"], ifRunningLateRule: "Prioritize shaded direct return route." }
    ],
    faq: [{ q: "Is Nassau walkable from port?", a: "Many central areas are, but heat and crowd levels can reduce comfort on tight schedules." }],
    internalLinks: [{ title: "Cozumel choice framework", href: "/blog/cozumel-cruise-port-beach-ruins-choice", anchorText: "compare Caribbean beach decision logic" }, { title: "San Juan old-city plan", href: "/blog/san-juan-cruise-port-old-san-juan-day-plan", anchorText: "read another walkable Caribbean city" }],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Nassau" },
    updatedAt: "2026-02-15"
  },
  {
    slug: "san-juan-cruise-port-old-san-juan-day-plan",
    title: "San Juan cruise port day plan: Old San Juan done right",
    subtitle: "A walk-first itinerary with heat management, fort timing, and return discipline.",
    excerpt: "Plan Old San Juan with minimal transfer friction, smart fort sequencing, and family-friendly pacing.",
    metaTitle: "San Juan Cruise Guide: Old San Juan Route + Return Buffer",
    metaDescription: "Get a practical San Juan port-day strategy with fort order, budget notes, accessibility tips, and ship-safe return timing.",
    keywords: ["San Juan cruise", "Old San Juan", "Caribbean port day"],
    portName: "San Juan",
    country: "Puerto Rico",
    region: "Caribbean",
    timeInPort: "6–8 hours",
    dockingType: "Dock",
    travelerTypes: ["first-time", "family", "budget", "mobility"],
    toc: [{ id: "walk", label: "Walkability and heat" }, { id: "forts", label: "Fort sequencing" }, { id: "budget", label: "Budget and safety" }],
    sections: [
      { id: "walk", heading: "Old San Juan is walkable but heat-sensitive", shortIntro: "Terrain and weather can slow plans faster than expected.", bullets: ["Morning hours are best for uphill segments.", "Hydration and shade stops are essential.", "Mobility travelers should use short taxi assists."], steps: ["Start early in core zone.", "Schedule fixed hydration stops.", "Use flatter return route."], checklist: ["Heat plan", "Shade breaks", "Taxi backup"], ifRunningLateRule: "Cut uphill segments first and move toward port corridor." },
      { id: "forts", heading: "Fort order for lower queue friction", shortIntro: "Doing both major forts can work only with strict pacing.", bullets: ["Pick one interior visit as priority.", "Use exteriors for second fort when short on time.", "Keep lunch near your active zone."], steps: ["Complete priority fort early.", "Add second fort only if ahead.", "Begin return before late heat peak."], checklist: ["Priority fort done", "Second fort conditional", "Return early"], ifRunningLateRule: "Skip second fort interior and keep to scenic exterior pass." },
      { id: "budget", heading: "Budget snapshot and city safety habits", shortIntro: "San Juan is straightforward with basic caution and pre-set spending.", bullets: ["Use posted-price venues.", "Keep valuables minimal and secure.", "Avoid overcommitting to shopping streets."], steps: ["Set meal and souvenir caps.", "Use trusted payment methods.", "Track time each hour."], checklist: ["Spending caps", "Secure valuables", "Hourly checks"], ifRunningLateRule: "End shopping immediately once buffer narrows." }
    ],
    faq: [{ q: "Can I do two forts and a full food tour?", a: "Usually too much for one call unless your port hours are very generous and queues are light." }],
    internalLinks: [{ title: "Nassau focus planning", href: "/blog/nassau-port-day-beach-vs-city-guide", anchorText: "compare short-call Caribbean tactics" }, { title: "Lisbon city pacing", href: "/blog/lisbon-cruise-port-day-tram-hills-plan", anchorText: "see another hilly old-city strategy" }],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "San Juan" },
    updatedAt: "2026-02-15"
  },
  {
    slug: "lisbon-cruise-port-day-tram-hills-plan",
    title: "Lisbon cruise port day: tram-and-hills plan that avoids fatigue",
    subtitle: "Use Lisbon’s terrain to your advantage with sequence, transit, and cutoff discipline.",
    excerpt: "A Lisbon route strategy for first-time cruisers balancing viewpoints, trams, and return certainty.",
    metaTitle: "Lisbon Cruise Guide: Hills, Trams, and Ship-Safe Return",
    metaDescription: "Plan Lisbon port days with practical hill management, tram tactics, budget notes, and conservative return buffers.",
    keywords: ["Lisbon cruise", "Lisbon tram", "Portugal port day"],
    portName: "Lisbon",
    country: "Portugal",
    region: "Atlantic Europe",
    timeInPort: "6–8 hours",
    dockingType: "Dock",
    travelerTypes: ["first-time", "mobility", "budget", "family"],
    toc: [{ id: "terrain", label: "Terrain strategy" }, { id: "transport", label: "Tram and taxi choices" }, { id: "cut", label: "Tight-time cuts" }],
    sections: [
      { id: "terrain", heading: "Manage hills with top-down sequencing", shortIntro: "Lisbon rewards smart directional planning.", bullets: ["Start higher when possible and walk down.", "Avoid repeated steep climbs.", "Heat amplifies fatigue."], steps: ["Pick one hill district.", "Use lift/tram to reach top segment.", "Descend toward return corridor."], checklist: ["One district focus", "Ascent support", "Downhill finish"], ifRunningLateRule: "Drop second hill district and stay in current zone." },
      { id: "transport", heading: "Tram, metro, or taxi: choose by line pressure", shortIntro: "Iconic tram lines can waste time when packed.", bullets: ["Use trams selectively, not as sightseeing queue events.", "Taxi can save mobility and family energy.", "Metro supports budget hops where terrain allows."], steps: ["Check visible wait time.", "Switch modes fast if crowded.", "Keep return mode preselected."], checklist: ["Mode flexibility", "Wait threshold", "Return selected"], ifRunningLateRule: "Skip tram waits and use direct taxi/metro return." },
      { id: "cut", heading: "What to skip when Lisbon runs long", shortIntro: "Cut transfer-heavy add-ons before core viewpoints.", bullets: ["Skip second museum interior.", "Skip distant neighborhood transfer.", "Skip long seated meal queues."], steps: ["Audit timing at midday.", "Remove one full transfer leg.", "Start return early."], checklist: ["Midday audit", "Transfer removed", "Early return"], ifRunningLateRule: "No new hill climbs after return trigger." }
    ],
    faq: [{ q: "Is Lisbon good for mobility-limited travelers?", a: "Yes with selective taxi support and flatter route choices between key stops." }],
    internalLinks: [{ title: "San Juan hill pacing", href: "/blog/san-juan-cruise-port-old-san-juan-day-plan", anchorText: "compare another terrain-sensitive city" }, { title: "Barcelona old-town flow", href: "/blog/barcelona-cruise-port-day-plan", anchorText: "read a flatter city-center strategy" }],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Lisbon" },
    updatedAt: "2026-02-15"
  },
  {
    slug: "istanbul-cruise-port-old-city-connection-plan",
    title: "Istanbul cruise port to Old City: connection plan for high-traffic days",
    subtitle: "A transfer-focused approach for bazaars, mosques, and reliable ship return.",
    excerpt: "Navigate Istanbul with realistic transit expectations, crowd timing, and conservative cutoffs.",
    metaTitle: "Istanbul Cruise Guide: Old City Timing + Return Safety",
    metaDescription: "Plan an Istanbul port day with practical transport choices, crowd-aware sequencing, and return-to-ship buffer rules.",
    keywords: ["Istanbul cruise", "Old City Istanbul", "Galataport to Sultanahmet"],
    portName: "Istanbul",
    country: "Türkiye",
    region: "Eastern Mediterranean",
    timeInPort: "8–10 hours",
    dockingType: "Dock",
    travelerTypes: ["first-time", "family", "budget", "mobility"],
    toc: [{ id: "transfer", label: "Transfer realism" }, { id: "sequence", label: "Site sequence" }, { id: "safety", label: "Safety and scams" }],
    sections: [
      { id: "transfer", heading: "Transfer realism across a busy city", shortIntro: "Istanbul distances and congestion punish optimistic timing.", bullets: ["Build generous transit assumptions.", "Choose one heritage cluster.", "Keep fallback route to port."], steps: ["Select primary district.", "Set hard depart time.", "Store fallback navigation."], checklist: ["District selected", "Depart time set", "Fallback stored"], ifRunningLateRule: "Skip all optional bazaar detours and return directly." },
      { id: "sequence", heading: "Sequence by proximity, not bucket-list length", shortIntro: "Dense historic zones can still consume hours in queues.", bullets: ["Prioritize one must-see interior.", "Use exteriors for secondary landmarks.", "Take meal near current cluster."], steps: ["Do primary site first.", "Limit to walkable adjacent stops.", "Head back on cutoff."], checklist: ["Primary done", "Adjacent-only route", "Cutoff respected"], ifRunningLateRule: "Cancel additional interior visits once behind schedule." },
      { id: "safety", heading: "Scam avoidance and transaction confidence", shortIntro: "Tourist zones are lively; simple guardrails keep the day smooth.", bullets: ["Use official taxis/transport apps.", "Confirm prices before private services.", "Keep valuables secure in crowded corridors."], steps: ["Verify provider.", "Use official payment channels.", "Run hourly time checks."], checklist: ["Provider verified", "Payment channel trusted", "Time checks active"], ifRunningLateRule: "Avoid bargaining stops and move toward port route." }
    ],
    faq: [{ q: "Can I visit both major mosque and palace interiors?", a: "Possible on long calls with light queues, but one interior priority is safer." }],
    internalLinks: [{ title: "Rome transfer discipline", href: "/blog/rome-from-civitavecchia-without-stress", anchorText: "compare another big-city transfer day" }, { title: "Lisbon slope strategy", href: "/blog/lisbon-cruise-port-day-tram-hills-plan", anchorText: "read another urban pacing guide" }],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Istanbul" },
    updatedAt: "2026-02-16"
  },
  {
    slug: "athens-piraeus-cruise-port-acropolis-plan",
    title: "Athens from Piraeus: Acropolis plan with realistic transit timing",
    subtitle: "How to see Athens highlights and still return stress-free from Piraeus.",
    excerpt: "A Piraeus-to-Athens strategy for transport, crowd avoidance, and practical cutoff decisions.",
    metaTitle: "Athens from Piraeus Cruise Guide: Acropolis Timing + Return Buffer",
    metaDescription: "Plan your Athens port day from Piraeus with transit options, queue control, and firm return-to-ship rules.",
    keywords: ["Piraeus cruise port", "Acropolis from cruise", "Athens port day"],
    portName: "Piraeus (Athens)",
    country: "Greece",
    region: "Mediterranean",
    timeInPort: "6–8 hours",
    dockingType: "Dock",
    travelerTypes: ["first-time", "family", "mobility", "budget"],
    toc: [{ id: "timing", label: "Transit timing" }, { id: "acropolis", label: "Acropolis strategy" }, { id: "return", label: "Return safety" }],
    sections: [
      { id: "timing", heading: "Transit timing from Piraeus sets your whole day", shortIntro: "Athens is close enough for success but far enough for mistakes.", bullets: ["Metro and taxi both work with tradeoffs.", "Queue and traffic variability matter.", "Hard return trigger is mandatory."], steps: ["Pick primary transport mode.", "Define backup mode.", "Reserve strong return margin."], checklist: ["Primary mode", "Backup mode", "Margin set"], ifRunningLateRule: "Switch to direct taxi return once delay appears." },
      { id: "acropolis", heading: "Acropolis first to avoid long heat and queue exposure", shortIntro: "Morning completion increases comfort and success rate.", bullets: ["Do highest-value site first.", "Use nearby Plaka for flexible second block.", "Avoid crossing city repeatedly."], steps: ["Reach Acropolis early.", "Move to adjacent neighborhood.", "Leave city on fixed cutoff."], checklist: ["Acropolis early", "Adjacent second block", "Fixed cutoff"], ifRunningLateRule: "Skip museum interiors and keep to exterior neighborhood walk." },
      { id: "return", heading: "Return-to-ship buffer and scam avoidance", shortIntro: "Late-day stress often comes from transport indecision.", bullets: ["Use official taxis or clear transit routes.", "Avoid unverified shortcut offers.", "Aim for 90+ minute port buffer."], steps: ["Set return alarm.", "Use verified transport.", "Arrive port ahead of buffer."], checklist: ["Alarm active", "Verified route", "Port early"], ifRunningLateRule: "Stop all nonessential activity and begin return immediately." }
    ],
    faq: [{ q: "Is Acropolis plus Syntagma realistic?", a: "Yes if queues are moderate and you keep transfers minimal." }],
    internalLinks: [{ title: "Santorini tender strategy", href: "/blog/santorini-tender-port-day-survival-guide", anchorText: "pair mainland and island planning" }, { title: "Barcelona old-town flow", href: "/blog/barcelona-cruise-port-day-plan", anchorText: "compare another Mediterranean city day" }],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Piraeus" },
    updatedAt: "2026-02-16"
  },
  {
    slug: "seattle-embark-port-call-pike-place-short-window",
    title: "Seattle cruise stop short-window plan: Pike Place without schedule drift",
    subtitle: "An efficient downtown approach for limited post-call or pre-embark free time.",
    excerpt: "Use this Seattle guide for terminal transit, crowd timing, and weather-smart planning.",
    metaTitle: "Seattle Cruise Stop Guide: Pike Place Timing + Transport",
    metaDescription: "Plan a short Seattle cruise window with practical downtown sequencing, budget tips, and return safety buffer.",
    keywords: ["Seattle cruise terminal", "Pike Place timing", "Alaska cruise port day"],
    portName: "Seattle",
    country: "United States",
    region: "North America",
    timeInPort: "4–6 hours",
    dockingType: "Dock",
    travelerTypes: ["first-time", "family", "budget", "mobility"],
    toc: [{ id: "window", label: "Short-window planning" }, { id: "downtown", label: "Downtown sequence" }, { id: "weather", label: "Weather and safety" }],
    sections: [
      { id: "window", heading: "Short windows require hard priority choices", shortIntro: "Seattle traffic and terminal procedures can eat into city time.", bullets: ["Choose one core district.", "Use direct transport legs.", "Hold return margin."], steps: ["Define top objective.", "Set latest departure from city.", "Pre-select return mode."], checklist: ["Top objective", "Departure cutoff", "Return mode"], ifRunningLateRule: "Skip market browsing detours and move straight to return leg." },
      { id: "downtown", heading: "Downtown order: Pike Place then waterfront", shortIntro: "This sequence limits backtracking and keeps options open.", bullets: ["Start at your must-see market segment.", "Use waterfront as flexible second block.", "Keep meals quick on short calls."], steps: ["Complete priority stop.", "Add nearby second stop.", "Return before traffic builds."], checklist: ["Priority done", "Nearby add-on", "Early return"], ifRunningLateRule: "Drop waterfront if market runs long." },
      { id: "weather", heading: "Weather and comfort planning", shortIntro: "Rain and hills can reduce pace unexpectedly.", bullets: ["Carry light rain layer.", "Use ride support for mobility needs.", "Plan indoor fallback stop."], steps: ["Check forecast before leaving ship.", "Adjust walking route.", "Keep dry return option ready."], checklist: ["Forecast checked", "Fallback stop", "Dry return option"], ifRunningLateRule: "Choose direct covered transport back instead of waiting outdoors." }
    ],
    faq: [{ q: "Can I do Space Needle and Pike Place on a short call?", a: "Possible only with very efficient transport and strict timing." }],
    internalLinks: [{ title: "Vancouver short-call strategy", href: "/blog/vancouver-cruise-port-day-gastown-stanley-park-plan", anchorText: "compare Pacific Northwest options" }, { title: "Lisbon pacing rules", href: "/blog/lisbon-cruise-port-day-tram-hills-plan", anchorText: "read another hill-and-transit guide" }],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Seattle" },
    updatedAt: "2026-02-16"
  },
  {
    slug: "vancouver-cruise-port-day-gastown-stanley-park-plan",
    title: "Vancouver cruise day plan: Gastown and Stanley Park without rush",
    subtitle: "A balanced city nature mix for moderate call lengths.",
    excerpt: "Plan Vancouver with simple transit, weather flexibility, and predictable return timing.",
    metaTitle: "Vancouver Cruise Port Guide: Gastown + Stanley Park Timing",
    metaDescription: "Use this Vancouver guide to combine Gastown and Stanley Park efficiently while preserving return-to-ship safety margin.",
    keywords: ["Vancouver cruise", "Gastown", "Stanley Park cruise day"],
    portName: "Vancouver",
    country: "Canada",
    region: "North America",
    timeInPort: "6–8 hours",
    dockingType: "Dock",
    travelerTypes: ["first-time", "family", "budget", "mobility"],
    toc: [{ id: "mix", label: "City-nature balance" }, { id: "transport", label: "Transport options" }, { id: "budget", label: "Budget and time cuts" }],
    sections: [
      { id: "mix", heading: "Balance one urban block and one green block", shortIntro: "Vancouver rewards a two-part day with minimal transfers.", bullets: ["Gastown offers walkable character.", "Stanley Park gives scenic contrast.", "Avoid adding third distant district."], steps: ["Start with your preferred anchor.", "Transition once only.", "Return with extra margin."], checklist: ["Two-block plan", "Single transition", "Extra margin"], ifRunningLateRule: "Keep only one block if first segment overruns." },
      { id: "transport", heading: "Transport choices by group profile", shortIntro: "Simple mode choices reduce friction.", bullets: ["Walking + short rides works for many travelers.", "Taxi support helps mobility/family comfort.", "Public transit supports budget plans."], steps: ["Pick low-friction primary mode.", "Set return mode early.", "Keep route offline."], checklist: ["Primary mode", "Return mode", "Offline route"], ifRunningLateRule: "Use direct return ride instead of multi-leg transit." },
      { id: "budget", heading: "Budget snapshot and what to trim", shortIntro: "Controlled spending keeps the day focused.", bullets: ["Set meal and snack caps.", "Skip souvenir drift when behind.", "Protect return fare reserve."], steps: ["Create simple budget buckets.", "Do midpoint time audit.", "Cut least-valuable stop first."], checklist: ["Budget buckets", "Midpoint audit", "Least-value cut"], ifRunningLateRule: "Drop retail and scenic extras first." }
    ],
    faq: [{ q: "Is Stanley Park realistic on a short call?", a: "Yes if paired with one nearby city stop and direct transport choices." }],
    internalLinks: [{ title: "Seattle short-window plan", href: "/blog/seattle-embark-port-call-pike-place-short-window", anchorText: "compare nearby Pacific planning" }, { title: "San Juan city-walk guide", href: "/blog/san-juan-cruise-port-old-san-juan-day-plan", anchorText: "see another walkable city strategy" }],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Vancouver" },
    updatedAt: "2026-02-16"
  },
  {
    slug: "skagway-cruise-port-white-pass-vs-town-plan",
    title: "Skagway cruise day: White Pass excursion vs town plan",
    subtitle: "An Alaska call strategy for weather risk, excursion timing, and backup options.",
    excerpt: "Choose between rail scenery and town exploration with practical return safeguards.",
    metaTitle: "Skagway Cruise Guide: White Pass vs Town + Timing Rules",
    metaDescription: "Plan Skagway port calls with excursion tradeoffs, weather-aware timing, and reliable return-to-ship buffers.",
    keywords: ["Skagway cruise", "White Pass Railroad", "Alaska port day"],
    portName: "Skagway",
    country: "United States",
    region: "Alaska",
    timeInPort: "6–8 hours",
    dockingType: "Dock",
    travelerTypes: ["family", "first-time", "budget", "luxury"],
    toc: [{ id: "excursion", label: "Excursion decision" }, { id: "weather", label: "Weather contingencies" }, { id: "return", label: "Return rules" }],
    sections: [
      { id: "excursion", heading: "Excursion vs independent town day", shortIntro: "Both are valid; pick based on risk tolerance and interests.", bullets: ["Rail excursion gives scenic certainty.", "Town day offers flexibility and lower cost.", "Avoid trying to fully do both."], steps: ["Select primary day style.", "Add one short secondary block.", "Protect buffer before departure."], checklist: ["Primary style", "Short secondary", "Buffer protected"], ifRunningLateRule: "Cancel secondary activity and move to port return corridor." },
      { id: "weather", heading: "Weather can change pace quickly in Alaska", shortIntro: "Cold, rain, and wind affect both comfort and timing.", bullets: ["Layered clothing is essential.", "Wet conditions slow walking routes.", "Have indoor fallback points."], steps: ["Check forecast hourly.", "Adjust route exposure.", "Shift to indoor backup if needed."], checklist: ["Layers ready", "Forecast checked", "Indoor backup"], ifRunningLateRule: "Take nearest reliable route back and avoid exposed detours." },
      { id: "return", heading: "Return-to-ship safety for excursion days", shortIntro: "Even organized plans need independent time awareness.", bullets: ["Know all-aboard clearly.", "Keep excursion contact details.", "Preserve post-excursion buffer."], steps: ["Set alarm earlier than needed.", "Confirm final transfer details.", "Arrive pier with spare time."], checklist: ["Alarm set", "Contact details", "Spare arrival time"], ifRunningLateRule: "If any transfer uncertainty appears, return directly to ship area." }
    ],
    faq: [{ q: "Should I book White Pass independently?", a: "Only if you are comfortable with logistics and still preserve a strong return margin." }],
    internalLinks: [{ title: "Seattle short-call plan", href: "/blog/seattle-embark-port-call-pike-place-short-window", anchorText: "pair with embark/debark city strategy" }, { title: "Vancouver city-nature plan", href: "/blog/vancouver-cruise-port-day-gastown-stanley-park-plan", anchorText: "compare Pacific coast pacing" }],
    plannerCta: { label: "Open Cruise Day Planner", href: "/planner", prefillPort: "Skagway" },
    updatedAt: "2026-02-16"
  }
];

export const BLOG_POSTS = posts;

export const BLOG_POSTS_BY_SLUG = Object.fromEntries(posts.map((post) => [post.slug, post])) as Record<string, BlogPost>;

export const BLOG_REGIONS = Array.from(new Set(posts.map((p) => p.region))).sort();
export const BLOG_TIME_WINDOWS = Array.from(new Set(posts.map((p) => p.timeInPort))).sort();

export function getBlogPost(slug: string) {
  return BLOG_POSTS_BY_SLUG[slug];
}
