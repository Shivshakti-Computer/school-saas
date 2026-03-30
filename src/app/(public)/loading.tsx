// FILE: src/app/(public)/loading.tsx

export default function PublicLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        {/* Animated Logo */}
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-brand animate-bounce-slow">
            <span className="text-white font-extrabold text-lg tracking-tight">VF</span>
          </div>

          {/* Ripple effect */}
          <div className="absolute inset-0 rounded-2xl bg-brand-500/20 animate-ping" />
        </div>

        {/* Loading text */}
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-sm font-medium text-slate-600">Loading...</p>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  )
}