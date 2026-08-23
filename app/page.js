import Link from "next/link";

const STEPS = [
  { title: "Capture", desc: "Snap a photo of any dish." },
  { title: "Recognize", desc: "See the likely dish and ingredients." },
  { title: "Match", desc: "Get the closest real recipes, ranked." },
  { title: "Cook", desc: "Follow a step-by-step cooking mode." },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full opacity-40 blur-[100px]"
        style={{
          backgroundImage:
            "radial-gradient(closest-side, var(--accent), var(--accent-2), transparent)",
        }}
      />

      <div className="relative mx-auto flex max-w-md flex-col px-6 pt-8">
        <h1 className="font-display text-5xl font-normal leading-[1.1] tracking-tight">
          Snap it. Identify it.
          <br />
          <span className="gradient-text">Find the recipe.</span>
          <br />
          Cook it.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Photograph any dish and discover the closest recipe behind it —
          with confidence you can trust, not AI guesses dressed up as facts.
        </p>

        <Link
          href="/scan"
          className="gradient-accent glow-accent mt-9 flex items-center justify-center gap-2 rounded-2xl py-4 text-center text-base font-semibold text-white transition-transform active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <rect x="3.5" y="6.5" width="17" height="13" rx="2.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="2" />
          </svg>
          Scan a dish
        </Link>

        <ol className="mt-14 space-y-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-4 backdrop-blur-sm"
            >
              <span className="gradient-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-foreground">{step.title}</p>
                <p className="text-sm text-muted">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
