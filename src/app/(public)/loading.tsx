export default function PublicLoading() {
  return (
    <div
      className="min-h-[70vh] flex items-center justify-center"
      style={{ background: 'var(--bg-base)' }}
      role="status"
      aria-label="Loading Skolify"
    >
      <div className="flex flex-col items-center gap-8">

        {/* ── Logo Mark ── */}
        <div className="relative">

          {/* Outer glow ring — slow pulse */}
          <div
            className="absolute inset-0 rounded-2xl animate-ping"
            style={{
              background: 'rgba(99, 102, 241, 0.15)',
              animationDuration: '2.2s',
            }}
          />

          {/* Rotating border ring */}
          <div
            className="absolute inset-[-6px] rounded-[22px] animate-spin"
            style={{
              background: `conic-gradient(
                from 0deg,
                transparent 0%,
                rgba(99,102,241,0.5) 50%,
                transparent 100%
              )`,
              animationDuration: '2.5s',
            }}
          />

          {/* Inner mask to make ring look clean */}
          <div
            className="absolute inset-[-3px] rounded-[20px]"
            style={{ background: 'var(--bg-base)' }}
          />

          {/* Main icon box */}
          <div
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.35)',
            }}
          >
            {/* Shimmer sweep */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.8s ease-in-out infinite',
              }}
            />

            {/* Skolify S mark */}
            <svg
              className="relative z-10 w-8 h-8"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
            >
              {/* Graduation cap simplified icon */}
              <path
                d="M16 4L4 10l12 6 12-6-12-6z"
                fill="white"
                fillOpacity="0.95"
              />
              <path
                d="M8 13.5v6c0 2.5 3.5 4.5 8 4.5s8-2 8-4.5v-6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                fillOpacity="0.7"
              />
              <circle cx="28" cy="10" r="1.5" fill="white" fillOpacity="0.8" />
              <line
                x1="28" y1="11.5"
                x2="28" y2="18"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                fillOpacity="0.7"
              />
            </svg>
          </div>
        </div>

        {/* ── Text ── */}
        <div className="flex flex-col items-center gap-2 text-center">

          {/* Brand name */}
          <p
            className="font-display font-bold text-lg tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Skolify
          </p>

          {/* Subtitle */}
          <p
            className="text-sm font-body"
            style={{ color: 'var(--text-muted)' }}
          >
            Preparing your experience...
          </p>

          {/* Animated dots */}
          <div className="flex items-center gap-1.5 mt-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="rounded-full animate-bounce"
                style={{
                  width:            '7px',
                  height:           '7px',
                  animationDuration: '1.2s',
                  animationDelay:   `${i * 180}ms`,
                  background:       i === 1
                    ? 'var(--accent-400)'
                    : 'var(--primary-400)',
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Skeleton content preview ── */}
        <div
          className="w-64 flex flex-col gap-3 mt-2"
          aria-hidden="true"
        >
          {/* Skeleton bar 1 — wide */}
          <div
            className="skeleton h-3 rounded-full"
            style={{ width: '100%' }}
          />
          {/* Skeleton bar 2 — medium */}
          <div
            className="skeleton h-3 rounded-full"
            style={{ width: '75%' }}
          />
          {/* Skeleton bar 3 — narrow */}
          <div
            className="skeleton h-3 rounded-full"
            style={{ width: '55%' }}
          />
        </div>

      </div>
    </div>
  )
}