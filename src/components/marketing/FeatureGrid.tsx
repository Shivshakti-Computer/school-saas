import { Container } from './Container'
import { SectionTitle } from './MiniUI'
import { BarChart2, CreditCard, Globe, Bell, CheckSquare, BookOpen, Users, Shield } from 'lucide-react'

const features = [
    { icon: Users, title: 'Student & Staff Management', desc: 'Admissions, profiles, ID cards, staff records and permissions.' },
    { icon: CheckSquare, title: 'Attendance', desc: 'Daily attendance with reports and parent notifications.' },
    { icon: CreditCard, title: 'Fees (Plan-based)', desc: 'Fee structures, online payments, receipts and reminders.' },
    { icon: BookOpen, title: 'Exams & Results', desc: 'Schedule exams, enter marks, publish results to student/parent portal.' },
    { icon: Bell, title: 'Notices & Circulars', desc: 'Publish notices, keep parents and students informed.' },
    { icon: Globe, title: 'School Website Builder', desc: 'Professional templates, editable content, gallery and contact forms.' },
    { icon: BarChart2, title: 'Reports', desc: 'Class-wise analytics, exports, attendance and fee reports.' },
    { icon: Shield, title: 'Security & Access Control', desc: 'Role-based access, plan-based module locks, tenant isolation.' },
]

export function FeatureGrid() {
    return (
        <div className="py-14">
            <Container>
                <SectionTitle
                    eyebrow="Features"
                    title="Everything schools need, built as one connected system"
                    subtitle="No more multiple apps. One login, one subscription, and a clean experience for admin, teachers, parents, and students."
                />

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {features.map((f) => (
                        <div key={f.title} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700">
                                <f.icon size={18} />
                            </div>
                            <h3 className="mt-3 text-sm font-extrabold text-slate-900">{f.title}</h3>
                            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </Container>
        </div>
    )
}