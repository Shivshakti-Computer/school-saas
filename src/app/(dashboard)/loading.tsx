// FILE: src/app/(dashboard)/loading.tsx

export default function Loading() {
  return (
    <div
      className="flex-1 p-4 md:p-6"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <LoadingSkeleton />
    </div>
  )
}

// ─── Reusable skeleton component ───
// Alag file mein bhi export kar sakte ho
function LoadingSkeleton() {
  return (
    <div
      style={{
        animation: 'portalContentIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
      }}
    >
      {/* ── Page Header ── */}
      <div className="portal-page-header">
        <div>
          {/* Breadcrumb skeleton */}
          <div
            className="skeleton skeleton-text mb-3"
            style={{ width: '8rem', height: '0.75rem' }}
          />
          {/* Title skeleton */}
          <div
            className="skeleton skeleton-title"
            style={{ width: '14rem', height: '1.375rem' }}
          />
          {/* Subtitle skeleton */}
          <div
            className="skeleton skeleton-text"
            style={{ width: '20rem', height: '0.8125rem' }}
          />
        </div>
        {/* Header action button skeleton */}
        <div
          className="skeleton"
          style={{ width: '8rem', height: '2.25rem', borderRadius: 'var(--radius-md)' }}
        />
      </div>

      {/* ── Stat Cards Row ── */}
      <div
        className="grid gap-4 mb-6"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
        }}
      >
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} delay={i * 60} />
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))' }}
      >
        {/* Table card */}
        <div className="portal-card" style={{ gridColumn: 'span 1' }}>
          <TableCardSkeleton />
        </div>

        {/* Side card */}
        <div className="portal-card" style={{ maxWidth: '100%' }}>
          <SideCardSkeleton />
        </div>
      </div>
    </div>
  )
}

// ── Stat card skeleton ──
function StatCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="portal-stat-card"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Label */}
          <div
            className="skeleton skeleton-text mb-3"
            style={{ width: '60%', height: '0.75rem' }}
          />
          {/* Value */}
          <div
            className="skeleton"
            style={{ width: '45%', height: '1.875rem', borderRadius: 'var(--radius-md)' }}
          />
          {/* Change pill */}
          <div
            className="skeleton skeleton-text mt-2"
            style={{ width: '40%', height: '0.75rem' }}
          />
        </div>
        {/* Icon box */}
        <div
          className="skeleton stat-icon"
          style={{ flexShrink: 0 }}
        />
      </div>
    </div>
  )
}

// ── Table card skeleton ──
function TableCardSkeleton() {
  return (
    <>
      {/* Header */}
      <div className="portal-card-header">
        <div>
          <div
            className="skeleton"
            style={{ width: '9rem', height: '0.9375rem', borderRadius: 'var(--radius-full)' }}
          />
          <div
            className="skeleton mt-1.5"
            style={{ width: '14rem', height: '0.75rem', borderRadius: 'var(--radius-full)' }}
          />
        </div>
        <div
          className="skeleton"
          style={{ width: '6rem', height: '2rem', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
        />
      </div>

      {/* Table head */}
      <div
        className="flex items-center gap-3 px-5 py-3"
        style={{
          background: 'var(--bg-muted)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {[30, 22, 20, 15].map((w, i) => (
          <div
            key={i}
            className="skeleton"
            style={{
              width: `${w}%`,
              height: '0.6875rem',
              borderRadius: 'var(--radius-full)',
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Table rows */}
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {[...Array(5)].map((_, i) => (
          <TableRowSkeleton key={i} delay={i * 50} />
        ))}
      </div>
    </>
  )
}

// ── Single table row skeleton ──
function TableRowSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5"
      style={{
        borderColor: 'var(--border)',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Avatar */}
      <div
        className="skeleton skeleton-avatar"
        style={{ width: '2rem', height: '2rem', flexShrink: 0 }}
      />
      {/* Name + sub */}
      <div className="flex-1 min-w-0">
        <div
          className="skeleton skeleton-text"
          style={{ width: '55%', height: '0.8125rem' }}
        />
        <div
          className="skeleton skeleton-text"
          style={{ width: '35%', height: '0.6875rem' }}
        />
      </div>
      {/* Badge */}
      <div
        className="skeleton"
        style={{
          width: '4rem',
          height: '1.375rem',
          borderRadius: 'var(--radius-full)',
          flexShrink: 0,
        }}
      />
      {/* Action */}
      <div
        className="skeleton"
        style={{
          width: '1.75rem',
          height: '1.75rem',
          borderRadius: 'var(--radius-sm)',
          flexShrink: 0,
        }}
      />
    </div>
  )
}

// ── Side card skeleton ──
function SideCardSkeleton() {
  return (
    <>
      {/* Header */}
      <div className="portal-card-header">
        <div
          className="skeleton"
          style={{ width: '8rem', height: '0.9375rem', borderRadius: 'var(--radius-full)' }}
        />
        <div
          className="skeleton"
          style={{ width: '5rem', height: '1.75rem', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
        />
      </div>

      {/* Items */}
      <div className="portal-card-body">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <SideItemSkeleton key={i} delay={i * 60} />
          ))}
        </div>

        {/* Footer link */}
        <div
          className="skeleton mt-5"
          style={{
            width: '7rem',
            height: '0.75rem',
            borderRadius: 'var(--radius-full)',
            margin: '1.25rem auto 0',
          }}
        />
      </div>
    </>
  )
}

// ── Side item skeleton ──
function SideItemSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Icon */}
      <div
        className="skeleton"
        style={{
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: 'var(--radius-md)',
          flexShrink: 0,
        }}
      />
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className="skeleton skeleton-text"
          style={{ width: '65%', height: '0.8125rem' }}
        />
        <div
          className="skeleton skeleton-text"
          style={{ width: '45%', height: '0.6875rem' }}
        />
      </div>
      {/* Trailing value */}
      <div
        className="skeleton"
        style={{
          width: '2.5rem',
          height: '1.25rem',
          borderRadius: 'var(--radius-sm)',
          flexShrink: 0,
        }}
      />
    </div>
  )
}