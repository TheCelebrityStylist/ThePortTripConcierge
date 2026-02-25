import { alaskaPorts } from "./alaska";
import { asiaPorts } from "./asia";
import { caribbeanPorts } from "./caribbean";
import { europePorts } from "./europe";
import type { PortProfile } from "./types";

const all = [...europePorts, ...caribbeanPorts, ...alaskaPorts, ...asiaPorts];

export const portsByRegion = {
  Europe: europePorts,
  Caribbean: caribbeanPorts,
  Alaska: alaskaPorts,
  Asia: asiaPorts,
};

export const portsRegistry: Record<string, PortProfile> = Object.fromEntries(all.map((port) => [port.slug, port]));

export const popularPortSlugs = ["barcelona", "rome-civitavecchia", "santorini", "cozumel", "st-maarten", "juneau", "singapore"];
