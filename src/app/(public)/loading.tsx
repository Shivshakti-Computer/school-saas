// FILE: src/app/(public)/loading.tsx

export default function PublicLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[var(--surface-0)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand to-purple-500 flex items-center justify-center shadow-lg shadow-brand/20 animate-pulse">
          <span className="text-white font-extrabold text-sm">VF</span>
        </div>
        <p className="text-sm text-slate-500">Loading page...</p>
      </div>
    </div>
  )
}