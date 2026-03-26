export type PortType = "dock" | "tender";

export type PortProfile = {
  slug: string;
  cityName: string;
  country: string;
  portType: PortType;
  region: "Mediterranean" | "Caribbean" | "Northern Europe" | "Transatlantic";
  difficulty: "Easy" | "Moderate" | "Complex";
  typicalTimeInPortRange: "3–4 hours" | "5–7 hours" | "7–9 hours" | "10–12 hours";
  terminalReality: string[];
  cityAnchors: string[];
  timingFriction: string[];
  returnSafeRules: string[];
  failureScenarios: string[];
  scamPatterns: string[];
  accessibilityNotes: string[];
  quickPlanOptions: string[];
  recommendedLoops: string[];
  internalLinks: string[];
  published: boolean;
};

const detailed: PortProfile[] = [
  {
    slug: "barcelona", cityName: "Barcelona", country: "Spain", portType: "dock", region: "Mediterranean", difficulty: "Moderate", typicalTimeInPortRange: "7–9 hours",
    terminalReality: ["Moll Adossat sits outside the old core and starts every day with a transfer decision.", "Shuttle lines surge right after first gangway release.", "Taxi rank clears quickly, then reforms when multiple ships unload.", "Traffic around the port bridge compresses in late afternoon.", "Port security can add a final queue before boarding.", "Pier walk is exposed in hot weather and slows families."],
    cityAnchors: ["Gothic Quarter", "El Born", "La Rambla edge", "Barceloneta promenade", "Sagrada Família perimeter", "Passeig de Gràcia", "Port Vell", "Montjuïc viewpoints"],
    timingFriction: ["stacked shuttle waits", "metro transfer handoff", "long attraction entry lines", "old-city crowd pockets", "afternoon port road traffic", "security re-entry queue"],
    returnSafeRules: ["Pick a final stop on the same side as the port approach.", "Treat Sagrada transfer time as fragile if roads clog.", "Begin heading back before the city's late lunch swell ends.", "Use one direct mode for the final leg, not two transfers.", "Drop any uphill detour after midday delay.", "Hold 45–60 minutes of pure buffer before all-aboard."],
    failureScenarios: ["Shuttle line doubles after an early rain shower.", "Taxi queue appears short but dispatch stalls.", "Metro platform crowds force you to skip a train.", "A museum line consumes the whole morning block.", "Traffic locks up near the waterfront at return time.", "Family pace drops on uneven Gothic lanes."],
    scamPatterns: ["fare ambiguity at unofficial pickup points", "street game distraction near Ramblas", "ticket reseller pressure by major sites", "menu upsell around tourist plazas"],
    accessibilityNotes: ["old-quarter stones can be uneven", "some metro stations still require stairs", "waterfront is flatter and easier for mobility devices", "midday heat exposure can reduce walking range", "taxis are practical for step-free transitions"],
    quickPlanOptions: ["Gothic Quarter + Port Vell loop", "Sagrada exterior + Passeig café break", "Barceloneta promenade + Born lanes"],
    recommendedLoops: ["First timer: Gothic Quarter → Born → waterfront", "Culture: Sagrada exterior → Eixample streets → old city", "Easy walking: Port Vell → Barceloneta → relaxed return", "Viewpoint day: Montjuïc edge then compact old-town pass"],
    internalLinks: ["/blog/marseille", "/blog/lisbon", "/blog/rome-civitavecchia", "/blog/naples", "/planner", "/plan", "/blog/grand-cayman"],
    published: true,
  },
  {
    slug: "marseille", cityName: "Marseille", country: "France", portType: "dock", region: "Mediterranean", difficulty: "Moderate", typicalTimeInPortRange: "7–9 hours",
    terminalReality: ["Cruise docks are far from Vieux-Port.", "Official shuttle staging determines your opening tempo.", "Taxi availability swings with simultaneous ship arrivals.", "Port exits can feel efficient early then bottleneck fast.", "Return queue forms earlier than first-timers expect.", "Windy days can make waiting areas uncomfortable."],
    cityAnchors: ["Vieux-Port", "Le Panier", "MuCEM exterior", "Cathédrale La Major", "Cours Julien", "Notre-Dame de la Garde perimeter", "Corniche views", "Noailles market streets"],
    timingFriction: ["terminal-to-city distance", "midday harbor congestion", "hill access to viewpoints", "return taxi lottery", "shuttle departure cadence", "weekend event street closures"],
    returnSafeRules: ["Lock your outbound mode before leaving terminal grounds.", "Avoid ending uphill late unless you already have a taxi.", "If Panier crowds thicken, pivot waterfront earlier.", "Reserve one no-transfer route for the final return.", "Treat Notre-Dame as optional, never mandatory.", "Rejoin port corridor with a full buffer block."],
    failureScenarios: ["Shuttle queue snakes past staging fences.", "Harbor festival reroutes buses.", "Hill climb to Notre-Dame takes longer than expected.", "Taxi line at Vieux-Port barely moves.", "A restaurant stop overruns your return checkpoint.", "Weather gusts create stressful waits at open stops."],
    scamPatterns: ["unmetered taxi opening offers", "menu language confusion near waterfront", "souvenir pressure in narrow lanes", "informal transfer solicitations"],
    accessibilityNotes: ["Panier slopes are steep in sections", "waterfront boardwalk is smoother", "tram corridor is often easier than buses", "old steps near viewpoints limit step-free options", "bench density is good around Vieux-Port"],
    quickPlanOptions: ["Vieux-Port + Le Panier loop", "MuCEM waterfront circuit", "Harbor café run with short market pass"],
    recommendedLoops: ["First timer: Vieux-Port → Panier → Major", "Culture: MuCEM exterior → Panier galleries", "Easy walking: harbor promenade and tram corridor", "Viewpoint-lite: Corniche photo stops then return"],
    internalLinks: ["/blog/barcelona", "/blog/lisbon", "/blog/dubrovnik", "/blog/split", "/planner", "/blog/athens-piraeus"],
    published: true,
  },
  {
    slug: "athens-piraeus", cityName: "Athens (Piraeus)", country: "Greece", portType: "dock", region: "Mediterranean", difficulty: "Moderate", typicalTimeInPortRange: "7–9 hours",
    terminalReality: ["Piraeus gate assignments vary by ship and can change walking distance.", "Metro access is useful but requires station transfer discipline.", "Taxi ranks move quickly then pause in waves.", "Coach traffic around port roads can stall unexpectedly.", "Return security can be slow when several ships converge.", "Heat on exposed port walkways drains pace."],
    cityAnchors: ["Acropolis perimeter", "Plaka lanes", "Monastiraki", "Syntagma Square", "Ancient Agora edge", "Psyrri", "Piraeus marina", "National Garden"],
    timingFriction: ["gate-to-station walk", "Acropolis entry lines", "midday heat slowdown", "metro crowding", "road bottlenecks near central squares", "port gate confusion"],
    returnSafeRules: ["Use direct taxi for first anchor if you are exit-delayed.", "Do major hill sections early while energy is high.", "Cap old-town wandering before your return checkpoint.", "End the day along one clean route to Piraeus.", "Never add a second hill attraction after lunch.", "Start return before commuter pressure ramps."],
    failureScenarios: ["Wrong gate assumption adds 20+ minutes.", "Acropolis queue pushes your whole schedule right.", "Metro platform crowd causes missed train.", "Heat exhaustion slows family pace in Plaka.", "Taxi driver rejects short return ride late day.", "Traffic around Syntagma freezes unexpectedly."],
    scamPatterns: ["fixed-fare claims without agreement", "tour bundle pressure near monuments", "souvenir overpricing in dense lanes", "ATM conversion traps"],
    accessibilityNotes: ["steep grades around Acropolis", "smooth pavement near Syntagma and Garden", "shade is limited on exposed climbs", "metro elevators are inconsistent by station", "taxi hops reduce stair-heavy transfers"],
    quickPlanOptions: ["Acropolis exterior + Plaka coffee route", "Syntagma + Monastiraki compact loop", "Piraeus marina + central market taste"],
    recommendedLoops: ["First timer: Acropolis perimeter → Plaka → Monastiraki", "Culture: Agora edge → Psyrri lanes", "Easy walking: Syntagma → National Garden → cafés", "Heat-safe: shaded museum corridor and early return"],
    internalLinks: ["/blog/rome-civitavecchia", "/blog/naples", "/blog/santorini", "/blog/mykonos", "/planner", "/blog/lisbon"],
    published: true,
  },
  {
    slug: "lisbon", cityName: "Lisbon", country: "Portugal", portType: "dock", region: "Mediterranean", difficulty: "Moderate", typicalTimeInPortRange: "7–9 hours",
    terminalReality: ["Central docking is convenient but can tempt overplanning.", "Tram demand spikes in scenic districts by mid-morning.", "Taxi lanes near the terminal are usually orderly.", "Cobblestone gradients slow walking pace fast.", "Waterfront return roads tighten near rush windows.", "Cruise shuttles are less critical than in outer ports."],
    cityAnchors: ["Baixa", "Chiado", "Alfama edge", "Belém riverfront", "Praça do Comércio", "Time Out Market zone", "Miradouros", "Avenida da Liberdade"],
    timingFriction: ["tram queues", "hills between districts", "elevator waits", "riverfront traffic", "cobblestone pace loss", "late lunch lineups"],
    returnSafeRules: ["Treat steep climbs as bonus, not core itinerary.", "Keep one flat fallback corridor all day.", "Do Belém only with early commitment.", "If tram queue exceeds expectation, pivot to walk/taxi blend.", "Anchor final hour near waterfront spine.", "Use downhill legs late, uphill early."],
    failureScenarios: ["Scenic tram line wait consumes an hour.", "Alfama stair route exhausts the group.", "Belém return by road crawls in traffic.", "Viewpoint detour expands into a maze-like walk.", "Lunch stop overruns due to line spillover.", "Unexpected rain makes stones slippery and slower."],
    scamPatterns: ["aggressive tuk-tuk upsell", "transport ticket confusion pitches", "currency confusion for quick purchases", "restaurant add-on charging"],
    accessibilityNotes: ["hills can be relentless", "riverfront zones are smoother", "step-free options improve in newer districts", "cobblestones affect wheel comfort", "frequent short rests help in heat"],
    quickPlanOptions: ["Baixa + Chiado easy circuit", "Alfama edge + riverfront return", "Belém snapshot with direct taxi both ways"],
    recommendedLoops: ["First timer: Baixa → Chiado → Comércio square", "Culture: Alfama edge → miradouro stop", "Easy walking: riverfront + market zone", "Viewpoint mode: one miradouro then compact café route"],
    internalLinks: ["/blog/barcelona", "/blog/marseille", "/blog/rome-civitavecchia", "/blog/dubrovnik", "/planner", "/blog/split"],
    published: true,
  },
  {
    slug: "rome-civitavecchia", cityName: "Rome (Civitavecchia)", country: "Italy", portType: "dock", region: "Mediterranean", difficulty: "Complex", typicalTimeInPortRange: "10–12 hours",
    terminalReality: ["This is a transfer day before it is a sightseeing day.", "Port shuttle to station adds a hidden first leg.", "Regional train cadence dictates your usable city window.", "Rome station exits can feel chaotic for first-timers.", "Return train platform changes create late stress.", "Port gates and final ship security still require buffer."],
    cityAnchors: ["Colosseum perimeter", "Trevi corridor", "Pantheon area", "Piazza Navona", "Trastevere edge", "Vatican exterior", "Campo de' Fiori", "Termini routes"],
    timingFriction: ["train transfers", "queueing at iconic sites", "metro crowds", "distance between anchors", "platform uncertainty", "long return chain"],
    returnSafeRules: ["Build day around two train checkpoints minimum.", "Pick anchors near one another, not across the city.", "Avoid timed-entry dependence unless you are early.", "Begin return from Rome with margin for one missed train.", "Keep station orientation notes for both directions.", "Never push a final attraction past your train cutoff."],
    failureScenarios: ["Port shuttle delay erases first train option.", "Wrong station exit sends you to the opposite side.", "Trevi crowd density blocks movement.", "Metro outage forces expensive taxi backup.", "Return platform changes at the last minute.", "A strike-adjacent disruption reduces service frequency."],
    scamPatterns: ["ticket machine helper scams", "fake queue-jump offers", "overpriced transfer pitches", "restaurant cover-charge surprises"],
    accessibilityNotes: ["train stations involve long walks", "historic center paving is uneven", "bus boarding can be abrupt", "shade is limited in open piazzas", "accessible taxis are worth pre-checking"],
    quickPlanOptions: ["Trevi + Pantheon compact center loop", "Colosseum exterior + forum view pass", "Vatican exterior with direct return"],
    recommendedLoops: ["First timer: Trevi → Pantheon → Navona", "History focus: Colosseum perimeter and nearby lanes", "Easy walking: one district only with long café breaks", "Photo day: early landmark pass then stationward drift"],
    internalLinks: ["/blog/naples", "/blog/athens-piraeus", "/blog/barcelona", "/blog/lisbon", "/planner", "/blog/santorini"],
    published: true,
  },
  {
    slug: "naples", cityName: "Naples", country: "Italy", portType: "dock", region: "Mediterranean", difficulty: "Complex", typicalTimeInPortRange: "7–9 hours",
    terminalReality: ["Terminal access to central Naples is quick, but street intensity is high.", "Hydrofoil and rail options open many choices fast.", "Traffic can turn short rides into long ones.", "Historic center lanes are dense and noisy.", "Port return areas bunch up at late afternoon.", "Weather shifts can affect island side options."],
    cityAnchors: ["Spaccanapoli", "Via Toledo", "Quartieri Spagnoli", "Lungomare", "Piazza del Plebiscito", "Castel dell'Ovo", "Duomo corridor", "Mergellina"],
    timingFriction: ["decision overload", "dense intersections", "funicular waits", "ferry timing", "restaurant queue spikes", "late port traffic"],
    returnSafeRules: ["Choose city, island, or ruins—avoid stacking all three.", "Keep your final anchor near a direct port corridor.", "Treat ferry legs as all-or-nothing commitments.", "If traffic rises, switch to walkable core strategy.", "End exploration one neighborhood earlier than planned.", "Re-enter port zone with generous security margin."],
    failureScenarios: ["Ferry queue ruins a two-destination plan.", "Street crossing pace slows inexperienced groups.", "Taxi detour through traffic eats final hour.", "Unexpected rain saturates tight old lanes.", "Lunch delay compounds with port road congestion.", "Wrong train platform sends you opposite direction."],
    scamPatterns: ["street vendor overcharge pressure", "unofficial guide offers", "taxi detour tactics", "menu substitution upsell"],
    accessibilityNotes: ["sidewalk quality varies widely", "waterfront route is smoother", "historic center includes frequent curbs", "funicular helps with elevation changes", "rest stops are easy to find near major squares"],
    quickPlanOptions: ["Spaccanapoli + espresso + return", "Waterfront promenade + Ovo perimeter", "Toledo corridor + Plebiscito loop"],
    recommendedLoops: ["First timer: Toledo → Plebiscito → Lungomare", "Culture: Duomo corridor → Spaccanapoli", "Easy walking: waterfront only with long pauses", "Foodie mini-loop: market stop + old street tasting"],
    internalLinks: ["/blog/rome-civitavecchia", "/blog/athens-piraeus", "/blog/santorini", "/blog/dubrovnik", "/planner", "/blog/mykonos"],
    published: true,
  },
  {
    slug: "santorini", cityName: "Santorini", country: "Greece", portType: "tender", region: "Mediterranean", difficulty: "Complex", typicalTimeInPortRange: "5–7 hours",
    terminalReality: ["Tender sequence controls the entire day.", "Old port disembarkation creates immediate queue choices.", "Cable car lines can become the day's biggest time sink.", "Donkey path exists but is steep and crowded.", "Road transfers between Fira and Oia are slow in peak hours.", "Return tender cutoff requires conservative timing."],
    cityAnchors: ["Fira lanes", "Oia viewpoint edges", "Imerovigli paths", "Pyrgos village", "Akrotiri outlook", "Kamari waterfront", "caldera rim walks", "local wineries"],
    timingFriction: ["tender tendering windows", "cable car queues", "switchback traffic", "sunset crowd crush", "heat exposure", "return tender backlog"],
    returnSafeRules: ["Secure an early ascent strategy immediately after landing.", "Do not schedule Oia and beach zones on short calls.", "Treat cable car wait as variable, never fixed.", "Return to Fira earlier than intuition suggests.", "Use one major anchor and one optional micro-stop.", "Join tender return wave before final surge."],
    failureScenarios: ["Tender disembark drifts later than expected.", "Cable car line exceeds an hour.", "Road to Oia stalls in bus congestion.", "Heat drains pace on caldera climbs.", "Sunset traffic blocks return to Fira.", "Late queue misses desired tender wave."],
    scamPatterns: ["tour transfer urgency upsells", "photo-stop price inflation", "informal transport price jumps", "menu premium without clarity"],
    accessibilityNotes: ["steep inclines are constant", "step-free options are limited", "shade can be sparse in midday", "cable car access may involve queues and standing", "flat stretches are short and fragmented"],
    quickPlanOptions: ["Fira lanes + caldera views", "Imerovigli snapshot with taxi return", "single-village café and viewpoint loop"],
    recommendedLoops: ["First timer: Fira only, deep wander, early return", "Viewpoint focus: Imerovigli + Fira rim", "Easy-ish day: one scenic stop plus seated lunch", "Culture light: Pyrgos village and back"],
    internalLinks: ["/blog/mykonos", "/blog/athens-piraeus", "/blog/naples", "/blog/villefranche-nice", "/planner", "/blog/grand-cayman"],
    published: true,
  },
  {
    slug: "mykonos", cityName: "Mykonos", country: "Greece", portType: "tender", region: "Mediterranean", difficulty: "Moderate", typicalTimeInPortRange: "5–7 hours",
    terminalReality: ["Tender landing and shuttle handoff shape morning speed.", "Old town lanes fill quickly once two ships unload.", "Beach transfer buses can run full.", "Taxi supply is limited at peak moments.", "Wind can affect comfort and ferry rhythm.", "Return tender lines tighten late afternoon."],
    cityAnchors: ["Mykonos Town lanes", "Little Venice", "Windmills", "Matogianni street", "Ornos corridor", "Platis Gialos", "Ano Mera", "Old Port edge"],
    timingFriction: ["tender sequencing", "maze-like lanes", "limited taxis", "beach shuttle waits", "photo crowd stoppages", "return queue bunching"],
    returnSafeRules: ["Decide town-first or beach-first before landing.", "Use one beach max on short windows.", "Keep a no-transfer return option from your final anchor.", "Avoid crossing the island twice in one day.", "Leave Little Venice before peak photo crush.", "Queue for tender return early if wind picks up."],
    failureScenarios: ["Tender wave delay pushes beach plan off track.", "Town crowding turns short walks into slow crawls.", "Taxi queue at beach stop stalls progress.", "Wind changes make sea legs rough and slower.", "Lunch line in old town overruns return block.", "Group splits in narrow lanes and loses time regrouping."],
    scamPatterns: ["beach chair upsell pressure", "transport quote inflation", "menu add-on ambiguity", "retail quality bait-and-switch"],
    accessibilityNotes: ["narrow stone lanes challenge wheel mobility", "beaches vary by step-free access", "shaded seating is unevenly distributed", "short taxi hops can reduce strain", "wind exposure may be tiring"],
    quickPlanOptions: ["Old town + windmills compact walk", "Little Venice + café + harbor return", "Single beach leg with preplanned return"],
    recommendedLoops: ["First timer: Town lanes → windmills → harbor", "Beach day: one bay + direct return", "Easy walking: harbor edge and level streets", "Photo route: early Little Venice then quieter alleys"],
    internalLinks: ["/blog/santorini", "/blog/athens-piraeus", "/blog/villefranche-nice", "/blog/grand-cayman", "/planner", "/blog/dubrovnik"],
    published: true,
  },
  {
    slug: "grand-cayman", cityName: "Grand Cayman", country: "Cayman Islands", portType: "tender", region: "Caribbean", difficulty: "Complex", typicalTimeInPortRange: "5–7 hours",
    terminalReality: ["Tender operations are the single biggest planning variable.", "Pier processing speed changes by ship mix.", "Island transport demand spikes after each wave lands.", "Seven Mile traffic can thicken around lunch.", "Shade at return queue can be limited.", "Weather and swell affect tender comfort and timing."],
    cityAnchors: ["George Town waterfront", "Seven Mile Beach corridor", "Camana Bay", "Harbor Drive shops", "Cayman Craft Market", "Smith Barcadere", "West Bay lookouts", "local rum cake stops"],
    timingFriction: ["tender ticket windows", "queue exposure", "island bus variability", "beach crowd spikes", "midday heat", "return tender congestion"],
    returnSafeRules: ["Anchor the day around your return tender wave.", "Choose one far-west anchor at most.", "Avoid stacking snorkel and shopping both late day.", "Keep cashless payment backups for quick transitions.", "Rejoin George Town earlier than feels necessary.", "Treat weather shift as instant trigger to shorten scope."],
    failureScenarios: ["Tender queue doubles after morning squall.", "Shared bus route fills and skips your stop.", "Beach chair hunt consumes planned swim time.", "Traffic from West Bay delays town return.", "Late lunch service is slower than expected.", "Heat fatigue reduces walking pace to queue area."],
    scamPatterns: ["informal transport haggling pressure", "activity upsell at pier edge", "unclear package inclusions", "souvenir quality inflation"],
    accessibilityNotes: ["pier queue standing can be long", "beach access points vary by ramp quality", "heat management is essential", "taxi vans can be easier than buses", "town core has several flat segments"],
    quickPlanOptions: ["George Town shops + short waterfront break", "Single Seven Mile stop + direct return", "Camana Bay stroll + market visit"],
    recommendedLoops: ["First timer: waterfront + market + café", "Beach focus: one bay and generous return buffer", "Easy walking: harbor drive and nearby shops", "Family loop: short beach leg then town snacks"],
    internalLinks: ["/blog/villefranche-nice", "/blog/mykonos", "/blog/santorini", "/blog/dubrovnik", "/planner", "/blog/barcelona"],
    published: true,
  },
  {
    slug: "villefranche-nice", cityName: "Villefranche / Nice", country: "France", portType: "tender", region: "Mediterranean", difficulty: "Moderate", typicalTimeInPortRange: "7–9 hours",
    terminalReality: ["Tender landing is compact and usually efficient early.", "Rail station access involves stairs and short climbs.", "Nice-bound trains are frequent but platform-aware travel helps.", "Taxi stands can thin out when Monaco demand rises.", "Bayfront crowds build through midday.", "Return tender waves bunch if trains arrive together."],
    cityAnchors: ["Villefranche old harbor", "Rue Obscure", "Nice Old Town edge", "Promenade des Anglais", "Castle Hill approach", "Cours Saleya", "Beaulieu waterfront", "Cap Ferrat viewpoints"],
    timingFriction: ["tender wave bunching", "station stair flow", "train platform timing", "promenade crowd density", "uphill village lanes", "late return queue"],
    returnSafeRules: ["Take earlier outbound train if you plan Nice.", "Do Monaco only on high-confidence mornings.", "Protect station-to-tender transfer buffer.", "Keep one taxi fallback in case rail hiccups.", "End the day close to landing zone.", "Skip extra hillside detour after lunch slip."],
    failureScenarios: ["Tender delay makes first train tight.", "Station steps slow mixed-mobility groups.", "Nice old town density eats more time than expected.", "Rail disruption forces last-minute taxi scramble.", "Beach stop expands and pinches return block.", "Simultaneous return waves produce long pier queue."],
    scamPatterns: ["short-hop fare inflation", "tour quote ambiguity", "menu service-charge surprise", "retail imitation branding"],
    accessibilityNotes: ["station access includes stairs", "promenade offers flatter walking", "old harbor has uneven stone", "shade is better in arcades than on open seafront", "short rail hops reduce bus complexity"],
    quickPlanOptions: ["Villefranche harbor + old lanes", "Nice old-town snapshot + promenade", "Beaulieu waterfront café loop"],
    recommendedLoops: ["First timer: harbor → Rue Obscure → seaside return", "Culture: Nice old town and market edge", "Easy walking: promenade and café corridor", "Scenic: Cap Ferrat viewpoints with early return"],
    internalLinks: ["/blog/marseille", "/blog/lisbon", "/blog/mykonos", "/blog/santorini", "/planner", "/blog/dubrovnik"],
    published: true,
  },
  {
    slug: "dubrovnik", cityName: "Dubrovnik", country: "Croatia", portType: "dock", region: "Mediterranean", difficulty: "Moderate", typicalTimeInPortRange: "7–9 hours",
    terminalReality: ["Gruž port is practical but old-town transfers can stack.", "Shuttle buses are frequent yet queue-sensitive.", "Pile Gate zone compresses quickly after arrivals.", "City wall entries can dominate a morning slot.", "Taxi queue at old town fluctuates heavily.", "Return shuttle crowding rises in late afternoon."],
    cityAnchors: ["Pile Gate perimeter", "Stradun", "Old Harbor", "city walls exterior viewpoints", "Lapad promenade", "Rector's Palace area", "Buža cliff edge", "Gruž market"],
    timingFriction: ["gate crowding", "wall ticket lines", "stone stair pace", "heat reflection in old town", "return shuttle waits", "coach transfer bunching"],
    returnSafeRules: ["Do walls at opening hour or skip them entirely.", "Keep at least one late-day block outside old-town core.", "Use shuttle return before final wave if possible.", "Avoid adding Lokrum on a delayed start.", "Choose shade breaks to preserve pace.", "End with direct transport, not layered transfers."],
    failureScenarios: ["Pile Gate queue erases morning rhythm.", "Wall walk takes longer than planned in heat.", "Old town lunch crowd delays service.", "Shuttle stop becomes packed and slow.", "Taxi shortage appears when rain starts.", "Family fatigue on steps triggers abrupt slowdown."],
    scamPatterns: ["priority-line upsell claims", "souvenir quality mismatch", "transport quote vagueness", "menu bait-and-switch near gates"],
    accessibilityNotes: ["many steps in old core", "Lapad offers easier surfaces", "heat and crowd density affect wheelchair movement", "shaded rest points are limited on walls", "port area itself is flatter"],
    quickPlanOptions: ["Stradun + harbor compact loop", "Lapad promenade fallback day", "Old town perimeter walk without walls"],
    recommendedLoops: ["First timer: Pile Gate → Stradun → harbor", "Culture: palace lanes and museums edge", "Easy walking: Lapad and seafront cafés", "Viewpoint-lite: one cliff edge stop then return"],
    internalLinks: ["/blog/split", "/blog/marseille", "/blog/villefranche-nice", "/blog/barcelona", "/planner", "/blog/naples"],
    published: true,
  },
  {
    slug: "split", cityName: "Split", country: "Croatia", portType: "dock", region: "Mediterranean", difficulty: "Easy", typicalTimeInPortRange: "7–9 hours",
    terminalReality: ["Port is adjacent to the old core, reducing transfer stress.", "Pedestrian flow in palace passages can bottleneck mid-morning.", "Riva promenade is simple and intuitive for first-time visitors.", "Taxi use is mostly optional unless heading uphill.", "Embark lane near terminal becomes busy late day.", "Ferry traffic can add crowd pulses around waterfront."],
    cityAnchors: ["Diocletian's Palace lanes", "Riva waterfront", "Peristyle square", "Marjan lower trails", "Bacvice beach edge", "Green Market", "Split viewpoint stairs", "Old Port"],
    timingFriction: ["palace crowd pockets", "stair sections to viewpoints", "market browsing drift", "beach detour temptation", "late waterfront density", "ferry crossing foot traffic"],
    returnSafeRules: ["Stay compact; this port rewards depth over distance.", "Use one optional outer hop only if ahead of schedule.", "Leave viewpoint climbs for early cooler hours.", "Keep your final hour near Riva or terminal zone.", "Skip second beach leg if pace drops.", "Treat old-town maze time as elastic."],
    failureScenarios: ["Palace passages jam with tour groups.", "Viewpoint climb takes longer than expected.", "Beach stop stretches due to queue for facilities.", "Lunch in core requires a long wait.", "Market purchases slow movement back to ship.", "Heat spike reduces stamina on stone streets."],
    scamPatterns: ["menu substitution issues", "short taxi fare disputes", "street vendor pressure", "currency conversion confusion"],
    accessibilityNotes: ["Riva is relatively smooth", "palace stones can be uneven", "viewpoint routes include steps", "many cafés provide easy seated breaks", "short distances help energy management"],
    quickPlanOptions: ["Palace + Riva quick circuit", "Riva + market + gelato loop", "Single Marjan lower-trail outing"],
    recommendedLoops: ["First timer: Peristyle → palace lanes → waterfront", "Culture: palace details + market", "Easy walking: Riva-focused lounge day", "Scenic: Marjan lower views and back"],
    internalLinks: ["/blog/dubrovnik", "/blog/marseille", "/blog/barcelona", "/blog/naples", "/planner", "/blog/villefranche-nice"],
    published: true,
  },
];

