// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

const stages = [
  [
    "01",
    "Weak signal",
    "Capture uncertain risk without presenting it as fact.",
  ],
  [
    "02",
    "Evidence graph",
    "Connect claims, products, batches, sources, and decisions.",
  ],
  [
    "03",
    "Recall options",
    "Compare coverage, missed risk, over-recall, time, and cost.",
  ],
  [
    "04",
    "Human approval",
    "Apply deterministic policy and accountable authorization.",
  ],
  [
    "05",
    "Durable execution",
    "Coordinate idempotent action through failure and retry.",
  ],
  [
    "06",
    "Recovery & CAPA",
    "Measure restored trust and verify preventive effectiveness.",
  ],
] as const;

export function ProductLoop() {
  return (
    <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {stages.map(([number, title, description]) => (
        <li
          key={number}
          className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-cyan-300/30 hover:bg-white/[0.055]"
        >
          <div className="mb-5 flex items-center justify-between">
            <span className="font-mono text-xs tracking-[0.2em] text-cyan-300">
              {number}
            </span>
            <span aria-hidden="true" className="h-px w-12 bg-white/15" />
          </div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        </li>
      ))}
    </ol>
  );
}
