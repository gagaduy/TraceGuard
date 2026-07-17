// SPDX-FileCopyrightText: 2026 TraceGuard contributors
// SPDX-License-Identifier: Apache-2.0

import { buttonVariants, cn } from "@traceguard/ui";

import { ProductLoop } from "@/components/product-loop";

const boundaries = [
  {
    owner: "Express API",
    responsibility: "Authorizes and persists every business-state transition.",
  },
  {
    owner: "Temporal",
    responsibility:
      "Coordinates long-running work without owning business truth.",
  },
  {
    owner: "Python compute",
    responsibility:
      "Returns versioned advice; never approves or executes recall.",
  },
] as const;

export default function Home() {
  return (
    <main>
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10"
      >
        <a
          href="#top"
          className="flex items-center gap-3 font-semibold text-white"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 font-mono text-sm text-cyan-200"
          >
            TG
          </span>
          TraceGuard
        </a>
        <div className="flex items-center gap-1">
          <a
            className={buttonVariants({ variant: "ghost", size: "compact" })}
            href="#architecture"
          >
            Architecture
          </a>
          <a
            className={buttonVariants({
              variant: "secondary",
              size: "compact",
            })}
            href="https://github.com/gagaduy/TraceGuard"
          >
            GitHub
          </a>
        </div>
      </nav>

      <section
        id="top"
        className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-14 lg:grid-cols-[1.3fr_0.7fr] lg:px-10 lg:pb-32 lg:pt-24"
      >
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/5 px-3 py-1.5 text-xs font-medium text-amber-100">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-amber-300"
            />
            Architecture foundation · not production ready
          </div>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.045em] text-balance text-white sm:text-6xl lg:text-7xl">
            Turn uncertain signals into accountable action.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            TraceGuard is open-source TrustOps for evidence-backed,
            policy-checked, human-approved recall resilience—from first concern
            to verified recovery.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              className={buttonVariants({ variant: "primary" })}
              href="#product-loop"
            >
              Explore the product loop
            </a>
            <a
              className={buttonVariants({ variant: "secondary" })}
              href="https://github.com/gagaduy/TraceGuard/blob/main/CONTRIBUTING.md"
            >
              Read contributing guide
            </a>
          </div>
        </div>

        <aside className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur sm:p-8">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-16 size-40 rounded-full bg-cyan-300/10 blur-3xl"
          />
          <p className="font-mono text-xs tracking-[0.2em] text-slate-500 uppercase">
            Non-negotiable trust boundary
          </p>
          <p className="mt-5 text-2xl font-medium leading-9 text-white">
            AI may analyze and propose. It may not approve, issue, expand, or
            cancel a recall.
          </p>
          <div className="mt-8 border-t border-white/10 pt-6">
            <dl className="grid grid-cols-2 gap-5 text-sm">
              <div>
                <dt className="text-slate-500">Business truth</dt>
                <dd className="mt-1 font-medium text-slate-100">PostgreSQL</dd>
              </div>
              <div>
                <dt className="text-slate-500">Accountability</dt>
                <dd className="mt-1 font-medium text-slate-100">
                  Authorized human
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Execution</dt>
                <dd className="mt-1 font-medium text-slate-100">
                  Durable workflow
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Traceability</dt>
                <dd className="mt-1 font-medium text-slate-100">
                  Append-only audit
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </section>

      <section
        id="product-loop"
        className="border-y border-white/10 bg-black/10"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
          <div className="mb-10 max-w-2xl">
            <p className="font-mono text-xs tracking-[0.2em] text-cyan-300 uppercase">
              Closed-loop resilience
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Evidence stays connected from detection to learning.
            </h2>
          </div>
          <ProductLoop />
        </div>
      </section>

      <section
        id="architecture"
        className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28"
      >
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] text-cyan-300 uppercase">
              Clear ownership
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              One public backend. No hidden decision path.
            </h2>
            <p className="mt-5 leading-7 text-slate-400">
              The web application supports decisions without becoming a second
              business backend. Every consequential transition returns to
              deterministic policy, current authority, and an auditable reason.
            </p>
          </div>
          <div className="divide-y divide-white/10 rounded-3xl border border-white/10 bg-white/[0.025] px-6 sm:px-8">
            {boundaries.map(({ owner, responsibility }) => (
              <div
                key={owner}
                className="grid gap-2 py-7 sm:grid-cols-[10rem_1fr]"
              >
                <h3 className="font-semibold text-white">{owner}</h3>
                <p className="leading-7 text-slate-400">{responsibility}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p>Apache-2.0 · Built for accountable recall resilience.</p>
          <a
            className={cn(
              "text-slate-400 underline-offset-4 hover:text-white hover:underline",
            )}
            href="https://github.com/gagaduy/TraceGuard/security"
          >
            Report security issues privately
          </a>
        </div>
      </footer>
    </main>
  );
}
