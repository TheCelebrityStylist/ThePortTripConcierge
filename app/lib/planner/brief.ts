import { plannerPorts } from "@/app/data/ports";
import type { Brief, PlanMeta } from "./types";

const toMin = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

export function defaultBriefForPort(portSlug: string, allAboardTime = "16:30", riskTolerance: PlanMeta["riskTolerance"] = "med") {
  const port = plannerPorts[portSlug] ?? plannerPorts.barcelona;
  const buffer = port.recommendedBufferMin[riskTolerance];
  const callHours = port.typicalCallHoursRange[0];
  const disembark = toTime(Math.max(360, toMin(allAboardTime) - callHours * 60));

  const meta: PlanMeta = {
    portSlug,
    allAboardTime,
    disembarkTime: disembark,
    returnBufferMin: buffer,
    riskTolerance,
    pace: "balanced",
    budgetLevel: "med",
    mobility: "moderate",
    interests: ["Food", "Old Town"],
    generatedAt: new Date().toISOString(),
    adults: 2,
    hasKids: false,
    tenderDock: port.dockTypeDefault,
  };

  const brief: Brief = {
    mustDo: "",
    avoid: "",
    walkingLimitMin: 180,
    noStairs: false,
    avoidQueues: false,
    avoidTaxis: false,
    avoidBuses: false,
    planStyle: "mixed",
    foodAnchors: true,
    photoMoments: true,
    heatTolerance: "medium",
  };

  return { meta, brief };
}
