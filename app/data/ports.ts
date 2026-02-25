import { portsRegistry as sourceRegistry } from "@/app/lib/ports";
import type { PortProfile } from "@/app/lib/ports/types";

export const portsRegistry: Record<string, PortProfile> = sourceRegistry;

export const plannerPorts = Object.fromEntries(
  Object.values(portsRegistry).map((port) => [
    port.slug,
    {
      portSlug: port.slug,
      dockType: port.dockingModeDefault,
      typicalTransferToCity: port.transportProfiles.find((transport) => transport.mode === "taxi")?.timeMin[0] ?? 20,
      peakTrafficWindows: port.peakTrafficWindows,
      reliabilityRanking: port.transportProfiles
        .filter((transport) => ["walk", "taxi", "metro", "bus"].includes(transport.mode))
        .sort((a, b) => a.reliability - b.reliability)
        .map((transport) => transport.mode) as Array<"walk" | "taxi" | "metro" | "bus">,
      recommendedClusters: port.attractionClusters.slice(0, 8).map((cluster) => ({
        name: cluster.name,
        minutes: cluster.typicalDuration[0],
        walkingIntensity: cluster.distanceFromPortKm > 2.8 ? "high" : cluster.distanceFromPortKm > 1.6 ? "moderate" : "low",
      })),
    },
  ])
) as Record<string, {
  portSlug: string;
  dockType: "dock" | "tender";
  typicalTransferToCity: number;
  peakTrafficWindows: string[];
  reliabilityRanking: Array<"walk" | "taxi" | "metro" | "bus">;
  recommendedClusters: Array<{ name: string; minutes: number; walkingIntensity: "low" | "moderate" | "high" }>;
}>;
