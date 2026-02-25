import type { FeatureGateKey, FeatureTier } from "@/app/lib/planner/types";

const matrix: Record<FeatureTier, FeatureGateKey[]> = {
  free: ["simulation"],
  "trip-pass": ["fullCruiseMode", "generateAll", "simulation", "exportBundle", "offlinePack"],
  pro: ["fullCruiseMode", "generateAll", "simulation", "exportBundle", "offlinePack"],
};

export const hasFeature = (tier: FeatureTier, feature: FeatureGateKey) => matrix[tier].includes(feature);

export const gateMessage = (feature: FeatureGateKey) => {
  const messages: Record<FeatureGateKey, string> = {
    fullCruiseMode: "Full Cruise mode is included in Trip Pass and Pro.",
    generateAll: "Generate All is available in Trip Pass and Pro.",
    exportBundle: "PDF bundle export is available in Trip Pass and Pro.",
    simulation: "Advanced simulation is available in all tiers.",
    offlinePack: "Offline pack is available in Trip Pass and Pro.",
  };
  return messages[feature];
};
