'use client'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

export default function SettingsPage() {
  const [action, setAction] = useState('')

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Platform Information</h3>
          <div className="space-y-3 text-sm">
            {[
              ['Platform', 'VidyaFlow'],
              ['Version', '1.0.0'],
              ['Company', 'Shivshakti Computer Academy'],
              ['Location', 'Ambikapur, Chhattisgarh'],
              ['Runtime', 'Next.js + MongoDB'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-800 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Account */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Account</h3>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Superadmin credentials are managed via environment variables.
              To change login credentials, update <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">SUPERADMIN_EMAIL</code> and <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">SUPERADMIN_PASSWORD</code> in your .env file.
            </p>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-xl hover:bg-red-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Environment */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Environment Variables Checklist</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              'NEXTAUTH_SECRET',
              'NEXTAUTH_URL',
              'MONGODB_URI',
              'SUPERADMIN_EMAIL',
              'SUPERADMIN_PASSWORD',
              'NEXT_PUBLIC_APP_URL',
              'RAZORPAY_KEY_ID',
              'RAZORPAY_KEY_SECRET',
            ].map(env => (
              <div key={env} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <code className="text-xs text-slate-700">{env}</code>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Note: This only shows variable names, not values. Check your .env file for actual values.
          </p>
        </div>
      </div>
    </div>
  )
}