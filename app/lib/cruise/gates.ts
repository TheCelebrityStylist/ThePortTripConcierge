import type { FeatureGateKey, FeatureTier } from "@/app/lib/planner/types";

type Entitlements = {
  tier: FeatureTier;
  flags: Record<FeatureGateKey, boolean>;
  bypassEnabled: boolean;
};

const featureMatrix: Record<FeatureTier, Record<FeatureGateKey, boolean>> = {
  free: {
    fullCruiseMode: true,
    generateAll: false,
    exportBundle: false,
    simulation: false,
    offlinePack: false,
  },
  "trip-pass": {
    fullCruiseMode: true,
    generateAll: true,
    exportBundle: true,
    simulation: false,
    offlinePack: false,
  },
  pro: {
    fullCruiseMode: true,
    generateAll: true,
    exportBundle: true,
    simulation: true,
    offlinePack: true,
  },
};

const envBypassEnabled = () => process.env.NEXT_PUBLIC_PRO_BYPASS?.toLowerCase() === "true";
const devUnlockEnabled = () => process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_UNLOCK?.toLowerCase() === "true";

const queryBypassEnabled = (search?: string) => {
  const params = new URLSearchParams(search ?? "");
  const value = params.get("pro")?.toLowerCase();
  return value === "1" || value === "true";
};

export function getEntitlements(baseTier: FeatureTier, search?: string): Entitlements {
  const bypassEnabled = envBypassEnabled() || queryBypassEnabled(search) || devUnlockEnabled();
  const tier: FeatureTier = bypassEnabled ? "pro" : baseTier;
  return {
    tier,
    bypassEnabled,
    flags: featureMatrix[tier],
  };
}

export const hasFeature = (entitlements: Entitlements, feature: FeatureGateKey) => entitlements.flags[feature];

export const gateMessage = (feature: FeatureGateKey) => {
  const messages: Record<FeatureGateKey, string> = {
    fullCruiseMode: "Full Cruise mode is available to all users.",
    generateAll: "Generate All is unlocked with Trip Pass or Pro.",
    exportBundle: "Export bundle is unlocked with Trip Pass or Pro.",
    simulation: "Cruise simulation is unlocked with Pro.",
    offlinePack: "Offline pack is unlocked with Pro.",
  };
  return messages[feature];
};

export type { Entitlements };
