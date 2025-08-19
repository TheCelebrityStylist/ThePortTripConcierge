"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import clsx from "clsx";

/**
 * Light, safe normalization so the UI looks clean without altering meaning.
 * - Collapse 3+ blank lines → 1
 * - Trim stray bullet-only lines
 */
function normalize(md: string) {
  if (!md) return "";
  let t = md
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s*[-•]\s*$/gm, "");
  return t.trim();
}

type Props = {
  role: "user" | "assistant" | "system";
  content: string;
  compact?: boolean; // you can pass compact for smaller spacing if you like
};

export default function ChatMessage({ role, content, compact }: Props) {
  const isUser = role === "user";
  const isAssistant = role === "assistant";

  return (
    <div
      className={clsx(
        "w-full",
        isUser ? "justify-end flex" : "justify-start flex"
      )}
    >
      {/* Bubble */}
      <div
        className={clsx(
          "relative max-w-[820px] rounded-2xl border backdrop-blur",
          "shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
          isUser
            ? "bg-gradient-to-br from-[#2a3341] to-[#1a2030] border-white/10 text-white"
            : "bg-white/6 border-white/10 text-white/95",
          compact ? "px-4 py-3" : "px-5 py-4"
        )}
      >
        {/* Avatar + label */}
        <div className="mb-3 flex items-center gap-2 text-[13px] text-white/70">
          <div
            className={clsx(
              "grid h-7 w-7 place-items-center rounded-full font-semibold",
              isUser ? "bg-blue-500/80" : "bg-indigo-500/80"
            )}
          >
            {isUser ? "You" : "PT"}
          </div>
          <span className="uppercase tracking-wide">
            {isUser ? "You" : "PortTrip Concierge"}
          </span>
        </div>

        {/* Markdown body */}
        <div className="message-markdown text-[15.5px] leading-[1.55] text-white/95">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            // NOTE: allow only standard markdown; no HTML injection
            disallowedElements={["script", "style"]}
            skipHtml
          >
            {normalize(content)}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

