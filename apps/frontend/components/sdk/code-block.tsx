"use client";

import { useState } from "react";

export function CodeBlock({ code, title }: { code: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="overflow-hidden border border-black bg-black">
      <div className="flex items-center justify-between border-b border-white/20 px-4 py-3">
        <span className="label-caps text-white/60">{title ?? "Code"}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="label-caps text-white/80 hover:text-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-5 text-xs leading-relaxed text-[var(--bg)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
