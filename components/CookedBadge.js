// Small glowing badge marking a recipe the user has already cooked —
// gradient-accent circle with a soft blurred halo behind it, echoing the
// glow-accent treatment used on primary CTAs elsewhere in the app.
export default function CookedBadge({ className = "" }) {
  return (
    <span
      className={`relative inline-flex h-6 w-6 shrink-0 items-center justify-center ${className}`}
      title="You've cooked this"
    >
      <span aria-hidden className="absolute inset-0 rounded-full bg-accent/60 blur-[6px]" />
      <span className="gradient-accent glow-accent relative flex h-6 w-6 items-center justify-center rounded-full">
        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
          <path
            d="M5 12.5l4.5 4.5L19 7"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="sr-only">Cooked</span>
    </span>
  );
}
