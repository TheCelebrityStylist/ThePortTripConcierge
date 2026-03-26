import { randomUUID, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { legalContent } from "@/app/content/legal";

type DeleteAccountRequestRecord = {
  id: string;
  submittedAt: string;
  status: "pending";
  fullName: string;
  email: string;
  accountEmail: string;
  userId?: string;
  reason?: string;
  source: "web-form" | "api";
  requesterIpHash?: string;
  userAgent?: string;
};

const STORE_FILE = path.join(process.cwd(), "app", "data", "delete-account-requests.json");

const MAX = {
  fullName: 120,
  email: 160,
  accountEmail: 160,
  userId: 120,
  reason: 2000,
};

function normalize(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function readRecords(): Promise<DeleteAccountRequestRecord[]> {
  const raw = await readFile(STORE_FILE, "utf-8").catch(() => "[]");
  return JSON.parse(raw) as DeleteAccountRequestRecord[];
}

async function writeRecords(records: DeleteAccountRequestRecord[]) {
  await writeFile(STORE_FILE, JSON.stringify(records, null, 2), "utf-8");
}

function buildError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function hashIp(ip: string | null) {
  if (!ip) return undefined;
  return createHash("sha256").update(ip).digest("hex");
}

async function saveRequest(payload: {
  fullName: unknown;
  email: unknown;
  accountEmail: unknown;
  userId?: unknown;
  reason?: unknown;
  confirmation?: unknown;
  source: "web-form" | "api";
  request: NextRequest;
}): Promise<{ error: string } | { recordId: string }> {
  const fullName = normalize(payload.fullName);
  const email = normalize(payload.email).toLowerCase();
  const accountEmail = normalize(payload.accountEmail).toLowerCase();
  const userId = normalize(payload.userId);
  const reason = normalize(payload.reason);
  const confirmation = normalize(payload.confirmation).toLowerCase();

  if (!fullName || fullName.length > MAX.fullName) {
    return { error: "Please enter a valid full name." };
  }
  if (!email || email.length > MAX.email || !validEmail(email)) {
    return { error: "Please enter a valid contact email." };
  }
  if (!accountEmail || accountEmail.length > MAX.accountEmail || !validEmail(accountEmail)) {
    return { error: "Please enter a valid account email." };
  }
  if (userId.length > MAX.userId) {
    return { error: "User ID is too long." };
  }
  if (reason.length > MAX.reason) {
    return { error: "Reason is too long." };
  }
  if (confirmation !== "yes" && confirmation !== "true" && confirmation !== "on") {
    return { error: "Please confirm your deletion request." };
  }

  const record: DeleteAccountRequestRecord = {
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
    status: "pending",
    fullName,
    email,
    accountEmail,
    userId: userId || undefined,
    reason: reason || undefined,
    source: payload.source,
    requesterIpHash: hashIp(payload.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null),
    userAgent: payload.request.headers.get("user-agent")?.slice(0, 300),
  };

  const records = await readRecords();
  records.push(record);
  await writeRecords(records);

  console.info("delete-account-request:stored", {
    requestId: record.id,
    submittedAt: record.submittedAt,
    source: record.source,
  });

  return { recordId: record.id };
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as
      | {
          fullName?: string;
          email?: string;
          accountEmail?: string;
          userId?: string;
          reason?: string;
          confirmation?: string;
        }
      | null;

    if (!body) {
      return buildError("Invalid request body.");
    }

    const saved = await saveRequest({
      fullName: body.fullName,
      email: body.email,
      accountEmail: body.accountEmail,
      userId: body.userId,
      reason: body.reason,
      confirmation: body.confirmation,
      source: "api",
      request,
    });
    if ("error" in saved) {
      return buildError(saved.error);
    }

    return NextResponse.json({ ok: true, requestId: saved.recordId }, { status: 201 });
  }

  const formData = await request.formData();
  const saved = await saveRequest({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    accountEmail: formData.get("accountEmail"),
    userId: formData.get("userId"),
    reason: formData.get("reason"),
    confirmation: formData.get("confirmation"),
    source: "web-form",
    request,
  });

  if ("error" in saved) {
    const url = new URL("/delete-account", request.url);
    url.searchParams.set("status", "error");
    url.searchParams.set("message", saved.error);
    return NextResponse.redirect(url, { status: 303 });
  }

  const successUrl = new URL("/delete-account", request.url);
  successUrl.searchParams.set("status", "success");
  successUrl.searchParams.set(
    "message",
    `Request received. Reference: ${saved.recordId}. We will contact you at ${legalContent.privacyEmail}.`,
  );

  return NextResponse.redirect(successUrl, { status: 303 });
}