const drafts: PortProfile[] = [
  "stockholm","oslo","cozumel","kotor","istanbul","palma-de-mallorca","valletta","corfu","kefalonia","katakolon","st-thomas","san-juan","casablanca"
].map((slug) => ({
  slug,
  cityName: slug.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join(" "),
  country: "TBD",
  portType: "dock" as PortType,
  region: "Northern Europe" as const,
  difficulty: "Moderate" as const,
  typicalTimeInPortRange: "7–9 hours" as const,
  terminalReality: ["Draft profile pending full editorial expansion."],
  cityAnchors: ["Draft anchor"],
  timingFriction: ["Draft friction note"],
  returnSafeRules: ["Draft return rule"],
  failureScenarios: ["Draft failure scenario"],
  scamPatterns: ["Draft scam note"],
  accessibilityNotes: ["Draft accessibility note"],
  quickPlanOptions: ["Draft quick loop"],
  recommendedLoops: ["Draft recommended loop"],
  internalLinks: ["/planner"],
  published: false,
}));

export const portProfiles: Record<string, PortProfile> = Object.fromEntries([...detailed, ...drafts].map((port) => [port.slug, port]));
export const publishedPorts = Object.values(portProfiles).filter((port) => port.published);
export const draftPorts = Object.values(portProfiles).filter((port) => !port.published);
export const renderablePortSlugs = publishedPorts.map((port) => port.slug);
export const upcomingPortSlugs = draftPorts.map((port) => port.slug);
