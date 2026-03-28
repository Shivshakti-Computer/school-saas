import { Container } from '@/components/marketing/Container'
import { SectionTitle } from '@/components/marketing/MiniUI'
import { MODULE_REGISTRY } from '@/lib/moduleRegistry'

export const metadata = {
  title: 'Modules',
  description: 'See all VidyaFlow modules — plan-based access, multi-tenant isolation, 20+ school management tools.',
}

export default function ModulesPage() {
    const modules = Object.entries(MODULE_REGISTRY)
        .filter(([, m]) => m.roles.includes('admin'))
        .map(([k, m]) => ({ key: k, ...m }))

    return (
        <div className="py-12">
            <Container>
                <SectionTitle
                    eyebrow="Modules"
                    title="Turn on only what your school needs"
                    subtitle="Plans unlock modules. Your school data remains isolated per tenant."
                />

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modules.map(m => (
                        <div key={m.key} className="bg-white border border-slate-200 rounded-2xl p-5">
                            <div className="text-sm font-extrabold text-slate-900">{m.label}</div>
                            <p className="mt-1 text-sm text-slate-600">{m.description}</p>
                            <div className="mt-3 text-xs text-slate-500">
                                Available in plans: <span className="font-semibold">{m.plans.join(', ')}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </Container>
        </div>
    )
}