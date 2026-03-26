import { createPortDayFromPort } from "@/app/lib/planner/engine";
import type { PortDay } from "@/app/lib/planner/types";
import { portIndex } from "@/app/data/ports";

const linePattern = /^(?<date>[A-Za-z]{3,9}\s+\d{1,2}|\d{4}-\d{2}-\d{2})\s+(?<port>.+?)\s+(?<arrival>\d{1,2}:\d{2})-(?<aboard>\d{1,2}:\d{2})$/;

const normalizeDate = (raw: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const withYear = `${raw} ${new Date().getFullYear()}`;
  const parsed = new Date(withYear);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
};

export const parseItineraryText = (text: string): PortDay[] => {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<PortDay[]>((acc, line) => {
      const match = line.match(linePattern);
      if (!match?.groups) return acc;

      const date = normalizeDate(match.groups.date);
      const candidate = match.groups.port.toLowerCase();
      const mapped = portIndex.find((port) => candidate.includes(port.name.toLowerCase()) || port.aliases.some((alias) => candidate.includes(alias.toLowerCase())));
      const portSlug = mapped?.id ?? "barcelona";
      const day = createPortDayFromPort(portSlug, date);

      acc.push({
        ...day,
        portName: mapped?.name ?? match.groups.port,
        arrivalTime: match.groups.arrival,
        onboardTime: match.groups.arrival,
        allAboardTime: match.groups.aboard,
      });

      return acc;
    }, []);
};
